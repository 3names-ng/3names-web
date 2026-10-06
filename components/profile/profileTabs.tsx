import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  LayoutGrid,
  PlaySquare,
  Bookmark,
  Tag,
  Eye,
  EyeOff,
  Heart,
  Repeat2,
  Trash2,
  Smartphone,
} from "lucide-react-native";

import { ThemedText } from "../ui/ThemedText";
import { postService } from "@/service/post.service";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useDelayedLoading } from "@/components/ui/skeleton";
import PostGridSkeleton from "./postGridSkeleton";
import {
  selectMyDrafts,
  usePostDraftStore,
  type PostDraft,
} from "@/store/postDraftStore";
import { useAuthStore } from "@/store/authStore";
import { useShallow } from "zustand/react/shallow";

type Tab = "posts" | "reshares" | "drafts" | "hide" | "saved" | "tagged";

const tabTranslationKeys: Record<Tab, `profile.tabPosts` | `profile.tabReshares` | `profile.tabDrafts` | `profile.tabHidden` | `profile.tabSaved` | `profile.tabTagged`> = {
  posts: "profile.tabPosts",
  reshares: "profile.tabReshares",
  drafts: "profile.tabDrafts",
  hide: "profile.tabHidden",
  saved: "profile.tabSaved",
  tagged: "profile.tabTagged",
};

interface PostMedia {
  url: string;
  mediaType?: string;
}

interface PostItem {
  id: string;
  description?: string;
  likesCount?: number;
  commentsCount?: number;
  media?: PostMedia[];
  post?: PostItem;
  /** Set for drafts saved on this device (see store/postDraftStore.ts) */
  localDraft?: PostDraft;
}

interface ProfileTabsProps {
  /**
   * Pass your profile header component (Avatar, Bio, Stats, Action buttons)
   * here so it scrolls smoothly with the grid without nesting ScrollViews.
   */
  headerComponent?: React.ReactNode;
}

const { width } = Dimensions.get("window");
const COLUMN_SIZE = width / 3 - 2;

export default function ProfileTabs({ headerComponent }: ProfileTabsProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("posts");
  const [data, setData] = useState<PostItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const showGridSkeleton = useDelayedLoading(loading);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Drafts saved on this device are listed ahead of the server's drafts.
  // Only this account's drafts (others on the device stay hidden).
  const userId = useAuthStore((state) => state.user?.id);
  const localDrafts = usePostDraftStore(
    useShallow((state) => selectMyDrafts(state, userId)),
  );
  const requestOpenDraft = usePostDraftStore((state) => state.requestOpenDraft);
  const removeDraft = usePostDraftStore((state) => state.removeDraft);
  const listData: PostItem[] =
    tab === "drafts"
      ? [
          ...localDrafts.map((draft) => ({ id: draft.id, localDraft: draft })),
          ...data,
        ]
      : data;

  const activeColor = "#FE2C55";
  const inactiveColor = "#8A8A94";

  // Fetch posts based on the active tab
  const fetchPostsByTab = useCallback(
    async (selectedTab: Tab, cursor?: string, isRefresh = false) => {
      try {
        if (!cursor && !isRefresh) setLoading(true);

        let response: { items: PostItem[]; nextCursor?: string | null } = {
          items: [],
          nextCursor: null,
        };

        const pagination = { limit: 18, cursor };

        switch (selectedTab) {
          case "posts":
            response = await postService.getMyPosts(pagination);
            break;
          case "reshares":
            // Reshare records; the reshared post is nested under `post`,
            // which renderItem already unwraps.
            response = await postService.getReshares(pagination);
            break;
          case "drafts":
            const drafts = await postService.getDrafts();
            response = {
              items: Array.isArray(drafts) ? drafts : [],
              nextCursor: null,
            };
            break;
          case "hide":
            response = await postService.getHiddenPosts(pagination);
            break;
          case "saved":
            response = await postService.getFavorites(pagination);
            break;
          case "tagged":
            response = await postService.getTaggedPosts(pagination);
            break;
        }

        const newItems = response?.items || [];
        setNextCursor(response?.nextCursor || null);

        if (isRefresh || !cursor) {
          setData(newItems);
        } else {
          setData((prev) => [...prev, ...newItems]);
        }
      } catch (error) {
        console.error(`Error fetching ${selectedTab}:`, error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPostsByTab(tab);
  }, [tab, fetchPostsByTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPostsByTab(tab, undefined, true);
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore && !loading) {
      setLoadingMore(true);
      fetchPostsByTab(tab, nextCursor);
    }
  };

  const handleUnhidePost = async (postId: string) => {
    try {
      await postService.unhidePost(postId);
      setData((prev) => prev.filter((item) => item.id !== postId));
    } catch (error) {
      console.error("Failed to unhide post:", error);
    }
  };

  // Opens the draft in the Create screen, filled in and ready to post.
  const handleOpenLocalDraft = (draft: PostDraft) => {
    requestOpenDraft(draft.id);
    router.push("/(tabs)/explore");
  };

  const handleDeleteLocalDraft = (draft: PostDraft) => {
    Alert.alert(t("profile.deleteDraft"), t("profile.deleteDraftConfirm"), [
      { text: t("action.cancel"), style: "cancel" },
      {
        text: t("action.delete"),
        style: "destructive",
        onPress: () => removeDraft(draft.id),
      },
    ]);
  };

  const renderLocalDraft = (draft: PostDraft) => {
    const firstMedia = draft.mediaList[0];
    const thumbnail =
      firstMedia?.type === "video" ? firstMedia.thumbnail : firstMedia?.uri;
    const firstSlide = draft.slides?.[0];
    const previewText = firstSlide?.text || draft.caption;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.gridCard}
        onPress={() => handleOpenLocalDraft(draft)}
      >
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        ) : (
          <ThemedView
            style={[
              styles.textOnlyCard,
              firstSlide?.backgroundColor
                ? { backgroundColor: firstSlide.backgroundColor }
                : null,
            ]}
          >
            <ThemedText numberOfLines={3} style={styles.textOnlyContent}>
              {previewText || t("profile.noContent")}
            </ThemedText>
          </ThemedView>
        )}

        <View style={styles.cardOverlay}>
          <View style={styles.statBadge}>
            <Smartphone size={11} color="#FFF" />
            <ThemedText style={styles.statText}>
              {t("profile.localDraft")}
            </ThemedText>
          </View>

          <Pressable
            style={styles.unhideButton}
            hitSlop={6}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteLocalDraft(draft);
            }}
          >
            <Trash2 size={14} color="#FFF" />
          </Pressable>
        </View>
      </TouchableOpacity>
    );
  };

  // Render individual grid card
  const renderItem = ({ item }: { item: PostItem }) => {
    if (item.localDraft) return renderLocalDraft(item.localDraft);

    const targetPost = item.post ?? item;
    const thumbnail = targetPost.media?.[0]?.url;

    const handlePressPost = () => {
      router.push({
        pathname: "/(features)/postDetailScreen",
        params: { id: targetPost.id },
      });
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.gridCard}
        onPress={handlePressPost}
      >
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        ) : (
          <ThemedView style={styles.textOnlyCard}>
            <ThemedText numberOfLines={3} style={styles.textOnlyContent}>
              {targetPost.description || t("profile.noContent")}
            </ThemedText>
          </ThemedView>
        )}

        {tab === "reshares" && (
          <View style={styles.reshareBadge}>
            <Repeat2 size={14} color="#FFF" />
          </View>
        )}

        <View style={styles.cardOverlay}>
          <View style={styles.statBadge}>
            <Heart size={12} color="#FFF" />
            <ThemedText style={styles.statText}>
              {targetPost.likesCount ?? 0}
            </ThemedText>
          </View>

          {tab === "hide" && (
            <Pressable
              style={styles.unhideButton}
              onPress={(e) => {
                e.stopPropagation();
                handleUnhidePost(targetPost.id);
              }}
            >
              <EyeOff size={14} color="#FFF" />
            </Pressable>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render Header + Tab Navigation inside FlatList
  const renderListHeader = () => (
    <ThemedView className="" style={{backgroundColor:colors.background, }}>
      {/* Optional User Info/Header Passed from Parent */}
      {headerComponent}

      {/* Tab Buttons */}
      <ThemedView
        className=""
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor:colors.background,
          marginTop:14
        }}
      >
        <Pressable style={styles.item} onPress={() => setTab("posts")}>
          <LayoutGrid
            size={22}
            color={tab === "posts" ? activeColor : inactiveColor}
          />
          <ThemedText style={[styles.text, tab === "posts" && styles.active]}>
            {t("profile.tabPosts")}
          </ThemedText>
        </Pressable>

        <Pressable style={styles.item} onPress={() => setTab("reshares")}>
          <Repeat2
            size={22}
            color={tab === "reshares" ? activeColor : inactiveColor}
          />
          <ThemedText style={[styles.text, tab === "reshares" && styles.active]}>
            {t("profile.tabReshares")}
          </ThemedText>
        </Pressable>

        <Pressable style={styles.item} onPress={() => setTab("drafts")}>
          <PlaySquare
            size={22}
            color={tab === "drafts" ? activeColor : inactiveColor}
          />
          <ThemedText style={[styles.text, tab === "drafts" && styles.active]}>
            {t("profile.tabDrafts")}
          </ThemedText>
        </Pressable>

        <Pressable style={styles.item} onPress={() => setTab("hide")}>
          <Eye size={22} color={tab === "hide" ? activeColor : inactiveColor} />
          <ThemedText style={[styles.text, tab === "hide" && styles.active]}>
            {t("profile.tabHidden")}
          </ThemedText>
        </Pressable>

        <Pressable style={styles.item} onPress={() => setTab("saved")}>
          <Bookmark
            size={22}
            color={tab === "saved" ? activeColor : inactiveColor}
          />
          <ThemedText style={[styles.text, tab === "saved" && styles.active]}>
            {t("profile.tabSaved")}
          </ThemedText>
        </Pressable>

        <Pressable style={styles.item} onPress={() => setTab("tagged")}>
          <Tag size={22} color={tab === "tagged" ? activeColor : inactiveColor} />
          <ThemedText style={[styles.text, tab === "tagged" && styles.active]}>
            {t("profile.tabTagged")}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView className="" style={{backgroundColor:colors.background, flex:1, }}>
      <FlatList
        data={listData}
        keyExtractor={(item, index) => item.id ?? index.toString()}
        renderItem={renderItem}
        numColumns={3}
        ListHeaderComponent={renderListHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={activeColor}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footerLoader} color={activeColor} />
          ) : null
        }
        ListEmptyComponent={
          listData.length > 0 ? null : loading ? (
            showGridSkeleton ? <PostGridSkeleton cellWidth={COLUMN_SIZE} cellMargin={1} /> : null
          ) : (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                {t("profile.emptyTab", { tab: t(tabTranslationKeys[tab]) })}
              </ThemedText>
            </ThemedView>
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    alignItems: "center",
  },
  text: {
    marginTop: 6,
    color: "#8A8A94",
    fontSize: 12,
  },
  active: {
    color: "#FE2C55",
    fontWeight: "700",
  },
  gridCard: {
    width: COLUMN_SIZE,
    height: COLUMN_SIZE * 1.3,
    backgroundColor: "#16161D",
    position: "relative",
    marginHorizontal: 1,
    marginTop: 2,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  textOnlyCard: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1C1C24",
  },
  textOnlyContent: {
    fontSize: 11,
    color: "#CCC",
    textAlign: "center",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  reshareBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 4,
    borderRadius: 10,
  },
  unhideButton: {
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 4,
    borderRadius: 12,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  footerLoader: {
    marginVertical: 16,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
});