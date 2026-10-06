import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ProfileFrame } from "@/components/ui/ProfileFrame";

interface User {
  id: string;
  name?: string;
  username?: string;
  avatar?: string;
  profilePictureUrl?: string | null;
}

interface Props {
  taggedUsers?: User[];
  onPressRow?: () => void;
}

export default function TagPeopleSection({
  taggedUsers = [],
  onPressRow,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Show up to 3 avatars inline, stacking remainder in a "+ X" badge
  const maxVisibleAvatars = 3;
  const visibleUsers = taggedUsers.slice(0, maxVisibleAvatars);
  const remainingCount = taggedUsers.length > maxVisibleAvatars ? taggedUsers.length - maxVisibleAvatars : 0;

  const avatarUri = (user: User) =>
    user.profilePictureUrl || user.avatar || "";

  const names = taggedUsers
    .map((user) => `@${user.username || user.name || "user"}`)
    .join(", ");

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPressRow}
      style={[styles.container, { borderBottomColor: colors.border }]}
    >
      <View style={styles.content}>
        {/* Left Side: Tag People Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="people-outline"
            size={22}
            color="#F59E0B" // Vibrant golden-orange icon color
          />
        </View>

        {/* Middle: Title & Tagged Users Row */}
        <View style={styles.rightContent}>
          <ThemedText style={styles.title}>{t("post.tagPeople")}</ThemedText>

          {/* Overlapping Avatar List */}
          {taggedUsers.length > 0 && (
            <View style={styles.avatarStack}>
              {visibleUsers.map((user, index) => (
                <View
                  key={user.id}
                  style={[
                    styles.avatarWrapper,
                    {
                      marginLeft: index === 0 ? 0 : -8, // Overlap effect
                      zIndex: visibleUsers.length - index, // Keep left-most avatar on top
                    },
                  ]}
                >
                  <ProfileFrame
                    frameId={(user as any).profileFrame}
                    uri={avatarUri(user) || undefined}
                    size={24}
                  />
                </View>
              ))}

              {/* Remainder Badge */}
              {remainingCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    + {remainingCount}
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          {/* Tagged Usernames */}
          {taggedUsers.length > 0 && (
            <ThemedText
              numberOfLines={1}
              style={styles.namesText}
            >
              {names}
            </ThemedText>
          )}
        </View>

        {/* Right Side: Chevron Arrow */}
        <View style={styles.arrowContainer}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color="#9CA3AF"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1, // Matches bottom separator lines of the image
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 30,
    alignItems: "flex-start",
  },
  rightContent: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingRight: 10,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  namesText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#F59E0B",
  },
  avatarWrapper: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FFF", // White border separator for overlapping look
    overflow: "hidden",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  badge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  arrowContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});