import { motion } from 'framer-motion'
import { Bolt, FediMark, ChevronRight, Dot } from './ui/Icons'

type Provider = 'blink' | 'fedi'

type WalletCardProps = {
  provider: Provider
  name: string
  descriptor: string
  connected?: boolean
  index: number
  onTap: () => void
}

function WalletCard({ provider, name, descriptor, connected, index, onTap }: WalletCardProps) {
  const Logo = provider === 'blink' ? Bolt : FediMark
  return (
    <motion.button
      onClick={onTap}
      initial={{ y: 50, opacity: 0, rotateX: 8 }}
      animate={{ y: 0, opacity: 1, rotateX: 0 }}
      transition={{ delay: index * 0.14, type: 'spring', damping: 14, stiffness: 220 }}
      whileTap={{ scale: 0.97 }}
      className="wallet-card w-full h-[110px] px-5 flex items-center gap-4 text-left group"
      style={{ transformPerspective: 800 }}
    >
      <div className="wallet-icon-block w-[52px] h-[52px] flex-shrink-0 flex items-center justify-center">
        <Logo size={26} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-brand font-semibold text-[19px] text-white leading-tight">
          {name}
        </div>
        <div className="font-ui text-13 text-white/55 leading-tight mt-0.5">
          {descriptor}
        </div>
        {connected && (
          <div className="flex items-center gap-1.5 mt-1">
            <Dot className="text-positive" />
            <span className="font-ui text-12 text-positive">Connected</span>
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
      className="fixed inset-0 flex flex-col"
    >
      <div className="pt-[20vh] px-5">
        <h1 className="font-brand font-semibold text-28 text-white">
          Connect a wallet
        </h1>
        <p className="font-ui text-15 text-white/50 mt-2">
          Choose one to start. You can add more later.
        </p>
      </div>

      <div className="flex-1 px-4 mt-10 flex flex-col gap-3.5 items-center">
        <WalletCard
          provider="blink"
          name="Blink"
          descriptor="Lightning wallet · Self-custodial"
          connected={hasBlink}
          index={0}
          onTap={onSelectBlink}
        />
        <WalletCard
          provider="fedi"
          name="Fedi"
          descriptor="Community ecash · Fedimint"
          connected={hasFedi}
          index={1}
          onTap={onSelectFedi}
        />
      </div>

      <div className="pb-8 flex justify-center">
        <button
          onClick={onSkip}
          className="font-ui text-15 text-white/40 hover:text-white/60 transition-colors"
        >
          I'll do this later
        </button>
      </div>
    </motion.div>
  )
}
