import React from "react";
import {
  Image,
  View,
} from "react-native";

import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  avatars: string[];
  max?: number;
  size?: number;
}

export default function GroupAvatarStack({
  avatars,
  max = 4,
  size = 34,
}: Props) {
  const { colors } = useTheme();

  const visible = avatars.slice(0, max);
  const remaining =
    avatars.length > max
      ? avatars.length - max
      : 0;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {visible.map((avatar, index) => (
        <Image
          key={index}
          source={{ uri: avatar }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,

            marginLeft: index === 0 ? 0 : -10,

            borderWidth: 2,
            borderColor: colors.card,

            backgroundColor: "#E5E7EB",
          }}
        />
      ))}

      {remaining > 0 && (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,

            marginLeft: -10,

            backgroundColor: "#7C3AED",

            borderWidth: 2,
            borderColor: colors.card,

            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText
            style={{
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: "800",
            }}
          >
            +{remaining}
          </ThemedText>
        </View>
      )}
    </View>
  );
}