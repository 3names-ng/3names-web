import React from "react";
import { View } from "react-native";
import AuthHeader from "./authHeader";


interface Props {
  email?: string;
}

export default function VerifyOtpHeader({
  email = "john.doe@gmail.com",
}: Props) {
  return (
    <View>
      <AuthHeader
        title="Verify OTP"
        subtitle={`We've sent a 6-digit verification code to\n\n${email}\n\nEnter the code below to continue.`}
      />
    </View>
  );
}