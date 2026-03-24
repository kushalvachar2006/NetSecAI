import { useEffect } from 'react'
import { Globe, Shield, Zap, AlertCircle, Server, Lock } from 'lucide-react'
import DashboardCard from '../components/ui/DashboardCard'
import UrlForm from '../components/ui/UrlForm'
import ResultCard from '../components/ui/ResultCard'
import { useNetSec } from '../contexts/NetSecContext'

export default function UrlAnalyzer() {
  const { state, analyzeUrl, resetUrlAnalysis } = useNetSec()
  const { loading, result, error } = state.urlAnalysis

  // Reset state on mount so the page always starts fresh
  useEffect(() => { resetUrlAnalysis() }, [])

  // Map real FastAPI response → ResultCard shape
  const mapped = result ? {
    url: result.url,
    ip_address: result.ip_address,
    risk_score: result.risk_score,
    severity: result.risk_level,            // "low"|"medium"|"high"|"critical"
    vulnerabilities: (result.vulnerabilities || []).map(v => ({
      name: v.id,
      description: v.description,
      severity: v.severity,
    })),
    open_ports: result.open_ports || [],
    offensive_vectors: (result.vulnerabilities || []).map(v => v.attack_vector).filter(Boolean),
    flags: result.flags || [],
    aiExplanation: result.ai_explanation || null,
  } : null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold gradient-text">URL Analyzer</h2>
        <p className="text-sm text-slate-400 mt-1">
          Deep scan targets for open ports, vulnerabilities, and offensive attack vectors
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Globe,  label: 'IP Lookup',        desc: 'DNS resolution & IP mapping',      color: 'text-blue-400',  bg: 'bg-blue-500/10' },
          { icon: Shield, label: 'Vulnerability Scan', desc: 'Port scan & vulnerability checks', color: 'text-red-400',   bg: 'bg-red-500/10'  },
          { icon: Zap,    label: 'AI Explanation',    desc: 'Gemini-powered risk analysis',     color: 'text-cyan-400',  bg: 'bg-cyan-500/10' },
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

      <DashboardCard title="Target Analysis" subtitle="Enter a URL, domain, or IP address to scan"
        icon={Globe} iconColor="text-blue-400" iconBg="bg-blue-500/10">
        <UrlForm onSubmit={analyzeUrl} loading={loading} />
      </DashboardCard>

      {loading && (
        <div className="bg-slate-950/50 backdrop-blur-sm rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 animate-pulse" />
            <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 bg-slate-800 rounded animate-pulse" style={{ width: `${90 - i * 10}%` }} />
          ))}
          <div className="flex items-center gap-2 pt-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="text-xs text-blue-400 mono animate-pulse">Scanning target...</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-slate-950/50 backdrop-blur-sm rounded-xl p-5 border border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Analysis Failed</p>
            <p className="text-xs text-red-400/70 mt-1">{error}</p>
            <button onClick={resetUrlAnalysis} className="text-xs text-blue-400 hover:underline mt-2">Try again</button>
          </div>
        </div>
      )}

      {mapped && !loading && (
        <>
          {/* Open Ports summary */}
          {mapped.open_ports.length > 0 && (
            <DashboardCard title="Open Ports" subtitle={`${mapped.open_ports.length} ports detected`}
              icon={Server} iconColor="text-yellow-400" iconBg="bg-yellow-500/10">
              <div className="flex flex-wrap gap-2 p-1">
                {mapped.open_ports.map(p => (
                  <span key={p.port}
                    className="px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs mono">
                    {p.port} <span className="text-yellow-500/60">({p.service})</span>
                  </span>
                ))}
              </div>
            </DashboardCard>
          )}

          <DashboardCard title="Scan Results" subtitle={`Analysis complete · ${new Date().toLocaleTimeString()}`}
            icon={Shield} iconColor="text-green-400" iconBg="bg-green-500/10"
            badge="Complete" badgeColor="bg-green-500/20 text-green-400">
            <ResultCard result={mapped} />
            <button onClick={resetUrlAnalysis} className="mt-4 text-xs text-blue-400 hover:underline transition-colors">
              ← Analyze another target
            </button>
          </DashboardCard>
        </>
      )}
    </div>
  )
}
