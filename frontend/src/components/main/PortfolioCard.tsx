import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft } from '../ui/Icons'
import { Glass } from '../ui/Glass'
import { api, type Summary, type Transaction } from '../../lib/api'

const SPRING = { type: 'spring' as const, damping: 22, stiffness: 200 }

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="h-12 w-full flex items-center justify-center text-12 text-white/30 font-text">
      Awaiting activity
    </div>
  }
  const w = 280, h = 48
  const min = Math.min(...values), max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / span) * h
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#F7931A" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PortfolioCard({ token }: { token: string }) {
  const [totalSats, setTotalSats] = useState<number | null>(null)
  const [totalKes, setTotalKes] = useState<number | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [series, setSeries] = useState<number[]>([])
  const [reveal, setReveal] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [{ wallets }, sum, txs] = await Promise.all([
          api.listWallets(token),
          api.getSummary(token, 30).catch(() => null),
          api.listTransactions(token, 50).catch(() => ({ transactions: [] as Transaction[], count: 0 })),
        ])
        if (cancelled) return
        if (sum) setSummary(sum)

        let satsSum = 0, kesSum = 0
        for (const w of wallets) {
          try {
            const b = await api.getWalletBalance(token, w.id)
            if (cancelled) return
            satsSum += b.balanceSats
            kesSum += b.balanceKes
          } catch { /* noop */ }
        }
        if (cancelled) return
        setTotalSats(satsSum)
        setTotalKes(kesSum)

        const sorted = [...txs.transactions].sort(
          (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
        )
        let running = 0
        const cumulative: number[] = []
        for (const t of sorted) {
          running += t.direction === 'in' ? t.amountSats : -t.amountSats
          cumulative.push(running)
        }
        setSeries(cumulative)
      } catch (e: unknown) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load')
      }
    }
    load()
    return () => { cancelled = true }
  }, [token])

  return (
    <Glass radius="card" className="w-full p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-text text-13 text-white/50">Total balance</p>
          <motion.div
            key={totalSats ?? -1}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="font-mono font-semibold text-34 text-white mt-1 tabular"
          >
            {totalSats === null ? '—' : reveal
              ? `${totalSats.toLocaleString()}`
              : '••••••'}
            <span className="text-15 text-white/40 ml-2 font-display">sats</span>
          </motion.div>
          {totalKes !== null && reveal && (
            <p className="font-text text-13 text-white/55 mt-1 tabular">
              ≈ KES {Math.round(totalKes).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={() => setReveal((v) => !v)}
          className="text-white/40 hover:text-white/70 transition-colors p-1"
          aria-label="Toggle balance visibility"
        >
          {reveal ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      <div className="mt-4">
        <Sparkline values={series} />
      </div>

      {summary && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <SummaryTile
            icon={<ArrowDownLeft size={16} className="text-positive" />}
            label="In · 30d"
            value={summary.incoming.sats}
          />
          <SummaryTile
            icon={<ArrowUpRight size={16} className="text-negative" />}
            label="Out · 30d"
            value={summary.outgoing.sats}
          />
        </div>
      )}

      {error && (
        <p className="mt-3 font-text text-13 text-negative">{error}</p>
      )}
    </Glass>
  )
}

function SummaryTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-glass bg-white/[0.04] border border-white/10 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-text text-12 text-white/55">{label}</span>
      </div>
      <div className="font-mono text-17 text-white mt-1 tabular">
        {value.toLocaleString()}
      </div>
    </div>
  )
}
