import { motion } from 'framer-motion'
import { ChevronRight } from '../ui/Icons'

const SPRING = { type: 'spring' as const, damping: 26, stiffness: 260 }

export function PageShell({
  title, onBack, children, action,
}: {
  title: string
  onBack: () => void
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={SPRING}
      className="absolute inset-0 flex flex-col overflow-hidden"
    >
      <header className="flex-shrink-0 flex items-center justify-between px-5 pt-10 pb-3">
        <button
          onClick={onBack}
          className="w-10 h-10 -ml-2 flex items-center justify-center text-white/65
                     hover:text-white transition-colors"
          aria-label="Back"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <span className="rotate-180"><ChevronRight size={22} /></span>
        </button>
        <h1 className="font-brand font-semibold text-16 text-white">{title}</h1>
        <div className="w-10 flex items-center justify-end">{action}</div>
      </header>

      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8"
        style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </motion.div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-ui text-11 text-white/40 tracking-wider uppercase mt-6 mb-2.5">
      {children}
    </h2>
  )
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="font-brand text-16 text-white/70">{title}</div>
      <div className="font-ui text-13 text-white/40 mt-2 max-w-xs leading-relaxed">{hint}</div>
    </div>
  )
}
