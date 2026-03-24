import { useState } from 'react'
import { Globe, Search, Loader2 } from 'lucide-react'

export default function UrlForm({ onSubmit, loading }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const validate = (val) => {
    if (!val.trim()) return 'Please enter a URL or IP address'
    try {
      const u = val.startsWith('http') ? val : `https://${val}`
      new URL(u)
      return ''
    } catch {
      // allow plain IPs
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/
      if (ipRegex.test(val.trim())) return ''
      return 'Enter a valid URL (e.g. https://example.com) or IP address'
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = validate(url)
    if (err) { setError(err); return }
    setError('')
    onSubmit(url.trim())
  }

  const examples = ['https://example.com', 'https://google.com', '192.168.1.1']

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="url-input" className="text-sm font-medium text-gray-300">
          Target URL or IP Address
        </label>
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={e => { setUrl(e.target.value); setError('') }}
            placeholder="https://target.com or 192.168.1.1"
            className={`w-full bg-gray-900/80 border rounded-xl pl-11 pr-4 py-3.5 text-sm
              text-gray-200 placeholder-gray-600 focus:outline-none mono
              transition-all duration-200 ${error
                ? 'border-red-500/50 focus:border-red-500/80'
                : 'border-gray-700/50 focus:border-blue-500/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
              }`}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>

      {/* Quick examples */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-600">Try:</span>
        {examples.map(ex => (
          <button
            key={ex}
            type="button"
            onClick={() => { setUrl(ex); setError('') }}
            className="text-xs text-blue-400/70 hover:text-blue-400 mono hover:bg-blue-500/10
              px-2 py-0.5 rounded transition-all"
          >
            {ex}
          </button>
        ))}
      </div>

      <button
        id="analyze-url-btn"
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl
          font-semibold text-sm transition-all duration-200
          bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500
          text-white disabled:opacity-50 disabled:cursor-not-allowed
          hover:shadow-[0_0_24px_rgba(59,130,246,0.4)]
          active:scale-[0.98]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Analyze Target
          </>
        )}
      </button>
    </form>
  )
}
