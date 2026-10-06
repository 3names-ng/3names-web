import React from "react";
import {
  TouchableOpacity,
  ViewStyle,
  Text
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  onPress: () => void;
  style?: ViewStyle;
}

export default function SwitchAccountButton({
  onPress,
  style,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={style}
      className="self-end flex-row items-center rounded-full px-4 py-2.5"
    >
      <Ionicons
        name="log-in-outline"
        size={18}
        color="#FFFFFF"
      />

      <Text className="ml-2 text-xs font-semibold text-white">
        Log in to another account
      </Text>
    </TouchableOpacity>
  );
}