# NetSecAI — Backend

An AI-powered cybersecurity analysis platform built with FastAPI.

---

## Features

| Module | Capability |
|--------|-----------|
| URL Analyzer | DNS lookup, port scanning, vulnerability detection, attack vector mapping |
| PCAP Analyzer | Packet parsing via Scapy, anomaly detection (SYN flood, port scan, ICMP flood) |
| Threat Intelligence | VirusTotal + Google Safe Browsing + PhishTank aggregation |
| Content Analyzer | Phishing form detection, XSS patterns, hidden redirects, obfuscation |
| Packet Sniffer | Live capture with real-time alert generation |
| AI Explanations | Gemini-powered summaries, risk breakdowns, remediation recommendations |

---

## Project Structure

```
backend/
├── main.py                     # FastAPI app, middleware, lifespan
├── config.py                   # Settings from environment variables
├── models.py                   # All Pydantic request/response models
├── requirements.txt
├── .env.example
├── routers/
│   ├── url_router.py           # POST /api/url/analyze
│   ├── pcap_router.py          # POST /api/pcap/analyze
│   ├── threat_router.py        # POST /api/threat/check
│   ├── content_router.py       # POST /api/content/analyze
│   ├── sniffer_router.py       # GET  /api/sniffer/{start,stop,packets,alerts,status}
│   └── full_router.py          # POST /api/analyze/full
└── services/
    ├── url_analyzer.py         # DNS, port scan, vulnerability checks
    ├── detection_engine.py     # Risk scoring, attack vector mapping
    ├── pcap_analyzer.py        # Scapy PCAP parsing + anomaly detection
    ├── sniffer.py              # Live packet capture (Scapy, threaded)
    ├── threat_intelligence.py  # VirusTotal / GSB / PhishTank clients
    ├── content_analyzer.py     # HTML fetch, form/XSS/redirect analysis
    └── ai_service.py           # Gemini API integration
```

---

## Quick Start

### 1. Prerequisites

- Python 3.12+
- `libpcap` (for Scapy): `sudo apt install libpcap-dev` / `brew install libpcap`
- Root/admin privileges for live packet sniffing

### 2. Install

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env — add your API keys:
#   VIRUSTOTAL_API_KEY
#   GOOGLE_SAFE_BROWSING_API_KEY
#   PHISHTANK_API_KEY  (optional)
#   GEMINI_API_KEY
```

### 4. Run

```bash
# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production (root required for sniffer)
sudo uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## API Reference

### `POST /api/url/analyze`

Analyse a URL for open ports, vulnerabilities, and attack vectors.

**Request:**
```json
{
  "url": "http://suspicious-login.tk/paypal/secure",
  "explain": true
}
```

**Response:** `URLAnalyzeResponse`
- `ip_address` — resolved IP
- `open_ports` — list of `{port, service}`
- `vulnerabilities` — list with `id`, `description`, `severity`, `attack_vector`
- `risk_score` — 0–100
- `risk_level` — `low | medium | high | critical`
- `ai_explanation` — Gemini narrative (if `explain: true`)

---

### `POST /api/pcap/analyze`

Upload and analyse a PCAP file.

**Request:** `multipart/form-data`
- `file` — `.pcap` / `.pcapng` file (max 50 MB)
- `explain` — boolean

**Response:** `PCAPAnalyzeResponse`
- `total_packets`, `duration_seconds`
- `protocols` — `{TCP: 1200, UDP: 340, ...}`
- `top_talkers` — top 10 source IPs by packet count
- `packets` — first 500 packet summaries
- `anomalies` — detected threats with severity
- `risk_score`

---

### `POST /api/threat/check`

Check a URL or IP against threat intelligence sources.

**Request:**
```json
{
  "target": "http://phishing-example.com",
  "explain": false
}
```

**Response:** `ThreatCheckResponse`
- `reputation_score` — 0 (clean) to 100 (fully malicious)
- `threat_category` — `clean | phishing | malware | spam | suspicious | unknown`
- `sources` — per-source results from VT, GSB, PhishTank
- `positives` — number of sources that flagged the target

---

### `POST /api/content/analyze`

Fetch and analyse webpage content for client-side threats.

**Request:**
```json
{
  "url": "https://target-site.com",
  "explain": true
}
```

**Response:** `ContentAnalyzeResponse`
- `findings` — typed findings: `phishing_form`, `possible_xss`, `hidden_redirect`, `suspicious_iframe`, `code_obfuscation`, `insecure_credential_form`
- `forms` — extracted form details
- `external_scripts` — all external JS sources
- `redirects` — HTTP redirect chain

---

### `GET /api/sniffer/start?interface=eth0`

Start live packet capture. Requires root privileges.

### `GET /api/sniffer/stop`

Stop the sniffer.

### `GET /api/sniffer/packets?limit=100`

Get the most recent `limit` captured packets with protocol stats.

### `GET /api/sniffer/alerts`

Get real-time anomaly alerts (SYN flood, port scan detections).

---

### `POST /api/analyze/full`

Comprehensive analysis pipeline: URL + Threat Intel + Content + AI Summary.

**Request:**
```json
{
  "url": "http://suspicious-target.com",
  "include_threat_intel": true,
  "include_content": true,
  "explain": true
}
```

**Response:** `FullAnalyzeResponse`
- All individual analysis results
- `overall_risk_score` — weighted aggregate
- `executive_summary` — AI-generated executive brief

---

## Risk Scoring

| Score | Level | Meaning |
|-------|-------|---------|
| 0–19 | Low | No significant threats detected |
| 20–44 | Medium | Some suspicious indicators |
| 45–69 | High | Multiple serious vulnerabilities |
| 70–100 | Critical | Active threats, immediate action required |

### Vulnerability Weights

| Severity | Score Contribution |
|----------|--------------------|
| Critical | +35 |
| High | +20 |
| Medium | +10 |
| Low | +3 |

---

## Anomaly Detection (PCAP + Sniffer)

| Anomaly | Trigger Condition |
|---------|------------------|
| SYN Flood | ≥100 SYN packets from one source |
| Port Scan | ≥15 distinct destination ports from one source |
| ICMP Flood | ≥200 ICMP packets from one source |
| Large Payload | Packets ≥9000 bytes |
| DNS Amplification | ≥50 DNS responses targeting a single IP |

---

## API Keys

| Service | Purpose | Get Key |
|---------|---------|---------|
| VirusTotal | URL/IP reputation | https://www.virustotal.com/gui/my-apikey |
| Google Safe Browsing | Phishing/malware detection | https://console.cloud.google.com |
| PhishTank | Phishing URL database | https://www.phishtank.com/api_register.php |
| Gemini | AI explanations | https://aistudio.google.com/app/apikey |

All APIs are optional — the platform degrades gracefully when keys are absent.

---

## Security Notes

- The packet sniffer requires **root/NET_RAW** capability
- In Docker, use `--cap-add=NET_ADMIN --cap-add=NET_RAW` and `network_mode: host`
- Never expose this API publicly without authentication middleware
- Rate-limit the `/api/url/analyze` endpoint to prevent abuse as a port-scanning proxy

---

## Interactive Docs

Once running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
