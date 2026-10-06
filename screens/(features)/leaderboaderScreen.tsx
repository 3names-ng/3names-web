import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/header";
import HeroBanner from "@/components/leaderboard/heroBanner";
import LeaderList from "@/components/leaderboard/leaderList";
import LeaderListSkeleton from "@/components/leaderboard/leaderListSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import CategoryTabs from "@/components/leaderboard/categoryTab";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { LeaderboardParams, leaderboardService } from "@/service/leaderboard.Service";
import { useAuthStore } from "@/store/authStore";
import AuthHeader from "@/components/auth/authHeader";

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const showSkeleton = useDelayedLoading(loading);
 const user = useAuthStore((state) => state.user);

  const fetchLeaderboard = async (params: LeaderboardParams = { scope: "department" }) => {
    try {
      setLoading(true);
      const data = await leaderboardService.getByLeaderboard(params);
  
      setLeaders(data || []);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const departmentId = user?.departmentId ?? undefined; 
    fetchLeaderboard({ scope: "department", departmentId });
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent={false}
        barStyle="dark-content"
        backgroundColor={colors.background}
      />

       <AuthHeader 
        title={t("leaderboard.title")} 
        subtitle={t("leaderboard.subtitle")} 
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <HeroBanner leaders={leaders} loading={loading} />

        <CategoryTabs onSelectScope={(params) => fetchLeaderboard(params)} />

        {loading ? (
          showSkeleton ? <LeaderListSkeleton /> : null
        ) : (
          <LeaderList leaders={leaders} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});