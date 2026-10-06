import React, { useEffect, useState, useRef } from "react";
import { DeviceEventEmitter, Image, View } from "react-native";
import { showSuccess } from "@/components/ui/toast";
import { ThemedView } from "../ui/ThemedView";
import { ThemedText } from "../ui/ThemedText";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { LevelBadge } from "../levelBadge";
import { ProfileFrame } from "../ui/ProfileFrame";
import { coinService } from "@/service/post.service";
import { userService } from "@/service/profile.Service";

interface LevelData {
  currentStreak: number;
  giftsGiven: number;
  giftsReceived: number;
  progress: number;
  totalXp: number;
  level: {
    id?: string;
    level: number;
    title: string;
    emoji: string;
    color: string;
    badge: string;
    minXp: number;
    maxXp: number;
    rewardCoins?: number;
    perks?: string[];
  };
  nextLevel: {
    level: number;
    title: string;
    emoji: string;
  };
}

export default function UserCard() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { colors } = useTheme();

  // Track the user's previous level to detect level-ups
  const prevLevelRef = useRef<number | null>(user?.appLevel?.level ?? null);

  const getPeriodGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 16) return "Good afternoon";
    return "Good evening";
  };

  const balance = user?.coins ?? 0;
  const [levelData, setLevelData] = useState<LevelData | null>(null);


  const fetchBalance = async () => {
  try {
    const response = await coinService.getBalance();
    const rawNum = typeof response?.balance === "number" ? response.balance : response;
    
    if (typeof rawNum === "number" && !isNaN(rawNum)) {
      const sanitizedBalance = Math.max(0, rawNum);
      updateUser({ coins: sanitizedBalance });
    }
  } catch (error) {
    console.error("Error fetching live coin balance:", error);
  }
};

  const fetchLevel = async () => {
    try {
      const response = await userService.getUserLevel();
      if (response && response.level) {
        const newLevel = response.level.level;
        const previousLevel = prevLevelRef.current;

        // Trigger toast if the user reached a higher level
        if (previousLevel !== null && newLevel > previousLevel) {
          showSuccess(`Congratulations! You reached Level ${newLevel}: ${response.level.title}!`);
        }

        // Update stored reference to current level
        prevLevelRef.current = newLevel;
        setLevelData(response);

        updateUser({
          appLevel: {
            id: response.level.id || user?.appLevel?.id || "",
            level: response.level.level,
            title: response.level.title,
            badge: response.level.badge,
            emoji: response.level.emoji,
            color: response.level.color,
            minXp: response.level.minXp,
            maxXp: response.level.maxXp,
            rewardCoins: response.level.rewardCoins || 0,
            perks: response.level.perks || [],
          },
        });
      }
    } catch (error) {
      console.error("Error fetching live level progress:", error);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchLevel();

    const sub = DeviceEventEmitter.addListener(
      "GIFT_TRANSACTION_COMPLETE",
      (data?: { newBalance?: number }) => {
        if (data && typeof data.newBalance === "number") {
          updateUser({ coins: data.newBalance });
        } else {
          fetchBalance();
        }
        fetchLevel();
      },
    );

    return () => {
      sub.remove();
    };
  }, []);

  const progressPercent = levelData
    ? Math.min(Math.max(levelData.progress * 100, 0), 100)
    : 0;

  return (
    <ThemedView className="mx-4 mb-4 mt-3 flex-row items-center justify-between rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* Left Section */}
      <View className="flex-1 flex-row items-center">
        <View style={{ marginRight: 12 }}>
          <ProfileFrame
            frameId={user?.profileFrame}
            uri={user?.profilePictureUrl}
            size={64}
            initial={user?.username?.[0]?.toUpperCase()}
            fallbackColor={colors.primary}
          />
        </View>

        <View className="flex-1">
          <ThemedText className="mb-1 text-base font-bold">
            {getPeriodGreeting()}, {user?.username || "User"} 👋
          </ThemedText>

          <LevelBadge level={user?.appLevel} />

          <View className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
            <View
              className="h-full rounded-full bg-violet-600"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>
      </View>

      {/* Divider */}
      <View className="mx-4 h-16 w-px bg-gray-200 dark:bg-neutral-700" />

      {/* Right Section */}
      <View className="items-center justify-center">
        <View className="flex-row items-center">
          <ThemedText className="ml-1 text-lg font-bold">
            🪙 {balance}
          </ThemedText>
        </View>

        <ThemedText className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Campus Coins
        </ThemedText>
      </View>
    </ThemedView>
  );
}