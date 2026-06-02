import { useEffect, useState } from 'react'
import { adminApi, type Overview } from './adminApi'
import { Card, Stat, Spinner, ErrorNote, COLORS } from './ui'

export default function OverviewTab({ token }: { token: string }) {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.overview(token).then(setData).catch((e) => setError(e.message))
  }, [token])

  if (error) return <ErrorNote msg={error} />
  if (!data) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Payment rail" value="Fedi WebLN" accent={COLORS.positive} sub="Supervisor pays" />
        <Stat label="Active collectors" value={String(data.active_collectors)} />
        <Stat label="Active supervisors" value={String(data.active_supervisors)} />
        <Stat label="Fees accrued" value={`${data.supervisor_fees_accrued_sats.toLocaleString()} sats`} accent={COLORS.bitcoin} sub="To settle" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Period title="Today" p={data.today} />
        <Period title="This month" p={data.month} />
        <Period title="All time" p={data.all_time} />
      </div>
    </div>
  )
}

function Period({ title, p }: { title: string; p: { collections: number; weight_kg: number; sats: number } }) {
  return (
    <Card>
      <div className="font-brand text-base mb-3" style={{ color: COLORS.bitcoin }}>{title}</div>
      <Row label="Collections" value={p.collections.toLocaleString()} />
      <Row label="Weight" value={`${p.weight_kg.toLocaleString()} kg`} />
      <Row label="Paid out" value={`${p.sats.toLocaleString()} sats`} />
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-ui text-sm text-white/50">{label}</span>
      <span className="font-mono text-sm text-white">{value}</span>
    </div>
  )
}
