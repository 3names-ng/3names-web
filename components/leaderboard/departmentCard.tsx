import React from "react";
import { TouchableOpacity, View } from "react-native";

import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  departmentId?: string;
  onPress?: () => void;
}

export default function DepartmentIdCard({
  departmentId = "departmentId of Computer Science",
  onPress,
}: Props) {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        marginHorizontal: 20,
        marginBottom: 24,

        height: 66,

        backgroundColor: colors.card,

        borderRadius: 18,

        borderWidth: 1,
        borderColor: colors.border,

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        paddingHorizontal: 18,

        shadowColor: "#000",
        shadowOpacity: isDark ? 0 : 0.05,
        shadowRadius: 10,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        elevation: 2,
      }}
    >
      {/* Left */}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: isDark ? "#262626" : "#F8F8FC",

            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Feather
            name="shield"
            size={22}
            color="#6D28D9"
          />

          <Ionicons
            name="school-outline"
            size={11}
            color="#6D28D9"
            style={{
              position: "absolute",
              bottom: 8,
            }}
          />
        </View>

        <ThemedText
          numberOfLines={1}
          style={{
            marginLeft: 14,
            fontSize: 19,
            fontWeight: "700",
            color: colors.text,
            flex: 1,
          }}
        >
          {departmentId}
        </ThemedText>
      </View>

      {/* Arrow */}

      <Ionicons
        name="chevron-down"
        size={24}
        color={colors.text}
      />
    </TouchableOpacity>
  );
}