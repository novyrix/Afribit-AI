import { Link } from 'react-router-dom'
import { Glass } from '../components/ui/Glass'
import { Check, ChevronRight } from '../components/ui/Icons'
import type { ConnectorManifest } from '../lib/api'
import {
  AUTH_META,
  CATEGORY_META,
  ConnectorLogo,
  StatusBadge,
} from './shared'

const CORE_CAPS: { key: keyof ConnectorManifest['capabilities']; label: string }[] = [
  { key: 'read_balance', label: 'Balance' },
  { key: 'read_transactions', label: 'History' },
  { key: 'read_profile', label: 'Profile' },
]

export default function ConnectorCard({ c }: { c: ConnectorManifest }) {
  return (
    <Glass
      radius="card"
      className="p-5 flex flex-col gap-4 h-full"
      style={{ borderTop: `2px solid ${c.color}55` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ConnectorLogo connector={c} />
          <div className="min-w-0">
            <p className="font-brand font-semibold text-17 truncate">{c.name}</p>
            <p className="text-12 text-white/45 font-text">
              {CATEGORY_META[c.category]} &middot; v{c.version}
            </p>
          </div>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <p className="text-14 text-white/60 font-text line-clamp-2">{c.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {CORE_CAPS.map((cap) => {
          const on = c.capabilities[cap.key]
          return (
            <span
              key={cap.key}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-pill text-12 font-text ${
                on ? 'bg-positive/12 text-positive' : 'bg-white/5 text-white/30'
              }`}
            >
              {on && <Check size={12} />}
              {cap.label}
            </span>
          )
        })}
      </div>

      <dl className="grid grid-cols-2 gap-y-1.5 text-12 font-text mt-auto">
        <dt className="text-white/40">Auth</dt>
        <dd className="text-white/70 text-right">{AUTH_META[c.auth.type]}</dd>
        <dt className="text-white/40">Networks</dt>
        <dd className="text-white/70 text-right truncate">
          {c.supported_networks.join(', ') || '-'}
        </dd>
        <dt className="text-white/40">Author</dt>
        <dd className="text-white/70 text-right truncate">{c.author.name}</dd>
      </dl>

      <Link
        to={`/developers/connectors/${c.id}`}
        className="mt-1 inline-flex items-center justify-center gap-1 h-10 rounded-pill bg-white/8 hover:bg-white/12 transition-colors text-14 font-text"
      >
        View Connector
        <ChevronRight size={16} />
      </Link>
    </Glass>
  )
}
