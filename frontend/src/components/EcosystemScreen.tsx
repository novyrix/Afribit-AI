import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
import { BitcoinMark, ChevronRight, Bolt } from './ui/Icons'

type Status = 'connected' | 'available' | 'soon'

type Service = {
  id: string
  name: string
  logo: string
  status: Status
  angle: number
}

const RADIUS = 120

function polar(angleDeg: number) {
  const r = (angleDeg * Math.PI) / 180
  return { x: Math.cos(r) * RADIUS, y: Math.sin(r) * RADIUS }
}

export function EcosystemScreen({
  hasBlink, hasFedi, weblnAvailable,
  onSelectBlink, onSelectFedi, onSelectWebln, onSelectNwc, onSkip,
}: {
  hasBlink?: boolean
  hasFedi?: boolean
  weblnAvailable?: boolean
  onSelectBlink: () => void
  onSelectFedi: () => void
  onSelectWebln: () => void
  onSelectNwc: () => void
  onSkip: () => void
}) {
  const services: Service[] = useMemo(() => [
    { id: 'blink',      name: 'Blink',      logo: '/logos/blink.svg',  status: hasBlink ? 'connected' : 'available', angle: -90 },
    { id: 'fedi',       name: 'Fedi',       logo: '/logos/fedi.png',   status: hasFedi  ? 'connected' : 'available', angle: -30 },
    { id: 'tando',      name: 'Tando',      logo: '/logos/tando.webp',  status: 'soon',                              angle:  30 },
    { id: 'bitrefill',  name: 'Bitrefill',  logo: '/logos/bitrefill.png', status: 'soon',                            angle:  90 },
    { id: 'minmo',      name: 'Minmo',      logo: '/logos/minmo.svg',  status: 'soon',                               angle: 150 },
    { id: 'machankura', name: 'Machankura', logo: '/logos/machankura.svg', status: 'soon',                           angle: 210 },
  ], [hasBlink, hasFedi])

  function tap(s: Service) {
    if (s.status === 'soon') return
    if (s.id === 'blink') onSelectBlink()
    else if (s.id === 'fedi') onSelectFedi()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
      className="absolute inset-0 flex flex-col px-5"
    >
      <div className="pt-[12vh]">
        <div className="font-ui text-12 text-white/35 tracking-wider uppercase">
          Connect
        </div>
        <h1 className="font-brand font-semibold text-28 text-white mt-3">
          Your Bitcoin world
        </h1>
        <p className="font-ui text-15 text-white/55 mt-2 leading-relaxed">
          Choose what to connect. Everything works together.
        </p>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <div className="relative" style={{ width: 300, height: 300 }}>
          <svg
            className="absolute inset-0 pointer-events-none"
            width={300}
            height={300}
            viewBox="-150 -150 300 300"
          >
            {services.map((s) => {
              const p = polar(s.angle)
              return (
                <line
                  key={s.id}
                  x1={0} y1={0}
                  x2={p.x} y2={p.y}
                  stroke={s.status === 'connected' ? 'rgba(247,147,26,0.40)' : 'rgba(247,147,26,0.12)'}
                  strokeWidth={0.8}
                  strokeDasharray={s.status === 'soon' ? '3 4' : undefined}
                />
              )
            })}
          </svg>

          <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
            <div className="relative w-14 h-14">
              <div
                className="ring-spin absolute rounded-full border border-dashed"
                style={{ inset: -8, borderColor: 'rgba(247,147,26,0.30)' }}
              />
              <div className="glass w-14 h-14 rounded-full flex items-center justify-center">
                <BitcoinMark size={22} className="text-bitcoin" />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {services.map((s, i) => {
              const p = polar(s.angle)
              const soon = s.status === 'soon'
              const connected = s.status === 'connected'
              return (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: soon ? 0.55 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ delay: i * 0.07, type: 'spring', damping: 16, stiffness: 220 }}
                  whileTap={soon ? undefined : { scale: 0.92 }}
                  onClick={() => tap(s)}
                  disabled={soon}
                  className="absolute flex flex-col items-center gap-1.5"
                  style={{
                    left: 150 + p.x,
                    top: 150 + p.y,
                    width: 52,
                    marginLeft: -26,
                    marginTop: -26,
                  }}
                >
                  <div
                    className="w-[52px] h-[52px] rounded-full overflow-hidden relative flex items-center justify-center"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      backdropFilter: 'blur(12px)',
                      border: connected
                        ? '2px solid #00C896'
                        : '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <span
                      className="absolute font-brand font-semibold text-15 text-white/70"
                      aria-hidden
                    >
                      {s.name.charAt(0)}
                    </span>
                    <img
                      src={s.logo}
                      alt={s.name}
                      className="w-9 h-9 object-contain rounded-full relative"
                      draggable={false}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                  <div className="font-ui text-11 text-white/60 whitespace-nowrap">
                    {s.name}
                  </div>
                  {soon && (
                    <div
                      className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full font-ui text-[9px] font-medium leading-tight"
                      style={{ background: 'rgba(247,147,26,0.20)', color: '#F7931A' }}
                    >
                      Soon
                    </div>
                  )}
                  {connected && (
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                      style={{ background: '#00C896' }}
                    />
                  )}
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="pb-8 flex flex-col items-center gap-3">
        {weblnAvailable && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, type: 'spring', damping: 20, stiffness: 220 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSelectWebln}
            className="glass-pill flex items-center gap-2 px-5 py-3"
            style={{ border: '1px solid rgba(247,147,26,0.45)' }}
          >
            <Bolt size={16} className="text-bitcoin" />
            <span className="font-ui text-14 text-white">Connect instantly</span>
          </motion.button>
        )}
        <button
          onClick={onSelectNwc}
          className="font-ui text-14 text-white/70 hover:text-white flex items-center gap-2"
        >
          <Bolt size={14} className="text-bitcoin" />
          Paste a wallet connection (NWC)
        </button>
        <button
          onClick={onSkip}
          className="font-ui text-14 text-white/45 hover:text-white/70 flex items-center gap-1"
        >
          Go to SATS
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}
