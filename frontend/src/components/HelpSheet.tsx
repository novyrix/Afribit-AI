import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight } from './ui/Icons'
import { PillButton } from './ui/Glass'

type Variant = 'blink' | 'fedi'

const STEPS: Record<Variant, { title: string; url: string; urlLabel: string; steps: string[] }> = {
  blink: {
    title: 'Get your Blink API key',
    url: 'https://dashboard.blink.sv',
    urlLabel: 'Open Blink dashboard',
    steps: [
      'Sign in to the Blink dashboard.',
      'Open Settings → API Keys.',
      'Create a key with read & receive scope.',
      'Copy the key and paste it here.',
    ],
  },
  fedi: {
    title: 'Find your federation details',
    url: 'https://app.fedi.xyz',
    urlLabel: 'Open Fedi',
    steps: [
      'Open the Fedi app and go to your active federation.',
      'Tap the federation name to view details.',
      'Copy the federation ID.',
      'If invited, also copy the fed1… invite code.',
    ],
  },
}

export function HelpSheet({
  variant, open, onClose,
}: {
  variant: Variant
  open: boolean
  onClose: () => void
}) {
  const data = STEPS[variant]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed left-0 right-0 bottom-0 z-50 glass rounded-t-[28px] px-6 pt-3 pb-8"
            style={{ maxHeight: '55vh', overflowY: 'auto' }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-white/25" />
            </div>

            <h3 className="font-display font-semibold text-20 text-white">
              {data.title}
            </h3>

            <ol className="mt-5 flex flex-col gap-3.5">
              {data.steps.map((s, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 border border-white/20
                                   flex items-center justify-center font-display text-13 text-white/75">
                    {i + 1}
                  </span>
                  <span className="font-text text-15 text-white/80 leading-snug">{s}</span>
                </li>
              ))}
            </ol>

            <a
              href={data.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-flex items-center gap-1 font-text text-15 text-bitcoin hover:opacity-80"
            >
              {data.urlLabel}
              <ArrowUpRight size={16} />
            </a>

            <div className="mt-6">
              <PillButton onClick={onClose}>Got it</PillButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
