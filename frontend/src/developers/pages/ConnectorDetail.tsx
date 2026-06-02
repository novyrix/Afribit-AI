import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Glass } from '../../components/ui/Glass'
import { Check, ChevronRight } from '../../components/ui/Icons'
import { api, type ConnectorManifest } from '../../lib/api'
import {
  AUTH_META,
  CATEGORY_META,
  CAPABILITY_LABELS,
  ConnectorLogo,
  StatusBadge,
} from '../shared'

const GITHUB_URL = 'https://github.com/afribit/sats-connectors'
const TABS = ['Overview', 'API Reference', 'Changelog', 'Issues'] as const
type Tab = (typeof TABS)[number]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-brand font-semibold text-18">{title}</h3>
      {children}
    </div>
  )
}

export default function ConnectorDetail() {
  const { id } = useParams<{ id: string }>()
  const [c, setC] = useState<ConnectorManifest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('Overview')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api
      .getConnector(id)
      .then((m) => {
        setC(m)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <p className="max-w-4xl mx-auto px-5 pt-16 text-white/40 font-text">Loading...</p>
  }
  if (error || !c) {
    return (
      <div className="max-w-4xl mx-auto px-5 pt-16">
        <p className="text-negative font-text mb-4">Connector not found.</p>
        <Link to="/developers/connectors" className="text-bitcoin font-text">
          Back to directory
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-5 pt-8 pb-8">
      <Link
        to="/developers/connectors"
        className="inline-flex items-center gap-1 text-13 text-white/45 font-text hover:text-white/70 mb-6"
      >
        Directory
        <ChevronRight size={14} />
        <span className="text-white/70">{c.name}</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
      >
        <div className="flex items-start gap-4 mb-6">
          <ConnectorLogo connector={c} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-brand font-bold text-28">{c.name}</h1>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-14 text-white/50 font-text mt-1">
              by {c.author.name} &middot; {CATEGORY_META[c.category]} &middot; v{c.version} &middot;{' '}
              {c.license}
            </p>
            {c.last_reviewed && (
              <p className="text-12 text-white/35 font-text mt-1">
                Last reviewed {c.last_reviewed}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <a
            href={c.website || GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="h-11 px-5 inline-flex items-center rounded-pill bg-white/8 hover:bg-white/12 transition-colors text-14 font-text"
          >
            Website
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="h-11 px-5 inline-flex items-center rounded-pill border border-white/15 hover:bg-white/5 transition-colors text-14 font-text"
          >
            GitHub
          </a>
        </div>

        <div className="flex gap-1 border-b border-white/10 mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-14 font-text whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-bitcoin text-white'
                  : 'border-transparent text-white/45 hover:text-white/70'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' ? (
          <div className="space-y-10">
            <Section title="Description">
              <p className="text-15 text-white/65 font-text leading-relaxed">{c.description}</p>
            </Section>

            <Section title="Capabilities">
              <div className="grid sm:grid-cols-2 gap-2.5">
                {CAPABILITY_LABELS.map((cap) => {
                  const on = c.capabilities[cap.key]
                  return (
                    <div
                      key={cap.key}
                      className="flex items-center justify-between px-4 py-2.5 rounded-glass bg-white/4"
                    >
                      <span className="text-14 font-text text-white/70">{cap.label}</span>
                      {on ? (
                        <span className="inline-flex items-center gap-1 text-12 text-positive font-text">
                          <Check size={14} /> Supported
                        </span>
                      ) : (
                        <span className="text-12 text-white/30 font-text">Not supported</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </Section>

            <Section title="Authentication">
              <Glass radius="glass" className="p-5 space-y-2">
                <p className="text-14 font-text">
                  <span className="text-white/45">Method: </span>
                  <span className="text-white/80">{AUTH_META[c.auth.type]}</span>
                </p>
                {c.auth.label && (
                  <p className="text-14 font-text">
                    <span className="text-white/45">Field: </span>
                    <span className="text-white/80">{c.auth.label}</span>
                  </p>
                )}
                {c.auth.help_text && (
                  <p className="text-14 text-white/55 font-text leading-relaxed">
                    {c.auth.help_text}
                  </p>
                )}
                {c.auth.help_url && (
                  <a
                    href={c.auth.help_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-13 text-bitcoin font-text"
                  >
                    How to get credentials
                  </a>
                )}
              </Glass>
            </Section>

            <Section title="Supported Currencies & Networks">
              <div className="flex flex-wrap gap-2">
                {[...c.supported_currencies, ...c.supported_networks].map((x) => (
                  <span
                    key={x}
                    className="px-3 py-1.5 rounded-pill bg-white/6 text-13 font-text text-white/70"
                  >
                    {x}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="Region Availability">
              <div className="flex flex-wrap gap-2">
                {c.regions.length === 0 ? (
                  <span className="text-14 text-white/45 font-text">Global</span>
                ) : (
                  c.regions.map((r) => (
                    <span
                      key={r}
                      className="px-3 py-1.5 rounded-pill bg-white/6 text-13 font-text text-white/70"
                    >
                      {r}
                    </span>
                  ))
                )}
              </div>
            </Section>
          </div>
        ) : (
          <Glass radius="card" className="p-8 text-center">
            <p className="text-15 text-white/55 font-text">
              {tab} is not yet available for this connector.
            </p>
          </Glass>
        )}
      </motion.div>
    </div>
  )
}
