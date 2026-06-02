import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Glass } from '../../components/ui/Glass'
import { Check, Shield } from '../../components/ui/Icons'
import {
  api,
  type ConnectorManifest,
  type ConnectorTestResult,
} from '../../lib/api'
import { AUTH_META, ConnectorLogo } from '../shared'

function ResultRow({
  method,
  ok,
  ms,
  error,
}: {
  method: string
  ok: boolean
  ms: number
  error?: string
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/8 last:border-0">
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-pill shrink-0 ${
          ok ? 'bg-positive/15 text-positive' : 'bg-negative/15 text-negative'
        }`}
      >
        {ok ? <Check size={13} /> : <span className="text-12 leading-none">!</span>}
      </span>
      <code className="text-14 font-numbers text-white/80 flex-1 min-w-0">{method}()</code>
      {error ? (
        <span className="text-12 text-negative font-text truncate max-w-[55%]">{error}</span>
      ) : (
        <span className="text-13 font-numbers text-white/50">{ms}ms</span>
      )}
    </div>
  )
}

export default function Playground() {
  const [connectors, setConnectors] = useState<ConnectorManifest[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [credential, setCredential] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ConnectorTestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listConnectors()
      .then((r) => {
        setConnectors(r.connectors)
        if (r.connectors[0]) setSelectedId(r.connectors[0].id)
      })
      .catch(() => setConnectors([]))
  }, [])

  const selected = useMemo(
    () => connectors.find((c) => c.id === selectedId) ?? null,
    [connectors, selectedId],
  )
  const needsCredential = selected ? selected.auth.type !== 'none' : false

  async function run() {
    if (!selected) return
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const r = await api.testConnector(
        selected.id,
        needsCredential ? credential : undefined,
      )
      setResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 pt-12 pb-8">
      <div className="mb-8">
        <h1 className="font-brand font-bold text-34 mb-2">Playground</h1>
        <p className="text-15 text-white/55 font-text">
          Test any connector with your own credentials before submitting. Calls run the real
          connector against the live provider.
        </p>
      </div>

      <div className="flex items-start gap-3 mb-8 px-4 py-3 rounded-glass bg-positive/8 border border-positive/20">
        <span className="text-positive mt-0.5 shrink-0">
          <Shield size={18} />
        </span>
        <p className="text-13 text-white/70 font-text leading-relaxed">
          Credentials are sent to the SATS backend, used only to run this test, and are never
          stored, logged, or retained after the request completes.
        </p>
      </div>

      <Glass radius="card" className="p-6 space-y-5">
        <div>
          <label className="block text-13 text-white/50 font-text mb-2">Select connector</label>
          <div className="flex items-center gap-3">
            {selected && <ConnectorLogo connector={selected} size={40} />}
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value)
                setResult(null)
                setError(null)
                setCredential('')
              }}
              className="flex-1 bg-surface border border-white/12 rounded-glass px-4 py-3 text-15 font-text text-white outline-none"
            >
              {connectors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {needsCredential && selected && (
          <div>
            <label className="block text-13 text-white/50 font-text mb-2">
              {selected.auth.label ?? AUTH_META[selected.auth.type]}
            </label>
            <input
              type="password"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              placeholder={selected.auth.placeholder ?? ''}
              autoComplete="off"
              className="w-full bg-surface border border-white/12 rounded-glass px-4 py-3 text-15 font-numbers text-white outline-none placeholder:text-white/25"
            />
            {selected.auth.help_url && (
              <a
                href={selected.auth.help_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2 text-13 text-bitcoin font-text"
              >
                How to get credentials
              </a>
            )}
          </div>
        )}

        <button
          onClick={run}
          disabled={running || !selected || (needsCredential && !credential.trim())}
          className="h-12 px-6 w-full inline-flex items-center justify-center rounded-pill bg-bitcoin text-bg font-display font-semibold text-15 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {running ? 'Testing...' : 'Test Connection'}
        </button>
      </Glass>

      {error && (
        <p className="mt-5 text-14 text-negative font-text">Request failed: {error}</p>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="mt-6 space-y-5"
        >
          <Glass radius="card" className="p-6">
            <h2 className="font-brand font-semibold text-18 mb-2">Results</h2>
            {result.results.map((r) => (
              <ResultRow key={r.method} {...r} />
            ))}
          </Glass>

          {result.response && (
            <Glass radius="card" className="p-6">
              <h2 className="font-brand font-semibold text-18 mb-3">Response</h2>
              <pre className="bg-black/40 border border-white/10 rounded-glass p-4 overflow-x-auto text-13 font-numbers text-white/80 leading-relaxed">
                <code>{JSON.stringify(result.response, null, 2)}</code>
              </pre>
            </Glass>
          )}
        </motion.div>
      )}
    </div>
  )
}
