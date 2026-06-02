import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import { ChevronRight } from '../components/ui/Icons'
import { CollectorCard3D } from './CollectorCard3D'
import {
  takaApi, type CollectorCard, type CollectionRow, type LeaderRow,
} from './lib/api'

type Tab = 'card' | 'history' | 'leaderboard'

function FullscreenQr({ url, onClose }: { url: string; onClose: () => void }) {
  const [qr, setQr] = useState('')
  useEffect(() => {
    QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 2, scale: 12, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQr).catch(() => setQr(''))
    let lock: { release: () => void } | null = null
    const anyNav = navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => void }> } }
    anyNav.wakeLock?.request('screen').then((l) => { lock = l }).catch(() => {})
    return () => { lock?.release?.() }
  }, [url])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: '#ffffff' }}
    >
      {qr && <img src={qr} alt="QR" className="w-[78vw] max-w-[420px] aspect-square" draggable={false} />}
      <div className="font-mono text-13 text-black/60 mt-6">Tap anywhere to close</div>
    </motion.div>
  )
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-glass px-3 py-3 flex-1 text-center">
      <div className="font-mono text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div className={`font-mono text-18 mt-1 ${accent ? '' : 'text-white'}`} style={accent ? { color: '#F7931A' } : undefined}>
        {value}
      </div>
    </div>
  )
}

const MATERIAL_LABEL: Record<string, string> = {
  plastic: 'Plastic', metal: 'Metal', paper: 'Paper', mixed: 'Mixed', other: 'Other',
}

export function CollectorView({
  token, onBack, onHome,
}: {
  token: string
  onBack: () => void
  onHome: () => void
}) {
  const [tab, setTab] = useState<Tab>('card')
  const [card, setCard] = useState<CollectorCard | null>(null)
  const [history, setHistory] = useState<CollectionRow[]>([])
  const [leaders, setLeaders] = useState<LeaderRow[]>([])
  const [showQr, setShowQr] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loaded = useRef<Record<Tab, boolean>>({ card: false, history: false, leaderboard: false })

  useEffect(() => {
    takaApi.collectorCard(token).then(setCard).catch((e) => setError(e.message))
  }, [token])

  useEffect(() => {
    if (tab === 'history' && !loaded.current.history) {
      loaded.current.history = true
      takaApi.collectorHistory(token).then((d) => setHistory(d.collections)).catch(() => {})
    }
    if (tab === 'leaderboard' && !loaded.current.leaderboard) {
      loaded.current.leaderboard = true
      takaApi.leaderboard().then(setLeaders).catch(() => {})
    }
  }, [tab, token])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
      className="absolute inset-0 flex flex-col px-5 overflow-y-auto"
    >
      <div className="pt-[8vh] pb-3 flex items-center justify-between">
        <button onClick={onBack} className="font-ui text-13 text-white/45 hover:text-white/70 flex items-center gap-1">
          <ChevronRight size={14} className="rotate-180" />
          Programs
        </button>
        <button onClick={onHome} className="font-ui text-13 text-white/45 hover:text-white/70">SATS</button>
      </div>

      <div className="flex gap-1.5 mb-5">
        {(['card', 'history', 'leaderboard'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-pill font-ui text-13 capitalize transition-colors ${
              tab === t ? 'glass-pill text-white' : 'text-white/45'
            }`}
          >
            {t === 'card' ? 'My Card' : t}
          </button>
        ))}
      </div>

      {error && <div className="font-ui text-13 text-negative mb-3">{error}</div>}

      {tab === 'card' && card && (
        <div className="flex flex-col gap-4">
          <CollectorCard3D card={card} />
          <div className="flex gap-2.5">
            <StatTile label="This month" value={card.month_sats.toLocaleString()} accent />
            <StatTile label="Collections" value={String(card.collections)} />
            <StatTile label="Rank" value={card.rank ? `#${card.rank}` : '\u2014'} />
          </div>
          <button
            onClick={() => setShowQr(true)}
            className="glass-pill h-13 w-full font-display font-semibold text-17 text-white flex items-center justify-center"
          >
            Show to supervisor
          </button>
          <button onClick={onHome} className="font-ui text-13 text-white/40 hover:text-white/70 text-center">
            Print my card →
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div className="flex flex-col gap-2 pb-8">
          {history.length === 0 && <div className="font-ui text-14 text-white/45 text-center mt-8">No collections yet.</div>}
          {history.map((h) => (
            <div key={h.collection_ref} className="glass rounded-glass p-4">
              <div className="flex items-center justify-between">
                <div className="font-ui text-15 text-white">
                  {MATERIAL_LABEL[h.material_type] ?? h.material_type} · {Number(h.weight_kg)}kg
                </div>
                <div className="font-mono text-14" style={{ color: '#00C896' }}>
                  +{h.collector_sats.toLocaleString()} sats
                </div>
              </div>
              <div className="font-ui text-12 text-white/45 mt-1">
                {h.collection_point ? `${h.collection_point} \u00b7 ` : ''}
                {new Date(h.verified_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="font-mono text-[10px] text-white/30 mt-1">{h.collection_ref} · {h.status}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="flex flex-col gap-2 pb-8">
          {leaders.length === 0 && <div className="font-ui text-14 text-white/45 text-center mt-8">No data yet.</div>}
          {leaders.map((l, i) => (
            <div key={l.display_id} className="glass rounded-glass p-3.5 flex items-center gap-3">
              <div className="font-mono text-15 w-7 text-center" style={{ color: i < 3 ? '#F7931A' : 'rgba(255,255,255,0.4)' }}>
                {i + 1}
              </div>
              <div className="flex-1 font-ui text-15 text-white truncate">{l.name}</div>
              <div className="font-mono text-14" style={{ color: '#F7931A' }}>{l.lifetime_sats.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showQr && card && <FullscreenQr url={card.qr_url} onClose={() => setShowQr(false)} />}
      </AnimatePresence>
    </motion.div>
  )
}
