import { useEffect, useState } from 'react'
import { adminApi, type AdminCollection } from './adminApi'
import { Card, Spinner, ErrorNote, Btn, Select, COLORS } from './ui'

const MATERIALS = ['', 'plastic', 'metal', 'paper', 'mixed', 'other']
const STATUSES = ['', 'completed', 'pending', 'failed']

export default function CollectionsTab({ token }: { token: string }) {
  const [rows, setRows] = useState<AdminCollection[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [material, setMaterial] = useState('')
  const [status, setStatus] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 50

  useEffect(() => {
    const p = new URLSearchParams()
    if (material) p.set('material', material)
    if (status) p.set('status', status)
    p.set('limit', String(limit))
    p.set('offset', String(offset))
    setLoading(true)
    adminApi.collections(token, `?${p.toString()}`)
      .then((d) => { setRows(d.collections); setTotal(d.total) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, material, status, offset])

  function downloadCsv() {
    const p = new URLSearchParams()
    if (material) p.set('material', material)
    if (status) p.set('status', status)
    p.set('format', 'csv')
    fetch(`${adminApi.collectionsCsvUrl()}`.split('?')[0] + `?${p.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'taka-sats-collections.csv'
        a.click()
        URL.revokeObjectURL(url)
      })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <span className="font-ui text-xs text-white/50 mb-1 block">Material</span>
          <Select value={material} onChange={(e) => { setOffset(0); setMaterial(e.target.value) }}>
            {MATERIALS.map((m) => <option key={m} value={m}>{m || 'All materials'}</option>)}
          </Select>
        </div>
        <div className="w-40">
          <span className="font-ui text-xs text-white/50 mb-1 block">Status</span>
          <Select value={status} onChange={(e) => { setOffset(0); setStatus(e.target.value) }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </Select>
        </div>
        <Btn variant="ghost" onClick={downloadCsv}>Export CSV</Btn>
      </div>

      {error && <ErrorNote msg={error} />}
      {loading ? <Spinner /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="font-ui text-xs uppercase tracking-wide text-white/40">
                <th className="py-2 pr-3">Ref</th>
                <th className="py-2 pr-3">Collector</th>
                <th className="py-2 pr-3">Supervisor</th>
                <th className="py-2 pr-3">Material</th>
                <th className="py-2 pr-3 text-right">Weight</th>
                <th className="py-2 pr-3 text-right">Total sats</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {rows.map((r) => (
                <tr key={r.collection_ref} className="border-t" style={{ borderColor: COLORS.border }}>
                  <td className="py-2 pr-3 text-white/70">{r.collection_ref}</td>
                  <td className="py-2 pr-3 text-white">{r.collector}</td>
                  <td className="py-2 pr-3 text-white/70">{r.supervisor}</td>
                  <td className="py-2 pr-3 text-white/70">{r.material_type}</td>
                  <td className="py-2 pr-3 text-right text-white">{r.weight_kg} kg</td>
                  <td className="py-2 pr-3 text-right" style={{ color: COLORS.bitcoin }}>{r.total_sats.toLocaleString()}</td>
                  <td className="py-2 pr-3" style={{ color: r.status === 'completed' ? COLORS.positive : r.status === 'failed' ? COLORS.negative : '#fff' }}>{r.status}</td>
                  <td className="py-2 text-white/50">{new Date(r.verified_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-white/40 font-ui">No collections</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <span className="font-ui text-xs text-white/40">{total} total</span>
        <div className="flex gap-2">
          <Btn variant="ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Prev</Btn>
          <Btn variant="ghost" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>Next</Btn>
        </div>
      </div>
    </div>
  )
}
