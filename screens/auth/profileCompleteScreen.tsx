import React from "react";
import { Image, View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/ThemedText";
import FeatureItem from "@/components/auth/featureItem";
import SkipButton from "@/components/auth/skipButton";
import PrimaryButton from "@/components/auth/primaryButton";
import { useAuthStore } from "@/store/authStore";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  // Read params: hide the button if explicitly coming from email verification
  const params = useLocalSearchParams<{ fromVerifyEmail?: string }>();
  const showSkipButton = params.fromVerifyEmail !== "true";

  const handleSwitchAccount = () => {
    // 1. Clear current auth state/tokens
    logout();

    // 2. Navigate back to login screen
    router.replace("/auth/loginScreen" as any);
  };

  return (
    <LinearGradient
      colors={["#7F48EF", "#7F48EF", "#5E35D0"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Render the button EXCEPT when coming directly from email verification */}
        {showSkipButton && (
          <View
            style={{
              position: "absolute",
              top: "6%",
              right: 20,
              zIndex: 100,
            }}
          >
            <SkipButton
              style={{ backgroundColor: "#8960EA" }}
              onPress={handleSwitchAccount}
            />
          </View>
        )}

        {/* Scrollable container */}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Illustration Section */}
          <View className="items-center">
            <Image
              source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946835/complete-profile_wffycp.png"}}
              resizeMode="contain"
              style={{
                height: 470,
                marginTop: -80,
              }}
            />
          </View>

          {/* Content */}
          <View className="mt-6">
            <ThemedText
              style={{ color: "#fff" }}
              className="text-white text-3xl font-extrabold leading-10"
            >
              Welcome to
            </ThemedText>

            <View className="flex-row items-center">
              <ThemedText
                className="text-3xl font-extrabold"
                style={{ color: "#fff" }}
              >
                3NAMES
              </ThemedText>
              <ThemedText className="text-3xl ml-2">🎉</ThemedText>
            </View>

            <ThemedText
              style={{ color: "#fff" }}
              className="text-violet-100 text-md mb-2 mt-1 leading-7"
            >
              Let's personalize your account to get the best experience.
            </ThemedText>
          </View>

          {/* White/Lavender Card */}
          <View
            style={{ backgroundColor: "#EAE6FA" }}
            className="rounded-3xl mt-3 mb-6 px-6 py-2"
          >
            <FeatureItem title="Connect with students" />
            <FeatureItem title="Buy & sell on Marketplace" />
            <FeatureItem title="Access past questions & notes" />
            <FeatureItem title="Track your level & earn rewards" />
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Action Button */}
          <View className="mt-4">
            <PrimaryButton
              title="Complete Profile"
              onPress={() =>
                router.replace("/auth/completeProfileScreen")
              }
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}