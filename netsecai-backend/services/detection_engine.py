import logging
from models import RiskLevel, Vulnerability, AnomalyAlert

logger = logging.getLogger("netsecai.detection_engine")

# Attack vector taxonomy
ATTACK_VECTORS = {
    "mitm": {
        "name": "Man-in-the-Middle (MITM)",
        "description": "Attacker intercepts communication between client and server",
        "prerequisites": ["NO_HTTPS", "HTTP_ONLY"],
    },
    "phishing": {
        "name": "Phishing / Social Engineering",
        "description": "Deceptive site designed to steal credentials or sensitive data",
        "prerequisites": ["SUSPICIOUS_KEYWORD", "SUSPICIOUS_TLD", "LONG_URL", "IP_IN_URL"],
    },
    "brute_force": {
        "name": "Brute Force Attack",
        "description": "Repeated login attempts to guess credentials",
        "prerequisites": ["RDP_OPEN", "SSH_OPEN", "TELNET_OPEN"],
    },
    "data_exfiltration": {
        "name": "Data Exfiltration",
        "description": "Unauthorized extraction of sensitive data from exposed services",
        "prerequisites": ["DB_EXPOSED"],
    },
    "remote_execution": {
        "name": "Remote Code Execution",
        "description": "Attacker gains shell/command execution on the target",
        "prerequisites": ["TELNET_OPEN", "RDP_OPEN"],
    },
    "port_scan": {
        "name": "Reconnaissance / Port Scanning",
        "description": "Systematic probing of open ports to map attack surface",
        "prerequisites": [],
    },
    "syn_flood": {
        "name": "SYN Flood / DDoS",
        "description": "Volumetric attack exhausting server TCP connection resources",
        "prerequisites": [],
    },
    "xss": {
        "name": "Cross-Site Scripting (XSS)",
        "description": "Malicious scripts injected and executed in victim browsers",
        "prerequisites": [],
    },
    "credential_theft": {
        "name": "Credential Theft",
        "description": "Harvesting usernames and passwords through deceptive forms",
        "prerequisites": [],
    },
}


def map_attack_vectors(vuln_ids: list[str]) -> list[str]:
    """Return applicable attack vector names for the given vulnerability IDs."""
    applicable = []
    for av_key, av_data in ATTACK_VECTORS.items():
        prereqs = av_data["prerequisites"]
        if not prereqs:
            continue
        if any(p in vuln_ids for p in prereqs):
            applicable.append(av_data["name"])
    return applicable


def compute_combined_risk_score(
    url_score: int,
    threat_score: int | None,
    content_score: int | None,
) -> int:
    """Weighted aggregation of multiple analysis scores."""
    weights = []
    scores = []

    scores.append(url_score)
    weights.append(0.40)

    if threat_score is not None:
        scores.append(threat_score)
        weights.append(0.40)

    if content_score is not None:
        scores.append(content_score)
        weights.append(0.20)

    # Normalise weights to 1
    total_weight = sum(weights)
    normalised = [w / total_weight for w in weights]

    combined = sum(s * w for s, w in zip(scores, normalised))
    return min(int(combined), 100)


def risk_level_from_score(score: int) -> RiskLevel:
    if score >= 70:
        return RiskLevel.CRITICAL
    if score >= 45:
        return RiskLevel.HIGH
    if score >= 20:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def classify_anomaly_severity(anomaly_type: str, count: int) -> RiskLevel:
    """Determine anomaly severity based on type and occurrence count."""
    thresholds = {
        "syn_flood": (100, 500),          # (medium_threshold, high_threshold)
        "port_scan": (15, 50),
        "icmp_flood": (200, 1000),
        "dns_amplification": (10, 50),
        "large_payload": (5, 20),
        "unusual_protocol": (1, 5),
    }

    if anomaly_type not in thresholds:
        return RiskLevel.LOW

    med_thresh, high_thresh = thresholds[anomaly_type]

    if count >= high_thresh:
        return RiskLevel.CRITICAL
    if count >= med_thresh:
        return RiskLevel.HIGH
    if count >= max(med_thresh // 5, 1):
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def enrich_vulnerability(vuln: Vulnerability) -> Vulnerability:
    """Add additional context to a vulnerability (passthrough with logging)."""
    logger.debug(
        "Vulnerability: %s | severity=%s | vector=%s",
        vuln.id, vuln.severity, vuln.attack_vector,
    )
    return vuln


def score_anomalies(anomalies: list[AnomalyAlert]) -> int:
    """Derive a risk score (0-100) from a list of anomaly alerts."""
    severity_weights = {
        RiskLevel.CRITICAL: 35,
        RiskLevel.HIGH: 20,
        RiskLevel.MEDIUM: 10,
        RiskLevel.LOW: 3,
    }
    total = sum(severity_weights.get(a.severity, 0) for a in anomalies)
    return min(total, 100)
