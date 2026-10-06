// Web stand-in for expo-notifications. Expo push tokens don't exist in a
// browser (usePushNotifications bails out because Device.isDevice is false),
// so this only covers what the app calls: permissions via the Notification
// API, local notifications via `new Notification()`, and inert listeners.

type Subscription = { remove: () => void };
const inert = (): Subscription => ({ remove() {} });

type PermissionStatus = "granted" | "denied" | "undetermined";
type PermissionResponse = {
  status: PermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
  expires: "never";
};

function permission(): PermissionResponse {
  const p = typeof Notification === "undefined" ? "denied" : Notification.permission;
  const status: PermissionStatus = p === "default" ? "undetermined" : (p as PermissionStatus);
  return { status, granted: status === "granted", canAskAgain: status !== "denied", expires: "never" };
}

export type Notification = any;
export type NotificationRequest = any;
export type NotificationResponse = any;
export type NotificationChannel = any;
export type NotificationContentInput = { title?: string | null; body?: string | null; data?: Record<string, unknown> };

export const AndroidImportance = { UNKNOWN: 0, UNSPECIFIED: 1, NONE: 2, MIN: 3, LOW: 4, DEFAULT: 5, HIGH: 6, MAX: 7 } as const;
export const AndroidNotificationPriority = { MIN: "min", LOW: "low", DEFAULT: "default", HIGH: "high", MAX: "max" } as const;
export const SchedulableTriggerInputTypes = {
  DATE: "date",
  TIME_INTERVAL: "timeInterval",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
  CALENDAR: "calendar",
} as const;

export function setNotificationHandler(_handler: unknown): void {}

export async function getPermissionsAsync(): Promise<PermissionResponse> {
  return permission();
}

export async function requestPermissionsAsync(_opts?: unknown): Promise<PermissionResponse> {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    await Notification.requestPermission();
  }
  return permission();
}

export async function getExpoPushTokenAsync(_opts?: unknown): Promise<{ data: string; type: "expo" }> {
  throw new Error("Expo push tokens are not available on web");
}

export async function getDevicePushTokenAsync(): Promise<{ data: string; type: "web" }> {
  throw new Error("Device push tokens are not available on web");
}

export async function scheduleNotificationAsync(request: {
  content: NotificationContentInput;
  trigger?: unknown;
}): Promise<string> {
  if (permission().granted) {
    const { title, body, data } = request.content;
    new Notification(title ?? "", { body: body ?? undefined, data });
  }
  return String(Date.now());
}

export async function cancelScheduledNotificationAsync(_id: string): Promise<void> {}
export async function cancelAllScheduledNotificationsAsync(): Promise<void> {}
export async function getAllScheduledNotificationsAsync(): Promise<unknown[]> {
  return [];
}
export async function dismissNotificationAsync(_id: string): Promise<void> {}
export async function dismissAllNotificationsAsync(): Promise<void> {}

export async function setNotificationChannelAsync(_id: string, _channel: unknown): Promise<null> {
  return null;
}
export async function getNotificationChannelsAsync(): Promise<unknown[]> {
  return [];
}
export async function deleteNotificationChannelAsync(_id: string): Promise<void> {}

export async function setBadgeCountAsync(count: number): Promise<boolean> {
  const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
  try {
    if (count > 0) await nav.setAppBadge?.(count);
    else await nav.clearAppBadge?.();
    return true;
  } catch {
    return false;
  }
}
export async function getBadgeCountAsync(): Promise<number> {
  return 0;
}

export async function registerTaskAsync(_taskName: string): Promise<null> {
  return null;
}
export async function unregisterTaskAsync(_taskName: string): Promise<null> {
  return null;
}

export function getLastNotificationResponse(): NotificationResponse | null {
  return null;
}
export async function getLastNotificationResponseAsync(): Promise<NotificationResponse | null> {
  return null;
}

export const addNotificationReceivedListener = (_l: (n: Notification) => void) => inert();
export const addNotificationResponseReceivedListener = (_l: (r: NotificationResponse) => void) => inert();
export const addNotificationsDroppedListener = (_l: () => void) => inert();
export const addPushTokenListener = (_l: (t: unknown) => void) => inert();
export function removeNotificationSubscription(sub: Subscription): void {
  sub?.remove();
}
