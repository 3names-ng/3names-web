import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ui/ThemedText";
import AuthFooter from "@/components/auth/authFooter";
import SocialButton from "@/components/auth/socialButton";
import AuthDivider from "@/components/auth/authDivider";
import PrimaryButton from "@/components/auth/primaryButton";
import CheckBox from "@/components/auth/checkBox";
import { openLegalPage } from "@/constants/legal";
import PasswordInput from "@/components/auth/passwordInput";
import AuthInput from "@/components/auth/authInput";
import { signupSchema } from "@/schema/signup.schema";
import { router } from "expo-router";
import { ThemedView } from "@/components/ui/ThemedView";
import { authService } from "@/service/auth.service";
import { showError, showSuccess } from "@/components/ui/toast";
// import { useGoogleAuth } from "@/hooks/useGoogleAuth";
type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignUpScreen() {
  const { colors } = useTheme();
  // const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();

  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
 const {
  control,
  handleSubmit,
  watch,
  formState: { errors },
} = useForm<FormData>({
  resolver: zodResolver(signupSchema),
  mode: "onChange",
  reValidateMode: "onChange",
  defaultValues: {
    email: "",
    password: "",
    confirmPassword: "",
  },
});
const password = watch("password");
  const onSubmit = async (data: FormData) => {
    if (!acceptedTerms) {
      showError(
        "Please accept the Terms & Conditions to continue.",
        "Terms & Conditions",
      );
      return;
    }

    try {
      setLoading(true);

      await authService.register({
        email: data.email,
        password: data.password,
      });

      // showSuccess(
      //   `A verification code has been sent to your ${data.email}.`,
      //   "Account Created",
      // );

      router.replace({
        pathname: "/auth/verifyEmailScreen",
        params: {
          email: data.email,
        },
      });
    } catch (error: any) {
      console.error(error);

      showError(
        error?.response?.data?.message || "Something went wrong.",
        "Registration Failed",
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
        style={{ flex: 1 }}
        behavior="padding"
      >
        <ThemedView className=" bg-transparent flex justify-center items-center mb-6">
          <Image
            style={{ height: 100, width: 100, borderRadius: 50 }}
            source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946837/graduation_wqs3hq.png"}}
            // className="w-full"
            resizeMode="cover"
          />
        </ThemedView>
        <ThemedText
          style={{
            color: colors.muted,
            fontSize: 32,
            marginTop: 0,
            lineHeight: 34,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          Create Your Account
        </ThemedText>
        <ThemedText
          style={{
            color: colors.muted,
            fontSize: 16,
            marginTop: 6,
            lineHeight: 24,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Join thousands of students {"\n"} learning, selling, buying and
          connecting.
        </ThemedText>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingLeft: 24,
            paddingRight: 24,
            paddingBottom: 40,
            paddingTop: 15,
          }}
        >
      
          <View className="mt-8">
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange } }) => (
                <AuthInput
                  label="Email Address"
                  icon="mail"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Email Address"
                  error={errors.email?.message}
                />
              )}
            />
          </View>

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
                showStrength={true}
              />
            )}
          />

          {/* Confirm Password */}

       <Controller
  control={control}
  name="confirmPassword"
  rules={{
    required: "Please confirm your password",
    validate: (value) => {
      if (!value) return "Please confirm your password";
      return value === password || "Passwords do not match";
    },
  }}
  render={({ field: { value, onChange } }) => (
    <PasswordInput
      label="Confirm Password"
      value={value}
      onChangeText={onChange}
      placeholder="Confirm password"
      error={errors.confirmPassword?.message}
      showStrength
    />
  )}
/>

          {/* Terms */}

          <CheckBox
            checked={acceptedTerms}
            onToggle={() => setAcceptedTerms(!acceptedTerms)}
            title="I agree to the"
            highlight="Terms & Conditions"
            onHighlightPress={() => openLegalPage("terms")}
            secondHighlight="Privacy Policy"
            onSecondHighlightPress={() => openLegalPage("privacy")}
          />

          {/* Button */}

          <View className="mt-4">
            <PrimaryButton
              title="Create Account"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          {/* Divider */}

          {/* <AuthDivider /> */}

          {/* Google */}

          {/* <SocialButton
            title="Continue with Google"
            image={require("@/assets/images/google.png")}
            onPress={() => signInWithGoogle()}
            loading={googleLoading}
          /> */}

          {/* Apple */}

          {/* {Platform.OS === "ios" && (
            <SocialButton
              title="Continue with Apple"
              image={require("@/assets/images/splash-icon.png")}
              onPress={() => {}}
            />
          )} */}

          {/* Footer */}

          <View className="">
            <AuthFooter
              text="Already have an account?"
              actionText="Sign In"
              onPress={() => router.replace("/auth/loginScreen")}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
