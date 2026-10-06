/**
 * ringtones.ts
 *
 * Available ringtone options for incoming calls.
 * To add a new ringtone:
 *   1. Drop the file into assets/sounds/
 *   2. Add an entry to RINGTONES below
 *   3. Add a require() entry to RINGTONE_ASSETS below
 */

export interface Ringtone {
  id: string;
  name: string;
}

export const RINGTONES: Ringtone[] = [
  { id: "default", name: "Default" },
  { id: "app_default", name: "App Default" },
  { id: "social", name: "Social" },
  { id: "gift", name: "Gift Received" },
  { id: "challenge", name: "Battle Challenge" },
  { id: "victory", name: "Victory" },
  { id: "message", name: "New Message" },
  { id: "group", name: "Group Activity" },
  { id: "levelup", name: "Level Up" },
  { id: "reward", name: "Reward Received" },
  { id: "alert", name: "Important Alert" },
  { id: "vibrate", name: "Vibrate Only" },
];

/**
 * Static map of ringtone id → require() asset.
 * Add new entries here when you add new sound files to assets/sounds/.
 */
export const RINGTONE_ASSETS: Record<string, ReturnType<typeof require>> = {
  default: require("@/assets/sounds/ringing.mp3"),
  app_default: require("@/assets/sounds/01_app_default_8s.wav"),
  social: require("@/assets/sounds/02_social_notification_8s.wav"),
  gift: require("@/assets/sounds/03_gift_received_9s.wav"),
  challenge: require("@/assets/sounds/04_battle_challenge_9s.wav"),
  victory: require("@/assets/sounds/05_victory_10s.wav"),
  message: require("@/assets/sounds/06_new_message_8s.wav"),
  group: require("@/assets/sounds/07_group_activity_8s.wav"),
  levelup: require("@/assets/sounds/08_level_up_9s.wav"),
  reward: require("@/assets/sounds/09_reward_received_8s.wav"),
  alert: require("@/assets/sounds/10_important_alert_9s.wav"),
  vibrate: require("@/assets/sounds/silent.mp3"),
};

/** Default ringtone id if the user hasn't selected one */
export const DEFAULT_RINGTONE_ID = "default";

/**
 * Get a ringtone asset by its id.
 * Falls back to the default if the id is not found.
 */
export function getRingtoneAsset(id: string): ReturnType<typeof require> {
  return RINGTONE_ASSETS[id] || RINGTONE_ASSETS[DEFAULT_RINGTONE_ID];
}

/**
 * Get ringtone metadata by its id.
 */
export function getRingtoneById(id: string): Ringtone {
  return RINGTONES.find((r) => r.id === id) || RINGTONES[0];
}
