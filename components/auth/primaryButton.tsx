import React from "react";
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/ui/ThemedText";

interface Props {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: boolean;
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon = true,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={disabled || loading}
      onPress={onPress}
      style={{
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <LinearGradient
        colors={["#8B5CF6", "#6D28D9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 48,
          borderRadius: 18,
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          paddingHorizontal: 22,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                marginLeft: icon ? 26 : 0,
              }}
            >
              <ThemedText
                style={{
                  color: "#FFFFFF",
                  fontSize: 17,
                  fontWeight: "700",
                }}
              >
                {title}
              </ThemedText>
            </View>

            {icon && (
              <Ionicons
                name="arrow-forward"
                size={22}
                color="#FFFFFF"
              />
            )}
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}