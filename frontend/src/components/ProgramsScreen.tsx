import { motion } from 'framer-motion'
import { ChevronRight } from './ui/Icons'

type Program = {
  id: 'taka-sats' | 'boda-boda' | 'womens-collective'
  name: string
  tagline: string
  description: string
  accent: string
  status: 'available' | 'soon'
}

const PROGRAMS: Program[] = [
  {
    id: 'taka-sats',
    name: 'Taka Sats',
    tagline: 'Waste to Bitcoin',
    description: 'Collect waste, present your card at a collection point, and earn sats instantly. Built for Kibera collectors.',
    accent: '#00C896',
    status: 'available',
  },
  {
    id: 'boda-boda',
    name: 'Boda-Boda',
    tagline: 'Rider financing',
    description: 'Save and borrow in Bitcoin for your motorbike. Track your loan balance and repayments in one place.',
    accent: '#F7931A',
    status: 'soon',
  },
  {
    id: 'womens-collective',
    name: 'Women\u2019s Collective',
    tagline: 'Group savings',
    description: 'A shared savings circle for women in the community. Pool sats together and grow your collective fund.',
    accent: '#B47CFF',
    status: 'soon',
  },
]

export function ProgramsScreen({
  onBack, onSelectTaka,
}: {
  onBack: () => void
  onSelectTaka: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
      className="absolute inset-0 flex flex-col px-5"
    >
      <div className="pt-[10vh]">
        <button
          onClick={onBack}
          className="font-ui text-13 text-white/45 hover:text-white/70 flex items-center gap-1 mb-4"
        >
          <ChevronRight size={14} className="rotate-180" />
          Connect
        </button>
        <h1 className="font-brand font-semibold text-26 text-white">
          Afribit Programs
        </h1>
        <p className="font-ui text-15 text-white/55 mt-2 leading-relaxed">
          Which programme are you in, or want to join?
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-3 mt-7">
        {PROGRAMS.map((p, i) => {
          const soon = p.status === 'soon'
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: soon ? 0.6 : 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.07, type: 'spring', damping: 22, stiffness: 220 }}
              whileTap={soon ? undefined : { scale: 0.98 }}
              disabled={soon}
              onClick={soon ? undefined : onSelectTaka}
              className="glass rounded-card p-5 flex items-start gap-4 text-left relative"
              style={{ border: `1px solid ${p.accent}33` }}
            >
              <div
                className="w-2 self-stretch rounded-full shrink-0"
                style={{ background: p.accent }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-brand font-semibold text-18 text-white">{p.name}</span>
                  <span className="font-ui text-11 uppercase tracking-wide" style={{ color: p.accent }}>
                    {p.tagline}
                  </span>
                </div>
                <p className="font-ui text-13 text-white/55 leading-snug mt-1.5">
                  {p.description}
                </p>
              </div>
              {soon ? (
                <div
                  className="absolute top-3 right-3 px-2 py-0.5 rounded-full font-ui text-[10px] font-medium"
                  style={{ background: `${p.accent}26`, color: p.accent }}
                >
                  Soon
                </div>
              ) : (
                <ChevronRight size={18} className="text-white/40 shrink-0 mt-0.5" />
              )}
            </motion.button>
          )
        })}
      </div>

      <div className="pb-8" />
    </motion.div>
  )
}
