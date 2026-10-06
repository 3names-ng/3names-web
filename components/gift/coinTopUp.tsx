import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import TopUpModal from "./topUpModal";

/**
 * Top-up entry points for screens where coins are used to play. Both open the
 * shared TopUpModal (store in-app purchase on iOS / Android, Paystack on web)
 * and call onToppedUp afterwards so the screen can refresh its balance.
 */

interface CoinBalanceBadgeProps {
  balance: number;
  onToppedUp: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Header coin badge with a "+" — tap to buy more coins. */
export function CoinBalanceBadge({ balance, onToppedUp, style }: CoinBalanceBadgeProps) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${balance} coins. Buy more coins`}
        style={[
          styles.badge,
          { backgroundColor: isDark ? "rgba(255, 215, 0, 0.15)" : "#FFF8E1" },
          style,
        ]}
      >
        <Text style={styles.coin}>🪙</Text>
        <Text style={styles.balance}>{balance}</Text>
        <Ionicons name="add-circle" size={18} color="#F59E0B" />
      </TouchableOpacity>
      <TopUpModal visible={open} onClose={() => setOpen(false)} onPaymentAttemptFinished={onToppedUp} />
    </>
  );
}

interface TopUpLinkProps {
  onToppedUp: () => void;
  label?: string;
}

/** Inline "Not enough coins? Top up" prompt, for when a stake can't be afforded. */
export function TopUpLink({ onToppedUp, label = "Not enough coins? Top up" }: TopUpLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={styles.link}
        hitSlop={8}
      >
        <Ionicons name="add-circle-outline" size={16} color="#F59E0B" />
        <Text style={styles.linkText}>{label}</Text>
      </TouchableOpacity>
      <TopUpModal visible={open} onClose={() => setOpen(false)} onPaymentAttemptFinished={onToppedUp} />
    </>
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
  link: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  linkText: { color: "#F59E0B", fontWeight: "700", fontSize: 14 },
});
