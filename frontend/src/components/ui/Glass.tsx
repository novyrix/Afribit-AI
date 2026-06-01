import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'

type GlassProps = HTMLMotionProps<'div'> & {
  radius?: 'glass' | 'card' | 'wallet' | 'pill'
  children?: ReactNode
}

const radiusMap = {
  glass: 'rounded-glass',
  card: 'rounded-card',
  wallet: 'rounded-wallet',
  pill: 'rounded-pill',
} as const

export const Glass = forwardRef<HTMLDivElement, GlassProps>(
  ({ radius = 'card', className = '', children, ...rest }, ref) => (
    <motion.div
      ref={ref}
      className={`glass ${radiusMap[radius]} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
)
Glass.displayName = 'Glass'

type PillButtonProps = HTMLMotionProps<'button'> & {
  children: ReactNode
  disabled?: boolean
  fullWidth?: boolean
}

export function PillButton({
  children, disabled, fullWidth = true, className = '', ...rest
}: PillButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', damping: 18, stiffness: 320 }}
      disabled={disabled}
      className={`
        glass-pill h-13 px-6 font-display font-semibold text-17 text-white
        flex items-center justify-center gap-2
        disabled:opacity-40 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

export function GlassChip({
  children, onClick, className = '',
}: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', damping: 18, stiffness: 320 }}
      className={`glass-pill px-3 py-1.5 text-13 text-white/60 font-text ${className}`}
    >
      {children}
    </motion.button>
  )
}
