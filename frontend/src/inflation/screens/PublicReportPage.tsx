import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { inflationApi, type ReportItem, type ReportAdoption } from '../lib/api'
import { BgCanvas } from '../../components/ui/BgCanvas'
import { Glass } from '../../components/ui/Glass'

const SPRING = { type: 'spring' as const, damping: 22, stiffness: 240 }
const KIBERA_ID = '00000000-0000-0000-0000-000000000001'

function formatMonth(m: string) {
  const [y, mo] = m.split('-')
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleString('en-KE', { month: 'long', year: 'numeric' })
}

function prevMonthStr(m: string) {
  const d = new Date(`${m}-01`)
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 7)
}

function nextMonthStr(m: string) {
  const d = new Date(`${m}-01`)
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 7)
}

function todayMonth() {
  return new Date().toISOString().slice(0, 7)
}

function pctChange(current: number, prev: number | undefined) {
  if (!prev || prev === 0) return null
  return ((current - prev) / prev) * 100
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L6 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 3L10 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.1 }}
      className="space-y-8"
    >
      <Glass radius="card" className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="text-22 font-brand font-semibold text-white leading-snug">
            Data collection is underway
          </div>
          <p className="text-14 font-ui text-white/60 leading-relaxed">
            Field officers in Kibera are logging purchases now. The first public report will appear here once enough data has been gathered — minimum 5 price points per item before any average is published.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { label: '25 items', sub: 'being tracked' },
            { label: '5 needed', sub: 'per item to publish' },
            { label: 'Monthly', sub: 'report cadence' },
          ].map((s) => (
            <div key={s.label} className="rounded-glass bg-white/05 p-3 text-center">
              <div className="text-15 font-brand font-semibold text-bitcoin">{s.label}</div>
              <div className="text-11 font-ui text-white/40 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </Glass>

      <div className="space-y-3">
        <h2 className="text-17 font-brand font-semibold text-white">Help build this index</h2>
        <p className="text-14 font-ui text-white/55 leading-relaxed">
          Every purchase logged by a Kibera household, merchant, or field officer becomes a permanent data point in the index. Log a purchase and your data will appear in the next published report.
        </p>
        <a
          href="/inflation-tracker/capture"
          className="flex items-center justify-between w-full p-4 rounded-card glass border border-bitcoin/20 hover:border-bitcoin/40 transition-colors group"
        >
          <div>
            <div className="text-15 font-brand font-semibold text-white">Log a purchase</div>
            <div className="text-13 font-ui text-white/45">Takes 45 seconds. Works offline.</div>
          </div>
          <span className="text-bitcoin group-hover:translate-x-1 transition-transform">
            <ArrowRight />
          </span>
        </a>
        <a
          href="/inflation-tracker/admin"
          className="flex items-center justify-between w-full p-4 rounded-card glass border border-white/10 hover:border-white/20 transition-colors group"
        >
          <div>
            <div className="text-15 font-brand font-semibold text-white">Admin dashboard</div>
            <div className="text-13 font-ui text-white/45">Field officers and community admins</div>
          </div>
          <span className="text-white/40 group-hover:translate-x-1 transition-transform">
            <ArrowRight />
          </span>
        </a>
      </div>

      <div className="rounded-glass bg-white/04 border border-white/08 p-4 space-y-1.5">
        <div className="text-13 font-brand font-semibold text-white/70">What this will show</div>
        <ul className="space-y-1 text-13 font-ui text-white/45">
          <li>Price of unga, rice, sukuma wiki, cooking oil — tracked weekly</li>
          <li>KES price vs sats price — showing Bitcoin purchasing power in real terms</li>
          <li>Kibera basket inflation vs Kenya official CPI</li>
          <li>Bitcoin payment adoption at Kibera merchants</li>
        </ul>
      </div>
    </motion.div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
    >
      <Glass radius="card" className="p-6 space-y-4 text-center">
        <div className="w-10 h-10 rounded-full bg-negative/15 border border-negative/25 flex items-center justify-center mx-auto">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 6v4M9 12.5v.5M2 15h14L9 3 2 15z" stroke="#FF4D4D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="space-y-1">
          <div className="text-16 font-brand font-semibold text-white">Could not load report</div>
          <div className="text-13 font-ui text-white/50">{message}</div>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onRetry}
          className="mx-auto px-5 py-2 rounded-pill bg-white/10 text-white text-14 font-ui font-semibold border border-white/15 hover:bg-white/15 transition-colors"
        >
          Try again
        </motion.button>
      </Glass>
    </motion.div>
  )
}

export default function PublicReportPage() {
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const pathMonth = window.location.pathname.split('/').pop()
    return pathMonth && /^\d{4}-\d{2}$/.test(pathMonth) ? pathMonth : ''
  })
  const [month, setMonth] = useState<string | null>(null)
  const [items, setItems] = useState<ReportItem[]>([])
  const [prevItems, setPrevItems] = useState<{ item_name: string; avg_kes_per_unit: number }[]>([])
  const [adoption, setAdoption] = useState<ReportAdoption | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const p = currentMonth
      ? inflationApi.getReport(KIBERA_ID, currentMonth)
      : inflationApi.getLatestReport(KIBERA_ID)
    p.then((d) => {
      setMonth(d.month)
      setItems(d.items)
      setPrevItems('prevItems' in d ? (d.prevItems ?? []) : [])
      setAdoption(d.adoption)
    })
    .catch((e: Error) => setError(e.message ?? 'Could not connect to the index. Please check your connection and try again.'))
    .finally(() => setLoading(false))
  }, [currentMonth])

  useEffect(() => { load() }, [load])

  function goMonth(m: string) {
    const today = todayMonth()
    if (m > today) return
    setCurrentMonth(m)
    window.history.replaceState(null, '', m ? `/inflation-tracker/reports/${m}` : '/inflation-tracker')
  }

  const topGainers = items
    .map((item) => {
      const prev = prevItems.find((p) => p.item_name === item.item_name)
      return { ...item, pct: pctChange(item.avg_kes_per_unit, prev?.avg_kes_per_unit) }
    })
    .filter((i) => i.pct !== null)
    .sort((a, b) => Math.abs(b.pct ?? 0) - Math.abs(a.pct ?? 0))

  const topSatsSavers = items
    .filter((i) => i.avg_sats_per_unit !== null && i.avg_sats_per_unit > 0)
    .sort((a, b) => (a.avg_sats_per_unit ?? 0) - (b.avg_sats_per_unit ?? 0))
    .slice(0, 5)

  const btcPct = adoption && adoption.total > 0
    ? Math.round((adoption.bitcoin / adoption.total) * 100)
    : 0

  const isCurrentMonth = !currentMonth || currentMonth === todayMonth() || (month && month === todayMonth())
  const canGoNext = month && nextMonthStr(month) <= todayMonth()

  return (
    <div className="min-h-screen bg-bg text-white">
      <BgCanvas />

      <div className="relative z-10">
        <nav className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <a href="/inflation-tracker" className="flex items-center gap-2">
            <span className="text-13 font-brand font-semibold text-white/80">Afribit</span>
            <span className="text-white/20">·</span>
            <span className="text-13 font-ui text-white/50">Kibera Index</span>
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/inflation-tracker/admin"
              className="px-3 py-1.5 rounded-glass text-13 font-ui text-white/50 border border-white/10 hover:text-white/80 hover:border-white/20 transition-colors"
            >
              Admin
            </a>
            <a
              href="/inflation-tracker/capture"
              className="px-3 py-1.5 rounded-pill bg-bitcoin text-white text-13 font-ui font-semibold hover:bg-bitcoin/90 transition-colors"
            >
              Log data
            </a>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto px-5 pb-16 space-y-8">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="space-y-3 pt-2"
          >
            <div className="text-12 font-ui text-white/30 uppercase tracking-widest">
              Soweto West, Kibera · Community Price Index
            </div>
            <h1 className="text-34 font-brand font-semibold leading-tight">
              {month ? (
                <>Kibera Cost of Living<br /><span className="text-bitcoin">{formatMonth(month)}</span></>
              ) : (
                'Kibera Cost of Living Index'
              )}
            </h1>
            <p className="text-15 font-ui text-white/55 max-w-lg leading-relaxed">
              Bottom-up price data from real purchases in Kibera — not government surveys. Tracking what a household actually pays, in KES and in sats.
            </p>
          </motion.header>

          {loading && (
            <div className="flex gap-2 justify-center py-20">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-bitcoin/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!loading && error && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ErrorState message={error} onRetry={load} />
              </motion.div>
            )}

            {!loading && !error && !month && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyState />
              </motion.div>
            )}

            {!loading && !error && month && (
              <motion.div
                key={month}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={SPRING}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Items tracked', value: String(items.length) },
                    { label: 'Data points', value: adoption?.total.toLocaleString() ?? '—' },
                    { label: 'Bitcoin', value: `${btcPct}%`, accent: 'text-bitcoin' },
                    { label: 'Captures', value: adoption?.bitcoin.toLocaleString() ?? '—', accent: 'text-bitcoin' },
                  ].map((s) => (
                    <Glass key={s.label} radius="glass" className="p-3 space-y-0.5">
                      <div className="text-11 font-ui text-white/40 uppercase tracking-wide">{s.label}</div>
                      <div className={`text-22 font-brand font-semibold ${s.accent ?? 'text-white'}`}>{s.value}</div>
                    </Glass>
                  ))}
                </div>

                {topGainers.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-17 font-brand font-semibold text-white flex-1">KES Price Changes</h2>
                      <span className="text-12 font-ui text-white/35">vs last month</span>
                    </div>
                    <div className="space-y-2">
                      {topGainers.slice(0, 5).map((item) => (
                        <Glass key={item.item_name} radius="glass" className="p-3 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-14 font-ui font-semibold text-white truncate">{item.item_name}</div>
                            <div className="text-12 font-ui text-white/40">KES {item.avg_kes_per_unit.toFixed(2)} / unit</div>
                          </div>
                          <div className={`text-17 font-numbers font-semibold shrink-0 ${(item.pct ?? 0) > 0 ? 'text-negative' : 'text-positive'}`}>
                            {(item.pct ?? 0) > 0 ? '+' : ''}{item.pct?.toFixed(1)}%
                          </div>
                        </Glass>
                      ))}
                    </div>
                  </section>
                )}

                {topSatsSavers.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-17 font-brand font-semibold text-white">Cheapest in Sats</h2>
                    <p className="text-13 font-ui text-white/45 -mt-1">
                      Bitcoin purchases only. As BTC appreciates, this falls — showing purchasing power growth.
                    </p>
                    <div className="space-y-2">
                      {topSatsSavers.map((item) => (
                        <Glass key={item.item_name} radius="glass" className="p-3 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-14 font-ui font-semibold text-white">{item.item_name}</div>
                            <div className="text-12 font-ui text-white/40 capitalize">{item.category.replace('-', ' ')}</div>
                          </div>
                          <div className="text-17 font-numbers font-semibold text-bitcoin">
                            {Math.round(item.avg_sats_per_unit ?? 0).toLocaleString()} sats
                          </div>
                        </Glass>
                      ))}
                    </div>
                  </section>
                )}

                {items.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-17 font-brand font-semibold text-white">All Tracked Items</h2>
                    <div className="overflow-x-auto -mx-5 px-5">
                      <table className="w-full text-13 font-ui min-w-[400px]">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 pr-4 text-white/35 font-normal text-12">Item</th>
                            <th className="text-right py-2 pr-4 text-white/35 font-normal text-12">KES / unit</th>
                            <th className="text-right py-2 pr-3 text-white/35 font-normal text-12">Sats / unit</th>
                            <th className="text-right py-2 text-white/35 font-normal text-12">n</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.item_name} className="border-b border-white/[0.04]">
                              <td className="py-2.5 pr-4 text-white/90">{item.item_name}</td>
                              <td className="py-2.5 pr-4 text-right font-numbers text-white/70">{item.avg_kes_per_unit.toFixed(2)}</td>
                              <td className="py-2.5 pr-3 text-right font-numbers text-bitcoin">
                                {item.avg_sats_per_unit ? Math.round(item.avg_sats_per_unit).toLocaleString() : '—'}
                              </td>
                              <td className="py-2.5 text-right text-white/30">{item.data_points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-12 font-ui text-white/25">
                      Minimum 5 data points required per item. Individual purchase records are never published.
                    </p>
                  </section>
                )}

                {items.length === 0 && (
                  <Glass radius="card" className="p-5 text-center space-y-1">
                    <div className="text-16 font-brand font-semibold text-white">No published data for this month</div>
                    <p className="text-13 font-ui text-white/45">
                      Items need at least 5 recorded prices before they appear here. Data for this month is still being collected.
                    </p>
                  </Glass>
                )}

                <div className="flex items-center justify-between pt-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => month && goMonth(prevMonthStr(month))}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-glass text-13 font-ui text-white/50 border border-white/10 hover:text-white/80 hover:border-white/20 transition-colors"
                  >
                    <ChevronLeft />
                    Prev month
                  </motion.button>
                  {canGoNext && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => month && goMonth(nextMonthStr(month))}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-glass text-13 font-ui text-white/50 border border-white/10 hover:text-white/80 hover:border-white/20 transition-colors"
                    >
                      Next month
                      <ChevronRight />
                    </motion.button>
                  )}
                  {isCurrentMonth && (
                    <div className="px-3 py-2 rounded-glass text-12 font-ui text-white/25 border border-white/06">
                      Latest
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="pt-6 border-t border-white/08 space-y-3">
            <div className="text-12 font-ui text-white/30 leading-relaxed">
              <strong className="text-white/50">Methodology:</strong> Prices collected by trained field officers, merchants, and households in Soweto West, Kibera. Minimum 5 data points before any average is published. No individual purchase data is ever made public. Community members give explicit consent before contributing.
            </div>
            <div className="flex flex-wrap gap-4 text-12 font-ui text-white/30">
              <a href="/inflation-tracker/capture" className="text-bitcoin/70 hover:text-bitcoin transition-colors">Contribute data</a>
              <a href="/inflation-tracker/admin" className="hover:text-white/60 transition-colors">Admin login</a>
              <span>Afribit Africa · afribit.africa</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
