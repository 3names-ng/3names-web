import React from "react";
import { StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import PrimaryButton from "@/components/auth/primaryButton";
import AuthFooter from "@/components/auth/authFooter";
import AuthCarousel from "@/components/auth/authCarousel";
import { useAuthStore } from "@/store/authStore";

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const setHasLoggedInBefore = useAuthStore((state) => state.setHasLoggedInBefore);

  const handleGetStarted = () => {
    setHasLoggedInBefore(true);
    router.replace("/auth/signUpScreen");
  };

  const handleSignIn = () => {
    setHasLoggedInBefore(true);
    router.replace("/auth/loginScreen");
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <StatusBar backgroundColor={colors.background} />

      <ThemedView
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 30,
          justifyContent: "space-between",
        }}
      >
        <View>
          <ThemedText
            style={{
              textAlign: "center",
              color: "#7C3AED",
              fontWeight: "700",
              marginBottom: 16,
            }}
          />
        </View>

        {/* Header */}
        <View>
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ThemedText
                style={{
                  fontSize: 26,
                  fontWeight: "900",
                  letterSpacing: -0.9,
                }}
              >
                Welcome to
              </ThemedText>

              <FontAwesome6
                name="graduation-cap"
                size={28}
                color={colors.primary}
              />
            </View>

            <ThemedText
              style={{
                fontSize: 38,
                fontWeight: "900",
                marginTop: 0,
                color: colors.primary,
                letterSpacing: 1,
              }}
            >
              3NAMES!
            </ThemedText>
          </View>

          <ThemedText
            style={{
              color: colors.secondary,
              fontSize: 18,
              marginTop: -12,
              lineHeight: 28,
              fontWeight: "bold",
            }}
          >
            Join thousands of students{"\n"} learning, selling, buying and{" "}
            {"\n"} connecting.
          </ThemedText>
        </View>

        {/* Illustration */}
        <ThemedView className="bg-transparent">
          <AuthCarousel />
        </ThemedView>

        {/* Bottom Actions */}
        <View>
          <PrimaryButton
            title="Get Started"
            onPress={handleGetStarted}
          />

          <View style={{ marginTop: 2 }}>
            <AuthFooter
              text="Already have an account?"
              actionText="Sign In"
              onPress={handleSignIn}
            />
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}