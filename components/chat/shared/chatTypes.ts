/**
 * Shared types, interfaces, enums, constants, and helper functions
 * used by both chatScreen.tsx and groupDetailScreen.tsx.
 */
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
export { SCREEN_WIDTH };

// ── Interfaces & Types ──────────────────────────────────────────

export interface ChatMessageReaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderProfileFrame?: string | null;
  senderAppLevel?: string | number;
  content: string;
  mediaUrl?: string;
  mediaName?: string;
  mediaType?: string;
  senderBubbleColor?: string;
  senderBubbleStyle?: string;
  createdAt: string;
  isEdited?: boolean;
  isPinned?: boolean;
  replyToId?: string | null;
  replyTo?: ChatMessage | null;
  readByOther?: boolean;
  readReceiptsEnabled?: boolean;
  /** Optimistic send lifecycle. Undefined/"sent" = delivered to the server. */
  status?: "pending" | "sent" | "failed";
  reactions?: Record<string, string[]>;
  reactionSummary?: any;
  /** System notice ("X joined/left the chat") — not persisted history. */
  isSystem?: boolean;
  systemAction?: "joined" | "left" | "pinned";
  /** Gift message ("X sent Y 10x") — ephemeral, shown inline. */
  isGiftMessage?: boolean;
  giftSenderName?: string;
  giftName?: string;
  giftIcon?: string;
  giftCount?: number;
  /** Multiple file attachments for multi-image/file messages. */
  attachments?: { url: string; name: string; type: string }[];
}

export enum GroupWebSocketEvents {
  MESSAGE_NEW = "message:new",
  MESSAGE_EDITED = "message:edited",
  MESSAGE_DELETED = "message:deleted",
  MESSAGE_READ = "message:read",
  REACTION_ADDED = "reaction:added",
  REACTION_REMOVED = "reaction:removed",
  MEMBER_ADDED = "member:added",
  MEMBER_REMOVED = "member:removed",
  GROUP_UPDATED = "group:updated",
  USER_JOINED = "user:joined",
  USER_LEFT = "user:left",
  ONLINE_LIST = "user:online_list",
  USER_TYPING = "user:typing",
  MESSAGE_PINNED = "message:pinned",
  MESSAGE_UNPINNED = "message:unpinned",
}

// ── Constants ───────────────────────────────────────────────────

export const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export const GIFT_COMBO_WINDOW = 3000;

export const BUBBLE_COLOR_OPTIONS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#6366f1",
  "#0f172a",
];

export const BUBBLE_STYLE_OPTIONS: {
  key: string;
  label: string;
  radius: number;
  tailRadius: number;
}[] = [
  { key: "classic", label: "Classic", radius: 18, tailRadius: 4 },
  { key: "rounded", label: "Rounded", radius: 22, tailRadius: 22 },
  { key: "square", label: "Square", radius: 6, tailRadius: 6 },
];

// ── Helper Functions ────────────────────────────────────────────

export const isImageUrl = (url?: string | null) => {
  if (!url) return false;
  return (
    url.match(/\.(jpeg|jpg|gif|png|webp)$/i) !== null ||
    url.includes("images") ||
    url.includes("uploads")
  );
};

export const isAudioUrl = (url?: string | null) => {
  if (!url) return false;
  return url.match(/\.(m4a|mp3|wav|aac|caf|ogg)$/i) !== null;
};

export const buildPinPreview = (message: { content?: string; mediaUrl?: string }) => {
  const text = (message.content || "").trim();
  if (!text) return message.mediaUrl ? "an attachment" : "a message";
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
};

export const getReplyQuotePreview = (
  msg: ChatMessage | null | undefined,
): { icon: string; label: string } => {
  if (!msg) return { icon: "chatbubble", label: "Message" };
  const isAudio =
    msg.mediaType?.startsWith("audio/") || isAudioUrl(msg.mediaUrl);
  if (isAudio) return { icon: "mic", label: "Voice note" };
  const isImage =
    Boolean(msg.mediaUrl) &&
    (msg.mediaType?.startsWith("image/") || isImageUrl(msg.mediaUrl));
  if (isImage) return { icon: "image", label: "Photo" };
  if (msg.mediaUrl) {
    return { icon: "document", label: msg.mediaName || "Attachment" };
  }
  if (msg.content?.trim()) {
    return { icon: "chatbubble", label: msg.content.trim() };
  }
  return { icon: "chatbubble", label: "Message" };
};

export const formatDuration = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${mins} ${ampm}`;
};

export const getBubbleCornerStyle = (styleKey: string | undefined, isMe: boolean) => {
  const cfg =
    BUBBLE_STYLE_OPTIONS.find((s) => s.key === styleKey) ||
    BUBBLE_STYLE_OPTIONS[0];
  return {
    borderTopLeftRadius: cfg.radius,
    borderTopRightRadius: cfg.radius,
    borderBottomLeftRadius: isMe ? cfg.radius : cfg.tailRadius,
    borderBottomRightRadius: isMe ? cfg.tailRadius : cfg.radius,
  };
};

export const getContrastTextColor = (hex?: string | null) => {
  if (!hex || hex.length !== 7 || hex[0] !== "#") return "#ffffff";
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "#ffffff";
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#ffffff";
};

export const getDateLabel = (dateInput: string | Date): string => {
  const date = new Date(dateInput);
  const now = new Date();
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (dDate.getTime() - dNow.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays === -1) return "Yesterday";
  if (Math.abs(diffDays) < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

/**
 * Normalize a raw message object from the backend into a ChatMessage.
 * Handles both Group and DM message shapes.
 */
export const normalizeRawMessage = (msg: any, currentUser?: any): ChatMessage => {
  const rawSenderId = String(
    msg.userId ||
      msg.user?.id ||
      msg.user?._id ||
      msg.senderId ||
      msg.sender?.id ||
      msg.sender?._id ||
      "",
  ).trim();

  const currentUserId = currentUser?.id || "";
  const activeUserIdLower = String(currentUserId || "").toLowerCase();
  const isCurrentUser =
    Boolean(currentUserId) &&
    Boolean(rawSenderId) &&
    rawSenderId.toLowerCase() === activeUserIdLower;

  const senderName =
    msg.user?.username ||
    msg.user?.firstName ||
    msg.sender?.username ||
    msg.sender?.firstName ||
    msg.senderName ||
    (isCurrentUser ? currentUser?.username || "You" : "Unknown");

  const senderAvatar =
    msg.user?.profilePictureUrl ||
    msg.user?.avatar ||
    msg.sender?.profilePictureUrl ||
    msg.sender?.avatar ||
    msg.senderAvatar ||
    (isCurrentUser ? currentUser?.profilePictureUrl : "");

  const senderProfileFrame =
    msg.user?.profileFrame ||
    msg.sender?.profileFrame ||
    msg.senderProfileFrame ||
    (isCurrentUser ? currentUser?.profileFrame : null);

  const senderBubbleColor =
    msg.user?.bubbleColor ||
    msg.sender?.bubbleColor ||
    msg.senderBubbleColor ||
    (isCurrentUser ? currentUser?.bubbleColor : undefined) ||
    undefined;

  const senderBubbleStyle =
    msg.user?.bubbleStyle ||
    msg.sender?.bubbleStyle ||
    msg.senderBubbleStyle ||
    (isCurrentUser ? currentUser?.bubbleStyle : undefined) ||
    undefined;

  // Parse attachments array or fallback properties
  let mediaUrl = msg.mediaUrl || msg.imageUrl || msg.attachmentUrl;
  let mediaName: string | undefined = msg.mediaName;
  let mediaType: string | undefined = msg.mediaType;
  if (!mediaUrl && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
    const firstAttachment = msg.attachments[0];
    if (typeof firstAttachment === "string") {
      mediaUrl = firstAttachment;
    } else {
      mediaUrl = firstAttachment?.url || firstAttachment?.fileUrl || firstAttachment?.path;
      mediaName = firstAttachment?.originalName || firstAttachment?.filename || firstAttachment?.name;
      mediaType = firstAttachment?.mimetype || firstAttachment?.mimeType;
    }
  }

  let reactionSummary: Array<{
    emoji: string;
    count: number;
    reactedByMe: boolean;
  }> = [];

  if (Array.isArray(msg.reactionSummary)) {
    reactionSummary = msg.reactionSummary.map((r: any) => ({
      emoji: String(r.emoji),
      count: Number(r.count) || 0,
      reactedByMe:
        r.reactedByMe ??
        (Array.isArray(r.users)
          ? r.users
              .map((u: any) => String(u).toLowerCase())
              .includes(activeUserIdLower)
          : false),
    }));
  } else if (msg.reactions && typeof msg.reactions === "object") {
    reactionSummary = Object.entries(msg.reactions)
      .map(([emoji, users]: [string, any]) => {
        const userList = Array.isArray(users) ? users : [];
        return {
          emoji,
          count: userList.length,
          reactedByMe: userList
            .map((u: any) => String(u).toLowerCase())
            .includes(activeUserIdLower),
        };
      })
      .filter((r) => r.count > 0);
  }

  return {
    id: String(msg.id || msg._id || Date.now()),
    senderId: rawSenderId,
    senderName,
    senderAvatar,
    senderProfileFrame,
    senderBubbleColor,
    senderBubbleStyle,
    content: msg.content || msg.text || "",
    mediaUrl,
    mediaName,
    mediaType,
    createdAt: msg.createdAt || new Date().toISOString(),
    isEdited: Boolean(
      msg.isEdited || (msg.updatedAt && msg.updatedAt !== msg.createdAt),
    ),
    isPinned: Boolean(msg.isPinned),
    replyToId: msg.replyToId || null,
    replyTo: msg.replyTo ? normalizeRawMessage(msg.replyTo, currentUser) : null,
    readByOther: Boolean(msg.readByOther),
    readReceiptsEnabled: msg.readReceiptsEnabled !== false,
    isSystem: Boolean(msg.isSystem),
    isGiftMessage: Boolean(msg.isGiftMessage),
    giftSenderName: msg.giftSenderName,
    giftName: msg.giftName,
    giftIcon: msg.giftIcon,
    giftCount: msg.giftCount,
    systemAction: msg.systemAction === "left" ? "left" : "joined",
    reactions: msg.reactions || {},
    reactionSummary,
    attachments: Array.isArray(msg.attachments) ? msg.attachments : undefined,
  } as ChatMessage;
};
