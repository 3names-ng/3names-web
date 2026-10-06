import { create } from "zustand";

/**
 * Tiny fan-out for "this data changed on the server" signals.
 *
 * Optimistic writes apply locally and sync in the background, so a screen
 * navigated to right after a save can fetch before the write lands and show
 * stale data. A mutation bumps a key when its request settles; destination
 * screens subscribe to that key (see useSyncSignal) and refetch.
 */
interface SyncState {
  versions: Record<string, number>;
  bump: (key: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  versions: {},
  bump: (key) =>
    set((state) => ({
      versions: { ...state.versions, [key]: (state.versions[key] ?? 0) + 1 },
    })),
}));

/** Bump a key from outside React (e.g. inside a mutation callback). */
export const bumpSync = (key: string) => useSyncStore.getState().bump(key);

/** Well-known invalidation keys shared between writers and readers. */
export const syncKeys = {
  hostelList: "hostel:list",
  hostel: (id: string) => `hostel:${id}`,
  marketplaceList: "marketplace:list",
  marketplace: (id: string) => `marketplace:${id}`,
  profile: "profile",
  posts: "posts",
  events: "events",
  jobs: "jobs",
} as const;
