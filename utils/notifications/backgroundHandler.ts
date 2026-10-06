/**
 * Registers the background notification handler using expo-task-manager.
 *
 * Must be called as early as possible — outside the React tree — so the OS
 * can invoke the headless task even when the app isn't running. See index.js,
 * which calls this before loading expo-router/entry.
 *
 * Our backend sends data-only push payloads (no `notification` field), so
 * Android never displays anything automatically when the app is backgrounded
 * or killed; we have to schedule the local notification ourselves here.
 *
 * On iOS, notifications with title/body are displayed automatically by the OS.
 * This handler is primarily needed for Android data-only background notifications.
 */
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { getSenderName, notificationTypeLabel } from "./formatPushMessage";

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_NOTIFICATION_HANDLER";

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("[Background Handler] Task error:", error);
    return;
  }

  if (!data) return;

  const notificationData = (data as Record<string, string>) || {};

  const title =
    notificationData.title ||
    notificationTypeLabel(notificationData.type || "", notificationData) ||
    "New Notification";
  const body =
    notificationData.body ||
    notificationData.message ||
    getSenderName(notificationData) ||
    "";

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: notificationData,
    },
    trigger: null,
  });
});

export function registerBackgroundMessageHandler() {
  // Ensure the notification channel exists (required for Android 13+ permission prompt)
  Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });

  // Register the background task for headless notification processing
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {
    // Task may already be registered — this is fine
  });
}
