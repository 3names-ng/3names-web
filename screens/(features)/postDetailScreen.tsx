import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

import FeedCard from "@/components/home/feedCard";
import FeedCardSkeleton from "@/components/home/feedCardSkeleton";
import CommentsModal from "@/components/post/commentBottomSheet";
import { ThemedText } from "@/components/ui/ThemedText";
import { showError, showSuccess } from "@/components/ui/toast";
import { postService } from "@/service/post.service";
import { useAuthStore } from "@/store";
import { SafeAreaView } from "react-native-safe-area-context";
const { width } = Dimensions.get("window");
type MenuViewType =
  | "MAIN"
  | "EDIT_CAPTION"
  | "EDIT_HASHTAGS"
  | "EDIT_CATEGORY"
  | "EDIT_VISIBILITY"
  | "EDIT_GIFTS_PERMISSIONS"
  | "HIDE_CONFIRM"
  | "REPORT"
  | "DELETE_CONFIRM";

export interface Author {
  id: string;
  name?: string;
  username?: string;
  profilePictureUrl?: string;
}

export interface PostMedia {
  url: string;
  type?: "image" | "video";
}

export interface PostDetail {
  id: string;
  userId: string;
  authorId: string;
  user?: Author;
  description?: string;
  media?: PostMedia[];
  category?: string;
  hashtags?: string[];
  visibility?: string;
  commentPermission?: string;
  giftsEnabled?: boolean;
  isLiked?: boolean;
  likesCount?: number;
  isSaved?: boolean;
  isFavorited?: boolean;
  favoritesCount?: number;
  isReshared?: boolean;
  resharesCount?: number;
  commentsCount?: number;
  createdAt?: string;
}

export default function PostDetailScreen() {
  const { id, commentId, openComments } = useLocalSearchParams<{
    id: string;
    commentId?: string;
    openComments?: string;
  }>();
  const { colorScheme } = useColorScheme();
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Screen State
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userPosts, setUserPosts] = useState<PostDetail[]>([]);

  // Scroll tracking for video pause
  const [activePostIndex, setActivePostIndex] = useState<number>(0);
  const postLayouts = useRef<{ y: number; height: number }[]>([]);
  const allPosts = [post, ...userPosts].filter(Boolean);

  // Engagement States
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isLikeMutating, setIsLikeMutating] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [isReshared, setIsReshared] = useState<boolean>(false);
  const [resharesCount, setResharesCount] = useState<number>(0);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsCount, setCommentsCount] = useState<number>(0);

  // Options & Form States
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuView, setMenuView] = useState<MenuViewType>("MAIN");
  const [isHiding, setIsHiding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");

  // Edit Fields
  const [editDescription, setEditDescription] = useState("");
  const [editGiftsEnabled, setEditGiftsEnabled] = useState<boolean>(true);
  const [editCategory, setEditCategory] = useState("");
  const [editHashtagsText, setEditHashtagsText] = useState<string[]>([]);
  const [audience, setAudience] = useState<string>("PUBLIC");
  const [commentPrivacy, setCommentPrivacy] = useState<string>("EVERYONE");

  const iconColor = colorScheme === "dark" ? "#ffffff" : "#111111";
  const user = useAuthStore((state) => state.user);
  // Derive post authorship (replace currentUserId check with your Auth context variable)
  const isOwnPost = Boolean(post && post?.userId === user?.id);

  const resetEditForms = (currentPost: any | null) => {
    if (!currentPost) return;
    setEditDescription(currentPost.description || "");
    setEditGiftsEnabled(currentPost.giftsEnabled ?? true);
    setEditCategory(currentPost.category || "");
    setEditHashtagsText(currentPost.hashtags || []);
    setAudience(currentPost.visibility || "PUBLIC");
    setCommentPrivacy(currentPost.commentPermission || "EVERYONE");
  };

  const fetchPost = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await postService.getPostById(id);
      const data = res?.data || res;

      setPost(data);
      setIsLiked(Boolean(data?.isLiked));
      setLikesCount(data?.likesCount || 0);
      setIsSaved(Boolean(data?.isSaved ?? data?.isFavorited));
      setFavoritesCount(data?.favoritesCount || 0);
      setIsReshared(Boolean(data?.isReshared));
      setResharesCount(data?.resharesCount || 0);
      setCommentsCount(data?.commentsCount || 0);

      resetEditForms(data);

      // Fetch user's posts to show next post when scrolling
      const postAuthorId = data?.userId || data?.user?.id;
      if (postAuthorId) {
        try {
          const userPostsRes = await postService.getUserPosts(postAuthorId, {
            limit: 5,
          });
          const posts = userPostsRes?.items || [];
          // Inject the current post's full user data into next posts
          // so FeedCard can show profile, username, level etc.
          const authorUser = data?.user || { id: postAuthorId };
          const otherPosts = posts
            .filter((p: PostDetail) => p.id !== data.id)
            .sort(
              (a: PostDetail, b: PostDetail) =>
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime(),
            )
            .map((p: PostDetail) => ({
              ...p,
              user: p.user || authorUser,
            }));
          setUserPosts(otherPosts);
        } catch (error) {
          console.error("Failed to fetch user posts:", error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch post details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Deep-linked from a comment/reply notification — open the comments
  // sheet straight away (commentId, when present, additionally highlights
  // the specific comment/reply once loaded).
  useEffect(() => {
    if (openComments || commentId) {
      setCommentsVisible(true);
    }
  }, [openComments, commentId]);

  // Stable identities so React.memo(FeedCard) can skip re-rendering these
  // cards on unrelated screen state changes (scroll tracking, modals, etc.).
  const handlePostUpdated = useCallback((postId: string, updatedFields: any) => {
    setPost((prevPost) =>
      prevPost && prevPost.id === postId
        ? { ...prevPost, ...updatedFields }
        : prevPost,
    );
  }, []);

  const handlePostHidden = useCallback((postId: string) => {
    setPost((prevPost) => (prevPost?.id === postId ? null : prevPost));
  }, []);

  const handlePostDeleted = useCallback((postId: string) => {
    setPost((prevPost) => (prevPost?.id === postId ? null : prevPost));
  }, []);

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const screenHeight = event.nativeEvent.layoutMeasurement.height;
    const center = scrollY + screenHeight / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    postLayouts.current.forEach((layout, index) => {
      if (layout) {
        const postCenter = layout.y + layout.height / 2;
        const distance = Math.abs(center - postCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });

    setActivePostIndex(closestIndex);
  };

  const handlePostLayout = (index: number, y: number, height: number) => {
    postLayouts.current[index] = { y, height };
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPost();
  };

  const handleCancelEdit = () => {
    resetEditForms(post);
    setMenuView("MAIN");
  };

  const closeMenuReset = () => {
    if (isReporting || isHiding || isDeleting || isUpdating) return;
    setMenuVisible(false);
    setMenuView("MAIN");
    setReportReason("");
  };

  const handleFieldUpdate = async (
    payload: Record<string, any>,
    successMessage: string,
  ) => {
    if (!post?.id || isUpdating) return;
    setIsUpdating(true);
    try {
      await postService.updatePost(post.id, payload);
      showSuccess(successMessage, t("success.success"));

      //   if (typeof onPostUpdated === "function") {
      //     onPostUpdated(post.id, payload);
      //   }

      if ("visibility" in payload) setAudience(payload.visibility);
      if ("commentPermission" in payload)
        setCommentPrivacy(payload.commentPermission);
      if ("giftsEnabled" in payload) setEditGiftsEnabled(payload.giftsEnabled);
      if ("hashtags" in payload) setEditHashtagsText(payload.hashtags);
      if ("category" in payload) setEditCategory(payload.category);
      if ("description" in payload) setEditDescription(payload.description);

      setMenuVisible(false);
      setMenuView("MAIN");
    } catch (error) {
      console.error("Failed to update post parameter:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddHashtag = (newTag: string) => {
    const cleanTag = newTag.replace(/#/g, "").trim();
    if (!cleanTag) return;
    setEditHashtagsText((prev) =>
      prev.includes(cleanTag) ? prev : [...prev, cleanTag],
    );
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setEditHashtagsText((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleHashtagsSave = () => {
    const cleanHashtags = editHashtagsText
      .map((tag) => tag.replace(/#/g, "").trim())
      .filter((tag) => tag.length > 0);

    handleFieldUpdate(
      { hashtags: cleanHashtags },
      "Hashtags updated successfully",
    );
  };

  const handleLikeToggle = async () => {
    if (!id || isLikeMutating) return;
    setIsLikeMutating(true);

    const previousState = isLiked;
    const previousCount = likesCount;

    setIsLiked(!previousState);
    setLikesCount(previousState ? previousCount - 1 : previousCount + 1);

    try {
      if (previousState) {
        await postService.unlikePost(id);
      } else {
        await postService.likePost(id);
      }
    } catch (error) {
      setIsLiked(previousState);
      setLikesCount(previousCount);
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLikeMutating(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!id) return;
    const previousState = isSaved;
    const previousCount = favoritesCount;

    setIsSaved(!previousState);
    setFavoritesCount(previousState ? previousCount - 1 : previousCount + 1);

    try {
      if (previousState) {
        await postService.removeFavorite(id);
      } else {
        await postService.addFavorite(id);
      }
    } catch (error) {
      setIsSaved(previousState);
      setFavoritesCount(previousCount);
      console.error("Failed to toggle save:", error);
    }
  };

  const handleReshare = async () => {
    if (!id || isReshared) return;

    const previousState = isReshared;
    const previousCount = resharesCount;

    setIsReshared(true);
    setResharesCount(previousCount + 1);

    try {
      await postService.resharePost(id);
      showSuccess(t("post.sharedToFeed"), t("success.success"));
    } catch (error) {
      setIsReshared(previousState);
      setResharesCount(previousCount);
      showError(t("post.couldNotShare"), t("error.error"));
      console.error("Failed to reshare post:", error);
    }
  };

  const handleReportSubmit = async () => {
    if (!id || !reportReason.trim() || isReporting) return;
    setIsReporting(true);

    try {
      await postService.reportPosts(id, reportReason.trim());
      showSuccess(t("post.reportedSuccess"), t("success.success"));
      closeMenuReset();
    } catch (error) {
      console.error("Failed to report post:", error);
      showError(t("post.couldNotReport"), t("error.error"));
    } finally {
      setIsReporting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id || isDeleting) return;
    setIsDeleting(true);
    try {
      await postService.deletePost(id);
      showSuccess(t("post.deletedSuccess"), t("success.success"));
      closeMenuReset();
      router.back();
    } catch (error) {
      console.error("Failed to delete post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Real header (with back button) above a skeleton of the full-screen post card
  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            Post
          </ThemedText>
          <View style={styles.iconButton} />
        </View>
        <View style={{ flex: 1, overflow: "hidden" }}>
          <FeedCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View className="flex-1 items-center justify-center p-4">
          <ThemedText className="text-base text-gray-500">
            Post not found.
          </ThemedText>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 px-4 py-2 bg-violet-600 rounded-xl"
          >
            <ThemedText className="text-white font-semibold">
              Go Back
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle="default" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          Post
        </ThemedText>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setMenuVisible(true)}
        >
          {/* <MoreVertical size={22} color={colors.text} /> */}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FE2C55"
          />
        }
      >
        {post && (
          <View
            onLayout={(e) =>
              handlePostLayout(
                0,
                e.nativeEvent.layout.y,
                e.nativeEvent.layout.height,
              )
            }
          >
            <FeedCard
              post={post}
              onPostUpdated={handlePostUpdated}
              onPostHidden={handlePostHidden}
              onPostDeleted={handlePostDeleted}
              isParentActive={activePostIndex === 0}
            />
          </View>
        )}

        {/* Show next posts from the same user */}
        {userPosts.map((nextPost, index) => (
          <View
            key={nextPost.id}
            onLayout={(e) =>
              handlePostLayout(
                index + 1,
                e.nativeEvent.layout.y,
                e.nativeEvent.layout.height,
              )
            }
          >
            <FeedCard
              post={nextPost}
              isParentActive={activePostIndex === index + 1}
            />
          </View>
        ))}
      </ScrollView>

      {/* COMMENTS MODAL */}
      <CommentsModal
        visible={commentsVisible}
        postId={id || post.id}
        commentPermission={post.commentPermission}
        commentsCount={commentsCount}
        highlightCommentId={commentId}
        onClose={() => setCommentsVisible(false)}
        onCommentCountChange={(newCount: number) => setCommentsCount(newCount)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  iconButton: {
    padding: 4,
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#222",
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "700",
  },
  postDate: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  mediaContainer: {
    width,
    height: width * 1.2,
    backgroundColor: "#000",
  },
  mediaImage: {
    width,
    height: width * 1.2,
  },
  actionsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  favoritesText: {
    fontSize: 12,
    fontWeight: "600",
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },

  /* Modal Layout Fixes */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  keyboardContainer: {
    width: "100%",
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  menuOption: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F97316",
  },
  reportContainer: {
    width: "100%",
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  closeBtn: {
    padding: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  reportInput: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  sheetActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "rgba(156, 163, 175, 0.2)",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "#F97316",
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
});
