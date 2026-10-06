import React from "react";
import { View } from "react-native";

interface Props {
  online?: boolean;
  size?: number;
  borderColor?: string;
}

export default function OnlineIndicator({
  online = false,
  size = 16,
  borderColor = "#FFFFFF",
}: Props) {
  if (!online) return null;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#22C55E",
        borderWidth: 2.5,
        borderColor,
      }}
    />
  );
}