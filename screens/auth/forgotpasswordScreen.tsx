import React from "react";
import { 
  ScrollView, 
  View, 
  Image, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { router } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import AuthHeader from "@/components/auth/authHeader";
import AuthInput from "@/components/auth/authInput";
import PrimaryButton from "@/components/auth/primaryButton";
import AuthFooter from "@/components/auth/authFooter";
import AuthDivider from "@/components/auth/authDivider";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { showError, showSuccess } from "@/components/ui/toast";
import { authService } from "@/service/auth.service";

type FormData = {
  email: string;
};

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { width } = Dimensions.get("window");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
    },
  });

const onSubmit = async (data: FormData) => {
  try {
    const response = await authService.forgotPassword({
      email: data.email,
    });

    showSuccess(
      response.message || "Verification code sent successfully.",
      "OTP Sent"
    );

    router.replace({
      pathname: "/auth/verifyResetOtpScreen",
      params: {
        email: data.email,
      },
    });
  } catch (error: any) {
    console.error(error);

    showError(
      error?.response?.data?.message ||
        "Unable to send verification code.",
      "Forgot Password"
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
            title=""
            subtitle=""
          />
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
              source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946838/forgotpassword4_uniivk.png"}}
              className="w-full"
              resizeMode="cover"
            />
          </ThemedView>

          <ThemedText className="text-3xl text-center font-bold">
            Forgot Password?
          </ThemedText>
          <ThemedText className="text-lg text-center font-medium mb-8 mt-2">
            Enter the email associated with your account and we'll send you a verification code
          </ThemedText>

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
            render={({ field }) => (
              <AuthInput
                label="Email Address"
                placeholder="Enter your email"
                icon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.email?.message}
              />
            )}
          />
          <View className="mt-8">
            <PrimaryButton
              title="Send OTP"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          <AuthDivider />

          <AuthFooter
            text="Remember your password?"
            actionText="Sign In"
            onPress={() => router.replace("/auth/loginScreen")}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}