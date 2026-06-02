import { useEffect, useState } from 'react'
import { adminApi, type Settlements } from './adminApi'
import { Card, Stat, Spinner, ErrorNote, COLORS } from './ui'

export default function PoolTab({ token }: { token: string }) {
  const [data, setData] = useState<Settlements | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.settlements(token).then(setData).catch((e) => setError(e.message))
  }, [token])

  if (error) return <ErrorNote msg={error} />
  if (!data) return <Spinner />

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Payment rail" value="Fedi WebLN" accent={COLORS.positive} sub="Supervisor wallets pay" />
        <Stat label="Collector paid out" value={`${data.collector_paid_out_sats.toLocaleString()} sats`} />
        <Stat label="Supervisor fees to settle" value={`${data.supervisor_fees_accrued_sats.toLocaleString()} sats`} accent={COLORS.bitcoin} />
      </div>

      <Card className="overflow-x-auto">
        <div className="font-brand text-base mb-3" style={{ color: COLORS.bitcoin }}>Supervisor fees accrued</div>
        <table className="w-full text-left">
          <thead>
            <tr className="font-ui text-xs uppercase tracking-wide text-white/40">
              <th className="py-2 pr-3">Supervisor</th>
              <th className="py-2 pr-3 text-right">Completed</th>
              <th className="py-2 text-right">Fees accrued (sats)</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {data.per_supervisor.map((s) => (
              <tr key={s.supervisor_id} className="border-t" style={{ borderColor: COLORS.border }}>
                <td className="py-2 pr-3 text-white font-ui">{s.display_name}</td>
                <td className="py-2 pr-3 text-right text-white/70">{Number(s.completed_collections).toLocaleString()}</td>
                <td className="py-2 text-right" style={{ color: COLORS.bitcoin }}>{Number(s.fees_accrued_sats).toLocaleString()}</td>
              </tr>
            ))}
            {data.per_supervisor.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-white/40 font-ui">No supervisors</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto">
        <div className="font-brand text-base mb-3" style={{ color: COLORS.bitcoin }}>Recent payouts</div>
        <table className="w-full text-left">
          <thead>
            <tr className="font-ui text-xs uppercase tracking-wide text-white/40">
              <th className="py-2 pr-3">Reference</th>
              <th className="py-2 pr-3">Collector</th>
              <th className="py-2 pr-3 text-right">Collector sats</th>
              <th className="py-2 pr-3 text-right">Fee sats</th>
              <th className="py-2">Paid at</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {data.recent_payouts.map((p) => (
              <tr key={p.collection_ref} className="border-t" style={{ borderColor: COLORS.border }}>
                <td className="py-2 pr-3 text-white/70">{p.collection_ref}</td>
                <td className="py-2 pr-3 text-white font-ui">{p.collector}</td>
                <td className="py-2 pr-3 text-right" style={{ color: COLORS.positive }}>{p.collector_sats.toLocaleString()}</td>
                <td className="py-2 pr-3 text-right" style={{ color: COLORS.bitcoin }}>{p.supervisor_sats.toLocaleString()}</td>
                <td className="py-2 text-white/40">{p.paid_at ? new Date(p.paid_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {data.recent_payouts.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-white/40 font-ui">No payouts yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
