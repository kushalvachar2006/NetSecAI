import { useState } from 'react'
import {
  Shield, ShieldAlert, ShieldCheck, Globe,
  AlertTriangle, ExternalLink, Zap
} from 'lucide-react'
import { clsx } from 'clsx'
import AiExplanationCard from './AiExplanationCard'

// ── Risk config ────────────────────────────────────────────────────────────
const riskConfig = {
  Low:      { color: 'text-green-400',  border: 'border-green-500/30',  bg: 'bg-green-500/10',  icon: ShieldCheck, badge: 'bg-green-500/20 text-green-400'  },
  Medium:   { color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', icon: Shield,      badge: 'bg-yellow-500/20 text-yellow-400' },
  High:     { color: 'text-red-400',    border: 'border-red-500/30',    bg: 'bg-red-500/10',    icon: ShieldAlert, badge: 'bg-red-500/20 text-red-400'       },
  Critical: { color: 'text-red-500',    border: 'border-red-500/40',    bg: 'bg-red-500/15',    icon: ShieldAlert, badge: 'bg-red-500/25 text-red-200'       },
}

// ── Main ResultCard ───────────────────────────────────────────────────────
export default function ResultCard({ result }) {
  if (!result) return null

  const severityRaw = result.severity || result.risk || 'Low'
  const severityNormalized = String(severityRaw).toLowerCase()
  const severity =
    severityNormalized === 'critical' ? 'Critical'
    : severityNormalized === 'high'   ? 'High'
    : severityNormalized === 'medium' ? 'Medium'
    : 'Low'

  const cfg = riskConfig[severity] || riskConfig['Low']
  const RiskIcon = cfg.icon

  return (
    <div className="space-y-4">

      {/* Header — URL + risk badge + score bar */}
      <div className={clsx('glass rounded-xl p-5 border', cfg.border)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
              <RiskIcon className={clsx('w-6 h-6', cfg.color)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-100 mono truncate max-w-xs">{result.url || result.target}</h3>
                <a href={result.url} target="_blank" rel="noreferrer"
                  className="text-gray-600 hover:text-blue-400 transition-colors flex-shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-sm text-gray-400 mono">{result.ip_address || result.ip || 'IP resolving…'}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={clsx('text-sm font-bold px-3 py-1 rounded-full', cfg.badge)}>
              {severity} RISK
            </span>
            {result.risk_score !== undefined && (
              <span className="text-xs text-gray-500 mono">{result.risk_score}/100</span>
            )}
          </div>
        </div>
        {result.risk_score !== undefined && (
          <div className="mt-4">
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className={clsx('h-1.5 rounded-full transition-all duration-700',
                  result.risk_score >= 70 ? 'bg-red-500' :
                  result.risk_score >= 45 ? 'bg-orange-500' :
                  result.risk_score >= 20 ? 'bg-yellow-500' : 'bg-green-500'
                )}
                style={{ width: `${result.risk_score}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Vulnerabilities */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h4 className="text-sm font-semibold text-gray-200">Vulnerabilities</h4>
          <span className="ml-auto text-xs text-gray-500 mono">{(result.vulnerabilities || []).length} found</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {(result.vulnerabilities || []).length > 0
            ? result.vulnerabilities.map((vuln, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-200">{vuln.type || vuln.name || vuln}</p>
                    {vuln.severity && (
                      <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded-full mr-1',
                        vuln.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        vuln.severity === 'high'     ? 'bg-orange-500/20 text-orange-400' :
                        vuln.severity === 'medium'   ? 'bg-yellow-500/20 text-yellow-400' :
                                                       'bg-blue-500/20 text-blue-400'
                      )}>{vuln.severity}</span>
                    )}
                    {vuln.description && <p className="text-[10px] text-gray-400 mt-0.5">{vuln.description}</p>}
                  </div>
                </div>
              ))
            : <p className="text-xs text-gray-500 py-2">No vulnerabilities found</p>
          }
        </div>
      </div>

      {/* Attack Vectors */}
      {(result.offensive_vectors || []).length > 0 && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-gray-200">Offensive Attack Vectors</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.offensive_vectors.map((v, i) => {
              const label = typeof v === 'string' ? v : (v.name || v.description || 'Attack vector')
              return (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                  <span className="text-xs text-gray-300 leading-snug">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* AI Explanation */}
      <AiExplanationCard explanation={result.aiExplanation} title="AI Security Analysis" />

    </div>
  )
}