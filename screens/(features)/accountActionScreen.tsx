import React, { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import PasswordInput from "@/components/auth/passwordInput";
import { showError, showSuccess } from "@/components/ui/toast";
import { authService } from "@/service/auth.service";
import { useAuthStore } from "@/store/authStore";
import { usePostDraftStore } from "@/store/postDraftStore";
import { clearRememberedCredentials } from "@/utils/credentialStorage";

export default function AccountActionScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode === "delete" ? "delete" : "deactivate";

  const logout = useAuthStore((state) => state.logout);
  const [currentPassword, setCurrentPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDelete = mode === "delete";
  const primaryAccent = colors.primary || "#7C3AED";
  const dangerColor = "#EF4444";

  const title = isDelete ? t("account.delete") : t("account.deactivate");

  const handleConfirm = async () => {
    if (!currentPassword) {
      showError("Please enter your current password to continue.");
      return;
    }

    const confirmTitle = isDelete ? t("account.deleteTitle") : t("account.deactivateTitle");
    const confirmMessage = isDelete
      ? "This action is permanent. Your account, profile, and content will be removed and cannot be recovered. Continue?"
      : "Your account will be hidden and you'll be signed out. You can log back in anytime to reactivate it. Continue?";

    Alert.alert(confirmTitle, confirmMessage, [
      { text: "Cancel", style: "cancel" },
      {
        text: isDelete ? "Delete" : "Deactivate",
        style: "destructive",
        onPress: runAction,
      },
    ]);
  };

  const runAction = async () => {
    setIsSubmitting(true);
    try {
      if (isDelete) {
        await authService.deleteAccount(currentPassword);
        // Drafts survive logout (kept per account), so remove this account's
        // drafts and their media now that the account is gone.
        const userId = useAuthStore.getState().user?.id;
        if (userId) usePostDraftStore.getState().removeDraftsForUser(userId);
        // Don't prefill the login form with a deleted account's credentials
        await clearRememberedCredentials();
        showSuccess(
          "Your account has been permanently deleted. We're sorry to see you go.",
          "Account Deleted"
        );
      } else {
        await authService.deactivateAccount(currentPassword);
        showSuccess(
          "Your account has been deactivated. You can reactivate it anytime by logging back in.",
          "Account Deactivated"
        );
      }

      router.replace("/auth/loginScreen");
      setTimeout(() => {
        logout();
      }, 0);
    } catch (error: any) {
     
      const message =
        error?.response?.data?.message?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        `Unable to ${isDelete ? "delete" : "deactivate"} your account. Please try again.`;
      showError(
        Array.isArray(message) ? message.join(", ") : message,
        "Action Failed"
      );
    } finally {
      setIsSubmitting(false);
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
          {title}
        </ThemedText>
        <View style={styles.placeholderIconButton} />
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Warning card */}
          <ThemedView
            style={[
              styles.warningCard,
              {
                borderColor: isDelete
                  ? "rgba(239, 68, 68, 0.4)"
                  : "rgba(245, 158, 11, 0.4)",
                backgroundColor: isDelete
                  ? "rgba(239, 68, 68, 0.08)"
                  : "rgba(245, 158, 11, 0.08)",
              },
            ]}
          >
            <Ionicons
              name={isDelete ? "warning" : "pause-circle"}
              size={26}
              color={isDelete ? dangerColor : "#F59E0B"}
            />
            <ThemedText
              style={[
                styles.warningText,
                { color: isDelete ? dangerColor : "#F59E0B" },
              ]}
            >
              {isDelete
                ? "This will permanently delete your account, profile, and all of your content. This action cannot be undone."
                : "Your account will be temporarily hidden and you'll be signed out of all sessions. You can reactivate it anytime by logging back in."}
            </ThemedText>
          </ThemedView>

          <ThemedText style={[styles.bodyText, { color: colors.muted }]}>
            {isDelete
              ? "To confirm, enter your current password below. All your data will be removed from our servers."
              : "To confirm, enter your current password below. Your friends will no longer see your profile or content."}
          </ThemedText>

          <View style={styles.passwordWrapper}>
            <PasswordInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              editable={!isSubmitting}
            />
          </View>

          <Pressable
            onPress={handleConfirm}
            disabled={isSubmitting}
            style={[
              styles.actionButton,
              { backgroundColor: isDelete ? dangerColor : "#F59E0B" },
              isSubmitting && styles.actionButtonDisabled,
            ]}
          >
            <ThemedText style={styles.actionButtonText}>
              {isSubmitting
                ? "Please wait..."
                : isDelete
                ? "Delete My Account"
                : "Deactivate My Account"}
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => router.back()} disabled={isSubmitting} style={styles.cancelButton}>
            <ThemedText style={[styles.cancelText, { color: colors.muted }]}>
              Cancel
            </ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
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
  placeholderIconButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  passwordWrapper: {
    marginBottom: 8,
  },
  actionButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
