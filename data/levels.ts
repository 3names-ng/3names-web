// constants/levels.ts

export interface Level {
  level: number;
  title: string;
  emoji: string;
  minXp: number;
  maxXp: number | null;
  badge: string;
  color: string;
  rewardCoins: number;
  perks: string[];
}

export const SEED_LEVELS: Level[] = [
  { level: 1, title: 'Fresher', emoji: '🌱', minXp: 0, maxXp: 1_999, badge: 'fresher', color: '#22C55E', rewardCoins: 0, perks: ['Basic profile, post'] },
  { level: 2, title: 'Explorer', emoji: '📘', minXp: 2_000, maxXp: 5_999, badge: 'explorer', color: '#3B82F6', rewardCoins: 100, perks: ['Custom username color'] },
  { level: 3, title: 'Elite', emoji: '✨', minXp: 6_000, maxXp: 11_999, badge: 'elite', color: '#A855F7', rewardCoins: 200, perks: ['Story highlights'] },
  { level: 4, title: 'Professional', emoji: '💼', minXp: 12_000, maxXp: 19_999, badge: 'professional', color: '#6366F1', rewardCoins: 300, perks: ['Verified badge'] },
  { level: 5, title: 'Hero', emoji: '🦸', minXp: 20_000, maxXp: 34_999, badge: 'hero', color: '#F59E0B', rewardCoins: 400, perks: ['Verified badge', 'Priority in "For You"', 'Monetization (gifts → cash)'] },
  { level: 6, title: 'Champion', emoji: '🏅', minXp: 35_000, maxXp: 54_999, badge: 'champion', color: '#EF4444', rewardCoins: 500, perks: ['Verified badge', 'Custom profile frame', 'Monetization (gifts → cash)'] },
  { level: 7, title: 'Leader', emoji: '👑', minXp: 55_000, maxXp: 79_999, badge: 'leader', color: '#EC4899', rewardCoins: 750, perks: ['Verified badge', 'Create Groups', 'Monetization (gifts → cash)'] },
  { level: 8, title: 'Ambassador', emoji: '🌍', minXp: 80_000, maxXp: 119_999, badge: 'ambassador', color: '#14B8A6', rewardCoins: 1_000, perks: ['Verified badge', 'Campus-wide reach', 'Monetization (gifts → cash)'] },
  { level: 9, title: 'Superstar', emoji: '⭐', minXp: 120_000, maxXp: 179_999, badge: 'superstar', color: '#FACC15', rewardCoins: 1_250, perks: ['Verified badge', 'Exclusive events', 'Monetization (gifts → cash)'] },
  { level: 10, title: 'Celebrity', emoji: '🎖️', minXp: 180_000, maxXp: 249_999, badge: 'celebrity', color: '#F97316', rewardCoins: 1_500, perks: ['Verified badge', 'Monetization (gifts → cash)'] },
  { level: 11, title: 'Master', emoji: '💠', minXp: 250_000, maxXp: 349_999, badge: 'master', color: '#06B6D4', rewardCoins: 2_000, perks: ['Verified badge', 'Analytics dashboard'] },
  { level: 12, title: 'Ultimate', emoji: '🚀', minXp: 350_000, maxXp: 499_999, badge: 'ultimate', color: '#8B5CF6', rewardCoins: 2_500, perks: ['Verified badge', 'Influencer tools'] },
  { level: 13, title: 'Grandmaster', emoji: '🧠', minXp: 500_000, maxXp: 749_999, badge: 'grandmaster', color: '#DC2626', rewardCoins: 3_000, perks: ['Verified badge', 'Admin-like campus tools'] },
  { level: 14, title: 'Pioneer', emoji: '🏛️', minXp: 750_000, maxXp: 999_999, badge: 'pioneer', color: '#0EA5E9', rewardCoins: 4_000, perks: ['Verified badge', 'Name campus events'] },
  { level: 15, title: 'Legend', emoji: '💎', minXp: 1_000_000, maxXp: null, badge: 'legend', color: '#FFD700', rewardCoins: 5_000, perks: ['Verified badge', 'Hall of Fame + physical merch'] },
];