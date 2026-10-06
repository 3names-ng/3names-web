import React from "react";
import { Text, View, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import PrimaryButton from "@/components/auth/primaryButton";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";

export default function ProfileCompletedScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace("/(tabs)"); 
  };

  const completedSteps = [
    "Personal Information",
    "Academic Information",
    "Profile Picture",
    "Student Verification",
  ];

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background }}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <ThemedView className="flex-1 items-center justify-center px-6 py-8">
          {/* 1. Success Illustration / Badge */}
          <ThemedView className="w-full h-64 items-center justify-center mb-6">
            <Image
              source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946858/successImage2_gs9olp.png"}}
              className="w-[85%] h-full"
              resizeMode="contain"
            />
          </ThemedView>

          {/* 2. Headline & Copy */}
          <ThemedView className="items-center mb-8 px-4">
            <ThemedText
              style={{ fontSize: 32 }}
              className="font-bold text-center mb-3"
            >
              Profile Completed! 🎉
            </ThemedText>
            <ThemedText
              style={{ color: colors.muted }}
              className="text-lg text-center font-medium leading-6"
            >
              Your profile is complete and your account is now active.
            </ThemedText>
          </ThemedView>

          {/* 3. Completed Step List Box */}
          <ThemedView
            style={{
              borderWidth: 1,
              borderColor: colors.border,
            }}
            className="w-full rounded-2xl px-5 py-2"
          >
            {completedSteps.map((step, index) => (
              <ThemedView key={index}>
                <ThemedView className="flex-row items-center py-4 gap-2">
                  {/* Success Green Checkmark Icon */}
                  <ThemedView
                    style={{
                      backgroundColor: "green",
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                    }}
                    className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center mr-3.5"
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.background}
                    />
                  </ThemedView>
                  <ThemedText className="flex-1 text-sm font-medium text-slate-800">
                    {step}
                  </ThemedText>
                </ThemedView>
                {/* Horizontal Divider */}
                {index < completedSteps.length - 1 && (
                  <ThemedView className="h-[1px] bg-[#ECEEF9] w-full" />
                )}
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>
      </ScrollView>

      {/* 4. Bottom Call To Action */}
      <ThemedView className="px-6 pb-6 pt-2">
        <PrimaryButton title="Get Started" onPress={handleGetStarted} />
      </ThemedView>
    </SafeAreaView>
  );
}
