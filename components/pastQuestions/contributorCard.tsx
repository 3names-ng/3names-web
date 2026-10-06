import React from "react";
import { TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { ProfileFrame } from "../ui/ProfileFrame";
import { LevelBadge } from "@/components/levelBadge";

interface Props {
  rank?: number;
  name: string;
  avatar: string;
  profileFrame?: string | null;
  appLevel?: any | null;
  uploads: number;
  isFollowing?: boolean;
  onFollow?: () => void;
}

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

export default function ContributorCard({
  rank,
  name,
  avatar,
  profileFrame,
  appLevel,
  uploads,
  isFollowing = false,
  onFollow,
}: Props) {

     const { colors } = useTheme();
     const rankColor = rank ? RANK_COLORS[rank] : undefined;

  return (
    <ThemedView
      className=" mb-4 rounded-3xl bg-white p-5 dark:bg-neutral-900"
      style={{
         borderWidth: 1,
    borderColor: rank && rank <= 3 ? rankColor : colors.border,
      }}
    >
      <View className="flex-row items-center">
        {/* Rank Badge */}
        {rank && (
          <View style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: rankColor || colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}>
            <ThemedText style={{
              color: rank <= 3 ? '#fff' : colors.text,
              fontWeight: '800',
              fontSize: 13,
            }}>
              #{rank}
            </ThemedText>
          </View>
        )}
            <ProfileFrame
              frameId={profileFrame}
              uri={avatar}
              size={42}
              initial={name?.[0]?.toUpperCase()}
              fallbackColor={colors.card}
            />
        {/* <Image
          source={{ uri: avatar }}
          className="h-16 w-16 rounded-full"
        /> */}

        <View className="ml-4 flex-1">
          <ThemedText className="text-lg font-bold text-gray-900">
            {name}
          </ThemedText>
          {appLevel && (
            <View style={{ marginTop: 2 }}>
              <LevelBadge level={appLevel} />
            </View>
          )}
        </View>
      </View>

      {/* Stats */}

      <View className="mt-5 flex-row justify-between">
        <View className="items-center">
          <ThemedText className="text-xl font-bold text-gray-900">
            {uploads}
          </ThemedText>

          <ThemedText className="mt-1 text-sm text-gray-500">
            Uploads
          </ThemedText>
        </View>

       

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onFollow}
          style={{
            height: 48,
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 16,
            backgroundColor: isFollowing ? "#1F2937" : "#7C3AED",
            paddingHorizontal: 20,
          }}
        >
          <Ionicons
            name={isFollowing ? "person-remove-outline" : "person-add-outline"}
            size={18}
            color="#fff"
          />

          <ThemedText style={{ marginLeft: 8, fontWeight: "600", color: "#fff" }}>
            {isFollowing ? "Following" : "Follow"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}