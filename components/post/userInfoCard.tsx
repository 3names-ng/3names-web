import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "../ui/ThemedView";
import { LevelBadge } from "../levelBadge";
import { ProfileFrame } from "../ui/ProfileFrame";

export default function UserInfoCard() {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);

  return (
    <View style={styles.container}>
      {/* Left */}

      <View style={styles.left}>
        <ProfileFrame
          frameId={user?.profileFrame}
          uri={user?.profilePictureUrl}
          size={50}
          initial={(user?.firstName?.[0] || user?.lastName?.[0] || user?.username?.[0] || "")?.toUpperCase()}
          fallbackColor={colors.primary}
        />

        <View style={styles.info}>
          <ThemedText className="" style={styles.name}>
            {user?.username}
          </ThemedText>
          <LevelBadge level={user?.appLevel} />
        </View>
      </View>

      {/* Audience */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 10,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  info: {
    marginLeft: 6,
    flex: 1,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    // textTransform:"capitalize"
  },

  levelBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF4FF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  levelText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },

  audienceButton: {
    height: 38,
    paddingHorizontal: 14,

    borderRadius: 14,
    borderWidth: 1,

    flexDirection: "row",
    alignItems: "center",
  },

  audienceText: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: "600",
  },
});
