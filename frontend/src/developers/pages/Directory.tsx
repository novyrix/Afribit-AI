import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { api, type ConnectorManifest, type ConnectorStatus } from '../../lib/api'
import ConnectorCard from '../ConnectorCard'

type CategoryFilter = 'all' | 'wallet' | 'exchange' | 'on_ramp' | 'data'

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'wallet', label: 'Wallets' },
  { key: 'exchange', label: 'Exchanges' },
  { key: 'on_ramp', label: 'On-ramps' },
  { key: 'data', label: 'Data' },
]

const STATUS_OPTIONS: { value: '' | ConnectorStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'verified', label: 'Verified' },
  { value: 'in_review', label: 'In Review' },
  { value: 'deprecated', label: 'Deprecated' },
  { value: 'community', label: 'Community' },
]

export default function Directory() {
  const [all, setAll] = useState<ConnectorManifest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [status, setStatus] = useState<'' | ConnectorStatus>('')
  const [region, setRegion] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .listConnectors()
      .then((r) => {
        setAll(r.connectors)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const regions = useMemo(() => {
    const set = new Set<string>()
    all.forEach((c) => c.regions.forEach((r) => set.add(r)))
    return Array.from(set).sort()
  }, [all])

  const filtered = useMemo(
    () =>
      all.filter((c) => {
        if (category !== 'all' && c.category !== category) return false
        if (status && c.status !== status) return false
        if (region && !c.regions.includes(region)) return false
        return true
      }),
    [all, category, status, region],
  )

  return (
    <div className="max-w-6xl mx-auto px-5 pt-12 pb-8">
      <div className="mb-8">
        <h1 className="font-brand font-bold text-34 mb-2">Connector Directory</h1>
        <p className="text-15 text-white/55 font-text">
          Browse wallets and infrastructure that implement the SATS Connector spec.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setCategory(t.key)}
              className={`px-3.5 py-2 rounded-pill text-13 font-text transition-colors ${
                category === t.key
                  ? 'bg-white/12 text-white'
                  : 'bg-white/5 text-white/50 hover:text-white/75'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as '' | ConnectorStatus)}
            className="bg-surface border border-white/12 rounded-pill px-3.5 py-2 text-13 font-text text-white/75 outline-none"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-surface border border-white/12 rounded-pill px-3.5 py-2 text-13 font-text text-white/75 outline-none"
          >
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="text-14 text-white/40 font-text">Loading connectors...</p>}
      {error && (
        <p className="text-14 text-negative font-text">Failed to load connectors: {error}</p>
      )}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-14 text-white/40 font-text">No connectors match these filters.</p>
      )}

      <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((c) => (
          <ConnectorCard key={c.id} c={c} />
        ))}
      </motion.div>
    </div>
  )
}
