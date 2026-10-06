import React, { useCallback, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import PrimaryButton from "@/components/auth/primaryButton";
import LogoutButton from "@/components/logoutButton";
import { ThemedText } from "@/components/ui/ThemedText";

export default function SuspendedScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [checking, setChecking] = useState(false);

  // Re-check status whenever this screen regains focus (e.g. the user comes
  // back from Contact Support, or an admin lifts the suspension while
  // they're sitting here) and leave automatically once it's lifted.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        setChecking(true);
        await refreshUser();
        if (cancelled) return;
        setChecking(false);

        const latestStatus = useAuthStore.getState().user?.status;
        if (latestStatus && latestStatus !== "suspended") {
          router.replace("/" as any);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [refreshUser])
  );

  const reason = user?.statusReason;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.warningLight }]}>
          <Ionicons name="alert-circle" size={56} color={colors.warning} />
        </View>

        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>Account Suspended</ThemedText>
          <ThemedText style={{ fontSize: 16, color: colors.muted, textAlign: "center", lineHeight: 22 }}>
            {reason
              ? reason
              : "Your account has been temporarily suspended pending review."}
          </ThemedText>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* <View style={styles.infoRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
              <Feather name="eye" size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.infoText, { color: colors.muted }]}>
              You can still view your profile and any pending marketplace or hostel listings
            </ThemedText>
          </View> */}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
              <Feather name="message-circle" size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.infoText, { color: colors.muted }]}>
              Posting, messaging, and marketplace activity are on hold until this is resolved
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
              <Feather name="mail" size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.infoText, { color: colors.muted }]}>
              Think this is a mistake? Contact support to appeal
            </ThemedText>
          </View>
        </View>

        {checking && (
          <ActivityIndicator style={{ marginTop: 16 }} color={colors.muted} />
        )}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Contact Support"
          icon={false}
          onPress={() => router.push("/(features)/reportProblemScreen" as any)}
        />
        <LogoutButton />
        <Pressable
          style={styles.manageAccountLink}
          onPress={() => router.push("/(features)/accountActionScreen" as any)}
        >
          <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
            Want to leave instead? Deactivate or delete your account
          </ThemedText>
        </Pressable>
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
    gap: 4,
  },
  manageAccountLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
});
