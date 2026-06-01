import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageShell, EmptyState } from './PageShell'
import { ArrowDownLeft, ArrowUpRight } from '../ui/Icons'
import { api, type Transaction } from '../../lib/api'

type Filter = 'all' | 'in' | 'out'

function dateKey(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yest = new Date(); yest.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export function HistoryPage({ token, onBack }: { token: string; onBack: () => void }) {
  const [txs, setTxs] = useState<Transaction[] | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.listTransactions(token, 100)
      .then(({ transactions }) => { if (!cancelled) setTxs(transactions) })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load') })
    return () => { cancelled = true }
  }, [token])

  const filtered = (txs ?? []).filter((t) => filter === 'all' || t.direction === filter)

  const groups: { day: string; items: Transaction[] }[] = []
  for (const t of filtered) {
    const key = dateKey(t.occurredAt)
    const last = groups[groups.length - 1]
    if (last && last.day === key) last.items.push(t)
    else groups.push({ day: key, items: [t] })
  }

  return (
    <PageShell title="History" onBack={onBack}>
      <div className="flex gap-2 mt-1 mb-4">
        {(['all', 'in', 'out'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full font-ui text-13 transition-colors"
            style={{
              background: filter === f ? 'rgba(247,147,26,0.15)' : 'rgba(255,255,255,0.05)',
              border: filter === f ? '1px solid rgba(247,147,26,0.5)' : '1px solid rgba(255,255,255,0.10)',
              color: filter === f ? '#F7931A' : 'rgba(255,255,255,0.6)',
            }}
          >
            {f === 'all' ? 'All' : f === 'in' ? 'Received' : 'Sent'}
          </button>
        ))}
      </div>

      {error && <p className="font-ui text-13 text-negative">{error}</p>}

      {txs === null && !error && (
        <div className="flex flex-col gap-2 mt-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/[0.04] border border-white/8 shimmer-line" />
          ))}
        </div>
      )}

      {txs !== null && filtered.length === 0 && (
        <EmptyState
          title="No transactions yet"
          hint="Once you connect a wallet and start transacting, your history shows up here."
        />
      )}

      {groups.map((g) => (
        <div key={g.day} className="mb-5">
          <div className="font-ui text-12 text-white/40 mb-2">{g.day}</div>
          <div className="flex flex-col gap-2">
            {g.items.map((t) => (
              <Row
                key={t.id}
                tx={t}
                open={expanded === t.id}
                onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </PageShell>
  )
}

function Row({ tx, open, onToggle }: { tx: Transaction; open: boolean; onToggle: () => void }) {
  const incoming = tx.direction === 'in'
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: incoming ? 'rgba(0,200,150,0.12)' : 'rgba(255,77,77,0.12)' }}
        >
          {incoming
            ? <ArrowDownLeft size={16} className="text-positive" />
            : <ArrowUpRight size={16} className="text-negative" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-ui text-14 text-white truncate">
            {tx.memo || tx.category || (incoming ? 'Received' : 'Sent')}
          </div>
          <div className="font-ui text-12 text-white/40">
            {new Date(tx.occurredAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`font-numbers text-14 tabular ${incoming ? 'text-positive' : 'text-white'}`}>
            {incoming ? '+' : '-'}{tx.amountSats.toLocaleString()}
          </div>
          <div className="font-ui text-11 text-white/40">sats</div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 flex flex-col gap-1.5 font-ui text-12 text-white/55 border-t border-white/8">
              <Detail label="Amount (KES)" value={`≈ ${Math.round(tx.amountKes).toLocaleString()}`} />
              {tx.feeSats > 0 && <Detail label="Fee" value={`${tx.feeSats.toLocaleString()} sats`} />}
              <Detail label="Category" value={tx.category || '—'} />
              <Detail label="Wallet" value={tx.wallet.nickname || tx.wallet.type} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between pt-1.5">
      <span className="text-white/40">{label}</span>
      <span className="text-white/70">{value}</span>
    </div>
  )
}
