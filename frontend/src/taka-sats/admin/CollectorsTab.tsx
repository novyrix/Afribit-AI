import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { adminApi, type AdminCollector } from './adminApi'
import { Card, Spinner, ErrorNote, Btn, Field, Input, Select, COLORS } from './ui'

export default function CollectorsTab({ token }: { token: string }) {
  const [rows, setRows] = useState<AdminCollector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [walletType, setWalletType] = useState('fedi')
  const [saving, setSaving] = useState(false)
  const [qrModal, setQrModal] = useState<{ name: string; dataUrl: string; url: string } | null>(null)

  function load() {
    setLoading(true)
    adminApi.collectors(token)
      .then((d) => setRows(d.collectors))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [token])

  async function showQr(name: string, url: string) {
    const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
    setQrModal({ name, dataUrl, url })
  }

  async function register(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const r = await adminApi.createCollector(token, { name: name.trim(), wallet_address: walletAddress.trim() || undefined, wallet_type: walletType })
      setName(''); setWalletAddress('')
      load()
      await showQr(r.name, r.qr_url)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function regenerate(id: string, name: string) {
    const r = await adminApi.updateCollector(token, id, { regenerate_qr: true })
    if (r.qr_url) await showQr(name, r.qr_url)
  }

  async function toggleStatus(c: AdminCollector) {
    await adminApi.updateCollector(token, c.id, { status: c.status === 'active' ? 'suspended' : 'active' })
    load()
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="font-brand text-base mb-3" style={{ color: COLORS.bitcoin }}>Register collector</div>
        <form onSubmit={register} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></Field>
          <Field label="Wallet address (optional)"><Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="lightning address" /></Field>
          <Field label="Wallet type">
            <Select value={walletType} onChange={(e) => setWalletType(e.target.value)}>
              <option value="fedi">Fedi</option>
              <option value="blink">Blink</option>
              <option value="machankura">Machankura</option>
            </Select>
          </Field>
          <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : 'Register + QR'}</Btn>
        </form>
      </Card>

      {error && <ErrorNote msg={error} />}
      {loading ? <Spinner /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="font-ui text-xs uppercase tracking-wide text-white/40">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3 text-right">Collections</th>
                <th className="py-2 pr-3 text-right">Earned</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {rows.map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: COLORS.border }}>
                  <td className="py-2 pr-3 text-white/70">{c.display_id}</td>
                  <td className="py-2 pr-3 text-white">{c.name}</td>
                  <td className="py-2 pr-3 text-white/70">{c.wallet_type}</td>
                  <td className="py-2 pr-3 text-right text-white/70">{c.collections}</td>
                  <td className="py-2 pr-3 text-right" style={{ color: COLORS.bitcoin }}>{Number(c.earned_sats).toLocaleString()}</td>
                  <td className="py-2 pr-3" style={{ color: c.status === 'active' ? COLORS.positive : COLORS.negative }}>{c.status}</td>
                  <td className="py-2 flex gap-2">
                    <Btn variant="ghost" className="!px-2 !py-1 !text-xs" onClick={() => regenerate(c.id, c.name)}>QR</Btn>
                    <Btn variant="ghost" className="!px-2 !py-1 !text-xs" onClick={() => toggleStatus(c)}>{c.status === 'active' ? 'Suspend' : 'Activate'}</Btn>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-white/40 font-ui">No collectors</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setQrModal(null)}>
          <div className="rounded-card p-6 text-center" style={{ background: COLORS.surface }} onClick={(e) => e.stopPropagation()}>
            <div className="font-brand text-lg text-white mb-1">{qrModal.name}</div>
            <div className="font-ui text-xs text-white/40 mb-4">Print and give to collector</div>
            <img src={qrModal.dataUrl} alt="Collector QR" className="rounded-glass mx-auto" />
            <div className="font-mono text-[10px] text-white/30 mt-3 break-all max-w-[280px]">{qrModal.url}</div>
            <div className="mt-4 flex gap-2 justify-center">
              <Btn onClick={() => { const a = document.createElement('a'); a.href = qrModal.dataUrl; a.download = `${qrModal.name}-card.png`; a.click() }}>Download PNG</Btn>
              <Btn variant="ghost" onClick={() => setQrModal(null)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
