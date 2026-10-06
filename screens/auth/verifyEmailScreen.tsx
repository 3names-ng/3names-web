import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, ScrollView, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import OTPInput from "@/components/auth/otpInput";
import PrimaryButton from "@/components/auth/primaryButton";
import { router, useLocalSearchParams } from "expo-router";
import AuthHeader from "@/components/auth/authHeader";
import { ThemedView } from "@/components/ui/ThemedView";
import { authService } from "@/service/auth.service";
import { showError, showSuccess } from "@/components/ui/toast";
import { useAuthStore } from "@/store/authStore";

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const login = useAuthStore((state) => state.login);

  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const resendCode = async () => {
    if (!email) {
      showError("Email address is missing.");
      return;
    }

    try {
      setLoading(true);

      await authService.resendOtp({
        email,
      });

      setSeconds(60);

      showSuccess(
        "A new verification code has been sent to your email.",
        "OTP Sent",
      );
    } catch (error: any) {
      console.error("Resend OTP failed:", error);

      showError(
        error?.response?.data?.message || "Unable to resend verification code.",
        "Resend Failed",
      );
    } finally {
      setLoading(false);
    }
  };

 const verifyOTP = async () => {
    if (otp.length !== 6) {
      showError("Please enter a valid 6-digit verification code.");
      return;
    }

    if (!email) {
      showError("Email address is missing.");
      return;
    }

    try {
      setLoading(true);

      const response = await authService.verifyEmail({
        email,
        code: otp,
      });

      // 1. Log the user into your global Zustand store
      if (response?.user && response?.accessToken) {
        login(response.user, response.accessToken, response.refreshToken || "");
      } else if (response?.data?.user && response?.data?.accessToken) {
        login(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken || "",
        );
      }

      showSuccess("Your email has been verified successfully.", "Verified");

      // 2. Clear dismissible stack and pass fromVerifyEmail: "true" to hide the skip button
      // if (router.canDismiss()) {
      //   router.dismissAll();
      // }

      router.replace({
        pathname: "/auth/completeProfileScreen",
        params: { fromVerifyEmail: "true" },
      } as any);
    } catch (error: any) {
      console.error("OTP verification failed:", error);

      showError(
        error?.response?.data?.message || "Invalid verification code.",
        "Verification Failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <View>
        <AuthHeader title="" subtitle={""} />
      </View>

      <ThemedView className=" bg-transparent flex justify-center items-center mt-4">
        <Image
          style={{ height: 200, width: 200, borderRadius: 100 }}
          source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946843/otp2_xzqcor.png"}}
          resizeMode="cover"
        />
      </ThemedView>
      <ThemedText
        style={{
          color: colors.muted,
          fontSize: 32,
          marginTop: 12,
          lineHeight: 34,
          fontWeight: "900",
          textAlign: "center",
        }}
      >
        Verify Email
      </ThemedText>

      <ThemedText
        style={{
          color: colors.muted,
          fontSize: 16,
          marginTop: 2,
          lineHeight: 20,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        We've sent a verification code to {"\n"}
        <ThemedText style={{ color: colors.primary }}>
          {email} {"\n"}{" "}
        </ThemedText>
        <ThemedText style={{ color: colors.muted }}>
          Enter the code below to verify
        </ThemedText>
      </ThemedText>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingLeft: 24,
          paddingRight: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* OTP */}
        <OTPInput value={otp} onChange={setOtp} />

        {/* Timer */}
        <View className="items-center mt-10">
          <ThemedText className="text-2xl font-bold">
            00:
            {seconds.toString().padStart(2, "0")}
          </ThemedText>

          <ThemedText
            className="mt-3"
            style={{
              color: colors.secondary,
            }}
          >
            Didn't receive the code?
          </ThemedText>

          <TouchableOpacity disabled={seconds > 0} onPress={resendCode}>
            <ThemedText
              className="mt-2 font-bold"
              style={{
                color: seconds > 0 ? "#A1A1AA" : "#7C3AED",
              }}
            >
              Resend Code
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 1,
          }}
        />

        {/* Verify */}
        <PrimaryButton
          title="Verify Email"
          loading={loading}
          onPress={verifyOTP}
        />

        {/* Change Email */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 items-center"
        >
          <ThemedText
            style={{
              color: "#7C3AED",
              fontWeight: "700",
            }}
          >
            Change Email
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
