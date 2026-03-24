import logging
import asyncio
import httpx
from urllib.parse import urlparse
import base64
import socket
import re

from config import settings
from models import ThreatCheckResponse, ThreatSource, ThreatCategory

logger = logging.getLogger("netsecai.threat_intel")

TIMEOUT = httpx.Timeout(settings.REQUEST_TIMEOUT)


async def _check_virustotal(target: str, client: httpx.AsyncClient) -> ThreatSource:
    """Query VirusTotal for URL or IP reputation."""
    if not settings.VIRUSTOTAL_API_KEY:
        logger.warning("VirusTotal API key not configured")
        return ThreatSource(source="VirusTotal", detected=False, category="unconfigured")

    headers = {"x-apikey": settings.VIRUSTOTAL_API_KEY}

    # Determine if IP or URL
    try:
        parsed = urlparse(target if "://" in target else f"https://{target}")
        is_ip = all(c.isdigit() or c == "." for c in parsed.netloc.split(":")[0])
    except Exception:
        is_ip = False

    try:
        if is_ip:
            ip = parsed.netloc.split(":")[0] if "://" in target else target
            url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip}"
            resp = await client.get(url, headers=headers, timeout=TIMEOUT)
        else:
            # VT URL lookup requires base64url-encoded URL
            url_id = base64.urlsafe_b64encode(target.encode()).decode().rstrip("=")
            url = f"https://www.virustotal.com/api/v3/urls/{url_id}"
            resp = await client.get(url, headers=headers, timeout=TIMEOUT)

        if resp.status_code == 404:
            return ThreatSource(source="VirusTotal", detected=False, category="not_found")

        resp.raise_for_status()
        data = resp.json()

        stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)
        total = sum(stats.values()) if stats else 0

        detected = malicious > 0 or suspicious > 0
        category = "clean"
        if malicious > 5:
            category = "malware"
        elif malicious > 0:
            category = "suspicious"
        elif suspicious > 0:
            category = "suspicious"

        return ThreatSource(
            source="VirusTotal",
            detected=detected,
            category=category,
            raw={"malicious": malicious, "suspicious": suspicious, "total": total, "stats": stats},
        )

    except httpx.HTTPStatusError as exc:
        logger.error("VirusTotal API error %s: %s", exc.response.status_code, exc)
        return ThreatSource(source="VirusTotal", detected=False, category="api_error")
    except Exception as exc:
        logger.error("VirusTotal request failed: %s", exc)
        return ThreatSource(source="VirusTotal", detected=False, category="error")


def _extract_ip_from_target(target: str) -> str | None:
    """Try to extract or resolve an IP address from the target."""
    # Check if target is already an IP
    clean = target.strip()
    if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", clean):
        return clean

    # Try to parse as URL and resolve domain
    try:
        parsed = urlparse(clean if "://" in clean else f"https://{clean}")
        host = parsed.netloc.split(":")[0] if parsed.netloc else clean
        
        # Check if host is IP
        if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host):
            return host
        
        # Resolve domain to IP
        ip = socket.gethostbyname(host)
        return ip
    except Exception as exc:
        logger.warning("Could not resolve IP from target %s: %s", target, exc)
        return None


async def _check_abuseipdb(target: str, client: httpx.AsyncClient) -> ThreatSource:
    """Query AbuseIPDB for IP reputation."""
    if not settings.ABUSEIPDB_API_KEY:
        logger.warning("AbuseIPDB API key not configured")
        return ThreatSource(source="AbuseIPDB", detected=False, category="unconfigured")

    # AbuseIPDB only works with IP addresses, so resolve if needed
    ip_address = _extract_ip_from_target(target)
    if not ip_address:
        return ThreatSource(
            source="AbuseIPDB",
            detected=False,
            category="cannot_resolve",
            raw={"error": "Could not resolve IP address from target"},
        )

    headers = {
        "Key": settings.ABUSEIPDB_API_KEY,
        "Accept": "application/json",
    }

    try:
        url = "https://api.abuseipdb.com/api/v2/check"
        params = {
            "ipAddress": ip_address,
            "maxAgeInDays": 90,
            "verbose": "",
        }

        resp = await client.get(url, headers=headers, params=params, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        abuse_data = data.get("data", {})
        confidence_score = abuse_data.get("abuseConfidenceScore", 0)
        total_reports = abuse_data.get("totalReports", 0)
        is_public = abuse_data.get("isPublic", True)
        isp = abuse_data.get("isp", "Unknown")
        country = abuse_data.get("countryCode", "Unknown")
        domain = abuse_data.get("domain", "")
        usage_type = abuse_data.get("usageType", "")

        detected = confidence_score > 25 or total_reports > 0

        if confidence_score >= 75:
            category = "malware"
        elif confidence_score >= 50:
            category = "suspicious"
        elif confidence_score > 25:
            category = "suspicious"
        elif total_reports > 0:
            category = "suspicious"
        else:
            category = "clean"

        return ThreatSource(
            source="AbuseIPDB",
            detected=detected,
            category=category,
            raw={
                "ip_address": ip_address,
                "abuse_confidence_score": confidence_score,
                "total_reports": total_reports,
                "isp": isp,
                "country": country,
                "domain": domain,
                "usage_type": usage_type,
                "is_public": is_public,
            },
        )

    except httpx.HTTPStatusError as exc:
        logger.error("AbuseIPDB API error %s: %s", exc.response.status_code, exc)
        return ThreatSource(source="AbuseIPDB", detected=False, category="api_error")
    except Exception as exc:
        logger.error("AbuseIPDB request failed: %s", exc)
        return ThreatSource(source="AbuseIPDB", detected=False, category="error")


def _aggregate_reputation(sources: list[ThreatSource]) -> tuple[int, ThreatCategory]:
    """Aggregate threat intel from multiple sources into a unified score."""
    detections = [s for s in sources if s.detected]
    total = len(sources)
    hits = len(detections)

    if total == 0:
        return 0, ThreatCategory.UNKNOWN

    # Base score from detection ratio
    detection_ratio = hits / total
    score = int(detection_ratio * 100)

    # Boost score from AbuseIPDB confidence
    for s in sources:
        if s.source == "AbuseIPDB" and s.raw:
            abuse_score = s.raw.get("abuse_confidence_score", 0)
            if abuse_score > score:
                score = max(score, abuse_score)

    # Category priority
    categories = [s.category for s in detections if s.category]

    if "malware" in categories:
        return max(score, 75), ThreatCategory.MALWARE
    if "phishing" in categories:
        return max(score, 70), ThreatCategory.PHISHING
    if "spam" in categories:
        return max(score, 40), ThreatCategory.SPAM
    if "suspicious" in categories:
        return max(score, 35), ThreatCategory.SUSPICIOUS
    if hits == 0:
        return 0, ThreatCategory.CLEAN

    return score, ThreatCategory.SUSPICIOUS


async def check_threat(target: str) -> ThreatCheckResponse:
    logger.info("Threat intelligence check for: %s", target)

    async with httpx.AsyncClient() as client:
        vt_task = _check_virustotal(target, client)
        abuse_task = _check_abuseipdb(target, client)

        sources = await asyncio.gather(vt_task, abuse_task, return_exceptions=False)

    sources: list[ThreatSource] = list(sources)
    positives = sum(1 for s in sources if s.detected)
    reputation_score, threat_category = _aggregate_reputation(sources)

    logger.info(
        "Threat check complete: score=%d category=%s positives=%d/%d",
        reputation_score, threat_category, positives, len(sources),
    )

    return ThreatCheckResponse(
        target=target,
        reputation_score=reputation_score,
        threat_category=threat_category,
        sources=sources,
        positives=positives,
        total_sources=len(sources),
    )
