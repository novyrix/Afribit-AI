import { motion } from 'framer-motion'
import { Bolt, FediMark, Home, Clock, ChartLine, Shield, Settings, User } from '../ui/Icons'

const TOOLS = [
  { id: 'blink', Icon: Bolt, label: 'Blink' },
  { id: 'fedi', Icon: FediMark, label: 'Fedi' },
  { id: 'home', Icon: Home, label: 'Home' },
  { id: 'history', Icon: Clock, label: 'History' },
  { id: 'analytics', Icon: ChartLine, label: 'Analytics' },
  { id: 'security', Icon: Shield, label: 'Security' },
  { id: 'settings', Icon: Settings, label: 'Settings' },
  { id: 'account', Icon: User, label: 'Account' },
]

export function ToolStrip({ connectedIds = [] }: { connectedIds?: string[] }) {
  const ordered = [
    ...TOOLS.filter((t) => connectedIds.includes(t.id)),
    ...TOOLS.filter((t) => !connectedIds.includes(t.id)),
  ]
  const loop = [...ordered, ...ordered]

  return (
    <div className="relative w-full overflow-hidden h-10"
         style={{
           maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
           WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
         }}>
      <motion.div
        className="absolute top-0 left-0 flex items-center gap-2.5 h-10"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      >
        {loop.map((t, i) => {
          const Icon = t.Icon
          const active = connectedIds.includes(t.id)
          return (
            <span
              key={`${t.id}-${i}`}
              className={'tool-chip ' + (active ? 'tool-chip--connected' : 'tool-chip--available')}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </span>
          )
        })}
      </motion.div>
    </div>
  )
}
