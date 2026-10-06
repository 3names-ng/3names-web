import { create } from "zustand";

export interface PushBannerData {
  title: string;
  body: string;
  type: string;
  data: Record<string, string>;
}

interface PushNotificationBannerState {
  /** The notification currently being displayed */
  current: PushBannerData | null;
  /** Waiting notifications */
  queue: PushBannerData[];
  /** Add a notification to the queue (shows immediately if idle) */
  show: (notification: PushBannerData) => void;
  /** Dismiss current and show next in queue */
  hide: () => void;
}

/** Cap so the queue doesn't grow unbounded */
const MAX_QUEUE = 5;

export const usePushNotificationBannerStore =
  create<PushNotificationBannerState>((set, get) => ({
    current: null,
    queue: [],

    show: (notification) => {
      const { current } = get();
      if (!current) {
        // Nothing on screen — show immediately
        set({ current: notification });
      } else {
        // Something on screen — enqueue (drop oldest if over cap)
        set((s) => ({
          queue: [...s.queue, notification].slice(-MAX_QUEUE),
        }));
      }
    },

    hide: () => {
      const { queue } = get();
      if (queue.length > 0) {
        // Pop next from queue
        const [next, ...rest] = queue;
        set({ current: next, queue: rest });
      } else {
        set({ current: null, queue: [] });
      }
    },
  }));
