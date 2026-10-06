// store/projectTopicCacheStore.ts
//
// Offline project topics cache — persisted to AsyncStorage so the Project
// Topics screens can show their lists instantly and keep displaying them
// without a network connection. Same pattern as feedCacheStore /
// materialCacheStore: load the cache as soon as it rehydrates, then
// refresh from the server in the background. Lists are cached per filter
// set (search/category/level) so each view keeps its own snapshot.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProjectTopic } from "@/service/projectTopics.service";

interface ProjectTopicCacheState {
  /** filter-key -> last topics shown for that filter set */
  topicsByKey: Record<string, ProjectTopic[]>;
  /** True once the persisted cache has been loaded from AsyncStorage */
  rehydrated: boolean;
  /** Save the topic list for a filter set so it's readable offline */
  setCachedTopics: (key: string, topics: ProjectTopic[]) => void;
}

export const useProjectTopicCacheStore = create<ProjectTopicCacheState>()(
  persist(
    (set) => ({
      topicsByKey: {},
      rehydrated: false,

      setCachedTopics: (key, topics) =>
        set((state) => ({
          topicsByKey: { ...state.topicsByKey, [key]: topics },
        })),
    }),
    {
      name: "project-topic-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.rehydrated = true;
        }
      },
    },
  ),
);