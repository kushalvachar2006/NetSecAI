import { useState, useEffect } from 'react'
import { Shield, Search, AlertTriangle, CheckCircle, XCircle, Loader2, BarChart3 } from 'lucide-react'
import DashboardCard from '../components/ui/DashboardCard'
import AiExplanationCard from '../components/ui/AiExplanationCard'
import { useNetSec } from '../contexts/NetSecContext'

const CATEGORY_CONFIG = {
  clean:      { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  label: 'Clean' },
  phishing:   { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    label: 'Phishing' },
  malware:    { color: 'text-red-500',    bg: 'bg-red-500/15',    border: 'border-red-500/40',    label: 'Malware' },
  spam:       { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Spam' },
  suspicious: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Suspicious' },
  unknown:    { color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   label: 'Unknown' },
}

export default function ThreatIntel() {
  const { state, checkThreat, resetThreatIntel } = useNetSec()
  const { loading, result, error } = state.threatIntel
  const [target, setTarget] = useState('')
  const [explain, setExplain] = useState(false)
  const [inputError, setInputError] = useState('')

  // Reset state on mount so the page always starts fresh
  useEffect(() => { resetThreatIntel() }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!target.trim()) { setInputError('Please enter a URL or IP address'); return }
    setInputError('')
    checkThreat(target.trim(), explain)
  }

  const cat = result ? (CATEGORY_CONFIG[result.threat_category] || CATEGORY_CONFIG.unknown) : null
  const score = result?.reputation_score ?? 0

  const scoreColor =
    score >= 70 ? 'text-red-400' :
    score >= 45 ? 'text-orange-400' :
    score >= 20 ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Threat Intelligence</h2>
        <p className="text-sm text-slate-400 mt-1">
          Check URLs and IPs against VirusTotal and AbuseIPDB
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: Shield, label: 'VirusTotal', desc: 'Malware & reputation database — 70+ engines', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: BarChart3, label: 'AbuseIPDB', desc: 'IP abuse reports & community confidence score', color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map(({ icon: Icon, label, desc, color, bg }) => (
          <div key={label} className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{label}</div>
              <div className="text-xs text-slate-400">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <DashboardCard title="Threat Check" subtitle="Enter a URL or IP to check reputation"
        icon={Shield} iconColor="text-purple-400" iconBg="bg-purple-500/10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Target URL or IP</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text" value={target} onChange={e => { setTarget(e.target.value); setInputError('') }}
                placeholder="https://suspicious-site.com or 1.2.3.4"
                className={`w-full bg-gray-900/80 border rounded-xl pl-11 pr-4 py-3.5 text-sm mono
                  text-gray-200 placeholder-gray-600 focus:outline-none transition-all duration-200
                  ${inputError ? 'border-red-500/50' : 'border-gray-700/50 focus:border-blue-500/60'}`}
              />
            </div>
            {inputError && <p className="text-xs text-red-400 mt-1">{inputError}</p>}
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-xs text-gray-600">Try:</span>
              {['https://example.com', 'https://google.com', '192.168.1.1'].map(ex => (
                <button key={ex} type="button" onClick={() => { setTarget(ex); setInputError('') }}
                  className="text-xs text-blue-400/70 hover:text-blue-400 mono hover:bg-blue-500/10 px-2 py-0.5 rounded transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={explain} onChange={e => setExplain(e.target.checked)}
              className="rounded border-gray-600 bg-gray-900 text-blue-500" />
            <span className="text-sm text-gray-300">Include AI explanation (Gemini)</span>
          </label>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500
              text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
              hover:shadow-[0_0_24px_rgba(139,92,246,0.4)]">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</> : <><Shield className="w-4 h-4" />Check Threat</>}
          </button>
        </form>
      </DashboardCard>

      {error && !loading && (
        <div className="p-5 border border-red-500/30 bg-red-500/5 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Check Failed</p>
            <p className="text-xs text-red-400/70 mt-1">{error}</p>
            <button onClick={resetThreatIntel} className="text-xs text-blue-400 hover:underline mt-2">Try again</button>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Score + category */}
          <DashboardCard title="Reputation Score" icon={BarChart3} iconColor="text-purple-400" iconBg="bg-purple-500/10"
            badge={cat.label} badgeColor={`${cat.bg} ${cat.color}`}>
            <div className="flex items-center gap-8 py-2">
              <div className={`text-6xl font-black mono ${scoreColor}`}>{score}</div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Reputation Score <span className="text-gray-600">(0 = clean, 100 = malicious)</span></div>
                <div className={`text-2xl font-bold ${cat.color}`}>{cat.label.toUpperCase()}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {result.positives} / {result.total_sources} sources flagged
                </div>
              </div>
            </div>
            {/* Score bar */}
            <div className="mt-4 w-full bg-slate-800 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all duration-700 ${
                score >= 70 ? 'bg-red-500' : score >= 45 ? 'bg-orange-500' : score >= 20 ? 'bg-yellow-500' : 'bg-green-500'
              }`} style={{ width: `${score}%` }} />
            </div>
          </DashboardCard>

          {/* Per-source breakdown — "As per VirusTotal: ..." style */}
          <DashboardCard title="Source Results" subtitle="Per-intelligence-source verdict"
            icon={Shield} iconColor="text-blue-400" iconBg="bg-blue-500/10">
            <div className="space-y-4">
              {(result.sources || []).map((src, i) => {
                // Generate "As per Source: ..." note
                const getNote = () => {
                  if (src.category === 'unconfigured') return 'API key not configured — add your key in the backend .env file and restart the server'
                  if (src.category === 'api_error') return 'API returned an error — please try again later'
                  if (src.category === 'error') return 'Could not reach this service — check your internet connection'
                  if (src.category === 'cannot_resolve') return 'Could not resolve IP address from the target URL'
                  if (src.category === 'not_found') return 'This target has not been scanned before'

                  if (src.source === 'VirusTotal' && src.raw?.stats) {
                    const { malicious, suspicious, total } = src.raw
                    if (malicious > 0) return `${malicious} out of ${total} security engines flagged this as malicious, and ${suspicious} flagged it as suspicious`
                    if (suspicious > 0) return `No engines flagged this as malicious, but ${suspicious} out of ${total} flagged it as suspicious`
                    return `None of the ${total} security engines flagged this target — it appears clean`
                  }

                  if (src.source === 'AbuseIPDB' && src.raw) {
                    const conf = src.raw.abuse_confidence_score ?? 0
                    const reports = src.raw.total_reports ?? 0
                    const isp = src.raw.isp || ''
                    const country = src.raw.country || ''
                    let note = `Abuse confidence score is ${conf}% with ${reports} total reports`
                    if (isp) note += ` · ISP: ${isp}`
                    if (country) note += ` · Country: ${country}`
                    if (conf === 0 && reports === 0) note += ' — this IP looks clean'
                    return note
                  }

                  return src.detected ? 'This target was flagged as potentially dangerous' : 'This target appears clean'
                }

                const isError = ['unconfigured', 'api_error', 'error', 'cannot_resolve'].includes(src.category)

                return (
                  <div key={i} className={`p-4 rounded-xl border ${
                    isError ? 'border-yellow-500/30 bg-yellow-500/5' :
                    src.detected ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/20 bg-green-500/5'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isError
                          ? <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          : src.detected
                            ? <XCircle className="w-5 h-5 text-red-400" />
                            : <CheckCircle className="w-5 h-5 text-green-400" />}
                        <span className="text-sm font-bold text-white">As per {src.source}:</span>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isError ? 'bg-yellow-500/20 text-yellow-400' :
                        src.detected ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {isError ? 'N/A' : src.detected ? 'FLAGGED' : 'CLEAN'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{getNote()}</p>
                  </div>
                )
              })}
            </div>
          </DashboardCard>

          {/* AI explanation */}
          <AiExplanationCard explanation={result.ai_explanation} title="AI Threat Analysis" />

          <button onClick={resetThreatIntel} className="text-xs text-blue-400 hover:underline">
            ← Check another target
          </button>
        </div>
      )}
    </div>
  )
}
