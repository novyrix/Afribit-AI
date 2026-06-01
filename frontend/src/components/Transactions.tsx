import { useEffect, useState } from 'react'
import { api, type Language, type Rate, type Transaction, type Summary } from '../lib/api'

const t = {
  title:    { sw: 'Miamala',          en: 'Transactions',  shg: 'Miamala' },
  summary:  { sw: 'Muhtasari (siku 30)', en: 'Summary (30d)', shg: 'Muhtasari (30d)' },
  inFlow:   { sw: 'Imeingia',         en: 'Received',      shg: 'Imeingia' },
  outFlow:  { sw: 'Imetoka',          en: 'Sent',          shg: 'Imetoka' },
  net:      { sw: 'Salio Halisi',     en: 'Net',           shg: 'Net' },
  count:    { sw: 'Idadi',            en: 'Count',         shg: 'Count' },
  none:     { sw: 'Hakuna miamala bado.', en: 'No transactions yet.', shg: 'Hakuna tx bado.' },
  refresh:  { sw: 'Onesha tena',      en: 'Refresh',       shg: 'Refresh' },
} as const

const dateFmt = new Intl.DateTimeFormat('en-KE', { dateStyle: 'short', timeStyle: 'short' })
const fmtSats = (n: number) => new Intl.NumberFormat('en').format(n)
const fmtKes  = (n: number) => new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(n)
const satsToKes = (sats: number, kesPerBtc: number) => Math.round((sats / 1e8) * kesPerBtc)

export function Transactions({
  token, language, rate,
}: { token: string | null; language: Language; rate: Rate | null }) {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    if (!token) return
    setLoading(true); setError(null)
    Promise.all([api.listTransactions(token), api.getSummary(token)])
      .then(([list, s]) => { setTxs(list.transactions); setSummary(s) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [token])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.title[language]}</h2>
          <button
            onClick={load}
            disabled={!token || loading}
            className="text-xs text-white/60 hover:text-bitcoin-orange disabled:opacity-40"
          >
            {loading ? '…' : t.refresh[language]}
          </button>
        </div>

        {error && <div className="bg-red-900/40 border border-red-700 text-red-200 px-3 py-2 rounded text-sm">{error}</div>}

        {/* Summary cards */}
        {summary && (
          <section>
            <div className="text-xs text-white/40 mb-2 uppercase tracking-wide">{t.summary[language]}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Card label={t.inFlow[language]}  value={fmtSats(summary.incoming.sats)} sub={`KES ${fmtKes(summary.incoming.kes)}`} tone="up" />
              <Card label={t.outFlow[language]} value={fmtSats(summary.outgoing.sats)} sub={`KES ${fmtKes(summary.outgoing.kes)}`} tone="down" />
              <Card
                label={t.net[language]}
                value={fmtSats(summary.net.sats)}
                sub={`KES ${fmtKes(summary.net.kes)}`}
                tone={summary.net.sats >= 0 ? 'up' : 'down'}
              />
              <Card label={t.count[language]} value={String(summary.incoming.count + summary.outgoing.count)} sub="tx" />
            </div>
          </section>
        )}

        {/* Tx list */}
        {txs.length === 0 ? (
          <div className="bg-bitcoin-card border border-white/10 rounded-lg p-4 text-sm text-white/50 text-center">
            {t.none[language]}
          </div>
        ) : (
          <ul className="space-y-2">
            {txs.map((tx) => {
              const isIn = tx.direction === 'in'
              const kes = tx.amountKes ?? (rate ? satsToKes(tx.amountSats, rate.kesPerBtc) : null)
              return (
                <li key={tx.id} className="bg-bitcoin-card border border-white/10 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${isIn ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isIn ? '↓' : '↑'}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-white/40">{tx.wallet.type}</span>
                      {tx.category && tx.category !== 'other' && (
                        <span className="text-[10px] uppercase tracking-wide bg-white/10 text-white/60 px-1.5 py-0.5 rounded">
                          {tx.category}
                        </span>
                      )}
                    </div>
                    {tx.memo && (
                      <div className="text-sm text-white/80 truncate mt-0.5">{tx.memo}</div>
                    )}
                    <div className="text-[11px] text-white/40 mt-0.5">
                      {dateFmt.format(new Date(tx.occurredAt))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold tabular-nums text-sm ${isIn ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isIn ? '+' : '−'}{fmtSats(tx.amountSats)} sats
                    </div>
                    {kes != null && (
                      <div className="text-[11px] text-white/40 tabular-nums">≈ KES {fmtKes(kes)}</div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function Card({
  label, value, sub, tone,
}: { label: string; value: string; sub?: string; tone?: 'up' | 'down' }) {
  const color = tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-red-400' : 'text-white'
  return (
    <div className="bg-bitcoin-card border border-white/10 rounded-lg p-3">
      <div className="text-[10px] text-white/40 uppercase tracking-wide">{label}</div>
      <div className={`font-bold text-lg tabular-nums mt-1 ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-white/40">{sub}</div>}
    </div>
  )
}
