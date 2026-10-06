import React from "react";
import { Image, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";

import { useTheme } from "@/hooks/useTheme";
import { leaderboard } from "@/data/leaderboard";

export default function TopThree() {
  const { colors } = useTheme();

  const second = leaderboard[1];
  const first = leaderboard[0];
  const third = leaderboard[2];

  return (
    <ThemedView className="mb-8 bg-transparent">
      <View className="flex-row items-end justify-between">

        {/* 2nd */}
        <PodiumCard
          user={second}
          place={2}
          height={110}
          medal="#C0C0C0"
          colors={colors}
        />

        {/* 1st */}
        <PodiumCard
          user={first}
          place={1}
          height={150}
          medal="#FFD700"
          colors={colors}
        />

        {/* 3rd */}
        <PodiumCard
          user={third}
          place={3}
          height={90}
          medal="#CD7F32"
          colors={colors}
        />

      </View>
    </ThemedView>
  );
}

interface PodiumProps {
  user: any;
  place: number;
  medal: string;
  height: number;
  colors: any;
}

function PodiumCard({
  user,
  place,
  medal,
  height,
  colors,
}: PodiumProps) {
  return (
    <View className="items-center mt-4 px-4 rounded-3xl">

      {/* Crown */}

      {place === 1 && (
        <ThemedText className="mb-2 text-2xl">👑</ThemedText>
      )}

      {/* Avatar */}

      <Image
        source={{ uri: user.avatar }}
        className={`rounded-full border-4 ${
          place === 1
            ? "h-24 w-24"
            : "h-20 w-20"
        }`}
        style={{
          borderColor: medal,
        }}
      />

      {/* Name */}

      <ThemedText
        numberOfLines={1}
        className="mt-3 font-bold"
      >
        {user.name}
      </ThemedText>

      {/* Level */}

      <View
        className="mt-1 rounded-full px-3 py-1"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <ThemedText className="text-xs">
          {user.appLevel.icon} {user.appLevel.name}
        </ThemedText>
      </View>

      {/* Podium */}

      <View
        className="mt-4 w-28 items-center justify-center rounded-t-3xl"
        style={{
          height,
          backgroundColor: medal,
        }}
      >
        <ThemedText className="text-3xl font-bold text-white">
          {place}
        </ThemedText>
      </View>
    </View>
  );
}