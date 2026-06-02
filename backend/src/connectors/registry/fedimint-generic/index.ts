import type {
  SATSConnector,
  ConnectorAuth,
  WalletBalance,
  Transaction,
} from '../../spec';

// Generic Fedimint connector — same WASM-backed implementation as
// fedimint-afribit, but takes the invite code from auth.inviteCode rather than
// embedding it. Pending the Fedimint WASM client integration in the backend
// runtime, this is a typed placeholder that validates the contract.

const NOT_READY = 'Fedimint WASM client is not yet available in this runtime.';

export const connector: SATSConnector = {
  async connect(auth: ConnectorAuth) {
    if (!auth.inviteCode?.trim()) {
      return { success: false, error: 'A federation invite code is required.' };
    }
    return { success: false, error: NOT_READY };
  },

  async getBalances(_auth: ConnectorAuth): Promise<WalletBalance[]> {
    throw new Error(NOT_READY);
  },

  async getTransactions(_auth: ConnectorAuth): Promise<Transaction[]> {
    return [];
  },

  async ping(_auth: ConnectorAuth): Promise<boolean> {
    return false;
  },
};
