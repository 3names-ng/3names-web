import React from "react";
import { Image, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";
import { ProfileFrame } from "../ui/ProfileFrame";
import { SkeletonCircle } from "../ui/skeleton";

type LeaderItem = {
  id?: string;
  giftsGiven?: number;
  totalXp?: number;
  user?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    profilePictureUrl?: string;
    profileFrame?: string | null;
  };
  avatar?: string;
  name?: string;
  username?: string;
  profilePictureUrl?: string;
};

type HeroBannerProps = {
  leaders: LeaderItem[];
  /** While true, empty podium spots show placeholder avatars. */
  loading?: boolean;
};

export default function HeroBanner({ leaders = [], loading = false }: HeroBannerProps) {
  const getLeaderDetails = (item?: LeaderItem) => {
    if (!item) return null;

    const avatar =
      item.user?.profilePictureUrl ||
      item.user?.avatar ||
      item.profilePictureUrl ||
      item.avatar ||
      "https://via.placeholder.com/150";

    const name =
     
      item?.user?.username ||
      item.name ||
      "Student";

    const profileFrame = item.user?.profileFrame || null;

    return { avatar, name, profileFrame };
  };

  const first = getLeaderDetails(leaders[0]);
  const second = getLeaderDetails(leaders[1]);
  const third = getLeaderDetails(leaders[2]);

  return (
    <LinearGradient
      colors={["#6D28D9", "#4C1D95", "#5B21B6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        marginHorizontal: 20,
        borderRadius: 28,
        padding: 22,
        overflow: "hidden",
        marginBottom: 24,
        marginTop: 20,
      }}
    >
      {/* Background Glow */}
      <View
        style={{
          position: "absolute",
          right: -80,
          top: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      />

      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="trophy" color="#FFD54F" size={20} />
            <ThemedText style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginLeft: 10 }}>
              Leaderboard
            </ThemedText>
          </View>

          <ThemedText style={{ color: "#E9D5FF", fontSize: 14, marginTop: 8, lineHeight: 22 }}>
            See top performing students and climb the ranks!
          </ThemedText>
        </View>

        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/2583/2583344.png" }}
          style={{ width: 60, height: 60 }}
        />
      </View>

      {/* Podium */}
      <View style={{ height: 125, justifyContent: "flex-end", alignItems: "center" }}>
        <View style={{ position: "absolute", bottom: 55, flexDirection: "row", alignItems: "flex-end", justifyContent: "center", width: "100%", zIndex: 10 }}>
          {/* 2nd Place */}
          <View style={{ width: 75, alignItems: "center" }}>
            {second ? (
              <ProfileFrame frameId={second.profileFrame} uri={second.avatar} size={54} initial={second.name?.[0]?.toUpperCase()} />
            ) : loading ? (
              <SkeletonCircle size={54} tone="onDark" />
            ) : null}
          </View>

          {/* 1st Place */}
          <View style={{ width: 100, alignItems: "center" }}>
            {first ? (
              <>
                <Ionicons name="trophy" size={22} color="#FFD54F" style={{ position: "absolute", top: -18, zIndex: 2 }} />
                <ProfileFrame frameId={first.profileFrame} uri={first.avatar} size={68} initial={first.name?.[0]?.toUpperCase()} />
              </>
            ) : loading ? (
              <SkeletonCircle size={68} tone="onDark" />
            ) : null}
          </View>

          {/* 3rd Place */}
          <View style={{ width: 75, alignItems: "center" }}>
            {third ? (
              <ProfileFrame frameId={third.profileFrame} uri={third.avatar} size={54} initial={third.name?.[0]?.toUpperCase()} />
            ) : loading ? (
              <SkeletonCircle size={54} tone="onDark" />
            ) : null}
          </View>
        </View>

        {/* Blocks */}
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <PodiumBlock rank={2} name={second?.name} height={45} width={75} />
          <PodiumBlock rank={1} name={first?.name} height={65} width={100} />
          <PodiumBlock rank={3} name={third?.name} height={55} width={75} />
        </View>

        <View style={{ width: 250, height: 8, backgroundColor: "#5B21B6", borderRadius: 6 }} />
      </View>
    </LinearGradient>
  );
}

function PodiumBlock({ rank, name, height, width }: { rank: number; name?: string; height: number; width: number }) {
  return (
    <View
      style={{
        width,
        height,
        backgroundColor: rank === 1 ? "#8B5CF6" : "#7C3AED",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6,
      }}
    >
      <ThemedText style={{ color: "#fff", fontSize: rank === 1 ? 24 : 22, fontWeight: "900", marginTop: rank === 1 ? 10 : 0 }}>
        {rank}
      </ThemedText>

      {name && (
        <ThemedText numberOfLines={1} style={{ color: "#E9D5FF", fontSize: 10, fontWeight: "700", marginTop: 2, textAlign: "center" }}>
          {name}
        </ThemedText>
      )}
    </View>
  );
}