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
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { showError, showSuccess, showInfo } from "@/components/ui/toast";
import { Ionicons } from "@expo/vector-icons";
import { Socket } from "socket.io-client";
import { acquireNamespace, releaseNamespace, leaveGroupRoom } from "@/service/socketManager";
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
  Search,
  Unlock,
  Lock,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { Group, GroupMember, GroupsApi } from "@/service/groupChat.service";
import ChatBackgroundPickerModal from "@/components/chat/chatBackgroundPickerModal";
import { ChatBackground } from "@/components/chat/chatBackground";
import { GroupChatScreenSkeleton } from "@/components/chat/messageSkeleton";
import { getChatBackgroundPreset } from "@/components/chat/chatBackgrounds";
import { useChatBackgroundStore } from "@/store/chatBackgroundStore";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { useMessageCacheStore } from "@/store/messageCacheStore";
import { usePinnedMessageStore } from "@/store/pinnedMessageStore";
import { usePendingGiftOverlayStore } from "@/store/pendingGiftOverlayStore";
import { ThemedView } from "@/components/ui/ThemedView";
import { userService } from "@/service/profile.Service";
import { LevelBadge } from "@/components/levelBadge";
import { ProfileFrame } from "@/components/ui/ProfileFrame";

import { giftService, GiftTargetType } from "@/service/post.service";
import type { Gifts as UIGift } from "@/components/gift/GiftGridItem";
import type { GiftSendOverlayRef } from "@/components/gift/GiftSendOverlay";

import GiftModal from "@/components/gift/GiftModal";
import GiftSendOverlay from "@/components/gift/GiftSendOverlay";
import FloatingComboButton from "@/components/gift/floatingComboButton";

// ── Shared types, constants, and helpers from components/chat/shared ──
import type { ChatMessage } from "@/components/chat/shared/chatTypes";
import {
  ChatMessageReaction,
  GroupWebSocketEvents,
  QUICK_EMOJIS,
  GIFT_COMBO_WINDOW,
  BUBBLE_COLOR_OPTIONS,
  BUBBLE_STYLE_OPTIONS,
  SCREEN_WIDTH as SHARED_SCREEN_WIDTH,
  isImageUrl,
  buildPinPreview,
  getReplyQuotePreview,
  getDateLabel as sharedGetDateLabel,
  normalizeRawMessage as sharedNormalizeRawMessage,
} from "@/components/chat/shared/chatTypes";
import MessageBubble from "@/components/chat/MessageBubble";
import BubbleCustomizerModal from "@/components/chat/BubbleCustomizerModal";
import MediaLightboxModal from "@/components/chat/MediaLightboxModal";
import ReportReasonSheet from "@/components/chat/reportReasonSheet";
import SharedMediaSection from "@/components/chat/SharedMediaSection";

const normalizeRawMessage = (msg: any, currentUser?: any): ChatMessage => {
  // Delegate to the shared normalizer
  return sharedNormalizeRawMessage(msg, currentUser) as ChatMessage;
};

export default function GroupChatScreen() {
  const { id, groupName } = useLocalSearchParams<{
    id: string;
    groupName: string;
  }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [socketStatus, setSocketStatus] = useState<"connected" | "reconnecting" | "disconnected">("disconnected");
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Offline message cache (persisted per conversation)
  const loadCachedMessages = useMessageCacheStore(
    (state) => state.loadCachedMessages,
  );
  const setCachedMessages = useMessageCacheStore(
    (state) => state.setCachedMessages,
  );
  const cacheRehydrated = useMessageCacheStore((state) => state.rehydrated);

  useEffect(() => {
    if (id && messages.length > 0) {
      const persistable = messages.filter((m) => !m.isSystem);
      if (persistable.length > 0) {
        setCachedMessages(id, persistable);
      }
    }
  }, [id, messages, setCachedMessages]);

  // Real-time: when any user updates their profile (frame, picture, name),
  // patch every message and member in this group chat.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "PROFILE_FRAME_UPDATED",
      (data: { userId: string; profileFrame?: string | null; profilePictureUrl?: string | null; username?: string | null }) => {
        if (!data?.userId) return;
        const cleanUserId = data.userId.toLowerCase();
        // Patch messages
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.senderId?.toLowerCase() !== cleanUserId) return msg;

            const nextSenderAvatar =
              data.profilePictureUrl === undefined || data.profilePictureUrl === null
                ? undefined
                : data.profilePictureUrl;
            const nextSenderName =
              data.username === undefined || data.username === null
                ? undefined
                : data.username;

            return {
              ...msg,
              ...(nextSenderAvatar !== undefined && { senderAvatar: nextSenderAvatar }),
              ...(nextSenderName !== undefined && { senderName: nextSenderName }),
            };
          })
        );
        // Patch members list
        setMembers((prev) =>
          prev.map((m: any) => {
            const memberId = String(m.userId || m.user?.id || m.id || "").toLowerCase();
            if (memberId !== cleanUserId) return m;
            return {
              ...m,
              ...(data.profileFrame !== undefined && { profileFrame: data.profileFrame }),
              ...(data.profilePictureUrl !== undefined && {
                profilePictureUrl: data.profilePictureUrl,
                avatar: data.profilePictureUrl,
              }),
              ...(data.username !== undefined && { username: data.username }),
            };
          })
        );
      },
    );
    return () => sub.remove();
  }, []);

  const { colors, isDark } = useTheme();

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

  // Determine if current user is admin in this group
  const currentUserIsAdmin = useMemo(() => {
    try {
      const me = members.find((m: any) => {
        const rawId = m.userId || m.user?.id || m.user?._id || m.id || m._id;
        return (
          String(rawId || "")
            .trim()
            .toLowerCase() === (currentUserId || "").toLowerCase()
        );
      });
      if (!me) return false;
      return Boolean(
        me.isAdmin || (me.role && String(me.role).toLowerCase() === "admin"),
      );
    } catch {
      return false;
    }
  }, [members, currentUserId]);

  const handlePromoteMember = async (member: any) => {
    const targetUserId =
      member.userId ||
      member.user?.id ||
      member.user?._id ||
      member.id ||
      member._id;
    const memberName =
      member.username || member.user?.username || member.name || "Member";

    try {
      await GroupsApi.promoteMember(id, targetUserId);
      showSuccess(`${memberName} is now an Admin`);

      // Update local state role
      setMembers((prev) =>
        prev.map((m) => {
          const mId = m.userId || m.user?.id || m.user?._id || m.id;
          return String(mId) === String(targetUserId)
            ? { ...m, role: "ADMIN" }
            : m;
        }),
      );
    } catch (err: any) {
      showError(`Failed to promote member: ${err?.response?.data?.message || "Please try again."}`);
    }
  };

  const handleDemoteMember = async (member: any) => {
    const targetUserId =
      member?.userId || member?.user?.id || member?.user?._id || member?.id;
    const memberName =
      member?.username || member?.user?.username || member?.name || "Member";

    try {
      await GroupsApi.demoteMember(id, targetUserId);
      showInfo(`${memberName} is now a Member`);

      // Update local state role
      setMembers((prev) =>
        prev.map((m) => {
          const mId = m?.userId || m.user?.id || m.user?._id || m?.id;
          return String(mId) === String(targetUserId)
            ? { ...m, role: "MEMBER" }
            : m;
        }),
      );
    } catch (err: any) {
      showError(`Failed to demote admin: ${err?.response?.data?.message || "Please try again."}`);
    }
  };

  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const openMemberOptionsMenu = (member: any) => {
    setSelectedMember(member);
    setIsMenuVisible(true);
  };

  const closeMenu = () => {
    setIsMenuVisible(false);
    setSelectedMember(null);
  };

  // Navigation View State (Chat View vs Group Details Screen)
  const [viewingDetails, setViewingDetails] = useState<boolean>(false);

  // Lightbox Media Preview State
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0);

  // Full-screen group avatar modal
  const [showFullAvatarModal, setShowFullAvatarModal] = useState<boolean>(false);

  // All image URLs extracted from chat messages (for gallery swiping)
  const allChatImages = useMemo(() => {
    const urls: string[] = [];
    messages.forEach((msg) => {
      if (Array.isArray(msg.attachments)) {
        msg.attachments.forEach((att: any) => {
          if (att.type === "image" || att.type?.startsWith("image/") || isImageUrl(att.url)) {
            if (!urls.includes(att.url)) urls.push(att.url);
          }
        });
      }
      if (msg.mediaUrl && (msg.mediaType?.startsWith("image/") || isImageUrl(msg.mediaUrl))) {
        if (!urls.includes(msg.mediaUrl)) urls.push(msg.mediaUrl);
      }
      if (!msg.mediaUrl && isImageUrl(msg.content)) {
        const url = msg.content.trim();
        if (!urls.includes(url)) urls.push(url);
      }
    });
    return urls;
  }, [messages]);

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
      await GroupsApi.pinMessage(id, message.id);
    } catch (err: any) {
    
    }
  };

  const handleUnpinMessage = async () => {
    if (!pinnedMessage) return;
    try {
      await GroupsApi.unpinMessage(id, pinnedMessage.id);
      setPinnedMessage(null);
      setMessages((prev) =>
        prev.map((m) => (m.isPinned ? { ...m, isPinned: false } : m)),
      );
    } catch (err: any) {
   
    }
  };

  useEffect(() => {
    if (
      !id ||
      !pinnedMessageCacheRehydrated ||
      pinCacheHydratedForIdRef.current === id
    )
      return;
    pinCacheHydratedForIdRef.current = id;
    const cached = loadCachedPinnedMessage(id) as ChatMessage | null;
    setPinnedMessage(cached);
  }, [id, pinnedMessageCacheRehydrated, loadCachedPinnedMessage]);

  useEffect(() => {
    if (!id || pinCacheHydratedForIdRef.current !== id) return;
    setCachedPinnedMessage(id, pinnedMessage);
  }, [id, pinnedMessage, setCachedPinnedMessage]);

  // Fetch the pinned message on mount
  useEffect(() => {
    if (!id) return;
    GroupsApi.getPinnedMessage(id)
      .then((msg) => {
        if (msg && !msg.isDeleted) {
          setPinnedMessage(normalizeMessage(msg));
        } else {
          setPinnedMessage(null);
        }
      })
      .catch(() => {});
  }, [id]);

  // Gift Sending State
  const [showGifts, setShowGifts] = useState(false);
  const [giftCoins, setGiftCoins] = useState(currentUser?.coins ?? 0);
  const [activeComboGift, setActiveComboGift] = useState<UIGift | null>(null);
  const giftOverlayRef = useRef<GiftSendOverlayRef | null>(null);
  // Dedup: last time the gift overlay was shown, so a gift that arrives via
  // both gift:sent (socket) and gift_received (push) doesn't play twice.
  const lastGiftOverlayTsRef = useRef(0);
  const giftComboMapRef = useRef<
    Map<string, { messageId: string; count: number; lastTs: number }>
  >(new Map());
  // Pending gift: user selected a gift but hasn't picked a recipient yet
  const [pendingGift, setPendingGift] = useState<UIGift | null>(null);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  // Stores the last recipient so combo sends go to the same person
  const lastRecipientIdRef = useRef<string | null>(null);
 const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Called when user picks a gift from the GiftModal — show recipient picker
  const handleGiftSelected = (gift: UIGift) => {
    if (giftCoins < gift.coins) {
      showError("Not enough coins");
      return;
    }
    setShowGifts(false);
    setPendingGift(gift);
    setRecipientSearch("");
    setShowRecipientPicker(true);
  };

  // Called after user picks a recipient from the list
  const confirmSendGift = (recipientUserId: string) => {
    if (!pendingGift) return;

    // Block sending a gift to yourself outright — checked before the send
    // goes anywhere, so picking yourself never silently succeeds (or shows
    // an unrelated error) instead of telling you why it didn't go through.
    if (recipientUserId.toLowerCase() === currentUserId) {
      showError("You can't send a gift to yourself");
      setShowRecipientPicker(false);
      setPendingGift(null);
      return;
    }

    const gift = pendingGift;
    const nextBalance = giftCoins - gift.coins;

    const recipientName =
      filteredMembers.find(
        (m: any) =>
          String(
            m.userId || m.user?.id || m.user?._id || m.id || m._id,
          ).toLowerCase() === recipientUserId.toLowerCase(),
      )?.username ||
      filteredMembers.find(
        (m: any) =>
          String(
            m.userId || m.user?.id || m.user?._id || m.id || m._id,
          ).toLowerCase() === recipientUserId.toLowerCase(),
      )?.user?.username ||
      "Someone";

    // Immediate/optimistic: react to the tap right away — don't make the
    // user wait on the network round-trip before anything happens.
    setGiftCoins(nextBalance);
    setShowRecipientPicker(false);
    setPendingGift(null);
    setActiveComboGift(gift);
    lastRecipientIdRef.current = recipientUserId;

    giftService
      .sendGift({
        giftId: gift.id as string,
        targetType: GiftTargetType.GROUP,
        targetId: id || "",
        recipientId: recipientUserId,
      })
      .then(() => {
        DeviceEventEmitter.emit("GIFT_TRANSACTION_COMPLETE", {
          newBalance: nextBalance,
        });
        // Backend broadcasts gift:sent via groupsGateway — no client emit needed
        showSuccess(`Gift sent to ${recipientName}!`);
      })
      .catch((error: any) => {
        setGiftCoins(giftCoins);
        showError(`Could not send gift: ${error?.response?.data?.message || "Please try again."}`);
      });
  };

  // Send gift via combo (same recipient as initial send)
  const handleComboSend = (gift: UIGift) => {
    const recipientId = lastRecipientIdRef.current;
    if (!recipientId) return;
    if (giftCoins < gift.coins) {
      showError("Not enough coins");
      return;
    }
    const nextBalance = giftCoins - gift.coins;
    setGiftCoins(nextBalance);

    giftService
      .sendGift({
        giftId: gift.id as string,
        targetType: GiftTargetType.GROUP,
        targetId: id || "",
        recipientId,
      })
      .then(() => {
        DeviceEventEmitter.emit("GIFT_TRANSACTION_COMPLETE", {
          newBalance: nextBalance,
        });
        // Backend broadcasts gift:sent via groupsGateway — no client emit needed
      })
      .catch(() => {
        setGiftCoins(giftCoins);
      });
  };

  const handleComboTimeout = (count: number) => {
    const gift = activeComboGift;
    setActiveComboGift(null);
    // Never shown when the recipient is yourself — there's no one to
    // surprise with the flying-gift animation.
    const isSelf = lastRecipientIdRef.current === currentUserId;
    if (gift && !isSelf) {
      giftOverlayRef.current?.show(gift, currentUser?.username || "You", count);
    }
  };

  // Listen for real-time gift events from other users in this group
  useEffect(() => {
    if (!socketRef.current || !id) return;

    const socketInstance = socketRef.current;

    socketInstance.on("gift:sent", (data: any) => {
      // Remember when the socket delivered the overlay so the push-based
      // fallback below doesn't play the same gift twice.
      lastGiftOverlayTsRef.current = Date.now();

      const senderId = String(data?.senderId || "")
        .trim()
        .toLowerCase();
      const isMe = senderId === currentUserIdRef.current;
      const senderName = data?.senderName || "Someone";
      const gift = data?.gift;
      if (!gift) return;

      // Show flying gift overlay for ALL users (sender + recipients + bystanders)
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
        memberNameMapRef.current.get(recipientId) ||
        "a member";
      const comboKey = `${senderId}|${gift.id}|${recipientId}`;
      const now = Date.now();
      const existingCombo = giftComboMapRef.current.get(comboKey);

      if (existingCombo && now - existingCombo.lastTs < GIFT_COMBO_WINDOW) {
        const nextCount = existingCombo.count + 1;
        giftComboMapRef.current.set(comboKey, {
          ...existingCombo,
          count: nextCount,
          lastTs: now,
        });
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
        giftComboMapRef.current.set(comboKey, {
          messageId,
          count: 1,
          lastTs: now,
        });

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
          const insertAt = next.findIndex(
            (m) => m.createdAt > giftSystemMessage.createdAt,
          );
          if (insertAt === -1) next.push(giftSystemMessage);
          else next.splice(insertAt, 0, giftSystemMessage);
          return next;
        });
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      socketInstance.off("gift:sent");
    };
  }, [id]);

  // Consume a gift that arrived via push notification — covers gifts
  // received while the WebSocket was disconnected or the app was
  // backgrounded (the push listener stores it in the pending gift store).
  const pendingPushGift = usePendingGiftOverlayStore((s) => s.pendingGift);

  useEffect(() => {
    if (!pendingPushGift) return;

    // Only show if the pending gift belongs to this conversation.
    if (pendingPushGift.groupId && pendingPushGift.groupId !== id) return;

    // Drop stale events (older than 10 seconds).
    if (Date.now() - pendingPushGift.receivedAt > 10000) {
      usePendingGiftOverlayStore.getState().consumePendingGift();
      return;
    }

    usePendingGiftOverlayStore.getState().consumePendingGift();

    // Skip if the socket gift:sent event already played this overlay.
    if (Date.now() - lastGiftOverlayTsRef.current < 3000) return;

    giftOverlayRef.current?.show(
      {
        id: pendingPushGift.giftId || "",
        name: pendingPushGift.giftName,
        icon: pendingPushGift.giftIcon || "🎁",
        coins: pendingPushGift.giftCoinCost || 0,
        rarity: pendingPushGift.giftRarity || "rare",
        animationUrl: pendingPushGift.giftAnimationUrl || "",
        videoUrl: pendingPushGift.giftVideoUrl || "",
      },
      pendingPushGift.senderName,
    );

    // Add the same gift system message the socket path adds, so the
    // thread shows "X sent Y gift" even when the push was the only
    // delivery (WebSocket disconnected / app backgrounded).
    const recipientName =
      currentUser?.username || currentUser?.firstName || "a member";
    const pushGiftMsg: ChatMessage = {
      id: `gift-${pendingPushGift.senderId || ""}-${
        pendingPushGift.giftId || ""
      }-${Date.now()}`,
      senderId: pendingPushGift.senderId || "",
      senderName: pendingPushGift.senderName,
      content: `${pendingPushGift.senderName} sent ${recipientName} ${pendingPushGift.giftName}`,
      createdAt: new Date().toISOString(),
      isGiftMessage: true,
      giftSenderName: pendingPushGift.senderName,
      giftName: pendingPushGift.giftName,
      giftIcon: pendingPushGift.giftIcon || "🎁",
      giftCount: 1,
    };
    setMessages((prev) => {
      if (prev.some((m) => m.id === pushGiftMsg.id)) return prev;
      const next = [...prev];
      const insertAt = next.findIndex((m) => m.createdAt > pushGiftMsg.createdAt);
      if (insertAt === -1) next.push(pushGiftMsg);
      else next.splice(insertAt, 0, pushGiftMsg);
      return next;
    });

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [pendingPushGift, id]);

  const [draftBubbleColor, setDraftBubbleColor] = useState<string>(
    BUBBLE_COLOR_OPTIONS[0],
  );
  const [draftBubbleStyle, setDraftBubbleStyle] = useState<string>(
    BUBBLE_STYLE_OPTIONS[0].key,
  );
  const [savingBubbleStyle, setSavingBubbleStyle] = useState<boolean>(false);
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());

  // UI & Action States
  const [loading, setLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>("");
  const [showMemberSearch, setShowMemberSearch] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  // Edit Group Modal States
  const [showEditGroupModal, setShowEditGroupModal] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [updatingGroup, setUpdatingGroup] = useState<boolean>(false);

  // Add Member Modal States
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [addingMember, setAddingMember] = useState<boolean>(false);

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
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  // Guards onContentSizeChange's scroll-to-end while a jump scroll is in
  // flight / a highlight is being shown, so we don't yank the view back to
  // the bottom until the user deliberately scrolls away themselves.
  const isJumpingRef = useRef(false);

  // Modal states
  const user = useAuthStore((state) => state.user);

  const userId = user?.id;

  // Follower selection states
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [followersCursor, setFollowersCursor] = useState<string | null>(null);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [followerSearch, setFollowerSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 1. Mark as read when entering the screen
  useEffect(() => {
    let isMounted = true;

    const handleMarkAsRead = async () => {
      try {
        await GroupsApi.markAsRead(id);
      } catch (error) {
        console.error("Failed to mark group messages as read:", error);
      }
    };

    handleMarkAsRead();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showError("Permission to access gallery is required to pick an icon.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
    }
  };

  const getGroupCategory = (group: Group): any => {
    if (group.isOfficial) return "official";

    const typeLower = (group.name || "").toLowerCase();

    if (
      typeLower.includes("school") ||
      typeLower.includes("university") ||
      typeLower.includes("campus")
    ) {
      return "school";
    }
    if (typeLower.includes("faculty")) return "faculty";
    if (typeLower.includes("department") || typeLower.includes("dept")) {
      return "department";
    }

    return "default";
  };

  const renderGroupAvatar = (group: Group) => {
    if (group.iconUrl) {
      return (
        <ThemedView style={styles.avatarContainer}>
          <Image
            source={{ uri: group.iconUrl }}

            style={styles.avatar}
          />
        </ThemedView>
      );
    }

    const category = getGroupCategory(group);

    switch (category) {
      case "official":
        return (
          <ThemedView style={styles.avatarContainer}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 1.5,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="checkmark-circle" size={70} color="#3b82f6" />
            </View>
          </ThemedView>
        );
      case "school":
        return (
          <ThemedView style={styles.avatarContainer}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 1.5,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="school" size={70} color="#10b981" />
            </View>
          </ThemedView>
        );
      case "faculty":
        return (
          <ThemedView style={styles.avatarContainer}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 1.5,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="business" size={70} color="#a855f7" />
            </View>
          </ThemedView>
        );
      case "department":
        return (
          <ThemedView style={styles.avatarContainer}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 1.5,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="library" size={70} color="#f59e0b" />
            </View>
          </ThemedView>
        );
      default:
        return (
          <ThemedView style={styles.avatarContainer}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 1.5,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ThemedText className="font-bold text-2xl">
                {groupName?.charAt(0).toUpperCase() || "G"}
              </ThemedText>
            </View>
          </ThemedView>
        );
    }
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(followerSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [followerSearch]);

  // Fetch followers when modal opens or search query changes
  useEffect(() => {
    if (showAddMemberModal) {
      fetchFollowers(true);
    } else {
      // Reset state on close
      setFollowersList([]);
      setSelectedUserIds(new Set());
      setFollowersCursor(null);
      setFollowerSearch("");
    }
  }, [showAddMemberModal, debouncedSearch]);

  const fetchFollowers = async (isInitial = false) => {
    if (!userId) return;

    if (isInitial) {
      setIsLoadingFollowers(true);
    } else {
      if (!followersCursor || isLoadingMore) return;
      setIsLoadingMore(true);
    }

    try {
      const res = await userService.getFollowers(userId, {
        search: debouncedSearch,
        limit: 15,
        cursor: isInitial ? undefined : (followersCursor ?? undefined),
      });

      const newItems = res.items || [];
      setFollowersList((prev) =>
        isInitial ? newItems : [...prev, ...newItems],
      );
      setFollowersCursor(res.nextCursor || null);
    } catch (error) {
      console.error("Failed to fetch followers:", error);
    } finally {
      setIsLoadingFollowers(false);
      setIsLoadingMore(false);
    }
  };

  const toggleSelectUser = (userIdStr: string) => {
    setSelectedUserIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(userIdStr)) {
        updated.delete(userIdStr);
      } else {
        updated.add(userIdStr);
      }
      return updated;
    });
  };

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

  // Live presence notices only apply to default (Explore Communities) groups.
  const isDefaultGroupRef = useRef(false);
  useEffect(() => {
    isDefaultGroupRef.current = group?.type === "default";
  }, [group]);

  const appendPresenceNotice = useCallback(
    (rawUserId: string, action: "joined" | "left") => {
      if (!isDefaultGroupRef.current) return;
      const cleanId = String(rawUserId || "")
        .trim()
        .toLowerCase();
      if (!cleanId || cleanId === currentUserIdRef.current) return;

      const name = memberNameMapRef.current.get(cleanId) || "Someone";
      const notice: ChatMessage = {
        id: `sys-${action}-${cleanId}-${Date.now()}`,
        senderId: rawUserId,
        senderName: name,
        content: `${name} ${action} the chat`,
        createdAt: new Date().toISOString(),
        isSystem: true,
        systemAction: action,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === notice.id)) return prev;
       
        const next = [...prev];
        const insertAt = next.findIndex((m) => m.createdAt > notice.createdAt);
        if (insertAt === -1) next.push(notice);
        else next.splice(insertAt, 0, notice);
        return next;
      });
    },
    [],
  );

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

  // Current-user ref so normalizeMessage stays stable — a changing user
  // object (e.g. coin-balance updates from the gift modal) must not
  // re-run the socket effect below, which leaves and rejoins the group
  // room and broadcasts spurious "user joined/left" notices.
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Normalize message object to match backend schema response
  const normalizeMessage = useCallback(
    (msg: any): ChatMessage => normalizeRawMessage(msg, currentUserRef.current),
    [],
  );

// Unified Initial Group Loader
  const loadInitialData = useCallback(async () => {
    if (!id) return;

    // 1. Show cached messages immediately so UI isn't stuck on a spinner
    const cached = loadCachedMessages(id);
    if (cached.length > 0) {
      setMessages(cached as unknown as ChatMessage[]);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      // 2. STEP ONE: Join / verify group membership FIRST
      try {
        await GroupsApi.joinGroup(id);
      } catch (joinError: any) {
        // Log non-fatal join errors (e.g., if already a member or duplicate record)
        console.warn(
          "⚠️ [joinGroup] Warning:",
          joinError?.response?.data || joinError.message
        );
      }

      // 3. STEP TWO: Now that membership is confirmed, fetch details in parallel
      const [groupData, memberData, historyData] = await Promise.all([
        GroupsApi.getDetail(id),
        GroupsApi.listMembers(id),
        GroupsApi.getMessages(id),
      ]);

      setGroup(groupData);
      setEditName(groupData?.name || "");
      setEditDescription(groupData?.description || "");
      setEditAvatarUrl(groupData?.iconUrl || "");
      setMembers(memberData || []);

      const rawMessages = Array.isArray(historyData)
        ? historyData
        : (historyData as { items?: unknown[] })?.items || [];

      const formattedMessages = rawMessages
        .map(normalizeMessage)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      // Merge fetched history with whatever is already shown/cached
      setMessages((prev) => {
        const byId = new Map<string, ChatMessage>();
        [...prev, ...formattedMessages].forEach((m) => byId.set(m.id, m));
        return Array.from(byId.values()).sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      setCachedMessages(id, formattedMessages);
    } catch (err: any) {
      console.error(
        "❌ [HTTP] Error loading group data:",
        err?.response?.data || err.message
      );
      showError(err.response?.data?.message || "Offline — showing your saved messages.");
    } finally {
      setLoading(false);
      // Ensure we scroll to the very last message after initial load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 150);
    }
  }, [id, normalizeMessage, setCachedMessages, loadCachedMessages]);

  // Trigger loading only when cache is rehydrated AND id is present
  useEffect(() => {
    if (!cacheRehydrated || !id) return;
    loadInitialData();
  }, [cacheRehydrated, id, loadInitialData]);

  // Real-Time Socket Connection Setup — uses the SHARED /groups socket
  useEffect(() => {
    if (!id) return;

    // Acquire the shared /groups socket
    const socket = acquireNamespace("/groups");
    socketRef.current = socket;

    if (socket.connected) {
      setSocketStatus("connected");
    }

    // ── Define all named handlers ────────────────────────────────
    const handleConnect = () => {
      setSocketStatus("connected");
      socket.emit("joinGroup", { groupId: id });
    };

    const handleDisconnect = (reason: string) => {
      console.warn("⚠️ [Socket] Group disconnected:", reason);
      setSocketStatus("disconnected");
    };

    const handleOnlineList = (userArray: string[]) => {
      if (Array.isArray(userArray)) {
        setOnlineUserIds(
          new Set(userArray.map((uId) => String(uId).trim().toLowerCase())),
        );
      }
    };

    const handleUserJoined = ({ userId }: { userId: string }) => {
      const cleanId = String(userId || "").trim().toLowerCase();
      if (cleanId) setOnlineUserIds((prev) => new Set(prev).add(cleanId));
      appendPresenceNotice(userId, "joined");
    };

    const handleUserLeft = ({ userId }: { userId: string }) => {
      const cleanId = String(userId || "").trim().toLowerCase();
      if (!cleanId) return;
      setOnlineUserIds((prev) => {
        const updated = new Set(prev);
        updated.delete(cleanId);
        return updated;
      });
      setTypingUserIds((prev) => {
        const updated = new Set(prev);
        updated.delete(cleanId);
        return updated;
      });
      appendPresenceNotice(userId, "left");
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

    const handleMessageRead = (data: any) => {
      if (String(data?.groupId) !== String(id)) return;
      const readerId = String(data?.userId || "").trim().toLowerCase();
      if (readerId === currentUserIdRef.current) return;
      const readAt = new Date(data?.lastReadAt).getTime();
      if (Number.isNaN(readAt)) return;
      setMessages((prev) => prev.map((msg) =>
        msg.senderId?.toLowerCase() === currentUserIdRef.current && new Date(msg.createdAt).getTime() <= readAt
          ? { ...msg, readByOther: true } : msg,
      ));
    };

    const handleMessageEdited = (rawMessage: any) => {
      const editedMsg = normalizeMessage(rawMessage);
      setMessages((prev) => prev.map((msg) => msg.id === editedMsg.id ? { ...msg, content: editedMsg.content, isEdited: true } : msg));
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      const deletedId = String(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== deletedId).map((msg) => msg.replyToId === deletedId ? { ...msg, replyToId: null, replyTo: null } : msg));
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
        const actorId = String(data?.pinnedBy?.id || data?.pinnedBy?._id || data?.actorId || data?.userId || pinned?.userId || pinned?.user?.id || "").trim().toLowerCase();
        const actorName = data?.pinnedBy?.username || data?.pinnedBy?.name || data?.actorName || data?.userName || pinned?.user?.username || (actorId === currentUserIdRef.current ? currentUser?.username || "You" : memberNameMapRef.current.get(actorId)) || "Someone";
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
    socket.on(GroupWebSocketEvents.ONLINE_LIST, handleOnlineList);
    socket.on(GroupWebSocketEvents.USER_JOINED, handleUserJoined);
    socket.on(GroupWebSocketEvents.USER_LEFT, handleUserLeft);
    socket.on(GroupWebSocketEvents.USER_TYPING, handleTyping);
    socket.on(GroupWebSocketEvents.GROUP_UPDATED, handleGroupUpdated);
    socket.on(GroupWebSocketEvents.MESSAGE_NEW, handleMessageNew);
    socket.on(GroupWebSocketEvents.MESSAGE_READ, handleMessageRead);
    socket.on(GroupWebSocketEvents.MESSAGE_EDITED, handleMessageEdited);
    socket.on(GroupWebSocketEvents.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(GroupWebSocketEvents.REACTION_ADDED, handleReactionAdded);
    socket.on(GroupWebSocketEvents.REACTION_REMOVED, handleReactionRemoved);
    socket.on(GroupWebSocketEvents.MESSAGE_PINNED, handleMessagePinned);
    socket.on(GroupWebSocketEvents.MESSAGE_UNPINNED, handleMessageUnpinned);

    // Auto-join if already connected
    if (socket.connected) {
      socket.emit("joinGroup", { groupId: id });
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(GroupWebSocketEvents.ONLINE_LIST, handleOnlineList);
      socket.off(GroupWebSocketEvents.USER_JOINED, handleUserJoined);
      socket.off(GroupWebSocketEvents.USER_LEFT, handleUserLeft);
      socket.off(GroupWebSocketEvents.USER_TYPING, handleTyping);
      socket.off(GroupWebSocketEvents.GROUP_UPDATED, handleGroupUpdated);
      socket.off(GroupWebSocketEvents.MESSAGE_NEW, handleMessageNew);
      socket.off(GroupWebSocketEvents.MESSAGE_READ, handleMessageRead);
      socket.off(GroupWebSocketEvents.MESSAGE_EDITED, handleMessageEdited);
      socket.off(GroupWebSocketEvents.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(GroupWebSocketEvents.REACTION_ADDED, handleReactionAdded);
      socket.off(GroupWebSocketEvents.REACTION_REMOVED, handleReactionRemoved);
      socket.off(GroupWebSocketEvents.MESSAGE_PINNED, handleMessagePinned);
      socket.off(GroupWebSocketEvents.MESSAGE_UNPINNED, handleMessageUnpinned);

      leaveGroupRoom(id);
      releaseNamespace("/groups");
      socketRef.current = null;

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [id, normalizeMessage, appendPresenceNotice]);
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
      showError("Permission to access media library is required.");
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

  // Send / Edit Message Submit Handler
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
        id!,
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
      console.error(
        "❌ Failed to send message:",
        err?.response?.data || err.message,
      );
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

  const handleSendMessage = async () => {
    if (
      (!inputText.trim() && selectedAttachments.length === 0 && !selectedFile) ||
      (editingMessage && sending) ||
      !group ||
      !id
    )
      return;

    if (group.isLocked) {
      showError("Only admins can post messages right now.");
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit("typing:stop", { groupId: id });

    const contentText = inputText.trim();
    const attachmentsToSend = selectedAttachments;
    const fileToSend = selectedFile;
    setInputText("");
    setSelectedAttachments([]);
    setSelectedFile(null);

    if (editingMessage) {
      setSending(true);
      try {
        const updatedMsgRaw = await GroupsApi.editMessage(
          id,
          editingMessage.id,
          contentText,
        );
        const updatedMsg = normalizeMessage(updatedMsgRaw);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id
              ? { ...m, content: updatedMsg.content, isEdited: true }
              : m,
          ),
        );

        setEditingMessage(null);
        showSuccess("Message updated");
      } catch (err: any) {
        console.error(
          "❌ Failed to update message:",
          err?.response?.data || err.message,
        );
        showError(err.response?.data?.message || "Please try again.");
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
      attachments: (attachmentsToSend.length > 0 || hasFile) ? [
        ...attachmentsToSend.map((a) => ({
          url: a.uri,
          name: a.fileName || a.uri.split('/').pop() || 'image',
          type: a.mimeType || 'image/jpeg',
        })),
        ...(fileToSend
          ? [{ url: fileToSend.uri, name: fileToSend.name, type: fileToSend.mimeType || 'application/octet-stream' }]
          : []),
      ] : undefined,
    };

    setMessages((prev) => {
      const updated = [...prev, optimisticMessage];
      return updated.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
    setReplyToMessage(null);
    setTimeout(
      () => flatListRef.current?.scrollToEnd({ animated: true }),
      100,
    );

    sendOptimisticMessage(optimisticMessage);
  };

  // Delete Message Handler
  const handleDeleteMessage = async (message: ChatMessage) => {
    setSelectedMessage(null);
    try {
      await GroupsApi.deleteMessage(id!, message.id);
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
      showSuccess("Message deleted");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Could not delete message.");
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
        await GroupsApi.removeReaction(id!, message.id);
      } else {
        await GroupsApi.addReaction(id!, message.id, emoji);
      }
    } catch (err: any) {
      console.error("❌ Reaction error:", err?.response?.data || err.message);
      loadInitialData();
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

      showSuccess("Chat bubble updated");
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

  const [isLocked, setIsLocked] = useState(group?.isLocked || false);

  useEffect(() => {
    if (group?.isLocked !== undefined) {
      setIsLocked(group.isLocked);
    }
  }, [group?.isLocked]);

  const handleToggleLock = async () => {
    if (!group?.id) return;
    const targetState = !isLocked;

    try {
      setIsLocked(targetState);

      await GroupsApi.lockGroup(group.id, targetState);

      showSuccess(targetState ? "Group Locked" : "Group Unlocked");
    } catch (error: any) {
      setIsLocked(!targetState);
      showError(error?.response?.data?.message || "Could not update group lock status.");
    }
  };

  // Add Member Action
  const handleAddMemberSubmit = async () => {
    if (selectedUserIds.size === 0 || !id) return;

    setAddingMember(true);
    try {
      const userIdsToAdd = Array.from(selectedUserIds);

      // Call addMember for each selected user concurrently
      await Promise.all(
        userIdsToAdd.map((targetUserId) =>
          GroupsApi.addMember(id, targetUserId),
        ),
      );

      showSuccess(`Added ${userIdsToAdd.length} member${userIdsToAdd.length > 1 ? "s" : ""} successfully`);

      // Reset Modal state
      setShowAddMemberModal(false);
      setSelectedUserIds(new Set());

      // Refresh member list
      const updatedMembers = await GroupsApi.listMembers(id);
      setMembers(updatedMembers || []);
    } catch (err: any) {
      showError(`Failed to add member(s): ${err?.response?.data?.message || "Please try again."}`);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = (member: any) => {
    const memberUserId =
      member.userId ||
      member.user?.id ||
      member.user?._id ||
      member.id ||
      member._id;

    const memberName =
      member.username ||
      member.user?.username ||
      member.firstName ||
      member.user?.firstName ||
      member.name ||
      "this member";

    if (!id || !memberUserId) return;

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${memberName} from this group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Call API method to delete member from group
              await GroupsApi.removeMember(id, memberUserId);

              showSuccess(`${memberName} was successfully removed.`);

              // Refresh members list locally
              setMembers((prevMembers) =>
                prevMembers.filter((m: any) => {
                  const currentMemberId =
                    m.userId || m.user?.id || m.user?._id || m.id || m._id;
                  return String(currentMemberId) !== String(memberUserId);
                }),
              );
            } catch (err: any) {
              showError(`Failed to remove member: ${err?.response?.data?.message || "Please try again."}`);
            }
          },
        },
      ],
    );
  };

  // Edit Group Action
  const handleUpdateGroupSubmit = async () => {
    if (!editName.trim() || !id) return;

    setUpdatingGroup(true);
    try {
      const imagePayload = selectedImage
        ? {
            uri: selectedImage.uri,
            name:
              selectedImage.fileName ||
              selectedImage.uri.split("/").pop() ||
              `group-image-${Date.now()}.jpg`,
            type:
              selectedImage.type && selectedImage.type.includes("/")
                ? selectedImage.type
                : `image/${selectedImage.type || "jpeg"}`,
          }
        : undefined;

      const updated = await GroupsApi.updateGroup(
        id,
        editName.trim(),
        editDescription.trim(),
        imagePayload,
      );

      setGroup(updated);
      showSuccess("Group details updated");
      setShowEditGroupModal(false);
    } catch (err: any) {
      showError(err?.response?.data?.message || "Could not update group details.");
    } finally {
      setUpdatingGroup(false);
    }
  };

  // Leave Group Action
  const handleLeaveGroup = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group? You will no longer receive messages.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await GroupsApi.leaveGroup(id!);
              showInfo("You left the group");
              router.back();
            } catch (err: any) {
              showError(err?.response?.data?.message || "Could not leave group.");
            }
          },
        },
      ],
    );
  };

  // Report / block (App Store 1.2: users must be able to report and block)
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    userService
      .getBlockedUsers()
      .then((items) => {
        const ids = (Array.isArray(items) ? items : [])
          .map((b: any) => String(b?.user?.id ?? "").toLowerCase())
          .filter(Boolean);
        setBlockedUserIds(new Set(ids));
      })
      .catch(() => {});
  }, []);

  const handleReportReason = async (reason: string) => {
    const message = reportingMessage;
    setReportingMessage(null);
    if (!message) return;
    try {
      await GroupsApi.reportMessage(id!, message.id, reason);
      showSuccess("Thanks. Our team will review this report.");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Could not send report. Please try again.");
    }
  };

  const handleBlockSender = (message: ChatMessage) => {
    setSelectedMessage(null);
    const senderId = message.senderId;
    if (!senderId) return;
    const name = message.senderName ? `@${message.senderName}` : "this user";
    Alert.alert(
      "Block",
      `Block ${name}? You won't see their messages, and they won't be able to message you. You can unblock them from Settings > Blocked Users.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await userService.blockUser(senderId);
              setBlockedUserIds((prev) => new Set(prev).add(senderId.toLowerCase()));
              showSuccess(`${name} blocked`);
            } catch (err: any) {
              showError(err?.response?.data?.message || "Could not block user.");
            }
          },
        },
      ],
    );
  };

  // Start Reply Flow
  const handleStartReply = (message: ChatMessage) => {
    setSelectedMessage(null);
    setReplyToMessage(message);
  };

  // Scroll to a replied-to message and highlight it until the user scrolls
  const handleJumpToMessage = (targetMessageId: string) => {
    const targetIndex = messages.findIndex((m) => m.id === targetMessageId);
    if (targetIndex === -1) {
      showInfo("The original message isn't loaded in this chat yet.");
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

  const filteredMembers = useMemo(() => {
    const isDefaultGroup = group?.type === "default";
    const pool = isDefaultGroup
      ? members.filter((m: any) => {
          const rawId = m.userId || m.user?.id || m.user?._id || m.id || m._id;
          const cleanId = String(rawId || "")
            .trim()
            .toLowerCase();
          return onlineUserIds.has(cleanId);
        })
      : members;

    if (!memberSearchQuery.trim()) return pool;
    const q = memberSearchQuery.toLowerCase();
    return pool.filter((m: any) => {
      const name =
        m.username ||
        m.user?.username ||
        m.firstName ||
        m.user?.firstName ||
        m.name ||
        "";
      return name.toLowerCase().includes(q);
    });
  }, [members, memberSearchQuery, group, onlineUserIds]);

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

  // Avatar Component Helper
  const renderAvatar = (avatarUrl?: string, profileFrame?: string | null, initial?: string) => {
    return (
      <ProfileFrame
        frameId={profileFrame}
        uri={avatarUrl}
        size={32}
        initial={initial}
        fallbackColor={colors.border}
      />
    );
  };

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
      showSenderName={true}
      showAvatars={true}
      highlightStyle="yellow"
      highlightedMessageId={highlightedMessageId}
      editingMessage={editingMessage}
      renderAvatar={renderAvatar}
      onLongPress={setSelectedMessage}
      onPressMedia={handlePressMedia}
      onJumpToMessage={handleJumpToMessage}
      onToggleReaction={handleToggleReaction}
      onResend={handleResendMessage}
    />
  );

  if (loading && messages.length === 0) {
    return <GroupChatScreenSkeleton onBack={() => router.back()} />;
  }

  // ================= DEDICATED GROUP DETAILS SCREEN =================
  if (viewingDetails) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#09090B" />

        {/* Header */}
        <ThemedView
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}
          className="flex-row items-center justify-between px-4 py-3"
        >
          <TouchableOpacity
            onPress={() => setViewingDetails(false)}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card || "transparent",
              width: 35,
              height: 35,
            }}
            className="p-2 rounded-full justify-center items-center"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewingDetails(true)}
            className="items-center flex-1 mx-3"
          >
            <ThemedText className="font-bold text-base" numberOfLines={1}>
              {group?.name || groupName || "Group Chat"}
            </ThemedText>
            <ThemedText
              style={{ color: colors.muted || "#a1a1aa" }}
              className="text-xs"
            >
              {filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"}
              {onlineUserIds.size > 0 ? ` • ${onlineUserIds.size} online` : ""}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Group Avatar */}
          <TouchableOpacity
            className="mr-3.5"
            activeOpacity={0.8}
            onPress={() => {
              if (group?.iconUrl) {
                setShowFullAvatarModal(true);
              }
            }}
          >
            {group ? renderGroupAvatar(group) : null}
          </TouchableOpacity>

          {/* Group Overview Text */}
          <ThemedView style={styles.heroContent}>
            <ThemedView style={styles.infoRow}>
              <Users size={15} color="#A1A1AA" />
              <ThemedText style={styles.infoText}>
                {filteredMembers?.length || 0} Members
              </ThemedText>
              <ThemedView style={styles.onlineDot} />
              <ThemedText style={styles.onlineText}>
                {onlineUserIds.size} Online
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoRow}>
              <Calendar size={15} color="#A1A1AA" />
              <ThemedText style={styles.infoText}>
                Created{" "}
                {group?.createdAt
                  ? new Date(group.createdAt).toLocaleDateString()
                  : "Recently"}
              </ThemedText>
            </ThemedView>

            <ThemedText style={styles.description}>
              {group?.description || "No description provided for this group."}
            </ThemedText>
          </ThemedView>
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

          {/* Action Grid Options - Hidden if group.isSystemManaged is true */}
          {!group?.isSystemManaged && (
            <ThemedView style={styles.actionList}>
              {/* Add Member (Admin Only) */}
              {currentUserIsAdmin && (
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => setShowAddMemberModal(true)}
                  activeOpacity={0.7}
                >
                  <ThemedView style={styles.actionLeft}>
                    <ThemedView
                      style={[
                        styles.actionIconBadge,
                        { backgroundColor: "rgba(59, 130, 246, 0.1)" },
                      ]}
                    >
                      <UserPlus size={18} color="#3b82f6" />
                    </ThemedView>
                    <ThemedText style={styles.actionRowText}>
                      Add Member
                    </ThemedText>
                  </ThemedView>
                  <ChevronRight size={18} color="#71717a" />
                </TouchableOpacity>
              )}

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

              {/* Lock / Unlock Group (Admin Only) */}
              {currentUserIsAdmin && (
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={handleToggleLock}
                  activeOpacity={0.7}
                >
                  <ThemedView style={styles.actionLeft}>
                    <ThemedView
                      style={[
                        styles.actionIconBadge,
                        {
                          backgroundColor: isLocked
                            ? "rgba(245, 158, 11, 0.1)"
                            : "rgba(59, 130, 246, 0.1)",
                        },
                      ]}
                    >
                      {isLocked ? (
                        <Lock size={18} color="#f59e0b" />
                      ) : (
                        <Unlock size={18} color="#3b82f6" />
                      )}
                    </ThemedView>
                    <ThemedText style={styles.actionRowText}>
                      {isLocked
                        ? "Unlock Group Messages"
                        : "Lock Group Messages"}
                    </ThemedText>
                  </ThemedView>
                  <ChevronRight size={18} color="#71717a" />
                </TouchableOpacity>
              )}

              {/* Edit Group */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => setShowEditGroupModal(true)}
                activeOpacity={0.7}
              >
                <ThemedView style={styles.actionLeft}>
                  <ThemedView
                    style={[
                      styles.actionIconBadge,
                      { backgroundColor: "rgba(59, 130, 246, 0.1)" },
                    ]}
                  >
                    <Edit3 size={18} color="#3b82f6" />
                  </ThemedView>
                  <ThemedText style={styles.actionRowText}>
                    Edit Group Details
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
                    Leave Group
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

          {/* Members List Section */}
          <ThemedView style={[styles.sectionContainer, { marginTop: 8 }]}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedView style={styles.sectionTitleRow}>
                <Users size={22} color="#3B82F6" />
                <ThemedText style={styles.sectionTitle}>Members</ThemedText>
              </ThemedView>
            </ThemedView>

            {filteredMembers.map((item: any) => {
              const rawId =
                item.userId ||
                item.user?.id ||
                item.user?._id ||
                item.id ||
                item._id;
              const cleanId = String(rawId || "")
                .trim()
                .toLowerCase();

              const currentUserIdStr = String(currentUserId || "")
                .trim()
                .toLowerCase();
              const isSelf = cleanId === currentUserIdStr;

              const name =
                item.username ||
                item.user?.username ||
                item.firstName ||
                item.user?.firstName ||
                item.name ||
                "Member";

              const avatar =
                item.profilePictureUrl ||
                item.avatar ||
                item.user?.profilePictureUrl ||
                item.user?.avatar ||
                "https://via.placeholder.com/100";

              const isOnline = onlineUserIds.has(cleanId);
              const isMemberAdmin =
                item.role === "ADMIN" || item.role === "admin" || item.isAdmin;
              const roleLabel = isMemberAdmin ? "Admin" : "Member";

              return (
                <Pressable
                  key={cleanId || Math.random().toString()}
                  style={styles.memberRow}
                  onLongPress={() => {
                    if (currentUserIsAdmin && !isSelf) {
                      openMemberOptionsMenu(item);
                    }
                  }}
                >
                  <ThemedView style={styles.memberLeft}>
                    <ThemedView>
                      <ProfileFrame
                        frameId={item.profileFrame || item.user?.profileFrame}
                        uri={avatar}
                        size={44}
                        initial={name?.[0]?.toUpperCase()}
                      />
                      {isOnline && (
                        <ThemedView style={styles.memberOnlineBadge} />
                      )}
                    </ThemedView>

                    <ThemedView style={{ marginLeft: 14 }}>
                      <ThemedView style={styles.memberNameRow}>
                        <ThemedText className="mb-1" style={styles.memberName}>
                          {name} {isSelf ? "(You)" : ""}
                        </ThemedText>
                      </ThemedView>
                      <LevelBadge level={item?.user?.appLevel} />
                      <ThemedText style={styles.memberRole}>
                        {roleLabel}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <View className="flex-row items-center gap-2">
                    {currentUserIsAdmin && !isSelf ? (
                      <TouchableOpacity
                        onPress={() => openMemberOptionsMenu(item)}
                        className="p-2 rounded-full hover:bg-zinc-800/20"
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <ChevronRight size={18} color="#52525B" />
                      </TouchableOpacity>
                    ) : (
                      <ChevronRight size={18} color="#52525B" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ThemedView>
        </ScrollView>

        {/* Modal: Full-Screen Group Avatar */}
        <Modal
          visible={showFullAvatarModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFullAvatarModal(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.95)",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => setShowFullAvatarModal(false)}
          >
            <TouchableOpacity
              onPress={() => setShowFullAvatarModal(false)}
              style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}
              className="p-2 bg-zinc-800/80 rounded-full"
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {group?.iconUrl && (
              <Image
                source={{ uri: group.iconUrl }}
                style={{
                  width: Dimensions.get("window").width * 0.9,
                  height: Dimensions.get("window").width * 0.9,
                  borderRadius: 20,
                }}
                resizeMode="contain"
              />
            )}
          </Pressable>
        </Modal>

        {/* Modal: Full-Screen Media Lightbox Viewer */}
        <MediaLightboxModal
          visible={Boolean(previewMediaUrl)}
          images={allChatImages}
          initialIndex={previewImageIndex}
          onClose={() => setPreviewMediaUrl(null)}
        />

        {/* Modal: Edit Group Info */}
        <Modal
          visible={showEditGroupModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowEditGroupModal(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-end bg-black/60">
              <KeyboardAvoidingView
                behavior="padding"
                style={{
                  backgroundColor: colors.card || "#18181b",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                className="p-6"
              >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-4">
                  <ThemedText className="text-xl font-bold">
                    Edit Group Info
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowEditGroupModal(false)}
                    className="p-1"
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Group Icon Selector */}
                <View className="items-center mb-5">
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    }}
                    className="w-20 h-20 rounded-full justify-center items-center overflow-hidden relative"
                  >
                    {selectedImage || editAvatarUrl ? (
                      <Image
                        source={
                          selectedImage?.uri
                            ? { uri: selectedImage.uri }
                            : editAvatarUrl
                              ? { uri: editAvatarUrl }
                              : undefined
                        }
                        className="w-full h-full"
                      />
                    ) : (
                      <Ionicons
                        name="camera"
                        size={28}
                        color={colors.muted || "#71717a"}
                      />
                    )}
                  </TouchableOpacity>
                  <ThemedText
                    style={{ color: colors.muted || "#a1a1aa" }}
                    className="text-xs mt-1.5"
                  >
                    Tap to change icon
                  </ThemedText>
                </View>

                {/* Group Name Input */}
                <View className="mb-4">
                  <ThemedText className="text-xs font-semibold mb-1.5">
                    Group Name *
                  </ThemedText>
                  <TextInput
                    style={{
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    }}
                    className="p-3 rounded-xl text-sm"
                    placeholder="Enter group name"
                    placeholderTextColor={colors.muted || "#71717a"}
                    value={editName}
                    onChangeText={setEditName}
                  />
                </View>

                {/* Group Description Input */}
                <View className="mb-6">
                  <ThemedText className="text-xs font-semibold mb-1.5">
                    Description
                  </ThemedText>
                  <TextInput
                    style={{
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      minHeight: 80,
                      textAlignVertical: "top",
                    }}
                    className="p-3 rounded-xl text-sm"
                    placeholder="Describe the purpose of this group..."
                    placeholderTextColor={colors.muted || "#71717a"}
                    multiline
                    numberOfLines={3}
                    value={editDescription}
                    onChangeText={setEditDescription}
                  />
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3 pt-2 pb-10">
                  {/* Cancel Spacer/Button */}
                  <TouchableOpacity
                    style={{
                      height: 20,
                      marginBottom: 80,
                    }}
                    className="flex-1 py-3.5 rounded-2xl justify-center items-center active:opacity-60"
                    onPress={() => setShowEditGroupModal(false)}
                    disabled={updatingGroup}
                  >
                    {/* Kept identical layout space to Create modal */}
                  </TouchableOpacity>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={{
                      marginBottom: 60,
                    }}
                    className={`flex-1 py-3.5 rounded-2xl justify-center items-center flex-row active:scale-[0.98] ${
                      updatingGroup || !editName.trim()
                        ? "bg-blue-400 opacity-80"
                        : "bg-blue-600"
                    }`}
                    onPress={handleUpdateGroupSubmit}
                    disabled={updatingGroup || !editName.trim()}
                    activeOpacity={0.85}
                  >
                    {updatingGroup ? (
                      <View className="flex-row items-center justify-center">
                        <ActivityIndicator
                          size="small"
                          color="#ffffff"
                          className="mr-2"
                        />
                        <ThemedText className="font-bold text-sm text-white">
                          Saving...
                        </ThemedText>
                      </View>
                    ) : (
                      <ThemedText className="font-bold text-sm text-white tracking-wide">
                        Save Changes
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Modal: Add Members from Followers List */}

        <Modal
          visible={showAddMemberModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddMemberModal(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "flex-end",
            }}
            onPress={() => setShowAddMemberModal(false)}
          >
            <Pressable
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: "92%",
                minHeight: "75%",
                padding: 20,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <View className="flex-row items-center justify-between mb-4">
                <ThemedText className="text-lg font-bold">
                  Add Followers to Group
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setShowAddMemberModal(false)}
                  className="p-1 rounded-full"
                >
                  <X size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                  height: 52,
                }}
                className="flex-row items-center px-3 py-2 rounded-xl mb-3"
              >
                <Search size={18} color="#71717A" />
                <TextInput
                  style={{ color: colors.text, flex: 1, marginLeft: 8 }}
                  placeholder="Search followers..."
                  placeholderTextColor={colors.muted || "#71717a"}
                  value={followerSearch}
                  onChangeText={setFollowerSearch}
                />
              </View>

              {/* Followers List */}
              {isLoadingFollowers ? (
                <View className="flex-1 justify-center items-center py-10">
                  <ActivityIndicator size="small" color="#3B82F6" />
                </View>
              ) : (
                <FlatList
                  data={followersList}
                  keyExtractor={(item) => String(item.id || item._id)}
                  showsVerticalScrollIndicator={false}
                  onEndReached={() => fetchFollowers(false)}
                  onEndReachedThreshold={0.3}
                  ListFooterComponent={
                    isLoadingMore ? (
                      <ActivityIndicator
                        size="small"
                        color="#3B82F6"
                        className="py-3"
                      />
                    ) : null
                  }
                  ListEmptyComponent={
                    <View className="py-8 items-center">
                      <ThemedText style={{ color: "#71717A", fontSize: 14 }}>
                        No followers found.
                      </ThemedText>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const userIdStr = String(item.id || item._id);
                    const isSelected = selectedUserIds.has(userIdStr);
                    const isAlreadyMember = members.some(
                      (m: any) =>
                        String(m.userId || m.id || m._id) === userIdStr,
                    );

                    return (
                      <TouchableOpacity
                        disabled={isAlreadyMember}
                        onPress={() => toggleSelectUser(userIdStr)}
                        className="flex-row items-center justify-between py-3 border-b border-zinc-800/50"
                        style={{ opacity: isAlreadyMember ? 0.5 : 1 }}
                      >
                        <View className="flex-row items-center gap-3">
                          <ProfileFrame
                            frameId={item.profileFrame}
                            uri={item.avatar || item.profilePictureUrl}
                            size={42}
                            initial={(item.username || item.name || "U")[0]?.toUpperCase()}
                          />
                          <View>
                            <ThemedText className="font-semibold text-sm">
                              {item.username || item.name || "User"}
                            </ThemedText>
                            {isAlreadyMember && (
                              <ThemedText
                                style={{ color: "#71717A", fontSize: 11 }}
                              >
                                Already in group
                              </ThemedText>
                            )}
                          </View>
                        </View>

                        {/* Checkbox / Selection Indicator */}
                        {!isAlreadyMember && (
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              borderWidth: 2,
                              borderColor: isSelected ? "#3B82F6" : "#52525B",
                              backgroundColor: isSelected
                                ? "#3B82F6"
                                : "transparent",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isSelected && <Check size={14} color="#FFFFFF" />}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}

              {/* Action Footer */}
              <View className="pt-4 mt-2 border-t border-zinc-800 flex-row items-center justify-between">
                <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                  {selectedUserIds.size} selected
                </ThemedText>

                <TouchableOpacity
                  onPress={handleAddMemberSubmit}
                  disabled={addingMember || selectedUserIds.size === 0}
                  style={{
                    backgroundColor:
                      selectedUserIds.size > 0 ? "#3B82F6" : "#3F3F46",
                    opacity: addingMember ? 0.7 : 1,
                  }}
                  className="px-6 py-2.5 rounded-xl flex-row items-center justify-center"
                >
                  {addingMember ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <ThemedText className="text-sm font-semibold text-white">
                      Add Selected
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Bottom Sheet Modal */}
        <Modal
          visible={isMenuVisible}
          transparent
          animationType="slide"
          onRequestClose={closeMenu}
        >
          <Pressable style={styles.modalOverlay} onPress={closeMenu}>
            <Pressable
              style={[
                styles.modalContent,
                { backgroundColor: colors.background },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Handlebar indicator */}
              <View style={styles.modalHandle} />

              {selectedMember &&
                (() => {
                  const memberName =
                    selectedMember.username ||
                    selectedMember.user?.username ||
                    selectedMember.firstName ||
                    selectedMember.name ||
                    "Member";

                  const isMemberAdmin =
                    selectedMember.role === "ADMIN" ||
                    selectedMember.role === "admin" ||
                    selectedMember.isAdmin;

                  return (
                    <>
                      <ThemedText style={styles.modalTitle}>
                        Manage {memberName}
                      </ThemedText>

                      {/* Action 1: Promote or Demote */}
                      <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => {
                          closeMenu();
                          if (isMemberAdmin) {
                            handleDemoteMember(selectedMember);
                          } else {
                            handlePromoteMember(selectedMember);
                          }
                        }}
                      >
                        {isMemberAdmin ? (
                          <UserMinus size={20} color="#EAB308" />
                        ) : (
                          <UserCheck size={20} color="#22C55E" />
                        )}
                        <ThemedText style={styles.modalOptionText}>
                          {isMemberAdmin
                            ? "Dismiss as Admin"
                            : "Make Group Admin"}
                        </ThemedText>
                      </TouchableOpacity>

                      {/* Action 2: Remove Member */}
                      <TouchableOpacity
                        style={[styles.modalOption, styles.destructiveOption]}
                        onPress={() => {
                          closeMenu();
                          handleRemoveMember(selectedMember);
                        }}
                      >
                        <UserX size={20} color="#EF4444" />
                        <ThemedText style={styles.destructiveText}>
                          Remove from Group
                        </ThemedText>
                      </TouchableOpacity>

                      {/* Action 3: Cancel */}
                      <TouchableOpacity
                        style={styles.cancelOption}
                        onPress={closeMenu}
                      >
                        <ThemedText style={styles.cancelText}>
                          Cancel
                        </ThemedText>
                      </TouchableOpacity>
                    </>
                  );
                })()}
            </Pressable>
          </Pressable>
        </Modal>

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
      </SafeAreaView>
    );
  }

  // ================= MAIN CHAT SCREEN =================
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        {/* Header */}
        <ThemedView
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}
          className="flex-row items-center justify-between px-4 py-3"
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
            className="p-2 rounded-full justify-center items-center"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewingDetails(true)}
            className="items-center flex-1 mx-3"
          >
            <ThemedText className="font-bold text-base" numberOfLines={1}>
              {group?.name || groupName || "Group Chat"}
            </ThemedText>
            
            <ThemedText
              style={{ color: colors.muted || "#a1a1aa" }}
              className="text-xs"
            >
              {filteredMembers?.length} {filteredMembers.length === 1 ? "member" : "members"}
              {filteredMembers.length > 0 ? ` • ${onlineUserIds.size} online` : ""}
              {socketStatus === "reconnecting" ? " • Reconnecting..." : ""}
              {socketStatus === "disconnected" ? " • Offline" : ""}
            </ThemedText>
          </TouchableOpacity>

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
            collapsable={false}
          >
            {/* Pinned Message Banner — visible at the top of the chat */}
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
                    style={{
                      color: "#f59e0b",
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    Pinned by {pinnedMessage.senderName}
                  </ThemedText>
                  <ThemedText
                    numberOfLines={1}
                    style={{
                      color: colors.muted || "#a1a1aa",
                      fontSize: 12,
                      marginTop: 1,
                    }}
                  >
                    {pinnedMessage.content || "Attachment"}
                  </ThemedText>
                </View>
                {currentUserIsAdmin && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleUnpinMessage();
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={colors.muted || "#a1a1aa"}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={(info) =>
                blockedUserIds.has(String(info.item.senderId ?? "").toLowerCase())
                  ? null
                  : renderMessageItem(info)
              }
              contentContainerStyle={{ paddingVertical: 10 }}
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={handleUserScroll}
              onContentSizeChange={() => {
                if (isJumpingRef.current) return;
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
              onScrollToIndexFailed={(info) => {
                // Fallback when the target item hasn't been measured yet
                setTimeout(() => {
                  flatListRef.current?.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: true,
                  });
                }, 50);
              }}
              ListEmptyComponent={
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
              {typingText}
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
          {group?.isLocked ? (
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

              {/* Reply Quote Bar — shown above the composer while replying */}
              {replyToMessage &&
                (() => {
                  const preview = getReplyQuotePreview(replyToMessage);
                  return (
                    <View
                      className="flex-row items-center px-3 py-2 mb-2 rounded-xl"
                      style={{
                        backgroundColor: colors.card || "transparent",
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View className="flex-1 mr-2">
                        <ThemedText
                          className="text-[11px] font-semibold"
                          style={{ color: colors.primary || "#3b82f6" }}
                        >
                          Replying to {replyToMessage.senderName}
                        </ThemedText>
                        <View className="flex-row items-center mt-0.5">
                          <Ionicons
                            name={preview.icon as any}
                            size={12}
                            color={colors.muted || "#71717a"}
                          />
                          <ThemedText
                            numberOfLines={1}
                            className="text-xs ml-1"
                            style={{ color: colors.muted || "#71717a" }}
                          >
                            {preview.label}
                          </ThemedText>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => setReplyToMessage(null)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="close"
                          size={18}
                          color={colors.muted || "#71717a"}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })()}

              {/* Input Row */}
              <View className="flex-row items-end mb-14">
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
                    editingMessage ? "Update message..." : "Type a message..."
                  }
                  placeholderTextColor={colors.muted || "#71717a"}
                  value={inputText}
                  onChangeText={handleInputChange}
                  multiline
                  scrollEnabled
                  textAlignVertical="center"
                />

                {/* Send Button */}
                <TouchableOpacity
                  className="w-10 h-10 rounded-full justify-center items-center mb-0.5"
                  style={{
                    backgroundColor:
                      inputText.trim() || selectedAttachments.length > 0 || selectedFile
                        ? "#3b82f6"
                        : colors.card,
                    borderWidth:
                      inputText.trim() || selectedAttachments.length > 0 || selectedFile
                        ? 0
                        : 1,
                    borderColor: colors.border,
                  }}
                  disabled={
                    (!inputText.trim() &&
                      selectedAttachments.length === 0 &&
                      !selectedFile) ||
                    sending
                  }
                  onPress={handleSendMessage}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons
                      name={editingMessage ? "checkmark" : "arrow-up"}
                      size={20}
                      color={
                        inputText.trim() || selectedAttachments.length > 0 || selectedFile
                          ? "#ffffff"
                          : colors.muted || "#71717a"
                      }
                    />
                  )}
                </TouchableOpacity>
              </View>
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

            {/* Reply — available on every message type */}
            <TouchableOpacity
              onPress={() =>
                selectedMessage && handleStartReply(selectedMessage)
              }
              className="flex-row items-center py-3"
            >
              <Ionicons
                name="arrow-undo-outline"
                size={20}
                color={colors.text}
              />
              <ThemedText className="ml-3 font-semibold">Reply</ThemedText>
            </TouchableOpacity>

            {/* Pin / Unpin Message — any group member, not for system messages */}
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
                    onPress={() =>
                      selectedMessage && handlePinMessage(selectedMessage)
                    }
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

            {/* Report / Block — someone else's message */}
            {selectedMessage &&
              !selectedMessage.isSystem &&
              selectedMessage.senderId &&
              selectedMessage.senderId.toLowerCase() !== currentUserId && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      const message = selectedMessage;
                      setSelectedMessage(null);
                      setReportingMessage(message);
                    }}
                    className="flex-row items-center py-3"
                  >
                    <Ionicons name="flag-outline" size={20} color="#ef4444" />
                    <ThemedText className="ml-3 font-semibold text-red-500">
                      Report Message
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleBlockSender(selectedMessage)}
                    className="flex-row items-center py-3"
                  >
                    <Ionicons name="ban-outline" size={20} color="#ef4444" />
                    <ThemedText className="ml-3 font-semibold text-red-500">
                      Block {selectedMessage.senderName ? `@${selectedMessage.senderName}` : "User"}
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}

            {/* Edit / Delete Options */}
            {selectedMessage?.senderId?.toLowerCase() === currentUserId && (
              <>
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
        onClose={() => {
          setShowGifts(false);
          setPendingGift(null);
        }}
        coinBalance={giftCoins}
        onSend={handleGiftSelected}
      />

      {/* Floating Combo Button */}
      {activeComboGift && (
        <FloatingComboButton
          gift={activeComboGift}
          coinBalance={giftCoins}
          onSend={() => handleComboSend(activeComboGift)}
          onTimeout={handleComboTimeout}
          onLocked={() => setShowGifts(true)}
        />
      )}

      {/* Gift Send Overlay (flying gift animation) */}
      <GiftSendOverlay ref={giftOverlayRef} />

      {/* Recipient Picker Modal */}
      <Modal
        visible={showRecipientPicker}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowRecipientPicker(false);
          setPendingGift(null);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-end bg-black/60">
            <KeyboardAvoidingView
              behavior="padding"
              style={{
                backgroundColor: colors.card || "#18181b",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderWidth: 1,
                borderColor: colors.border,
                maxHeight: "75%",
              }}
            >
              {/* Header */}
              <View className="flex-row justify-between items-center px-5 pt-5 pb-3">
                <ThemedText className="text-lg font-bold">
                  Send {pendingGift?.name || "Gift"} to...
                </ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    setShowRecipientPicker(false);
                    setPendingGift(null);
                  }}
                  className="p-1"
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Pending Gift Preview */}
              {pendingGift && (
                <View
                  className="flex-row items-center mx-5 mb-3 px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <ThemedText style={{ fontSize: 28, marginRight: 12 }}>
                    {pendingGift.icon}
                  </ThemedText>
                  <View className="flex-1">
                    <ThemedText className="font-semibold text-sm">
                      {pendingGift.name}
                    </ThemedText>
                    <ThemedText
                      style={{ color: colors.muted || "#a1a1aa" }}
                      className="text-xs"
                    >
                      {pendingGift.coins} coins
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* Search Input */}
              <View
                style={{
                  marginHorizontal: 20,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.background,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  height: 44,
                }}
              >
                <Search size={16} color="#71717A" />
                <TextInput
                  value={recipientSearch}
                  onChangeText={setRecipientSearch}
                  placeholder="Search members..."
                  placeholderTextColor={colors.muted || "#71717a"}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    color: colors.text,
                    fontSize: 14,
                  }}
                />
              </View>

              {/* Members List... */}
              <FlatList
                data={filteredMembers}
                keyExtractor={(item: any) =>
                  String(
                    item.userId ||
                      item.user?.id ||
                      item.user?._id ||
                      item.id ||
                      item._id,
                  )
                }
                style={{ maxHeight: 320 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View className="py-8 items-center">
                    <ThemedText style={{ color: "#71717A", fontSize: 13 }}>
                      No members found
                    </ThemedText>
                  </View>
                }
                renderItem={({ item: member }: any) => {
                  const rawId =
                    member.userId ||
                    member.user?.id ||
                    member.user?._id ||
                    member.id ||
                    member._id;
                  const cleanId = String(rawId || "").toLowerCase();
                  const name =
                    member.username ||
                    member.user?.username ||
                    member.user?.firstName ||
                    member.firstName ||
                    member.name ||
                    "Member";
                  const avatar =
                    member.profilePictureUrl ||
                    member.avatar ||
                    member.user?.profilePictureUrl ||
                    member.user?.avatar ||
                    "https://via.placeholder.com/100";
                  const isOnline = onlineUserIds.has(cleanId);

                  return (
                    <TouchableOpacity
                      onPress={() => confirmSendGift(cleanId)}
                      className="flex-row items-center px-5 py-3"
                      activeOpacity={0.7}
                    >
                      <View style={{ position: "relative" }}>
                        <ProfileFrame
                          frameId={member.profileFrame || member.user?.profileFrame}
                          uri={avatar}
                          size={44}
                          initial={name?.[0]?.toUpperCase()}
                        />
                        {isOnline && (
                          <View
                            style={{
                              position: "absolute",
                              bottom: 1,
                              right: 1,
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: "#22C55E",
                              borderWidth: 2,
                              borderColor: colors.card || "#18181b",
                            }}
                          />
                        )}
                      </View>
                      <View className="flex-1 ml-3">
                        <ThemedText className="font-semibold text-sm">
                          {name}
                        </ThemedText>
                        <ThemedText
                          style={{ color: colors.muted || "#a1a1aa" }}
                          className="text-xs"
                        >
                          {isOnline ? "Online" : "Offline"}
                        </ThemedText>
                      </View>
                      <Ionicons
                        name="gift-outline"
                        size={20}
                        color="#3b82f6"
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ReportReasonSheet
        visible={reportingMessage !== null}
        subject="message"
        onSelect={handleReportReason}
        onClose={() => setReportingMessage(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionList: {
    width: "100%",
    borderRadius: 16,
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
