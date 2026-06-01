import { useEffect, useState } from 'react'
import { PageShell, SectionLabel } from './PageShell'
import { Bolt, FediMark, Dot } from '../ui/Icons'
import { api, type WalletConnection } from '../../lib/api'
import { getPreferences } from '../../lib/preferences'

const LANG_KEY = 'sats_lang'
const LANG_LABEL: Record<string, string> = { en: 'English', sw: 'Kiswahili', shg: 'Sheng' }
const PERS_LABEL: Record<string, string> = {
  all: 'Balanced', facts: 'Just facts', teach: 'Teach me', coach: 'Coach me',
}
const PRIV_LABEL: Record<string, string> = {
  full: 'Full access', summaries: 'Summaries only', ask: 'Ask each time',
}

type WalletWithBalance = WalletConnection & { balanceSats?: number; loading?: boolean }

export function AccountPage({ token, onBack }: { token: string; onBack: () => void }) {
  const [wallets, setWallets] = useState<WalletWithBalance[]>([])
  const [confirm, setConfirm] = useState('')
  const prefs = getPreferences()
  const lang = localStorage.getItem(LANG_KEY) || 'en'

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { wallets: list } = await api.listWallets(token)
        if (cancelled) return
        setWallets(list.map((w) => ({ ...w, loading: true })))
        for (const w of list) {
          try {
            const b = await api.getWalletBalance(token, w.id)
            if (cancelled) return
            setWallets((prev) => prev.map((p) => p.id === w.id
              ? { ...p, balanceSats: b.balanceSats, loading: false } : p))
          } catch {
            if (cancelled) return
            setWallets((prev) => prev.map((p) => p.id === w.id ? { ...p, loading: false } : p))
          }
        }
      } catch { /* noop */ }
    }
    load()
    return () => { cancelled = true }
  }, [token])

  function resetApp() {
    if (confirm !== 'DELETE') return
    localStorage.clear()
    location.reload()
  }

  return (
    <PageShell title="Account" onBack={onBack}>
      <SectionLabel>Identity</SectionLabel>
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">
        <InfoRow label="Language" value={LANG_LABEL[lang] ?? lang} />
        <InfoRow label="AI personality" value={PERS_LABEL[prefs.financialPersonality]} />
        <InfoRow label="Privacy" value={PRIV_LABEL[prefs.privacyLevel]} />
      </div>

      <SectionLabel>Connected services</SectionLabel>
      {wallets.length === 0 && (
        <p className="font-ui text-13 text-white/40">No wallets connected.</p>
      )}
      <div className="flex flex-col gap-2">
        {wallets.map((w) => {
          const Logo = w.walletType === 'blink' ? Bolt : FediMark
          return (
            <div key={w.id} className="rounded-2xl bg-white/[0.04] border border-white/10
                                       flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-glass flex items-center justify-center"
                   style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <Logo size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-ui text-14 text-white truncate">
                  {w.nickname ?? (w.walletType === 'blink' ? 'Blink' : 'Fedi')}
                </div>
                <div className="font-numbers text-12 text-white/50 tabular">
                  {w.loading ? '…' : w.balanceSats !== undefined
                    ? `${w.balanceSats.toLocaleString()} sats` : '—'}
                </div>
              </div>
              {w.status === 'active' && <Dot className="text-positive" />}
            </div>
          )
        })}
      </div>

      <SectionLabel>Data</SectionLabel>
      <div className="rounded-2xl border p-4"
           style={{ background: 'rgba(255,77,77,0.06)', borderColor: 'rgba(255,77,77,0.25)' }}>
        <div className="font-ui text-14 text-white/85">Reset app data</div>
        <p className="font-ui text-12 text-white/45 mt-1 leading-relaxed">
          Clears your local session, wallets link, and preferences from this device.
          Type <span className="text-white/80">DELETE</span> to confirm.
        </p>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          className="mt-3 w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5
                     font-ui text-14 text-white outline-none placeholder:text-white/25"
        />
        <button
          onClick={resetApp}
          disabled={confirm !== 'DELETE'}
          className="mt-3 w-full h-11 rounded-xl font-ui font-semibold text-14 transition-opacity"
          style={{
            background: 'rgba(255,77,77,0.18)',
            border: '1px solid rgba(255,77,77,0.5)',
            color: '#FF6B6B',
            opacity: confirm === 'DELETE' ? 1 : 0.45,
          }}
        >
          Reset everything
        </button>
      </div>
    </PageShell>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] last:border-b-0">
      <span className="font-ui text-14 text-white/80">{label}</span>
      <span className="font-ui text-13 text-white/45">{value}</span>
    </div>
  )
}
