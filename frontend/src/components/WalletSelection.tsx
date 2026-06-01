import { motion } from 'framer-motion'
import { Bolt, FediMark, ChevronRight, Dot } from './ui/Icons'

const SPRING = { type: 'spring' as const, damping: 18, stiffness: 220 }

type Provider = 'blink' | 'fedi'

type WalletCardProps = {
  provider: Provider
  name: string
  descriptor: string
  connected?: boolean
  onTap: () => void
}

function WalletCard({ provider, name, descriptor, connected, onTap }: WalletCardProps) {
  const Logo = provider === 'blink' ? Bolt : FediMark
  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.97 }}
      transition={SPRING}
      className="glass rounded-wallet w-full h-24 px-5 flex items-center gap-4 text-left group"
    >
      {/* Logo container */}
      <div
        className="w-12 h-12 rounded-glass flex-shrink-0 flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <Logo size={26} className="text-white" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-18 text-white leading-tight">
          {name}
        </div>
        <div className="font-text text-13 text-white/55 leading-tight mt-0.5">
          {descriptor}
        </div>
        {connected && (
          <div className="flex items-center gap-1.5 mt-1">
            <Dot className="text-positive" />
            <span className="font-text text-12 text-positive">Connected</span>
          </div>
        )}
      </div>

      <ChevronRight
        size={16}
        className="text-white/30 flex-shrink-0 group-hover:text-white/60 transition-colors"
      />
    </motion.button>
  )
}

export function WalletSelection({
  hasBlink, hasFedi,
  onSelectBlink, onSelectFedi, onSkip,
}: {
  hasBlink?: boolean
  hasFedi?: boolean
  onSelectBlink: () => void
  onSelectFedi: () => void
  onSkip: () => void
}) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      className="fixed inset-0 bg-bg flex flex-col"
    >
      {/* Heading block at ~20% from top */}
      <div className="pt-[20vh] px-5">
        <h1 className="font-display font-semibold text-28 text-white">
          Connect a wallet
        </h1>
        <p className="font-text text-15 text-white/50 mt-2">
          Choose one to start. You can add more later.
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 px-4 mt-10 flex flex-col gap-3.5 items-center">
        <WalletCard
          provider="blink"
          name="Blink"
          descriptor="Lightning wallet · Self-custodial"
          connected={hasBlink}
          onTap={onSelectBlink}
        />
        <WalletCard
          provider="fedi"
          name="Fedi"
          descriptor="Community ecash · Fedimint"
          connected={hasFedi}
          onTap={onSelectFedi}
        />
      </div>

      {/* Skip link */}
      <div className="pb-8 flex justify-center">
        <button
          onClick={onSkip}
          className="font-text text-15 text-white/40 hover:text-white/60 transition-colors"
        >
          I'll do this later
        </button>
      </div>
    </motion.div>
  )
}
