// store/pendingSoundStore.ts
//
// "Use this sound" (TikTok-style): a viewer taps a post's or story's sound and
// chooses to make their own post/story with it. The choice is parked here and
// picked up by the screen it leads to:
//   post  → the Create tab (app/(tabs)/explore.tsx), straight to its camera
//   story → the "Create Story" sheet in the story rail (components/home/stories.tsx);
//           the text composer or the story camera (app/(features)/cameraScreen.tsx)
//           then takes the sound.

import { create } from "zustand";
import type { SoundSelection } from "@/service/sound.service";

export type PendingSoundTarget = "post" | "story";

interface PendingSoundState {
  pending: { selection: SoundSelection; target: PendingSoundTarget } | null;
  /** The story rail should open its "Create Story" sheet */
  storyChooserRequested: boolean;
  setPending: (selection: SoundSelection, target: PendingSoundTarget) => void;
  requestStoryChooser: () => void;
  clearStoryChooserRequest: () => void;
  /** Returns the sound waiting for this screen (if any) and clears it */
  consume: (target: PendingSoundTarget) => SoundSelection | null;
}

export const usePendingSoundStore = create<PendingSoundState>()((set, get) => ({
  pending: null,
  storyChooserRequested: false,
  setPending: (selection, target) => set({ pending: { selection, target } }),
  requestStoryChooser: () => set({ storyChooserRequested: true }),
  clearStoryChooserRequest: () => set({ storyChooserRequested: false }),
  consume: (target) => {
    const { pending } = get();
    if (!pending || pending.target !== target) return null;
    set({ pending: null });
    return pending.selection;
  },
}));
