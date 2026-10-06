/**
 * Shared formatting helpers for FCM data payloads, used by both the
 * foreground handler (usePushNotifications) and the background handler
 * (registered in index.js) so tray notifications and in-app banners read
 * the same way.
 */

/**
 * Extract a sender display name from the FCM data payload.
 * Checks several common field shapes the backend may use.
 */
export function getSenderName(data: Record<string, string>): string {
  // Direct name fields
  if (data.senderName) return data.senderName;
  if (data.senderFirstName) {
    return data.senderLastName
      ? `${data.senderFirstName} ${data.senderLastName}`
      : data.senderFirstName;
  }
  if (data.followerName) return data.followerName;
  if (data.username) return data.username;
  if (data.firstName) {
    return data.lastName ? `${data.firstName} ${data.lastName}` : data.firstName;
  }
  // Nested senderProfile (JSON string)
  if (data.senderProfile) {
    try {
      const profile = JSON.parse(data.senderProfile);
      if (profile.firstName) {
        return profile.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : profile.firstName;
      }
      if (profile.username) return profile.username;
    } catch {}
  }
  return "";
}

/** Maps FCM data type to a human-readable message, including sender name when available */
export function notificationTypeLabel(type: string, data: Record<string, string>): string {
  const name = getSenderName(data);
  const who = name || "Someone";

  switch (type) {
    case "new_follower":
      return name ? `${name} started following you` : "New follower!";
    case "gift_received":
      return name
        ? `${who} sent you ${data.giftName || "a gift"}`
        : "You received a gift!";
    case "post_liked":
      return name ? `${who} liked your post` : "Your post got a like!";
    case "post_commented":
      return name ? `${who} commented on your post` : "New comment on your post!";
    case "post_reshared":
      return name ? `${who} reshared your post` : "Your post was reshared!";
    case "story_reply":
      return name ? `${who} replied to your story` : "New story reply!";
    case "story_reaction":
      return name ? `${who} reacted to your story` : "New story reaction!";
    case "group_message":
      return name ? `${who} sent you a message` : "New message!";
    case "level_up":
      return "Level up! 🎉";
    case "marketplace_item_listed":
      return "New marketplace listing!";
    default:
      return "";
  }
}
