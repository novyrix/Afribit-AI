import { useEffect, useState } from 'react'
import { adminApi, type ReportRow } from './adminApi'
import { Card, Spinner, ErrorNote, Input, COLORS } from './ui'

export default function ReportTab({ token }: { token: string }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [data, setData] = useState<{ by_material: ReportRow[]; by_supervisor: ReportRow[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    adminApi.report(token, month)
      .then((d) => setData({ by_material: d.by_material, by_supervisor: d.by_supervisor }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, month])

  return (
    <div className="space-y-4">
      <div className="w-48">
        <span className="font-ui text-xs text-white/50 mb-1 block">Month</span>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>
      {error && <ErrorNote msg={error} />}
      {loading || !data ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="overflow-x-auto">
            <div className="font-brand text-base mb-3" style={{ color: COLORS.bitcoin }}>By material</div>
            <Table rows={data.by_material} cols={['material_type', 'collections', 'weight_kg', 'sats']} />
          </Card>
          <Card className="overflow-x-auto">
            <div className="font-brand text-base mb-3" style={{ color: COLORS.bitcoin }}>By supervisor</div>
            <Table rows={data.by_supervisor} cols={['supervisor', 'collections', 'weight_kg', 'fee_sats']} />
          </Card>
        </div>
      )}
    </div>
  )
}

function Table({ rows, cols }: { rows: ReportRow[]; cols: string[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="font-ui text-xs uppercase tracking-wide text-white/40">
          {cols.map((c) => <th key={c} className="py-2 pr-3">{c.replace(/_/g, ' ')}</th>)}
        </tr>
      </thead>
      <tbody className="font-mono text-sm">
        {rows.map((r, i) => (
          <tr key={i} className="border-t" style={{ borderColor: COLORS.border }}>
            {cols.map((c) => <td key={c} className="py-2 pr-3 text-white/80">{String(r[c] ?? '—')}</td>)}
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={cols.length} className="py-6 text-center text-white/40 font-ui">No data</td></tr>}
      </tbody>
    </table>
  )
}
