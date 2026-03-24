import React, { useRef, useState } from 'react'
import { usePcapAnalysis } from '../../hooks/usePcapAnalysis'
import { Upload, FileText, AlertCircle, CheckCircle, Activity, Wifi, Shield, Cpu } from 'lucide-react'
import AiExplanationCard from '../ui/AiExplanationCard'

const riskColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/50',
  medium:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  low:      'bg-green-500/20 text-green-400 border-green-500/50',
}

function StatBox({ label, value, color = 'text-blue-400' }) {
  return (
    <div className="text-center bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}

export function PCAPUpload() {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [explain, setExplain] = useState(false)
  const { loading, result, error, uploadProgress, analyzePcap, reset, formatFileSize, hasResult, hasError } = usePcapAnalysis()

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    if (e.dataTransfer.files?.[0]) analyzePcap(e.dataTransfer.files[0], explain)
  }
  const handleChange = (e) => { if (e.target.files?.[0]) analyzePcap(e.target.files[0], explain) }

  if (hasResult && result) {
    const riskLevel = (result.risk_level || 'low').toLowerCase()
    const riskClass = riskColors[riskLevel] || riskColors.low
    const totalPackets = result.total_packets || 0
    const anomalyCount = (result.anomalies || []).length
    const topTalkers = result.top_talkers || []

    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold gradient-text">PCAP Analysis Results</h2>
            <p className="text-sm text-slate-400 mt-1">Deep packet inspection complete</p>
          </div>
          <button onClick={reset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
            Analyze Another File
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Total Packets" value={totalPackets.toLocaleString()} color="text-blue-400" />
          <StatBox label="Duration (s)" value={result.duration_seconds?.toFixed(2) ?? '—'} color="text-cyan-400" />
          <StatBox label="Abnormal" value={anomalyCount} color={anomalyCount > 0 ? 'text-red-400' : 'text-green-400'} />
          <StatBox label="Risk Score" value={`${result.risk_score ?? 0}/100`}
            color={result.risk_score >= 70 ? 'text-red-400' : result.risk_score >= 45 ? 'text-orange-400' : result.risk_score >= 20 ? 'text-yellow-400' : 'text-green-400'} />
        </div>

        {/* Risk badge */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Risk Level:</span>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${riskClass}`}>
            {riskLevel.toUpperCase()}
          </span>
        </div>

        {/* Protocol Distribution */}
        {result.protocols && Object.keys(result.protocols).length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" /> Protocol Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(result.protocols).map(([proto, count]) => {
                const pct = totalPackets > 0 ? ((count / totalPackets) * 100).toFixed(1) : 0
                return (
                  <div key={proto} className="text-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-xl font-bold text-blue-400">{pct}%</div>
                    <div className="text-xs text-gray-400 uppercase">{proto}</div>
                    <div className="text-xs text-gray-600">{count.toLocaleString()} pkts</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top Talkers */}
        {topTalkers.length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-cyan-400" /> Top Talkers
            </h3>
            <div className="space-y-2">
              {topTalkers.slice(0, 8).map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <span className="mono text-sm text-white">{t.ip}</span>
                  <span className="text-sm text-cyan-400 mono">{t.packets.toLocaleString()} pkts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anomalies */}
        {(result.anomalies || []).length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-red-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" /> Abnormality Detected
            </h3>
            <div className="space-y-3">
              {result.anomalies.map((a, i) => {
                const sevClass = riskColors[(a.severity || 'low').toLowerCase()] || riskColors.low
                return (
                  <div key={i} className="bg-slate-800/50 p-4 rounded-lg border border-red-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white text-sm">{a.type?.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sevClass}`}>
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{a.description}</p>
                    {a.source_ip && <p className="text-xs mono text-gray-500 mt-1">Source: {a.source_ip}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Packet Table — 10 visible rows, scroll for up to 50 */}
        {(result.packets || []).length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" /> Packet Sample ({Math.min(result.packets.length, 50)} packets)
            </h3>
            <div className="overflow-auto max-h-[340px]">
              <table className="w-full text-xs mono">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="text-gray-500 border-b border-slate-800">
                    {['#', 'Src IP', 'Dst IP', 'Protocol', 'Src Port', 'Dst Port', 'Length'].map(h => (
                      <th key={h} className="text-left py-2 pr-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.packets.slice(0, 50).map((p, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-1.5 pr-4 text-gray-500">{p.index}</td>
                      <td className="py-1.5 pr-4 text-blue-300">{p.src_ip || '—'}</td>
                      <td className="py-1.5 pr-4 text-cyan-300">{p.dst_ip || '—'}</td>
                      <td className="py-1.5 pr-4 text-purple-300">{p.protocol}</td>
                      <td className="py-1.5 pr-4 text-gray-400">{p.src_port ?? '—'}</td>
                      <td className="py-1.5 pr-4 text-gray-400">{p.dst_port ?? '—'}</td>
                      <td className="py-1.5 pr-4 text-gray-400">{p.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.packets.length > 10 && (
              <p className="text-xs text-gray-500 mt-2 text-center">↕ Scroll to see all {Math.min(result.packets.length, 50)} packets</p>
            )}
          </div>
        )}

        {/* AI Explanation */}
        <AiExplanationCard explanation={result.ai_explanation} title="AI Network Analysis" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 shadow-xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">PCAP File Analysis</h2>
            <p className="text-gray-400">Upload your packet capture file for deep security analysis</p>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-500/5' : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <input ref={fileInputRef} type="file" accept=".pcap,.pcapng,.cap"
              onChange={handleChange} className="hidden" />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="mb-4">
              <p className="text-white font-medium mb-2">
                Drop your PCAP file here, or{' '}
                <button onClick={() => fileInputRef.current?.click()}
                  className="text-blue-400 hover:text-blue-300 underline" disabled={loading}>
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-400">Supports .pcap, .pcapng and .cap files up to 50MB</p>
            </div>
            {loading && (
              <div className="mt-6">
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress || 10}%` }} />
                </div>
                <p className="text-sm text-gray-400">Analyzing… {uploadProgress || ''}%</p>
              </div>
            )}
          </div>

          {/* AI Explanation Checkbox */}
          <div className="mt-5">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
              <input type="checkbox" checked={explain} onChange={e => setExplain(e.target.checked)}
                className="rounded border-gray-600 bg-gray-900 text-blue-500 w-4 h-4" />
              <div>
                <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Include AI explanation (Gemini)
                </span>
                <p className="text-xs text-gray-500 mt-0.5">Get a plain-language explanation of what the PCAP file contains</p>
              </div>
            </label>
          </div>

          {hasError && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <h4 className="text-red-400 font-medium mb-1">Analysis Failed</h4>
                <p className="text-sm text-gray-300">{error}</p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">What We Analyze</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Packet Analysis', desc: 'Deep packet inspection & protocol distribution' },
                { icon: AlertCircle, color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'Threat Detection', desc: 'SYN flood, port scan, ICMP flood detection' },
                { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', title: 'Security Insights', desc: 'AI-powered anomaly explanations & tips' },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <div className="text-xs text-slate-400">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
