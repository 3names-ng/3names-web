import React from "react";
import { View, Image } from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";

export default function LoginHeader() {
  return (
    <View className="items-center mt-4">

      {/* Logo */}

      <View className="flex-row items-center">
        <Image
          source={require("@/assets/images/welcome.png")}
          className="w-12 h-12"
          resizeMode="contain"
        />

        <ThemedText className="ml-3 text-[34px] font-extrabold">
          3NAMES
        </ThemedText>
      </View>

      {/* Welcome */}

      <ThemedText className="mt-12 text-[42px] font-extrabold text-center">
        Welcome Back!
      </ThemedText>

      <ThemedText
        className="mt-3 text-center text-base leading-6 px-8"
      
      >
        Login to continue your campus journey and connect with students.
      </ThemedText>

    </View>
  );
}