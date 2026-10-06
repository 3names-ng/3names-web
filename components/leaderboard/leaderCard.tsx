import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { LevelBadge, type AppLevel } from "../levelBadge";
import { ProfileFrame } from "../ui/ProfileFrame";

interface Props {
  rank: number;
  avatar: string;
  name: string;
  level?: number;
  appLevel?: Partial<AppLevel>;
  xp?: number;
  verified?: boolean;
  profileFrame?: string | null;
  onPress?: () => void;
}

export default function LeaderCard({
  rank,
  avatar,
  name,
  level = 1,
  appLevel,
  xp = 0,
  verified = false,
  profileFrame,
  onPress,
}: Props) {
  const { colors } = useTheme();

  const medal = () => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        marginHorizontal: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 18,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {/* Rank */}
        <View
          style={{
            width: 40,
            alignItems: "center",
          }}
        >
          <ThemedText
            style={{
              fontSize: 22,
              fontWeight: "700",
            }}
          >
            {medal()}
          </ThemedText>
        </View>

        {/* Avatar */}
        <View style={{ marginLeft: 10 }}>
          <ProfileFrame
            frameId={profileFrame}
            uri={avatar}
            size={56}
            initial={name?.[0]?.toUpperCase()}
          />
        </View>

        {/* User Details */}
        <View
          style={{
            flex: 1,
            marginLeft: 15,
          }}
        >
          {/* Name */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <ThemedText
              numberOfLines={1}
              style={{
                fontWeight: "700",
                fontSize: 17,
                maxWidth: 160,
              }}
            >
              {name}
            </ThemedText>

            {verified && (
              <MaterialIcons
                name="verified"
                size={18}
                color="#3B82F6"
                style={{
                  marginLeft: 5,
                }}
              />
            )}
          </View>

          {/* Level Badge */}
          <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center" }}>
            <LevelBadge level={appLevel} />
          </View>
        </View>

        {/* XP / Score */}
        {/* <View style={{ alignItems: "flex-end" }}>
          <ThemedText
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: "#6D28D9",
            }}
          >
            {xp.toLocaleString()}
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 12,
              color: colors.text + "80",
              fontWeight: "600",
              marginTop: 2,
            }}
          >
            XP
          </ThemedText>
        </View> */}
      </View>
    </TouchableOpacity>
  );
}