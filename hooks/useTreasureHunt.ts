import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'expo-router';
import {
  treasureHuntService,
  type TreasureAvailable,
  type TreasureClaimResult,
} from '@/service/treasureHunt.service';
import { useAuthStore } from '@/store/authStore';
import { showError, showSuccess } from '@/components/ui/toast';

export function useTreasureHunt() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [treasure, setTreasure] = useState<TreasureAvailable | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<TreasureClaimResult | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Check for treasure whenever the route changes
  useEffect(() => {
    if (!user || !pathname) return;

    let cancelled = false;

    async function check() {
      setLoading(true);
      try {
        const { treasure: t } = await treasureHuntService.checkAvailable(pathname);
        if (!cancelled) {
          setTreasure(t);
        }
      } catch (err: any) {
        console.error('🗺️ [Treasure] Failed to check available:', err?.response?.data?.message || err?.message);
        if (!cancelled) setTreasure(null);
      }
      if (!cancelled) setLoading(false);
    }

    check();
    return () => { cancelled = true; };
  }, [pathname, user]);

  // Claim the treasure
  const claim = useCallback(async () => {
    if (!treasure || claiming) return;

    setClaiming(true);
    try {
      const result = await treasureHuntService.claim(treasure.id, treasure.claimToken);
      setClaimResult(result);
      showSuccess(result.message);
      // Clear the treasure so the button disappears
      setTreasure(null);
      // Show result briefly, then close modal
      setTimeout(() => {
        setShowClaimModal(false);
        setClaimResult(null);
      }, 3000);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to claim treasure');
    }
    setClaiming(false);
  }, [treasure, claiming]);

  // Dismiss the modal without claiming
  const dismiss = useCallback(() => {
    setShowClaimModal(false);
  }, []);

  return {
    treasure,
    loading,
    claiming,
    claimResult,
    showClaimModal,
    setShowClaimModal,
    claim,
    dismiss,
    hasTreasure: !!treasure,
  };
}
