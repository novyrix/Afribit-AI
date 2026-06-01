import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronRight, Check } from './ui/Icons'

const SPRING = { type: 'spring' as const, damping: 24, stiffness: 220 }

type Consents = {
  terms: boolean
  data: boolean
  notFinancial: boolean
}

export function TermsScreen({ onContinue }: { onContinue: () => void }) {
  const [open, setOpen] = useState<'terms' | 'privacy' | null>('terms')
  const [consents, setConsents] = useState<Consents>({
    terms: false, data: false, notFinancial: false,
  })

  const allChecked = consents.terms && consents.data && consents.notFinancial

  function toggle(k: keyof Consents) {
    setConsents((c) => ({ ...c, [k]: !c[k] }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={SPRING}
      className="absolute inset-0 flex flex-col px-5"
    >
      <div className="pt-[10vh] flex-shrink-0">
        <div className="font-ui text-12 text-white/35 tracking-wider uppercase">
          Before we begin
        </div>
        <h1 className="font-brand font-semibold text-28 text-white mt-3">
          Terms & privacy
        </h1>
        <p className="font-ui text-15 text-white/55 mt-2 leading-relaxed">
          A quick summary of how Afribit SATS works and what it stores.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto mt-5 flex flex-col gap-3 pb-2"
           style={{ minHeight: 0 }}>
        <Accordion
          title="Terms of use"
          isOpen={open === 'terms'}
          onToggle={() => setOpen(open === 'terms' ? null : 'terms')}
        >
          <p>Afribit SATS is a free assistant for understanding your Bitcoin
            activity. It connects to wallets you choose and answers questions
            about your money. It is not a wallet itself and never moves funds.</p>
          <p>You are responsible for keeping your wallet credentials safe. The
            service is provided as-is, without warranty.</p>
        </Accordion>

        <Accordion
          title="Privacy"
          isOpen={open === 'privacy'}
          onToggle={() => setOpen(open === 'privacy' ? null : 'privacy')}
        >
          <p>Your data stays on your device and our session store. We do not sell
            data or share it with advertisers.</p>
          <DataTable />
        </Accordion>
      </div>

      <div className="flex-shrink-0 flex flex-col gap-3 pt-3">
        <ConsentRow
          checked={consents.terms}
          onClick={() => toggle('terms')}
          label="I agree to the terms of use"
        />
        <ConsentRow
          checked={consents.data}
          onClick={() => toggle('data')}
          label="I understand what data is stored"
        />
        <ConsentRow
          checked={consents.notFinancial}
          onClick={() => toggle('notFinancial')}
          label="I understand this is not financial advice"
        />

        <button
          onClick={() => allChecked && onContinue()}
          disabled={!allChecked}
          className="glass-pill h-14 w-full font-ui font-semibold text-16 text-white
                     mt-1 mb-6 flex items-center justify-center gap-2 transition-opacity"
          style={{
            background: 'rgba(247,147,26,0.18)',
            borderColor: 'rgba(247,147,26,0.55)',
            opacity: allChecked ? 1 : 0.5,
          }}
        >
          Continue
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  )
}

function Accordion({
  title, isOpen, onToggle, children,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="font-brand font-medium text-16 text-white">{title}</span>
        <motion.span animate={{ rotate: isOpen ? 90 : 0 }} className="text-white/50">
          <ChevronRight size={18} />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22 }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 flex flex-col gap-3 font-ui text-14 text-white/65 leading-relaxed">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

function DataTable() {
  const rows: [string, string][] = [
    ['Session token', 'Local device only'],
    ['Wallet API keys', 'Encrypted, server session'],
    ['Transaction history', 'Read-only, for analysis'],
    ['Chat messages', 'Kept until you delete them'],
    ['AI preferences', 'Local device only'],
  ]
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden mt-1">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className="flex items-center justify-between px-3 py-2.5 text-13"
          style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="text-white/75">{k}</span>
          <span className="text-white/45 text-right">{v}</span>
        </div>
      ))}
    </div>
  )
}

function ConsentRow({
  checked, onClick, label,
}: {
  checked: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 text-left">
      <span
        className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center transition-colors"
        style={{
          background: checked ? 'rgba(247,147,26,0.20)' : 'rgba(255,255,255,0.05)',
          border: checked ? '1px solid #F7931A' : '1px solid rgba(255,255,255,0.18)',
        }}
      >
        {checked && <Check size={14} className="text-bitcoin" />}
      </span>
      <span className="font-ui text-14 text-white/75">{label}</span>
    </button>
  )
}
