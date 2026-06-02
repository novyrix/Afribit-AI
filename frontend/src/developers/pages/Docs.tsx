import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const TREE = `sats-connectors/
├── spec/
│   ├── connector-spec.ts       # TypeScript interface (authoritative)
│   ├── connector.schema.json   # JSON Schema for connector.json
│   └── SPEC.md
├── connectors/
│   └── your-service/
│       ├── connector.json      # Manifest
│       ├── index.ts            # SATSConnector implementation
│       ├── tests/
│       └── README.md
├── packages/
│   ├── connector-spec/         # @afribit/connector-spec
│   └── connector-test-suite/   # @afribit/connector-tests
└── tools/
    ├── cli/
    └── validator/`

const EXAMPLE = `import type {
  SATSConnector,
  ConnectorAuth,
  WalletBalance,
  Transaction,
} from '@afribit/connector-spec'

const API = 'https://api.your-service.com'

export const connector: SATSConnector = {
  async connect(auth) {
    try {
      await fetch(\`\${API}/me\`, {
        headers: { 'X-API-KEY': auth.apiKey! },
      })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async getBalances(auth): Promise<WalletBalance[]> {
    const res = await fetch(\`\${API}/balances\`, {
      headers: { 'X-API-KEY': auth.apiKey! },
    })
    const data = await res.json()
    return data.wallets.map((w: any) => ({
      walletId: w.id,
      sats: Math.round(w.msats / 1000),
      currency: w.currency,
      lastUpdated: Date.now(),
    }))
  },

  async getTransactions(auth, { limit = 25 }): Promise<Transaction[]> {
    const res = await fetch(\`\${API}/tx?limit=\${limit}\`, {
      headers: { 'X-API-KEY': auth.apiKey! },
    })
    const data = await res.json()
    return data.txs.map((t: any) => ({
      id: t.id,
      direction: t.in ? 'incoming' : 'outgoing',
      amountSats: Math.round(t.msats / 1000),
      currency: t.currency,
      createdAt: t.ts,
      status: 'settled',
      network: 'lightning',
      walletId: t.walletId,
    }))
  },

  async ping(auth) {
    const res = await fetch(\`\${API}/health\`, {
      headers: { 'X-API-KEY': auth.apiKey! },
    })
    return res.ok
  },
}

export default connector`

const QUICKSTART: { step: string; detail: React.ReactNode }[] = [
  { step: 'Fork the repository', detail: <>Fork <code className="text-bitcoin">github.com/novyrix/sats-connectors</code> and clone it locally.</> },
  { step: 'Create your connector folder', detail: <>Add a directory <code className="text-bitcoin">connectors/your-service/</code>.</> },
  { step: 'Write connector.json', detail: <>Describe your connector and validate it with <code className="text-bitcoin">npx @afribit/connector-validate</code>.</> },
  { step: 'Implement index.ts', detail: <>Fulfil the <Link to="/developers/spec" className="text-bitcoin">SATSConnector</Link> interface. Read-only, amounts in sats.</> },
  { step: 'Test locally', detail: <>Run <code className="text-bitcoin">npx @afribit/connector-tests</code> and verify live in the <Link to="/developers/playground" className="text-bitcoin">Playground</Link>.</> },
  { step: 'Submit for review', detail: <>Open the <Link to="/developers/submit" className="text-bitcoin">submission form</Link>. Afribit reviews within 48 hours.</> },
]

const RULES: string[] = [
  'Read-only. A connector must never create invoices or move funds.',
  'Normalise all amounts to sats and timestamps to unix milliseconds.',
  'Throw on unrecoverable read errors. SATS isolates each connector so one failure never blocks the others.',
  'Never log or persist credentials. They are passed per call via ConnectorAuth.',
  'Keep connector.json in sync with what your code actually supports.',
]

const SECTIONS = [
  { id: 'start', label: 'Getting started' },
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'structure', label: 'Repository layout' },
  { id: 'example', label: 'Example connector' },
  { id: 'rules', label: 'Rules of the road' },
  { id: 'review', label: 'Review & deploy' },
]

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-black/40 border border-white/10 rounded-glass p-4 overflow-x-auto text-13 font-numbers text-white/80 leading-relaxed">
      <code>{children}</code>
    </pre>
  )
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="font-brand font-semibold text-24">{title}</h2>
      {children}
    </section>
  )
}

export default function Docs() {
  return (
    <div className="max-w-6xl mx-auto px-5 pt-12 pb-8">
      <div className="mb-10">
        <h1 className="font-brand font-bold text-34 mb-2">Developer Documentation</h1>
        <p className="text-15 text-white/55 font-text max-w-2xl">
          A practical guide to building, testing and shipping a SATS connector. For the full
          interface reference, see the{' '}
          <Link to="/developers/spec" className="text-bitcoin">specification</Link>.
        </p>
      </div>

      <div className="grid lg:grid-cols-[200px_1fr] gap-10">
        <nav className="hidden lg:block sticky top-24 self-start space-y-1">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block px-3 py-1.5 rounded-glass text-13 font-text text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="space-y-14 min-w-0"
        >
          <Block id="start" title="Getting started">
            <p className="text-15 text-white/65 font-text leading-relaxed">
              A connector teaches SATS how to read balances and transactions from a wallet or
              infrastructure provider. You own and maintain it; SATS calls a small set of
              read-only methods and treats every connector identically. If your service has an
              API that can return a balance and a transaction history, you can write a connector.
            </p>
          </Block>

          <Block id="quickstart" title="Quickstart">
            <ol className="space-y-4">
              {QUICKSTART.map((q, i) => (
                <li key={q.step} className="flex gap-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-pill bg-white/10 text-white/70 text-13 font-numbers shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-15 text-white/85 font-text font-medium">{q.step}</p>
                    <p className="text-14 text-white/55 font-text leading-relaxed">{q.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Block>

          <Block id="structure" title="Repository layout">
            <p className="text-15 text-white/65 font-text leading-relaxed">
              Connectors live alongside the spec and tooling in one public repository. Your work
              is confined to a single folder under <code className="text-bitcoin">connectors/</code>.
            </p>
            <Code>{TREE}</Code>
          </Block>

          <Block id="example" title="Example connector">
            <p className="text-15 text-white/65 font-text leading-relaxed">
              A minimal, complete connector for an API-key service. Note how every amount is
              converted to sats and timestamps are passed through as unix milliseconds.
            </p>
            <Code>{EXAMPLE}</Code>
          </Block>

          <Block id="rules" title="Rules of the road">
            <ul className="space-y-2.5">
              {RULES.map((r) => (
                <li key={r} className="flex gap-3 text-15 text-white/65 font-text leading-relaxed">
                  <span className="text-bitcoin shrink-0">—</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block id="review" title="Review & deploy">
            <p className="text-15 text-white/65 font-text leading-relaxed">
              Submissions create a tracking issue and the Afribit team reviews within 48 hours.
              Review criteria: does it implement the spec, does it only read data, do the tests
              pass, and is the manifest complete? On approval your connector is merged and
              deployed to SATS, where it appears in the{' '}
              <Link to="/developers/connectors" className="text-bitcoin">directory</Link> and the{' '}
              <Link to="/developers/status" className="text-bitcoin">health board</Link>.
            </p>
          </Block>
        </motion.div>
      </div>
    </div>
  )
}
