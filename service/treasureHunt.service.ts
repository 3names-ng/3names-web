import { api } from './api';

// ── Types ──

export interface TreasureAvailable {
  id: string;
  name: string;
  description: string | null;
  bonusCoins: number;
  gift: {
    id: string;
    name: string;
    animationUrl: string | null;
    videoUrl: string | null;
  } | null;
  claimsRemaining: number;
  /** Short-lived ticket from the server, required to claim this hunt. */
  claimToken: string;
}

export interface TreasureClaimResult {
  success: boolean;
  gift: {
    id: string;
    name: string;
    animationUrl: string | null;
    videoUrl: string | null;
  } | null;
  /** Total coins awarded (gift value + bonus). Paid as game coins: not giftable or withdrawable. */
  bonusCoins: number;
  /** Always 0 now; treasure rewards no longer pay cash. */
  earnedNgn: number;
  message: string;
}

export interface RecentClaim {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePictureUrl: string | null;
  };
  gift: {
    id: string;
    name: string;
    bonusCoins: number;
    animationUrl: string | null;
  } | null;
  huntName: string;
  bonusCoins: number;
  claimedAt: string;
}

// ── API Calls ──

export const treasureHuntService = {
  /** Check if there's a treasure available on a given screen */
  checkAvailable: async (route: string) => {
    const res = await api.get('/treasure-hunt/available', { params: { route } });
    return res.data as { treasure: TreasureAvailable | null };
  },

  /** Claim a treasure hunt reward */
  claim: async (huntId: string, claimToken: string) => {
    const res = await api.post(`/treasure-hunt/claim/${huntId}`, { claimToken });
    return res.data as TreasureClaimResult;
  },

  /** Get recent claims for display */
  getRecentClaims: async (limit = 10) => {
    const res = await api.get('/treasure-hunt/recent-claims', { params: { limit } });
    return res.data as { claims: RecentClaim[] };
  },
};
