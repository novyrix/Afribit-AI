/**
 * Brand & UI SVG icons (no emojis anywhere).
 * All icons are 24px viewBox, currentColor stroke/fill.
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
})

export function BitcoinMark({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" stroke="none" {...rest}>
      <path d="M14.93 10.86c.41-1.32-.55-2.04-1.97-2.51l.46-1.83-1.12-.28-.45 1.78c-.29-.07-.6-.14-.9-.21l.45-1.79-1.12-.28-.46 1.83c-.24-.06-.48-.11-.72-.17v-.01l-1.54-.39-.3 1.19s.83.19.81.2c.45.11.54.41.52.65l-.52 2.08c.03.01.07.02.12.04l-.12-.03-.73 2.92c-.06.14-.2.34-.52.27.01.02-.81-.2-.81-.2l-.56 1.28 1.45.36c.27.07.53.14.79.2l-.46 1.86 1.12.28.46-1.83c.31.08.6.16.9.23l-.46 1.83 1.12.28.46-1.86c1.92.36 3.36.22 3.97-1.52.49-1.4-.02-2.21-1.03-2.74.73-.17 1.28-.65 1.43-1.66zm-2.56 3.62c-.35 1.4-2.71.64-3.48.45l.61-2.45c.77.19 3.24.57 2.87 2zm.35-3.64c-.32 1.27-2.28.62-2.92.46l.55-2.22c.64.16 2.7.46 2.37 1.76z"/>
    </svg>
  )
}

export function Bolt({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  )
}

/** Stylised Fedi mark: interlocking circles representing federation */
export function FediMark({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" />
    </svg>
  )
}

export function ChevronRight({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}

export function Menu({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <line x1="4"  y1="7"  x2="20" y2="7" />
      <line x1="4"  y1="12" x2="20" y2="12" />
      <line x1="4"  y1="17" x2="20" y2="17" />
    </svg>
  )
}

export function Plus({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <line x1="12" y1="5"  x2="12" y2="19" />
      <line x1="5"  y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function Mic({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

export function ArrowUp({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="6 11 12 5 18 11" />
    </svg>
  )
}

export function Check({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <polyline points="4 12 10 18 20 6" />
    </svg>
  )
}

export function Eye({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOff({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M17.94 17.94A10.4 10.4 0 0 1 12 19c-6 0-10-7-10-7a18.5 18.5 0 0 1 4.06-5" />
      <path d="M9.9 4.24A9.7 9.7 0 0 1 12 4c6 0 10 7 10 7a18.4 18.4 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

export function ArrowUpRight({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  )
}

export function ArrowDownLeft({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <line x1="17" y1="7" x2="7" y2="17" />
      <polyline points="17 17 7 17 7 7" />
    </svg>
  )
}

export function Home({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-4v-6h-8v6H4a1 1 0 0 1-1-1z" />
    </svg>
  )
}

export function Clock({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  )
}

export function ChartLine({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 19h18" />
      <polyline points="4 15 9 9 13 12 20 5" />
    </svg>
  )
}

export function User({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

export function Settings({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  )
}

export function Shield({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" />
    </svg>
  )
}

/** Generic dot used as connected/active indicator */
export function Dot({ size = 8, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" {...rest}>
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  )
}
