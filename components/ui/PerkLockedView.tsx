import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePerks } from "@/hooks/usePerks";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface PerkLockedViewProps {
  /** The perk name required to unlock this feature */
  requiredPerk: string;
  /** The minimum level title to display (e.g. "Level 7 — Leader") */
  requiredLevel?: string;
  /** The child content to render when the perk is unlocked */
  children: React.ReactNode;
  /** Optional callback when the locked overlay is pressed */
  onLockedPress?: () => void;
}

/**
 * Wraps any content and shows a disabled/locked overlay when
 * the user doesn't have the required perk.
 *
 * When unlocked, renders children normally.
 * When locked, renders a dimmed version with a lock icon and "Level up to unlock" message.
 */
export function PerkLockedView({
  requiredPerk,
  requiredLevel,
  children,
  onLockedPress,
}: PerkLockedViewProps) {
  const { hasPerk } = usePerks();
  const { colors } = useTheme();
  const isUnlocked = hasPerk(requiredPerk);

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Dimmed children underneath */}
      <View style={styles.dimmedContent}>{children}</View>

      {/* Lock overlay */}
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.background + "DD" }]}
        onPress={onLockedPress}
      >
        <View style={[styles.lockBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="lock-closed" size={18} color={colors.muted} />
          <ThemedText style={[styles.lockText, { color: colors.muted }]}>
            Level up to unlock
          </ThemedText>
          {requiredLevel && (
            <ThemedText style={[styles.levelText, { color: colors.primary }]}>
              {requiredLevel}
            </ThemedText>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  dimmedContent: {
    opacity: 0.35,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  lockText: {
    fontSize: 12,
    fontWeight: "600",
  },
  levelText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
