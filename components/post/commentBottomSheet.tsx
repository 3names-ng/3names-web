import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { X, Lock } from "lucide-react-native";
import { router } from "expo-router";

import { ThemedView } from "../ui/ThemedView";
import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import getRelativeTime, { formatCount } from "@/service/helper";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { LevelBadge } from "../levelBadge";
import { ProfileFrame } from "../ui/ProfileFrame";

import CommentItem from "./commentItem";
import CommentInput from "./commentInput";
import CommentSkeleton from "./commentSkeleton";
import { postService } from "@/service/post.service";
import { useAuthStore } from "@/store/authStore";
import { showError, showSuccess } from "../ui/toast";

type ModalTab = "comments" | "likes" | "views";

interface Props {
  visible: boolean;
  postId: string;
  commentsCount?: number;
  likesCount?: number;
  viewsCount?: number;
  isOwnPost?: boolean;
  commentPermission?: string;
  /** Deep-linked from a comment/reply notification — scrolls to and highlights this comment/reply */
  highlightCommentId?: string | null;
  onClose: () => void;
  onCommentCountChange?: (newCount: number) => void;
}

function personDisplayName(person: any): string {
  return person.username ? `@${person.username}` : "Unknown user";
}

function PersonRow({ item, onPress }: { item: any; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable style={styles.personRow} onPress={onPress}>
      <ProfileFrame
        frameId={item.profileFrame}
        uri={item.profilePictureUrl}
        size={42}
        initial={(item.username || "?").charAt(0).toUpperCase()}
      />
      <View style={styles.personRowText}>
        <ThemedText style={[styles.personName, { color: colors.text }]} numberOfLines={1}>
          {personDisplayName(item)}
        </ThemedText>
        {item.level?.badge ? (
          <LevelBadge level={item.level} containerStyle={{ marginTop: 4, alignSelf: "flex-start" }} />
        ) : null}
      </View>
      <ThemedText style={[styles.personTimeAgo, { color: colors.muted }]}>
        {getRelativeTime(item.viewedAt || item.likedAt)}
      </ThemedText>
    </Pressable>
  );
}

export default function CommentsModal({
  visible,
  postId,
  commentsCount = 0,
  likesCount = 0,
  viewsCount = 0,
  isOwnPost = false,
  commentPermission,
  highlightCommentId,
  onCommentCountChange,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeReply, setActiveReply] = useState<{ id: string; name: string } | null>(null);
  const [autoExpandParentId, setAutoExpandParentId] = useState<string | null>(null);
  const commentsListRef = useRef<FlatList>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [activeTab, setActiveTab] = useState<ModalTab>("comments");

  const isLocked = commentPermission === "nobody";

  const fetchLikersPage = useCallback(
    async (cursor: string | null) => {
      const result = await postService.getPostLikers(postId, cursor);
      return { items: result?.items ?? [], nextCursor: result?.nextCursor ?? null };
    },
    [postId],
  );
  const {
    items: likers,
    loading: isLoadingLikers,
    loadingMore: isLoadingMoreLikers,
    loadMore: loadMoreLikers,
  } = usePaginatedList(visible && activeTab === "likes", fetchLikersPage);

  const fetchViewersPage = useCallback(
    async (cursor: string | null) => {
      const result = await postService.getPostViewers(postId, cursor);
      return { items: result?.items ?? [], nextCursor: result?.nextCursor ?? null };
    },
    [postId],
  );
  const {
    items: viewers,
    loading: isLoadingViewers,
    loadingMore: isLoadingMoreViewers,
    loadMore: loadMoreViewers,
  } = usePaginatedList(visible && activeTab === "views" && isOwnPost, fetchViewersPage);

  function goToProfile(person: any) {
    onClose();
    if (person.id === user?.id) {
      router.push("/profile");
      return;
    }
    router.push({
      pathname: "/(features)/userProfile/[id]",
      params: { id: person.id },
    });
  }

  useEffect(() => {
    if (visible) {
      setActiveTab("comments");
    } else {
      setAutoExpandParentId(null);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && !isLocked && activeTab === "comments") {
      loadComments();
    }
  }, [visible, isLocked, activeTab]);

  // Real-time: update comment avatars/frames when any user changes their profile
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "PROFILE_FRAME_UPDATED",
      (data: { userId: string; profileFrame?: string | null; profilePictureUrl?: string | null; username?: string | null }) => {
        if (!data?.userId) return;
        setComments((prev) =>
          prev.map((c) => {
            if (c?.user?.id !== data.userId) return c;
            return {
              ...c,
              user: {
                ...c.user,
                ...(data.profileFrame !== undefined && { profileFrame: data.profileFrame }),
                ...(data.profilePictureUrl !== undefined && { profilePictureUrl: data.profilePictureUrl }),
                ...(data.username !== undefined && { username: data.username }),
              },
            };
          })
        );
      },
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  async function loadComments() {
    try {
      setLoading(true);
      const res = await postService.getPostComments(postId);
      const items = res.items || res.data?.items || [];
      setComments(items);

      if (highlightCommentId) {
        await resolveHighlight(highlightCommentId, items);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  }

  /** Figures out whether the deep-linked comment is top-level or a reply
   * (in which case its parent needs auto-expanding), then scrolls to it. */
  async function resolveHighlight(targetId: string, topLevelComments: any[]) {
    const topLevelIndex = topLevelComments.findIndex(
      (c) => (c.id || c._id) === targetId
    );

    if (topLevelIndex !== -1) {
      setAutoExpandParentId(null);
      scrollToCommentIndex(topLevelIndex);
      return;
    }

    try {
      const target = await postService.getCommentById(targetId);
      const parentId = target?.parentCommentId;
      if (!parentId) return;

      const parentIndex = topLevelComments.findIndex(
        (c) => (c.id || c._id) === parentId
      );
      if (parentIndex === -1) return;

      setAutoExpandParentId(parentId);
      scrollToCommentIndex(parentIndex);
    } catch (error) {
      console.error("Failed to resolve highlighted comment's parent:", error);
    }
  }

  function scrollToCommentIndex(index: number) {
    // Let the list render first (and, for a reply, let the parent's replies
    // finish expanding) before attempting to scroll.
    setTimeout(() => {
      commentsListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.2,
      });
    }, 400);
  }

  function handleCommentCreated(newComment: any) {
    if (activeReply) {
      loadComments();
      setActiveReply(null);
    } else {
      const formattedComment = {
        ...newComment,
        user: {
          ...newComment.user,
          appLevel: newComment.user?.appLevel ?? user?.appLevel,
        },
        repliesCount: 0,
      };

      setComments((prev) => {
        const updatedComments = [formattedComment, ...prev];
        onCommentCountChange?.(updatedComments.length);
        return updatedComments;
      });
    }
  }

  /** Swap the optimistic (temp) comment with the real server comment */
  function handleCommentServerConfirmed(tempId: string, serverComment: any) {
    setComments((prev) => {
      const confirmedComment = {
        ...serverComment,
        user: {
          ...serverComment.user,
          appLevel: serverComment.user?.appLevel ?? user?.appLevel,
        },
        repliesCount: 0,
      };

      const exists = prev.some(
        (c) => (c.id || c._id) === (confirmedComment.id || confirmedComment._id)
      );

      if (exists) return prev;

      const updated = prev.map((c) =>
        (c.id || c._id) === tempId ? confirmedComment : c
      );
      return updated;
    });
  }

  /** Remove the optimistic comment if the server rejected it */
  function handleCommentServerFailed(tempId: string) {
    setComments((prev) => {
      const updated = prev.filter((c) => (c.id || c._id) !== tempId);
      onCommentCountChange?.(updated.length);
      return updated;
    });
    showError(t("post.couldNotPostComment"), t("error.error"));
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await postService.deleteComment(commentId);
      setComments((prev) => {
        const updated = prev.filter(
          (item) => (item.id || item._id) !== commentId
        );
        onCommentCountChange?.(updated.length);
        return updated;
      });
      showSuccess(t("post.commentDeleted"), "Success");
    } catch (error) {
      showError(t("post.couldNotDeleteComment"), "Error");
    }
  }

  async function handleReportComment(commentId: string, reason: string) {
    try {
      await postService.reportComment(commentId, reason);
      showSuccess(t("post.thankYouReport"), "Success");
    } catch (error) {
      showError(t("post.couldNotReportComment"), "Error");
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          { paddingBottom: Platform.OS === "android" ? keyboardHeight : 0 },
        ]}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView
          behavior="padding"
          style={styles.sheetContainer}
        >
          <ThemedView
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            {/* Header */}
            <ThemedView
              style={[
                styles.header,
                { borderBottomColor: colors.border || "#E5E7EB" },
              ]}
            >
              <ThemedText style={styles.title}>{t("post.commentsTitle")}</ThemedText>
              <Pressable hitSlop={12} onPress={onClose}>
                <X size={24} color={colors.text} />
              </Pressable>
            </ThemedView>

            {/* Tabs */}
            <View style={[styles.tabBar, { borderBottomColor: colors.border || "#E5E7EB" }]}>
              <Pressable style={styles.tabButton} onPress={() => setActiveTab("comments")}>
                <ThemedText
                  style={[
                    styles.tabLabel,
                    { color: activeTab === "comments" ? colors.text : colors.muted },
                    activeTab === "comments" && styles.tabLabelActive,
                  ]}
                >
                  {t("post.commentsTitle")} {commentsCount > 0 ? `(${formatCount(commentsCount)})` : ""}
                </ThemedText>
                {activeTab === "comments" && <View style={[styles.tabIndicator, { backgroundColor: colors.text }]} />}
              </Pressable>
              <Pressable style={styles.tabButton} onPress={() => setActiveTab("likes")}>
                <ThemedText
                  style={[
                    styles.tabLabel,
                    { color: activeTab === "likes" ? colors.text : colors.muted },
                    activeTab === "likes" && styles.tabLabelActive,
                  ]}
                >
                  Likes {likesCount > 0 ? `(${formatCount(likesCount)})` : ""}
                </ThemedText>
                {activeTab === "likes" && <View style={[styles.tabIndicator, { backgroundColor: colors.text }]} />}
              </Pressable>
              {/* {isOwnPost && (
                <Pressable style={styles.tabButton} onPress={() => setActiveTab("views")}>
                  <ThemedText
                    style={[
                      styles.tabLabel,
                      { color: activeTab === "views" ? colors.text : colors.muted },
                      activeTab === "views" && styles.tabLabelActive,
                    ]}
                  >
                    Views {viewsCount > 0 ? `(${formatCount(viewsCount)})` : ""}
                  </ThemedText>
                  {activeTab === "views" && <View style={[styles.tabIndicator, { backgroundColor: colors.text }]} />}
                </Pressable>
              )} */}
            </View>

            {/* Body */}
            {activeTab === "comments" ? (
              isLocked ? (
                <View style={styles.fullLockedState}>
                  <View
                    style={[
                      styles.lockIconCircle,
                      { backgroundColor: colors.border || "#F3F4F6" },
                    ]}
                  >
                    <Lock size={32} color="#9CA3AF" />
                  </View>
                  <ThemedText style={styles.mainLockedTitle}>
                    {t("post.commentsLocked")}
                  </ThemedText>
                  <ThemedText style={styles.subLockedTitle}>
                    {t("post.commentsLockedDesc")}
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.bodyContainer}>
                  {loading ? (
                    <CommentSkeleton />
                  ) : (
                    <FlatList
                      ref={commentsListRef}
                      data={comments}
                      keyExtractor={(item) => item.id || item._id}
                      renderItem={({ item }) => {
                        const itemId = item.id || item._id;
                        return (
                          <CommentItem
                            comment={{
                              ...item,
                              repliesCount: item.repliesCount ?? 0,
                            }}
                            onReplySelect={(id, name) =>
                              setActiveReply({ id, name })
                            }
                            onDelete={handleDeleteComment}
                            onReport={handleReportComment}
                            highlightCommentId={highlightCommentId ?? undefined}
                            autoExpandForHighlight={itemId === autoExpandParentId}
                          />
                        );
                      }}
                      ListEmptyComponent={require("./emptyComments").default}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{
                        paddingBottom: 20,
                      }}
                      onScrollToIndexFailed={(info) => {
                        // Variable-height rows can make the estimate miss —
                        // retry once layout has settled a bit more.
                        setTimeout(() => {
                          commentsListRef.current?.scrollToIndex({
                            index: info.index,
                            animated: true,
                            viewPosition: 0.2,
                          });
                        }, 300);
                      }}
                    />
                  )}

                  <CommentInput
                    postId={postId}
                    activeReply={activeReply}
                    onCancelReply={() => setActiveReply(null)}
                    onCreated={handleCommentCreated}
                    onServerConfirmed={handleCommentServerConfirmed}
                    onServerFailed={handleCommentServerFailed}
                  />
                </View>
              )
            ) : activeTab === "likes" ? (
              <View style={styles.bodyContainer}>
                {isLoadingLikers ? (
                  <CommentSkeleton />
                ) : (
                  <FlatList
                    data={likers}
                    keyExtractor={(item: any) => item.id}
                    renderItem={({ item }) => <PersonRow item={item} onPress={() => goToProfile(item)} />}
                    ListEmptyComponent={
                      <View style={styles.emptyTabState}>
                        <ThemedText style={{ color: colors.muted }}>No likes yet</ThemedText>
                      </View>
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.personListContent}
                    onEndReached={loadMoreLikers}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={
                      isLoadingMoreLikers ? (
                        <View style={styles.footerLoading}>
                          <ActivityIndicator size="small" color={colors.muted} />
                        </View>
                      ) : null
                    }
                  />
                )}
              </View>
            ) : (
              <View style={styles.bodyContainer}>
                {isLoadingViewers ? (
                  <CommentSkeleton />
                ) : (
                  <FlatList
                    data={viewers}
                    keyExtractor={(item: any) => item.id}
                    renderItem={({ item }) => <PersonRow item={item} onPress={() => goToProfile(item)} />}
                    ListEmptyComponent={
                      <View style={styles.emptyTabState}>
                        <ThemedText style={{ color: colors.muted }}>No views yet</ThemedText>
                      </View>
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.personListContent}
                    onEndReached={loadMoreViewers}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={
                      isLoadingMoreViewers ? (
                        <View style={styles.footerLoading}>
                          <ActivityIndicator size="small" color={colors.muted} />
                        </View>
                      ) : null
                    }
                  />
                )}
              </View>
            )}
          </ThemedView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheetContainer: {
    maxHeight: "85%",
    width: "100%",
  },
  modalContent: {
    height: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  bodyContainer: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabLabelActive: {
    fontWeight: "800",
  },
  tabIndicator: {
    marginTop: 8,
    height: 2,
    width: 28,
    borderRadius: 1,
  },
  emptyTabState: {
    paddingTop: 60,
    alignItems: "center",
  },
  personListContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  footerLoading: {
    paddingVertical: 16,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  personRowText: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    fontSize: 14,
    fontWeight: "600",
  },
  personTimeAgo: {
    fontSize: 12,
    marginLeft: 8,
  },
  fullLockedState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  lockIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  mainLockedTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subLockedTitle: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});