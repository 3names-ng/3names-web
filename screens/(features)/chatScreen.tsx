import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  StatusBar,
  Image,
  StyleSheet,
  Pressable,
  Alert,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
  Animated,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { showError, showSuccess, showInfo } from "@/components/ui/toast";
import { Ionicons } from "@expo/vector-icons";
import { Socket } from "socket.io-client";
import { acquireNamespace, releaseNamespace, joinGroupRoom, leaveGroupRoom } from "@/service/socketManager";
import {
  Calendar,
  Check,
  ChevronRight,
  Edit3,
  FileText,
  Image as ImageIcon,
  LogOut,
  Palette,
  Pin,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
  type AudioPlayer,
} from "expo-audio";
import { Group, GroupMember, GroupsApi } from "@/service/groupChat.service";
import ChatBackgroundPickerModal from "@/components/chat/chatBackgroundPickerModal";
import { ChatBackground } from "@/components/chat/chatBackground";
import { ChatMessagesSkeleton } from "@/components/chat/messageSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { getChatBackgroundPreset } from "@/components/chat/chatBackgrounds";
import { useChatBackgroundStore } from "@/store/chatBackgroundStore";
import { usePinnedChatStore } from "@/store/pinnedChatStore";
import { useMessageCacheStore } from "@/store/messageCacheStore";
import { usePinnedMessageStore } from "@/store/pinnedMessageStore";
import { useWaveformStore } from "@/store/waveformStore";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { useOnlineUsersStore } from "@/store/onlineUsersStore";
import { useTranslation } from "@/hooks/useTranslation";
import { checkOnlineUsers } from "@/hooks/useOnlineStatusSocket";
import { ThemedView } from "@/components/ui/ThemedView";
import { userService } from "@/service/profile.Service";
import { LevelBadge } from "@/components/levelBadge";
import OnlineIndicator from "@/components/chat/onlineIndicator";
import { giftService, GiftTargetType } from "@/service/post.service";
import type { Gifts as UIGift } from "@/components/gift/GiftGridItem";
import type { GiftSendOverlayRef } from "@/components/gift/GiftSendOverlay";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import { api } from "@/service/api";

import GiftModal from "@/components/gift/GiftModal";
import GiftSendOverlay from "@/components/gift/GiftSendOverlay";
import FloatingComboButton from "@/components/gift/floatingComboButton";
import { usePendingGiftOverlayStore } from "@/store/pendingGiftOverlayStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Shared types, constants, and helpers from components/chat/shared ──
import type { ChatMessage } from "@/components/chat/shared/chatTypes";
import {
  ChatMessageReaction,
  GroupWebSocketEvents,
  QUICK_EMOJIS,
  GIFT_COMBO_WINDOW,
  BUBBLE_COLOR_OPTIONS,
  BUBBLE_STYLE_OPTIONS,
  isImageUrl,
  isAudioUrl,
  buildPinPreview,
  getReplyQuotePreview,
  formatDuration,
  getBubbleCornerStyle,
  getContrastTextColor,
  normalizeRawMessage as sharedNormalizeRawMessage,
} from "@/components/chat/shared/chatTypes";
import MessageBubble from "@/components/chat/MessageBubble";
import VoiceMessageBubble from "@/components/chat/VoiceMessageBubble";
import BubbleCustomizerModal from "@/components/chat/BubbleCustomizerModal";
import MediaLightboxModal from "@/components/chat/MediaLightboxModal";
import ReportReasonSheet from "@/components/chat/reportReasonSheet";
import SharedMediaSection from "@/components/chat/SharedMediaSection";

const normalizeRawMessage = (msg: any, currentUser?: any): ChatMessage => {
  return sharedNormalizeRawMessage(msg, currentUser) as ChatMessage;
};

const getReplyPreview = (msg: ChatMessage): { icon: string; label: string } => {
  return getReplyQuotePreview(msg);
};

export default function ChatScreen() {
  const { id, isUserId, user } = useLocalSearchParams<{
    id: string;
    isUserId?: string;
    user?: string;
  }>();
  const parsedUser = React.useMemo(() => {
    if (!user) return null;
    try {
      return JSON.parse(user);
    } catch (e) {
      console.error("Failed to parse user params:", e);
      return null;
    }
  }, [user]);
  const [groupId, setGroupId] = useState<string | null>(
    isUserId === "true" ? null : id,
  );
  const [chatInfo, setChatInfo] = useState<any>(
    parsedUser ? { participant: parsedUser } : null,
  );
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Offline message cache (persisted per conversation)
  const loadCachedMessages = useMessageCacheStore(
    (state) => state.loadCachedMessages,
  );
  const setCachedMessages = useMessageCacheStore(
    (state) => state.setCachedMessages,
  );
  const cacheRehydrated = useMessageCacheStore((state) => state.rehydrated);

  // Auth Store
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => (state as any).user);
  const updateAuthUser = useAuthStore((state) => state.updateUser);

  // Selected chat wallpaper (persisted locally per device)
  const backgroundKey = useChatBackgroundStore((state) => state.backgroundKey);
  const backgroundImageUri = useChatBackgroundStore(
    (state) => state.backgroundImageUri,
  );
  const chatBackgroundPreset = useMemo(
    () => getChatBackgroundPreset(backgroundKey),
    [backgroundKey],
  );

  // Extract logged-in user ID
  const currentUserId = useMemo(() => {
    const rawId =
      currentUser?.id ||
      currentUser?._id ||
      currentUser?.userId ||
      currentUser?.user?.id ||
      currentUser?.user?._id ||
      "";
    return String(rawId).trim().toLowerCase();
  }, [currentUser]);


 
  // Navigation View State (Chat View vs Group Details Screen)
  const [viewingDetails, setViewingDetails] = useState<boolean>(false);

  // Report / block (App Store 1.2: users must be able to report and block)
  const [reportTarget, setReportTarget] = useState<
    { kind: "message"; message: ChatMessage } | { kind: "user" } | null
  >(null);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedEitherWay, setBlockedEitherWay] = useState(false);
  const [socketStatus, setSocketStatus] = useState<"connected" | "reconnecting" | "disconnected">("disconnected");

  // Lightbox Media Preview State
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0);

  // All image URLs extracted from chat messages (for gallery swiping)
  const allChatImages = useMemo(() => {
    const urls: string[] = [];
    messages.forEach((msg) => {
      // From attachments array
      if (Array.isArray(msg.attachments)) {
        msg.attachments.forEach((att: any) => {
          if (att.type === "image" || att.type?.startsWith("image/") || isImageUrl(att.url)) {
            if (!urls.includes(att.url)) urls.push(att.url);
          }
        });
      }
      // From mediaUrl
      if (msg.mediaUrl && (msg.mediaType?.startsWith("image/") || isImageUrl(msg.mediaUrl))) {
        if (!urls.includes(msg.mediaUrl)) urls.push(msg.mediaUrl);
      }
      // From content if it's an image URL
      if (!msg.mediaUrl && isImageUrl(msg.content)) {
        const url = msg.content.trim();
        if (!urls.includes(url)) urls.push(url);
      }
    });
    return urls;
  }, [messages]);

  // Handle tapping an image — find its index in the full list
  const handlePressMedia = useCallback(
    (url: string) => {
      const idx = allChatImages.indexOf(url);
      setPreviewImageIndex(idx >= 0 ? idx : 0);
      setPreviewMediaUrl(url);
    },
    [allChatImages],
  );

  // Settings States
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Chat Bubble Customization States
  const [showBubbleCustomizer, setShowBubbleCustomizer] =
    useState<boolean>(false);

  // Chat Background Picker State
  const [showBackgroundPicker, setShowBackgroundPicker] =
    useState<boolean>(false);

  // Pin Chat
  const pinnedIds = usePinnedChatStore((state) => state.pinnedIds);
  const togglePinChat = usePinnedChatStore((state) => state.togglePin);
  const isChatPinned = Boolean(pinnedIds[id || groupId || ""]);

  // Pinned Message State (one message pinned at the top of the DM)
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);

  // Offline cache so the pinned banner survives app restarts / reopening the chat
  const loadCachedPinnedMessage = usePinnedMessageStore(
    (state) => state.loadCachedPinnedMessage,
  );
  const setCachedPinnedMessage = usePinnedMessageStore(
    (state) => state.setCachedPinnedMessage,
  );
  const pinnedMessageCacheRehydrated = usePinnedMessageStore(
    (state) => state.rehydrated,
  );
  const pinCacheHydratedForIdRef = useRef<string | null>(null);

  const handlePinMessage = async (message: ChatMessage) => {
    setSelectedMessage(null);
    try {
      await GroupsApi.pinMessage(id || groupId || "", message.id);
   
    } catch (err: any) {
    
    }
  };

  const handleUnpinMessage = async () => {
    if (!pinnedMessage) return;
    try {
      await GroupsApi.unpinMessage(id || groupId || "", pinnedMessage.id);
      setPinnedMessage(null);
      setMessages((prev) =>
        prev.map((m) => (m.isPinned ? { ...m, isPinned: false } : m)),
      );
      // Toast.show({ type: "info", text1: "Message unpinned" });
    } catch (err: any) {
      // Toast.show({
      //   type: "error",
      //   text1: "Could not unpin message",
      //   text2: err?.response?.data?.message || "Please try again.",
      // });
    }
  };

  // Show the last-known pinned message instantly from the offline cache,
  // before the network fetch below confirms (or clears) it.
  useEffect(() => {
    const chatId = id || groupId;
    if (
      !chatId ||
      !pinnedMessageCacheRehydrated ||
      pinCacheHydratedForIdRef.current === chatId
    )
      return;
    pinCacheHydratedForIdRef.current = chatId;
    const cached = loadCachedPinnedMessage(chatId) as ChatMessage | null;
    setPinnedMessage(cached);
  }, [id, groupId, pinnedMessageCacheRehydrated, loadCachedPinnedMessage]);

  // Keep the offline cache in sync with the live pinned message so it
  // persists across app restarts / reopening the chat.
  useEffect(() => {
    const chatId = id || groupId;
    if (!chatId || pinCacheHydratedForIdRef.current !== chatId) return;
    setCachedPinnedMessage(chatId, pinnedMessage);
  }, [id, groupId, pinnedMessage, setCachedPinnedMessage]);

  // Fetch the pinned message on mount
  useEffect(() => {
    const chatId = id || groupId;
    if (!chatId) return;
    GroupsApi.getPinnedMessage(chatId)
      .then((msg) => {
        if (msg && !msg.isDeleted) {
          setPinnedMessage(normalizeMessage(msg));
        } else {
          setPinnedMessage(null);
        }
      })
      .catch(() => {});
  }, [id, groupId]);

  // Gift Sending State
  const [showGifts, setShowGifts] = useState(false);
  const [giftCoins, setGiftCoins] = useState(currentUser?.coins ?? 0);
  const [activeComboGift, setActiveComboGift] = useState<UIGift | null>(null);
  const giftOverlayRef = useRef<GiftSendOverlayRef | null>(null);
  // Tracks in-flight combo gifts (senderId|giftId|recipientId -> message/count) so
  // rapid repeat taps update one "X sent Y rose x10" message instead of spamming new ones.
  const giftComboMapRef = useRef<
    Map<string, { messageId: string; count: number; lastTs: number }>
  >(new Map());

  const handleGiftSent = (gift: UIGift) => {
    if (giftCoins < gift.coins) {
      showError(t("chat.couldNotSendGift") + ": Not enough coins");
      return;
    }
    const nextBalance = giftCoins - gift.coins;
    setGiftCoins(nextBalance);

    // Close the picker / hand off to the combo button immediately — don't
    // make the tap wait on the network round-trip before anything reacts.
    setShowGifts(false);
    setActiveComboGift(gift);

    giftService
      .sendGift({
        giftId: gift.id as string,
        targetType: GiftTargetType.DM,
        targetId: groupId || id || "",
        recipientId: parsedUser?.id || "",
      })
      .then(() => {
        DeviceEventEmitter.emit("GIFT_TRANSACTION_COMPLETE", {
          newBalance: nextBalance,
        });
        // Backend broadcasts gift:sent via groupsGateway for DM — no client emit needed
      })
      .catch((error: any) => {
        setGiftCoins(giftCoins);
        showError(`${t("chat.couldNotSendGift")}: ${error?.response?.data?.message || t("misc.tryAgain")}`);
      });
  };

  const handleComboTimeout = (count: number) => {
    const gift = activeComboGift;
    setActiveComboGift(null);
    if (gift) {
      giftOverlayRef.current?.show(gift, currentUser?.username || "You", count);
    }
  };

  // NOTE: gift:sent and gift_received listeners are registered inside
  // the socket setup useEffect below (line ~1065) to avoid a race condition
  // where the gift listener effect runs before socketRef.current is set.

  const [draftBubbleColor, setDraftBubbleColor] = useState<string>(
    BUBBLE_COLOR_OPTIONS[0],
  );
  const [draftBubbleStyle, setDraftBubbleStyle] = useState<string>(
    BUBBLE_STYLE_OPTIONS[0].key,
  );
  const [savingBubbleStyle, setSavingBubbleStyle] = useState<boolean>(false);

  // Real-Time Online & Typing States (online status is global via useOnlineUsersStore)
  const onlineUserIds = useOnlineUsersStore((s) => s.onlineUserIds);
  const setUserOnline = useOnlineUsersStore((s) => s.setUserOnline);
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());

  // UI & Action States
  // True until initChat shows cached or fetched history (it clears this either way)
  const [loading, setLoading] = useState<boolean>(true);
  const showMessagesSkeleton = useDelayedLoading(loading);
  const [inputText, setInputText] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>("");

  // Message Action Sheet / Edit States
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null,
  );
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null,
  );
  // Message being replied to (shown as a quote bar above the composer)
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(
    null,
  );

  // Jump-to-replied-message: id of the message currently highlighted
  const [highlightedMessageId, setHighlightedMessageId] = useState<string |
    null>(null);
  // Guards onContentSizeChange's scroll-to-end while a jump scroll is in
  // flight / a highlight is being shown, so we don't yank the view back to
  // the bottom until the user deliberately scrolls away themselves.
  const isJumpingRef = useRef(false);

  // Map member IDs to Usernames
  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m: any) => {
      const rawId = m.userId || m.user?.id || m.user?._id || m.id || m._id;
      const cleanId = String(rawId || "")
        .trim()
        .toLowerCase();
      const name =
        m.username ||
        m.user?.username ||
        m.user?.firstName ||
        m.firstName ||
        m.name ||
        m.user?.name ||
        "Someone";

      if (cleanId) map.set(cleanId, name);
    });
    return map;
  }, [members]);

  const memberNameMapRef = useRef(memberNameMap);
  useEffect(() => {
    memberNameMapRef.current = memberNameMap;
  }, [memberNameMap]);

  const currentUserIdRef = useRef(currentUserId);
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Aggregate media list from all group chat messages (from direct media, attachment objects, or content links)
  const sharedMediaList = useMemo(() => {
    const mediaItems: { id: string; url: string; createdAt: string }[] = [];
    const seenUrls = new Set<string>();

    messages.forEach((msg) => {
      // From attachments array
      if (Array.isArray(msg.attachments)) {
        msg.attachments.forEach((att: any) => {
          const isImage = att.type === "image" || att.type?.startsWith("image/") || isImageUrl(att.url);
          if (isImage && att.url && !seenUrls.has(att.url)) {
            seenUrls.add(att.url);
            mediaItems.push({ id: `${msg.id}-${att.url}`, url: att.url, createdAt: msg.createdAt });
          }
        });
      }
      // From mediaUrl
      const mediaIsImage = msg.mediaType?.startsWith("image/") || isImageUrl(msg.mediaUrl);
      if (msg.mediaUrl && mediaIsImage && !seenUrls.has(msg.mediaUrl)) {
        seenUrls.add(msg.mediaUrl);
        mediaItems.push({ id: msg.id, url: msg.mediaUrl, createdAt: msg.createdAt });
      } else if (!msg.mediaUrl && isImageUrl(msg.content)) {
        const url = msg.content.trim();
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          mediaItems.push({ id: msg.id, url, createdAt: msg.createdAt });
        }
      }
    });

    return mediaItems.reverse();
  }, [messages]);

  // Format timestamps
  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Normalize message object to match backend schema response
  const normalizeMessage = useCallback(
    (msg: any): ChatMessage => normalizeRawMessage(msg, currentUser),
    [currentUser],
  );

  // Keep the offline cache in sync with everything that changes messages
  useEffect(() => {
    if (groupId && messages.length > 0) {
      setCachedMessages(groupId, messages);
    }
  }, [groupId, messages, setCachedMessages]);

  // Real-time: when any user updates their profile (frame, picture, name),
  // patch every message in this chat that belongs to that user.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "PROFILE_FRAME_UPDATED",
      (data: { userId: string; profileFrame?: string | null; profilePictureUrl?: string | null; username?: string | null }) => {
        if (!data?.userId) return;
        const cleanUserId = data.userId.toLowerCase();
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.senderId.toLowerCase() !== cleanUserId) return msg;

            const nextAvatar =
              data.profilePictureUrl !== undefined
                ? data.profilePictureUrl ?? msg.senderAvatar
                : msg.senderAvatar;
            const nextName =
              data.username !== undefined
                ? data.username ?? msg.senderName
                : msg.senderName;

            return {
              ...msg,
              senderAvatar: nextAvatar,
              senderName: nextName,
            };
          })
        );
      },
    );
    return () => sub.remove();
  }, []);

  // Ref flag to synchronize initial load and focus re-fetches
  const isInitializing = useRef<boolean>(true);

  // --- 1. Fetch Messages Handler ---
  const fetchMessages = useCallback(
    async (activeGroupId: string, cursor?: string) => {
      if (!activeGroupId) {
        return;
      }
      try {
        const data = await GroupsApi.getMelistMessages(activeGroupId, {
          limit: 20,
          cursor,
        });

        const rawMessages = Array.isArray(data)
          ? data
          : (data as { items?: unknown[] })?.items || [];

        const formattedMessages = rawMessages
          .map(normalizeMessage)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );

        // Merge fetched history with whatever is already shown/cached
        // (keeps locally-sent messages and survives offline launches)
        setMessages((prev) => {
          const byId = new Map<string, ChatMessage>();
          [...prev, ...formattedMessages].forEach((m) => byId.set(m.id, m));
          return Array.from(byId.values()).sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        });

        setCachedMessages(activeGroupId, formattedMessages);

      } catch (error: any) {
        showError(`${t("chat.connectionFailed")}: ${error.response?.data?.message || t("chat.showingSavedMessages")}`);
      }
    },
    [currentUserId, setCachedMessages],
  );

  // --- 2. Initialize Conversation ---
  useEffect(() => {
    async function initChat() {
      if (!id) {
        console.warn("⚠️ [initChat] Aborted: No route ID parameter present");
        return;
      }

      try {
        isInitializing.current = true;

        let activeGroupId: string | null = null;

        if (isUserId === "true" || !groupId) {
          const res = await GroupsApi.createDirectConversation(id);

          activeGroupId = res?.id;

          setGroupId(activeGroupId);
          setChatInfo(res);
        } else {
          activeGroupId = id;
        }

        if (activeGroupId) {
          // Show previously saved messages instantly (works offline),
          // then fetch fresh history on top.
          const cached = loadCachedMessages(activeGroupId);
          if (cached.length > 0) {
            setMessages(cached as unknown as ChatMessage[]);
            // Cached history is on screen — don't hold the UI behind a spinner
            setLoading(false);
          }

          await fetchMessages(activeGroupId);

          await GroupsApi.markAsReadDm(activeGroupId)
            .then(() =>
              console.log("✅ [POST /dm/read] Marked as read successfully"),
            )
            .catch((err) =>
              console.error(
                "❌ [POST /dm/read] Error:",
                err.response?.data || err.message,
              ),
            );
        }
      } catch (error: any) {
        console.error("❌ [initChat] Initialization failed:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        showError(`${t("chat.chatError")}: ${error.response?.data?.message || t("chat.couldNotStart")}`);
      } finally {
        setLoading(false);
        isInitializing.current = false;
        // Ensure we scroll to the very last message after initial load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 150);
      }
    }    initChat();
  }, [id, isUserId]);

  // --- 3. Refresh Screen on Focus ---

  
  useFocusEffect(
    useCallback(() => {
      if (groupId && !isInitializing.current) {
        fetchMessages(groupId);

        GroupsApi.markAsReadDm(groupId)
          .then(() =>
            console.log("✅ [POST /dm/read] Focus mark as read success"),
          )
          .catch((err) =>
            console.error(
              "❌ [POST /dm/read] Focus mark as read error:",
              err.response?.data || err.message,
            ),
          );
      }
    }, [groupId, fetchMessages]),
  );

  // Consume pending gift overlay from push notification
  useEffect(() => {
    const pending = usePendingGiftOverlayStore.getState().pendingGift;
    if (!pending) return;

    // Only show if the pending gift belongs to this conversation
    if (pending.groupId && pending.groupId !== groupId) return;

    // Don't show if the event is stale (older than 10 seconds)
    if (Date.now() - pending.receivedAt > 10000) {
      usePendingGiftOverlayStore.getState().consumePendingGift();
      return;
    }

    usePendingGiftOverlayStore.getState().consumePendingGift();
    giftOverlayRef.current?.show(
      {
        id: pending.giftId || "",
        name: pending.giftName,
        icon: pending.giftIcon || "🎁",
        coins: pending.giftCoinCost || 0,
        rarity: pending.giftRarity || "rare",
        animationUrl: pending.giftAnimationUrl || "",
        videoUrl: pending.giftVideoUrl || "",
      },
      pending.senderName,
    );
  }, [groupId]);

  // Real-Time Socket Connection Setup — uses the SHARED /groups socket
  useEffect(() => {
    if (!groupId) return;

    // Acquire the shared /groups socket (same one useGroupSocket and useGiftSocket use)
    const socket = acquireNamespace("/groups");
    socketRef.current = socket;

    // Track connection status
    if (socket.connected) {
      setSocketStatus("connected");
    }

    // ── Define all named handlers so we can clean them up ─────────
    const handleConnect = () => {
      console.log("✅ [Socket] Connected:", socket.id);
      setSocketStatus("connected");
      socket.emit("joinGroup", { groupId: groupId });
      // Re-check online status on reconnect
      const targetUserId = parsedUser?.id ;
      if (targetUserId) {
        checkOnlineUsers([targetUserId]);
      }
    };

    const handleDisconnect = (reason: string) => {
      console.warn("⚠️ [Socket] Disconnected:", reason);
      setSocketStatus("disconnected");
    };

    const handleConnectError = (error: any) => {
      console.error("❌ [Socket] Connection error:", error?.message || error);
      setSocketStatus("disconnected");
    };

    // handleOnlineList, handleOnlineStatus, handleStatusChange are now
    // managed globally by useOnlineStatusSocket — no local handlers needed.

    const handleUserJoined = ({ userId }: { userId: string }) => {
      const cleanId = String(userId || "").trim().toLowerCase();
      if (cleanId) setUserOnline(cleanId, true);
    };

    const handleUserLeft = ({ userId }: { userId: string }) => {
      const cleanId = String(userId || "").trim().toLowerCase();
      if (!cleanId) return;
      // Leaving the DM room only means they left this chat screen — they
      // may still be connected to the app. Re-query the server for their
      // true online status instead of marking them offline.
      checkOnlineUsers([cleanId]);
      setTypingUserIds((prev) => {
        const updated = new Set(prev);
        updated.delete(cleanId);
        return updated;
      });
    };

    const handleTyping = (payload: any) => {
      const rawIncomingId = payload?.userId || payload?.user?.id || payload?.user?._id || payload?.id || payload?.senderId;
      const cleanIncomingId = String(rawIncomingId || "").trim().toLowerCase();
      const isTyping = Boolean(payload?.isTyping ?? payload?.typing);
      if (!cleanIncomingId || cleanIncomingId === currentUserIdRef.current) return;
      setTypingUserIds((prev) => {
        const updated = new Set(prev);
        if (isTyping) updated.add(cleanIncomingId);
        else updated.delete(cleanIncomingId);
        return updated;
      });
    };

    const handleGroupUpdated = (updatedGroup: any) => {
      setGroup((prev) => ({ ...prev, ...updatedGroup }));
    };

    const handleMessageNew = (rawMessage: any) => {
      const newMessage = normalizeMessage(rawMessage);
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === newMessage.id)) return prev;
        const pendingIdx = prev.findIndex(
          (msg) => msg.status === "pending" && msg.senderId === newMessage.senderId && msg.content === newMessage.content,
        );
        if (pendingIdx !== -1) {
          const next = [...prev];
          next[pendingIdx] = newMessage;
          return next;
        }
        const updated = [...prev, newMessage];
        return updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
      setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    };

    const handleMessageEdited = (rawMessage: any) => {
      const editedMsg = normalizeMessage(rawMessage);
      setMessages((prev) => prev.map((msg) => msg.id === editedMsg.id ? { ...msg, content: editedMsg.content, isEdited: true } : msg));
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      const deletedId = String(messageId);
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== deletedId)
          .map((msg) =>
            msg.replyToId === deletedId
              ? { ...msg, replyToId: null, replyTo: null }
              : msg,
          ),
      );
    };

    const handleMessageRead = ({ groupId: readGroupId, lastReadAt }: any) => {
      if (String(readGroupId) !== String(groupId)) return;
      const readAt = new Date(lastReadAt).getTime();
      if (Number.isNaN(readAt)) return;
      setMessages((prev) => prev.map((msg) =>
        msg.senderId?.toLowerCase() === currentUserIdRef.current && new Date(msg.createdAt).getTime() <= readAt
          ? { ...msg, readByOther: true } : msg,
      ));
    };

    const handleReactionAdded = (payload: any) => {
      const { messageId, emoji, userId } = payload;
      const cleanUserId = String(userId).trim().toLowerCase();
      setMessages((prev) => prev.map((msg) => {
        if (msg.id !== String(messageId)) return msg;
        const currentReactions = { ...(msg.reactions || {}) };
        const existingUserIds = currentReactions[emoji] || [];
        if (!existingUserIds.includes(cleanUserId)) {
          currentReactions[emoji] = [...existingUserIds, cleanUserId];
        }
        return { ...msg, reactions: currentReactions };
      }));
    };

    const handleReactionRemoved = (payload: any) => {
      const { messageId, emoji, userId } = payload;
      const cleanUserId = String(userId).trim().toLowerCase();
      setMessages((prev) => prev.map((msg) => {
        if (msg.id !== String(messageId)) return msg;
        const currentReactions = { ...(msg.reactions || {}) };
        if (currentReactions[emoji]) {
          currentReactions[emoji] = currentReactions[emoji].filter((u) => u !== cleanUserId);
          if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
        }
        return { ...msg, reactions: currentReactions };
      }));
    };

    const handleMessagePinned = (data: any) => {
      const pinned = data?.pinnedMessage;
      if (!pinned) return;
      const normalizedPinned = normalizeMessage(pinned);
      setPinnedMessage(normalizedPinned);
      setMessages((prev) => {
        const alreadyFlagged = prev.some((m) => m.id === normalizedPinned.id && m.isPinned);
        const withFlags = prev.map((m) => m.id === normalizedPinned.id ? { ...m, isPinned: true } : m.isPinned ? { ...m, isPinned: false } : m);
        if (alreadyFlagged) return withFlags;
        const actorId = String(data?.pinnedBy?.id || data?.pinnedBy?._id || data?.actorId || data?.userId || "").trim().toLowerCase();
        const actorName = data?.pinnedBy?.username || data?.pinnedBy?.name || data?.actorName || data?.userName || (actorId === currentUserIdRef.current ? currentUser?.username || "You" : parsedUser?.username) || "Someone";
        const notice: ChatMessage = {
          id: `pin-${normalizedPinned.id}-${Date.now()}`,
          senderId: actorId,
          senderName: actorName,
          content: `${actorName} pinned: "${buildPinPreview(normalizedPinned)}"`,
          createdAt: new Date().toISOString(),
          isSystem: true,
          systemAction: "pinned",
        };
        const next = [...withFlags];
        const insertAt = next.findIndex((m) => m.createdAt > notice.createdAt);
        if (insertAt === -1) next.push(notice);
        else next.splice(insertAt, 0, notice);
        return next;
      });
    };

    const handleMessageUnpinned = () => {
      setPinnedMessage(null);
      setMessages((prev) => prev.map((m) => (m.isPinned ? { ...m, isPinned: false } : m)));
    };

    // ── Register all handlers ────────────────────────────────────
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on(GroupWebSocketEvents.USER_JOINED, handleUserJoined);
    socket.on(GroupWebSocketEvents.USER_LEFT, handleUserLeft);
    socket.on(GroupWebSocketEvents.USER_TYPING, handleTyping);
    socket.on(GroupWebSocketEvents.GROUP_UPDATED, handleGroupUpdated);
    socket.on(GroupWebSocketEvents.MESSAGE_NEW, handleMessageNew);
    socket.on(GroupWebSocketEvents.MESSAGE_EDITED, handleMessageEdited);
    socket.on(GroupWebSocketEvents.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(GroupWebSocketEvents.MESSAGE_READ, handleMessageRead);
    socket.on(GroupWebSocketEvents.REACTION_ADDED, handleReactionAdded);
    socket.on(GroupWebSocketEvents.REACTION_REMOVED, handleReactionRemoved);
    socket.on(GroupWebSocketEvents.MESSAGE_PINNED, handleMessagePinned);
    socket.on(GroupWebSocketEvents.MESSAGE_UNPINNED, handleMessageUnpinned);

    // ── Gift listeners ──────────────────────────────────────────
    // Dedup: track last overlay show time so we don't double-show
    // when both gift:sent (group room) and gift_received (personal room) arrive.
    let lastGiftOverlayTs = 0;

    const handleGiftSent = (data: any) => {
      const ts = Date.now();
      lastGiftOverlayTs = ts;
      (globalThis as any).__lastGiftOverlayTs = ts;
      const senderId = String(data?.senderId || "").trim().toLowerCase();
      const isMe = senderId === currentUserIdRef.current;
      const senderName = data?.senderName || "Someone";
      const gift = data?.gift;
      if (!gift) return;

      // Show flying gift overlay for ALL users (sender + other party)
      giftOverlayRef.current?.show(
        {
          id: gift.id,
          name: gift.name,
          icon: gift.icon || "🎁",
          coins: gift.coinCost || 0,
          rarity: gift.rarity || "rare",
          animationUrl: gift.animationUrl || "",
          videoUrl: gift.videoUrl,
        },
        senderName,
      );

      // Add system message to the DM so both users see "X sent Y rose x10".
      const recipientId = String(
        data?.recipientId || data?.recipient?.id || data?.targetUserId || "",
      )
        .trim()
        .toLowerCase();
      const recipientName = isMe
        ? parsedUser?.username || "them"
        : currentUser?.username || "you";
      const comboKey = `${senderId}|${gift.id}|${recipientId}`;
      const now = Date.now();
      const existingCombo = giftComboMapRef.current.get(comboKey);

      if (existingCombo && now - existingCombo.lastTs < GIFT_COMBO_WINDOW) {
        const nextCount = existingCombo.count + 1;
        giftComboMapRef.current.set(comboKey, { ...existingCombo, count: nextCount, lastTs: now });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === existingCombo.messageId
              ? {
                  ...m,
                  giftCount: nextCount,
                  content: `${senderName} sent ${recipientName} ${gift.name}${
                    nextCount > 1 ? ` x${nextCount}` : ""
                  }`,
                }
              : m,
          ),
        );
      } else {
        const messageId = `gift-${data?.senderId}-${gift.id}-${now}`;
        giftComboMapRef.current.set(comboKey, { messageId, count: 1, lastTs: now });

        const giftSystemMessage: ChatMessage = {
          id: messageId,
          senderId: data?.senderId || "",
          senderName,
          content: `${senderName} sent ${recipientName} ${gift.name}`,
          createdAt: new Date().toISOString(),
          isGiftMessage: true,
          giftSenderName: senderName,
          giftName: gift.name,
          giftIcon: gift.icon || "🎁",
          giftCount: 1,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === giftSystemMessage.id)) return prev;
          const next = [...prev];
          const insertAt = next.findIndex((m) => m.createdAt > giftSystemMessage.createdAt);
          if (insertAt === -1) next.push(giftSystemMessage);
          else next.splice(insertAt, 0, giftSystemMessage);
          return next;
        });
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    // Listen for gift_received — sent ONLY to the recipient via sendToUser.
    // Shows the overlay directly when gift:sent was missed due to disconnection.
    const handleGiftReceived = (data: any) => {
      const gift = data?.gift;
      if (!gift) return;

      // Skip if gift:sent already triggered the overlay within the last 3s
      if (Date.now() - lastGiftOverlayTs < 3000) return;
      lastGiftOverlayTs = Date.now();
      (globalThis as any).__lastGiftOverlayTs = Date.now();

      const senderId = String(data?.senderId || "").trim().toLowerCase();
      const senderName = data?.senderName || "Someone";

      giftOverlayRef.current?.show(
        {
          id: gift.id,
          name: gift.name,
          icon: gift.icon || "🎁",
          coins: gift.coinCost || 0,
          rarity: gift.rarity || "rare",
          animationUrl: gift.animationUrl || "",
          videoUrl: gift.videoUrl,
        },
        senderName,
      );

      const recipientId = String(
        data?.recipientId || data?.recipient?.id || data?.targetUserId || "",
      )
        .trim()
        .toLowerCase();
      const recipientName =
        data?.recipientName ||
        data?.recipient?.username ||
        parsedUser?.username ||
        "you";
      const comboKey = `${senderId}|${gift.id}|${recipientId}`;
      const now = Date.now();
      const existingCombo = giftComboMapRef.current.get(comboKey);

      if (existingCombo && now - existingCombo.lastTs < GIFT_COMBO_WINDOW) {
        const nextCount = existingCombo.count + 1;
        giftComboMapRef.current.set(comboKey, { ...existingCombo, count: nextCount, lastTs: now });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === existingCombo.messageId
              ? { ...m, giftCount: nextCount, content: `${senderName} sent ${gift.name} x${nextCount}` }
              : m,
          ),
        );
      } else {
        const messageId = `gift-recv-${data?.senderId}-${gift.id}-${now}`;
        giftComboMapRef.current.set(comboKey, { messageId, count: 1, lastTs: now });
        const giftSystemMessage: ChatMessage = {
          id: messageId,
          senderId: data?.senderId || "",
          senderName,
          content: `${senderName} sent ${gift.name} x1`,
          createdAt: new Date().toISOString(),
          isSystem: true,
          giftSenderName: senderName,
          giftName: gift.name,
          giftIcon: gift.icon || "🎁",
          giftCount: 1,
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === giftSystemMessage.id)) return prev;
          const next = [...prev];
          const insertAt = next.findIndex((m) => m.createdAt > giftSystemMessage.createdAt);
          if (insertAt === -1) next.push(giftSystemMessage);
          else next.splice(insertAt, 0, giftSystemMessage);
          return next;
        });
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Also emit for other screens (profile coin balance, notification badge, etc.)
      DeviceEventEmitter.emit("gift_received", {
        senderId: data?.senderId,
        senderName,
        giftName: gift.name,
        giftIcon: gift.icon || "🎁",
        giftId: gift.id,
      });
    };

    socket.on("gift:sent", handleGiftSent);
    socket.on("gift_received", handleGiftReceived);

    // Request online status for the other user (global hook handles responses)
    const targetUserId = parsedUser?.id
    if (targetUserId) {
      checkOnlineUsers([targetUserId]);
    }

    // Auto-join if already connected
    if (socket.connected) {
      socket.emit("joinGroup", { groupId: groupId });
    }

    return () => {
      // Remove ALL handlers
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off(GroupWebSocketEvents.USER_JOINED, handleUserJoined);
      socket.off(GroupWebSocketEvents.USER_LEFT, handleUserLeft);
      socket.off(GroupWebSocketEvents.USER_TYPING, handleTyping);
      socket.off(GroupWebSocketEvents.GROUP_UPDATED, handleGroupUpdated);
      socket.off(GroupWebSocketEvents.MESSAGE_NEW, handleMessageNew);
      socket.off(GroupWebSocketEvents.MESSAGE_EDITED, handleMessageEdited);
      socket.off(GroupWebSocketEvents.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(GroupWebSocketEvents.MESSAGE_READ, handleMessageRead);
      socket.off(GroupWebSocketEvents.REACTION_ADDED, handleReactionAdded);
      socket.off(GroupWebSocketEvents.REACTION_REMOVED, handleReactionRemoved);
      socket.off(GroupWebSocketEvents.MESSAGE_PINNED, handleMessagePinned);
      socket.off(GroupWebSocketEvents.MESSAGE_UNPINNED, handleMessageUnpinned);
      socket.off("gift:sent", handleGiftSent);
      socket.off("gift_received", handleGiftReceived);

      // Leave the room and release the shared socket
      leaveGroupRoom(groupId);
      releaseNamespace("/groups");
      socketRef.current = null;

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [id, normalizeMessage]);

  // Typing Input Handler
  const handleInputChange = (text: string) => {
    setInputText(text);

    if (!socketRef.current || !id) return;

    if (text.trim().length > 0) {
      socketRef.current.emit("typing:start", { groupId: id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("typing:stop", { groupId: id });
      }, 2500);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current.emit("typing:stop", { groupId: id });
    }
  };

  // State for image attachments (multiple)
  const [selectedAttachments, setSelectedAttachments] =
    useState<ImagePicker.ImagePickerAsset[]>([]);
  // State for generic file attachment (documents, PDFs, etc.)
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // Handler to open image picker (multi-select)
  const handlePickAttachment = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showError(t("chat.permissionMediaRequired"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedFile(null);
      setSelectedAttachments((prev) => {
        const existingUris = new Set(prev.map((a) => a.uri));
        const newAssets = result.assets.filter((a) => !existingUris.has(a.uri));
        return [...prev, ...newAssets].slice(0, 10);
      });
    }
  };

  // Remove a single attachment from the selection
  const handleRemoveAttachment = (uri: string) => {
    setSelectedAttachments((prev) => prev.filter((a) => a.uri !== uri));
  };

  // Voice Note Recording
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isSendingVoiceNote, setIsSendingVoiceNote] = useState<boolean>(false);
  const [recordedVoiceNote, setRecordedVoiceNote] = useState<{
    uri: string;
  } | null>(null);

  const handleStartRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        showError(t("chat.permissionMicRequired"));
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      console.error("❌ [VOICE NOTE] Failed to start recording:", err);
      showError(`${t("chat.couldNotStartRecording")}: ${t("misc.tryAgain")}`);
    }
  };

  const handleCancelRecording = async () => {
    try {
      await audioRecorder.stop();
    } catch (err) {
      console.error("❌ [VOICE NOTE] Failed to cancel recording:", err);
    } finally {
      await setAudioModeAsync({ allowsRecording: false });
    }
  };

  // Stop recording and move into the listen/continue/send preview state
  const handleStopRecording = async () => {
    try {
      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const uri = audioRecorder.uri;
      if (!uri) return;

      setRecordedVoiceNote({ uri });
    } catch (err) {
      console.error("❌ [VOICE NOTE] Failed to stop recording:", err);
      showError(`${t("chat.couldNotStopRecording")}: ${t("misc.tryAgain")}`);
    }
  };

  // Discard the previewed voice note without sending it
  const handleDiscardVoiceNote = () => {
    setRecordedVoiceNote(null);
  };

  // Upload the previewed voice note as a message attachment
  const handleSendVoiceNote = async () => {
    if (!recordedVoiceNote || isSendingVoiceNote) return;

    setIsSendingVoiceNote(true);

    try {
      const createdMessageRaw = await GroupsApi.sendMessage(
        groupId as string,
        {
          content: "",
          durationMillis: recorderState.durationMillis,
        },
        [
          {
            uri: recordedVoiceNote.uri,
            name: `voice-note-${Date.now()}.m4a`,
            type: "audio/m4a",
          },
        ],
      );

      const createdMessage = normalizeMessage(createdMessageRaw);

      setMessages((prev) => {
        if (prev.some((m) => m.id === createdMessage.id)) return prev;
        const updated = [...prev, createdMessage];
        return updated.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });

      setRecordedVoiceNote(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error("❌ [VOICE NOTE] Failed to send:", err);
      showError(`${t("chat.couldNotSendVoiceNote")}: ${err?.response?.data?.message || t("misc.tryAgain")}`);
    } finally {
      setIsSendingVoiceNote(false);
    }
  };

  // Uploads an optimistic message's content/attachment to the server and
  // reconciles the temp bubble with the real one, or flips it to "failed"
  // so the user can tap to resend — this runs in the background and never
  // blocks the UI, which already shows the message immediately.
  const sendOptimisticMessage = async (message: ChatMessage) => {
    const filesToUpload: any[] = [];
    if (message.attachments && message.attachments.length > 0) {
      // Multiple attachments from the selection
      message.attachments.forEach((att: any) => {
        filesToUpload.push({
          uri: att.url,
          name: att.name || `file-${Date.now()}`,
          type: att.type || "application/octet-stream",
        });
      });
    } else if (message.mediaUrl) {
      filesToUpload.push({
        uri: message.mediaUrl,
        name:
          message.mediaName ||
          message.mediaUrl.split("/").pop() ||
          `file-${Date.now()}`,
        type: message.mediaType || "application/octet-stream",
      });
    }

    try {
      const createdMessageRaw = await GroupsApi.sendMessage(
        groupId as string,
        { content: message.content, replyToId: message.replyToId || undefined },
        filesToUpload,
      );
      const createdMessage = normalizeMessage(createdMessageRaw);

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== message.id);
        if (withoutTemp.some((m) => m.id === createdMessage.id)) {
          return withoutTemp;
        }
        const updated = [...withoutTemp, createdMessage];
        return updated.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
    } catch (err: any) {
      console.error("❌ [SEND ERROR] Failed to send message:", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, status: "failed" } : m,
        ),
      );
    }
  };

  // Tap-to-retry for a message that failed to send
  const handleResendMessage = (message: ChatMessage) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, status: "pending" } : m)),
    );
    sendOptimisticMessage({ ...message, status: "pending" });
  };

  // Send / Edit Message Submit Handler
  const handleSendMessage = async () => {
    // Check 1: Validation
    if (
      (!inputText.trim() && selectedAttachments.length === 0 && !selectedFile) ||
      (editingMessage && sending)
    ) {
      console.warn("⚠️ [SEND ABORTED] Reason:", {
        emptyContent: !inputText.trim() && selectedAttachments.length === 0 && !selectedFile,
        alreadySending: sending,
        missingGroup: !group,
        missingId: !id,
      });
      return;
    }

    // Socket Stop Typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit("typing:stop", { groupId: id });
    console.log("🛑 [SOCKET] Emitted typing:stop");

    const contentText = inputText.trim();
    const attachmentsToSend = selectedAttachments;
    const fileToSend = selectedFile;

    // Clear inputs locally before sending
    setInputText("");
    setSelectedAttachments([]);
    setSelectedFile(null);

    if (editingMessage) {
      setSending(true);
      try {
        const updatedMsgRaw = await GroupsApi.editMessage(
          groupId as string,
          editingMessage.id,
          contentText,
        );

        const updatedMsg = normalizeMessage(updatedMsgRaw);
        console.log("✨ [EDIT Normalized]:", updatedMsg);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id
              ? { ...m, content: updatedMsg.content, isEdited: true }
              : m,
          ),
        );

        setEditingMessage(null);
        showSuccess(t("chat.messageUpdated"));
      } catch (err: any) {
        console.error("❌ [EDIT ERROR] Failed to update message:", {
          status: err?.response?.status,
          data: err?.response?.data,
          message: err?.message,
        });
        showError(`${t("chat.actionFailed")}: ${err.response?.data?.message || t("misc.tryAgain")}`);
        setInputText(contentText);
      } finally {
        setSending(false);
      }
      return;
    }

    // New message — show it immediately with a pending clock icon, then
    // send in the background (see sendOptimisticMessage). This never
    // blocks the composer, so the user can keep sending right away.
    const hasMultipleImages = attachmentsToSend.length > 1;
    const hasFile = Boolean(fileToSend);

    if (hasMultipleImages || hasFile) {
      // Multiple images or a file — send as one message with all attachments
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimisticMessage: ChatMessage = {
        id: tempId,
        senderId: currentUserId,
        senderName: currentUser?.username || "You",
        senderAvatar: currentUser?.profilePictureUrl,
        senderBubbleColor: currentUser?.bubbleColor,
        senderBubbleStyle: currentUser?.bubbleStyle,
        content: contentText,
        mediaUrl: attachmentsToSend[0]?.uri || fileToSend?.uri,
        mediaName: fileToSend?.name || attachmentsToSend[0]?.fileName || undefined,
        mediaType: attachmentsToSend[0]?.mimeType || fileToSend?.mimeType,
        createdAt: new Date().toISOString(),
        replyToId: replyToMessage?.id || null,
        replyTo: replyToMessage || null,
        status: "pending",
        attachments: [
          ...attachmentsToSend.map((a) => ({
            url: a.uri,
            name: a.fileName || a.uri.split('/').pop() || 'image',
            type: a.mimeType || 'image/jpeg',
          })),
          ...(fileToSend
            ? [{ url: fileToSend.uri, name: fileToSend.name, type: fileToSend.mimeType || 'application/octet-stream' }]
            : []),
        ],
      };

      setMessages((prev) => {
        const updated = [...prev, optimisticMessage];
        return updated.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      setReplyToMessage(null);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      sendOptimisticMessage(optimisticMessage);
    } else {
      // Single image or text only
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const firstAttachment = attachmentsToSend[0];
      const optimisticMessage: ChatMessage = {
        id: tempId,
        senderId: currentUserId,
        senderName: currentUser?.username || "You",
        senderAvatar: currentUser?.profilePictureUrl,
        senderBubbleColor: currentUser?.bubbleColor,
        senderBubbleStyle: currentUser?.bubbleStyle,
        content: contentText,
        mediaUrl: firstAttachment?.uri || fileToSend?.uri,
        mediaName: fileToSend?.name || firstAttachment?.fileName || undefined,
        mediaType: firstAttachment?.mimeType || fileToSend?.mimeType,
        createdAt: new Date().toISOString(),
        replyToId: replyToMessage?.id || null,
        replyTo: replyToMessage || null,
        status: "pending",
        attachments: firstAttachment || fileToSend ? [
          {
            url: firstAttachment?.uri || fileToSend!.uri,
            name: fileToSend?.name || firstAttachment?.fileName || 'image',
            type: firstAttachment?.mimeType || fileToSend?.mimeType || 'image/jpeg',
          },
        ] : undefined,
      };

      setMessages((prev) => {
        const updated = [...prev, optimisticMessage];
        return updated.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      setReplyToMessage(null);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      sendOptimisticMessage(optimisticMessage);
    }
  };

  // Delete Message Handler
  const handleDeleteMessage = async (message: ChatMessage) => {
    setSelectedMessage(null);
    try {
      await GroupsApi.deleteMessage(groupId!, message.id);
      const deletedId = String(message.id);
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== deletedId)
          .map((m) =>
            m.replyToId === deletedId
              ? { ...m, replyToId: null, replyTo: null }
              : m,
          ),
      );
      showSuccess(t("chat.messageDeleted"));
    } catch (err: any) {
      showError(`${t("chat.couldNotDeleteMessage")}: ${err?.response?.data?.message || t("misc.tryAgain")}`);
    }
  };

  // Toggle Reaction Handler
  const handleToggleReaction = async (message: ChatMessage, emoji: string) => {
    setSelectedMessage(null);

    // Normalize IDs for precise string matching
    const targetId = String(message.id);
    const currentSummary = Array.isArray(message.reactionSummary)
      ? message.reactionSummary
      : [];

    const targetReaction = currentSummary.find((r) => r.emoji === emoji);
    const hasReacted = targetReaction ? targetReaction.reactedByMe : false;

    setMessages((prev) =>
      prev.map((m) => {
        if (String(m.id) !== targetId) return m;

        let newSummary = [...(m.reactionSummary || [])];
        const existingIdx = newSummary.findIndex((r) => r.emoji === emoji);

        if (hasReacted) {
          if (existingIdx !== -1) {
            const item = newSummary[existingIdx];
            if (item.count <= 1) {
              newSummary.splice(existingIdx, 1);
            } else {
              newSummary[existingIdx] = {
                ...item,
                count: item.count - 1,
                reactedByMe: false,
              };
            }
          }
        } else {
          if (existingIdx !== -1) {
            const item = newSummary[existingIdx];
            newSummary[existingIdx] = {
              ...item,
              count: item.count + 1,
              reactedByMe: true,
            };
          } else {
            newSummary.push({
              emoji,
              count: 1,
              reactedByMe: true,
            });
          }
        }

        return { ...m, reactionSummary: newSummary };
      }),
    );

    try {
      if (hasReacted) {
        await GroupsApi.removeReaction(groupId!, message.id);
      } else {
        await GroupsApi.addReaction(groupId!, message.id, emoji);
      }
    } catch (err: any) {
      console.error("❌ Reaction error:", err?.response?.data || err.message);
      // fetchMessages();
    }
  };

  // Toggle Mute Action
  const handleToggleMute = async () => {
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);
    showSuccess(nextMuteState ? "Notifications Muted" : "Notifications Unmuted");
    try {
      if ((GroupsApi as any).toggleMute) {
        await (GroupsApi as any).toggleMute(id, nextMuteState);
      }
    } catch (err) {
      console.log("Mute status sync warning:", err);
    }
  };

  // Open Bubble Customizer, seeded with the user's current selection
  const openBubbleCustomizer = () => {
    setDraftBubbleColor(currentUser?.bubbleColor || BUBBLE_COLOR_OPTIONS[0]);
    setDraftBubbleStyle(
      currentUser?.bubbleStyle || BUBBLE_STYLE_OPTIONS[0].key,
    );
    setShowBubbleCustomizer(true);
  };

  // Save Chat Bubble Color & Style
  const handleSaveBubbleStyle = async () => {
    setSavingBubbleStyle(true);
    try {
      const formData = new FormData();
      formData.append("bubbleColor", draftBubbleColor);
      formData.append("bubbleStyle", draftBubbleStyle);

      const res = await userService.updateProfile(formData);
      const updatedUserData = res?.user || res?.data?.user || res?.data || res;

      updateAuthUser({
        bubbleColor: draftBubbleColor,
        bubbleStyle: draftBubbleStyle,
        ...(updatedUserData && typeof updatedUserData === "object"
          ? updatedUserData
          : {}),
      });

      showSuccess(t("chat.chatBubbleUpdated"));
      setShowBubbleCustomizer(false);
    } catch (err: any) {
      // Still reflect the choice locally even if the backend hasn't
      // persisted it yet, so the user's own bubbles update immediately.
      updateAuthUser({
        bubbleColor: draftBubbleColor,
        bubbleStyle: draftBubbleStyle,
      });
      showError(err?.response?.data?.message || "Saved locally, but other members may not see it yet.");
      setShowBubbleCustomizer(false);
    } finally {
      setSavingBubbleStyle(false);
    }
  };

  // Leave Group Action
  const handleLeaveGroup = () => {
    Alert.alert(
      "Delete",
      "Are you sure you want to delete this chat? all your messages will disappear.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await GroupsApi.leaveGroup(groupId!);
              showInfo("Chat Deleted");
              router.back();
            } catch (err: any) {
              showError(err?.response?.data?.message || "Could not delete chat.");
            }
          },
        },
      ],
    );
  };

  // Block status with the other person in this 1:1 chat
  const peerUserId: string | undefined = parsedUser?.id;
  useEffect(() => {
    if (!peerUserId) return;
    let cancelled = false;
    Promise.all([
      userService.checkIsBlocker(peerUserId),
      userService.checkIsBlocked(peerUserId),
    ])
      .then(([blocker, either]) => {
        if (cancelled) return;
        setBlockedByMe(Boolean(blocker?.isBlocker));
        setBlockedEitherWay(Boolean(either?.isBlocked));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [peerUserId]);

  const handleToggleBlock = () => {
    if (!peerUserId) return;
    const name = parsedUser?.username ? `@${parsedUser.username}` : "this user";
    if (blockedByMe) {
      Alert.alert("Unblock", `Unblock ${name}? They will be able to message you again.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              await userService.unblockUser(peerUserId);
              setBlockedByMe(false);
              const either = await userService.checkIsBlocked(peerUserId).catch(() => null);
              setBlockedEitherWay(Boolean(either?.isBlocked));
              showSuccess(`${name} unblocked`);
            } catch (err: any) {
              showError(err?.response?.data?.message || "Could not unblock user.");
            }
          },
        },
      ]);
      return;
    }
    Alert.alert(
      "Block",
      `Block ${name}? They won't be able to message you, and you won't be able to message them.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await userService.blockUser(peerUserId);
              setBlockedByMe(true);
              setBlockedEitherWay(true);
              showSuccess(`${name} blocked`);
            } catch (err: any) {
              showError(err?.response?.data?.message || "Could not block user.");
            }
          },
        },
      ],
    );
  };

  const handleReportReason = async (reason: string) => {
    const target = reportTarget;
    setReportTarget(null);
    if (!target) return;
    try {
      if (target.kind === "message") {
        await GroupsApi.reportMessage(groupId!, target.message.id, reason);
      } else if (peerUserId) {
        await userService.reportUser(peerUserId, `Reported from chat: ${reason}`);
      }
      showSuccess("Thanks. Our team will review this report.");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Could not send report. Please try again.");
    }
  };

  const reportSheet = (
    <ReportReasonSheet
      visible={reportTarget !== null}
      subject={reportTarget?.kind === "user" ? "user" : "message"}
      onSelect={handleReportReason}
      onClose={() => setReportTarget(null)}
    />
  );

  // Start Reply Flow
  const handleStartReply = (message: ChatMessage) => {
    setSelectedMessage(null);
    setReplyToMessage(message);
  };

  // Scroll to a replied-to message and highlight it until the user scrolls
  const handleJumpToMessage = (targetMessageId: string) => {
    const targetIndex = messages.findIndex((m) => m.id === targetMessageId);
    if (targetIndex === -1) {
      showInfo(t("chat.messageNotInView"));
      return;
    }

    setHighlightedMessageId(targetMessageId);
    isJumpingRef.current = true;

    flatListRef.current?.scrollToIndex({
      index: targetIndex,
      viewPosition: 0.4,
      animated: true,
    });
  };

  // The user scrolling by hand is what ends the jump: clear the highlight
  // and let onContentSizeChange resume snapping to the bottom as usual.
  const handleUserScroll = () => {
    if (!isJumpingRef.current) return;
    isJumpingRef.current = false;
    setHighlightedMessageId(null);
  };

  // Start Editing Flow
  const startEditing = (message: ChatMessage) => {
    setSelectedMessage(null);
    setReplyToMessage(null);
    setEditingMessage(message);
    setInputText(message.content);
  };

  // Cancel Editing Flow
  const cancelEditing = () => {
    setEditingMessage(null);
    setInputText("");
  };

  // Format typing notice text
  const typingText = useMemo(() => {
    const ids = Array.from(typingUserIds);
    if (ids.length === 0) return null;

    const names = ids.map((userId) => {
      const foundName = memberNameMapRef.current.get(userId.toLowerCase());
      return foundName || "Someone";
    });

    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names[0]} and ${names.length - 1} others are typing...`;
  }, [typingUserIds]);

  const getDateLabel = (dateInput: string | Date): string => {
    const date = new Date(dateInput);
    const now = new Date();

    // Reset times to compare dates only
    const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffDays = Math.round(
      (dNow.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";

    // Format as "MMM D, YYYY" (e.g., "Oct 24, 2025")
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };




  const isOnline = onlineUserIds.has((parsedUser?.id|| "").toLowerCase());
  // Render Single Message Bubble Item — delegates to the extracted MessageBubble component
  const renderMessageItem = ({ item, index }: { item: ChatMessage; index: number }) => (
    <MessageBubble
      item={item}
      index={index}
      messages={messages}
      currentUserId={currentUserId}
      currentUser={currentUser}
      isDark={isDark}
      colors={colors}
      showSenderName={false}
      showAvatars={false}
      highlightStyle="blue"
      highlightedMessageId={highlightedMessageId}
      editingMessage={editingMessage}
      onLongPress={setSelectedMessage}
      renderMedia={(mediaSource, bubbleTextColor, bubbleIsGrayDefault, isLightBubbleText) => {
        const isAudio =
          Boolean(mediaSource) &&
          (item.mediaType?.startsWith("audio/") || isAudioUrl(mediaSource));
        if (isAudio) {
          return (
            <VoiceMessageBubble
              uri={mediaSource}
              tintColor={bubbleTextColor}
              buttonColor={bubbleIsGrayDefault ? "#3b82f6" : "rgba(255,255,255,0.2)"}
              trackColor={bubbleIsGrayDefault ? "#d1d5db" : "rgba(255,255,255,0.35)"}
              mutedTextColor={isLightBubbleText ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)"}
            />
          );
        }
        return null;
      }}
      onPressMedia={handlePressMedia}
      onJumpToMessage={handleJumpToMessage}
      onToggleReaction={handleToggleReaction}
      onResend={handleResendMessage}
    />
  );



  // ================= DEDICATED GROUP DETAILS SCREEN =================
  if (viewingDetails) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#09090B" />

        <ThemedView
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
            height: 56, // Fixed height for clean vertical alignment
          }}
          className="flex-row items-center justify-between px-4 relative"
        >
          {/* Back Button (Stays on the Left, on top of title) */}
          <TouchableOpacity
            onPress={() => setViewingDetails(false)}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card || "transparent",
              width: 35,
              height: 35,
              zIndex: 10,
            }}
            className="rounded-full justify-center items-center"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Centered Title */}
          <View className="absolute left-0 right-0 items-center justify-center pointer-events-none">
            <ThemedText className="text-3xl font-bold text-center">
              Chat Info
            </ThemedText>
          </View>
        </ThemedView>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Group Avatar */}
          <View className="items-center justify-center my-4">
            {/* Group Avatar */}
            <View style={{ position: "relative" }}>
              <ProfileFrame
                frameId={parsedUser?.profileFrame}
                uri={parsedUser?.profilePictureUrl}
                size={140}
                initial={parsedUser?.username?.[0]?.toUpperCase()}
                fallbackColor={colors.primary}
              />
              <View style={{ position: "absolute", bottom: 4, right: 4 }}>
                <OnlineIndicator
                  online={isOnline ?? false}
                  borderColor={colors.background}
                  size={16} 
                />
              </View>
            </View>

            {/* Group Overview Text */}
            <ThemedView
              className="items-center justify-center mt-3"
              style={{ backgroundColor: "transparent" }}
            >
              <ThemedText className="font-semibold text-xl text-center">
                {parsedUser?.username}
              </ThemedText>
            </ThemedView>
          </View>

          {/* Customize My Chat Bubble */}
          <TouchableOpacity
            className="mt-8"
            style={styles.actionRow}
            onPress={openBubbleCustomizer}
            activeOpacity={0.7}
          >
            <ThemedView style={styles.actionLeft}>
              <ThemedView
                style={[
                  styles.actionIconBadge,
                  { backgroundColor: "rgba(236, 72, 153, 0.1)" },
                ]}
              >
                <Palette size={18} color="#ec4899" />
              </ThemedView>
              <ThemedText style={styles.actionRowText}>
                Customize My Chat Bubble
              </ThemedText>
            </ThemedView>
            <ChevronRight size={18} color="#71717a" />
          </TouchableOpacity>
          {/* Chat Background */}
          <TouchableOpacity
            className="mt-3"
            style={styles.actionRow}
            onPress={() => setShowBackgroundPicker(true)}
            activeOpacity={0.7}
          >
            <ThemedView style={styles.actionLeft}>
              <ThemedView
                style={[
                  styles.actionIconBadge,
                  { backgroundColor: "rgba(16, 185, 129, 0.1)" },
                ]}
              >
                <ImageIcon size={18} color="#10b981" />
              </ThemedView>
              <ThemedText style={styles.actionRowText}>
                Chat Background
              </ThemedText>
            </ThemedView>
            <ChevronRight size={18} color="#71717a" />
          </TouchableOpacity>
      
          {/* Safety: block / report the other person */}
          {peerUserId && (
            <>
              <TouchableOpacity
                className="mt-3"
                style={styles.actionRow}
                onPress={handleToggleBlock}
                activeOpacity={0.7}
              >
                <ThemedView style={styles.actionLeft}>
                  <ThemedView
                    style={[styles.actionIconBadge, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}
                  >
                    <Ionicons name={blockedByMe ? "lock-open-outline" : "ban-outline"} size={18} color="#ef4444" />
                  </ThemedView>
                  <ThemedText style={[styles.actionRowText, { color: "#ef4444" }]}>
                    {blockedByMe ? "Unblock User" : "Block User"}
                  </ThemedText>
                </ThemedView>
                <ChevronRight size={18} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                className="mt-3"
                style={styles.actionRow}
                onPress={() => setReportTarget({ kind: "user" })}
                activeOpacity={0.7}
              >
                <ThemedView style={styles.actionLeft}>
                  <ThemedView
                    style={[styles.actionIconBadge, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}
                  >
                    <Ionicons name="flag-outline" size={18} color="#ef4444" />
                  </ThemedView>
                  <ThemedText style={[styles.actionRowText, { color: "#ef4444" }]}>
                    Report User
                  </ThemedText>
                </ThemedView>
                <ChevronRight size={18} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}

          {/* Action Grid Options - Hidden if group.isSystemManaged is true */}
          {!group?.isSystemManaged && (
            <ThemedView style={styles.actionList}>
              {/* Mute / Unmute */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleToggleMute}
                activeOpacity={0.7}
              >
                <ThemedView style={styles.actionLeft}>
                  <ThemedView
                    style={[
                      styles.actionIconBadge,
                      {
                        backgroundColor: isMuted
                          ? "rgba(129, 140, 248, 0.1)"
                          : "rgba(59, 130, 246, 0.1)",
                      },
                    ]}
                  >
                    {isMuted ? (
                      <VolumeX size={18} color="#818cf8" />
                    ) : (
                      <Volume2 size={18} color="#3b82f6" />
                    )}
                  </ThemedView>
                  <ThemedText style={styles.actionRowText}>
                    {isMuted ? "Unmute Notifications" : "Mute Notifications"}
                  </ThemedText>
                </ThemedView>
                <ChevronRight size={18} color="#71717a" />
              </TouchableOpacity>

              {/* Leave Group (Destructive Action) */}
              <TouchableOpacity
                style={[styles.actionRow, styles.lastActionRow]}
                onPress={handleLeaveGroup}
                activeOpacity={0.7}
              >
                <ThemedView style={styles.actionLeft}>
                  <ThemedView
                    style={[
                      styles.actionIconBadge,
                      { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                    ]}
                  >
                    <LogOut size={18} color="#ef4444" />
                  </ThemedView>
                  <ThemedText
                    style={[styles.actionRowText, { color: "#ef4444" }]}
                  >
                    Delete Chat
                  </ThemedText>
                </ThemedView>
                <ChevronRight size={18} color="#ef4444" />
              </TouchableOpacity>
            </ThemedView>
          )}

          {/* Shared Media Gallery Section */}
          <SharedMediaSection
            mediaList={sharedMediaList}
            onPreview={handlePressMedia}
            colors={colors}
            styles={styles}
          />
        </ScrollView>

        {/* Modal: Full-Screen Media Lightbox Viewer */}
        <MediaLightboxModal
          visible={Boolean(previewMediaUrl)}
          images={allChatImages}
          initialIndex={previewImageIndex}
          onClose={() => setPreviewMediaUrl(null)}
        />

        {/* Modal: Customize My Chat Bubble */}
        <BubbleCustomizerModal
          visible={showBubbleCustomizer}
          onClose={() => setShowBubbleCustomizer(false)}
          onSave={handleSaveBubbleStyle}
          draftColor={draftBubbleColor}
          draftStyle={draftBubbleStyle}
          setColor={setDraftBubbleColor}
          setStyle={setDraftBubbleStyle}
          saving={savingBubbleStyle}
          colors={colors}
        />

        {/* Modal: Chat Background */}
        <ChatBackgroundPickerModal
          visible={showBackgroundPicker}
          onClose={() => setShowBackgroundPicker(false)}
        />

        {reportSheet}
      </SafeAreaView>
    );
  }

  // ================= MAIN CHAT SCREEN =================
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      // edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

        {/* Header */}

        <ThemedView
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}
          className="flex-row items-center px-4 py-3"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card || "transparent",
              width: 35,
              height: 35,
            }}
            className="rounded-full justify-center items-center"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(features)/userProfile/[id]",
                params: {
                  id: parsedUser?.id,
                  user: JSON.stringify(parsedUser),
                },
              })
            }
          >
            <View style={{ marginLeft: 20 }}>
              <ProfileFrame
                frameId={parsedUser?.profileFrame}
                uri={parsedUser?.profilePictureUrl}
                size={32}
                initial={parsedUser?.username?.[0]?.toUpperCase()}
                fallbackColor={colors.primary}
              />
              
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <ThemedText className="font-bold text-base" numberOfLines={1}>
              {parsedUser?.username || "Chat"}
            </ThemedText>
            <View className="flex-row items-center mt-0.5">
              <LevelBadge level={parsedUser?.appLevel} />
              <ThemedText
                style={{
                  color:
                    socketStatus === "reconnecting"
                      ? "#F59E0B"
                      : isOnline
                        ? "#22C55E"
                        : colors.muted || colors.secondary,
                  fontSize: 12,
                  marginLeft: parsedUser?.appLevel?.badge ? 6 : 0,
                }}
              >
                {socketStatus === "reconnecting"
                  ? "Reconnecting..."
                  : socketStatus === "disconnected"
                    ? "Offline"
                    : isOnline
                      ? "Online"
                      : "Offline"}
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setViewingDetails(true)}
            style={{
              width: 35,
              height: 35,
            }}
            className="p-2 rounded-full justify-center items-center"
          >
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </TouchableOpacity>
        </ThemedView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      

        {/* Messages Stream */}
        <View style={{ flex: 1, position: "relative" }}>
          <ChatBackground
            preset={chatBackgroundPreset}
            isDark={isDark}
            imageUri={backgroundImageUri}
            style={StyleSheet.absoluteFill}
          />
          <ThemedView
            className="flex-1 px-4 py-2"
            style={{ backgroundColor: "transparent" }}
          >
            {/* Pinned Message Banner */}
            {pinnedMessage && (
              <TouchableOpacity
                onPress={() => handleJumpToMessage(pinnedMessage.id)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isDark
                    ? "rgba(245, 158, 11, 0.1)"
                    : "rgba(245, 158, 11, 0.08)",
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(245, 158, 11, 0.25)"
                    : "rgba(245, 158, 11, 0.2)",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginBottom: 8,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{ marginRight: 8 }}>
                  <Ionicons name="link" size={16} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText
                    numberOfLines={1}
                    style={{ color: "#f59e0b", fontSize: 11, fontWeight: "700" }}
                  >
                    Pinned
                  </ThemedText>
                  <ThemedText
                    numberOfLines={1}
                    style={{ color: colors.muted || "#a1a1aa", fontSize: 12, marginTop: 1 }}
                  >
                    {pinnedMessage.content || "Attachment"}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleUnpinMessage();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color={colors.muted || "#a1a1aa"} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              contentContainerStyle={{ paddingVertical: 10 }}
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={handleUserScroll}
              onContentSizeChange={() => {
                // Don't yank the view back to the bottom while jumping to
                // a replied-to message (highlight changes bubble layout).
                if (isJumpingRef.current) return;
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
              onScrollToIndexFailed={({ index }) => {
                // Target not rendered yet (virtualization) — estimate its
                // offset, scroll there, then retry the exact index.
                setTimeout(() => {
                  flatListRef.current?.scrollToOffset({
                    offset: index * 80,
                    animated: true,
                  });
                  setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                      index,
                      viewPosition: 0.4,
                      animated: true,
                    });
                  }, 120);
                }, 60);
              }}
              ListEmptyComponent={
                loading && id ? (
                  showMessagesSkeleton ? <ChatMessagesSkeleton /> : null
                ) : (
                  <ThemedView
                    className="flex-1 justify-center items-center my-20"
                    style={{ backgroundColor: "transparent" }}
                  >
                    <ThemedText
                      style={{ color: colors.muted || "#a1a1aa" }}
                      className="text-sm"
                    >
                      No messages in this chat yet.
                    </ThemedText>
                  </ThemedView>
                )
              }
            />
          </ThemedView>
        </View>

        {/* Typing Indicator Bar */}
        {typingText && (
          <ThemedView className="px-5 py-1.5 flex-row items-center">
            <ThemedText
              style={{ color: colors.muted || "#a1a1aa" }}
              className="text-xs italic mr-2"
            >
              {"typing...."}
            </ThemedText>
            <ActivityIndicator size="small" color={colors.muted || "#a1a1aa"} />
          </ThemedView>
        )}

        {/* Editing Banner */}
        {editingMessage && (
          <ThemedView
            style={{
              backgroundColor: colors.card,
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
            className="px-4 py-2 flex-row justify-between items-center"
          >
            <ThemedView className="flex-1 mr-2">
              <ThemedText className="text-xs font-bold text-blue-500">
                Editing Message
              </ThemedText>
              <ThemedText
                numberOfLines={1}
                style={{ color: colors.muted }}
                className="text-xs"
              >
                {editingMessage.content}
              </ThemedText>
            </ThemedView>
            <TouchableOpacity onPress={cancelEditing} className="p-1">
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.muted || "#a1a1aa"}
              />
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Input Dock */}

        <ThemedView
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
          className="p-3"
        >
          {blockedEitherWay ? (
            <ThemedView
              style={{
                backgroundColor: colors.card || "transparent",
                borderWidth: 1,
                borderColor: colors.border,
              }}
              className="p-3.5 rounded-xl justify-center items-center"
            >
              <ThemedText className="text-xs font-medium text-center">
                {blockedByMe
                  ? "You blocked this user. Unblock them in Chat Info to send messages."
                  : "You can't reply to this conversation."}
              </ThemedText>
            </ThemedView>
          ) : group?.isLocked ? (
            <ThemedView
              style={{
                backgroundColor: colors.card || "transparent",
                borderWidth: 1,
                borderColor: colors.border,
              }}
              className="p-3.5 rounded-xl justify-center items-center"
            >
              <ThemedText className="text-xs font-medium text-center">
                Group locked. Nobody can post messages to this group.
              </ThemedText>
            </ThemedView>
          ) : (
            <View>
              {/* Selected Images Preview Strip */}
              {selectedAttachments.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-2.5"
                  contentContainerStyle={{ gap: 8 }}
                >
                  {selectedAttachments.map((asset) => (
                    <View key={asset.uri} className="relative">
                      <Image
                        source={{ uri: asset.uri }}
                        className="w-16 h-16 rounded-xl"
                        style={{ borderWidth: 1, borderColor: colors.border }}
                      />
                      <TouchableOpacity
                        onPress={() => handleRemoveAttachment(asset.uri)}
                        className="absolute -top-1.5 -right-1.5 bg-zinc-800 rounded-full p-0.5"
                        style={{ borderWidth: 1, borderColor: "#ffffff" }}
                      >
                        <Ionicons name="close" size={14} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Selected File Preview Strip */}
              {selectedFile && (
                <View
                  className="mb-2.5 flex-row items-center relative self-start px-3 py-2 rounded-xl"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    maxWidth: 220,
                  }}
                >
                  <FileText size={18} color={colors.muted || "#71717a"} />
                  <ThemedText
                    numberOfLines={1}
                    style={{ color: colors.text, marginLeft: 8, flexShrink: 1 }}
                    className="text-xs font-medium"
                  >
                    {selectedFile.name}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setSelectedFile(null)}
                    className="ml-2 bg-zinc-800 rounded-full p-0.5"
                    style={{ borderWidth: 1, borderColor: "#ffffff" }}
                  >
                    <Ionicons name="close" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Reply Quote Bar */}
              {replyToMessage && !editingMessage && (
                <View
                  className="mb-2 flex-row items-center rounded-xl px-3 py-2"
                  style={{
                    backgroundColor: colors.card || "transparent",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-1 mr-2">
                    <ThemedText
                      style={{ color: "#3b82f6" }}
                      className="text-[11px] font-semibold"
                    >
                      Replying to{" "}
                      {replyToMessage.senderName || "Message"}
                    </ThemedText>
                    <ThemedText
                      numberOfLines={1}
                      style={{ color: colors.muted || "#71717a" }}
                      className="text-xs"
                    >
                      {getReplyPreview(replyToMessage).label}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={() => setReplyToMessage(null)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.muted || "#71717a"}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Input Row */}
              {recorderState.isRecording ? (
                /* Voice Note Recording Bar */
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={handleCancelRecording}
                    className="w-10 h-10 rounded-full justify-center items-center mr-2"
                    style={{
                      backgroundColor: colors.card || "transparent",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>

                  <View
                    style={{
                      backgroundColor: colors.card || "transparent",
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                    className="flex-1 flex-row items-center px-4 py-2.5 mr-2 rounded-2xl"
                  >
                    <View
                      style={{ backgroundColor: "#ef4444" }}
                      className="w-2.5 h-2.5 rounded-full mr-2"
                    />
                    <ThemedText
                      style={{ color: colors.text }}
                      className="text-sm font-medium"
                    >
                      Recording...{" "}
                      {formatDuration(recorderState.durationMillis / 1000)}
                    </ThemedText>
                  </View>

                  <TouchableOpacity
                    className="w-10 h-10 rounded-full justify-center items-center"
                    style={{ backgroundColor: "#3b82f6" }}
                    onPress={handleStopRecording}
                  >
                    <Ionicons name="stop" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ) : recordedVoiceNote ? (
                /* Voice Note Preview Bar — Delete, Listen, Send */
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={handleDiscardVoiceNote}
                    className="w-10 h-10 rounded-full justify-center items-center mr-2"
                    style={{
                      backgroundColor: colors.card || "transparent",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    disabled={isSendingVoiceNote}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>

                  <View
                    style={{
                      backgroundColor: colors.card || "transparent",
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                    className="flex-1 flex-row items-center px-4 py-2 mr-2 rounded-2xl"
                  >
                    <VoiceMessageBubble
                      uri={recordedVoiceNote.uri}
                      tintColor="#3b82f6"
                      buttonColor={colors.background}
                      trackColor={colors.border}
                      mutedTextColor={colors.muted || "#71717a"}
                    />
                  </View>

                  <TouchableOpacity
                    className="w-10 h-10 rounded-full justify-center items-center"
                    style={{ backgroundColor: "#3b82f6" }}
                    onPress={handleSendVoiceNote}
                    disabled={isSendingVoiceNote}
                  >
                    {isSendingVoiceNote ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="arrow-up" size={20} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row items-end">

                  {/* Attachment / Image Picker Button */}
                  <TouchableOpacity
                    onPress={handlePickAttachment}
                    className="w-10 h-10 rounded-full justify-center items-center mr-2 mb-0.5"
                    style={{
                      backgroundColor: colors.card || "transparent",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    disabled={sending}
                  >
                    <Ionicons
                      name="image-outline"
                      size={20}
                      color={colors.muted || "#71717a"}
                    />
                  </TouchableOpacity>

                  {/* Gift Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setGiftCoins(currentUser?.coins ?? 0);
                      setShowGifts(true);
                    }}
                    className="w-10 h-10 rounded-full justify-center items-center mr-2 mb-0.5"
                    style={{
                      backgroundColor: colors.card || "transparent",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    disabled={sending}
                  >
                    <ThemedText style={{ fontSize: 18 }}>🎁</ThemedText>
                  </TouchableOpacity>

                  {/* Text Input */}
                  <TextInput
                    style={{
                      color: colors.text,
                      backgroundColor: colors.card || "transparent",
                      borderColor: colors.border,
                      borderWidth: 1,
                      maxHeight: 120,
                      paddingTop: Platform.OS === "ios" ? 8 : 6,
                      paddingBottom: Platform.OS === "ios" ? 8 : 6,
                    }}
                    className="flex-1 px-4 text-sm mr-2 rounded-2xl"
                    placeholder={
                      editingMessage
                        ? "Update message..."
                        : "Type a message..."
                    }
                    placeholderTextColor={colors.muted || "#71717a"}
                    value={inputText}
                    onChangeText={handleInputChange}
                    multiline
                    scrollEnabled
                    textAlignVertical="center"
                  />

                  {/* Send / Mic Button */}
                  {inputText.trim() || selectedAttachments.length > 0 || selectedFile ? (
                    <TouchableOpacity
                      className="w-10 h-10 rounded-full justify-center items-center mb-0.5"
                      style={{ backgroundColor: "#3b82f6" }}
                      disabled={sending}
                      onPress={handleSendMessage}
                    >
                      {sending ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Ionicons
                          name={editingMessage ? "checkmark" : "arrow-up"}
                          size={20}
                          color="#ffffff"
                        />
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      className="w-10 h-10 rounded-full justify-center items-center mb-0.5"
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                      disabled={sending || Boolean(editingMessage)}
                      onPress={handleStartRecording}
                    >
                      <Ionicons
                        name="mic-outline"
                        size={20}
                        color={colors.muted || "#71717a"}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </ThemedView>
      </KeyboardAvoidingView>

      {/* Quick Action Sheet Modal (Message Long-press) */}
      <Modal
        visible={Boolean(selectedMessage)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMessage(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setSelectedMessage(null)}
        >
          <ThemedView
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
            className="p-5"
          >
            {/* Quick Emoji Bar */}
            <View
              className="flex-row justify-around mb-5 pb-4"
              style={{ borderBottomWidth: 1.2, borderColor: colors.border }}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() =>
                    selectedMessage &&
                    handleToggleReaction(selectedMessage, emoji)
                  }
                  className="p-2 bg-zinc-800/20 rounded-full"
                >
                  <ThemedText className="text-xl">{emoji}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reply — available for every message (voice notes included) */}
            <TouchableOpacity
              onPress={() =>
                selectedMessage && handleStartReply(selectedMessage)
              }
              className="flex-row items-center py-3"
            >
              <Ionicons name="arrow-undo-outline" size={20} color={colors.text} />
              <ThemedText className="ml-3 font-semibold">Reply</ThemedText>
            </TouchableOpacity>

            {/* Pin / Unpin Message */}
            {!selectedMessage?.isSystem && !selectedMessage?.isGiftMessage && (
              <>
                {pinnedMessage?.id === selectedMessage?.id ? (
                  <TouchableOpacity
                    onPress={() => selectedMessage && handleUnpinMessage()}
                    className="flex-row items-center py-3"
                  >
                    <Ionicons name="link" size={20} color="#f59e0b" />
                    <ThemedText className="ml-3 font-semibold text-amber-500">
                      Unpin Message
                    </ThemedText>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => selectedMessage && handlePinMessage(selectedMessage)}
                    className="flex-row items-center py-3"
                  >
                    <Ionicons name="link" size={20} color={colors.text} />
                    <ThemedText className="ml-3 font-semibold">
                      Pin Message
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Report — someone else's message */}
            {selectedMessage &&
              !selectedMessage.isSystem &&
              selectedMessage.senderId?.toLowerCase() !== currentUserId && (
                <TouchableOpacity
                  onPress={() => {
                    const message = selectedMessage;
                    setSelectedMessage(null);
                    setReportTarget({ kind: "message", message });
                  }}
                  className="flex-row items-center py-3"
                >
                  <Ionicons name="flag-outline" size={20} color="#ef4444" />
                  <ThemedText className="ml-3 font-semibold text-red-500">
                    Report Message
                  </ThemedText>
                </TouchableOpacity>
              )}

            {/* Edit / Delete Options — no Edit for voice notes */}
            {selectedMessage?.senderId?.toLowerCase() === currentUserId && (
              <>
                {!(
                  selectedMessage.mediaType?.startsWith("audio/") ||
                  isAudioUrl(selectedMessage.mediaUrl)
                ) && (
                  <TouchableOpacity
                    onPress={() =>
                      selectedMessage && startEditing(selectedMessage)
                    }
                    className="flex-row items-center py-3"
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={20}
                      color={colors.text}
                    />
                    <ThemedText className="ml-3 font-semibold">
                      Edit Message
                    </ThemedText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() =>
                    selectedMessage && handleDeleteMessage(selectedMessage)
                  }
                  className="flex-row items-center py-3"
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <ThemedText className="ml-3 font-semibold text-red-500">
                    Delete Message
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
          </ThemedView>
        </Pressable>
      </Modal>

      {/* Full-Screen Lightbox Image Preview Modal */}
      <MediaLightboxModal
        visible={Boolean(previewMediaUrl)}
        images={allChatImages}
        initialIndex={previewImageIndex}
        onClose={() => setPreviewMediaUrl(null)}
      />

      {/* Gift Modal */}
      <GiftModal
        visible={showGifts}
        onClose={() => setShowGifts(false)}
        coinBalance={giftCoins}
        onSend={handleGiftSent}
      />

      {/* Floating Combo Button */}
      {activeComboGift && (
        <FloatingComboButton
          gift={activeComboGift}
          coinBalance={giftCoins}
          onSend={() => handleGiftSent(activeComboGift)}
          onTimeout={handleComboTimeout}
          onLocked={() => setShowGifts(true)}
        />
      )}

      {/* Gift Send Overlay (flying gift animation) */}
      <GiftSendOverlay ref={giftOverlayRef} />

      {reportSheet}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionList: {
    width: "100%",
    borderRadius: 16,
    // borderWidth: 1,
    // borderColor: colors.border,
    // backgroundColor: colors.background,
    overflow: "hidden",
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  lastActionRow: {
    borderBottomWidth: 0,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "transparent",
  },
  actionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRowText: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    // backgroundColor: "#18181B",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#3F3F46",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.8,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#27272A",
    marginBottom: 10,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
  },
  destructiveOption: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  destructiveText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#EF4444",
  },
  cancelOption: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.6,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  scrollView: {
    flex: 1,
    paddingTop: "5%",
  },
  cover: {
    width: "100%",
    height: 180,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
    // marginTop: -40,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: "#09090B",
  },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#A1A1AA",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginLeft: 4,
  },
  onlineText: {
    fontSize: 13,
    color: "#22C55E",
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    color: "#D4D4D8",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  actionGridCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  actionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  actionCardText: {
    fontSize: 11,
    fontWeight: "600",
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchBarContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFFFFF",
    fontSize: 14,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberOnlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#09090B",
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    // color: '#FFFFFF',
  },
  memberRole: {
    fontSize: 12,
    color: "#71717A",
    marginTop: 2,
  },
});
