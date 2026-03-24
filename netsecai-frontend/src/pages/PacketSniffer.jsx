import { useState, useEffect, useRef } from 'react'
import { Activity, Play, Square, AlertTriangle, Wifi, RefreshCw, Terminal, AlertCircle, Info, Search, Filter, ExternalLink } from 'lucide-react'
import DashboardCard from '../components/ui/DashboardCard'
import { useNetSec } from '../contexts/NetSecContext'
import { netSecAIService } from '../services/api'

const PROTO_COLORS = {
  TCP: 'text-blue-400', UDP: 'text-cyan-400', ICMP: 'text-yellow-400',
  DNS: 'text-purple-400', IPv6: 'text-pink-400', Other: 'text-gray-400', IP: 'text-gray-400',
}

const SEV_COLORS = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

// Open IP lookup page for the given IP
function openIpLookup(ip) {
  if (!ip || ip === '—') return
  window.open(`https://who.is/whois-ip/ip-address/${ip}`, '_blank')
}

export default function PacketSniffer() {
  const { state, startSniffer, stopSniffer, refreshSniffer } = useNetSec()
  const { running, packets, alerts, protocolStats, totalCaptured } = state.sniffer
  const [iface, setIface] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [snifferError, setSnifferError] = useState(null)
  const [filter, setFilter] = useState('')
  const intervalRef = useRef(null)
  const tableRef = useRef(null)

  // Auto-refresh while running
  useEffect(() => {
    if (running && autoRefresh) {
      intervalRef.current = setInterval(() => refreshSniffer(), 2000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, autoRefresh, refreshSniffer])

  // Auto-scroll packet table
  useEffect(() => {
    if (tableRef.current && autoRefresh) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight
    }
  }, [packets, autoRefresh])

  // Check for sniffer errors periodically when running
  useEffect(() => {
    let errorCheckInterval
    if (running) {
      errorCheckInterval = setInterval(async () => {
        try {
          const resp = await netSecAIService.getSnifferError()
          if (resp.error) {
            setSnifferError(resp.error)
            setAutoRefresh(false)
          }
        } catch (e) {
          // ignore
        }
      }, 3000)
    }
    return () => clearInterval(errorCheckInterval)
  }, [running])

  const handleStart = async () => {
    setSnifferError(null)
    setFilter('')
    await startSniffer(iface || undefined)
    setAutoRefresh(true)
    setTimeout(async () => {
      try {
        const resp = await netSecAIService.getSnifferError()
        if (resp.error) {
          setSnifferError(resp.error)
          setAutoRefresh(false)
        }
      } catch (e) { /* ignore */ }
    }, 2000)
  }

  const handleStop = () => {
    stopSniffer()
    setAutoRefresh(false)
    refreshSniffer()
  }

  const totalProto = Object.values(protocolStats).reduce((a, b) => a + b, 0) || 1

  // Filter packets based on protocol/IP/port filter text
  const filterLower = filter.trim().toLowerCase()
  const filteredPackets = filterLower
    ? packets.filter(p => {
        const proto = (p.protocol || '').toLowerCase()
        const srcIp = (p.src_ip || '').toLowerCase()
        const dstIp = (p.dst_ip || '').toLowerCase()
        const srcPort = String(p.src_port ?? '')
        const dstPort = String(p.dst_port ?? '')
        const info = (p.info || '').toLowerCase()
        return proto.includes(filterLower) ||
               srcIp.includes(filterLower) ||
               dstIp.includes(filterLower) ||
               srcPort.includes(filterLower) ||
               dstPort.includes(filterLower) ||
               info.includes(filterLower)
      })
    : packets

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Real-time Packet Sniffer</h2>
        <p className="text-sm text-slate-400 mt-1">
          Live packet capture with anomaly detection — similar to Wireshark
        </p>
      </div>

      {/* About cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Activity, label: 'Live Capture',     desc: 'Real-time traffic sniffing via Scapy',     color: 'text-green-400', bg: 'bg-green-500/10' },
          { icon: Filter,   label: 'Protocol Filter',  desc: 'Filter by TCP, UDP, DNS, ICMP, IP & more', color: 'text-cyan-400',  bg: 'bg-cyan-500/10'  },
          { icon: AlertTriangle, label: 'Anomaly Detection', desc: 'SYN flood & port scan alerts',       color: 'text-red-400',   bg: 'bg-red-500/10'   },
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

      {/* Sniffer Error Display */}
      {snifferError && (
        <div className="p-5 border border-red-500/30 bg-red-500/5 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Sniffer Error</p>
            <p className="text-sm text-red-300/80 mt-1">{snifferError}</p>
            <button onClick={() => setSnifferError(null)} className="text-xs text-blue-400 hover:underline mt-2">Dismiss</button>
          </div>
        </div>
      )}

      {/* Controls */}
      <DashboardCard title="Sniffer Control" icon={Activity}
        iconColor={running ? 'text-green-400' : 'text-gray-400'} iconBg={running ? 'bg-green-500/10' : 'bg-gray-500/10'}
        badge={running ? 'Live' : 'Stopped'} badgeColor={running ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={iface} onChange={e => setIface(e.target.value)} disabled={running}
            placeholder="Interface (blank = auto)"
            className="flex-1 bg-gray-900/80 border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm mono
              text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 disabled:opacity-50" />
          {!running ? (
            <button onClick={handleStart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white
                transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              <Play className="w-4 h-4" /> Start Capture
            </button>
          ) : (
            <button onClick={handleStop}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white
                transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <Square className="w-4 h-4" /> Stop Capture
            </button>
          )}
          <button onClick={refreshSniffer}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
              bg-slate-800 hover:bg-slate-700 text-gray-300 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
        {running && (
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            <span className="text-xs text-green-400 mono">Capturing… {totalCaptured} packets so far</span>
          </div>
        )}
      </DashboardCard>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Captured', value: totalCaptured, color: 'text-blue-400' },
          { label: 'Packets in View', value: packets.length, color: 'text-cyan-400' },
          { label: 'Active Protocols', value: Object.keys(protocolStats).length, color: 'text-purple-400' },
          { label: 'Alerts', value: alerts.length, color: alerts.length > 0 ? 'text-red-400' : 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-800/50">
            <div className={`text-2xl font-bold mono ${color}`}>{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Protocol distribution */}
      {Object.keys(protocolStats).length > 0 && (
        <DashboardCard title="Protocol Distribution" icon={Wifi} iconColor="text-cyan-400" iconBg="bg-cyan-500/10">
          <div className="flex flex-wrap gap-3">
            {Object.entries(protocolStats).map(([proto, count]) => {
              const pct = ((count / totalProto) * 100).toFixed(1)
              return (
                <div key={proto}
                  onClick={() => setFilter(proto)}
                  className="bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700/50 text-center cursor-pointer hover:border-cyan-500/30 hover:bg-slate-800 transition-all">
                  <span className={`text-lg font-bold mono ${PROTO_COLORS[proto] || 'text-gray-400'}`}>{pct}%</span>
                  <div className="text-xs text-gray-500 uppercase">{proto}</div>
                  <div className="text-xs text-gray-600">{count}</div>
                </div>
              )
            })}
          </div>
        </DashboardCard>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <DashboardCard title={`Security Alerts (${alerts.length})`}
          icon={AlertTriangle} iconColor="text-red-400" iconBg="bg-red-500/10">
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-start justify-between p-4 rounded-xl border ${SEV_COLORS[(a.severity || 'low').toLowerCase()] || SEV_COLORS.low}`}>
                <div>
                  <div className="font-medium text-white text-sm">{a.type?.replace(/_/g, ' ').toUpperCase()}</div>
                  <p className="text-sm text-gray-300 mt-0.5">{a.description}</p>
                  {a.source_ip && <p className="text-xs mono text-gray-500 mt-1">Source: {a.source_ip}</p>}
                </div>
                <span className={`flex-shrink-0 ml-4 text-xs font-bold px-2 py-1 rounded-full border ${SEV_COLORS[(a.severity || 'low').toLowerCase()]}`}>
                  {(a.severity || '').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* Packet stream with filter */}
      <DashboardCard title="Live Packet Stream" icon={Terminal} iconColor="text-green-400" iconBg="bg-green-500/10"
        badge={`${filteredPackets.length}${filter ? ` / ${packets.length}` : ''} packets`} badgeColor="bg-slate-700 text-gray-300">

        {/* Wireshark-style filter bar — shown when not running or has packets */}
        {packets.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filter: type protocol (TCP, UDP, DNS, ICMP), IP address, or port..."
                className={`w-full bg-gray-900/80 border rounded-lg pl-10 pr-4 py-2.5 text-sm mono
                  text-gray-200 placeholder-gray-600 focus:outline-none transition-all
                  ${filter ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-gray-700/50 focus:border-cyan-500/40'}`}
              />
              {filter && (
                <button
                  onClick={() => setFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
                >Clear</button>
              )}
            </div>
            {filter && (
              <p className="text-xs text-cyan-400 mt-1.5 ml-1">
                Showing {filteredPackets.length} of {packets.length} packets matching "{filter}"
              </p>
            )}
          </div>
        )}

        {packets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No packets captured yet.</p>
            <p className="text-xs mt-1">Start the sniffer above to begin capturing.</p>
          </div>
        ) : (
          <div ref={tableRef} className="overflow-auto max-h-96">
            <table className="w-full text-xs mono">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-gray-500 border-b border-slate-800">
                  {['#', 'Src IP', 'Dst IP', 'Proto', 'Src Port', 'Dst Port', 'Length', 'Info'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPackets.map((p, i) => (
                  <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                    <td className="py-1.5 pr-4 text-gray-600">{p.index}</td>
                    <td className="py-1.5 pr-4">
                      {p.src_ip ? (
                        <button
                          onClick={() => openIpLookup(p.src_ip)}
                          className="text-blue-300 hover:text-blue-200 hover:underline flex items-center gap-1 transition-colors"
                          title={`Lookup ${p.src_ip}`}
                        >
                          {p.src_ip}
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                        </button>
                      ) : '—'}
                    </td>
                    <td className="py-1.5 pr-4">
                      {p.dst_ip ? (
                        <button
                          onClick={() => openIpLookup(p.dst_ip)}
                          className="text-cyan-300 hover:text-cyan-200 hover:underline flex items-center gap-1 transition-colors"
                          title={`Lookup ${p.dst_ip}`}
                        >
                          {p.dst_ip}
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                        </button>
                      ) : '—'}
                    </td>
                    <td className={`py-1.5 pr-4 font-semibold ${PROTO_COLORS[p.protocol] || 'text-gray-400'}`}>{p.protocol}</td>
                    <td className="py-1.5 pr-4 text-gray-400">{p.src_port ?? '—'}</td>
                    <td className="py-1.5 pr-4 text-gray-400">{p.dst_port ?? '—'}</td>
                    <td className="py-1.5 pr-4 text-gray-500">{p.length}</td>
                    <td className="py-1.5 pr-4 text-gray-500 max-w-xs truncate">{p.info || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  )
}
