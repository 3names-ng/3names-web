// useHydration.ts
import { useOnboardingStore } from "@/store/onboardingStore";
import { useEffect, useState } from "react";

export function useHydration() {
  const _hasHydrated = useOnboardingStore((state) => state._hasHydrated);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (_hasHydrated) {
      setHydrated(true);
    }
  }, [_hasHydrated]);

  return hydrated;
}