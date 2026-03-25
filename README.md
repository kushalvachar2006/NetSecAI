<div align="center">

# 🛡️ NetSecAI
### Next-Generation AI-Powered Cybersecurity Analysis Platform

A comprehensive cybersecurity analysis suite leveraging real-time backend intelligence and **Google Gemini AI** to detect, analyze, and explain network and web threats in plain language.

[**Purpose**](#purpose-of-this-project) •
[**Features**](#features) •
[**Tech Stack**](#tech-stack) •
[**Project Structure**](#project-structure) •
[**Setup & Installation**](#setup--installation) •
[**Environment Variables**](#environment-variables) •
[**Security Notice**](#security-notice)
### Project is Live:- [NetSecAI](https://netsecai-kva.netlify.app)
</div>

---
## 🚀 What is NetSecAI?
NetSecAI is a production-ready, full-stack cybersecurity analysis platform. It provides 5 specialized security tools that query live data (DNS, packets, VirusTotal, AbuseIPDB) and uses **Google's Gemini 2.5 Flash** to translate complex security findings into executive, non-technical summaries.

---

## <a id="purpose-of-this-project"></a>🎯 Purpose of this project
This project was built to learn how real-world cybersecurity tools work behind the scenes. It serves as a hands-on experiment to understand how to scan for vulnerabilities, inspect network packets, and check IPs against threat databases.

By adding Google Gemini AI, the goal is also to see how AI can help explain scary-looking terminal output and raw security data in simple, beginner-friendly English. Ultimately, this is a personal learning project designed to explore full-stack development and network security.

---

## <a id="features"></a>🧠 Features

### [1. URL Analyzer](#)
- **Port Scanning**: Probes 20 common ports (FTP, SSH, RDP, Databases) to identify exposed services.
- **Vulnerability Checks**: Flags missing HTTPS, suspicious TLDs, IP-based URLs, and typosquatting.
- **Phishing Detection**: Scans the path for credential-harvesting keywords.

### [2. PCAP Analyzer](#)
- **Deep Packet Inspection**: Upload `.pcap` or `.pcapng` files for deep analysis.
- **Anomaly Detection**: Automatically flags SYN floods, port scans, and ICMP floods.
- **Protocol Distribution**: Visual breakdown of network traffic composition.

### [3. Threat Intelligence](#)
- **Multiple Engines**: Queries URLs and IPs against **VirusTotal** (70+ engines) and **AbuseIPDB**.
- **Unified Risk Score**: Calculates a consolidated reputation score (0–100) based on cross-engine confidence.
- **Categorization**: Identifies whether the threat is malware, phishing, or spam.

### [4. Content Analyzer](#)
- **Webpage Fetching**: Connects to alive endpoints to inspect DOM and scripts.
- **XSS & Form Detection**: Detects potentially malicious cross-site scripting patterns and hidden credential harvesting forms.
- **Suspicious Redirects**: Identifies hidden `iframes` and JavaScript-based obfuscation.

### [5. Full Analysis Pipeline](#)
- **Parallel Execution**: Runs URL Analysis, Threat Intelligence, and Content Analysis concurrently for maximum speed.
- **Executive Board Report**: Synthesizes all findings into a structured Gemini AI markdown report with *Key Risks* and *Remediation Recommendations*.

---

## <a id="tech-stack"></a>⚙️ Tech Stack

**Frontend**
- **Framework**: React 18 + Vite
- **Styling**: TailwindCSS (v4)
- **Icons**: Lucide React
- **Icons & UI**: Glassmorphism aesthetic, Recharts, Framer Motion (animations)

**Backend**
- **Framework**: FastAPI (Python 3.12+)
- **Packet Processing**: Scapy & libpcap
- **AI Brain**: `google-genai` (Gemini 2.5 Flash)
- **Threat Sources**: VirusTotal API, AbuseIPDB API

---

## <a id="project-structure"></a>📁 Project Structure

The platform is split into two main monoliths:

```text
_01.NetSecAI/
├── netsecai-backend/           # FastAPI Python Backend
│   ├── main.py                 # Application entrypoint & Middleware
│   ├── config.py               # Centralized environment variable management
│   ├── models.py               # Pydantic schema validation models
│   ├── routers/                # API route controllers (URL, PCAP, etc)
│   └── services/               # Core business logic (Sniffer engines, AI prompts)
│
└── netsecai-frontend/          # React + Vite Frontend
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Main router
        ├── index.css           # Tailwind & Glassmorphism definitions
        ├── components/         # Reusable UI charts, cards, and Modals
        ├── contexts/           # NetSecContext.jsx (Central State Manager)
        ├── pages/              # The 5 main dashboard views
        └── services/           # api.js (Axios connection to FastAPI)
```

---

## <a id="environment-variables"></a>🔑 Environment Variables

To run the backend fully, you will need to map a few API keys. 
Create a `.env` file in the `netsecai-backend` folder:

```env
# Google Gemini API (Required for AI explanations)
GEMINI_API_KEY=your_gemini_api_key_here

# Threat Intelligence (Optional but recommended)
VIRUSTOTAL_API_KEY=your_virustotal_api_key
ABUSEIPDB_API_KEY=your_abuseipdb_api_key

# Scanning Config
PORT_SCAN_TIMEOUT=1.0
```
> *Note: NetSecAI degrades gracefully. If an API key is missing, that specific service will simply return "Unconfigured" without crashing the app.*

---

## <a id="setup--installation"></a>🛠️ Setup & Installation

### 1. Start the Backend (FastAPI)

```bash
cd netsecai-backend

# Create virtual environment
python -m venv venv
# Activate it (Windows)
venv\Scripts\activate
# Activate it (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server (runs on port 8000)
uvicorn main:app --reload --port 8000
```


### 2. Start the Frontend (React/Vite)
Open a new terminal window.

```bash
cd netsecai-frontend

# Install node modules
npm install

# Start the development server (runs on port 5173)
npm run dev
```

Visit **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## <a id="security-notice"></a>🔒 Security Notice

NetSecAI is built for **educational purposes, forensic analysis, and authorized security auditing only**.
- Do not use the URL Analyzer or Port Scanner against targets you do not have explicit permission to scan.


---

## Author
<div align="center" style="font-size:28px; font-weight:700; padding:8px 16px; border-radius:10px; background:#1f2937; color:#ffffff;">
  Kushal V Achar
</div>



- GitHub: [@kushalvachar2006](https://github.com/kushalvachar2006)
- LinkedIn: [Connect with me](https://www.linkedin.com/in/kushal-v-achar-796049317/)

