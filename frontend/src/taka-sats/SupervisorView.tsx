import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrowserQRCodeReader } from '@zxing/browser'
import { takaApi, type CollectionRow } from './lib/api'
import { payLightningAddress } from './lib/pay'
import { enableWebln, getWeblnBalanceSats, isWeblnAvailable } from '../lib/webln'

const AMBER = '#FFB547'
const BG = '#0F0D0B'

type View = 'home' | 'scan' | 'identified' | 'log' | 'confirm' | 'paying' | 'result' | 'today' | 'earnings'
type Scanned = { collector_id: string; display_id: string; name: string; status: string; lifetime_sats: number }
type LogDraft = { material_type: string; weight_kg: string; collection_point: string; notes: string }
type PayResult = { status: string; collection_ref: string; collector_sats?: number; supervisor_sats?: number; total_sats?: number; error?: string }

const MATERIALS = ['plastic', 'metal', 'paper', 'mixed', 'other']

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

function parseCardData(text: string): { id: string; k: string } | null {
  try {
    const u = new URL(text)
    const id = u.searchParams.get('id'); const k = u.searchParams.get('k')
    if (id && k) return { id, k }
  } catch { /* not a url */ }
  return null
}

export function SupervisorView({ token, onHome }: { token: string; onHome: () => void }) {
  const [view, setView] = useState<View>('home')
  const [me, setMe] = useState<{ display_name: string; assigned_points: string[] } | null>(null)
  const [walletReady, setWalletReady] = useState(false)
  const [walletAlias, setWalletAlias] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [scanned, setScanned] = useState<Scanned | null>(null)
  const [draft, setDraft] = useState<LogDraft>({ material_type: 'plastic', weight_kg: '', collection_point: '', notes: '' })
  const [result, setResult] = useState<PayResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [today, setToday] = useState<{ collections: CollectionRow[]; total_weight_kg: number; total_sats: number } | null>(null)
  const [earnings, setEarnings] = useState<{ today_sats: number; week_sats: number; month_sats: number; all_time_sats: number } | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)

  function refreshBalance() {
    getWeblnBalanceSats().then((b) => { if (b !== null) setWalletBalance(b) }).catch(() => {})
  }

  async function connectWallet() {
    try {
      const info = await enableWebln()
      setWalletAlias(info.alias)
      setWalletReady(true)
      refreshBalance()
    } catch {
      setWalletReady(false)
    }
  }

  useEffect(() => {
    takaApi.supervisorMe(token).then((m) => {
      setMe(m)
      setDraft((d) => ({ ...d, collection_point: m.assigned_points[0] ?? 'Collection Point' }))
    }).catch(() => {})
    if (isWeblnAvailable()) connectWallet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (view !== 'scan') { controlsRef.current?.stop(); controlsRef.current = null; return }
    setScanError(null)
    const reader = new BrowserQRCodeReader()
    let active = true
    reader.decodeFromVideoDevice(undefined, videoRef.current!, (res) => {
      if (!active || !res) return
      const parsed = parseCardData(res.getText())
      if (!parsed) return
      active = false
      controlsRef.current?.stop()
      handleScan(parsed.id, parsed.k)
    }).then((c) => { controlsRef.current = c }).catch(() => setScanError('Camera unavailable. Check permissions.'))
    return () => { active = false; controlsRef.current?.stop(); controlsRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  useEffect(() => {
    if (view !== 'confirm') return
    setCountdown(2)
    const iv = setInterval(() => setCountdown((c) => (c <= 1 ? (clearInterval(iv), 0) : c - 1)), 1000)
    return () => clearInterval(iv)
  }, [view])

  async function handleScan(id: string, k: string) {
    try {
      const r = await takaApi.supervisorScan(token, id, k)
      if (!r.valid || !r.collector_id) {
        vibrate([120, 80, 120, 80, 120]); setScanError('Invalid card. Do not proceed. Contact Afribit admin.'); return
      }
      vibrate(60)
      setScanned({ collector_id: r.collector_id, display_id: r.display_id!, name: r.name!, status: r.status!, lifetime_sats: r.lifetime_sats ?? 0 })
      setView('identified')
    } catch {
      vibrate([120, 80, 120]); setScanError('Could not verify card. Try again.')
    }
  }

  async function submitPayout() {
    if (!scanned) return
    setView('paying')
    let collectionId = ''
    let ref = ''
    try {
      const created = await takaApi.supervisorLog(token, {
        collector_id: scanned.collector_id,
        collection_point: draft.collection_point,
        material_type: draft.material_type,
        weight_kg: parseFloat(draft.weight_kg),
        notes: draft.notes || undefined,
      })
      collectionId = created.collection_id
      ref = created.collection_ref
      try {
        const { preimage } = await payLightningAddress(
          created.collector_wallet_address,
          created.collector_sats,
          created.memo,
        )
        await takaApi.supervisorCollectionResult(token, collectionId, { success: true, preimage })
        setResult({
          status: 'completed', collection_ref: ref,
          collector_sats: created.collector_sats, supervisor_sats: created.supervisor_sats,
          total_sats: created.total_sats,
        })
        refreshBalance()
      } catch (payErr) {
        const msg = payErr instanceof Error ? payErr.message : 'Payment failed'
        await takaApi.supervisorCollectionResult(token, collectionId, { success: false, error: msg }).catch(() => {})
        setResult({ status: 'failed', collection_ref: ref, error: msg })
      }
    } catch (e) {
      setResult({ status: 'failed', collection_ref: ref, error: e instanceof Error ? e.message : 'Could not log collection' })
    }
    setView('result')
  }

  const lowBalance = walletBalance !== null && walletBalance < 50_000
  const balanceColor = !walletReady ? '#FF4D4D' : lowBalance ? AMBER : '#00C896'

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: BG }}>
      <div className="px-5 pt-[7vh] pb-10 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[2px] uppercase" style={{ color: AMBER }}>Supervisor Mode</div>
            <div className="font-brand font-semibold text-20 text-white mt-1">{me?.display_name ?? '\u2014'}</div>
            <div className="font-ui text-12 text-white/45">{me?.assigned_points?.join(', ') || 'No points assigned'}</div>
          </div>
          <button onClick={onHome} className="font-ui text-12 text-white/45 hover:text-white/70 flex items-center gap-1">
            Personal wallet ↗
          </button>
        </div>

        <div className="glass rounded-glass px-4 py-3 mt-5 flex items-center justify-between" style={{ border: `1px solid ${balanceColor}40` }}>
          <span className="font-ui text-13 text-white/70">Fedi wallet</span>
          {walletReady ? (
            <span className="flex items-center gap-2">
              <span className="font-mono text-15" style={{ color: AMBER }}>
                {walletBalance !== null ? `${walletBalance.toLocaleString()} sats` : (walletAlias ?? 'Connected')}
              </span>
              <span className="w-2 h-2 rounded-full" style={{ background: balanceColor }} />
              <span className="font-ui text-12" style={{ color: balanceColor }}>{lowBalance ? 'Low' : 'Ready'}</span>
            </span>
          ) : (
            <button onClick={connectWallet} className="font-ui text-13" style={{ color: AMBER }}>
              {isWeblnAvailable() ? 'Connect wallet' : 'Open in Fedi'}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3 mt-5">
              {[
                { k: 'scan', t: 'New collection', s: 'Scan a card' },
                { k: 'today', t: "Today's log", s: 'Verified pickups' },
                { k: 'earnings', t: 'My earnings', s: 'Fees received' },
              ].map((tile) => (
                <button
                  key={tile.k}
                  onClick={() => { if (tile.k === 'today') { takaApi.supervisorToday(token).then(setToday).catch(() => {}) } if (tile.k === 'earnings') { takaApi.supervisorEarnings(token).then(setEarnings).catch(() => {}) } setView(tile.k as View) }}
                  className="glass rounded-card p-4 text-left aspect-square flex flex-col justify-end"
                  style={{ border: `1px solid ${AMBER}22` }}
                >
                  <div className="font-brand font-semibold text-17 text-white">{tile.t}</div>
                  <div className="font-ui text-12 text-white/45 mt-0.5">{tile.s}</div>
                </button>
              ))}
            </motion.div>
          )}

          {view === 'scan' && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5">
              <div className="relative w-full aspect-square rounded-card overflow-hidden bg-black">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <div className="absolute inset-[18%] rounded-2xl" style={{ border: `3px solid ${AMBER}` }} />
              </div>
              <div className="font-ui text-14 text-white/70 text-center mt-4">Scan collector's card</div>
              {scanError && <div className="font-ui text-13 text-negative text-center mt-2">{scanError}</div>}
              <button onClick={() => { setScanError(null); setView('home') }} className="w-full mt-4 font-ui text-14 text-white/50">Cancel</button>
            </motion.div>
          )}

          {view === 'identified' && scanned && (
            <motion.div key="id" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass rounded-card p-5 mt-5">
              <div className="font-mono text-[10px] tracking-[2px] uppercase" style={{ color: '#00C896' }}>Collector Identified</div>
              <div className="font-brand font-semibold text-20 text-white mt-2">{scanned.name}</div>
              <div className="font-mono text-13 text-white/50 mt-0.5">{scanned.display_id} · {scanned.status.toUpperCase()}</div>
              <div className="font-ui text-13 text-white/55 mt-2">Lifetime: {scanned.lifetime_sats.toLocaleString()} sats</div>
              <button onClick={() => setView('log')} className="w-full mt-5 h-12 rounded-pill font-display font-semibold text-16" style={{ background: AMBER, color: '#0B0B0F' }}>Continue</button>
              <button onClick={() => { setScanned(null); setView('scan') }} className="w-full mt-3 font-ui text-14 text-white/50">Wrong person — scan again</button>
            </motion.div>
          )}

          {view === 'log' && (
            <motion.div key="log" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 flex flex-col gap-4">
              <div>
                <div className="font-ui text-13 text-white/55 mb-2">Material type</div>
                <div className="flex flex-wrap gap-2">
                  {MATERIALS.map((m) => (
                    <button key={m} onClick={() => setDraft({ ...draft, material_type: m })}
                      className="px-4 h-11 rounded-pill font-ui text-14 capitalize"
                      style={draft.material_type === m ? { background: AMBER, color: '#0B0B0F' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-ui text-13 text-white/55 mb-2">Weight (kg)</div>
                <input value={draft.weight_kg} onChange={(e) => setDraft({ ...draft, weight_kg: e.target.value.replace(/[^0-9.]/g, '') })}
                  inputMode="decimal" placeholder="0.0"
                  className="w-full h-12 px-4 rounded-glass bg-white/5 border border-white/10 font-mono text-18 text-white outline-none" />
              </div>
              <div>
                <div className="font-ui text-13 text-white/55 mb-2">Collection point</div>
                <select value={draft.collection_point} onChange={(e) => setDraft({ ...draft, collection_point: e.target.value })}
                  className="w-full h-12 px-4 rounded-glass bg-white/5 border border-white/10 font-ui text-15 text-white outline-none">
                  {(me?.assigned_points?.length ? me.assigned_points : [draft.collection_point]).map((p) => <option key={p} value={p} className="bg-black">{p}</option>)}
                </select>
              </div>
              <div>
                <div className="font-ui text-13 text-white/55 mb-2">Notes (optional)</div>
                <input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  className="w-full h-12 px-4 rounded-glass bg-white/5 border border-white/10 font-ui text-15 text-white outline-none" />
              </div>
              <button disabled={!(parseFloat(draft.weight_kg) > 0)} onClick={() => setView('confirm')}
                className="w-full mt-1 h-12 rounded-pill font-display font-semibold text-16 disabled:opacity-40"
                style={{ background: AMBER, color: '#0B0B0F' }}>Review payout</button>
              <button onClick={() => setView('home')} className="font-ui text-14 text-white/50">Cancel</button>
            </motion.div>
          )}

          {view === 'confirm' && scanned && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-card p-5 mt-5">
              <div className="font-mono text-[10px] tracking-[2px] uppercase" style={{ color: AMBER }}>Confirm Payout</div>
              <div className="mt-3 space-y-1.5 font-ui text-14">
                <Row l="Collector" v={`${scanned.name} (${scanned.display_id})`} />
                <Row l="Material" v={draft.material_type} />
                <Row l="Weight" v={`${draft.weight_kg} kg`} />
                <Row l="Point" v={draft.collection_point} />
              </div>
              <div className="font-ui text-13 text-white/50 mt-4 leading-relaxed">
                Confirm to pay the collector directly from your Fedi wallet. Your 10% supervisor fee
                is recorded and settled by Afribit separately.
              </div>
              {!walletReady && (
                <div className="font-ui text-13 mt-3" style={{ color: '#FF4D4D' }}>
                  Connect your Fedi wallet first. Open SATS inside the Fedi app to pay.
                </div>
              )}
              <button disabled={countdown > 0 || !walletReady} onClick={submitPayout}
                className="w-full mt-5 h-12 rounded-pill font-display font-semibold text-16 disabled:opacity-50"
                style={{ background: AMBER, color: '#0B0B0F' }}>
                {countdown > 0 ? `Confirm and pay (${countdown})` : 'Confirm and pay'}
              </button>
              <button onClick={() => setView('log')} className="w-full mt-3 font-ui text-14 text-white/50">Cancel</button>
            </motion.div>
          )}

          {view === 'paying' && (
            <motion.div key="paying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-16 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border-2 border-white/15 animate-spin" style={{ borderTopColor: AMBER }} />
              <div className="font-ui text-15 text-white/70 mt-5">Sending payment…</div>
            </motion.div>
          )}

          {view === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-card p-6 mt-5 text-center">
              {result.status === 'completed' ? (
                <>
                  <div className="text-30" style={{ color: '#00C896' }}>✓</div>
                  <div className="font-brand font-semibold text-20 text-white mt-2">Paid</div>
                  <div className="font-mono text-15 mt-3" style={{ color: AMBER }}>{(result.collector_sats ?? 0).toLocaleString()} sats</div>
                  <div className="font-ui text-12 text-white/45 mt-1">to {scanned?.name}</div>
                  <div className="font-ui text-12 text-white/45 mt-1">Your fee: {(result.supervisor_sats ?? 0).toLocaleString()} sats</div>
                </>
              ) : (
                <>
                  <div className="text-30" style={{ color: '#FF4D4D' }}>!</div>
                  <div className="font-brand font-semibold text-18 text-white mt-2">{result.status === 'pending_retry' ? 'Queued' : 'Payment issue'}</div>
                  <div className="font-ui text-13 text-white/55 mt-2">{result.error}</div>
                </>
              )}
              <div className="font-mono text-[10px] text-white/30 mt-3">{result.collection_ref}</div>
              <button onClick={() => { setScanned(null); setResult(null); setDraft((d) => ({ ...d, weight_kg: '', notes: '' })); setView('scan') }}
                className="w-full mt-5 h-12 rounded-pill font-display font-semibold text-16" style={{ background: AMBER, color: '#0B0B0F' }}>Next collector</button>
              <button onClick={() => setView('home')} className="w-full mt-3 font-ui text-14 text-white/50">Done</button>
            </motion.div>
          )}

          {view === 'today' && (
            <motion.div key="today" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
              <div className="glass rounded-glass p-4 flex justify-between">
                <span className="font-ui text-13 text-white/60">{today?.collections.length ?? 0} collections · {today?.total_weight_kg ?? 0} kg</span>
                <span className="font-mono text-14" style={{ color: AMBER }}>{(today?.total_sats ?? 0).toLocaleString()} sats</span>
              </div>
              <div className="flex flex-col gap-2 mt-3">
                {(today?.collections ?? []).map((c) => (
                  <div key={c.collection_ref} className="glass rounded-glass p-3.5 flex justify-between">
                    <span className="font-ui text-14 text-white capitalize">{c.material_type} · {Number(c.weight_kg)}kg</span>
                    <span className="font-mono text-13" style={{ color: '#00C896' }}>+{c.collector_sats.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setView('home')} className="w-full mt-5 font-ui text-14 text-white/50">Back</button>
            </motion.div>
          )}

          {view === 'earnings' && (
            <motion.div key="earnings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 flex flex-col gap-3">
              {([['Today', 'today_sats'], ['This week', 'week_sats'], ['This month', 'month_sats'], ['All time', 'all_time_sats']] as const).map(([label, key]) => (
                <div key={key} className="glass rounded-glass p-4 flex justify-between">
                  <span className="font-ui text-14 text-white/60">{label}</span>
                  <span className="font-mono text-16" style={{ color: AMBER }}>{(earnings?.[key] ?? 0).toLocaleString()} sats</span>
                </div>
              ))}
              <button onClick={() => setView('home')} className="w-full mt-2 font-ui text-14 text-white/50">Back</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/45">{l}</span>
      <span className="text-white capitalize">{v}</span>
    </div>
  )
}
