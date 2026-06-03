import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BitcoinMark } from './ui/Icons'

const SPRING = { type: 'spring' as const, damping: 16, stiffness: 180 }

function StaggerChars({ text, delay = 0, perChar = 40, className = '' }: {
  text: string; delay?: number; perChar?: number; className?: string
}) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: delay / 1000 + (i * perChar) / 1000,
            type: 'spring', damping: 14, stiffness: 220,
          }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

export function LaunchScreen({ onContinue }: { onContinue: () => void }) {
  const [exiting, setExiting] = useState(false)
  const [showHr, setShowHr]   = useState(false)
  const [showBtn, setShowBtn] = useState(false)
  const [moveUp, setMoveUp]   = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setMoveUp(true),  1400)
    const t2 = setTimeout(() => setShowHr(true),  3500)
    const t3 = setTimeout(() => setShowBtn(true), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const handleStart = () => {
    setExiting(true)
    setTimeout(onContinue, 300)
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center px-6"
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: moveUp ? -32 : 0 }}
            transition={SPRING}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 1, scale: [1, 1.04, 1] }}
              transition={{
                opacity: { delay: 0.4, duration: 0.5 },
                scale:   { delay: 0.9, duration: 0.5, times: [0, 0.5, 1], ease: 'easeInOut' },
              }}
              style={{ color: '#F7931A' }}
              className="mb-5"
            >
              <BitcoinMark size={56} />
            </motion.div>

            <div className="font-ui text-15 text-white/55 mt-1 mb-1.5 tracking-wide">
              <StaggerChars text="Welcome to" delay={1400} perChar={28} />
            </div>

            <div className="font-brand font-semibold text-[40px] leading-none text-white tracking-tight">
              <StaggerChars text="Afribit Programs" delay={2100} perChar={50} />
            </div>

            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: showHr ? 48 : 0, opacity: showHr ? 0.35 : 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-px bg-white mt-7"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: showBtn ? 1 : 0, y: showBtn ? 0 : 24 }}
            transition={SPRING}
            className="absolute bottom-[18%] left-0 right-0 px-5 flex justify-center"
          >
            <div className="w-full max-w-[320px]">
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', damping: 18, stiffness: 320 }}
                onClick={handleStart}
                aria-label="Get started"
                className="glass-pill w-full h-14 px-6 font-ui font-semibold text-16 text-white
                           flex items-center justify-center gap-2"
              >
                Get started
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showBtn ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="absolute left-0 right-0 text-center font-ui text-12 text-white/25 tracking-wide"
            style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
          >
            Made by Afribit Africa · afribit.africa
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
