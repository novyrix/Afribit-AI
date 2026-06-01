import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BitcoinMark } from './ui/Icons'
import { PillButton } from './ui/Glass'

const SPRING = { type: 'spring' as const, damping: 16, stiffness: 180 }

function StaggerText({ text, delay = 0, perChar = 30, className = '' }: {
  text: string; delay?: number; perChar?: number; className?: string
}) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay / 1000 + (i * perChar) / 1000, duration: 0.2 }}
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
          className="fixed inset-0 bg-bg flex flex-col items-center justify-center px-6"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Logo + name centred block */}
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: moveUp ? -32 : 0 }}
            transition={SPRING}
            className="flex flex-col items-center"
          >
            {/* Bitcoin mark */}
            <motion.div
              initial={{ opacity: 0, scale: 1 }}
              animate={{
                opacity: 1,
                scale: [1, 1.04, 1],
              }}
              transition={{
                opacity: { delay: 0.4, duration: 0.5 },
                scale:   { delay: 0.9, duration: 0.5, times: [0, 0.5, 1], ease: 'easeInOut' },
              }}
              style={{ color: '#F7931A' }}
              className="text-[52px] leading-none mb-4"
            >
              <BitcoinMark size={52} />
            </motion.div>

            {/* "Welcome to" */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="font-display text-17 text-white/60 mt-2 mb-1"
            >
              <StaggerText text="Welcome to" delay={1400} perChar={30} />
            </motion.div>

            {/* "Afribit AI" */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.1 }}
              className="font-display font-semibold text-34 text-white tracking-tight"
            >
              <StaggerText text="Afribit AI" delay={2100} perChar={40} />
            </motion.div>

            {/* Horizontal rule */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: showHr ? 40 : 0, opacity: showHr ? 0.3 : 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-px bg-white mt-6"
            />
          </motion.div>

          {/* Setup button */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: showBtn ? 1 : 0, y: showBtn ? 0 : 24 }}
            transition={SPRING}
            className="absolute bottom-[20%] left-0 right-0 px-5 flex justify-center"
          >
            <div className="w-full max-w-[320px]">
              <PillButton onClick={handleStart} aria-label="Get started">
                Get started
              </PillButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
