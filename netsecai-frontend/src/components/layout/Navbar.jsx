import { Search, Menu, RefreshCw, Shield, X } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/app/dashboard': 'Dashboard',
  '/app/url-analyzer': 'URL Analyzer',
  '/app/pcap-analyzer': 'PCAP Analyzer',
}

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const [searchVal, setSearchVal] = useState('')
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'NetSecAI'

  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 z-30 flex-shrink-0">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50"
            id="sidebar-toggle"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-auto hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              id="global-search"
              type="text"
              placeholder="Search IPs, domains, alerts..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2
                text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500/50
                focus:bg-slate-800/80 transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            id="navbar-refresh"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
              hover:text-white hover:bg-slate-800/50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* User */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}
