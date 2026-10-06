import { router } from "expo-router";

/**
 * Data payload attached to Expo push notifications by the backend.
 * See PushNotificationsService.sendToUser → data: { notificationId, targetType, targetId, isDM?, chatId? }
 */
export interface NotificationData {
  notificationId?: string;
  targetType?: string;
  targetId?: string;
  type?: string;
  /** The notification type (e.g. "story_reply", "story_reaction", "new_follower") */
  notificationType?: string;
  /** Present when the message is a DM (1:1 conversation) */
  isDM?: boolean;
  /** The group/conversation ID — used as the chatScreen's `id` param */
  chatId?: string;
  /** Department War battle identifier for war notifications */
  battleId?: string;
  /** Raw app route sent for treasure hunt pushes (e.g. "/(tabs)/home") — see TreasureHunt.route on the backend */
  route?: string;
  /** Set for comment-related notifications — the specific comment/reply to scroll to and highlight */
  commentId?: string;
  /** Sender profile info for DMs — displayed in the chat header */
  senderProfile?: { id: string; username?: string; firstName?: string; lastName?: string; profilePictureUrl?: string; profileFrame?: string | null };
}

/**
 * Maps a backend NotificationTargetType to an Expo Router pathname + params.
 *
 * The backend sends `targetType` (e.g. "post", "group") and `targetId` (the UUID).
 * Some notification types override the target (e.g. `new_follower` → navigate to the
 * actor's profile, not the follower relationship).
 */
function resolveRoute(data: NotificationData): {
  pathname: string;
  params?: Record<string, string>;
} {
  const { targetType, targetId, type, isDM, chatId, notificationType, route, commentId } = data;

  // Treasure hunt pushes carry a raw app route (where the treasure is
  // hidden) instead of a targetType/targetId pair — navigate there directly.
  if (
    (type === "treasure_hunt_created" || notificationType === "treasure_hunt_created" ||
      type === "treasure_hunt_reminder" || notificationType === "treasure_hunt_reminder") &&
    route
  ) {
    return { pathname: route };
  }

  // ── DM messages ────────────────────────────────────────────────────────────
  // When `isDM: true` is in the push payload, route to the DM chat screen
  // instead of the group detail screen.
  if (type === "group_message" && isDM && chatId) {
    const params: Record<string, string> = { id: chatId };
    if (data.senderProfile) {
      params.user = JSON.stringify(data.senderProfile);
    }
    return {
      pathname: "/(features)/chatScreen",
      params,
    };
  }

  // Type-level overrides (when targetType alone isn't enough)
  if ((type === "new_follower" || notificationType === "new_follower") && targetId) {
    return { pathname: "/(features)/userProfile/[id]", params: { id: targetId } };
  }

  if (type === "level_up" || notificationType === "level_up") {
    return { pathname: "/(features)/levelsScreen" };
  }

  if ((type === "group_message" || notificationType === "group_message") && targetId) {
    return { pathname: "/(features)/groupDetailScreen", params: { id: targetId } };
  }

  if (type === "gift_received" || notificationType === "gift_received") {
    return { pathname: "/(tabs)/profile" };
  }

  // Department War notifications — navigate to war hub or battle arena
  if (
    type === "war_challenged" || notificationType === "war_challenged" ||
    type === "war_battle_won" || notificationType === "war_battle_won" ||
    type === "war_battle_lost" || notificationType === "war_battle_lost" ||
    type === "war_battle_draw" || notificationType === "war_battle_draw" ||
    type === "war_scheduled_reminder" || notificationType === "war_scheduled_reminder"
  ) {
    // If we have a battleId, go to the battle arena; otherwise go to war hub
    const battleId = data.battleId as string | undefined;
    if (battleId && (type?.includes('won') || type?.includes('lost') || type?.includes('draw'))) {
      return { pathname: "/(features)/departmentWar" };
    }
    if (battleId && type === 'war_challenged') {
      return { pathname: "/(features)/departmentWar" };
    }
    return { pathname: "/(features)/departmentWar" };
  }

  // Comment/reply notifications — navigate to post detail screen
  if (type === "post_tagged" || notificationType === "post_tagged") {
    return { pathname: "/(features)/postDetailScreen", params: { id: targetId ?? "" } };
  }

  if (type === "post_liked" || notificationType === "post_liked") {
    return { pathname: "/(features)/postDetailScreen", params: { id: targetId ?? "" } };
  }

  if (type === "post_commented" || notificationType === "post_commented") {
    return {
      pathname: "/(features)/postDetailScreen",
      // openComments is unconditional — always jump straight to the comments
      // sheet for this notification type, even when there's no commentId to
      // highlight (e.g. notifications created before that field existed).
      params: { id: targetId ?? "", openComments: "1", ...(commentId ? { commentId } : {}) },
    };
  }

  if (type === "post_reshared" || notificationType === "post_reshared") {
    return { pathname: "/(features)/postDetailScreen", params: { id: targetId ?? "" } };
  }

  if (type === "comment_liked" || notificationType === "comment_liked") {
    return {
      pathname: "/(features)/postDetailScreen",
      params: { id: targetId ?? "", openComments: "1", ...(commentId ? { commentId } : {}) },
    };
  }

  if (type === "comment_replied" || notificationType === "comment_replied") {
    return {
      pathname: "/(features)/postDetailScreen",
      params: { id: targetId ?? "", openComments: "1", ...(commentId ? { commentId } : {}) },
    };
  }

  // Story notification overrides — navigate to Inbox tab (chatListScreen)
  // with story ID so the Stories component auto-opens the viewer
  if (type === "story_reply" || notificationType === "story_reply") {
    return { pathname: "/(tabs)/chatListScreen", params: { openStoryId: targetId ?? "" } };
  }

  // Student Union verification decision — go to Events where the user
  // can see their status or resubmit a document
  if (
    type === "student_union_verified" || notificationType === "student_union_verified" ||
    type === "student_union_rejected" || notificationType === "student_union_rejected"
  ) {
    return { pathname: "/(features)/events" };
  }

  // Student identity verification decision — go to the student verification
  // screen where the user sees their badge status or can resubmit documents
  if (
    type === "student_verification_approved" || notificationType === "student_verification_approved" ||
    type === "student_verification_rejected" || notificationType === "student_verification_rejected"
  ) {
    return { pathname: "/(features)/studentVerificationScreen" };
  }

  if (type === "story_reaction" || notificationType === "story_reaction") {
    return { pathname: "/(tabs)/chatListScreen", params: { openStoryId: targetId ?? "" } };
  }

  // Target-type based routing
  switch (targetType) {
    case "post":
    case "comment":
      return {
        pathname: "/(features)/postDetailScreen",
        params: { id: targetId! },
      };

    case "story":
      // Stories are shown on the Inbox tab (chatListScreen)
      return { pathname: "/(tabs)/chatListScreen", params: { openStoryId: targetId ?? "" } };

    case "group":
      return {
        pathname: "/(features)/groupDetailScreen",
        params: { id: targetId! },
      };

    case "past_question":
      return { pathname: "/(features)/pastQuestionsScreen" };

    case "hostel":
      return {
        pathname: "/(features)/hostel/[id]",
        params: { id: targetId! },
      };

    case "marketplace_item":
      return {
        pathname: "/(features)/marketplace/[id]",
        params: { id: targetId! },
      };

    case "event":
      return { pathname: "/(features)/events" };

    case "user":
      return {
        pathname: "/(features)/userProfile/[id]",
        params: { id: targetId! },
      };

    case "job":
      return {
        pathname: "/(features)/jobDetailScreen",
        params: { id: targetId! },
      };

    case "election":
      return targetId
        ? { pathname: "/(features)/elections/[id]", params: { id: targetId } }
        : { pathname: "/(features)/elections" };

    default:
      // Unknown type → go to the notification list screen
      return { pathname: "" };
  }
}

/**
 * Navigate to the relevant screen based on a push notification's data payload.
 */
export function navigateFromNotification(data: Record<string, unknown> | undefined) {
  if (!data) {
    router.push("/");
    return;
  }

  const notificationData: NotificationData = {
    notificationId: data.notificationId as string | undefined,
    targetType: data.targetType as string | undefined,
    targetId: data.targetId as string | undefined,
    type: data.type as string | undefined,
    notificationType: (data.type as string) || undefined,
    isDM: data.isDM as boolean | undefined,
    chatId: data.chatId as string | undefined,
    senderProfile: data.senderProfile as NotificationData['senderProfile'],
    route: data.route as string | undefined,
    commentId: data.commentId as string | undefined,
  };

  const { pathname, params } = resolveRoute(notificationData);

  try {
    router.push({ pathname: pathname as any, params } as any);
  } catch {
    // Fallback: if the dynamic route fails, go to notifications list
    router.push("/");
  }
}
