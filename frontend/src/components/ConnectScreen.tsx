import { motion } from 'framer-motion'
import { Bolt, ChevronRight } from './ui/Icons'

type Choice = {
  id: 'all-in-one' | 'programs'
  title: string
  lines: string[]
  accent: string
  glyph: string
}

const CHOICES: Choice[] = [
  {
    id: 'all-in-one',
    title: 'All-in-One',
    lines: ['Wallets and services in one place.', 'Blink, Fedi, Tando, Bitrefill and more.'],
    accent: '#F7931A',
    glyph: 'link',
  },
  {
    id: 'programs',
    title: 'Afribit Programs',
    lines: ['Join a community programme.', 'Taka Sats, Boda-Boda, Women\u2019s Collective.'],
    accent: '#00C896',
    glyph: 'leaf',
  },
]

function Glyph({ kind, color }: { kind: string; color: string }) {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
      style={{ background: `${color}1F`, border: `1px solid ${color}55` }}
    >
      {kind === 'link' ? (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19" />
        </svg>
      ) : (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6" />
        </svg>
      )}
    </div>
  )
}

export function ConnectScreen({
  onAllInOne, onPrograms, onSkip,
}: {
  onAllInOne: () => void
  onPrograms: () => void
  onSkip: () => void
}) {
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
          What do you want to connect?
        </h1>
        <p className="font-ui text-15 text-white/55 mt-2 leading-relaxed">
          Pick a path. The assistant adapts to what you link.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {CHOICES.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, type: 'spring', damping: 22, stiffness: 220 }}
            whileTap={{ scale: 0.98 }}
            onClick={c.id === 'all-in-one' ? onAllInOne : onPrograms}
            className="glass rounded-card p-5 flex items-center gap-4 text-left"
            style={{ border: `1px solid ${c.accent}33` }}
          >
            <Glyph kind={c.glyph} color={c.accent} />
            <div className="flex-1 min-w-0">
              <div className="font-brand font-semibold text-18 text-white">{c.title}</div>
              {c.lines.map((l) => (
                <div key={l} className="font-ui text-13 text-white/55 leading-snug mt-0.5">{l}</div>
              ))}
            </div>
            <ChevronRight size={18} className="text-white/40 shrink-0" />
          </motion.button>
        ))}
      </div>

      <div className="pb-8 flex justify-center">
        <button
          onClick={onSkip}
          className="font-ui text-14 text-white/45 hover:text-white/70 flex items-center gap-1"
        >
          <Bolt size={14} className="text-white/40" />
          I'll connect later
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}
