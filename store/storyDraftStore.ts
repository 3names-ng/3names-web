// store/storyDraftStore.ts
//
// Optimistic story publishing. A story is added to the home rail the moment
// the user shares it and uploaded in the background. The upload outlives the
// screen that started it (the camera screen closes right away), so it runs
// here rather than in a component.
//
// Events (listened to in components/home/stories.tsx):
//   NEW_STORY_PUBLISHED { tempId, story } — add the temp story to the rail
//   NEW_STORY_CONFIRMED { tempId }        — upload done; refetch for the real one
//   NEW_STORY_REMOVED   { tempId }        — upload failed; drop the temp story
//
// On failure the story's draft is kept in this store (not persisted — local
// media uris don't outlive the app session reliably) so tapping "Your story"
// reopens it ready to share again.

import { create } from "zustand";
import { DeviceEventEmitter } from "react-native";
import { storyService } from "@/service/story.service";
import { createOptimisticId } from "@/hooks/useOptimisticMutation";
import { showError, showSuccess } from "@/components/ui/toast";
import type { StoryItem } from "@/components/story/storyScreen";
import type { SoundSelection } from "@/service/sound.service";

export type StoryDraft = (
  | {
      kind: "media";
      /** filterId: video filter the server applies on upload (photos have it baked in) */
      media: { uri: string; type: "photo" | "video"; filterId?: string; liveFiltered?: boolean };
    }
  | {
      kind: "text";
      text: string;
      bgColorIndex: number;
      textAlign: "center" | "left" | "right";
    }
) & {
  /** Sound to play with the story, restored on retry */
  sound?: SoundSelection | null;
};

interface StoryDraftState {
  /** The draft of the last story whose upload failed, if any */
  failedDraft: StoryDraft | null;
  clearFailedDraft: () => void;
}

export const useStoryDraftStore = create<StoryDraftState>()((set) => ({
  failedDraft: null,
  clearFailedDraft: () => set({ failedDraft: null }),
}));

interface PublishStoryOptions {
  /** The upload, or a function that prepares it (e.g. compresses the video) after the screen closes */
  formData: FormData | (() => Promise<FormData>);
  /** Shown in the rail while the upload runs */
  story: Omit<StoryItem, "id">;
  /** Restored for a retry if the upload fails */
  draft: StoryDraft;
  successMessage: string;
  errorMessage: string;
}

/**
 * Shows the story in the rail immediately and uploads it in the background.
 * Fire-and-forget: callers close their screen right after calling this.
 */
export function publishStoryInBackground({
  formData,
  story,
  draft,
  successMessage,
  errorMessage,
}: PublishStoryOptions) {
  const tempId = createOptimisticId("story");
  useStoryDraftStore.setState({ failedDraft: null });
  DeviceEventEmitter.emit("NEW_STORY_PUBLISHED", {
    tempId,
    story: { ...story, id: tempId },
  });

  Promise.resolve(typeof formData === "function" ? formData() : formData)
    .then((form) => storyService.createStory(form))
    .then(() => {
      DeviceEventEmitter.emit("NEW_STORY_CONFIRMED", { tempId });
      showSuccess(successMessage);
    })
    .catch((error: any) => {
      console.error("Story upload failed:", error?.response?.data ?? error);
      DeviceEventEmitter.emit("NEW_STORY_REMOVED", { tempId });
      useStoryDraftStore.setState({ failedDraft: draft });
      showError(error?.response?.data?.message || errorMessage);
    });
}
