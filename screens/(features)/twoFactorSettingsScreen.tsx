import React, { useState } from "react";
import {
  View,
  Switch,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { showError, showSuccess } from "@/components/ui/toast";
import OTPInput from "@/components/auth/otpInput";
import PrimaryButton from "@/components/auth/primaryButton";
import { authService } from "@/service/auth.service";
import { useAuthStore } from "@/store/authStore";

export default function TwoFactorSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const primaryAccent = colors.primary || "#7C3AED";

  const currentUser = useAuthStore((state) => state.user);
  const updateAuthUser = useAuthStore((state) => state.updateUser);

  const twoFactorEnabled = Boolean(
    currentUser?.twoFactorEnabled ||
      (currentUser as any)?.twoFactorEnabled,
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<"enable" | "disable">(
    "enable",
  );
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const startToggle = async (value: boolean) => {
    const action = value ? "enable" : "disable";
    try {
      setLoading(true);
      await authService.send2faOtp(action);
      setPendingAction(action);
      setOtp("");
      setModalVisible(true);
      showSuccess(
        `A verification code has been sent to your email to ${action} two-factor authentication.`,
        "Code Sent",
      );
    } catch (error: any) {
      showError(
        error?.response?.data?.message || "Could not send the verification code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async () => {
    if (otp.length !== 6) {
      showError("Please enter the 6-digit code sent to your email.");
      return;
    }
    try {
      setLoading(true);
      if (pendingAction === "enable") {
        await authService.enable2fa(otp);
        updateAuthUser({ twoFactorEnabled: true });
        showSuccess("Two-factor authentication enabled.", "Security");
      } else {
        await authService.disable2fa(otp);
        updateAuthUser({ twoFactorEnabled: false });
        showSuccess("Two-factor authentication disabled.", "Security");
      }
      setModalVisible(false);
      setOtp("");
    } catch (error: any) {
      showError(
        error?.response?.data?.message || "Invalid or expired verification code.",
        "Verification Failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.iconButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
          Two-Factor Authentication
        </ThemedText>
        <View style={styles.placeholderIconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        <ThemedView
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.primaryLight || "rgba(124,58,237,0.12)",
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name={twoFactorEnabled ? "shield-checkmark" : "shield-outline"}
            size={26}
            color={twoFactorEnabled ? "#22c55e" : colors.muted}
          />
          <View style={styles.statusText}>
            <ThemedText style={styles.statusTitle}>
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </ThemedText>
            <ThemedText style={[styles.statusSubtitle, { color: colors.muted }]}>
              {twoFactorEnabled
                ? "You'll need a code from your email to sign in."
                : "Add an extra layer of security to your account."}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Toggle row */}
        <ThemedView style={[styles.row, { borderColor: colors.border }]}>
          <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="key" size={20} color={primaryAccent} />
          </View>
          <View style={styles.rowText}>
            <ThemedText style={styles.rowTitle}>Require 2FA at login</ThemedText>
            <ThemedText style={[styles.rowSubtitle, { color: colors.muted }]}>
              A 6-digit code is emailed to you each time you sign in.
            </ThemedText>
          </View>
          <Switch
            value={twoFactorEnabled}
            onValueChange={startToggle}
            disabled={loading}
            trackColor={{ false: colors.border, true: primaryAccent }}
            thumbColor={twoFactorEnabled ? "#FFFFFF" : "#F4F4F5"}
            ios_backgroundColor={colors.border}
          />
        </ThemedView>

        <ThemedText style={[styles.note, { color: colors.muted }]}>
          How it works: when enabled, signing in with your email and password
          will also require the 6-digit code we email to your account. You can
          disable it anytime using the same code verification.
        </ThemedText>
      </ScrollView>

      {/* OTP confirmation modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <ThemedView
            style={[
              styles.modalSheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <ThemedText style={styles.modalTitle}>
              {pendingAction === "enable" ? "Enable 2FA" : "Disable 2FA"}
            </ThemedText>
            <ThemedText style={[styles.modalSubtitle, { color: colors.muted }]}>
              Enter the 6-digit code sent to your email to{" "}
              {pendingAction === "enable" ? "enable" : "disable"} two-factor
              authentication.
            </ThemedText>
{/* 
            <OTPInput value={otp} onChange={setOtp} />

            {loading ? (
              <ActivityIndicator color={primaryAccent} style={{ marginTop: 16 }} />
            ) : (
              <PrimaryButton
                title={pendingAction === "enable" ? "Enable 2FA" : "Disable 2FA"}
                onPress={confirmAction}
              />
            )} */}

            <View style={{ width: "100%", marginBottom: 10 }}>
                      <OTPInput value={otp} onChange={setOtp} /></View>
            
                      <View style={{ width: "100%", marginTop: 30, marginBottom: 10 }}>
                        <PrimaryButton
                        title={pendingAction === "enable" ? "Enable 2FA" : "Disable 2FA"}
                onPress={confirmAction}
                          loading={loading}
                        />
                      </View>

            <Pressable
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                Cancel
              </ThemedText>
            </Pressable>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 44,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIconButton: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusText: { flex: 1, marginLeft: 12 },
  statusTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  statusSubtitle: { fontSize: 12, lineHeight: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowText: { flex: 1, marginRight: 8 },
  rowTitle: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  rowSubtitle: { fontSize: 12, lineHeight: 16 },
  note: { fontSize: 12, lineHeight: 18, marginTop: 8, paddingHorizontal: 4 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  modalSubtitle: { fontSize: 13, lineHeight: 18, textAlign: "center", marginTop: 6, marginBottom: 20 },
});
