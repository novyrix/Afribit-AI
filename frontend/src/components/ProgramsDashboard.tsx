import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BitcoinMark } from './ui/Icons'

const SPRING = { type: 'spring' as const, damping: 16, stiffness: 180 }

const PHRASES = [
  'Turning waste into wealth',
  'Bitcoin-powered communities',
  'Real impact, real sats',
  'Building Africa from the ground up',
  'Your actions earn Bitcoin',
]

function CyclingText() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % PHRASES.length)
    }, 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        className="font-ui text-[17px] text-white/55 text-center leading-snug min-h-[28px]"
      >
        {PHRASES[index]}
      </motion.div>
    </AnimatePresence>
  )
}

const PROGRAMS = [
  {
    id: 'taka',
    name: 'Taka Sats',
    tagline: 'Earn sats by recycling waste',
    accent: '#00C896',
    available: true,
  },
  {
    id: 'boda',
    name: 'Boda-Boda',
    tagline: 'Rewards for boda-boda riders',
    accent: '#F7931A',
    available: false,
  },
  {
    id: 'womens',
    name: "Women's Collective",
    tagline: 'Community savings powered by Bitcoin',
    accent: '#A78BFA',
    available: false,
  },
]

export function ProgramsDashboard({ onSelectTaka }: { onSelectTaka: () => void }) {
  return (
    <motion.div
      key="programsDash"
      className="fixed inset-0 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex flex-col h-full px-5 pt-10 pb-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="flex items-center gap-3 mb-8"
        >
          <span style={{ color: '#F7931A' }}>
            <BitcoinMark size={28} />
          </span>
          <span className="font-brand font-semibold text-[22px] text-white tracking-tight">
            Afribit Programs
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPRING, delay: 0.2 }}
          className="glass rounded-card px-6 py-7 mb-6 text-center"
          style={{ border: '1px solid rgba(247,147,26,0.15)' }}
        >
          <div
            className="font-brand font-semibold text-[28px] text-white leading-tight mb-3 tracking-tight"
          >
            Earn Bitcoin.
            <br />
            <span style={{ color: '#F7931A' }}>Change your community.</span>
          </div>
          <CyclingText />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.3 }}
          className="font-ui text-12 text-white/30 uppercase tracking-widest mb-3"
        >
          Programs
        </motion.div>

        <div className="flex flex-col gap-3">
          {PROGRAMS.map((prog, i) => {
            const isActive = prog.available

            return (
              <motion.div
                key={prog.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: isActive ? 1 : 0.4, x: 0 }}
                transition={{ ...SPRING, delay: 0.36 + i * 0.07 }}
              >
                {isActive ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onSelectTaka}
                    className="w-full glass rounded-card px-5 py-4 text-left"
                    style={{ border: `1px solid ${prog.accent}30` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-brand font-semibold text-[16px] text-white mb-0.5">
                          {prog.name}
                        </div>
                        <div className="font-ui text-13 text-white/50">{prog.tagline}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: prog.accent }}
                        />
                        <div
                          className="font-ui text-10 font-semibold tracking-wide uppercase
                                     px-2 py-0.5 rounded-full"
                          style={{
                            background: `${prog.accent}18`,
                            color: prog.accent,
                          }}
                        >
                          Active
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ) : (
                  <div
                    className="glass rounded-card px-5 py-4 cursor-not-allowed"
                    style={{ border: `1px solid ${prog.accent}18` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-brand font-semibold text-[16px] text-white mb-0.5">
                          {prog.name}
                        </div>
                        <div className="font-ui text-13 text-white/50">{prog.tagline}</div>
                      </div>
                      <div>
                        <span
                          className="font-ui text-10 font-semibold tracking-wide uppercase
                                     px-2 py-0.5 rounded-full bg-white/10 text-white/40"
                        >
                          Soon
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-auto pt-8 text-center font-ui text-11 text-white/20 tracking-wide"
        >
          afribit.africa
        </motion.div>
      </div>
    </motion.div>
  )
}
