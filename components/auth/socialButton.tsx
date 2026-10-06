import React from "react";
import {
  ActivityIndicator,
  Image,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  title: string;
  image: any;
  onPress?: () => void;
  loading?: boolean;
}

export default function SocialButton({
  title,
  image,
  onPress,
  loading = false,
}: Props) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={loading}
      style={{
        marginBottom: 0,
        opacity: loading ? 0.7 : 1,
      }}
    >
      <ThemedView
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        }}
        className="h-14 rounded-2xl flex-row items-center justify-center"
      >
        {loading ? (
          <ActivityIndicator size="small" style={{ marginRight: 12 }} />
        ) : (
          <Image
            source={image}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              resizeMode: "contain",
            }}
          />
        )}

        <ThemedText
          className="ml-4 text-base font-semibold"
        >
          {loading ? "Signing in..." : title}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}