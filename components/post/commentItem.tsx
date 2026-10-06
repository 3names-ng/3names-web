import React, { useEffect, useRef, useState } from "react";
import {
  DeviceEventEmitter,
  Image,
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import {
  Heart,
  MoreHorizontal,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";

import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import getRelativeTime, { formatCount } from "@/service/helper";
import { postService } from "@/service/post.service";
import { LevelBadge } from "../levelBadge";
import { useAuthStore } from "@/store/authStore";
import { ProfileFrame } from "../ui/ProfileFrame";

interface Props {
  comment: any;
  onReplySelect: (id: string, name: string) => void;
  onEdit?: (comment: any) => void;
  onDelete?: (commentId: string) => void;
  onReport?: (commentId: string, reason: string) => void;
  isReply?: boolean;
  /** Comment/reply id to visually highlight (deep-linked from a notification) */
  highlightCommentId?: string;
  /** True when this comment is the parent of the highlighted reply — auto-expands its replies on mount */
  autoExpandForHighlight?: boolean;
}

const REPORT_REASONS = [
  "Spam or Scam",
  "Harassment or Hate Speech",
  "Inappropriate Content",
  "Other",
];

export default function CommentItem({
  comment,
  onReplySelect,
  onEdit,
  onDelete,
  onReport,
  isReply = false,
  highlightCommentId,
  autoExpandForHighlight = false,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);

  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<any[]>(comment.replies || []);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const serverRepliesCount = isReply
    ? 0
    : (comment.repliesCount ?? (comment.replies?.length || 0));

  // Show the count from the server, but reflect optimistic replies instantly
  const repliesCount = isReply
    ? 0
    : Math.max(serverRepliesCount, replies.length);

  const [liked, setLiked] = useState(comment.isLiked ?? false);
  const [likes, setLikes] = useState(comment.likesCount ?? 0);
  const [loading, setLoading] = useState(false);

  const authorName = `${comment.user?.username || "user"} `;
  const userLevel = comment.user?.appLevel || comment.user?.level;
  const commentIdValue = comment.id || comment._id;
  const isHighlighted = Boolean(highlightCommentId) && commentIdValue === highlightCommentId;

  // Safe ownership check across id, _id, string, and number formats
  const currentUserId = currentUser?.id ;
  const commentUserId =
    comment.user?.id ||
    comment.user?._id ||
    comment.userId ||
    comment.user_id;

  const isOwner = Boolean(
    currentUserId &&
      commentUserId &&
      String(currentUserId) === String(commentUserId)
  );

  const triggerReportPicker = () => {
    const commentId = comment.id || comment._id;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t("post.reportReasonTitle"),
          message: t("post.reportReasonMsg"),
          options: ["Cancel", ...REPORT_REASONS],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            const selectedReason = REPORT_REASONS[buttonIndex - 1];
            onReport?.(commentId, selectedReason);
          }
        }
      );
    } else {
      const buttons = REPORT_REASONS.map((reason) => ({
        text: reason,
        onPress: () => onReport?.(commentId, reason),
      }));

      Alert.alert(
        t("post.reportReasonTitle"),
        t("post.selectReason"),
        [...buttons, { text: "Cancel", style: "cancel" as const }],
        { cancelable: true }
      );
    }
  };

  const handleMorePress = () => {
    if (Platform.OS === "ios") {
      const options = isOwner
        ? [t("post.cancel"), t("post.deleteComment")]
        : [t("post.cancel"), t("post.reportComment")];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: isOwner ? 1 : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) return;

          if (isOwner) {
            if (buttonIndex === 1) onDelete?.(comment.id || comment._id);
          } else {
            if (buttonIndex === 1) triggerReportPicker();
          }
        }
      );
    } else {
      const buttons = isOwner
        ? [
            {
              text: t("post.delete"),
              style: "destructive" as const,
              onPress: () => onDelete?.(comment.id || comment._id),
            },
            { text: t("post.cancel"), style: "cancel" as const },
          ]
        : [
            {
              text: t("post.report"),
              onPress: () => triggerReportPicker(),
            },
            { text: t("post.cancel"), style: "cancel" as const },
          ];

      Alert.alert(t("post.commentOptions"), undefined, buttons, { cancelable: true });
    }
  };

  const optimisticRepliesRef = useRef<{ [tempId: string]: any }>({});

  async function toggleReplies() {
    if (isReply) return;

    if (!showReplies && replies.length === 0 && repliesCount > 0) {
      setLoadingReplies(true);
      try {
        const res = await postService.getReplies(comment.id || comment._id);
        const items = res.items || res.data?.items || [];
        // Keep any optimistic (not yet server-confirmed) replies on a refetch
        const optimistic = Object.values(optimisticRepliesRef.current);
        const merged = [...items];
        optimistic.forEach((op) => {
          if (!merged.some((r) => (r.id || r._id) === (op.id || op._id))) {
            merged.push(op);
          }
        });
        setReplies(merged);
      } catch (error) {
        console.error("Failed to load replies:", error);
      } finally {
        setLoadingReplies(false);
      }
    }
    setShowReplies(!showReplies);
  }

  // Deep-linked from a notification about a reply nested under this comment
  // — expand it automatically so the highlighted reply is visible.
  useEffect(() => {
    if (autoExpandForHighlight && !isReply && !showReplies) {
      toggleReplies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExpandForHighlight]);

  // ── Optimistic replies: CommentInput emits these while sending in background ──
  useEffect(() => {
    if (isReply) return;

    const commentId = comment.id || comment._id;
    if (!commentId) return;

    const handleAdded = (data: any) => {
      if ((data?.commentId ?? data?.parentId) !== commentId) return;
      const reply = data?.reply;
      if (!reply?.id) return;

      optimisticRepliesRef.current[reply.id] = reply;
      setReplies((prev) =>
        prev.some((r) => (r.id || r._id) === reply.id)
          ? prev
          : [...prev, reply]
      );
      setShowReplies(true);
    };

    const handleConfirmed = (data: any) => {
      if ((data?.commentId ?? data?.parentId) !== commentId) return;
      const tempId = data?.tempId;
      const serverReply = data?.reply;
      if (!tempId || !serverReply) return;

      delete optimisticRepliesRef.current[tempId];
      setReplies((prev) =>
        prev.map((r) =>
          (r.id || r._id) === tempId
            ? { ...serverReply, user: { ...serverReply.user } }
            : r
        )
      );
    };

    const handleFailed = (data: any) => {
      if ((data?.commentId ?? data?.parentId) !== commentId) return;
      const tempId = data?.tempId;
      if (!tempId) return;

      delete optimisticRepliesRef.current[tempId];
      setReplies((prev) =>
        prev.filter((r) => (r.id || r._id) !== tempId)
      );
    };

    const addedSub = DeviceEventEmitter.addListener(
      "REPLY_OPTIMISTIC_ADDED",
      handleAdded
    );
    const confirmedSub = DeviceEventEmitter.addListener(
      "REPLY_OPTIMISTIC_CONFIRMED",
      handleConfirmed
    );
    const failedSub = DeviceEventEmitter.addListener(
      "REPLY_OPTIMISTIC_FAILED",
      handleFailed
    );

    return () => {
      addedSub.remove();
      confirmedSub.remove();
      failedSub.remove();
    };
  }, [comment.id, comment._id, isReply]);

  async function toggleLike() {
    if (loading) return;
    setLoading(true);

    const previousLiked = liked;
    const previousLikes = likes;

    setLiked(!previousLiked);
    setLikes((prev: any) => (previousLiked ? prev - 1 : prev + 1));

    try {
      if (previousLiked) {
        await postService.unlikeComments(comment.id || comment._id);
      } else {
        await postService.likeComment(comment.id || comment._id);
      }
    } catch {
      setLiked(previousLiked);
      setLikes(previousLikes);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView
      style={[
        styles.container,
        isReply && styles.nestedContainer,
        isHighlighted && { backgroundColor: `${colors.primary}1A` },
      ]}
    >
      {/* Avatar */}
      <ProfileFrame
        frameId={comment.user?.profileFrame}
        uri={comment.user?.profilePictureUrl || comment.user?.avatar}
        size={isReply ? 32 : 44}
        initial={comment.user?.username?.[0]?.toUpperCase()}
      />

      {/* Main body */}
      <View style={styles.content}>
        <Pressable
          onPress={() => !isReply && onReplySelect(comment.id || comment._id, authorName)}
          disabled={isReply}
          style={({ pressed }) => [
            pressed && !isReply && styles.pressedTextContainer,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.userRow}>
                <ThemedText style={styles.name}>{authorName}</ThemedText>

                {userLevel ? (
                  <View style={styles.badgeContainer}>
                    <LevelBadge level={userLevel} />
                  </View>
                ) : null}
              </View>

              <ThemedText style={styles.time}>
                {getRelativeTime(comment.createdAt)}
              </ThemedText>
            </View>

            {/* Context action trigger */}
            <Pressable hitSlop={8} onPress={handleMorePress}>
              <MoreHorizontal size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Comment Text */}
          <ThemedText style={styles.comment}>{comment.text}</ThemedText>
        </Pressable>

        {/* Actions Tray */}
        <View style={styles.actions}>
          <Pressable onPress={toggleLike} style={styles.action} hitSlop={6}>
            <Heart
              size={16}
              color={liked ? "#EF4444" : colors.text}
              fill={liked ? "#EF4444" : "transparent"}
            />
            <ThemedText style={[styles.actionText, liked && { color: "#EF4444" }]}>
              {formatCount(likes)}
            </ThemedText>
          </Pressable>

          {!isReply && (
            <Pressable
              style={styles.action}
              onPress={() => {
                onReplySelect(comment.id || comment._id, authorName);
                if (repliesCount > 0) {
                  toggleReplies();
                }
              }}
              hitSlop={6}
            >
              <MessageCircle size={16} color={colors.text} />
              <ThemedText style={styles.actionText}>{t("post.reply")}</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Accordion Toggle Trigger for Replies */}
        {!isReply && repliesCount > 0 && (
          <Pressable style={styles.dropdownToggle} onPress={toggleReplies}>
            <View style={styles.lineIndicator} />
            <ThemedText style={[styles.dropdownText, { color: colors.text }]}>
              {showReplies ? t("post.hideReplies") : t("post.viewReplies", { count: repliesCount })}
            </ThemedText>
            {showReplies ? (
              <ChevronUp size={14} color={colors.text} />
            ) : (
              <ChevronDown size={14} color={colors.text} />
            )}
          </Pressable>
        )}

        {/* Render Nested Replies */}
        {!isReply && showReplies && (
          <View style={styles.repliesWrapper}>
            {loadingReplies ? (
              <ActivityIndicator size="small" color={colors.text} style={styles.loader} />
            ) : (
              replies.map((reply) => (
                <CommentItem
                  key={reply.id || reply._id}
                  comment={reply}
                  isReply={true}
                  onReplySelect={onReplySelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReport={onReport}
                  highlightCommentId={highlightCommentId}
                />
              ))
            )}
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  nestedContainer: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarReply: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  name: {
    fontWeight: "700",
    fontSize: 15,
  },
  badgeContainer: {
    marginLeft: 0,
  },
  time: {
    marginTop: 2,
    color: "#999",
    fontSize: 12,
  },
  comment: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    marginTop: 10,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 25,
  },
  actionText: {
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 13,
  },
  pressedTextContainer: {
    opacity: 0.7,
  },
  dropdownToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  lineIndicator: {
    width: 20,
    height: 1,
    backgroundColor: "#CCC",
    marginRight: 8,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: "600",
    marginRight: 4,
  },
  repliesWrapper: {
    marginTop: 6,
  },
  loader: {
    alignSelf: "flex-start",
    marginVertical: 8,
  },
});