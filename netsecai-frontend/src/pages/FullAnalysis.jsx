import { useState, useEffect } from 'react'
import { Shield, Globe, Zap,Cpu, AlertCircle, Loader2, CheckCircle, Lock, Server, Eye } from 'lucide-react'
import DashboardCard from '../components/ui/DashboardCard'
import AiExplanationCard from '../components/ui/AiExplanationCard'
import { useNetSec } from '../contexts/NetSecContext'

const RISK_CONFIG = {
  low:      { color: 'text-green-400', bar: 'bg-green-500', badge: 'bg-green-500/20 text-green-400' },
  medium:   { color: 'text-yellow-400', bar: 'bg-yellow-500', badge: 'bg-yellow-500/20 text-yellow-400' },
  high:     { color: 'text-orange-400', bar: 'bg-orange-500', badge: 'bg-orange-500/20 text-orange-400' },
  critical: { color: 'text-red-400', bar: 'bg-red-500', badge: 'bg-red-500/20 text-red-400' },
}

function ScoreBar({ label, score, level, icon: Icon, color }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.low
  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-gray-300">{label}</span>
        <span className={`ml-auto text-sm font-bold mono ${cfg.color}`}>{score}/100</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-700 ${cfg.bar}`} style={{ width: `${score}%` }} />
      </div>
      <div className={`text-xs mt-1.5 ${cfg.color}`}>{level?.toUpperCase()}</div>
    </div>
  )
}

export default function FullAnalysis() {
  const { state, runFullAnalysis, resetFullAnalysis } = useNetSec()
  const { loading, result, error } = state.fullAnalysis
  const [url, setUrl] = useState('')
  const [options, setOptions] = useState({ includeThreat: true, includeContent: true, explain: true })
  const [inputError, setInputError] = useState('')

  // Reset state on mount so the page always starts fresh
  useEffect(() => { resetFullAnalysis() }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url.trim()) { setInputError('Please enter a URL'); return }
    setInputError('')
    runFullAnalysis(url.trim(), options)
  }

  const overall = result?.overall_risk_level || 'low'
  const overallCfg = RISK_CONFIG[overall] || RISK_CONFIG.low
  const urlVulns = result?.url_analysis?.vulnerabilities || []
  const threatSources = result?.threat_intel?.sources || []
  const contentFindings = result?.content_analysis?.findings || []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Full Comprehensive Analysis</h2>
        <p className="text-sm text-slate-400 mt-1">
          URL analysis + Threat Intelligence + Content scan + AI executive summary in one shot
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Globe,  label: 'URL Analysis',  desc: 'Port scan, DNS lookup & vulnerability detection', color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
          { icon: Shield, label: 'Threat Intel',   desc: 'Reputation check via VirusTotal & AbuseIPDB',    color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: Eye,    label: 'Content Scan',   desc: 'Phishing forms, XSS, redirects & scripts',      color: 'text-green-400',  bg: 'bg-green-500/10'  },
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

      <DashboardCard title="Launch Full Scan" subtitle="All modules run in parallel"
        icon={Shield} iconColor="text-blue-400" iconBg="bg-blue-500/10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Target URL</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={url} onChange={e => { setUrl(e.target.value); setInputError('') }}
                placeholder="https://target.com"
                className={`w-full bg-gray-900/80 border rounded-xl pl-11 pr-4 py-3.5 text-sm mono
                  text-gray-200 placeholder-gray-600 focus:outline-none transition-all
                  ${inputError ? 'border-red-500/50' : 'border-gray-700/50 focus:border-blue-500/60'}`} />
            </div>
            {inputError && <p className="text-xs text-red-400 mt-1">{inputError}</p>}
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-xs text-gray-600">Try:</span>
              {['https://example.com', 'https://google.com', '192.168.1.1'].map(ex => (
                <button key={ex} type="button" onClick={() => { setUrl(ex); setInputError('') }}
                  className="text-xs text-blue-400/70 hover:text-blue-400 mono hover:bg-blue-500/10 px-2 py-0.5 rounded transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'includeThreat', label: 'Threat Intel', desc: 'VirusTotal + AbuseIPDB', icon: Shield, color: 'text-purple-400' },
              { key: 'includeContent', label: 'Content Scan', desc: 'XSS + phishing forms', icon: Eye, color: 'text-green-400' },
              { key: 'explain', label: 'AI Summary', desc: 'Gemini executive brief', icon: Cpu, color: 'text-cyan-400' },
            ].map(({ key, label, desc, icon: Icon, color }) => (
              <label key={key}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                  ${options[key] ? 'border-blue-500/30 bg-blue-500/5' : 'border-slate-700/50 bg-slate-800/30'}`}>
                <input type="checkbox" checked={options[key]}
                  onChange={e => setOptions(o => ({ ...o, [key]: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-900 text-blue-500" />
                <div>
                  <div className={`text-sm font-semibold ${color} flex items-center gap-1.5`}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </label>
            ))}
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-bold text-sm
              bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-500 hover:via-purple-500 hover:to-cyan-500
              text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
              hover:shadow-[0_0_32px_rgba(59,130,246,0.4)]">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Running full analysis…</>
              : <><Zap className="w-4 h-4" />Launch Comprehensive Scan</>}
          </button>
        </form>
      </DashboardCard>

      {loading && (
        <div className="bg-slate-950/50 rounded-xl p-6 space-y-4">
          {['Running URL analysis…', 'Querying threat intelligence…', 'Scanning webpage content…', 'Generating AI summary…'].map((msg, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
              <span className="text-xs text-blue-400 mono">{msg}</span>
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="p-5 border border-red-500/30 bg-red-500/5 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Analysis Failed</p>
            <p className="text-xs text-red-400/70 mt-1">{error}</p>
            <button onClick={resetFullAnalysis} className="text-xs text-blue-400 hover:underline mt-2">Try again</button>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Overall risk */}
          <div className={`p-6 rounded-2xl border ${overallCfg.badge.replace('text-', 'border-').replace('/20', '/30')} bg-slate-900/50`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Overall Risk Assessment</h3>
              <span className={`px-4 py-1.5 rounded-full font-bold text-sm border ${overallCfg.badge}`}>
                {overall.toUpperCase()}
              </span>
            </div>
            <div className="flex items-end gap-4 mb-4">
              <div className={`text-7xl font-black mono ${overallCfg.color}`}>{result.overall_risk_score}</div>
              <div className="text-gray-400 text-sm pb-2">/ 100 composite risk score</div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all duration-700 ${overallCfg.bar}`}
                style={{ width: `${result.overall_risk_score}%` }} />
            </div>
          </div>

          {/* Per-module scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreBar label="URL Analysis" score={result.url_analysis?.risk_score ?? 0}
              level={result.url_analysis?.risk_level} icon={Globe} color="text-blue-400" />
            {result.threat_intel && (
              <ScoreBar label="Threat Intel" score={result.threat_intel.reputation_score ?? 0}
                level={result.threat_intel.threat_category === 'clean' ? 'low' :
                  result.threat_intel.threat_category === 'malware' ? 'critical' : 'high'}
                icon={Shield} color="text-purple-400" />
            )}
            {result.content_analysis && (
              <ScoreBar label="Content Scan" score={result.content_analysis.risk_score ?? 0}
                level={result.content_analysis.risk_level} icon={Eye} color="text-green-400" />
            )}
          </div>

          {/* URL Vulnerabilities */}
          {urlVulns.length > 0 && (
            <DashboardCard title={`URL Vulnerabilities (${urlVulns.length})`}
              icon={Server} iconColor="text-red-400" iconBg="bg-red-500/10">
              <div className="space-y-2">
                {urlVulns.map((v, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-white">{v.id}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{v.description}</p>
                      <p className="text-xs text-purple-400 mt-0.5 mono">{v.attack_vector}</p>
                    </div>
                    <span className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium
                      ${v.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        v.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'}`}>
                      {v.severity}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* Threat intel summary */}
          {result.threat_intel && (
            <DashboardCard title="Threat Intelligence" icon={Shield} iconColor="text-purple-400" iconBg="bg-purple-500/10"
              badge={result.threat_intel.threat_category} badgeColor="bg-purple-500/20 text-purple-400">
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-black mono ${
                  result.threat_intel.reputation_score >= 50 ? 'text-red-400' : 'text-green-400'}`}>
                  {result.threat_intel.positives}/{result.threat_intel.total_sources}
                </div>
                <div className="text-gray-400 text-sm">sources flagged this target</div>
              </div>
            </DashboardCard>
          )}

          {/* Content findings */}
          {contentFindings.length > 0 && (
            <DashboardCard title={`Content Findings (${contentFindings.length})`}
              icon={Eye} iconColor="text-green-400" iconBg="bg-green-500/10">
              <div className="space-y-2">
                {contentFindings.slice(0, 5).map((f, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-white">{f.type?.replace(/_/g, ' ')}</span>
                      <p className="text-xs text-gray-400">{f.description}</p>
                    </div>
                  </div>
                ))}
                {contentFindings.length > 5 && (
                  <p className="text-xs text-gray-500">+{contentFindings.length - 5} more findings</p>
                )}
              </div>
            </DashboardCard>
          )}

          {/* AI executive summary */}
          <AiExplanationCard explanation={result.executive_summary} title="AI Executive Summary" />

          <button onClick={resetFullAnalysis} className="text-xs text-blue-400 hover:underline">
            ← Run another analysis
          </button>
        </div>
      )}
    </div>
  )
}
