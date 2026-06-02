import type { ReactNode } from 'react'

export const COLORS = {
  bg: '#0B0B0F',
  surface: '#141414',
  bitcoin: '#F7931A',
  positive: '#00C896',
  negative: '#FF4D4D',
  border: 'rgba(255,255,255,0.08)',
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card p-5 ${className}`} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      {children}
    </div>
  )
}

export function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <Card>
      <div className="font-ui text-xs uppercase tracking-wide text-white/40">{label}</div>
      <div className="font-mono text-2xl mt-1" style={{ color: accent ?? '#fff' }}>{value}</div>
      {sub && <div className="font-ui text-xs text-white/40 mt-1">{sub}</div>}
    </Card>
  )
}

export function Btn({ children, onClick, variant = 'primary', disabled, type = 'button', className = '' }: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: COLORS.bitcoin, color: '#0B0B0F' },
    ghost: { background: 'transparent', color: '#fff', border: `1px solid ${COLORS.border}` },
    danger: { background: 'rgba(255,77,77,0.15)', color: COLORS.negative },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-ui text-sm font-medium px-4 py-2 rounded-pill transition-opacity disabled:opacity-40 ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-ui text-xs text-white/50 mb-1 block">{label}</span>
      {children}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 rounded-glass font-ui text-sm text-white outline-none ${props.className ?? ''}`}
      style={{ background: '#0B0B0F', border: `1px solid ${COLORS.border}` }}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 rounded-glass font-ui text-sm text-white outline-none ${props.className ?? ''}`}
      style={{ background: '#0B0B0F', border: `1px solid ${COLORS.border}` }}
    />
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
    </div>
  )
}

export function ErrorNote({ msg }: { msg: string }) {
  return (
    <div className="font-ui text-sm px-3 py-2 rounded-glass" style={{ background: 'rgba(255,77,77,0.12)', color: COLORS.negative }}>
      {msg}
    </div>
  )
}
