/**
 * MessageBubble — renders a single chat message (bubble, reactions, system pill, gift pill).
 * Extracted from both chatScreen.tsx and groupDetailScreen.tsx.
 *
 * Differences between group and DM are handled via props:
 *   - showSenderName (group=true, dm=false)
 *   - showAvatars (group=true, dm=false)
 *   - highlightStyle ("yellow" for group, "blue" for dm)
 *   - renderMedia (dm can pass VoiceMessageBubble for audio)
 */
import React, { useMemo } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FileText } from "lucide-react-native";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import {
  ChatMessage,
  isImageUrl,
  getReplyQuotePreview,
  getBubbleCornerStyle,
  getContrastTextColor,
  formatTime,
  getDateLabel,
  SCREEN_WIDTH,
} from "@/components/chat/shared/chatTypes";

export interface MessageBubbleProps {
  item: ChatMessage;
  index: number;
  messages: ChatMessage[];
  currentUserId: string;
  currentUser?: any;
  isDark: boolean;
  colors: { text: string; border: string; muted?: string; card?: string };
  /** Show sender name above content (true for groups, false for DMs) */
  showSenderName?: boolean;
  /** Render avatars beside bubbles (true for groups, false for DMs) */
  showAvatars?: boolean;
  /** "yellow" or "blue" highlight style when jump-to-message target */
  highlightStyle?: "yellow" | "blue";
  /** ID of the message being jumped to */
  highlightedMessageId?: string | null;
  /** Currently editing message (hides sender name + resend) */
  editingMessage?: ChatMessage | null;
  /** Render avatar element — pass for groups, omit for DMs */
  renderAvatar?: (uri?: string, frame?: string | null, initial?: string) => React.ReactNode;
  /** Custom media renderer — used for VoiceMessageBubble in DMs */
  renderMedia?: (
    mediaSource: string,
    bubbleTextColor: string,
    bubbleIsGrayDefault: boolean,
    isLightBubbleText: boolean,
  ) => React.ReactNode;
  /** Callbacks */
  onLongPress?: (item: ChatMessage) => void;
  onPressMedia?: (url: string) => void;
  onJumpToMessage?: (id: string) => void;
  onToggleReaction?: (item: ChatMessage, emoji: string) => void;
  onResend?: (item: ChatMessage) => void;
}

export default function MessageBubble({
  item,
  index,
  messages,
  currentUserId,
  currentUser,
  isDark,
  colors,
  showSenderName = true,
  showAvatars = true,
  highlightStyle = "yellow",
  highlightedMessageId,
  editingMessage,
  renderAvatar,
  renderMedia,
  onLongPress,
  onPressMedia,
  onJumpToMessage,
  onToggleReaction,
  onResend,
}: MessageBubbleProps) {
  const normalizedCurrentUserId = String(currentUserId || "").toLowerCase();
  const normalizedSenderId = String(item.senderId || "").toLowerCase();
  const isMe =
    Boolean(normalizedCurrentUserId) &&
    Boolean(normalizedSenderId) &&
    normalizedSenderId === normalizedCurrentUserId;

  const hasCustomBubbleColor = isMe
    ? Boolean(currentUser?.bubbleColor)
    : Boolean(item.senderBubbleColor);
  const bubbleIsGrayDefault = !isMe && !hasCustomBubbleColor;
  const bubbleColor = isMe
    ? currentUser?.bubbleColor || "#3b82f6"
    : item.senderBubbleColor || colors.card || (isDark ? "#27272a" : "#f4f4f5");
  const bubbleTextColor = bubbleIsGrayDefault
    ? colors.text
    : hasCustomBubbleColor
      ? getContrastTextColor(bubbleColor)
      : "#ffffff";
  const isLightBubbleText = bubbleTextColor === "#ffffff";
  const bubbleStyleKey = isMe
    ? currentUser?.bubbleStyle || item.senderBubbleStyle
    : item.senderBubbleStyle;
  const bubbleCornerStyle = getBubbleCornerStyle(bubbleStyleKey, isMe);

  const hasMedia = item.mediaUrl || isImageUrl(item.content);
  const mediaSource = item.mediaUrl || (isImageUrl(item.content) ? item.content : null);
  const isImageAttachment =
    Boolean(mediaSource) && (item.mediaType?.startsWith("image/") || isImageUrl(mediaSource));
  const attachmentFileName =
    item.mediaName || (mediaSource ? mediaSource.split("/").pop()?.split("?")[0] : "");

  // Attachments support (single or multiple)
  const allAttachments = Array.isArray(item.attachments) ? item.attachments : [];
  const imageAttachments = allAttachments.filter(
    (att) =>
      att.type === 'image' ||
      att.type?.startsWith('image/') ||
      isImageUrl(att.url),
  );
  const hasAttachments = allAttachments.length > 0;
  const hasMultipleAttachments = allAttachments.length > 1;

  const summaryList = useMemo(() => {
    if (Array.isArray(item?.reactionSummary) && item.reactionSummary.length > 0)
      return item.reactionSummary;
    return Object.entries(item?.reactions || {})
      .map(([emoji, users]) => ({
        emoji,
        count: Array.isArray(users) ? users.length : 0,
        reactedByMe: Array.isArray(users)
          ? users.map(String).includes(String(currentUserId))
          : false,
      }))
      .filter((r: any) => r.count > 0);
  }, [item?.reactionSummary, item?.reactions, currentUserId]);

  const previousMessage = messages[index - 1];
  const currentMsgDate = new Date(item.createdAt).toDateString();
  const prevMsgDate = previousMessage ? new Date(previousMessage.createdAt).toDateString() : null;
  const showDateHeader = currentMsgDate !== prevMsgDate;

  const mutedTextColor = bubbleIsGrayDefault
    ? colors.muted || "#a1a1aa"
    : isLightBubbleText
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.55)";

  const isHighlighted = highlightedMessageId === item.id;
  const highlightBg =
    highlightStyle === "yellow"
      ? "rgba(250, 204, 21, 0.28)"
      : isDark
        ? "rgba(59, 130, 246, 0.22)"
        : "rgba(59, 130, 246, 0.14)";
  const highlightBorderColor = highlightStyle === "yellow" ? "#fbbf24" : "#3b82f6";

  return (
    <>
      {/* Date Header Badge */}
      {showDateHeader && (
        <View className="items-center my-3">
          <View
            style={{ backgroundColor: isDark ? "#27272a" : "#e4e4e7" }}
            className="px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-700"
          >
            <ThemedText
              style={{ color: colors.muted || "#71717a" }}
              className="text-[11px] font-medium uppercase tracking-wider"
            >
              {getDateLabel(item.createdAt)}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Message Bubble */}
      {!item.isSystem && !item.isGiftMessage && (
        <ThemedView
          className={`my-1.5 flex-row mb-3 items-end ${isMe ? "justify-end" : "justify-start"}`}
          style={{ backgroundColor: "transparent" }}
        >
          {/* Left avatar (others) */}
          {!isMe && showAvatars && renderAvatar && (
            <ThemedView className="mr-2 mb-1" style={{ backgroundColor: "transparent" }}>
              {renderAvatar(
                item.senderAvatar,
                item.senderProfileFrame,
                item.senderName?.[0]?.toUpperCase(),
              )}
            </ThemedView>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => onLongPress?.(item)}
            style={{
              backgroundColor: bubbleColor,
              borderWidth: bubbleIsGrayDefault ? 1 : 0,
              borderColor: colors.border,
              ...bubbleCornerStyle,
              ...(isHighlighted
                ? { borderWidth: 2, borderColor: highlightBorderColor, backgroundColor: highlightBg }
                : {}),
            }}
            className="max-w-[90%] px-3.5 py-2"
          >
            {/* Reply Quote */}
            {item.replyTo &&
              (() => {
                const quoted = item.replyTo;
                const quotedPreview = getReplyQuotePreview(quoted);
                const accentColor = bubbleIsGrayDefault ? "#3b82f6" : bubbleTextColor;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onJumpToMessage?.(quoted.id)}
                    style={{
                      backgroundColor: bubbleIsGrayDefault
                        ? isDark
                          ? "#3f3f46"
                          : "#e4e4e7"
                        : isLightBubbleText
                          ? "rgba(255, 255, 255, 0.15)"
                          : "rgba(0, 0, 0, 0.08)",
                      borderLeftWidth: 3,
                      borderLeftColor: "#3b82f6",
                      maxWidth: SCREEN_WIDTH * 0.62,
                    }}
                    className="mb-1.5 rounded-r-lg px-2 py-1.5"
                  >
                    <ThemedText
                      numberOfLines={1}
                      style={{ color: accentColor }}
                      className="text-[11px] font-semibold"
                    >
                      {quoted.senderName || "Unknown"}
                    </ThemedText>
                    <View className="flex-row items-center mt-0.5">
                      <Ionicons name={quotedPreview.icon as any} size={11} color={accentColor} />
                      <ThemedText
                        numberOfLines={2}
                        style={{ color: bubbleTextColor, opacity: 0.75 }}
                        className="text-xs ml-1 flex-shrink"
                      >
                        {quotedPreview.label}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })()}

            {/* Sender Name Header (groups only) */}
            {showSenderName && !editingMessage && (
              <View
                className={`flex-row items-center mb-1 ${isMe ? "justify-end" : "justify-start"}`}
              >
                <ThemedText
                  style={{
                    color: bubbleIsGrayDefault
                      ? "#3b82f6"
                      : hasCustomBubbleColor
                        ? bubbleTextColor
                        : "#dbeafe",
                  }}
                  className="text-xs font-semibold"
                >
                  {item.senderName}
                </ThemedText>
              </View>
            )}

            {/* Highlight overlay for jump-to-message (yellow style) */}
            {isHighlighted && highlightStyle === "yellow" && (
              <View
                pointerEvents="none"
                style={{
                  ...StyleSheet.absoluteFill,
                  ...bubbleCornerStyle,
                  backgroundColor: highlightBg,
                  borderWidth: 2,
                  borderColor: highlightBorderColor,
                }}
              />
            )}

            {/* Media — attachments from server or local optimistic */}
            {hasAttachments ? (
              hasMultipleAttachments ? (
                /* Multi-image grid */
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 4,
                    marginBottom: 6,
                  }}
                >
                  {imageAttachments.map((att, idx) => {
                    const gridSize = imageAttachments.length === 2
                      ? (SCREEN_WIDTH * 0.55 - 2) / 2
                      : imageAttachments.length <= 4
                        ? (SCREEN_WIDTH * 0.55 - 4) / 3
                        : (SCREEN_WIDTH * 0.55 - 8) / 3;
                    return (
                      <TouchableOpacity
                        key={att.url + idx}
                        activeOpacity={0.9}
                        onPress={() => onPressMedia?.(att.url)}
                        style={{
                          width: gridSize,
                          height: gridSize,
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}
                      >
                        <Image
                          source={{ uri: att.url }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : imageAttachments.length === 1 ? (
                /* Single image from attachments */
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => onPressMedia?.(imageAttachments[0].url)}
                  className="mb-1.5 overflow-hidden rounded-xl"
                >
                  <Image
                    source={{ uri: imageAttachments[0].url }}
                    style={{ width: SCREEN_WIDTH * 0.55, height: 160 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ) : (
                /* Non-image attachment (file, etc.) */
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL(allAttachments[0].url)}
                  style={{
                    backgroundColor: bubbleIsGrayDefault
                      ? isDark ? "#3f3f46" : "#e4e4e7"
                      : isLightBubbleText ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
                    width: SCREEN_WIDTH * 0.55,
                  }}
                  className="mb-1.5 flex-row items-center px-3 py-2.5 rounded-xl"
                >
                  <FileText size={22} color={bubbleIsGrayDefault ? "#3b82f6" : bubbleTextColor} />
                  <ThemedText
                    numberOfLines={1}
                    style={{ color: bubbleTextColor, marginLeft: 8, flexShrink: 1 }}
                    className="text-xs font-medium"
                  >
                    {allAttachments[0].name || "Attachment"}
                  </ThemedText>
                </TouchableOpacity>
              )
            ) : hasMedia && mediaSource && (
              <>
                {renderMedia ? (
                  renderMedia(mediaSource, bubbleTextColor, bubbleIsGrayDefault, isLightBubbleText)
                ) : isImageAttachment ? (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onPressMedia?.(mediaSource)}
                    className="mb-1.5 overflow-hidden rounded-xl"
                  >
                    <Image
                      source={{ uri: mediaSource }}
                      style={{ width: SCREEN_WIDTH * 0.55, height: 160 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => Linking.openURL(mediaSource)}
                    style={{
                      backgroundColor: bubbleIsGrayDefault
                        ? isDark
                          ? "#3f3f46"
                          : "#e4e4e7"
                        : isLightBubbleText
                          ? "rgba(255, 255, 255, 0.15)"
                          : "rgba(0, 0, 0, 0.08)",
                      width: SCREEN_WIDTH * 0.55,
                    }}
                    className="mb-1.5 flex-row items-center px-3 py-2.5 rounded-xl"
                  >
                    <FileText size={22} color={bubbleIsGrayDefault ? "#3b82f6" : bubbleTextColor} />
                    <ThemedText
                      numberOfLines={1}
                      style={{ color: bubbleTextColor, marginLeft: 8, flexShrink: 1 }}
                      className="text-xs font-medium"
                    >
                      {attachmentFileName || "Attachment"}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Text Content */}
            {(!hasMedia ||
              (hasMedia && item.content !== mediaSource && item.content.trim().length > 0)) && (
              <ThemedText style={{ color: bubbleTextColor }} className="text-sm leading-5">
                {item.content}
              </ThemedText>
            )}

            {/* Timestamp & Delivery Status */}
            <View className="flex-row justify-end items-center mt-1">
              {(item.isPinned || item.isEdited) && (
                <ThemedText style={{ color: mutedTextColor }} className="text-[10px] italic mr-1">
                  {item.isPinned ? "📌 pinned" : "edited"}
                </ThemedText>
              )}
              <ThemedText style={{ color: mutedTextColor }} className="text-[10px]">
                {formatTime(item.createdAt)}
              </ThemedText>
              {isMe && !editingMessage && item.status === "failed" ? (
                <TouchableOpacity
                  onPress={() => onResend?.(item)}
                  className="flex-row items-center ml-1"
                >
                  <Ionicons name="alert-circle" size={13} color="#ef4444" />
                  <ThemedText
                    style={{ color: "#ef4444" }}
                    className="text-[10px] font-semibold ml-0.5"
                  >
                    Resend
                  </ThemedText>
                </TouchableOpacity>
              ) : (
                isMe &&
                !editingMessage && (
                  <Ionicons
                    name={
                      item.status === "pending"
                        ? "time-outline"
                        : item.readByOther && item.readReceiptsEnabled
                          ? "checkmark-done"
                          : "checkmark"
                    }
                    size={14}
                    color={
                      item.status !== "pending" && item.readByOther && item.readReceiptsEnabled
                        ? "#3b82f6"
                        : mutedTextColor
                    }
                    style={{ marginLeft: 3 }}
                  />
                )
              )}
            </View>

            {/* Reactions */}
            {summaryList.length > 0 && (
              <View className="flex-row flex-wrap items-center gap-1 mt-1.5 pt-1">
                {summaryList.slice(0, 3).map((reaction: any) => {
                  const iReacted = reaction.reactedByMe;
                  return (
                    <TouchableOpacity
                      key={reaction.emoji}
                      onPress={() => onToggleReaction?.(item, reaction.emoji)}
                      style={{
                        backgroundColor: iReacted
                          ? "rgba(59, 130, 246, 0.3)"
                          : "rgba(0, 0, 0, 0.15)",
                        borderColor: iReacted ? "#3b82f6" : "transparent",
                      }}
                      className="flex-row items-center px-2 py-0.5 rounded-full border"
                    >
                      <ThemedText className="text-xs mr-1">{reaction.emoji}</ThemedText>
                      <ThemedText className="text-[10px] font-bold text-white">
                        {reaction.count}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
                {summaryList.length > 3 && (
                  <View
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
                    className="px-2 py-0.5 rounded-full border border-transparent items-center justify-center"
                  >
                    <ThemedText className="text-[10px] font-bold text-white">
                      +{summaryList.length - 3}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Right avatar (me) */}
          {isMe && showAvatars && renderAvatar && (
            <ThemedView className="ml-2 mb-1" style={{ backgroundColor: "transparent" }}>
              {renderAvatar(
                item.senderAvatar,
                item.senderProfileFrame,
                item.senderName?.[0]?.toUpperCase(),
              )}
            </ThemedView>
          )}
        </ThemedView>
      )}

      {/* System notice ("X joined/left the chat") */}
      {item.isSystem && !item.isGiftMessage && (
        <View className="items-center my-2">
          <View
            style={{
              backgroundColor: isDark ? "rgba(39, 39, 42, 0.9)" : "rgba(228, 228, 231, 0.9)",
              borderWidth: 1,
              borderColor: colors.border,
            }}
            className="px-3.5 py-1.5 rounded-full"
          >
            <ThemedText
              style={{ color: colors.muted || "#a1a1aa" }}
              className="text-[11px] font-medium"
            >
              {item.content}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Gift message ("X sent Y rose") */}
      {item.isGiftMessage && (
        <View className="items-center my-2">
          <View
            style={{
              backgroundColor: isDark ? "rgba(245, 158, 11, 0.12)" : "rgba(245, 158, 11, 0.08)",
              borderWidth: 1,
              borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.25)",
            }}
            className="flex-row items-center px-4 py-2 rounded-full"
          >
            <ThemedText style={{ fontSize: 16, marginRight: 6 }}>
              {item.giftIcon || "🎁"}
            </ThemedText>
            <ThemedText
              style={{ color: isDark ? "#fbbf24" : "#d97706" }}
              className="text-[11px] font-semibold"
            >
              {item.content}
            </ThemedText>
          </View>
        </View>
      )}
    </>
  );
}
