import React, { useCallback } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const router = useRouter();
  const { isHydrated, isAuthenticated, hasLoggedInBefore, user } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      // 1. Wait until state is restored from storage
      if (!isHydrated) return;

      // 2. Check if first time opening app
      if (!hasLoggedInBefore) {
        router.replace("/welcomeScreen" as any);
        return;
      }

      // 3. Check authentication status
      if (!isAuthenticated || !user) {
        router.replace("/auth/loginScreen" as any);
        return;
      }

      // 3.5. Suspended accounts skip onboarding/tabs and land on a
      // read-only screen until the suspension is lifted.
      if (user.status === "suspended") {
        router.replace("/auth/suspendedScreen" as any);
        return;
      }

      // 4. Onboarding check
      const isComplete = Boolean(user?.isOnboardingComplete);

      if (!isComplete) {
        // Explicitly replace to onboarding
        router.replace("/auth/profileCompleteScreen" as any);
        return;
      }

      // 5. Main App
      router.replace("/(tabs)" as any);
    }, [isHydrated, isAuthenticated, hasLoggedInBefore, user])
  );

  return (
    <View className="flex-1 justify-center items-center bg-black">
      <ActivityIndicator size="large" color="#ffffff" />
      <Text className="mt-4 text-sm text-white/70">Loading…</Text>
    </View>
  );
}