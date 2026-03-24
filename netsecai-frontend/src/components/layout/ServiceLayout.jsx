import { Outlet, Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Shield, Info } from 'lucide-react'
import { useState } from 'react'
import AboutModal from '../ui/AboutModal'

const PATH_TITLES = {
  'url-analyzer':     'URL Analyzer',
  'pcap-analyzer':    'PCAP Analyzer',
  'threat-intel':     'Threat Intelligence',
  'content-analyzer': 'Content Analyzer',
  'packet-sniffer':   'Packet Sniffer',
  'full-analysis':    'Full Analysis',
}

export default function ServiceLayout() {
  const [showAbout, setShowAbout] = useState(false)
  const location = useLocation()
  const segment = location.pathname.replace(/^\//, '').split('/')[0]
  const serviceType = PATH_TITLES[segment] ? segment : 'url-analyzer'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">NetSecAI</span>
            {PATH_TITLES[segment] && (
              <>
                <span className="text-slate-600 mx-1">/</span>
                <span className="text-gray-400 text-sm">{PATH_TITLES[segment]}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <button onClick={() => setShowAbout(true)}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white transition-colors">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-16 px-6">
        <Outlet />
      </main>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} serviceType={serviceType} />
    </div>
  )
}
