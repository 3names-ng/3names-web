import React, { useEffect, useState, useCallback } from "react";
import { StatusBar, StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ProfileHeader from "@/components/profile/profileHeader";
import ProfileStats from "@/components/profile/profileStats";
import { router, useFocusEffect } from "expo-router";
import ProfileTabs from "@/components/profile/profileTabs";
import { UserProfileStats, userService } from "@/service/profile.Service";
import { useAuthStore } from "@/store/authStore";
import { departmentWarService, type UserWarStats } from "@/service/departmentWar.service";
import { useProfileCacheStore } from "@/store/profileCacheStore";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

export default function ProfileScreen() {
  const {colors} =useTheme()
  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [warStats, setWarStats] = useState<UserWarStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const user = useAuthStore((state) => state.user);
 
  // Offline cache (persisted to AsyncStorage) — lets profile data show without network
  const cachedStats = useProfileCacheStore((state) => state.stats);
  const cachedWarStats = useProfileCacheStore((state) => state.warStats);
  const profileCacheRehydrated = useProfileCacheStore((state) => state.rehydrated);
  const setCachedStats = useProfileCacheStore((state) => state.setStats);
  const setCachedWarStats = useProfileCacheStore((state) => state.setWarStats);

  // Show persisted stats immediately (works offline) while the network fetches run
  useEffect(() => {
    if (!profileCacheRehydrated) return;
    if (stats === null && cachedStats) setStats(cachedStats);
    if (warStats === null && cachedWarStats) setWarStats(cachedWarStats);
  }, [profileCacheRehydrated, cachedStats, cachedWarStats, stats, warStats]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileStats();
      fetchWarStats();
    }, [])
  );

  const fetchProfileStats = async () => {
    try {
      setLoadingStats(true);
      const data = await userService.getMyStats();
      setStats(data);
      // Keep a local snapshot so profile stats still show when offline
      setCachedStats(data);
    } catch (error) {
      // Offline / network error — cached stats (if any) stay on screen
      console.error("Failed to fetch user stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchWarStats = async () => {
    try {
      const data = await departmentWarService.getMyStats();
      setWarStats(data);
      // Keep a local snapshot so war stats still show when offline
      setCachedWarStats(data);
    } catch (error) {
      // War stats might not exist yet — that's fine
    }
  };

  // Combine upper section components into one Header element
  const renderProfileHeaderSection = () => (
    <ThemedView>
      <ProfileStats
        profile={user as any}
        stats={stats ?? undefined}
        onFollowersPress={() => {
          if (!user?.id) return;
          router.push({
            pathname: "/followersFollowingScreen",
            params: {
              userId: user.id,
              initialTab: "followers",
              username: user.username,
            },
          });
        }}
        onFollowingPress={() => {
          if (!user?.id) return;
          router.push({
            pathname: "/followersFollowingScreen",
            params: {
              userId: user.id,
              initialTab: "following",
              username: user.username,
            },
          });
        }}
      />
      {/* Department War Stats */}
      {warStats && warStats.totalBattles > 0 && (
        <TouchableOpacity
          onPress={() => router.push("/(features)/departmentWar")}
          activeOpacity={0.8}
          style={[styles.warStatsCard, {borderWidth:1, borderColor:colors.border}]}
        >
          <ThemedView style={styles.warStatsHeader}>
            {/* <Ionicons name="flash" size={18} color="#6C3EF4" /> */}
          <ThemedText style={styles.warStatsTitle}>⚔️ Brain Battle</ThemedText>
            <Ionicons name="chevron-forward" size={16} color="#8A8A94" />
          </ThemedView>
          <ThemedView style={styles.warStatsRow}>
            <ThemedView style={styles.warStatItem}>
              <ThemedText style={styles.warStatValue}>{warStats.totalBattles}</ThemedText>
              <ThemedText style={[styles.warStatLabel,{color:colors.muted}]}>Battles</ThemedText>
            </ThemedView>
            <ThemedView style={styles.warStatItem}>
              <ThemedText style={[styles.warStatValue, { color: '#10B981' }]}>{warStats.wins}</ThemedText>
              <ThemedText style={[styles.warStatLabel,{color:colors.muted}]}>Wins</ThemedText>
            </ThemedView>
            <ThemedView style={styles.warStatItem}>
              <ThemedText style={[styles.warStatValue, { color: '#EF4444' }]}>{warStats.losses}</ThemedText>
              <ThemedText style={[styles.warStatLabel,{color:colors.muted}]}>Losses</ThemedText>
            </ThemedView>
            <ThemedView style={styles.warStatItem}>
              <ThemedText style={styles.warStatValue}>
                {warStats.totalBattles > 0 ? `${Math.round((warStats.wins / warStats.totalBattles) * 100)}%` : '0%'}
              </ThemedText>
              <ThemedText style={[styles.warStatLabel,{color:colors.muted}]}>Win Rate</ThemedText>
            </ThemedView>
            {warStats.currentWinStreak > 0 && (
              <ThemedView style={styles.warStatItem}>
                <ThemedText style={[styles.warStatValue, { color: '#F59E0B' }]}>🔥{warStats.currentWinStreak}</ThemedText>
                <ThemedText style={[styles.warStatLabel,{color:colors.muted}]}>Streak</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </TouchableOpacity>
      )}
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Fixed top nav header */}
      <ProfileHeader
        profile={user as any}
        onMenu={() => router.push("/profile/menuScreen")}
      />

      {/* Main Single List Container */}
      <ProfileTabs headerComponent={renderProfileHeaderSection()} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  warStatsCard: {
    // backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginHorizontal: 16,
    // borderWidth: 1,
    // borderColor: '#2C2C2E',
  },
  warStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warStatsTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    // color: '#FFFFFF',
  },
  warStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  warStatItem: {
    alignItems: 'center',
  },
  warStatValue: {
    fontSize: 18,
    fontWeight: '800',
    // color: '#FFFFFF',
  },
  warStatLabel: {
    fontSize: 11,
    // color: '#8A8A94',
    marginTop: 2,
  },
});
