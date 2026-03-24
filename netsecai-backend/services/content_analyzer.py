import logging
import re
import httpx
from urllib.parse import urlparse, urljoin

from config import settings
from models import (
    ContentAnalyzeResponse, ContentFinding, RiskLevel
)
from services.detection_engine import risk_level_from_score

logger = logging.getLogger("netsecai.content_analyzer")

TIMEOUT = httpx.Timeout(settings.REQUEST_TIMEOUT)

# ── Regex patterns ──────────────────────────────────────────────────────────

# Suspicious JS patterns that may indicate XSS or malicious activity
XSS_PATTERNS = [
    re.compile(r"document\.cookie", re.I),
    re.compile(r"eval\s*\(", re.I),
    re.compile(r"window\.location\s*=", re.I),
    re.compile(r"document\.write\s*\(", re.I),
    re.compile(r"innerHTML\s*=", re.I),
    re.compile(r"fromCharCode\s*\(", re.I),
    re.compile(r"atob\s*\(", re.I),
    re.compile(r"unescape\s*\(", re.I),
    re.compile(r"<script[^>]*src=['\"]?https?://(?!trusted)", re.I),
]

# Hidden redirect mechanisms
REDIRECT_PATTERNS = [
    re.compile(r"window\.location\.href\s*=", re.I),
    re.compile(r"window\.location\.replace\s*\(", re.I),
    re.compile(r'<meta[^>]*http-equiv=["\']?refresh["\']?', re.I),
    re.compile(r'<meta[^>]*content=["\'][^"\']*url=', re.I),
]

# Phishing-related form fields
SENSITIVE_INPUT_NAMES = re.compile(
    r"(password|passwd|pass|pwd|card|cvv|ccv|ssn|social.?security|"
    r"credit|debit|account|routing|pin|otp|token|secret)",
    re.I,
)

# Suspicious external script domains
SUSPICIOUS_SCRIPT_DOMAINS = [
    "pastebin.com", "paste.ee", "hastebin.com", "transfer.sh",
    "bit.ly", "tinyurl.com", "t.co", "goo.gl",
]

# Obfuscation indicators
OBFUSCATION_PATTERNS = [
    re.compile(r"\\x[0-9a-f]{2}", re.I),
    re.compile(r"\\u[0-9a-f]{4}", re.I),
    re.compile(r"(?:[A-Za-z0-9+/]{60,}={0,2})"),  # long base64 strings
]


def _extract_title(html: str) -> str | None:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    return m.group(1).strip() if m else None


def _extract_forms(html: str) -> list[dict]:
    forms = []
    for form_match in re.finditer(r"<form([^>]*)>(.*?)</form>", html, re.I | re.S):
        attrs_str = form_match.group(1)
        body = form_match.group(2)

        action = re.search(r'action=["\']?([^"\'>\s]+)', attrs_str, re.I)
        method = re.search(r'method=["\']?([^"\'>\s]+)', attrs_str, re.I)

        inputs = []
        for inp in re.finditer(r"<input([^>]*)>", body, re.I):
            inp_attrs = inp.group(1)
            name = re.search(r'name=["\']?([^"\'>\s]+)', inp_attrs, re.I)
            type_ = re.search(r'type=["\']?([^"\'>\s]+)', inp_attrs, re.I)
            inputs.append({
                "name": name.group(1) if name else None,
                "type": type_.group(1) if type_ else "text",
            })

        forms.append({
            "action": action.group(1) if action else None,
            "method": (method.group(1) if method else "GET").upper(),
            "inputs": inputs,
        })
    return forms


def _extract_scripts(html: str, base_url: str) -> list[str]:
    srcs = []
    for m in re.finditer(r'<script[^>]+src=["\']?([^"\'>\s]+)', html, re.I):
        src = m.group(1)
        if src.startswith("//"):
            src = "https:" + src
        elif src.startswith("/"):
            src = urljoin(base_url, src)
        srcs.append(src)
    return srcs


def _detect_findings(
    html: str,
    url: str,
    forms: list[dict],
    external_scripts: list[str],
    redirects: list[str],
    status_code: int,
) -> list[ContentFinding]:
    findings: list[ContentFinding] = []
    parsed_base = urlparse(url)
    base_domain = parsed_base.netloc

    # 1. Phishing form detection
    for form in forms:
        action = form.get("action") or ""
        sensitive_inputs = [
            inp for inp in form.get("inputs", [])
            if inp.get("name") and SENSITIVE_INPUT_NAMES.search(inp["name"])
        ]
        password_inputs = [i for i in form.get("inputs", []) if i.get("type") == "password"]

        # Form posts to external domain
        if action and action.startswith("http"):
            form_domain = urlparse(action).netloc
            if form_domain and form_domain != base_domain:
                findings.append(ContentFinding(
                    type="phishing_form",
                    severity=RiskLevel.CRITICAL,
                    description=f"Form submits credentials to external domain: {form_domain}",
                    evidence=f"action={action}",
                ))

        if sensitive_inputs or password_inputs:
            # Check if page is NOT HTTPS
            if parsed_base.scheme != "https":
                findings.append(ContentFinding(
                    type="insecure_credential_form",
                    severity=RiskLevel.HIGH,
                    description="Form collects sensitive data over plain HTTP",
                    evidence=f"inputs: {[i['name'] for i in sensitive_inputs]}",
                ))

    # 2. XSS pattern detection
    for pattern in XSS_PATTERNS:
        for m in pattern.finditer(html):
            line_no = html[:m.start()].count("\n") + 1
            findings.append(ContentFinding(
                type="possible_xss",
                severity=RiskLevel.HIGH,
                description=f"Suspicious JavaScript pattern: {pattern.pattern}",
                evidence=html[max(0, m.start() - 30): m.end() + 30].strip(),
                line=line_no,
            ))
            break  # one finding per pattern type is sufficient

    # 3. Hidden redirect detection
    for pattern in REDIRECT_PATTERNS:
        for m in pattern.finditer(html):
            findings.append(ContentFinding(
                type="hidden_redirect",
                severity=RiskLevel.MEDIUM,
                description=f"Redirect mechanism detected: {pattern.pattern}",
                evidence=html[max(0, m.start()): m.start() + 100].strip(),
            ))
            break

    # 4. Suspicious external scripts
    for src in external_scripts:
        src_domain = urlparse(src).netloc
        if any(sus in src_domain for sus in SUSPICIOUS_SCRIPT_DOMAINS):
            findings.append(ContentFinding(
                type="suspicious_external_script",
                severity=RiskLevel.HIGH,
                description=f"Script loaded from suspicious domain: {src_domain}",
                evidence=src,
            ))

    # 5. Obfuscation detection
    obfuscated_count = sum(
        len(p.findall(html)) for p in OBFUSCATION_PATTERNS
    )
    if obfuscated_count > 10:
        findings.append(ContentFinding(
            type="code_obfuscation",
            severity=RiskLevel.HIGH,
            description=f"Heavy code obfuscation detected ({obfuscated_count} obfuscated tokens)",
            evidence=f"Obfuscated token count: {obfuscated_count}",
        ))

    # 6. iFrame injection
    iframes = re.findall(r"<iframe[^>]+src=['\"]?([^'\">\s]+)", html, re.I)
    for iframe_src in iframes:
        iframe_domain = urlparse(iframe_src).netloc if "://" in iframe_src else None
        if iframe_domain and iframe_domain != base_domain:
            findings.append(ContentFinding(
                type="suspicious_iframe",
                severity=RiskLevel.MEDIUM,
                description=f"Hidden or cross-origin iframe from {iframe_domain}",
                evidence=iframe_src,
            ))

    return findings


def _score_findings(findings: list[ContentFinding]) -> int:
    weights = {
        RiskLevel.CRITICAL: 35,
        RiskLevel.HIGH: 20,
        RiskLevel.MEDIUM: 10,
        RiskLevel.LOW: 3,
    }
    return min(sum(weights.get(f.severity, 0) for f in findings), 100)


async def analyze_content(url: str) -> ContentAnalyzeResponse:
    logger.info("Content analysis for: %s", url)

    if "://" not in url:
        url = f"https://{url}"

    async with httpx.AsyncClient(follow_redirects=True, timeout=TIMEOUT) as client:
        try:
            resp = await client.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 (NetSecAI Scanner/1.0)"},
            )
            status_code = resp.status_code
            html = resp.text
            content_length = len(resp.content)
            # Track redirect chain
            redirects = [str(r.url) for r in resp.history]
        except httpx.RequestError as exc:
            raise RuntimeError(f"Failed to fetch URL: {exc}") from exc

    title = _extract_title(html)
    forms = _extract_forms(html)
    external_scripts = _extract_scripts(html, url)
    findings = _detect_findings(html, url, forms, external_scripts, [], status_code)
    risk_score = _score_findings(findings)

    logger.info(
        "Content analysis done: %d findings, risk=%d, forms=%d",
        len(findings), risk_score, len(forms),
    )

    return ContentAnalyzeResponse(
        url=url,
        title=title,
        status_code=status_code,
        content_length=content_length,
        findings=findings,
        forms=forms,
        external_scripts=external_scripts[:50],  # cap for response size
        redirects=redirects,
        risk_score=risk_score,
        risk_level=risk_level_from_score(risk_score),
    )
