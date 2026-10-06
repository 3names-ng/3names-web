import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

/**
 * Stars (game coins, `bonusBalance`) are the only currency that can be staked:
 * they come from wins and rewards, never from purchases, and can't be gifted
 * or withdrawn. There is
 * deliberately no way to buy them from a game screen (App Store 5.3 /
 * Google Play real-money gambling policy).
 */
export const GAME_COINS_EXPLAINER =
  "Every account gets free starter Stars, and you earn more by winning games and from rewards " +
  "like level-ups, puzzles and treasure hunts. " +
  "Only Stars can be staked. Campus Coins you buy are for gifts and the store and can't be used in games, " +
  "and Stars can't be bought, gifted or withdrawn.";

interface GameCoinsBadgeProps {
  balance: number;
  style?: StyleProp<ViewStyle>;
}

/** Header badge showing the player's Stars. Tap for an explanation. */
export function GameCoinsBadge({ balance, style }: GameCoinsBadgeProps) {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => Alert.alert("Stars", GAME_COINS_EXPLAINER)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${balance} Stars. What are Stars?`}
      style={[
        styles.badge,
        { backgroundColor: isDark ? "rgba(255, 215, 0, 0.15)" : "#FFF8E1" },
        style,
      ]}
    >
      <Text style={styles.coin}>⭐</Text>
      <Text style={styles.balance}>{balance}</Text>
      <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
    </TouchableOpacity>
  );
}

/** Inline note for when a stake can't be afforded. */
export function GameCoinsHint({ text = "Not enough Stars. Win games or collect rewards to earn more." }: { text?: string }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => Alert.alert("Stars", GAME_COINS_EXPLAINER)}
      accessibilityRole="button"
      style={styles.hint}
      hitSlop={8}
    >
      <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
      <Text style={[styles.hintText, { color: colors.muted }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  coin: { fontSize: 14 },
  balance: { fontSize: 14, fontWeight: "700", color: "#FFD700" },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  hintText: { fontWeight: "600", fontSize: 13, textAlign: "center", flexShrink: 1 },
});
