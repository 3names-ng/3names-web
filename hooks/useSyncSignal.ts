import { useEffect, useRef } from "react";
import { useSyncStore } from "@/store/syncStore";

/**
 * Refetches when a background write for `key` settles.
 *
 * Skips the initial version value so mounting a screen doesn't trigger a
 * duplicate fetch (screen mount fetches already).
 *
 *   useSyncSignal(syncKeys.hostel(id), fetchHostelDetail);
 */
export function useSyncSignal(key: string | undefined, onSync: () => void) {
  const version = useSyncStore((state) =>
    key ? (state.versions[key] ?? 0) : 0,
  );

  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    onSyncRef.current();
  }, [version]);
}
