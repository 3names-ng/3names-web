import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FloatingTabButton({ onPress }: any) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        top: -25,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 65,
          height: 65,
          borderRadius: 32.5,
          backgroundColor: "#6C3EF4",
          justifyContent: "center",
          alignItems: "center",

          shadowColor: "#6C3EF4",
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        <Ionicons name="add" size={34} color="white" />
      </View>
    </TouchableOpacity>
  );
}