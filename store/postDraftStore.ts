// store/postDraftStore.ts
//
// Post drafts saved on the device (persisted to AsyncStorage). Saved from the
// Create screen (media post or text post), listed in the profile's Drafts
// tab, and reopened in the Create screen for editing/publishing.
//
// Picked/captured media lives in cache folders the OS may clear, so each
// draft's files are copied into the app's document directory
// (post-drafts/<draftId>/) and the draft stores those permanent uris.
//
// Drafts belong to the account that saved them (`ownerId`). Logging out does
// NOT clear them (this store is deliberately left out of session.ts's
// reset list): they're just hidden — every read goes through
// selectMyDrafts() — and reappear when the same user logs back in. Another
// account on the same device never sees them. They're deleted (files too)
// when the user deletes the draft or their account.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import type { Media } from "@/components/post/mediaItem";
import type { TextPostSlide } from "@/components/post/textPostComposer";
import { useAuthStore } from "@/store/authStore";
import type { SoundSelection } from "@/service/sound.service";

/** Tagged user as the Create screen holds it (extra fields are kept as-is). */
export interface DraftTaggedUser {
  id: string;
  username?: string;
}

export interface PostDraft {
  id: string;
  /** Id of the account that saved it */
  ownerId: string;
  kind: "media" | "text";
  caption: string;
  mediaList: Media[];
  /** Text-post slides (kind === "text") */
  slides: TextPostSlide[] | null;
  hashtags: string[];
  taggedUsers: DraftTaggedUser[];
  category: string;
  audience: "public" | "friends" | "school_only";
  commentPrivacy: "everyone" | "nobody";
  allowGift: boolean;
  /** Sound to play with the post (absent on drafts saved before sounds existed) */
  sound?: SoundSelection | null;
  createdAt: string;
  updatedAt: string;
}

export type PostDraftInput = Omit<
  PostDraft,
  "id" | "ownerId" | "createdAt" | "updatedAt"
>;

interface PostDraftState {
  drafts: PostDraft[];
  /** Draft the Create screen should open on its next focus */
  pendingOpenDraftId: string | null;
  /** Create or update (when `id` is given) a draft; returns its id */
  saveDraft: (input: PostDraftInput, id?: string | null) => Promise<string>;
  removeDraft: (id: string) => void;
  /** Ask the Create screen to open this draft (then navigate to it) */
  requestOpenDraft: (id: string) => void;
  /** Called by the Create screen once it has loaded the draft */
  consumePendingOpenDraft: () => PostDraft | null;
  /** Deletes every draft (and its files) of one account — on account deletion */
  removeDraftsForUser: (userId: string) => void;
}

const currentUserId = () => useAuthStore.getState().user?.id ?? null;

const DRAFTS_DIR = "post-drafts";

function draftDirectory(draftId: string) {
  return new FileSystem.Directory(FileSystem.Paths.document, DRAFTS_DIR, draftId);
}

/** Copies a file into the draft's folder (once) and returns the new uri. */
function persistFile(uri: string | undefined, dir: FileSystem.Directory) {
  if (!uri || uri.startsWith("http") || uri.startsWith(dir.uri)) return uri;
  try {
    const source = new FileSystem.File(uri);
    const name = uri.split("/").pop() || `${Date.now()}`;
    const target = new FileSystem.File(dir, name);
    if (!target.exists) source.copy(target);
    return target.uri;
  } catch (error) {
    // Keep the original uri: the draft still works until the cache is cleared.
    console.warn("[drafts] failed to persist media:", error);
    return uri;
  }
}

function persistMedia(draftId: string, mediaList: Media[]): Media[] {
  if (mediaList.length === 0) return mediaList;
  const dir = draftDirectory(draftId);
  try {
    if (!dir.exists) dir.create({ intermediates: true });
  } catch (error) {
    console.warn("[drafts] failed to create draft folder:", error);
    return mediaList;
  }
  return mediaList.map((media) => ({
    ...media,
    uri: persistFile(media.uri, dir) ?? media.uri,
    thumbnail: persistFile(media.thumbnail, dir),
  }));
}

function deleteDraftFiles(draftId: string) {
  try {
    const dir = draftDirectory(draftId);
    if (dir.exists) dir.delete();
  } catch (error) {
    console.warn("[drafts] failed to delete draft files:", error);
  }
}

export const usePostDraftStore = create<PostDraftState>()(
  persist(
    (set, get) => ({
      drafts: [],
      pendingOpenDraftId: null,

      saveDraft: async (input, id) => {
        const ownerId = currentUserId();
        if (!ownerId) throw new Error("Cannot save a draft while logged out");
        const now = new Date().toISOString();
        const existing = id
          ? get().drafts.find((d) => d.id === id && d.ownerId === ownerId)
          : undefined;
        const draftId =
          existing?.id ??
          `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const draft: PostDraft = {
          ...input,
          mediaList: persistMedia(draftId, input.mediaList),
          id: draftId,
          ownerId,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        // Newest first; an updated draft moves back to the top.
        set((state) => ({
          drafts: [draft, ...state.drafts.filter((d) => d.id !== draftId)],
        }));
        return draftId;
      },

      removeDraft: (id) => {
        deleteDraftFiles(id);
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
          pendingOpenDraftId:
            state.pendingOpenDraftId === id ? null : state.pendingOpenDraftId,
        }));
      },

      requestOpenDraft: (id) => set({ pendingOpenDraftId: id }),

      consumePendingOpenDraft: () => {
        const { pendingOpenDraftId, drafts } = get();
        if (!pendingOpenDraftId) return null;
        set({ pendingOpenDraftId: null });
        const userId = currentUserId();
        return (
          drafts.find(
            (d) => d.id === pendingOpenDraftId && d.ownerId === userId,
          ) ?? null
        );
      },

      removeDraftsForUser: (userId) => {
        const owned = get().drafts.filter((d) => d.ownerId === userId);
        owned.forEach((d) => deleteDraftFiles(d.id));
        set((state) => ({
          drafts: state.drafts.filter((d) => d.ownerId !== userId),
          pendingOpenDraftId: null,
        }));
      },
    }),
    {
      name: "post-draft-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ drafts: state.drafts }),
    },
  ),
);

/**
 * The signed-in user's drafts. Use this (never `state.drafts` directly) so
 * other accounts' drafts on this device stay hidden.
 */
export function selectMyDrafts(state: PostDraftState, userId: string | null | undefined) {
  if (!userId) return [];
  return state.drafts.filter((d) => d.ownerId === userId);
}
