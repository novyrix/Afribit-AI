import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Glass } from '../../components/ui/Glass'
import { Shield, Check } from '../../components/ui/Icons'
import { api, type ConnectorManifest } from '../../lib/api'
import ConnectorCard from '../ConnectorCard'

const GITHUB_URL = 'https://github.com/novyrix/sats-connectors'

const STEPS = [
  {
    n: '01',
    title: 'Implement the spec',
    body: 'Build a connector that satisfies the standard SATSConnector interface. Read balances and transactions with a read-only mandate.',
  },
  {
    n: '02',
    title: 'Submit for review',
    body: 'Open a pull request with your connector.json manifest and implementation. We review for security and correctness.',
  },
  {
    n: '03',
    title: 'Reach users',
    body: 'Once verified, your wallet appears in the Afribit app for 200,000+ users in Kibera and across Kenya.',
  },
]

const SECURITY = [
  'Read-only mandate: connectors never move funds.',
  'Credentials are encrypted at rest with AES-256-GCM.',
  'Every verified connector is security reviewed before listing.',
  'Open source and auditable under the MIT License.',
]

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { type: 'spring' as const, damping: 22, stiffness: 220 },
}

export default function Landing() {
  const [recent, setRecent] = useState<ConnectorManifest[]>([])

  useEffect(() => {
    api
      .listConnectors()
      .then((r) => setRecent(r.connectors.slice(0, 4)))
      .catch(() => setRecent([]))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-5">
      <section className="pt-20 pb-16 text-center">
        <motion.p
          {...fade}
          className="text-13 font-text tracking-[0.25em] text-bitcoin uppercase mb-5"
        >
          SATS Connector Network
        </motion.p>
        <motion.h1
          {...fade}
          className="font-brand font-bold text-34 sm:text-44 leading-tight max-w-3xl mx-auto"
        >
          The open standard for Bitcoin wallet connectivity in Africa
        </motion.h1>
        <motion.p
          {...fade}
          className="text-17 text-white/55 font-text max-w-2xl mx-auto mt-5"
        >
          Connect your infrastructure. Reach 200,000+ users in Kibera and growing.
        </motion.p>
        <motion.div
          {...fade}
          className="flex flex-wrap items-center justify-center gap-3 mt-9"
        >
          <Link
            to="/developers/connectors"
            className="h-12 px-6 inline-flex items-center rounded-pill bg-bitcoin text-bg font-display font-semibold text-15 hover:opacity-90 transition-opacity"
          >
            Browse Connectors
          </Link>
          <Link
            to="/developers/spec"
            className="h-12 px-6 inline-flex items-center rounded-pill border border-white/15 font-display font-semibold text-15 hover:bg-white/5 transition-colors"
          >
            Read the Spec
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="h-12 px-6 inline-flex items-center rounded-pill border border-white/15 font-display font-semibold text-15 hover:bg-white/5 transition-colors"
          >
            Submit a Connector
          </a>
        </motion.div>
      </section>

      <motion.section {...fade} className="py-16">
        <h2 className="font-brand font-semibold text-24 text-center mb-10">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <Glass key={s.n} radius="card" className="p-6">
              <p className="font-numbers text-28 text-bitcoin mb-3">{s.n}</p>
              <p className="font-brand font-semibold text-18 mb-2">{s.title}</p>
              <p className="text-14 text-white/55 font-text leading-relaxed">{s.body}</p>
            </Glass>
          ))}
        </div>
      </motion.section>

      <motion.section {...fade} className="py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-brand font-semibold text-24">Recent Connectors</h2>
          <Link to="/developers/connectors" className="text-14 text-bitcoin font-text hover:opacity-80">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-14 text-white/40 font-text">Loading connectors...</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recent.map((c) => (
              <ConnectorCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </motion.section>

      <motion.section {...fade} className="py-16">
        <Glass radius="card" className="p-8 sm:p-12 text-center">
          <h2 className="font-brand font-semibold text-24 mb-3">Building a wallet for Africa?</h2>
          <p className="text-15 text-white/55 font-text max-w-2xl mx-auto mb-6">
            Integrate once and put your wallet in front of a fast-growing base of real Bitcoin
            users transacting in everyday commerce. The spec is open, the review is free.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="h-12 px-6 inline-flex items-center rounded-pill bg-bitcoin text-bg font-display font-semibold text-15 hover:opacity-90 transition-opacity"
          >
            Get Started on GitHub
          </a>
        </Glass>
      </motion.section>

      <motion.section {...fade} className="py-16">
        <div className="flex items-center gap-2 justify-center mb-8 text-positive">
          <Shield size={22} />
          <h2 className="font-brand font-semibold text-24 text-white">Security Model</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {SECURITY.map((s) => (
            <div key={s} className="flex items-start gap-3">
              <span className="text-positive mt-0.5 shrink-0">
                <Check size={18} />
              </span>
              <p className="text-14 text-white/65 font-text">{s}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
