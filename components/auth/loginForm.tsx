import React, { useEffect, useRef, useState } from "react";
import {
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { router } from "expo-router";

import { ThemedText } from "@/components/ui/ThemedText";
import AuthInput from "./authInput";
import PasswordInput from "./passwordInput";
import PrimaryButton from "./primaryButton";
import CheckBox from "./checkBox";
import { showError, showSuccess } from "../ui/toast";
import { authService } from "@/service/auth.service";
import { useAuthStore } from "@/store/authStore";
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
} from "@/utils/credentialStorage";

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  // Email of the prefilled "Remember me" account, until someone types a different one
  const prefilledEmail = useRef<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Prefill the form with credentials saved by "Remember me"
  useEffect(() => {
    loadRememberedCredentials().then((saved) => {
      if (!saved) return;
      prefilledEmail.current = saved.email;
      reset({ email: saved.email, password: saved.password });
      setRememberMe(true);
    });
  }, [reset]);

  // A different user is logging in on this device: don't keep the saved
  // account's password in the form, and don't remember the new user unless
  // they tick the box themselves.
  function handleEmailChange(text: string, onChange: (text: string) => void) {
    onChange(text);
    if (prefilledEmail.current !== null && text.trim() !== prefilledEmail.current) {
      prefilledEmail.current = null;
      setValue("password", "");
      setRememberMe(false);
    }
  }

async function onSubmit(data: LoginFormData) {
  try {
    setLoading(true);

    const response = await authService.login({
      email: data.email,
      password: data.password,
    });

    // Credentials are valid — remember or forget them per the checkbox
    if (rememberMe) {
      await saveRememberedCredentials(data.email, data.password);
    } else {
      await clearRememberedCredentials();
    }

    // Account is deactivated — send the user to the activation screen
    // instead of logging them in.
    if (response?.accountDeactivated) {
      router.replace({
        pathname: "/auth/reactivateAccountScreen",
        params: { email: data.email },
      });
      return;
    }

    // Two-factor authentication is enabled — a code was emailed; route
    // to the 2FA verification screen before logging in.
    if (response?.twoFactorRequired) {
      router.push({
        pathname: "/(features)/twoFactorVerifyScreen",
        params: { email: data.email, userId: response?.userId },
      });
      return;
    }

    // 1. Update Auth Store
    useAuthStore
      .getState()
      .login(response.user, response.accessToken, response.refreshToken);

    // showSuccess("Welcome back!", "Login Successful");

    // 2. Check Onboarding / Suspension status
    const needsOnboarding =
      Boolean(response.onboardingRequired) || !response.user?.isOnboardingComplete;

    const targetRoute =
      response.user?.status === "suspended"
        ? "/auth/suspendedScreen"
        : response.user?.status === "restricted"
        ? "/auth/restrictedScreen"
        : needsOnboarding
        ? "/"
        : "/(tabs)";

    // 3. Clear stack history cleanly before navigating
    if (router.canDismiss()) {
      router.dismissAll();
    }

    // Queue replace after dismiss completes to prevent navigation conflicts
    setTimeout(() => {
      router.replace(targetRoute as any);
    }, 0);

  } catch (error: any) {
    console.error("Login failed:", error);

    const message = error?.response?.data?.message;

    if (
      error?.response?.status === 401 &&
      message?.toLowerCase().includes("verify your email")
    ) {
      showError(
        "Please verify your email first.",
        "Email Verification Required"
      );

      router.push({
        pathname: "/auth/verifyEmailScreen",
        params: {
          email: data.email,
        },
      });

      return;
    }

    showError(message || "Network Error. Try Again...", "Login Failed");
  } finally {
    setLoading(false);
  }
}

  return (
 
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full">
            {/* Email */}
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              }}
              render={({ field: { value, onChange } }) => (
                <AuthInput
                  label="Email Address"
                  placeholder="Enter your email"
                  icon="mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={(text) => handleEmailChange(text, onChange)}
                  error={errors.email?.message}
                />
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange } }) => (
                <PasswordInput
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter password"
                  error={errors.password?.message}
                />
              )}
            />

            {/* Remember me + Forgot Password */}
            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-1">
                <CheckBox
                  checked={rememberMe}
                  onToggle={() => setRememberMe((prev) => !prev)}
                  title="Remember me"
                />
              </View>

              <TouchableOpacity
                onPress={() => router.push("/auth/forgotpasswordScreen")}
              >
                <ThemedText className="text-violet-600 font-semibold">
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Login */}
            <View className="mt-8">
              <PrimaryButton
                title="Login"
                loading={loading}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
          </View>
        </ScrollView>
   
  );
}