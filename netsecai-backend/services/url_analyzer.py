import socket
import logging
import re
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

from config import settings
from models import (
    URLAnalyzeResponse, OpenPort, Vulnerability, RiskLevel
)

logger = logging.getLogger("netsecai.url_analyzer")

KNOWN_PORTS: dict[int, str] = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
    80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS", 465: "SMTPS",
    587: "SMTP/TLS", 993: "IMAPS", 995: "POP3S", 3306: "MySQL",
    3389: "RDP", 5432: "PostgreSQL", 6379: "Redis", 8080: "HTTP-Alt",
    8443: "HTTPS-Alt", 27017: "MongoDB",
}

SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "update", "secure", "account",
    "banking", "paypal", "amazon", "microsoft", "apple", "google",
    "password", "credential", "confirm", "wallet", "crypto",
]

SUSPICIOUS_TLD = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".click"]

VULN_CATALOG: list[dict] = [
    {
        "id": "NO_HTTPS",
        "check": lambda parsed, _ip, ports: parsed.scheme != "https",
        "description": "Site uses plain HTTP — traffic can be intercepted",
        "severity": RiskLevel.HIGH,
        "attack_vector": "Man-in-the-Middle (MITM) — attacker can sniff or tamper in-transit data",
    },
    {
        "id": "FTP_OPEN",
        "check": lambda _p, _ip, ports: 21 in ports,
        "description": "FTP port (21) is open — unencrypted file transfer",
        "severity": RiskLevel.HIGH,
        "attack_vector": "Credential sniffing, anonymous login attempt",
    },
    {
        "id": "TELNET_OPEN",
        "check": lambda _p, _ip, ports: 23 in ports,
        "description": "Telnet port (23) is open — cleartext remote access",
        "severity": RiskLevel.CRITICAL,
        "attack_vector": "Remote code execution via cleartext credential replay",
    },
    {
        "id": "RDP_OPEN",
        "check": lambda _p, _ip, ports: 3389 in ports,
        "description": "RDP port (3389) is open — remote desktop exposed",
        "severity": RiskLevel.HIGH,
        "attack_vector": "Brute-force / BlueKeep-style exploitation",
    },
    {
        "id": "DB_EXPOSED",
        "check": lambda _p, _ip, ports: any(p in ports for p in [3306, 5432, 27017, 6379]),
        "description": "Database port exposed to the internet",
        "severity": RiskLevel.CRITICAL,
        "attack_vector": "Unauthenticated database access, data exfiltration",
    },
    {
        "id": "LONG_URL",
        "check": lambda parsed, _ip, _ports: len(parsed.geturl()) > 100,
        "description": "Unusually long URL — typical phishing pattern",
        "severity": RiskLevel.MEDIUM,
        "attack_vector": "Phishing / URL obfuscation",
    },
    {
        "id": "SUSPICIOUS_KEYWORD",
        "check": lambda parsed, _ip, _ports: [
            kw for kw in SUSPICIOUS_KEYWORDS
            if kw in (parsed.netloc + parsed.path).lower()
        ] or False,
        "description": "URL contains phishing-associated keywords",
        "severity": RiskLevel.MEDIUM,
        "attack_vector": "Phishing — credential harvesting",
    },
    {
        "id": "SUSPICIOUS_TLD",
        "check": lambda parsed, _ip, _ports: any(
            parsed.netloc.lower().endswith(tld) for tld in SUSPICIOUS_TLD
        ),
        "description": "Domain uses a TLD commonly abused for malicious hosting",
        "severity": RiskLevel.MEDIUM,
        "attack_vector": "Phishing / malware distribution",
    },
    {
        "id": "IP_IN_URL",
        "check": lambda parsed, _ip, _ports: bool(
            re.match(r"^\d{1,3}(\.\d{1,3}){3}$", parsed.netloc.split(":")[0])
        ),
        "description": "URL uses a raw IP address instead of a domain name",
        "severity": RiskLevel.MEDIUM,
        "attack_vector": "Phishing / botnet C2 communication",
    },
    {
        "id": "MULTIPLE_SUBDOMAINS",
        "check": lambda parsed, _ip, _ports: parsed.netloc.count(".") >= 4,
        "description": "Excessive subdomains — common typosquatting technique",
        "severity": RiskLevel.MEDIUM,
        "attack_vector": "Typosquatting / phishing",
    },
]

SCORE_WEIGHTS = {
    RiskLevel.CRITICAL: 35,
    RiskLevel.HIGH: 20,
    RiskLevel.MEDIUM: 10,
    RiskLevel.LOW: 3,
}


def _resolve_ip(domain: str) -> str | None:
    try:
        return socket.gethostbyname(domain)
    except socket.gaierror as exc:
        logger.warning("DNS resolution failed for %s: %s", domain, exc)
        return None


def _probe_port(ip: str, port: int, timeout: float) -> int | None:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            result = s.connect_ex((ip, port))
            return port if result == 0 else None
    except Exception:
        return None


def _scan_ports(ip: str) -> list[int]:
    open_ports: list[int] = []
    with ThreadPoolExecutor(max_workers=50) as pool:
        futures = {
            pool.submit(_probe_port, ip, port, settings.PORT_SCAN_TIMEOUT): port
            for port in settings.PORT_SCAN_TOP_PORTS
        }
        for future in as_completed(futures):
            result = future.result()
            if result is not None:
                open_ports.append(result)
    return sorted(open_ports)


def _compute_risk_score(vulns: list[Vulnerability]) -> int:
    score = 0
    for v in vulns:
        score += SCORE_WEIGHTS.get(v.severity, 0)
    return min(score, 100)


def _risk_level(score: int) -> RiskLevel:
    if score >= 70:
        return RiskLevel.CRITICAL
    if score >= 45:
        return RiskLevel.HIGH
    if score >= 20:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


async def analyze_url(url: str) -> URLAnalyzeResponse:
    parsed = urlparse(url if "://" in url else f"https://{url}")
    domain = parsed.netloc or parsed.path.split("/")[0]
    domain = domain.split(":")[0]  # strip port

    logger.info("Analyzing URL: %s (domain=%s)", url, domain)

    ip_address = _resolve_ip(domain)

    open_port_numbers: list[int] = []
    if ip_address:
        logger.info("Port scanning %s (%s)...", domain, ip_address)
        open_port_numbers = _scan_ports(ip_address)
        logger.info("Open ports on %s: %s", ip_address, open_port_numbers)

    open_ports = [
        OpenPort(port=p, service=KNOWN_PORTS.get(p, "unknown"))
        for p in open_port_numbers
    ]

    vulnerabilities: list[Vulnerability] = []
    flags: list[str] = []

    for vuln_def in VULN_CATALOG:
        try:
            triggered = vuln_def["check"](parsed, ip_address, open_port_numbers)
        except Exception as exc:
            logger.debug("Vuln check %s errored: %s", vuln_def["id"], exc)
            triggered = False

        if triggered:
            desc = vuln_def["description"]
            # For SUSPICIOUS_KEYWORD, show which keywords matched
            if vuln_def["id"] == "SUSPICIOUS_KEYWORD" and isinstance(triggered, list):
                desc = f"URL contains phishing-associated keywords: {', '.join(triggered)}"

            vulnerabilities.append(
                Vulnerability(
                    id=vuln_def["id"],
                    description=desc,
                    severity=vuln_def["severity"],
                    attack_vector=vuln_def["attack_vector"],
                )
            )
            flags.append(vuln_def["id"])

    risk_score = _compute_risk_score(vulnerabilities)
    risk_level = _risk_level(risk_score)

    logger.info(
        "URL analysis complete: score=%d level=%s vulns=%d",
        risk_score, risk_level, len(vulnerabilities),
    )

    return URLAnalyzeResponse(
        url=url,
        domain=domain,
        ip_address=ip_address,
        open_ports=open_ports,
        vulnerabilities=vulnerabilities,
        risk_score=risk_score,
        risk_level=risk_level,
        flags=flags,
    )
