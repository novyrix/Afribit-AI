import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Bolt, FediMark, Plus, Home, Clock, ChartLine,
  User, Settings, Shield, Dot,
} from '../ui/Icons'
import { api, type WalletConnection } from '../../lib/api'

const SPRING = { type: 'spring' as const, damping: 26, stiffness: 280 }

type WalletWithBalance = WalletConnection & { balanceSats?: number; loading?: boolean }

export function Sidebar({
  token, open, onClose, onAddWallet,
}: {
  token: string
  open: boolean
  onClose: () => void
  onAddWallet: () => void
}) {
  const [wallets, setWallets] = useState<WalletWithBalance[]>([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function load() {
      try {
        const { wallets: list } = await api.listWallets(token)
        if (cancelled) return
        setWallets(list.map((w) => ({ ...w, loading: true })))
        for (const w of list) {
          try {
            const b = await api.getWalletBalance(token, w.id)
            if (cancelled) return
            setWallets((prev) => prev.map((p) =>
              p.id === w.id ? { ...p, balanceSats: b.balanceSats, loading: false } : p
            ))
          } catch {
            if (cancelled) return
            setWallets((prev) => prev.map((p) =>
              p.id === w.id ? { ...p, loading: false } : p
            ))
          }
        }
      } catch {
        /* noop */
      }
    }
    load()
    return () => { cancelled = true }
  }, [open, token])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={SPRING}
            className="fixed top-0 left-0 bottom-0 z-50 w-[76vw] max-w-sm glass rounded-r-[28px]
                       flex flex-col px-5 pt-12 pb-6"
          >
            <h2 className="font-display font-semibold text-15 text-white/45 uppercase tracking-wider">
              Wallets
            </h2>

            <div className="mt-3 flex flex-col gap-2">
              {wallets.length === 0 && (
                <p className="font-text text-13 text-white/40">No wallets connected</p>
              )}
              {wallets.map((w) => {
                const Logo = w.walletType === 'blink' ? Bolt : FediMark
                return (
                  <div key={w.id} className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-glass flex items-center justify-center"
                         style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <Logo size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-15 text-white truncate">
                        {w.nickname ?? (w.walletType === 'blink' ? 'Blink' : 'Fedi')}
                      </div>
                      <div className="font-mono text-12 text-white/55 tabular">
                        {w.loading ? '…' : w.balanceSats !== undefined
                          ? `${w.balanceSats.toLocaleString()} sats`
                          : '—'}
                      </div>
                    </div>
                    {w.status === 'active' && <Dot className="text-positive" />}
                  </div>
                )
              })}

              <button
                onClick={() => { onClose(); onAddWallet() }}
                className="mt-1 flex items-center gap-3 py-2 text-left hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-glass flex items-center justify-center"
                     style={{ background: 'rgba(247,147,26,0.12)', border: '1px solid rgba(247,147,26,0.35)' }}>
                  <Plus size={16} className="text-bitcoin" />
                </div>
                <span className="font-display text-15 text-bitcoin">Add wallet</span>
              </button>
            </div>

            <div className="h-px bg-white/10 my-5" />

            <nav className="flex flex-col gap-1">
              <NavItem icon={<Home size={20} />} label="Home" active />
              <NavItem icon={<Clock size={20} />} label="History" />
              <NavItem icon={<ChartLine size={20} />} label="Analytics" />
            </nav>

            <div className="flex-1" />

            <nav className="flex flex-col gap-1">
              <NavItem icon={<User size={20} />} label="Account" />
              <NavItem icon={<Settings size={20} />} label="Settings" />
              <NavItem icon={<Shield size={20} />} label="Security" />
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`flex items-center gap-3 py-2.5 px-1 text-left rounded-glass transition-colors
                       ${active ? 'text-white' : 'text-white/55 hover:text-white/80'}`}>
      <span className={active ? 'text-bitcoin' : ''}>{icon}</span>
      <span className="font-display text-15">{label}</span>
    </button>
  )
}
