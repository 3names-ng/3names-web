import React from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

export interface CategoryCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  backgroundColor: string;
  onPress?: () => void;
}

export default function CategoryCard({
  title,
  subtitle,
  icon,
  backgroundColor,
  onPress,
}: CategoryCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="w-full rounded-2xl p-3 shadow-sm"
      style={{
        backgroundColor: colors.card,
     borderWidth:1, 
     borderColor:colors.border
      }}
    >
      <View
        className="mb-3 h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor }}
      >
        {icon}
      </View>

      <ThemedText
        numberOfLines={2}
        className="text-sm font-bold"
        color="text"
      >
        {title}
      </ThemedText>

      <ThemedText
        numberOfLines={2}
        className="mt-1 text-[10px]"
        // color="muted"
      >
        {subtitle}
      </ThemedText>
    </TouchableOpacity>
  );
}