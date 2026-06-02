// SATS Connector Specification
// In-repo home of the @afribit/connector-spec contract. Every connector in the
// SATS network implements SATSConnector; SATS calls these methods and does not
// care how they are implemented internally.

export interface ConnectorAuth {
  apiKey?: string;
  oauthToken?: string;
  inviteCode?: string;
  nwcUri?: string;
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
}

export interface ConnectorInfo {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
}

export interface GetTransactionsOptions {
  limit?: number;
  before?: number;
  walletId?: string;
}

export interface SATSConnector {
  connect(auth: ConnectorAuth): Promise<{ success: boolean; error?: string }>;
  getBalances(auth: ConnectorAuth): Promise<WalletBalance[]>;
  getTransactions(auth: ConnectorAuth, options: GetTransactionsOptions): Promise<Transaction[]>;
  disconnect?(): Promise<void>;
  ping?(auth: ConnectorAuth): Promise<boolean>;
}

// ─── connector.json manifest ──────────────────────────────────────────────────

export type ConnectorCategory = 'wallet' | 'exchange' | 'on-ramp' | 'data';
export type ConnectorStatus = 'verified' | 'in_review' | 'deprecated' | 'community';
export type AuthType = 'api_key' | 'oauth' | 'invite_code' | 'nwc_uri' | 'none';

export interface ConnectorCapabilities {
  read_balance: boolean;
  read_transactions: boolean;
  read_profile: boolean;
  create_invoice: boolean;
  send_payment: boolean;
  on_ramp: boolean;
  off_ramp: boolean;
}

export interface ConnectorAuthSpec {
  type: AuthType;
  label?: string;
  placeholder?: string;
  validation_regex?: string;
  help_url?: string;
  help_text?: string;
}

export interface ConnectorManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  category: ConnectorCategory;
  logo: string;
  color: string;
  website: string;
  documentation: string;
  license: string;
  author: {
    name: string;
    github: string;
    contact?: string;
  };
  capabilities: ConnectorCapabilities;
  auth: ConnectorAuthSpec;
  supported_currencies: string[];
  supported_networks: string[];
  regions: string[];
  status: ConnectorStatus;
  last_reviewed?: string;
}
