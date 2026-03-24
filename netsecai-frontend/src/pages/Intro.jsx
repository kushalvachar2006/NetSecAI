import { Shield, Globe, FileSearch, ArrowRight, Zap, Lock, Target, Sparkles, Activity, Eye, Cpu, Menu, X, ChevronRight, Terminal, Wifi, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

/* ─── Service catalog ──────────────────────────────────────────────────── */
const SERVICES = [
  {
    icon: Globe,
    title: "URL Analyzer",
    description: "DNS resolution, port scanning, vulnerability detection, and attack vector mapping with real-time risk scoring.",
    features: ["DNS Resolution", "Port Scanning", "Vulnerability Detection", "Attack Vector Mapping"],
    path: "/url-analyzer",
    color: "blue",
    gradient: "from-blue-600 via-blue-500 to-cyan-500",
    stats: { ports: "20", vulns: "10+", score: "0–100" },
    category: "Analysis",
  },
  {
    icon: FileSearch,
    title: "PCAP Analyzer",
    description: "Deep packet capture analysis with Scapy. Detects SYN floods, port scans, ICMP floods, and DNS amplification.",
    features: ["Deep Packet Inspection", "Protocol Distribution", "Anomaly Detection", "AI Explanation"],
    path: "/pcap-analyzer",
    color: "cyan",
    gradient: "from-cyan-600 via-cyan-500 to-blue-500",
    stats: { formats: ".pcap", limit: "50MB", anomalies: "5 types" },
    category: "Forensics",
  },
  {
    icon: Shield,
    title: "Threat Intelligence",
    description: "Aggregated reputation check across VirusTotal and AbuseIPDB with unified scoring and AI-powered analysis.",
    features: ["VirusTotal", "AbuseIPDB", "Reputation Score", "AI Analysis"],
    path: "/threat-intel",
    color: "purple",
    gradient: "from-purple-600 via-purple-500 to-pink-500",
    stats: { sources: "2", score: "0–100", types: "5 categories" },
    category: "Intelligence",
  },
  {
    icon: Eye,
    title: "Content Analyzer",
    description: "Fetch and inspect live webpages for phishing forms, XSS patterns, hidden redirects, and obfuscated code.",
    features: ["Phishing Forms", "XSS Patterns", "Hidden Redirects", "Script Analysis"],
    path: "/content-analyzer",
    color: "green",
    gradient: "from-green-600 via-emerald-500 to-teal-500",
    stats: { checks: "7 types", forms: "detected", scripts: "traced" },
    category: "Web Security",
  },
  {
    icon: Activity,
    title: "Packet Sniffer",
    description: "Real-time packet capture with live anomaly alerts and Wireshark-style protocol filtering.",
    features: ["Live Capture", "Protocol Filter", "Real-time Alerts", "IP Lookup"],
    path: "/packet-sniffer",
    color: "orange",
    gradient: "from-orange-600 via-orange-500 to-yellow-500",
    stats: { refresh: "2s", alerts: "live", packets: "500 max" },
    category: "Monitoring",
  },
  {
    icon: Cpu,
    title: "Full Analysis",
    description: "All modules run in parallel — URL + Threat Intel + Content scan — with a Gemini AI executive summary.",
    features: ["URL Analysis", "Threat Intel", "Content Scan", "AI Summary"],
    path: "/full-analysis",
    color: "pink",
    gradient: "from-pink-600 via-rose-500 to-red-500",
    stats: { modules: "3+", ai: "Gemini", output: "unified" },
    category: "All-in-One",
  },
]

const COLOR_MAP = {
  blue:   { bg: "bg-blue-500/5",   border: "border-blue-500/20",   text: "text-blue-400",   hover: "hover:bg-blue-500/10 hover:border-blue-500/40",   button: "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-blue-500/25"   },
  cyan:   { bg: "bg-cyan-500/5",   border: "border-cyan-500/20",   text: "text-cyan-400",   hover: "hover:bg-cyan-500/10 hover:border-cyan-500/40",   button: "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white shadow-cyan-500/25"   },
  purple: { bg: "bg-purple-500/5", border: "border-purple-500/20", text: "text-purple-400", hover: "hover:bg-purple-500/10 hover:border-purple-500/40", button: "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-purple-500/25" },
  green:  { bg: "bg-green-500/5",  border: "border-green-500/20",  text: "text-green-400",  hover: "hover:bg-green-500/10 hover:border-green-500/40",  button: "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-green-500/25"  },
  orange: { bg: "bg-orange-500/5", border: "border-orange-500/20", text: "text-orange-400", hover: "hover:bg-orange-500/10 hover:border-orange-500/40", button: "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-orange-500/25" },
  pink:   { bg: "bg-pink-500/5",   border: "border-pink-500/20",   text: "text-pink-400",   hover: "hover:bg-pink-500/10 hover:border-pink-500/40",   button: "bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white shadow-pink-500/25"   },
}

/* ─── Animated network grid (canvas) ───────────────────────────────────── */
function CyberGrid() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.08 * (1 - dist / 150)})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.fillStyle = `rgba(59, 130, 246, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
}

/* ─── Typewriter hook ──────────────────────────────────────────────────── */
/* typewriter removed — static heading used instead */

/* ─── Stagger-in observer ──────────────────────────────────────────────── */
function useStaggerReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}


/* ═══════════════════════════════════════════════════════════════════════ */
export default function Intro() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeService, setActiveService] = useState(null)
  // Static hero heading
  const servicesReveal = useStaggerReveal()
  const featuresReveal = useStaggerReveal()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800/50 shadow-2xl shadow-blue-900/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-60 blur group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight">NetSec<span className="text-blue-400">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#services" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Services</a>
            <a href="#services" className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40">
              Get Started
            </a>
          </div>
          <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50">
            <div className="max-w-7xl mx-auto px-6 py-4 space-y-3">
              <a href="#features" className="block text-gray-300 hover:text-white py-2 text-sm">Features</a>
              <a href="#services" className="block text-gray-300 hover:text-white py-2 text-sm">Services</a>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Animated network canvas */}
        <CyberGrid />

        {/* Radial gradient overlays */}
        <div className="absolute inset-0 pointer-events-none z-[1]">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="mb-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping-slow" />
              <Sparkles className="w-4 h-4" />
              AI-Powered Security Platform
            </div>

            {/* Main heading with typewriter */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.05] tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Next-Gen
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Cybersecurity
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Protect your digital infrastructure with advanced AI-driven threat detection,
              real-time monitoring, and comprehensive security analysis powered by <span className="text-cyan-400 font-medium">Gemini AI</span>.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#services"
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-lg transition-all duration-300 shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.03]">
                Explore Services
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </a>
              <a href="#features"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-slate-700 hover:border-slate-500 text-gray-300 hover:text-white font-medium text-lg transition-all duration-300 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-800/50">
                Learn More
              </a>
            </div>
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-20">
            {[
              { value: "6", label: "Security Modules", icon: Shield },
              { value: "2", label: "Threat Intel APIs", icon: Wifi },
              { value: "AI", label: "Gemini Powered", icon: Cpu },
            ].map((s, i) => (
              <div key={i} className="group relative bg-slate-900/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-800/50 hover:border-blue-500/30 transition-all duration-300">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <s.icon className="w-8 h-8 text-blue-400/60 mb-3 mx-auto" />
                  <div className="text-3xl font-black text-white mb-1">{s.value}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        
      </section>

      {/* ── Features Section ───────────────────────────────────────── */}
      <section id="features" className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent pointer-events-none" />
        <div ref={featuresReveal.ref} className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium uppercase tracking-widest mb-6">
              <Zap className="w-3.5 h-3.5" /> Core Capabilities
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-5 tracking-tight">
              Why Choose <span className="gradient-text">NetSecAI</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Industry-leading security tools powered by real APIs — no mock data, no placeholders, just results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "AI-Powered Analysis", description: "Gemini explains every finding — risks, attack scenarios, and remediation steps in plain English that anyone can understand.", gradient: "from-yellow-500 to-orange-500", delay: 0 },
              { icon: Lock, title: "Real Backend APIs", description: "Every result comes from live DNS, port scanning, VirusTotal, AbuseIPDB, and Scapy — zero placeholders.", gradient: "from-green-500 to-emerald-500", delay: 150 },
              { icon: Target, title: "6 Specialized Modules", description: "URL, PCAP, Threat Intel, Content, Live Sniffer, and Full Analysis — each purpose-built for specific threat vectors.", gradient: "from-purple-500 to-pink-500", delay: 300 },
            ].map((f, i) => (
              <div
                key={i}
                className={`group relative bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-800/50 hover:border-slate-700/50 transition-all duration-700 hover:-translate-y-2 ${
                  featuresReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${f.delay}ms` }}
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent" />
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${f.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl transition-all duration-500 shadow-lg`}>
                    <f.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{f.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services Grid ──────────────────────────────────────────── */}
      <section id="services" className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent pointer-events-none" />
        <div ref={servicesReveal.ref} className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium uppercase tracking-widest mb-6">
              <Shield className="w-3.5 h-3.5" /> Security Suite
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-5 tracking-tight">
              Our <span className="gradient-text">Services</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Six specialized modules — all wired to real backends, all powered by Gemini AI.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {SERVICES.map((service, idx) => {
              const c = COLOR_MAP[service.color]
              const isActive = activeService === service.title
              return (
                <div
                  key={service.title}
                  className={`group relative bg-slate-900/40 backdrop-blur-sm rounded-3xl p-7 border border-slate-800/50 transition-all duration-700 hover:-translate-y-1 ${c.hover} ${
                    servicesReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${idx * 80}ms` }}
                  onMouseEnter={() => setActiveService(service.title)}
                  onMouseLeave={() => setActiveService(null)}
                >
                  {/* Hover glow */}
                  <div className={`absolute -inset-px rounded-3xl bg-gradient-to-r ${service.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500 blur-sm`} />

                  <div className="relative">
                    {/* Icon + title */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300`}>
                        <service.icon className={`w-7 h-7 ${c.text}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1.5">{service.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${c.bg} ${c.text} ${c.border} border`}>
                          {service.category}
                        </span>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {Object.entries(service.stats).map(([key, val]) => (
                        <div key={key} className={`text-center p-2.5 rounded-xl ${c.bg} border ${c.border}`}>
                          <div className={`text-sm font-bold ${c.text}`}>{val}</div>
                          <div className="text-[10px] text-gray-500 capitalize font-medium">{key}</div>
                        </div>
                      ))}
                    </div>

                    <p className="text-gray-400 text-sm mb-5 leading-relaxed">{service.description}</p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {service.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${c.text}`} style={{ background: 'currentColor' }} />
                          <span className="text-xs text-gray-500">{feat}</span>
                        </div>
                      ))}
                    </div>

                    <Link to={service.path}
                      className={`flex items-center justify-center gap-2.5 w-full px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] ${c.button}`}>
                      <span>Launch {service.title}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="relative bg-slate-900/30 backdrop-blur-sm border-t border-slate-800/50 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">NetSec<span className="text-blue-400">AI</span></span>
                <p className="text-xs text-gray-500">AI-Powered Security Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {SERVICES.slice(0, 4).map(s => (
                <Link key={s.path} to={s.path} className="text-xs text-gray-500 hover:text-gray-300 transition-colors hidden sm:block">
                  {s.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800/50 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs">&copy; 2026 NetSecAI. All rights reserved.</p>
            <p className="text-gray-700 text-xs">Built with FastAPI + React + Gemini AI</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
