// components/rarityStyles.ts
//
// One place that defines what makes each rarity tier *feel* different —
// colors, glow, badge label, and which animation a GiftGridItem should
// run. Tweak freely; nothing else needs to change.

import { RARITY } from './giftsData';
import { RarityConfig } from './GiftGridItem';

export const RARITY_CONFIG: Record<string, RarityConfig> = {
  [RARITY.COMMON]: {
    label: undefined,
    borderColor: '#3A3A45',
    glowColor: 'transparent',
    badgeColor: '#5B5B66',
    gradient: ['#232329', '#232329'],
    animation: 'none',
    coinColor: '#FFD35C',
  },
  [RARITY.RARE]: {
    label: 'RARE',
    borderColor: '#4FB6FF',
    glowColor: '#4FB6FF',
    badgeColor: '#2E8FE0',
    gradient: ['#1E3A52', '#16212E'],
    animation: 'pulse',
    coinColor: '#FFD35C',
  },
  [RARITY.EPIC]: {
    label: 'EPIC',
    borderColor: '#C566FF',
    glowColor: '#C566FF',
    badgeColor: '#9B3FE0',
    gradient: ['#3A1E52', '#241429'],
    animation: 'wobble',
    coinColor: '#FFD35C',
  },
  [RARITY.LEGENDARY]: {
    label: 'LEGENDARY',
    borderColor: '#FFB23E',
    glowColor: '#FF7A3E',
    badgeColor: '#FF7A3E',
    gradient: ['#52301E', '#2E1A14'],
    animation: 'shimmer',
    coinColor: '#FFD35C',
  },
  [RARITY.MYTHIC]: {
    label: 'MYTHIC',
    borderColor: '#8A5CFF',
    glowColor: '#C9A8FF',
    badgeColor: '#7C3AED',
    gradient: ['#2E1065', '#0F0524'],
    animation: 'shimmer',
    coinColor: '#C9A8FF',
  },
} as const;

export function getRarityConfig(rarity: string | undefined | null): RarityConfig {
  if (!rarity) return RARITY_CONFIG[RARITY.COMMON];
  return RARITY_CONFIG[rarity] || RARITY_CONFIG[RARITY.COMMON];
}