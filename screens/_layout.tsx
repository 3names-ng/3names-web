import { useEffect, useState, useCallback, useRef } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import "react-native-reanimated";
import "../global.css";
import { useColorScheme } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GlobalAlertBanner } from "@/components/alertBanner";
import { LevelUpAlert } from "@/components/ui/customToast";
import { useAuthStore } from "@/store/authStore";
import "@/service/session";
import { Sentry } from "@/utils/sentry";
import { usePrivacySettingsStore } from "@/store/privacySettingsStore";
import { useGamificationSocket, type LevelUpEvent } from "@/service/useGamificationSocket";
import { useProfileSocket } from "@/service/useProfileSocket";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useOnlineStatusSocket } from "@/hooks/useOnlineStatusSocket";
// import StreamVideoProvider from "@/components/call/StreamVideoProvider";
import { useWarSocket } from "@/service/useWarSocket";
import { useDepartmentWarStore } from "@/store/departmentWarStore";
import { IncomingChallengeModal } from "@/components/departmentWar/incomingChallengeModal";
import { IncomingCoinBattleModal } from "@/components/coinBattle/incomingCoinBattleModal";
import { FloatingTreasureButton } from "@/components/treasureHunt/floatingTreasureButton";
import PushNotificationBanner from "@/components/PushNotificationBanner";
import GiftSendOverlay, { type GiftSendOverlayRef 

} from "@/components/gift/GiftSendOverlay";
import { showError } from "@/components/ui/toast";

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { useAutoStorageCleanup } from "./(features)/storageCacheScreen";

// Prevent splash screen from auto-hiding before assets finish loading
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "index",
};

configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

// Catches render errors anywhere below the root layout so a crash shows a
// recoverable screen instead of a blank one.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    SplashScreen.hideAsync();
    Sentry.captureException(error);
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <View className="flex-1 items-center justify-center bg-[#050608] px-8">
      <Text className="text-white text-xl font-bold mb-2 text-center">
        Something went wrong
      </Text>
      <Text className="text-gray-400 text-center mb-6">
        An unexpected error occurred. Please try again.
      </Text>
      <TouchableOpacity
        onPress={retry}
        className="bg-white rounded-full px-8 py-3"
        accessibilityRole="button"
      >
        <Text className="text-black font-semibold">Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

function RootLayout() {
  const { colorScheme } = useColorScheme();
  const activeTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  // App-wide: Silently purge temporary media picking & generated video preview caches
  useAutoStorageCleanup();

  // Sync privacy settings from the backend once the user is signed in
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const syncPrivacy = usePrivacySettingsStore((state) => state.syncFromServer);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  useEffect(() => {
    if (isAuthenticated && isHydrated) {
      syncPrivacy();
      refreshUser();
    }
  }, [isAuthenticated, isHydrated, syncPrivacy, refreshUser]);

  // Level-up alert state — rendered as a standalone overlay so it always
  // appears above every other screen element (including the GiftSendOverlay
  // which uses zIndex: 999).
  const [levelUpData, setLevelUpData] = useState<LevelUpEvent | null>(null);
  const levelUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  // Register for push notifications when the user is authenticated
  usePushNotifications();

  // App-wide: track online/offline status of all users in real time
  useOnlineStatusSocket();

  // App-wide: listen for real-time profile updates so every user sees
  // profile frame / picture changes immediately.
  useProfileSocket();

  // App-wide: whenever anyone levels up, show a celebratory banner to every
  // user currently online, regardless of which screen they're on.
  useGamificationSocket({
    onUserLeveledUp: (data) => {
      setLevelUpData(data);
      // Auto-dismiss after 4 seconds
      if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current);
      levelUpTimerRef.current = setTimeout(() => {
        setLevelUpData(null);
      }, 4000);
    },
  });

  const enqueueChallenge = useDepartmentWarStore((state) => state.enqueueChallenge);
  useWarSocket({
    onChallengeSent: (data) => {
      if (data.type !== 'scheduled') {
        enqueueChallenge(data);
      }
    },
    onChallengeRejected: (data) => {
      // Show a toast when someone cancels, rejects, or a battle expires
      const name = data.by?.firstName || data.by?.username || 'Someone';
      if (data.reason === 'cancelled') {
        showError(`${name} cancelled the battle.`);
      } else if (data.reason === 'expired') {
        showError('A battle request has expired.');
      } else if (data.reason === 'rejected') {
        showError(`${name} declined your battle request.`);
      }
    },
  });

  // GiftSendOverlay ref for treasure hunt claim animation
  const giftOverlayRef = useRef<GiftSendOverlayRef | null>(null);

  // Load variable font files
  const [fontsLoaded, fontError] = useFonts({
    Montserrat: require("../assets/fonts/Montserrat-VariableFont_wght.ttf"),
    Montserrat_Italic: require("../assets/fonts/Montserrat-Italic-VariableFont_wght.ttf"),
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 3000);

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      clearTimeout(timeout);
    }

    return () => clearTimeout(timeout);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={activeTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* <StreamVideoProvider> */}
        
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: activeTheme.colors.background,
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(features)" options={{ headerShown: false }} />
          
          <Stack.Screen
            name="welcomeScreen"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        <GlobalAlertBanner />
        <PushNotificationBanner />

        {/* Level-up overlay — zIndex: 10000 beats the GiftSendOverlay's 999 */}
        {levelUpData && (
          <LevelUpAlert
            visible={true}
            onClose={dismissLevelUp}
            {...levelUpData}
          />
        )}

        {/* Department War: incoming challenge accept/reject popup */}
        <IncomingChallengeModal />

        {/* Coin Battle: incoming challenge accept/reject popup */}
        <IncomingCoinBattleModal />

        {/* Treasure Hunt: floating gift button */}
        <FloatingTreasureButton giftOverlayRef={giftOverlayRef} />

        {/* Gift Send Overlay (flying gift animation for treasure claims) */}
        <GiftSendOverlay ref={giftOverlayRef} />

        {/* </StreamVideoProvider> */}
      </GestureHandlerRootView>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
