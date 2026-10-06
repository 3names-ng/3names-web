import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import PrimaryButton from "@/components/auth/primaryButton";
import { ThemedText } from "@/components/ui/ThemedText";

// Shown once, right after login, when the account is on probation. Unlike
// suspendedScreen this never gates navigation — the user can always tap
// through to the app; browsing, comments, messaging, and purchases stay
// fully available. Only new posts/listings/gifts are blocked, which the
// axios interceptor explains inline (via a toast) if they're attempted.
export default function RestrictedScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const reason = user?.statusReason;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.warningLight }]}>
          <Ionicons name="shield-half" size={56} color={colors.warning} />
        </View>

        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>Account Restricted</ThemedText>
          <ThemedText style={{ fontSize: 16, color: colors.muted, textAlign: "center", lineHeight: 22 }}>
            {reason
              ? reason
              : "Your account is on probation while we review recent activity."}
          </ThemedText>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.successLight }]}>
              <Feather name="check" size={18} color={colors.success} />
            </View>
            <ThemedText style={[styles.infoText, { color: colors.muted }]}>
              Browsing, commenting, messaging, and buying still work as normal
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.dangerLight }]}>
              <Feather name="x" size={18} color={colors.danger} />
            </View>
            <ThemedText style={[styles.infoText, { color: colors.muted }]}>
              New posts, marketplace/hostel listings, and sending gifts are on hold
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            style={styles.infoRow}
            onPress={() => router.push("/(features)/reportProblemScreen" as any)}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
              <Feather name="mail" size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.infoText, { color: colors.muted }]}>
              Think this is a mistake? Contact support to appeal
            </ThemedText>
            <Feather name="chevron-right" size={18} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Continue to 3NAMES" onPress={() => router.replace("/(tabs)" as any)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  infoCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
});
