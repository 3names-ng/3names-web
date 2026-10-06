import React from "react";
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, View, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import LoginIllustration from "@/components/auth/loginIllustration";
import LoginForm from "@/components/auth/loginForm";
import AuthDivider from "@/components/auth/authDivider";
import SocialButton from "@/components/auth/socialButton";
import AuthFooter from "@/components/auth/authFooter";
import { router, useFocusEffect } from "expo-router";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
// import { useGoogleAuth } from "@/hooks/useGoogleAuth";

export default function LoginScreen() {
  const { colors } = useTheme();
  // const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();

     useFocusEffect(
      React.useCallback(() => {
        const onBackPress = () => {
          // Return true to stop the back action completely
          return true;
        };
  
        // Add listener when the screen comes into focus
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
  
        // Remove listener when the screen loses focus
        return () => backHandler.remove();
      }, []))


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
            <LoginIllustration/>
                 <View>
          <ThemedText
            className="text-center font-bold"
            style={{ fontSize: 32 }}
          >
            Welcome Back
          </ThemedText>
          <ThemedText
            className="text-center mb-6 mt-3"
            style={{
              fontSize: 18,
              color: colors.muted,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            Login to continue to 3NAMES
          </ThemedText>
        </View>
    
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
               <LoginForm />

        {/* Divider */}

        {/* <AuthDivider /> */}

        {/* Google */}

        {/* <SocialButton
          title="Continue with Google"
          image={require("@/assets/images/google.png")}
          onPress={() => signInWithGoogle()}
          loading={googleLoading}
        /> */}

        <View style={{ marginTop: 2 }}>
          <AuthFooter
            text="Don't have an account?"
            actionText="Create Account"
            onPress={() => router.replace("/auth/signUpScreen")}
          />
        </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
  );
}
