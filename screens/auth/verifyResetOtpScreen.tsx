import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {  useForm } from "react-hook-form";
import { router, useLocalSearchParams } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import AuthHeader from "@/components/auth/authHeader";
import PrimaryButton from "@/components/auth/primaryButton";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import OTPInput from "@/components/auth/otpInput";
import { showError, showSuccess } from "@/components/ui/toast";
import { authService } from "@/service/auth.service";

type FormData = {
  email: string;
};

export default function VerifyResetOtpScreen() {
  const { colors } = useTheme();
  const { width } = Dimensions.get("window");
  const [otp, setOtp] = useState("");
  const { email } = useLocalSearchParams<{ email: string }>();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async () => {
  if (otp.length !== 6) {
    showError("Please enter the 6-digit verification code.");
    return;
  }

  try {
    setLoading(true);

    const response = await authService.verifyResetOtp({
      email,
      code: otp,
    });

    showSuccess(
      "OTP verified successfully.",
      "Success"
    );

    router.replace({
      pathname: "/auth/createNewpasswordScreen",
      params: {
        email,
        resetToken: response.resetToken,
      },
    });
  } catch (error: any) {
    console.log(error);

    showError(
      error?.response?.data?.message ||
        "Invalid or expired verification code.",
      "Verification Failed"
    );
  } finally {
    setLoading(false);
  }
};

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
  try {
    setLoading(true);

    await authService.forgotPassword({
      email,
    });

    setSeconds(60);

    showSuccess(
      "A new verification code has been sent to your email.",
      "OTP Sent"
    );
  } catch (error: any) {
    console.error(error);

    showError(
      error?.response?.data?.message ||
        "Unable to resend verification code.",
      "Resend Failed"
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
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
          <ThemedView className="bg-transparent flex justify-center items-center mt-8">
            <Image
              style={{
                width: width * 0.6,
                height: width * 0.6,
              }}
              source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946856/verifyOtp3_phtviw.png"}}
              className="w-full"
              resizeMode="cover"
            />
          </ThemedView>

          <ThemedText className="text-3xl text-center font-bold mb-4">
            Verify OTP
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
        </ScrollView>
        <View style={{ paddingHorizontal: 24 }}>
          <PrimaryButton
            title="Verify OTP"
            loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            // onPress={() => router.push("/auth/createNewpasswordScreen")}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
