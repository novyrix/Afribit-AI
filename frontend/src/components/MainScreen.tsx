import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Menu } from './ui/Icons'
import { Sidebar } from './main/Sidebar'
import { PortfolioCard } from './main/PortfolioCard'
import { ToolStrip } from './main/ToolStrip'
import { OrbBar, type ChatMessage } from './main/OrbBar'
import { api, type WalletConnection } from '../lib/api'

const SPRING = { type: 'spring' as const, damping: 22, stiffness: 220 }

export function MainScreen({
  token, onAddWallet,
}: {
  token: string
  onAddWallet: () => void
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [wallets, setWallets] = useState<WalletConnection[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    let cancelled = false
    api.listWallets(token)
      .then(({ wallets }) => { if (!cancelled) setWallets(wallets) })
      .catch(() => { /* noop */ })
    return () => { cancelled = true }
  }, [token])

  const connectedIds = wallets.map((w) => w.walletType)

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Header: just menu icon, no centred title */}
      <header className="flex items-center justify-between px-5 pt-10 pb-2">
        <motion.button
          onClick={() => setSidebarOpen(true)}
          whileTap={{ scale: 0.92, rotate: 90 }}
          transition={{ type: 'spring', damping: 18, stiffness: 280 }}
          className="w-11 h-11 flex items-center justify-center
                     text-white/65 hover:text-white transition-colors"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </motion.button>
        <div />
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-3 flex flex-col gap-4">
        <PortfolioCard token={token} />

        <AnimatePresence>
          {messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING}
              className="flex flex-col gap-2.5"
            >
              {messages.slice(-12).map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`${m.role === 'user' ? 'msg-user max-w-[82%]' : 'msg-ai max-w-[92%]'} font-ui text-15`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="px-2">
        <ToolStrip connectedIds={connectedIds} />
      </div>

      <div className="px-4 pb-6 pt-3">
        <OrbBar
          token={token}
          onMessage={(m) => setMessages((prev) => [...prev, m])}
        />
      </div>

      <Sidebar
        token={token}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddWallet={onAddWallet}
      />
    </div>
  )
}
