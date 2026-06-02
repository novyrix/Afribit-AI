import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationFrame } from 'framer-motion'
import QRCode from 'qrcode'
import type { CollectorCard } from './lib/api'

function useTilt() {
  const [tilt, setTilt] = useState({ rx: 8, ry: -5 })
  const hasOrientation = useRef(false)
  const t = useRef(0)

  useEffect(() => {
    function onOrient(e: DeviceOrientationEvent) {
      if (e.beta === null || e.gamma === null) return
      hasOrientation.current = true
      const ry = Math.max(-14, Math.min(14, (e.gamma ?? 0) / 4 - 5))
      const rx = Math.max(-6, Math.min(16, 8 - (e.beta ?? 0 - 45) / 8))
      setTilt({ rx, ry })
    }
    window.addEventListener('deviceorientation', onOrient, true)
    return () => window.removeEventListener('deviceorientation', onOrient, true)
  }, [])

  useAnimationFrame((time) => {
    if (hasOrientation.current) return
    t.current = time
    const rx = 8 + Math.sin(time / 1400) * 3
    const ry = -5 + Math.cos(time / 1700) * 4
    setTilt({ rx, ry })
  })

  return tilt
}

export function CollectorCard3D({ card }: { card: CollectorCard }) {
  const tilt = useTilt()
  const [qr, setQr] = useState<string>('')

  useEffect(() => {
    QRCode.toDataURL(card.qr_url, {
      errorCorrectionLevel: 'M', margin: 0, scale: 6,
      color: { dark: '#ffffffff', light: '#00000000' },
    }).then(setQr).catch(() => setQr(''))
  }, [card.qr_url])

  const since = new Date(card.member_since)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
  const status = card.status
  const statusLabel = status === 'active' ? 'ACTIVE' : status === 'paused' ? 'PAUSED' : 'INACTIVE'
  const statusColor = status === 'active' ? '#00C896' : status === 'paused' ? '#F7931A' : '#FF4D4D'

  return (
    <div style={{ perspective: 1100 }} className="w-full">
      <motion.div
        animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
        transition={{ type: 'spring', damping: 18, stiffness: 90 }}
        style={{ transformStyle: 'preserve-3d', aspectRatio: '85.6 / 54', opacity: status === 'inactive' ? 0.5 : 1 }}
        className="relative w-full rounded-card overflow-hidden"
      >
        <div className="absolute inset-0" style={{ background: '#0B0B0F' }} />
        <div
          className="absolute"
          style={{
            left: '-20%', bottom: '-30%', width: '160%', height: '120%',
            background: 'linear-gradient(35deg, transparent 35%, #F7931A 50%, transparent 62%)',
            opacity: 0.15, filter: 'blur(20px)', transform: 'rotate(-8deg)',
          }}
        />
        <div
          className="absolute inset-0 glass"
          style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30)' }}
        />

        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full font-mono text-[9px] tracking-wide"
          style={{ background: `${statusColor}26`, border: `0.5px solid ${statusColor}`, color: statusColor }}
        >
          {statusLabel}
        </div>

        <div className="absolute inset-0 flex items-stretch p-4 gap-3">
          <div className="flex flex-col justify-between min-w-0" style={{ width: '34%' }}>
            <div>
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-white/40">Taka Sats</div>
              <div className="font-brand font-semibold text-15 text-white mt-1 truncate">{card.name}</div>
              <div className="font-mono text-[10px] text-white/35 mt-0.5">MEMBER · KIBERA</div>
              <div className="font-mono text-12 mt-0.5" style={{ color: '#F7931A' }}>{card.display_id}</div>
            </div>
          </div>

          <div className="flex items-center justify-center" style={{ width: '32%' }}>
            {qr
              ? <img src={qr} alt="QR" className="w-[78%] aspect-square object-contain" draggable={false} />
              : <div className="w-[78%] aspect-square rounded bg-white/5" />}
          </div>

          <div className="flex flex-col justify-between items-end text-right min-w-0" style={{ width: '34%' }}>
            <div>
              <div className="font-mono text-[9px] text-white/35">TOTAL RECEIVED</div>
              <div className="font-mono font-bold text-20 leading-none mt-0.5" style={{ color: '#F7931A' }}>
                {card.lifetime_sats.toLocaleString()}
              </div>
              <div className="font-mono text-[10px] text-white/40">sats</div>
              <div className="font-mono text-[9px] text-white/30 mt-2">SINCE</div>
              <div className="font-mono text-11 text-white/55">{since}</div>
            </div>
          </div>
        </div>

        <div className="absolute left-4 right-4 bottom-2.5">
          <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.10)' }} />
          <div className="flex items-center justify-between mt-1.5">
            <span className="font-mono text-13" style={{ color: 'rgba(247,147,26,0.6)' }}>₿</span>
            <span className="font-mono text-[8px] tracking-wide text-white/25">AFRIBIT AFRICA</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
