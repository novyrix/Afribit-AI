import { motion } from 'framer-motion'

const INTERFACE_CODE = `export interface SATSConnector {
  connect(auth: ConnectorAuth):
    Promise<{ success: boolean; error?: string }>;

  getBalances(auth: ConnectorAuth):
    Promise<WalletBalance[]>;

  getTransactions(auth: ConnectorAuth, options: GetTransactionsOptions):
    Promise<Transaction[]>;

  disconnect?(): Promise<void>;
  ping?(auth: ConnectorAuth): Promise<boolean>;
}

export interface WalletBalance {
  sats: number;
  currency: string;
  walletId: string;
  walletLabel?: string;
  lastUpdated: number;
}

export interface Transaction {
  id: string;
  direction: 'incoming' | 'outgoing';
  amountSats: number;
  currency: string;
  memo?: string;
  createdAt: number;
  status: 'settled' | 'pending' | 'failed';
  network: 'lightning' | 'onchain' | 'ecash';
  walletId: string;
}`

const MANIFEST_CODE = `{
  "id": "blink-wallet",
  "version": "1.0.0",
  "name": "Blink",
  "description": "Bitcoin wallet by Galoy",
  "category": "wallet",
  "logo": "blink.svg",
  "color": "#FFD700",
  "website": "https://blink.sv",
  "documentation": "https://dev.blink.sv",
  "license": "MIT",
  "author": { "name": "...", "github": "...", "contact": "..." },
  "capabilities": {
    "read_balance": true,
    "read_transactions": true,
    "read_profile": false,
    "create_invoice": false,
    "send_payment": false,
    "on_ramp": false,
    "off_ramp": false
  },
  "auth": {
    "type": "api_key",
    "label": "API Key",
    "help_url": "https://dashboard.blink.sv"
  },
  "supported_currencies": ["BTC", "USD"],
  "supported_networks": ["lightning", "onchain"],
  "regions": ["global"],
  "status": "verified"
}`

const MANIFEST_FIELDS: { name: string; desc: string }[] = [
  { name: 'id', desc: 'Unique slug, lowercase with hyphens (e.g. blink-wallet).' },
  { name: 'version', desc: 'Semantic version of the connector.' },
  { name: 'category', desc: 'One of: wallet, exchange, on-ramp, data.' },
  { name: 'capabilities', desc: 'Boolean flags for each supported operation.' },
  { name: 'auth', desc: 'Authentication method and field metadata.' },
  { name: 'supported_networks', desc: 'lightning, onchain, and/or ecash.' },
  { name: 'status', desc: 'verified, in_review, deprecated or community.' },
]

const AUTH_TYPES: { name: string; desc: string }[] = [
  { name: 'api_key', desc: 'User supplies a long-lived API key from the provider dashboard.' },
  { name: 'oauth', desc: 'Standard OAuth token flow.' },
  { name: 'invite_code', desc: 'Federation or community invite string.' },
  { name: 'nwc_uri', desc: 'Nostr Wallet Connect connection URI.' },
  { name: 'none', desc: 'No credentials required.' },
]

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'manifest', label: 'connector.json' },
  { id: 'interface', label: 'TypeScript Interface' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'auth', label: 'Auth Patterns' },
  { id: 'errors', label: 'Error Handling' },
  { id: 'testing', label: 'Testing' },
  { id: 'maintenance', label: 'Maintenance' },
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

export default function Spec() {
  return (
    <div className="max-w-6xl mx-auto px-5 pt-12 pb-8">
      <div className="mb-10">
        <h1 className="font-brand font-bold text-34 mb-2">Connector Specification</h1>
        <p className="text-15 text-white/55 font-text max-w-2xl">
          Everything you need to implement a SATS connector. SATS calls a small set of read-only
          methods; how you fulfil them is up to you.
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
          <Block id="overview" title="Overview">
            <p className="text-15 text-white/65 font-text leading-relaxed">
              A connector is a small package that teaches SATS how to read balances and
              transactions from a wallet or infrastructure provider. It implements the{' '}
              <code className="text-bitcoin">SATSConnector</code> interface and ships a{' '}
              <code className="text-bitcoin">connector.json</code> manifest. SATS treats every
              connector identically, regardless of the underlying technology.
            </p>
          </Block>

          <Block id="manifest" title="connector.json">
            <p className="text-15 text-white/65 font-text leading-relaxed">
              The manifest describes your connector to the directory and the app. It declares
              capabilities, authentication and supported networks.
            </p>
            <Code>{MANIFEST_CODE}</Code>
            <div className="space-y-2">
              {MANIFEST_FIELDS.map((f) => (
                <div key={f.name} className="flex gap-3">
                  <code className="text-bitcoin text-13 font-numbers shrink-0 w-44">{f.name}</code>
                  <span className="text-14 text-white/60 font-text">{f.desc}</span>
                </div>
              ))}
            </div>
          </Block>

          <Block id="interface" title="TypeScript Interface">
            <p className="text-15 text-white/65 font-text leading-relaxed">
              Implement these methods. <code className="text-bitcoin">connect</code>,{' '}
              <code className="text-bitcoin">getBalances</code> and{' '}
              <code className="text-bitcoin">getTransactions</code> are required;{' '}
              <code className="text-bitcoin">disconnect</code> and{' '}
              <code className="text-bitcoin">ping</code> are optional.
            </p>
            <Code>{INTERFACE_CODE}</Code>
          </Block>

          <Block id="implementation" title="Implementation Guide">
            <ol className="space-y-3 text-15 text-white/65 font-text list-decimal pl-5">
              <li>Create a folder under the registry with your connector id.</li>
              <li>Add a connector.json manifest and an index.ts default export.</li>
              <li>Implement connect, getBalances and getTransactions against your API.</li>
              <li>Normalise amounts to sats and timestamps to unix milliseconds.</li>
              <li>Never store or move funds. The mandate is strictly read-only.</li>
            </ol>
          </Block>

          <Block id="auth" title="Authentication Patterns">
            <div className="space-y-2">
              {AUTH_TYPES.map((a) => (
                <div key={a.name} className="flex gap-3">
                  <code className="text-bitcoin text-13 font-numbers shrink-0 w-28">{a.name}</code>
                  <span className="text-14 text-white/60 font-text">{a.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-14 text-white/55 font-text">
              Credentials are passed to your methods via the{' '}
              <code className="text-bitcoin">ConnectorAuth</code> object and are encrypted at rest
              by SATS.
            </p>
          </Block>

          <Block id="errors" title="Error Handling">
            <p className="text-15 text-white/65 font-text leading-relaxed">
              Return <code className="text-bitcoin">{'{ success: false, error }'}</code> from{' '}
              <code className="text-bitcoin">connect</code> on auth failure. For{' '}
              <code className="text-bitcoin">getBalances</code> and{' '}
              <code className="text-bitcoin">getTransactions</code>, throw on unrecoverable errors;
              SATS isolates failures per connector so one failing wallet never blocks the others.
            </p>
          </Block>

          <Block id="testing" title="Testing">
            <p className="text-15 text-white/65 font-text leading-relaxed">
              Provide a sandbox or test credentials so reviewers can verify connect, balance reads
              and transaction reads end to end before your connector is marked verified.
            </p>
          </Block>

          <Block id="maintenance" title="Maintenance">
            <p className="text-15 text-white/65 font-text leading-relaxed">
              Bump the manifest version on changes and keep your API integration current. Connectors
              that break and are not maintained are moved to deprecated status.
            </p>
          </Block>
        </motion.div>
      </div>
    </div>
  )
}
