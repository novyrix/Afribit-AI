import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Glass } from '../../components/ui/Glass'
import {
  api,
  type ConnectorHealth,
  type ConnectorHealthStatus,
} from '../../lib/api'

const STATUS_META: Record<ConnectorHealthStatus, { label: string; color: string }> = {
  online: { label: 'Online', color: '#00C896' },
  slow: { label: 'Slow', color: '#F7931A' },
  offline: { label: 'Offline', color: '#FF4D4D' },
  unknown: { label: 'Unknown', color: '#8A8A93' },
}

function relativeTime(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  return `${h}h ago`
}

function StatusDot({ status }: { status: ConnectorHealthStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-2 h-2 rounded-pill" style={{ background: meta.color }} />
      <span className="text-14 font-text" style={{ color: meta.color }}>
        {meta.label}
      </span>
    </span>
  )
}

function Row({ c }: { c: ConnectorHealth }) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr] items-center gap-3 px-4 py-3.5 border-b border-white/8 last:border-0">
      <span className="font-text text-15 text-white/85 truncate">{c.name}</span>
      <StatusDot status={c.status} />
      <span className="font-numbers text-14 text-white/60 text-right">
        {c.latencyMs != null ? `${c.latencyMs}ms` : '—'}
      </span>
      <span className="font-numbers text-14 text-white/60 text-right">
        {c.uptime != null ? `${(c.uptime * 100).toFixed(1)}%` : '—'}
      </span>
    </div>
  )
}

export default function Status() {
  const [connectors, setConnectors] = useState<ConnectorHealth[]>([])
  const [checkedAt, setCheckedAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = () =>
      api
        .getConnectorHealth()
        .then((r) => {
          if (!active) return
          setConnectors(r.connectors)
          setCheckedAt(r.checkedAt)
          setError(null)
        })
        .catch((e: Error) => active && setError(e.message))
        .finally(() => active && setLoading(false))
    load()
    const t = setInterval(load, 30000)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-5 pt-12 pb-8">
      <div className="mb-8">
        <h1 className="font-brand font-bold text-34 mb-2">Network Health</h1>
        <p className="text-15 text-white/55 font-text">
          Live status of every connector in the SATS network. Health checks run on the SATS
          backend and call each connector's ping method.
        </p>
        {checkedAt && (
          <p className="text-13 text-white/40 font-text mt-2">
            Last checked {relativeTime(checkedAt)}
          </p>
        )}
      </div>

      {loading && <p className="text-14 text-white/40 font-text">Loading status...</p>}
      {error && <p className="text-14 text-negative font-text">Failed to load: {error}</p>}

      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
        >
          <Glass radius="card" className="overflow-hidden">
            <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr] gap-3 px-4 py-3 border-b border-white/10 text-12 font-text text-white/40 uppercase tracking-wide">
              <span>Connector</span>
              <span>Status</span>
              <span className="text-right">Latency</span>
              <span className="text-right">Uptime</span>
            </div>
            {connectors.map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </Glass>

          <p className="text-12 text-white/35 font-text mt-4 leading-relaxed">
            Uptime is measured from samples collected since the last backend restart. Connectors
            requiring credentials show as Unknown until test credentials are configured on the
            network.
          </p>
        </motion.div>
      )}
    </div>
  )
}
