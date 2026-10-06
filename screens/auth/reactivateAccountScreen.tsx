import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import AuthHeader from "@/components/auth/authHeader";
import PasswordInput from "@/components/auth/passwordInput";
import PrimaryButton from "@/components/auth/primaryButton";
import OTPInput from "@/components/auth/otpInput";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { showError, showSuccess } from "@/components/ui/toast";
import { authService } from "@/service/auth.service";
import { useAuthStore } from "@/store/authStore";

export default function ReactivateAccountScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || "";

  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = async (showToast = true) => {
    if (!email) {
      showError("Email is missing. Please go back and try again.");
      return;
    }
    setSendingOtp(true);
    try {
      await authService.sendReactivationOtp({ email });
      setOtpSent(true);
      if (showToast) {
        showSuccess(
          "A 6-digit reactivation code has been sent to your email.",
          "Code Sent",
        );
      }
    } catch (error: any) {
      console.error("Send reactivation OTP failed:", error);
      showError(
        error?.response?.data?.message ||
          "Unable to send the reactivation code. Please try again.",
        "Code Not Sent",
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // Send the OTP as soon as the screen opens
  useEffect(() => {
    sendOtp(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReactivate = async () => {
    if (!password) {
      showError("Please enter your password to reactivate your account.");
      return;
    }
    if (code.length !== 6) {
      showError("Please enter the 6-digit code sent to your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.reactivateAccount({
        email,
        password,
        code,
      });

      useAuthStore
        .getState()
        .login(response.user, response.accessToken, response.refreshToken);

      showSuccess("Your account is active again. Welcome back!", "Account Reactivated");

      if (router.canDismiss()) {
        router.dismissAll();
      }
      const targetRoute =
        response.user?.status === "suspended"
          ? "/auth/suspendedScreen"
          : response.user?.status === "restricted"
          ? "/auth/restrictedScreen"
          : "/(tabs)";
      setTimeout(() => {
        router.replace(targetRoute as any);
      }, 0);
    } catch (error: any) {
      console.error("Reactivate failed:", error);
      showError(
        error?.response?.data?.message ||
          "Unable to reactivate your account. Please try again.",
        "Activation Failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
        <View>
          <AuthHeader title="" subtitle="" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 40,
          }}
        >
          <ThemedView className="bg-transparent flex justify-center items-center mt-10">
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="power" size={56} color="#F59E0B" />
            </View>
          </ThemedView>

          <ThemedText className="text-3xl text-center font-bold mt-6">
            Account Deactivated
          </ThemedText>
          <ThemedText className="text-lg text-center font-medium mb-2 mt-2 leading-7">
            We've sent a 6-digit reactivation code to your email. Enter it below
            with your password to activate your account back.
          </ThemedText>

          {email ? (
            <ThemedView
              className="rounded-2xl p-4 mb-4 flex-row items-center"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <ThemedText className="ml-3 text-base font-medium flex-1">
                {email}
              </ThemedText>
            </ThemedView>
          ) : null}

          <OTPInput value={code} onChange={setCode} />

          <View className="items-center mt-4">
            <ThemedText
              className="text-violet-600 font-semibold"
              onPress={() => sendOtp(true)}
              suppressHighlighting
            >
              {sendingOtp
                ? "Sending code..."
                : otpSent
                ? "Resend code"
                : "Send code"}
            </ThemedText>
          </View>

          <View className="mt-6">
            <PasswordInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
            />
          </View>

          <View className="mt-6">
            <PrimaryButton
              title="Reactivate Account"
              loading={loading}
              icon={false}
              onPress={handleReactivate}
            />
          </View>

          <View className="mt-6 items-center">
            <ThemedText className="text-center text-sm opacity-60 mb-1">
              Changed your mind?
            </ThemedText>
            <ThemedText
              className="text-violet-600 font-semibold text-center"
              onPress={() => router.replace("/auth/loginScreen")}
              suppressHighlighting
            >
              Back to Login
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
