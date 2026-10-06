import React from "react";
import { StyleSheet, View, Text, ViewStyle, TextStyle } from "react-native";
import { ThemedText } from "./ui/ThemedText";

export interface AppLevel {
  id: string;
  level: number;
  title: string;
  badge: string;
  emoji: string;
  color: string;
  minXp: number;
  maxXp: number;
  rewardCoins: number;
  perks: string[];
}

interface LevelBadgeProps {
  level?: Partial<AppLevel> | null;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  containerStyle,
  textStyle,
}) => {
  if (!level?.badge) return null;

  const brandColor = level.color || "#64748b";

  return (
    <View
      style={[
        styles.levelBadge,
        {
          
          borderColor: `${brandColor}40`,
          backgroundColor: `${brandColor}15`,
        },
        containerStyle,
      ]}
    >
      {level.emoji ? <Text style={styles.emojiText}>{level.emoji}</Text> : null}

      <ThemedText style={[styles.levelText, { color: brandColor }, textStyle]}>
        {level.badge}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  emojiText: {
    fontSize: 10,
    marginRight: 4,
    color: "#000000",
  },
  levelText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
