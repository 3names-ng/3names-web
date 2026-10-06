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
import { router, useLocalSearchParams } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import AuthHeader from "@/components/auth/authHeader";

import PrimaryButton from "@/components/auth/primaryButton";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import PasswordInput from "@/components/auth/passwordInput";
import { showError, showSuccess } from "@/components/ui/toast";
import { authService } from "@/service/auth.service";

type FormData = {
  password: string;
  confirmPassword: string;
};

export default function CreateNewPasswordScreen() {
  const { colors } = useTheme();
  const { width } = Dimensions.get("window");
const { resetToken } = useLocalSearchParams<{
  resetToken: string;
  code: string;
}>();
  const {
  control,
  handleSubmit,
  watch,
  formState: { errors, isSubmitting },
} = useForm<FormData>({
  defaultValues: {
    password: "",
    confirmPassword: "",
  },
   mode: "onChange",
  reValidateMode: "onChange",
});

const password = watch("password");

// Assuming you have the resetToken stored in state from the previous step:
// const [resetToken, setResetToken] = useState<string>("");

const onSubmit = async (data: FormData) => {
  try {
    // Ensure we actually have the token before sending
    if (!resetToken) {
      showError("Session expired. Please verify your OTP again.", "Reset Failed");
      return;
    }

    await authService.resetPassword({
      resetToken: resetToken, 
      password: data.password,
    });

    showSuccess(
      "Your password has been changed successfully.",
      "Password Updated"
    );

    router.replace("/auth/sucessPasswordChange");
  } catch (error: any) {
    console.log(error);

    showError(
      error?.response?.data?.message ||
        "Unable to reset your password.",
      "Reset Failed"
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
              source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946839/createNewpassword_hu5sz4.png"}}
              className="w-full"
              resizeMode="cover"
            />
          </ThemedView>

          <ThemedText className="text-3xl text-center font-bold">
           Create New Password
          </ThemedText>
          <ThemedText className="text-lg text-center font-medium mb-8 mt-2">
           Your new password must be different from the previous password
          </ThemedText>

           {/* Password */}
         
                 <Controller
  control={control}
  name="password"
  rules={{
    required: "Password is required",
    minLength: {
      value: 8,
      message: "Password must be at least 8 characters",
    },
  }}
  render={({ field: { value, onChange } }) => (
    <PasswordInput
      label="Password"
      value={value}
      onChangeText={onChange}
      placeholder="Enter New Password"
      error={errors.password?.message}
      showStrength
    />
  )}
/>
         
                   {/* Confirm Password */}
         
               <Controller
  control={control}
  name="confirmPassword"
  rules={{
    required: "Please confirm your password",
    validate: (value) =>
      value === password || "Passwords do not match",
  }}
  render={({ field: { value, onChange } }) => (
    <PasswordInput
      label="Confirm New Password"
      value={value}
      onChangeText={onChange}
      placeholder="Confirm Password"
      error={errors.confirmPassword?.message}
      showStrength
    />
  )}
/>
        

        </ScrollView>
           <View style={{ paddingHorizontal: 24 }}>
            <PrimaryButton
              title="Reset Password"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
          
            />
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}