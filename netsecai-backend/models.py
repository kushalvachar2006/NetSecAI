from pydantic import BaseModel, HttpUrl
from typing import Optional, Any
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────────

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ThreatCategory(str, Enum):
    CLEAN = "clean"
    PHISHING = "phishing"
    MALWARE = "malware"
    SPAM = "spam"
    SUSPICIOUS = "suspicious"
    UNKNOWN = "unknown"


# ── URL Analyzer ──────────────────────────────────────────────────────────

class URLAnalyzeRequest(BaseModel):
    url: str
    explain: bool = False


class OpenPort(BaseModel):
    port: int
    service: str


class Vulnerability(BaseModel):
    id: str
    description: str
    severity: RiskLevel
    attack_vector: str


class URLAnalyzeResponse(BaseModel):
    url: str
    domain: str
    ip_address: Optional[str]
    open_ports: list[OpenPort]
    vulnerabilities: list[Vulnerability]
    risk_score: int
    risk_level: RiskLevel
    flags: list[str]
    ai_explanation: Optional[str] = None


# ── PCAP Analyzer ─────────────────────────────────────────────────────────

class PacketSummary(BaseModel):
    index: int
    timestamp: float
    src_ip: Optional[str]
    dst_ip: Optional[str]
    src_port: Optional[int]
    dst_port: Optional[int]
    protocol: str
    length: int
    flags: Optional[str] = None
    info: Optional[str] = None


class AnomalyAlert(BaseModel):
    type: str
    description: str
    severity: RiskLevel
    source_ip: Optional[str] = None
    details: dict[str, Any] = {}


class PCAPAnalyzeResponse(BaseModel):
    total_packets: int
    duration_seconds: float
    protocols: dict[str, int]
    top_talkers: list[dict[str, Any]]
    packets: list[PacketSummary]
    anomalies: list[AnomalyAlert]
    risk_score: int
    ai_explanation: Optional[str] = None


# ── Threat Intelligence ───────────────────────────────────────────────────

class ThreatCheckRequest(BaseModel):
    target: str          # URL or IP
    explain: bool = False


class ThreatSource(BaseModel):
    source: str
    detected: bool
    category: Optional[str] = None
    raw: Optional[dict[str, Any]] = None


class ThreatCheckResponse(BaseModel):
    target: str
    reputation_score: int          # 0 = clean, 100 = fully malicious
    threat_category: ThreatCategory
    sources: list[ThreatSource]
    positives: int
    total_sources: int
    ai_explanation: Optional[str] = None


# ── Content Analyzer ──────────────────────────────────────────────────────

class ContentAnalyzeRequest(BaseModel):
    url: str
    explain: bool = False


class ContentFinding(BaseModel):
    type: str
    severity: RiskLevel
    description: str
    evidence: Optional[str] = None
    line: Optional[int] = None


class ContentAnalyzeResponse(BaseModel):
    url: str
    title: Optional[str]
    status_code: int
    content_length: int
    findings: list[ContentFinding]
    forms: list[dict[str, Any]]
    external_scripts: list[str]
    redirects: list[str]
    risk_score: int
    risk_level: RiskLevel
    ai_explanation: Optional[str] = None


# ── Sniffer ───────────────────────────────────────────────────────────────

class LivePacket(BaseModel):
    index: int
    timestamp: float
    src_ip: Optional[str]
    dst_ip: Optional[str]
    src_port: Optional[int]
    dst_port: Optional[int]
    protocol: str
    length: int
    info: Optional[str] = None


class SnifferStatus(BaseModel):
    running: bool
    interface: Optional[str]
    packet_count: int
    start_time: Optional[float] = None


class SnifferPacketsResponse(BaseModel):
    packets: list[LivePacket]
    total_captured: int
    protocol_stats: dict[str, int]


class SnifferAlertsResponse(BaseModel):
    alerts: list[AnomalyAlert]
    total_alerts: int


# ── Full Analysis ─────────────────────────────────────────────────────────

class FullAnalyzeRequest(BaseModel):
    url: str
    include_threat_intel: bool = True
    include_content: bool = True
    explain: bool = True


class FullAnalyzeResponse(BaseModel):
    url: str
    url_analysis: URLAnalyzeResponse
    threat_intel: Optional[ThreatCheckResponse] = None
    content_analysis: Optional[ContentAnalyzeResponse] = None
    overall_risk_score: int
    overall_risk_level: RiskLevel
    executive_summary: Optional[str] = None
