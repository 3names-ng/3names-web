import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {  useForm } from "react-hook-form";
import { router, useLocalSearchParams } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import AuthHeader from "@/components/auth/authHeader";

import PrimaryButton from "@/components/auth/primaryButton";

import { showError, showSuccess } from "@/components/ui/toast";

import SuccessComponent from "@/components/auth/successComponent";

type FormData = {
  email: string;
};

export default function SeccessScreen() {
  const { colors } = useTheme();
 
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
    },
  });


  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

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
          <SuccessComponent
            title="Password Updated!"
            subtitle="Your password has been change successfully."
          />
        </ScrollView>
        <View style={{ paddingHorizontal: 24 }}>
          <PrimaryButton
            title="Continue to Login"
            loading={isSubmitting}
            //   onPress={handleSubmit(onSubmit)}
            onPress={() => router.replace("/auth/loginScreen")}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
