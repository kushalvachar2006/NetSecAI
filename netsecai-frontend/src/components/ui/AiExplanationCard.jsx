import { useState } from 'react'
import {
  Cpu, ChevronDown, ChevronUp, BookOpen,
  AlertTriangle, CheckCircle, Sparkles
} from 'lucide-react'

// ── Parse markdown AI response into structured sections ───────────────────

function parseAiResponse(raw) {
  if (!raw || typeof raw !== 'string') return null

  const sections = { summary: [], keyRisks: [], recommendations: [], extra: [] }
  const lines = raw.split('\n')
  let current = 'summary'

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Detect section headers (## Summary, ## Key Risks, ## Recommendations, etc.)
    const headerMatch = line.match(/^#{1,3}\s+(.+)/)
    if (headerMatch) {
      const heading = headerMatch[1].toLowerCase()
      if (/summary|overview|executive/.test(heading)) {
        current = 'summary'
      } else if (/risk|threat|concern|issue|danger|warning/.test(heading)) {
        current = 'keyRisks'
      } else if (/recommend|action|mitigation|remediation|step|what.*do|next/.test(heading)) {
        current = 'recommendations'
      } else if (/happening|traffic|pattern/.test(heading)) {
        current = 'extra'
      } else {
        current = 'extra'
      }
      continue
    }

    // Also detect bold headings like **Summary** on their own line
    const boldMatch = line.match(/^\*\*([^*]+)\*\*\s*:?\s*$/)
    if (boldMatch) {
      const heading = boldMatch[1].toLowerCase()
      if (/summary|overview|executive/.test(heading)) {
        current = 'summary'
      } else if (/risk|threat|concern|issue|danger|warning/.test(heading)) {
        current = 'keyRisks'
      } else if (/recommend|action|mitigation|remediation|step|what.*do|next/.test(heading)) {
        current = 'recommendations'
      } else if (/happening|traffic|pattern/.test(heading)) {
        current = 'extra'
      }
      continue
    }

    // Clean up bullet markers
    const cleaned = line
      .replace(/^[-•*]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .trim()

    if (!cleaned) continue

    sections[current].push(cleaned)
  }

  return {
    summary: sections.summary.join(' '),
    keyRisks: sections.keyRisks,
    recommendations: sections.recommendations,
    extra: sections.extra,
  }
}

// ── Render inline markdown (bold, code) ───────────────────────────────────

function RichText({ text }) {
  // Handle **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-700/60 text-cyan-300 text-[11px] font-mono">{part.slice(1, -1)}</code>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// ── Main AI Explanation Card Component ─────────────────────────────────────

export default function AiExplanationCard({ explanation, title = "AI Security Analysis" }) {
  const [expanded, setExpanded] = useState(true)

  if (!explanation) return null

  const parsed = typeof explanation === 'string'
    ? parseAiResponse(explanation)
    : null

  // If parsing failed, show raw text
  if (!parsed || (!parsed.summary && !parsed.keyRisks.length && !parsed.recommendations.length && !parsed.extra.length)) {
    return (
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm font-semibold text-gray-200">{title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium">
              Gemini AI
            </span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {expanded && (
          <div className="border-t border-cyan-500/10 px-5 py-4 max-h-[420px] overflow-y-auto">
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
              {typeof explanation === 'string' ? explanation : JSON.stringify(explanation, null, 2)}
            </p>
          </div>
        )}
      </div>
    )
  }

  const hasRisks = parsed.keyRisks.length > 0
  const hasRecs = parsed.recommendations.length > 0
  const hasExtra = parsed.extra.length > 0

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-sm font-semibold text-gray-200">{title}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 font-medium">
            Gemini AI
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-cyan-500/10 max-h-[480px] overflow-y-auto">

          {/* Summary */}
          {parsed.summary && (
            <div className="px-5 py-4 border-b border-slate-700/30">
              <div className="flex items-center gap-2 mb-2.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <h5 className="text-xs font-bold text-cyan-400 tracking-wider uppercase">Summary</h5>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-normal break-words">
                <RichText text={parsed.summary} />
              </p>
            </div>
          )}

          {/* Extra section (e.g., "What's Happening in This Traffic") */}
          {hasExtra && (
            <div className="px-5 py-4 border-b border-slate-700/30">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <h5 className="text-xs font-bold text-blue-400 tracking-wider uppercase">Details</h5>
              </div>
              <ul className="space-y-2">
                {parsed.extra.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <span className="text-xs text-gray-300 leading-relaxed whitespace-normal break-words">
                      <RichText text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Risks */}
          {hasRisks && (
            <div className="px-5 py-4 border-b border-slate-700/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <h5 className="text-xs font-bold text-red-400 tracking-wider uppercase">Key Risks</h5>
                <span className="ml-auto text-xs text-gray-600 font-mono">{parsed.keyRisks.length} identified</span>
              </div>
              <ul className="space-y-2">
                {parsed.keyRisks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/5 border border-red-500/15 hover:bg-red-500/8 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-red-400">{i + 1}</span>
                    </div>
                    <span className="text-xs text-gray-300 leading-relaxed whitespace-normal break-words">
                      <RichText text={risk} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {hasRecs && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <h5 className="text-xs font-bold text-green-400 tracking-wider uppercase">Recommendations</h5>
                <span className="ml-auto text-xs text-gray-600 font-mono">{parsed.recommendations.length} steps</span>
              </div>
              <ul className="space-y-2">
                {parsed.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-green-500/5 border border-green-500/15 hover:bg-green-500/8 transition-colors">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mt-0.5">
                      <span className="text-[9px] font-bold text-green-400">{i + 1}</span>
                    </div>
                    <span className="text-xs text-gray-300 leading-relaxed whitespace-normal break-words">
                      <RichText text={rec} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
