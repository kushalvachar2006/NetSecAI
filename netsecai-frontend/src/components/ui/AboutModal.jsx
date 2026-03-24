import { X, Globe, FileSearch, Shield, Zap, Target, Eye, Activity, Search } from 'lucide-react'

const serviceInfo = {
  'url-analyzer': {
    icon: Globe,
    title: 'URL Analyzer',
    description: 'Advanced URL security analysis with real-time threat detection and AI-powered insights.',
    features: [
      'DNS Resolution & IP Mapping',
      'Port Scanning (20 common ports)',
      'Vulnerability Detection (HTTPS, open FTP/Telnet/RDP/DB)',
      'Phishing Keyword Detection',
      'Suspicious TLD & Typosquatting Detection',
      'AI-Powered Risk Assessment via Gemini'
    ],
    howToUse: [
      'Enter any URL, domain, or IP address in the input field',
      'Click "Analyze Target" to start the security scan',
      'Review vulnerabilities, open ports, and risk score',
      'Check the AI explanation for a plain-language summary',
      'Follow recommendations to improve security'
    ]
  },
  'pcap-analyzer': {
    icon: FileSearch,
    title: 'PCAP Analyzer',
    description: 'Deep packet capture analysis for forensic investigations and security research.',
    features: [
      'Deep Packet Inspection',
      'Protocol Distribution Analysis',
      'Anomaly Detection (SYN flood, Port scan, ICMP flood)',
      'Top Talkers Analysis',
      'Risk Scoring & Severity Assessment',
      'AI-Powered Explanation (optional, via Gemini)'
    ],
    howToUse: [
      'Upload a PCAP/PCAPNG file (up to 50MB)',
      'Optionally check "Include AI explanation" for Gemini analysis',
      'Review packet stats, protocol breakdown, and anomalies',
      'Inspect the packet sample table for individual packet details',
      'Check the AI explanation for plain-language security insights'
    ]
  },
  'threat-intel': {
    icon: Shield,
    title: 'Threat Intelligence',
    description: 'Check URLs and IPs against multiple threat intelligence databases for reputation scoring.',
    features: [
      'VirusTotal Integration (70+ security engines)',
      'AbuseIPDB Integration (community abuse reports)',
      'Aggregated Reputation Score',
      'Threat Category Classification (malware, phishing, spam)',
      'Per-Source Detailed Verdicts',
      'AI-Powered Threat Analysis via Gemini'
    ],
    howToUse: [
      'Enter a URL, domain, or IP address to check',
      'Optionally enable "Include AI explanation" for Gemini insights',
      'Click "Check Threat" to query all sources',
      'Review the reputation score and threat category',
      'Read "As per VirusTotal / AbuseIPDB" notes for each source'
    ]
  },
  'content-analyzer': {
    icon: Eye,
    title: 'Content Analyzer',
    description: 'Webpage content security scanner that detects phishing, XSS, and malicious scripts.',
    features: [
      'Phishing Form Detection (login/credential harvesting)',
      'Cross-Site Scripting (XSS) Pattern Detection',
      'Hidden Redirect Detection',
      'Suspicious Iframe Analysis',
      'Code Obfuscation Detection',
      'External Script Inspection'
    ],
    howToUse: [
      'Enter a URL of the webpage you want to scan',
      'Click "Analyze Content" to start the scan',
      'Review content findings with severity levels',
      'Check the risk score and identified vulnerabilities',
      'Read the AI analysis for a plain-language security overview'
    ]
  },
  'packet-sniffer': {
    icon: Activity,
    title: 'Packet Sniffer',
    description: 'Live network traffic capture with real-time anomaly detection — similar to Wireshark.',
    features: [
      'Real-Time Packet Capture via Scapy',
      'Protocol Filtering (TCP, UDP, DNS, ICMP, IPv6)',
      'SYN Flood Detection',
      'Port Scan Detection',
      'Clickable IP Lookup (WHOIS)',
      'Protocol Distribution Visualization'
    ],
    howToUse: [
      'Leave interface field blank for auto-detection, or specify one',
      'Click "Start Capture" to begin sniffing packets',
      'Click "Stop Capture" when done collecting packets',
      'Use the filter bar to filter by protocol, IP, or port',
      'Click any source/destination IP to open a WHOIS lookup'
    ]
  },
  'full-analysis': {
    icon: Search,
    title: 'Full Analysis',
    description: 'Comprehensive security scan combining URL analysis, threat intelligence, and content scanning.',
    features: [
      'URL Analysis (ports, vulnerabilities, DNS)',
      'Threat Intelligence (VirusTotal + AbuseIPDB)',
      'Content Security Scan (XSS, phishing, redirects)',
      'AI Executive Summary via Gemini',
      'Aggregated Risk Level',
      'All modules run in parallel for speed'
    ],
    howToUse: [
      'Enter the target URL to analyze',
      'Toggle which modules to include (Threat Intel, Content, AI Summary)',
      'Click "Run Full Analysis" to start all modules in parallel',
      'Review the overall risk level and per-module results',
      'Read the AI executive summary for a complete security overview'
    ]
  }
}

export default function AboutModal({ isOpen, onClose, serviceType }) {
  if (!isOpen || !serviceInfo[serviceType]) return null

  const service = serviceInfo[serviceType]
  const Icon = service.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-800/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{service.title}</h3>
              <p className="text-sm text-gray-400">{service.description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Features */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Key Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {service.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How to Use */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              How to Use
            </h4>
            <div className="space-y-3">
              {service.howToUse.map((step, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-medium text-green-400">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-white mb-1">Security Notice</h5>
                <p className="text-sm text-gray-300 leading-relaxed">
                  This tool is designed for security testing and educational purposes only.
                  Always ensure you have proper authorization before analyzing any network resources or URLs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
