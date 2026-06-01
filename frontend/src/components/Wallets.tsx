import { useEffect, useState, FormEvent } from 'react'
import { api, type Language, type WalletConnection } from '../lib/api'

const t = {
  title:       { sw: 'Mikoba Yako',           en: 'Your Wallets',         shg: 'Wallets Zako' },
  none:        { sw: 'Bado hujaunganisha mkoba wowote.', en: 'No wallets connected yet.', shg: 'Bado hujaconnect wallet.' },
  blinkTitle:  { sw: 'Unganisha Blink',       en: 'Connect Blink',        shg: 'Connect Blink' },
  blinkDesc:   { sw: 'Weka API key yako kutoka Blink.', en: 'Paste your Blink API key.', shg: 'Weka API key yako ya Blink.' },
  apiKey:      { sw: 'Blink API Key',         en: 'Blink API Key',        shg: 'Blink API Key' },
  nickname:    { sw: 'Jina (hiari)',          en: 'Nickname (optional)',  shg: 'Jina (optional)' },
  connect:     { sw: 'Unganisha',             en: 'Connect',              shg: 'Connect' },
  fediTitle:   { sw: 'Unganisha Fedi',        en: 'Connect Fedi',         shg: 'Connect Fedi' },
  fediDesc:    { sw: 'Inakuja hivi karibuni — itahitaji Fedi app kwenye simu yako.',
                 en: 'Coming soon — will need Fedi app on your phone.',
                 shg: 'Inakam soon — utahitaji Fedi app kwa simu.' },
  refresh:     { sw: 'Onesha tena',           en: 'Refresh',              shg: 'Refresh' },
  connected:   { sw: 'Imeunganishwa',         en: 'Connected',             shg: 'Connected' },
} as const

const dateFmt = new Intl.DateTimeFormat('en-KE', {
  dateStyle: 'medium', timeStyle: 'short',
})

export function Wallets({ token, language }: { token: string | null; language: Language }) {
  const [wallets, setWallets] = useState<WalletConnection[]>([])
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = () => {
    if (!token) return
    setLoading(true)
    api.listWallets(token)
      .then((d) => setWallets(d.wallets))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [token])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token || !apiKey.trim() || busy) return
    setBusy(true); setError(null); setSuccess(null)
    try {
      await api.connectBlink(token, apiKey.trim(), nickname.trim() || undefined)
      setSuccess(t.connected[language])
      setApiKey(''); setNickname('')
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Wallet list */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white/90">{t.title[language]}</h2>
            <button
              onClick={load}
              disabled={!token || loading}
              className="text-xs text-white/60 hover:text-bitcoin-orange disabled:opacity-40"
            >
              {loading ? '…' : t.refresh[language]}
            </button>
          </div>
          {wallets.length === 0 ? (
            <div className="bg-bitcoin-card border border-white/10 rounded-lg p-4 text-sm text-white/50 text-center">
              {t.none[language]}
            </div>
          ) : (
            <ul className="space-y-2">
              {wallets.map((w) => (
                <li key={w.id} className="bg-bitcoin-card border border-white/10 rounded-lg p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-bitcoin-orange/20 text-bitcoin-orange">
                        {w.walletType}
                      </span>
                      <span className="text-sm font-medium truncate">{w.nickname || w.externalId || w.id.slice(0, 8)}</span>
                    </div>
                    <div className="text-[11px] text-white/40 mt-1">
                      {w.lastSyncedAt ? `Sync: ${dateFmt.format(new Date(w.lastSyncedAt))}` : '—'}
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-400">● {w.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Connect Blink */}
        <section className="bg-bitcoin-card border border-white/10 rounded-lg p-4">
          <h3 className="font-semibold mb-1">{t.blinkTitle[language]}</h3>
          <p className="text-xs text-white/50 mb-3">{t.blinkDesc[language]}</p>
          <form onSubmit={submit} className="space-y-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t.apiKey[language]}
              required
              className="w-full bg-bitcoin-dark border border-white/15 rounded px-3 py-2 text-sm outline-none focus:border-bitcoin-orange"
            />
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t.nickname[language]}
              className="w-full bg-bitcoin-dark border border-white/15 rounded px-3 py-2 text-sm outline-none focus:border-bitcoin-orange"
            />
            <button
              type="submit"
              disabled={busy || !apiKey.trim()}
              className="w-full bg-bitcoin-orange text-black font-semibold rounded px-3 py-2 text-sm disabled:opacity-40"
            >
              {busy ? '…' : t.connect[language]}
            </button>
            {error   && <div className="text-xs text-red-400">{error}</div>}
            {success && <div className="text-xs text-emerald-400">{success}</div>}
          </form>
        </section>

        {/* Fedi placeholder */}
        <section className="bg-bitcoin-card border border-white/10 rounded-lg p-4 opacity-70">
          <h3 className="font-semibold mb-1">{t.fediTitle[language]}</h3>
          <p className="text-xs text-white/50">{t.fediDesc[language]}</p>
        </section>
      </div>
    </div>
  )
}
