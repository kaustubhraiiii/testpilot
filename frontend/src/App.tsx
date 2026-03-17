import { useState } from 'react'
import axios from 'axios'

interface TestCase {
  test_name: string
  description: string
  test_type: string
  priority: 'high' | 'medium' | 'low'
  code: string
}

interface GenerateResponse {
  endpoint_count: number
  test_cases: TestCase[]
  framework: string
  generation_time_seconds: number
}

const BADGE_COLORS: Record<string, string> = {
  happy_path: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  missing_required_fields: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  invalid_data_types: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  unauthorized_access: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  boundary_values: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  empty_request_body: 'bg-red-500/20 text-red-400 border border-red-500/30',
  wrong_http_method: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-gray-500/20 text-gray-400',
}

function App() {
  const [specContent, setSpecContent] = useState('')
  const [specFormat, setSpecFormat] = useState<'json' | 'yaml'>('json')
  const [framework, setFramework] = useState<'pytest' | 'jest' | 'playwright' | 'cypress'>('pytest')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleGenerate = async () => {
    if (!specContent.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await axios.post<GenerateResponse>('http://localhost:8000/generate', {
        spec_content: specContent,
        spec_format: specFormat,
        test_framework: framework,
      })
      setResult(res.data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="relative z-10 min-h-screen bg-[#0d1117] text-gray-300 font-['DM_Sans',sans-serif]">
      {/* Error Banner */}
      {error && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-red-900/80 border-b border-red-500/50 px-6 py-3 backdrop-blur-sm">
          <span className="font-['JetBrains_Mono',monospace] text-sm text-red-300">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-400 hover:text-red-200 transition-colors text-xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[#30363d] px-6 py-4 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff8866]" />
        <h1 className="text-lg font-semibold text-gray-100 tracking-tight">TestPilot</h1>
        <span className="text-xs text-gray-500 font-['JetBrains_Mono',monospace]">v0.1.0</span>
      </header>

      {/* Main Split Pane */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* LEFT PANEL */}
        <div className="w-full lg:w-1/2 border-r border-[#30363d] flex flex-col">
          <div className="px-4 py-3 border-b border-[#30363d] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
            <span className="text-xs text-gray-400 font-['JetBrains_Mono',monospace] uppercase tracking-widest">Spec Input</span>
          </div>

          <div className="flex-1 p-4">
            <textarea
              value={specContent}
              onChange={(e) => setSpecContent(e.target.value)}
              placeholder="Paste your OpenAPI/Swagger spec here..."
              className="w-full min-h-[300px] h-full bg-[#0a0e14] text-gray-200 font-['JetBrains_Mono',monospace] text-sm leading-relaxed p-4 rounded-lg border-l-2 border-[#00ff88]/40 border-t border-r border-b border-t-[#30363d] border-r-[#30363d] border-b-[#30363d] resize-none placeholder-gray-600 focus:outline-none focus:border-l-[#00ff88] focus:shadow-[inset_0_0_20px_rgba(0,255,136,0.03)] transition-all"
            />
          </div>

          <div className="px-4 pb-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1.5 font-['JetBrains_Mono',monospace] uppercase tracking-wider">Format</label>
                <select
                  value={specFormat}
                  onChange={(e) => setSpecFormat(e.target.value as 'json' | 'yaml')}
                  className="w-full bg-[#161b22] text-gray-200 text-sm border border-[#30363d] rounded-md px-3 py-2 font-['JetBrains_Mono',monospace] focus:outline-none focus:border-[#00ff88]/50 cursor-pointer appearance-none"
                >
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1.5 font-['JetBrains_Mono',monospace] uppercase tracking-wider">Framework</label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value as typeof framework)}
                  className="w-full bg-[#161b22] text-gray-200 text-sm border border-[#30363d] rounded-md px-3 py-2 font-['JetBrains_Mono',monospace] focus:outline-none focus:border-[#00ff88]/50 cursor-pointer appearance-none"
                >
                  <option value="pytest">pytest</option>
                  <option value="jest">jest</option>
                  <option value="playwright">playwright</option>
                  <option value="cypress">cypress</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !specContent.trim()}
              className="w-full py-2.5 rounded-md font-semibold text-sm tracking-wide transition-all duration-200 cursor-pointer disabled:cursor-not-allowed bg-[#00ff88] text-[#0d1117] hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:brightness-100 disabled:hover:scale-100 shadow-[0_0_20px_rgba(0,255,136,0.15)] hover:shadow-[0_0_30px_rgba(0,255,136,0.3)]"
            >
              {loading ? 'Generating...' : 'Generate Test Cases'}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-1/2 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs text-gray-400 font-['JetBrains_Mono',monospace] uppercase tracking-widest">Output</span>
            </div>
            {result && (
              <span className="text-xs text-gray-500 font-['JetBrains_Mono',monospace]">
                {result.test_cases.length} tests &middot; {result.endpoint_count} endpoints &middot; {result.generation_time_seconds}s
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Empty State */}
            {!loading && !result && (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 font-['JetBrains_Mono',monospace] text-sm text-center">
                  Paste a spec and click Generate
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="font-['JetBrains_Mono',monospace] text-sm text-gray-500">
                  <span className="text-[#00ff88]">$</span> generating test cases
                  <span className="terminal-cursor" />
                </div>
                <p className="text-xs text-gray-600 font-['JetBrains_Mono',monospace]">
                  This may take 30-60 seconds...
                </p>
              </div>
            )}

            {/* Results */}
            {result && result.test_cases.map((tc, i) => (
              <div
                key={i}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,136,0.08)] hover:border-[#00ff88]/30 group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-['JetBrains_Mono',monospace] text-sm text-gray-100 font-medium break-all">
                    {tc.test_name}
                  </h3>
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-['JetBrains_Mono',monospace] uppercase ${PRIORITY_COLORS[tc.priority] || PRIORITY_COLORS.low}`}>
                    {tc.priority}
                  </span>
                </div>

                <p className="text-sm text-gray-400 mb-3">{tc.description}</p>

                <div className="mb-3">
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-['JetBrains_Mono',monospace] ${BADGE_COLORS[tc.test_type] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                    {tc.test_type}
                  </span>
                </div>

                <div className="relative">
                  <pre className="bg-[#0a0e14] rounded-md p-3 overflow-x-auto text-xs leading-relaxed">
                    <code className="font-['JetBrains_Mono',monospace] text-gray-300">{tc.code}</code>
                  </pre>
                  <button
                    onClick={() => copyCode(tc.code, i)}
                    className="absolute top-2 right-2 text-[10px] font-['JetBrains_Mono',monospace] px-2 py-1 rounded bg-[#161b22] border border-[#30363d] text-gray-400 hover:text-[#00ff88] hover:border-[#00ff88]/50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    {copiedIndex === i ? '✓ Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
