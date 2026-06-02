import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { inflationApi, type ReportItem, type ReportAdoption } from '../lib/api'
import { BgCanvas } from '../../components/ui/BgCanvas'
import { Glass } from '../../components/ui/Glass'

const SPRING = { type: 'spring' as const, damping: 22, stiffness: 240 }
const KIBERA_ID = '00000000-0000-0000-0000-000000000001'

function formatMonth(m: string) {
  const [y, mo] = m.split('-')
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleString('en-KE', { month: 'long', year: 'numeric' })
}

function pctChange(current: number, prev: number | undefined) {
  if (!prev) return null
  return ((current - prev) / prev) * 100
}

export default function PublicReportPage() {
  const [month, setMonth] = useState<string | null>(null)
  const [items, setItems] = useState<ReportItem[]>([])
  const [prevItems, setPrevItems] = useState<{ item_name: string; avg_kes_per_unit: number }[]>([])
  const [adoption, setAdoption] = useState<ReportAdoption | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pathMonth = window.location.pathname.split('/').pop()
  const requestedMonth = pathMonth && /^\d{4}-\d{2}$/.test(pathMonth) ? pathMonth : null

  useEffect(() => {
    setLoading(true)
    const fetch = requestedMonth
      ? inflationApi.getReport(KIBERA_ID, requestedMonth).then((d) => {
          setMonth(d.month)
          setItems(d.items)
          setPrevItems(d.prevItems)
          setAdoption(d.adoption)
        })
      : inflationApi.getLatestReport(KIBERA_ID).then((d) => {
          setMonth(d.month)
          setItems(d.items)
          setAdoption(d.adoption)
        })
    fetch.catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [requestedMonth])

  const topGainers = [...items]
    .map((item) => {
      const prev = prevItems.find((p) => p.item_name === item.item_name)
      return { ...item, pct: pctChange(item.avg_kes_per_unit, prev?.avg_kes_per_unit) }
    })
    .filter((i) => i.pct !== null)
    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))

  const topSatsSavers = [...items]
    .filter((i) => i.avg_sats_per_unit !== null)
    .sort((a, b) => (a.avg_sats_per_unit ?? 0) - (b.avg_sats_per_unit ?? 0))
    .slice(0, 5)

  const btcPct = adoption && adoption.total > 0
    ? Math.round((adoption.bitcoin / adoption.total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-bg text-white">
      <BgCanvas />
      <div className="relative z-10 max-w-2xl mx-auto px-5 py-10 space-y-8">

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-12 font-ui text-white/40 uppercase tracking-widest">
            <span>Afribit Africa</span>
            <span>·</span>
            <span>Kibera, Nairobi</span>
          </div>
          <h1 className="text-34 font-brand font-semibold leading-tight">
            Kibera Cost of Living
            {month && <><br /><span className="text-bitcoin">{formatMonth(month)}</span></>}
          </h1>
          <p className="text-15 font-ui text-white/60 max-w-lg">
            A community-collected price index from Soweto West, Kibera. Based on real purchases recorded by households, merchants, and field officers — not government surveys.
          </p>
        </motion.header>

        {loading && (
          <div className="flex gap-2 justify-center py-16">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-bitcoin/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        )}

        {error && (
          <Glass radius="glass" className="p-5 text-center">
            <p className="text-15 font-ui text-negative">{error}</p>
          </Glass>
        )}

        {!loading && !error && !month && (
          <Glass radius="glass" className="p-6 text-center space-y-2">
            <p className="text-20 font-brand font-semibold text-white">No data published yet</p>
            <p className="text-15 font-ui text-white/50">
              The Kibera Cost of Living Index is currently collecting data. The first report will be published once enough data has been gathered.
            </p>
          </Glass>
        )}

        {!loading && month && items.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              <Glass radius="glass" className="p-4 space-y-1">
                <div className="text-12 font-ui text-white/40 uppercase tracking-wide">Items Tracked</div>
                <div className="text-28 font-brand font-semibold text-white">{items.length}</div>
              </Glass>
              <Glass radius="glass" className="p-4 space-y-1">
                <div className="text-12 font-ui text-white/40 uppercase tracking-wide">Total Captures</div>
                <div className="text-28 font-brand font-semibold text-white">{adoption?.total.toLocaleString() ?? '—'}</div>
              </Glass>
              <Glass radius="glass" className="p-4 space-y-1 col-span-2 sm:col-span-1">
                <div className="text-12 font-ui text-white/40 uppercase tracking-wide">Bitcoin Payments</div>
                <div className="text-28 font-brand font-semibold text-bitcoin">{btcPct}%</div>
              </Glass>
            </motion.div>

            {topGainers.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.15 }}
                className="space-y-3"
              >
                <h2 className="text-18 font-brand font-semibold text-white">
                  Biggest KES Price Changes
                </h2>
                <div className="space-y-2">
                  {topGainers.slice(0, 5).map((item) => (
                    <Glass key={item.item_name} radius="glass" className="p-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-14 font-ui font-semibold text-white">{item.item_name}</div>
                        <div className="text-12 font-ui text-white/40">KES {item.avg_kes_per_unit.toFixed(2)} per unit</div>
                      </div>
                      <div className={`text-17 font-numbers font-semibold ${(item.pct ?? 0) > 0 ? 'text-negative' : 'text-positive'}`}>
                        {(item.pct ?? 0) > 0 ? '+' : ''}{item.pct?.toFixed(1)}%
                      </div>
                    </Glass>
                  ))}
                </div>
              </motion.section>
            )}

            {topSatsSavers.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.2 }}
                className="space-y-3"
              >
                <h2 className="text-18 font-brand font-semibold text-white">
                  Cheapest in Sats This Month
                </h2>
                <p className="text-13 font-ui text-white/50">
                  Bitcoin purchases only. Lower sats = stronger purchasing power.
                </p>
                <div className="space-y-2">
                  {topSatsSavers.map((item) => (
                    <Glass key={item.item_name} radius="glass" className="p-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-14 font-ui font-semibold text-white">{item.item_name}</div>
                        <div className="text-12 font-ui text-white/40 capitalize">{item.category.replace('-', ' ')}</div>
                      </div>
                      <div className="text-17 font-numbers text-bitcoin">
                        {Math.round(item.avg_sats_per_unit ?? 0).toLocaleString()} sats
                      </div>
                    </Glass>
                  ))}
                </div>
              </motion.section>
            )}

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.25 }}
              className="space-y-3"
            >
              <h2 className="text-18 font-brand font-semibold text-white">All Items — {formatMonth(month)}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-13 font-ui">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 pr-4 text-white/40 font-normal">Item</th>
                      <th className="text-right py-2 pr-4 text-white/40 font-normal">KES / unit</th>
                      <th className="text-right py-2 pr-4 text-white/40 font-normal">Sats / unit</th>
                      <th className="text-right py-2 text-white/40 font-normal">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.item_name} className="border-b border-white/05">
                        <td className="py-2.5 pr-4 text-white">{item.item_name}</td>
                        <td className="py-2.5 pr-4 text-right font-numbers text-white/80">{item.avg_kes_per_unit.toFixed(2)}</td>
                        <td className="py-2.5 pr-4 text-right font-numbers text-bitcoin">
                          {item.avg_sats_per_unit ? Math.round(item.avg_sats_per_unit).toLocaleString() : '—'}
                        </td>
                        <td className="py-2.5 text-right text-white/40">{item.data_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-12 font-ui text-white/30">
                Only items with 5+ data points are shown. Individual purchase data is never published.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.3 }}
              className="pt-4 border-t border-white/10 space-y-2"
            >
              <div className="text-13 font-ui text-white/40">
                <strong className="text-white/70">Methodology:</strong> Prices are collected by trained field officers, participating merchants, and households in Soweto West, Kibera. All data is self-reported. Minimum 5 data points required before any item average is published. Individual purchase data is never exposed. Community members consent before contributing.
              </div>
              <div className="text-13 font-ui text-white/40">
                Want to contribute data?{' '}
                <a href="/inflation-tracker" className="text-bitcoin underline underline-offset-2">Join the index</a>.
              </div>
            </motion.section>
          </>
        )}
      </div>
    </div>
  )
}
