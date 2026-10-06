import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import OTPInput from "@/components/auth/otpInput";
import PrimaryButton from "@/components/auth/primaryButton";
import AuthHeader from "@/components/auth/authHeader";
import { authService } from "@/service/auth.service";
import { showError, showSuccess } from "@/components/ui/toast";
import { useAuthStore } from "@/store/authStore";

export default function TwoFactorVerifyScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { email } = useLocalSearchParams<{
    email: string;
    userId?: string;
  }>();

  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const finishLogin = (response: any) => {
    useAuthStore
      .getState()
      .login(response.user, response.accessToken, response.refreshToken);

    showSuccess(t("auth.login"), t("success.success"));

    const needsOnboarding =
      Boolean(response.onboardingRequired) ||
      !response.user?.isOnboardingComplete;
    const targetRoute =
      response.user?.status === "suspended"
        ? "/auth/suspendedScreen"
        : response.user?.status === "restricted"
        ? "/auth/restrictedScreen"
        : needsOnboarding
        ? "/"
        : "/(tabs)";

    if (router.canDismiss()) {
      router.dismissAll();
    }
    setTimeout(() => {
      router.replace(targetRoute as any);
    }, 0);
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      showError(t("twofaVerify.subtitle"));
      return;
    }
    if (!email) {
      showError(t("auth.email"));
      return;
    }

    try {
      setLoading(true);
      const response = await authService.verify2faLogin({ email, code: otp });
      finishLogin(response);
    } catch (error: any) {
      showError(
        error?.response?.data?.message || t("twofaVerify.invalidCode"),
        t("twofaVerify.title"),
      );
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!email || seconds > 0) return;
    try {
      setLoading(true);
      await authService.resend2faLoginOtp({ email });
      setSeconds(60);
      showSuccess(t("twofaVerify.codeSent"), t("twofaVerify.codeSent"));
    } catch (error: any) {
      showError(
        error?.response?.data?.message || t("twofaVerify.invalidCode"),
        t("error.error"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle="default"
        backgroundColor={colors.background}
      />
      <AuthHeader
        showBackButton
        title={t("twofa.title")}
        subtitle={t("twofaVerify.subtitle")}
      />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={{ backgroundColor: "transparent", marginTop: 30, alignItems: "center" }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.primaryLight || "rgba(124, 58, 237, 0.15)",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons name="shield-checkmark" size={34} color={colors.primary || "#7C3AED"} />
          </View>

          <ThemedText style={{ textAlign: "center", fontSize: 14, lineHeight: 20 }}>
            {t("twofaVerify.subtitle")}{" "}
            <ThemedText style={{ fontWeight: "700" }}>{email || t("auth.email")}</ThemedText>.
          </ThemedText>
 <View style={{ width: "100%", marginBottom: 10 }}>
          <OTPInput value={otp} onChange={setOtp} /></View>

          <View style={{ width: "100%", marginTop: 30, marginBottom: 10 }}>
            <PrimaryButton
              title="Verify & Sign In"
              onPress={verifyOTP}
              loading={loading}
            />
          </View>

          <TouchableOpacity
            onPress={resendCode}
            disabled={loading || seconds > 0}
            style={{ marginTop: 24 }}
          >
            <ThemedText style={{ color: colors.primary || "#7C3AED", fontSize: 14, fontWeight: "600" }}>
              {seconds > 0 ? `Resend code in ${seconds}s` : "Resend code"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}