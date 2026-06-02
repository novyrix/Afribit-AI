import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BitcoinMark } from '../components/ui/Icons'

const GITHUB_URL = 'https://github.com/afribit/sats-connectors'

const NAV = [
  { to: '/developers', label: 'Overview', exact: true },
  { to: '/developers/connectors', label: 'Connectors', exact: false },
  { to: '/developers/spec', label: 'Spec', exact: false },
]

function NavLink({
  to,
  label,
  active,
}: {
  to: string
  label: string
  active: boolean
}) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-pill text-14 font-text transition-colors ${
        active ? 'text-white bg-white/10' : 'text-white/55 hover:text-white/80'
      }`}
    >
      {label}
    </Link>
  )
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-bg/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/developers" className="flex items-center gap-2.5">
            <span className="text-bitcoin">
              <BitcoinMark size={26} />
            </span>
            <span className="font-brand font-semibold text-17 tracking-tight">
              SATS Connectors
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                label={n.label}
                active={
                  n.exact ? pathname === n.to : pathname.startsWith(n.to)
                }
              />
            ))}
          </nav>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-pill text-14 font-text text-white/70 border border-white/15 hover:bg-white/5 transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 mt-24">
        <div className="max-w-6xl mx-auto px-5 py-12 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-white/80">
            <span className="text-bitcoin">
              <BitcoinMark size={20} />
            </span>
            <span className="font-brand font-semibold">Afribit Africa</span>
          </div>
          <p className="text-13 text-white/45 font-text">
            Built by Afribit Africa · Kibera, Nairobi, Kenya
          </p>
          <p className="text-13 text-white/45 font-text">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-white/70">
              github.com/afribit/sats-connectors
            </a>{' '}
            · MIT License
          </p>
          <p className="text-13 text-white/45 font-text">
            connector-spec@afribit.africa
          </p>
        </div>
      </footer>
    </div>
  )
}
