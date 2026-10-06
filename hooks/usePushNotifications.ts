import { notificationService } from "@/service/notification.service";
import { useAuthStore } from "@/store/authStore";
import { usePendingGiftOverlayStore } from "@/store/pendingGiftOverlayStore";
import { usePushNotificationBannerStore } from "@/store/pushNotificationBannerStore";
import { navigateFromNotification } from "@/utils/notifications/deepLink";
import { notificationTypeLabel } from "@/utils/notifications/formatPushMessage";
import { useCallback, useEffect, useRef, useState } from "react";
import { DeviceEventEmitter, Platform } from "react-native";

// ─── Safe native module imports ──────────────────────────────────────────────
// These modules only exist in dev builds, NOT in Expo Go.
// We lazily require them so the app doesn't crash in Expo Go.
let Notifications: typeof import("expo-notifications") | null = null;
let Device: typeof import("expo-device") | null = null;
let Constants: typeof import("expo-constants") | null = null;

function loadNativeModules(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Notifications = require("expo-notifications");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Device = require("expo-device");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Constants = require("expo-constants");
    return true;
  } catch {
    console.warn(
      "[Push] Native modules unavailable (Expo Go?). Push notifications disabled.",
    );
    return false;
  }
}

const NATIVES_AVAILABLE = loadNativeModules();

// ─── Notification channels (Android) ──────────────────────────────────────────

const NOTIFICATION_CHANNELS: {
  id: string;
  name: string;
  importance: number; // Notifications.AndroidImportance value
  sound?: string;
  vibrationPattern?: number[];
}[] = [
  // "_v2" ids: the original "default"/"social"/"system" channels were created without an
  // explicit `sound`, which Android's notification channel API locks in as permanently silent.
  // Channel sound/importance can't be changed after first creation, so these use fresh ids
  // rather than relying on every device re-creating the channel from scratch.
  { id: "default_3", name: "General", importance: 4, sound: "default" }, // DEFAULT
  {
    id: "social_v2",
    name: "Social",
    importance: 4,
    sound: "default",
    vibrationPattern: [0, 200, 100, 200],
  }, // HIGH
  {
    id: "messages_v2",
    name: "Messages",
    importance: 4,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
  },
  {
    id: "gifts_v2",
    name: "Gifts",
    importance: 4,
    sound: "default",
    vibrationPattern: [0, 100, 50, 100, 50, 100],
  },
  { id: "system_v2", name: "System", importance: 3, sound: "default" }, // DEFAULT
];

/**
 * Configure how incoming notifications are displayed when the app is in the foreground.
 */
if (NATIVES_AVAILABLE && Notifications) {
  // Notifications may be typed as a union with null; assert via any to avoid TS 'never' errors
  (Notifications as any).setNotificationHandler({
    handleNotification: async (notification: any) => {
      const data = notification?.request?.content?.data;
      const currentUserId = useAuthStore.getState().user?.id;

      // 1. Suppress if the current user sent the gift/action to themselves
      const isSelfSender = Boolean(
        data?.senderId && currentUserId && data.senderId === currentUserId,
      );

      // 2. Suppress system banner for live gift events while the app is active
      //    (WebSockets play the real-time GiftSendOverlay animation instead)
      const isGiftEvent = data?.type === "gift_received";

      if (isSelfSender) {
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }

      return {
        shouldShowBanner: !isGiftEvent,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
    handleSuccess: (id: string) => {
      console.log("[Push] Notification presented successfully:", id);
    },
    handleError: (id: string, error: any) => {
      console.error(
        "[Push] Failed to present notification:",
        id,
        error?.message || error,
      );
    },
  });
}

// ─── Android channel setup ────────────────────────────────────────────────────

async function ensureNotificationChannels(): Promise<void> {
  if (!NATIVES_AVAILABLE || !Notifications || Platform.OS !== "android") return;

  for (const channel of NOTIFICATION_CHANNELS) {
    try {
      // On Android, omitting `sound` entirely gives the system default sound.
      // Passing the string "default" is NOT a valid raw resource name and
      // causes Android to silently disable sound on the channel.
      const channelConfig: Record<string, any> = {
        name: channel.name,
        importance: channel.importance as any,
        enableVibrate: Boolean(channel.vibrationPattern),
        vibrationPattern: channel.vibrationPattern,
        enableLights: true,
        lightColor: "#6C47FF",
      };
      await Notifications.setNotificationChannelAsync(
        channel.id,
        channelConfig as any,
      );
    } catch (err) {
      console.warn(`[Push] Failed to create channel ${channel.id}:`, err);
    }
  }
}

// ─── Push token registration ──────────────────────────────────────────────────

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!NATIVES_AVAILABLE || !Notifications || !Device || !Constants) {
    console.warn(
      "[Push] Native modules not available — push notifications disabled (Expo Go?)",
    );
    return null;
  }

  console.log(
    "[Push] Starting registration. Device.isDevice:",
    Device.isDevice,
  );

  if (!Device.isDevice) {
    console.warn("[Push] Push notifications require a physical device.");
    return null;
  }

  // Android — create notification channels
  if (Platform.OS === "android") {
    await ensureNotificationChannels();
    console.log("[Push] Android notification channels created.");
  }

  // Check / request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log("[Push] Existing notification permission:", existingStatus);
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    console.log("[Push] Requesting notification permission...");
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log("[Push] Permission request result:", finalStatus);
  }

  if (finalStatus !== "granted") {
    console.warn(
      "[Push] Notification permission not granted. Status:",
      finalStatus,
    );
    return null;
  }

  // Get the Expo push token
  const projectId =
    (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId ??
    "bfe01cf4-3eae-4595-8122-9e26878cf042";

  console.log("[Push] Project ID:", projectId);

  if (!projectId) {
    console.warn("[Push] EAS project ID not found.");
    return null;
  }

  try {
    console.log("[Push] Calling getExpoPushTokenAsync...");
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log(
      "[Push] Got push token:",
      tokenData.data?.substring(0, 40) + "...",
    );
    return tokenData.data;
  } catch (error: any) {
    console.error("[Push] Failed to get push token:", error?.message || error);
    return null;
  }
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

async function syncBadgeCount(): Promise<void> {
  if (!NATIVES_AVAILABLE || !Notifications) return;
  try {
    const { count } = await notificationService.getUnreadCount();
    await Notifications.setBadgeCountAsync(count ?? 0);
  } catch {
    // Best-effort — don't crash the app over a badge
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook: registers for push notifications on mount (when authenticated),
 * manages the badge count, and handles notification taps via deep-linking.
 *
 * Returns `expoPushToken` and a `refreshBadge` helper.
 * Gracefully degrades in Expo Go (no native modules).
 */
export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  const refreshBadge = useCallback(() => {
    syncBadgeCount();
  }, []);

  useEffect(() => {
    // Create Android notification channels IMMEDIATELY on mount —
    // independent of auth state. This ensures channels exist before any
    // push notification arrives, even on cold start from a notification tap.
    if (NATIVES_AVAILABLE && Notifications && Platform.OS === "android") {
      ensureNotificationChannels();
    }

    if (!isAuthenticated || !NATIVES_AVAILABLE || !Notifications) return;

    let mounted = true;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (!mounted) return;

      if (token) {
        setExpoPushToken(token);
        console.log("[Push] Token obtained:", token?.substring(0, 40) + "...");

        try {
          console.log("[Push] Registering token with backend...");
          await notificationService.registerPushToken(token, Platform.OS);
          console.log("[Push] ✅ Token registered with backend successfully.");
        } catch (err: any) {
          console.error(
            "[Push] ❌ Failed to register token with backend:",
            err?.message || err,
          );
          console.error("[Push] Response data:", err?.response?.data);
          console.error("[Push] Response status:", err?.response?.status);
        }
      } else {
        console.warn(
          "[Push] No token obtained — skipping backend registration.",
        );
      }

      await syncBadgeCount();

      notificationListener.current =
        Notifications!.addNotificationReceivedListener((notification: any) => {
          console.log(
            "[Push] Foreground notification:",
            notification.request.content,
          );

          const data = notification.request.content.data;
          const currentUserId = useAuthStore.getState().user?.id;

          // Increment badge only for incoming notifications from other users
          if (!data?.senderId || data.senderId !== currentUserId) {
            Notifications!.getBadgeCountAsync().then((current: number) => {
              Notifications!.setBadgeCountAsync(current + 1);
            });
          }

          // If a gift_received push arrives while the app is in the foreground,
          // store it in the pending gift overlay store so the chat screen can
          // show the gift overlay even when the WebSocket was disconnected.
          if (data?.type === "gift_received") {
            usePendingGiftOverlayStore.getState().setPendingGift({
              senderId: data.senderId,
              senderName: data.senderName || "Someone",
              giftName: data.giftName || "a gift",
              giftIcon: data.giftIcon || "🎁",
              giftId: data.giftId,
              giftVideoUrl: data.giftVideoUrl || "",
              giftAnimationUrl: data.giftAnimationUrl || "",
              giftCoinCost: Number(data.giftCoinCost) || 0,
              giftRarity: data.giftRarity || "rare",
              groupId: data.groupId,
              receivedAt: Date.now(),
            });
          }

          // Show in-app push notification banner
          const title =
            data?.title ||
            notificationTypeLabel(data?.type || "", data || {}) ||
            "New Notification";
          const body = data?.body || data?.message || "";
          usePushNotificationBannerStore.getState().show({
            title,
            body,
            type: data?.type || "",
            data: data || {},
          });

          // Notify listeners (e.g. badge counter)
          DeviceEventEmitter.emit("push:notification_received", data);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener(
          (response: any) => {
            console.log("[Push] Notification tapped:", response);
            syncBadgeCount();
            navigateFromNotification(
              response.notification.request.content.data as Record<
                string,
                unknown
              >,
            );
          },
        );

      // Handle notification tap when the app was killed (cold start).
      // getLastNotificationResponse returns the notification that opened the app,
      // if any. This must be checked separately because the listener above only
      // fires for notifications received while the app is already running.
      const lastResponse = Notifications.getLastNotificationResponse();
      if (lastResponse?.notification) {
        console.log(
          "[Push] Cold-start notification response:",
          lastResponse.notification.request.content,
        );
        navigateFromNotification(
          lastResponse.notification.request.content.data as Record<
            string,
            unknown
          >,
        );
      }
    })();

    return () => {
      mounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);

  return { expoPushToken, refreshBadge };
}
