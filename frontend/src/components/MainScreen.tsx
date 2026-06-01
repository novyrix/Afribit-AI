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
    <div className="fixed inset-0 bg-bg flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-12 pb-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-glass flex items-center justify-center
                     bg-white/[0.06] border border-white/15 text-white hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display font-semibold text-17 text-white">Afribit</h1>
        <div className="w-10 h-10" />
      </header>

      {/* Display zone */}
      <main className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        <PortfolioCard token={token} />

        <AnimatePresence>
          {messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING}
              className="glass rounded-card p-4 flex flex-col gap-3"
            >
              {messages.slice(-8).map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[88%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}
                >
                  <div
                    className={`px-3.5 py-2 rounded-2xl font-text text-15 leading-snug
                                ${m.role === 'user'
                                  ? 'bg-bitcoin text-black'
                                  : 'bg-white/[0.07] border border-white/15 text-white'}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Tool strip */}
      <div className="px-4">
        <ToolStrip connectedIds={connectedIds} />
      </div>

      {/* Orb bar */}
      <div className="px-4 pb-6 pt-2">
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
