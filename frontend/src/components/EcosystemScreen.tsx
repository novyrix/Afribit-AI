import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Bolt, FediMark, BitcoinMark, ChevronRight } from './ui/Icons'

type Status = 'connected' | 'available' | 'soon'
type Category = 'wallets' | 'buy'

type Service = {
  id: string
  name: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
  status: Status
  category: Category
}

function nodePositions(n: number, radius: number) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
  })
}

export function EcosystemScreen({
  hasBlink, hasFedi,
  onSelectBlink, onSelectFedi, onSkip,
}: {
  hasBlink?: boolean
  hasFedi?: boolean
  onSelectBlink: () => void
  onSelectFedi: () => void
  onSkip: () => void
}) {
  const [tab, setTab] = useState<Category>('wallets')

  const services: Service[] = useMemo(() => [
    { id: 'blink', name: 'Blink', Icon: Bolt, status: hasBlink ? 'connected' : 'available', category: 'wallets' },
    { id: 'fedi',  name: 'Fedi',  Icon: FediMark, status: hasFedi ? 'connected' : 'available', category: 'wallets' },
    { id: 'bitika', name: 'Bitika', Icon: BoltOutline, status: 'soon', category: 'buy' },
    { id: 'minmo', name: 'Minmo',  Icon: CircleDuo, status: 'soon', category: 'buy' },
  ], [hasBlink, hasFedi])

  const visible = services.filter((s) => s.category === tab)
  const positions = nodePositions(Math.max(visible.length, 4), 120)

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
          Step 2 of 2
        </div>
        <h1 className="font-brand font-semibold text-28 text-white mt-3">
          Your Bitcoin world
        </h1>
        <p className="font-ui text-15 text-white/55 mt-2 leading-relaxed">
          Choose what to connect. Everything works together.
        </p>
      </div>

      {/* Category tabs */}
      <div className="mt-6 flex gap-2">
        <TabPill active={tab === 'wallets'} onClick={() => setTab('wallets')}>Wallets</TabPill>
        <TabPill active={tab === 'buy'} onClick={() => setTab('buy')}>Buy Bitcoin</TabPill>
      </div>

      {/* Radial nodes */}
      <div className="flex-1 relative flex items-center justify-center">
        <div className="relative" style={{ width: 280, height: 280 }}>
          {/* SVG connection lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={280}
            height={280}
            viewBox="-140 -140 280 280"
          >
            {visible.map((s, i) => {
              const p = positions[i]
              const active = s.status === 'connected'
              return (
                <line
                  key={s.id}
                  x1={0} y1={0}
                  x2={p.x} y2={p.y}
                  stroke={active ? 'rgba(247,147,26,0.40)' : 'rgba(247,147,26,0.15)'}
                  strokeWidth={0.5}
                />
              )
            })}
          </svg>

          {/* Central SATS node */}
          <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="relative w-14 h-14">
              <div className="ring-spin absolute inset-[-6px] rounded-full border border-dashed"
                   style={{ borderColor: 'rgba(247,147,26,0.30)' }} />
              <div className="glass w-14 h-14 rounded-full flex items-center justify-center">
                <BitcoinMark size={22} className="text-bitcoin" />
              </div>
            </div>
          </div>

          {/* Service nodes */}
          <AnimatePresence mode="popLayout">
            {visible.map((s, i) => {
              const p = positions[i]
              const Icon = s.Icon
              const soon = s.status === 'soon'
              const connected = s.status === 'connected'
              return (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: soon ? 0.55 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ delay: i * 0.06, type: 'spring', damping: 16, stiffness: 220 }}
                  whileTap={soon ? undefined : { scale: 0.92 }}
                  onClick={() => tap(s)}
                  disabled={soon}
                  className="absolute flex flex-col items-center gap-1.5"
                  style={{
                    left: '50%', top: '50%',
                    transform: `translate(calc(${p.x}px - 50%), calc(${p.y}px - 50%))`,
                  }}
                >
                  <div
                    className="glass w-[52px] h-[52px] rounded-full flex items-center justify-center relative"
                    style={connected ? { boxShadow: '0 0 0 2px #00C896' } : undefined}
                  >
                    <Icon size={24} className={soon ? 'text-white/30' : 'text-white'} />
                  </div>
                  <div className="font-ui text-11 text-white/60 whitespace-nowrap">
                    {s.name}
                  </div>
                  {soon && (
                    <div
                      className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full font-ui text-10 font-medium"
                      style={{ background: 'rgba(247,147,26,0.20)', color: '#F7931A' }}
                    >
                      Soon
                    </div>
                  )}
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="pb-8 flex flex-col items-center gap-3">
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

function TabPill({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 h-9 rounded-full font-ui text-13 transition-colors ${
        active
          ? 'bg-white/10 border border-white/25 text-white'
          : 'border border-white/10 text-white/45 hover:text-white/70'
      }`}
    >
      {children}
    </button>
  )
}

// Placeholder icons for upcoming services — clearly non-AI-slop (geometric only)
function BoltOutline({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" strokeWidth={1.4}
            strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
function CircleDuo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="12" r="5" stroke="currentColor" strokeWidth={1.4} />
      <circle cx="15" cy="12" r="5" stroke="currentColor" strokeWidth={1.4} />
    </svg>
  )
}
