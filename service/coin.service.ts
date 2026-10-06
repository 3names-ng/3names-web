import { api } from './api';

export interface CursorPaginationPayload {
  cursor?: string;
  limit?: number;
}

export interface ConvertEarningsPayload {
  amountNgn: number;
}

export interface WithdrawEarningsPayload {
  amountNgn: number;
  savedAccountId: string;
}

export interface AddWithdrawalAccountPayload {
  bankCode: string;
  bankName?: string;
  accountNumber: string;
}

export interface ResolveAccountPayload {
  accountNumber: string;
  bankCode: string;
}

export const coinService = {
  /**
   * Fetches current coin balance and earned cash balance (NGN)
   * GET /coins/balance
   */
  /**
   * Coins usable for game stakes: game coins (`bonusBalance`) only, which are
   * won or earned and never purchased. Purchased `balance` is for gifts.
   */
  stakeableCoins: (b: { bonusBalance?: number | string } | null | undefined) =>
    Number(b?.bonusBalance ?? 0),

  getBalance: async () => {
    const response = await api.get('/coins/balance');
    return response.data; // Expected payload: { id: string, balance: number, earnedBalance: number }
  },

  /**
   * Fetches paginated coin and earnings transaction history
   * GET /coins/transactions
   */
  listTransactions: async (pagination?: CursorPaginationPayload) => {
    const response = await api.get('/coins/transactions', { params: pagination });
    return response.data;
  },

  /**
   * Converts earned gift cash balance (NGN) into spendable coins
   * POST /coins/convert
   */
  convertEarnedToCoins: async (payload: ConvertEarningsPayload) => {
    const response = await api.post('/coins/convert', payload);
    return response.data; // Expected payload: { newBalance: CoinBalance, coinsAdded: number }
  },

  /**
   * Initiates bank withdrawal from earned gift cash balance
   * POST /coins/withdraw
   */
  withdrawEarnings: async (payload: WithdrawEarningsPayload) => {
    const response = await api.post('/coins/withdraw', payload);
    return response.data; // Expected payload: { success: boolean, reference: string }
  },

  /**
   * Resolves a bank account number to its account holder name
   * POST /coins/resolve-account
   */
  resolveAccountName: async (payload: ResolveAccountPayload) => {
    const response = await api.post('/coins/resolve-account', payload);
    return response.data; // Expected payload: { accountName: string }
  },

  /**
   * Lists the user's saved withdrawal bank accounts
   * GET /coins/withdrawal-accounts
   */
  getWithdrawalAccounts: async () => {
    const response = await api.get('/coins/withdrawal-accounts');
    return response.data;
  },

  /**
   * Saves a new withdrawal bank account (max 3, verified via Paystack)
   * POST /coins/withdrawal-accounts
   */
  addWithdrawalAccount: async (payload: AddWithdrawalAccountPayload) => {
    const response = await api.post('/coins/withdrawal-accounts', payload);
    return response.data;
  },

  /**
   * Deletes a saved withdrawal bank account (must keep at least one)
   * DELETE /coins/withdrawal-accounts/:id
   */
  deleteWithdrawalAccount: async (id: string) => {
    const response = await api.delete(`/coins/withdrawal-accounts/${id}`);
    return response.data;
  },
};