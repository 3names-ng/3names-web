import React from "react";
import { Image, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { ProfileFrame } from "@/components/ui/ProfileFrame";

export interface SuggestedUserCardProps {
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    school?: string;
    department?: string;
    verified?: boolean;
    following?: boolean;
    profileFrame?: string | null;
  };
}

export default function SuggestedUserCard({ user }: SuggestedUserCardProps) {
  return (
    <ThemedView className="rounded-3xl p-4 flex-row items-center" style={{ borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.16)" }}>
      <ProfileFrame
        frameId={user.profileFrame}
        uri={user.avatar}
        size={64}
        initial={user.name?.[0]?.toUpperCase()}
      />

      <View className="ml-4 flex-1">
        <View className="flex-row items-center">
          <ThemedText className="text-lg font-bold">{user.name}</ThemedText>
          {user.verified ? (
            <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" style={{ marginLeft: 8 }} />
          ) : null}
        </View>

        <ThemedText className="text-sm opacity-70">@{user.username}</ThemedText>
        <ThemedText className="text-sm opacity-70 mt-1">
          {user.school ?? user.department ?? "Student"}
        </ThemedText>
      </View>

      <Pressable
        style={{
          paddingVertical: 10,
          paddingHorizontal: 18,
          borderRadius: 999,
          backgroundColor: user.following ? "#EDE9FE" : "#EEF2FF",
        }}
      >
        <ThemedText style={{ color: user.following ? "#7C3AED" : "#4338CA" }}>
          {user.following ? "Following" : "Follow"}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}
