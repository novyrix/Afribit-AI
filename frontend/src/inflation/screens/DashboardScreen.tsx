import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'
import {
  inflationApi,
  type AdminSummary, type PriceTrendRow, type ReviewEntry,
  type CategoryStat, type InflationUser, type InflationCommunity,
} from '../lib/api'
import { SyncIndicator } from '../components/SyncIndicator'
import { Glass, PillButton } from '../../components/ui/Glass'

const SPRING = { type: 'spring' as const, damping: 22, stiffness: 240 }
type Tab = 'overview' | 'trends' | 'review' | 'categories'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',   label: 'Overview' },
  { id: 'trends',     label: 'Price Trends' },
  { id: 'review',     label: 'Review Queue' },
  { id: 'categories', label: 'Categories' },
]

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <Glass
      radius="glass"
      className="p-4 flex flex-col gap-1"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
    >
      <span className="text-12 font-ui text-white/50 uppercase tracking-wide">{label}</span>
      <span className={`text-28 font-brand font-semibold ${accent ?? 'text-white'}`}>{value}</span>
      {sub && <span className="text-12 font-ui text-white/40">{sub}</span>}
    </Glass>
  )
}

const ITEM_COLORS = [
  '#F7931A', '#00C896', '#60A5FA', '#F472B6', '#A78BFA',
  '#34D399', '#FB923C', '#FACC15', '#2DD4BF', '#E879F9',
]

function PriceTrendsTab({ token, communityId }: { token: string; communityId: string }) {
  const [rows, setRows] = useState<PriceTrendRow[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kes' | 'sats'>('kes')
  const [days, setDays] = useState(90)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    setLoading(true)
    inflationApi.getPriceTrends(token, communityId, days)
      .then((data) => {
        setRows(data)
        const items = [...new Set(data.map((r) => r.item_name))].slice(0, 6)
        setSelectedItems(items)
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [token, communityId, days])

  const allItems = useMemo(() => [...new Set(rows.map((r) => r.item_name))], [rows])
  const allWeeks = useMemo(() => [...new Set(rows.map((r) => r.week))].sort(), [rows])

  const chartData = useMemo(() => {
    return allWeeks.map((week) => {
      const point: Record<string, string | number> = { week: week.slice(5) }
      for (const item of selectedItems) {
        const row = rows.find((r) => r.week === week && r.item_name === item)
        if (row) point[item] = view === 'kes' ? row.avg_kes : (row.avg_sats ?? 0)
      }
      return point
    })
  }, [rows, allWeeks, selectedItems, view])

  if (loading) return <div className="text-white/40 text-center py-12 font-ui text-15">Loading trends...</div>
  if (!rows.length) return <div className="text-white/40 text-center py-12 font-ui text-15">No price data yet. Start capturing purchases to see trends.</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-glass overflow-hidden border border-white/10">
          {(['kes', 'sats'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-13 font-ui transition-colors ${view === v ? 'bg-bitcoin text-white font-semibold' : 'text-white/50 hover:text-white/80'}`}
            >
              {v === 'kes' ? 'KES' : 'Sats'}
            </button>
          ))}
        </div>
        <div className="flex rounded-glass overflow-hidden border border-white/10">
          {[30, 90, 180].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-13 font-ui transition-colors ${days === d ? 'bg-white/15 text-white font-semibold' : 'text-white/50 hover:text-white/80'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {allItems.map((item, i) => {
          const on = selectedItems.includes(item)
          return (
            <button
              key={item}
              onClick={() => setSelectedItems((prev) => on ? prev.filter((x) => x !== item) : [...prev, item])}
              className={`px-2.5 py-1 rounded-pill text-12 font-ui border transition-all ${on ? 'border-transparent text-white' : 'border-white/15 text-white/40'}`}
              style={on ? { background: ITEM_COLORS[i % ITEM_COLORS.length] + '33', borderColor: ITEM_COLORS[i % ITEM_COLORS.length] } : {}}
            >
              {item}
            </button>
          )
        })}
      </div>

      <div className="w-full" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', fontSize: 13 }}
              labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            />
            <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
            {selectedItems.map((item, i) => (
              <Line
                key={item}
                type="monotone"
                dataKey={item}
                stroke={ITEM_COLORS[i % ITEM_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ReviewQueueTab({ token, communityId }: { token: string; communityId: string }) {
  const [queue, setQueue] = useState<ReviewEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  function load() {
    setLoading(true)
    inflationApi.getReviewQueue(token, communityId)
      .then(setQueue)
      .catch(() => setQueue([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [token, communityId])

  async function action(id: string, status: 'admin-reviewed' | 'flagged' | 'rejected') {
    setProcessing(id)
    try {
      await inflationApi.reviewPurchase(token, id, status)
      setQueue((prev) => prev.filter((r) => r.id !== id))
    } catch { /* noop */ }
    setProcessing(null)
  }

  if (loading) return <div className="text-white/40 text-center py-12 font-ui text-15">Loading queue...</div>
  if (!queue.length) return (
    <div className="text-center py-16 space-y-2">
      <div className="text-positive text-34 font-brand font-semibold">All clear</div>
      <div className="text-white/40 text-15 font-ui">No entries pending review</div>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="text-13 font-ui text-white/50">{queue.length} entr{queue.length === 1 ? 'y' : 'ies'} pending review</div>
      <AnimatePresence>
        {queue.map((entry) => (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING}
          >
            <Glass radius="glass" className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-15 font-brand font-semibold text-white truncate">{entry.item_name}</div>
                  <div className="text-13 font-ui text-white/50 mt-0.5">
                    {entry.quantity} {entry.unit} · KES {entry.price_kes.toFixed(2)} · {entry.payment_method}
                    {entry.sats_paid ? ` · ${entry.sats_paid.toLocaleString()} sats` : ''}
                  </div>
                  <div className="text-12 font-ui text-white/30 mt-1">
                    {entry.capture_date} · {entry.contributor}
                    {entry.notes ? ` · "${entry.notes}"` : ''}
                  </div>
                </div>
                <span className="text-11 font-ui px-2 py-0.5 rounded-pill border border-white/15 text-white/40 shrink-0 capitalize">
                  {entry.category}
                </span>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => action(entry.id, 'admin-reviewed')}
                  disabled={!!processing}
                  className="flex-1 h-9 rounded-glass text-13 font-ui font-semibold bg-positive/15 text-positive border border-positive/25 disabled:opacity-40 transition-colors"
                >
                  Approve
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => action(entry.id, 'flagged')}
                  disabled={!!processing}
                  className="flex-1 h-9 rounded-glass text-13 font-ui bg-white/08 text-white/60 border border-white/12 disabled:opacity-40 transition-colors"
                >
                  Flag
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => action(entry.id, 'rejected')}
                  disabled={!!processing}
                  className="h-9 px-4 rounded-glass text-13 font-ui bg-negative/10 text-negative border border-negative/20 disabled:opacity-40 transition-colors"
                >
                  Reject
                </motion.button>
              </div>
            </Glass>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function CategoriesTab({ token, communityId }: { token: string; communityId: string }) {
  const [data, setData] = useState<CategoryStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    inflationApi.getCategoryBreakdown(token, communityId)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [token, communityId])

  if (loading) return <div className="text-white/40 text-center py-12 font-ui text-15">Loading...</div>
  if (!data.length) return <div className="text-white/40 text-center py-12 font-ui text-15">No category data yet.</div>

  const chartData = data.map((d) => ({
    name: d.category.replace('-', ' '),
    captures: d.total,
    bitcoin: d.bitcoin_count,
  }))

  return (
    <div className="space-y-5">
      <div className="w-full" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', fontSize: 13 }}
            />
            <Bar dataKey="captures" fill="#F7931A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="bitcoin" fill="#00C896" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {data.map((d) => (
          <Glass key={d.category} radius="glass" className="p-3 flex items-center justify-between gap-4">
            <div>
              <div className="text-14 font-ui font-semibold text-white capitalize">{d.category.replace('-', ' ')}</div>
              <div className="text-12 font-ui text-white/40">{d.total} captures</div>
            </div>
            <div className="text-right">
              <div className="text-15 font-numbers text-white">KES {d.avg_kes_per_unit.toFixed(2)}</div>
              <div className="text-12 font-ui text-positive">{d.bitcoin_count} Bitcoin</div>
            </div>
          </Glass>
        ))}
      </div>
    </div>
  )
}

export function DashboardScreen({
  token, user, onGoCapture,
}: {
  token: string
  user: InflationUser
  onGoCapture: () => void
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [communities, setCommunities] = useState<InflationCommunity[]>([])
  const [communityId, setCommunityId] = useState<string>(user.community_id ?? '')

  useEffect(() => {
    inflationApi.getCommunities().then(setCommunities).catch(() => [])
  }, [])

  useEffect(() => {
    if (!communityId) return
    inflationApi.getAdminSummary(token, communityId)
      .then(setSummary)
      .catch(() => setSummary(null))
  }, [token, communityId])

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <header className="px-5 pt-safe-top pt-6 pb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-20 font-brand font-semibold text-white">Dashboard</h1>
          <p className="text-13 font-ui text-white/40">Sats Cost of Living Index</p>
        </div>
        <div className="flex items-center gap-3">
          <SyncIndicator token={token} />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onGoCapture}
            className="h-9 px-4 rounded-pill bg-bitcoin text-white text-13 font-ui font-semibold"
          >
            Capture
          </motion.button>
        </div>
      </header>

      {communities.length > 1 && (
        <div className="px-5 pb-3">
          <select
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
            className="w-full h-10 px-3 rounded-glass bg-white/08 border border-white/12 text-white text-14 font-ui"
          >
            {user.role === 'super-admin' && communities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            {user.role !== 'super-admin' && user.community_id && (
              <option value={user.community_id}>
                {communities.find((c) => c.id === user.community_id)?.name ?? 'My Community'}
              </option>
            )}
          </select>
        </div>
      )}

      <nav className="px-5 pb-4 flex gap-1 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative shrink-0 px-4 py-2 rounded-glass text-13 font-ui transition-colors ${
              tab === t.id ? 'text-white font-semibold' : 'text-white/45 hover:text-white/70'
            }`}
          >
            {tab === t.id && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 bg-white/10 rounded-glass"
                transition={SPRING}
              />
            )}
            <span className="relative z-10">{t.label}</span>
            {t.id === 'review' && summary && summary.pending_review > 0 && (
              <span className="relative z-10 ml-1.5 px-1.5 py-0.5 rounded-pill bg-negative text-white text-11 font-brand">
                {summary.pending_review}
              </span>
            )}
          </button>
        ))}
      </nav>

      <main className="flex-1 px-5 pb-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SPRING}
              className="space-y-4"
            >
              {summary ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Total Captures" value={summary.total_purchases.toLocaleString()} />
                    <StatCard label="Items Tracked" value={summary.items_tracked} />
                    <StatCard label="Contributors" value={summary.contributors} />
                    <StatCard
                      label="Pending Review"
                      value={summary.pending_review}
                      accent={summary.pending_review > 0 ? 'text-negative' : 'text-positive'}
                    />
                  </div>
                  <Glass radius="glass" className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-13 font-ui text-white/50">Bitcoin Payments</div>
                      <div className="text-22 font-brand font-semibold text-bitcoin mt-0.5">
                        {summary.total_purchases > 0
                          ? Math.round((summary.bitcoin_purchases / summary.total_purchases) * 100)
                          : 0}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-13 font-ui text-white/50">of all captures</div>
                      <div className="text-17 font-numbers text-white/70 mt-0.5">
                        {summary.bitcoin_purchases.toLocaleString()} Bitcoin
                      </div>
                    </div>
                  </Glass>
                </>
              ) : (
                <div className="text-white/40 text-center py-12 font-ui text-15">
                  {communityId ? 'Loading summary...' : 'Select a community to view data'}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'trends' && communityId && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SPRING}
            >
              <PriceTrendsTab token={token} communityId={communityId} />
            </motion.div>
          )}

          {tab === 'review' && communityId && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SPRING}
            >
              <ReviewQueueTab token={token} communityId={communityId} />
            </motion.div>
          )}

          {tab === 'categories' && communityId && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SPRING}
            >
              <CategoriesTab token={token} communityId={communityId} />
            </motion.div>
          )}

          {!communityId && tab !== 'overview' && (
            <motion.div
              key="no-community"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/40 text-center py-12 font-ui text-15"
            >
              Select a community above
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="px-5 pb-safe-bottom pb-6">
        <PillButton onClick={onGoCapture}>
          Log a Purchase
        </PillButton>
      </div>
    </div>
  )
}
