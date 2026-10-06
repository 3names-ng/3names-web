import { useAuthStore } from "@/store/authStore";

/**
 * Hook to check if the current user has a specific perk from their level.
 *
 * Usage:
 *   const { hasPerk } = usePerks();
 *   if (hasPerk("Create Groups")) { ... }
 */
export function usePerks() {
  const user = useAuthStore((state) => state.user);
  const perks = user?.appLevel?.perks ?? [];
  const level = user?.appLevel?.level ?? 0;

  const hasPerk = (perk: string): boolean => perks.includes(perk);

  /** True when the user's app level is at or above `minLevel`. */
  const isLevelAtLeast = (minLevel: number): boolean => level >= minLevel;

  return { perks, level, hasPerk, isLevelAtLeast };
}
