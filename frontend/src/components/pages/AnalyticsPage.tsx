import { useEffect, useMemo, useState } from 'react'
import { PageShell, SectionLabel, EmptyState } from './PageShell'
import { api, type Summary, type Transaction } from '../../lib/api'

type Period = { label: string; days: number }
const PERIODS: Period[] = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'All', days: 3650 },
]

const DONUT_COLORS = ['#F7931A', '#00C896', '#5B8DEF', '#B57BFF', '#FF6B6B', '#54657a']

export function AnalyticsPage({ token, onBack }: { token: string; onBack: () => void }) {
  const [period, setPeriod] = useState<Period>(PERIODS[1])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [txs, setTxs] = useState<Transaction[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSummary(null)
    Promise.all([
      api.getSummary(token, period.days).catch(() => null),
      api.listTransactions(token, 200).catch(() => ({ transactions: [] as Transaction[], count: 0 })),
    ]).then(([sum, t]) => {
      if (cancelled) return
      setSummary(sum)
      setTxs(t.transactions)
    }).catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load') })
    return () => { cancelled = true }
  }, [token, period])

  const since = Date.now() - period.days * 86400000
  const windowTxs = useMemo(
    () => (txs ?? []).filter((t) => new Date(t.occurredAt).getTime() >= since),
    [txs, since],
  )

  const series = useMemo(() => {
    const sorted = [...windowTxs].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
    let running = 0
    return sorted.map((t) => {
      running += t.direction === 'in' ? t.amountSats : -t.amountSats
      return running
    })
  }, [windowTxs])

  const topSources = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of windowTxs) {
      if (t.direction !== 'out') continue
      const k = t.category || 'Other'
      map.set(k, (map.get(k) ?? 0) + t.amountSats)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [windowTxs])

  const hasData = (txs?.length ?? 0) > 0

  return (
    <PageShell title="Analytics" onBack={onBack}>
      <div className="flex gap-2 mt-1 mb-5">
        {PERIODS.map((p) => (
          <button
            key={p.label}
            onClick={() => setPeriod(p)}
            className="flex-1 py-1.5 rounded-full font-ui text-13 transition-colors"
            style={{
              background: period.label === p.label ? 'rgba(247,147,26,0.15)' : 'rgba(255,255,255,0.05)',
              border: period.label === p.label ? '1px solid rgba(247,147,26,0.5)' : '1px solid rgba(255,255,255,0.10)',
              color: period.label === p.label ? '#F7931A' : 'rgba(255,255,255,0.6)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className="font-ui text-13 text-negative">{error}</p>}

      {!hasData && txs !== null && (
        <EmptyState title="Nothing to analyse yet"
          hint="Connect a wallet and make a few transactions to see trends here." />
      )}

      {hasData && (
        <>
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
            <div className="font-ui text-12 text-white/40 mb-3">Balance trend</div>
            <LineChart values={series} />
          </div>

          {summary && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <StatCard label="Income" sats={summary.incoming.sats} kes={summary.incoming.kes} color="#00C896" />
              <StatCard label="Spending" sats={summary.outgoing.sats} kes={summary.outgoing.kes} color="#FF4D4D" />
            </div>
          )}

          {summary && (
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 mt-3">
              <div className="font-ui text-12 text-white/40">Net change</div>
              <div className={`font-numbers font-bold text-[26px] mt-1 tabular ${summary.net.sats >= 0 ? 'text-positive' : 'text-negative'}`}>
                {summary.net.sats >= 0 ? '+' : ''}{summary.net.sats.toLocaleString()}
                <span className="text-13 text-white/40 ml-2 font-brand">sats</span>
              </div>
              <div className="font-ui text-12 text-white/45 mt-1">
                ≈ KES {Math.round(summary.net.kes).toLocaleString()}
              </div>
            </div>
          )}

          {topSources.length > 0 && (
            <>
              <SectionLabel>Top spending sources</SectionLabel>
              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-center gap-5">
                <Donut data={topSources.map(([, v]) => v)} />
                <div className="flex-1 flex flex-col gap-2">
                  {topSources.map(([name, value], i) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="font-ui text-13 text-white/70 flex-1 truncate">{name}</span>
                      <span className="font-numbers text-12 text-white/50 tabular">
                        {value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </PageShell>
  )
}

function StatCard({ label, sats, kes, color }: { label: string; sats: number; kes: number; color: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
      <div className="font-ui text-12 text-white/40">{label}</div>
      <div className="font-numbers font-bold text-[22px] mt-1 tabular" style={{ color }}>
        {sats.toLocaleString()}
      </div>
      <div className="font-ui text-11 text-white/40 mt-0.5">≈ KES {Math.round(kes).toLocaleString()}</div>
    </div>
  )
}

function LineChart({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="h-32 flex items-center justify-center font-ui text-13 text-white/30">Not enough data</div>
  }
  const w = 300, h = 120
  const min = Math.min(...values), max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / span) * (h - 10) - 5
    return [x, y] as const
  })
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `0,${h} ${line} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bal-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7931A" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#F7931A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#bal-fill)" />
      <polyline points={line} fill="none" stroke="#F7931A" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Donut({ data }: { data: number[] }) {
  const total = data.reduce((a, b) => a + b, 0) || 1
  const r = 34, c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="flex-shrink-0 -rotate-90">
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
      {data.map((v, i) => {
        const frac = v / total
        const dash = frac * c
        const seg = (
          <circle
            key={i}
            cx="42" cy="42" r={r} fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
            strokeWidth="12"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
          />
        )
        offset += dash
        return seg
      })}
    </svg>
  )
}
