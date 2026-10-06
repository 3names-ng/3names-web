import React from "react";
import {
  User,
  ShieldCheck,
  Lock,
  Receipt,
  Trophy,
  ShieldOff,
  Bell,
  Moon,
  HelpCircle,
  Flag,
  AudioLines,
  Briefcase,
  Database,
  Globe,
} from "lucide-react-native";
import { MenuItemProps } from "@/components/profile/menuItem";

// Define strong types for profile navigation routes
export type AppRoute =
  | "/(features)/profile/editProfileScreen"
  | "/profile/edit"
  | "/profile/student-verification"
  | "/profile/privacy-security"
  | "/(features)/privacySecurityScreen"
  | "/(features)/studentVerificationScreen"
  | "/wallet/coins"
  | "/wallet/gifts"
  | "/wallet/transactions"
  | "/profile/achievements"
  | "/profile/campus-level"
  | "/community/friends"
  | "/community/groups"
  | "/(features)/profile/earningsScreen"
  | "/settings/notifications"
  | "/(features)/notificationSettingsScreen"
  | "/settings/appearance"
  | "/settings/language"
  | "/(features)/blockedUsersScreen"
  | "/(features)/waveformSettingsScreen"
  | "/(features)/helpSupportScreen"
  | "/(features)/reportProblemScreen"
  | "/(features)/accountActionScreen"
  | "/(features)/storageCacheScreen"
  | "/(features)/languageSettingsScreen"
  | "/(features)/ringtoneSettingsScreen"
  | "/support/help"
  | "/support/report"
  |"/(features)/levelsScreen"
  | "#"

export interface ProfileMenuItemProps extends MenuItemProps {
  route: AppRoute;
}

const iconColor = "#FFFFFF";
const iconSize = 22;

export const ACCOUNT_ITEMS: ProfileMenuItemProps[] = [
  {
    title: "profile.editProfile",
    route: "/(features)/profile/editProfileScreen",
    icon: <User size={iconSize} color={iconColor} />,
  },
  {
    title: "profile.studentVerification",
    subtitle: "profile.verifyIdentity",
    route: "/(features)/studentVerificationScreen",
    icon: <ShieldCheck size={iconSize} color="#22C55E" />,
  },
  {
    title: "settings.privacySecurity",
    route: "/(features)/privacySecurityScreen",
    icon: <Lock size={iconSize} color="#F59E0B" />,
  },
];


export const ACTIVITY_ITEMS: ProfileMenuItemProps[] = [

  {
    title: "wallet.transactions",
    route: "/(features)/profile/earningsScreen",
    icon: <Receipt size={iconSize} color="#A855F7" />,
  },
  {
    title: "profile.achievements",
    route: "/(features)/levelsScreen",
    icon: <Trophy size={iconSize} color="#FACC15" />,
  },

];

// export const COMMUNITY_ITEMS: ProfileMenuItemProps[] = [

//   {
//     title: "Communities",
//     route: "/community/groups",
//     icon: <Users size={iconSize} color="#A855F7" />,
//   },
//   {
//     title: "Past Questions",
//     route: "/academics/past-questions",
//     icon: <FileText size={iconSize} color="#38BDF8" />,
//   },
// ];

export const SETTINGS_ITEMS: ProfileMenuItemProps[] = [
  {
    title: "settings.notifications",
    route: "/(features)/notificationSettingsScreen",
    icon: <Bell size={iconSize} color="#38BDF8" />,
  },
  // {
  //   title: "settings.ringtone",
  //   route: "/(features)/ringtoneSettingsScreen",
  //   icon: <AudioLines size={iconSize} color="#22C55E" />,
  // },
  {
    title: "settings.blockedUsers",
    route: "/(features)/blockedUsersScreen",
    icon: <ShieldOff size={iconSize} color="#FE2C55" />,
  },
  {
    title: "settings.waveform",
    subtitle: "settings.waveformDesc",
    route: "/(features)/waveformSettingsScreen",
    icon: <AudioLines size={iconSize} color="#F472B6" />,
  },
  {
    title: "settings.appearance",
    value: "Dark",
    route: "#",
    icon: <Moon size={iconSize} color="#8B5CF6" />,
  },
  {
    title: "settings.language",
    route: "/(features)/languageSettingsScreen",
    icon: <Globe size={iconSize} color="#06B6D4" />,
  },

  {
    title: "settings.storageCache",
    subtitle: "settings.manageCachedData",
    route: "/(features)/storageCacheScreen",
    icon: <Database size={iconSize} color="#06B6D4" />,
  },
  {
    title: "settings.helpSupport",
    route: "/(features)/helpSupportScreen",
    icon: <HelpCircle size={iconSize} color="#F59E0B" />,
  },
  {
    title: "settings.reportProblem",
    route: "/(features)/reportProblemScreen",
    icon: <Flag size={iconSize} color="#EF4444" />,
  },
];