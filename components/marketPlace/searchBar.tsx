import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";

import { useTheme } from "@/hooks/useTheme";

export default function SearchBar() {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        marginTop: -36,
        marginHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* Search */}

      <View
        style={{
          flex: 1,
          height: 64,
          borderRadius: 22,
          backgroundColor: colors.card,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,

          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: {
            width: 0,
            height: 8,
          },

          elevation: 8,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons
          name="search"
          size={26}
          color={isDark ? "#A1A1AA" : "#9CA3AF"}
        />

        <TextInput
          placeholder="Search items, categories or sellers..."
          placeholderTextColor={isDark ? "#A1A1AA" : "#9CA3AF"}
          style={{
            flex: 1,
            marginLeft: 12,
            color: colors.text,
            fontSize: 17,
          }}
        />
      </View>

      {/* Filter Button */}

      <TouchableOpacity
        activeOpacity={0.9}
        style={{
          width: 64,
          height: 64,
          borderRadius: 22,
          marginLeft: 14,
          backgroundColor: colors.card,
          justifyContent: "center",
          alignItems: "center",

          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: {
            width: 0,
            height: 8,
          },

          elevation: 8,

          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Feather
          name="sliders"
          size={24}
          color="#7C3AED"
        />
      </TouchableOpacity>
    </View>
  );
}