import type {
  SATSConnector,
  ConnectorAuth,
  WalletBalance,
  Transaction,
} from '../../spec';

// Afribit federation connector. Reading real ecash balances requires the
// Fedimint WASM client (@fedimint/core + @fedimint/transport-web) running in a
// web worker. That runtime is browser-only and is not yet wired into the SATS
// backend, so this reference connector is a typed placeholder pending the WASM
// integration. It validates the contract without fabricating balances.

const NOT_READY = 'Fedimint WASM client is not yet available in this runtime.';

export const connector: SATSConnector = {
  async connect(_auth: ConnectorAuth) {
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
