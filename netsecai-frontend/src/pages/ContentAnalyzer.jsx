import { useState, useEffect } from 'react'
import { Globe, Eye, AlertTriangle, Loader2, CheckCircle, Code, ExternalLink } from 'lucide-react'
import DashboardCard from '../components/ui/DashboardCard'
import AiExplanationCard from '../components/ui/AiExplanationCard'
import { useNetSec } from '../contexts/NetSecContext'

const SEV_CONFIG = {
  critical: { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30'    },
  high:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  medium:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  low:      { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'   },
}

const FINDING_ICONS = {
  phishing_form:             '🎣',
  insecure_credential_form:  '🔓',
  possible_xss:              '⚡',
  hidden_redirect:           '↪️',
  suspicious_iframe:         '🖼️',
  code_obfuscation:          '🌀',
  suspicious_external_script:'📜',
}

export default function ContentAnalyzer() {
  const { state, analyzeContent, resetContentAnalysis } = useNetSec()
  const { loading, result, error } = state.contentAnalysis
  const [url, setUrl] = useState('')
  const [inputError, setInputError] = useState('')

  // Reset state on mount so the page always starts fresh
  useEffect(() => { resetContentAnalysis() }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url.trim()) { setInputError('Please enter a URL'); return }
    setInputError('')
    analyzeContent(url.trim())
  }

  const riskScore = result?.risk_score ?? 0
  const scoreColor =
    riskScore >= 70 ? 'text-red-400' :
    riskScore >= 45 ? 'text-orange-400' :
    riskScore >= 20 ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Webpage Content Analyzer</h2>
        <p className="text-sm text-slate-400 mt-1">
          Detect phishing forms, XSS patterns, hidden redirects, and suspicious scripts
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { icon: Eye,    label: 'Phishing Forms',   desc: 'Detects credential-stealing forms',  color: 'text-red-400',    bg: 'bg-red-500/10'    },
          { icon: Code,   label: 'XSS Detection',    desc: 'Finds cross-site scripting patterns', color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { icon: ExternalLink, label: 'Hidden Redirects', desc: 'Uncovers sneaky URL redirects', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { icon: Globe,  label: 'Script Analysis',  desc: 'Inspects external & obfuscated JS',  color: 'text-purple-400', bg: 'bg-purple-500/10' },
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

      <DashboardCard title="Analyze Webpage" subtitle="Enter a URL to fetch and analyze its content"
        icon={Globe} iconColor="text-green-400" iconBg="bg-green-500/10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Target URL</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={url} onChange={e => { setUrl(e.target.value); setInputError('') }}
                placeholder="https://target-website.com"
                className={`w-full bg-gray-900/80 border rounded-xl pl-11 pr-4 py-3.5 text-sm mono
                  text-gray-200 placeholder-gray-600 focus:outline-none transition-all duration-200
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
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500
              text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
              hover:shadow-[0_0_24px_rgba(34,197,94,0.4)]">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Scanning…</> : <><Eye className="w-4 h-4" />Analyze Content</>}
          </button>
        </form>
      </DashboardCard>

      {loading && (
        <div className="bg-slate-950/50 rounded-xl p-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-3 bg-slate-800 rounded animate-pulse" style={{ width: `${80 - i * 15}%` }} />
          ))}
          <div className="flex items-center gap-2 pt-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-xs text-green-400 mono animate-pulse">Fetching and analyzing webpage…</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-5 border border-red-500/30 bg-red-500/5 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Analysis Failed</p>
            <p className="text-xs text-red-400/70 mt-1">{error}</p>
            <button onClick={resetContentAnalysis} className="text-xs text-blue-400 hover:underline mt-2">Try again</button>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Page meta */}
          <DashboardCard title="Page Overview" icon={Globe} iconColor="text-blue-400" iconBg="bg-blue-500/10"
            badge={`${result.status_code}`}
            badgeColor={result.status_code === 200 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Risk Score',       value: `${riskScore}/100`,                      color: scoreColor },
                { label: 'Risk Level',       value: result.risk_level?.toUpperCase() ?? '—', color: scoreColor },
                { label: 'Findings',         value: (result.findings || []).length,           color: 'text-orange-400' },
                { label: 'Content Length',   value: `${Math.round((result.content_length || 0) / 1024)} KB`, color: 'text-gray-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className={`text-xl font-bold mono ${color}`}>{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
            {result.title && <p className="text-sm text-gray-400 mt-3">Page title: <span className="text-white">{result.title}</span></p>}
            {result.redirects?.length > 0 && (
              <div className="mt-3 text-xs text-yellow-400 mono">
                Redirect chain: {result.redirects.join(' → ')}
              </div>
            )}
          </DashboardCard>

          {/* Security findings */}
          {(result.findings || []).length > 0 && (
            <DashboardCard title={`Security Findings (${result.findings.length})`}
              icon={AlertTriangle} iconColor="text-red-400" iconBg="bg-red-500/10">
              <div className="space-y-3">
                {result.findings.map((f, i) => {
                  const cfg = SEV_CONFIG[(f.severity || 'low').toLowerCase()] || SEV_CONFIG.low
                  const emoji = FINDING_ICONS[f.type] || '⚠️'
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">{emoji} {f.type?.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color} ${cfg.border}`}>
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{f.description}</p>
                      {f.evidence && (
                        <code className="block mt-2 text-xs bg-slate-900/60 rounded p-2 text-gray-400 break-all">{f.evidence}</code>
                      )}
                      {f.line && <p className="text-xs text-gray-600 mt-1">Line {f.line}</p>}
                    </div>
                  )
                })}
              </div>
            </DashboardCard>
          )}

          {(result.findings || []).length === 0 && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-300">No security findings detected on this page.</span>
            </div>
          )}

          {/* Forms */}
          {(result.forms || []).length > 0 && (
            <DashboardCard title={`Forms Detected (${result.forms.length})`}
              icon={Code} iconColor="text-yellow-400" iconBg="bg-yellow-500/10">
              <div className="space-y-3">
                {result.forms.map((form, i) => (
                  <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-gray-300 font-mono">{form.method}</span>
                      {form.action && <span className="text-xs text-gray-400 mono truncate">{form.action}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {form.inputs.map((inp, j) => (
                        <span key={j} className={`text-xs px-2 py-0.5 rounded border mono
                          ${inp.type === 'password' ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-slate-700/50 text-gray-400 border-slate-600/50'}`}>
                          {inp.name || inp.type}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* External scripts */}
          {(result.external_scripts || []).length > 0 && (
            <DashboardCard title={`External Scripts (${result.external_scripts.length})`}
              icon={Code} iconColor="text-purple-400" iconBg="bg-purple-500/10">
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {result.external_scripts.map((src, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs mono text-gray-400 hover:text-gray-200 transition-colors">
                    <ExternalLink className="w-3 h-3 flex-shrink-0 text-gray-600" />
                    <span className="truncate">{src}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* AI explanation */}
          <AiExplanationCard explanation={result.ai_explanation} title="AI Content Analysis" />

          <button onClick={resetContentAnalysis} className="text-xs text-blue-400 hover:underline">
            ← Analyze another URL
          </button>
        </div>
      )}
    </div>
  )
}
