import React from "react";
import {
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  checked: boolean;
  onToggle: () => void;

  title: string;

  highlight?: string;

  onHighlightPress?: () => void;

  /** Optional second link, rendered as "<highlight> and <secondHighlight>". */
  secondHighlight?: string;

  onSecondHighlightPress?: () => void;
}

export default function CheckBox({
  checked,
  onToggle,
  title,
  highlight,
  onHighlightPress,
  secondHighlight,
  onSecondHighlightPress,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginVertical: 12,
      }}
    >
      {/* Checkbox */}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onToggle}
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: checked
            ? "#7C3AED"
            : colors.border,
          backgroundColor: checked
            ? "#7C3AED"
            : "transparent",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 2,
        }}
      >
        {checked && (
          <Ionicons
            name="checkmark"
            size={16}
            color="#FFFFFF"
          />
        )}
      </TouchableOpacity>

      {/* Text */}

      <View
        style={{
          flex: 1,
          marginLeft: 12,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        <ThemedText
          style={{
            color: colors.secondary,
            lineHeight: 22,
            fontSize: 15,
          }}
        >
          {title}{" "}
        </ThemedText>

        {highlight && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onHighlightPress}
          >
            <ThemedText
              style={{
                color: "#7C3AED",
                fontWeight: "700",
                lineHeight: 22,
                fontSize: 15,
              }}
            >
              {highlight}
            </ThemedText>
          </TouchableOpacity>
        )}

        {secondHighlight && (
          <>
            <ThemedText
              style={{
                color: colors.secondary,
                lineHeight: 22,
                fontSize: 15,
              }}
            >
              {" "}and{" "}
            </ThemedText>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onSecondHighlightPress}
            >
              <ThemedText
                style={{
                  color: "#7C3AED",
                  fontWeight: "700",
                  lineHeight: 22,
                  fontSize: 15,
                }}
              >
                {secondHighlight}
              </ThemedText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}