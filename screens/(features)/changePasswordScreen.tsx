import React from "react";
import {
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { router } from "expo-router";

import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";
import AuthHeader from "@/components/auth/authHeader";
import PrimaryButton from "@/components/auth/primaryButton";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import PasswordInput from "@/components/auth/passwordInput";
import { showError, showSuccess } from "@/components/ui/toast";
import { authService } from "@/service/auth.service";

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const newPassword = watch("newPassword");

  const newPasswordRules = {
    required: "New password is required",
    minLength: {
      value: 8,
      message: "Password must be at least 8 characters",
    },
    validate: {
      uppercase: (value: string) =>
        /[A-Z]/.test(value) || "Must contain at least one uppercase letter",
      lowercase: (value: string) =>
        /[a-z]/.test(value) || "Must contain at least one lowercase letter",
      number: (value: string) =>
        /[0-9]/.test(value) || "Must contain at least one number",
      special: (value: string) =>
        /[^A-Za-z0-9]/.test(value) ||
        "Must contain at least one special character",
    },
  };

  const onSubmit = async (data: FormData) => {
    if (data.newPassword === data.currentPassword) {
      showError(
        "Your new password must be different from your current password.",
        "Invalid Password"
      );
      return;
    }

    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      showSuccess(
        "Your password has been changed successfully.",
        "Password Updated"
      );
      reset();
      router.back();
    } catch (error: any) {
      const message =
        error?.response?.data?.message?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Unable to change your password.";
      showError(
        Array.isArray(message) ? message.join(", ") : message,
        "Change Failed"
      );
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
          <AuthHeader
            title={t("password.title")}
            subtitle={t("password.subtitle")}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 40,
            paddingTop: 16,
          }}
        >
          <ThemedText className="text-base font-medium mb-6">
            Your new password must be different from your current password and
            meet the requirements below.
          </ThemedText>

          {/* Current Password */}
          <Controller
            control={control}
            name="currentPassword"
            rules={{ required: "Current password is required" }}
            render={({ field: { value, onChange } }) => (
              <PasswordInput
                label={t("password.currentPassword")}
                value={value}
                onChangeText={onChange}
                placeholder={t("password.currentPlaceholder")}
                error={errors.currentPassword?.message}
              />
            )}
          />

          {/* New Password */}
          <Controller
            control={control}
            name="newPassword"
            rules={newPasswordRules}
            render={({ field: { value, onChange } }) => (
              <PasswordInput
                label={t("password.newPassword")}
                value={value}
                onChangeText={onChange}
                placeholder={t("password.newPlaceholder")}
                error={errors.newPassword?.message}
                showStrength
              />
            )}
          />

          {/* Confirm New Password */}
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: "Please confirm your new password",
              validate: (value) =>
                value === newPassword || "Passwords do not match",
            }}
            render={({ field: { value, onChange } }) => (
              <PasswordInput
                label={t("password.confirmNewPassword")}
                value={value}
                onChangeText={onChange}
                placeholder={t("password.confirmPlaceholder")}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <ThemedView className="bg-transparent mt-4">
            <ThemedText className="text-sm" style={{ color: colors.muted }}>
              Password must be at least 8 characters and include an uppercase
              letter, a lowercase letter, a number, and a special character.
            </ThemedText>
          </ThemedView>
        </ScrollView>

        <View style={{ paddingHorizontal: 24 }}>
          <PrimaryButton
            title={t("password.updateButton")}
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
