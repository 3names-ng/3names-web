import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { AlertTriangle, ArrowLeft, FileX, RefreshCw, ShieldAlert } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import CheckBox from "@/components/auth/checkBox";
import UploadCard from "@/components/auth/uploadCard";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { showError, showSuccess } from "@/components/ui/toast";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { authService } from "@/service/auth.service";
import { useAuthStore } from "@/store/authStore";

interface PickedFile {
  name: string;
  uri: string;
  mimeType?: string;
}

export default function StudentVerificationScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const primaryAccent = colors.primary || "#7C3AED";
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  // Normalize verification status strings
  const rawStatus = (user?.verificationStatus || "").toLowerCase();
  const isVerified = rawStatus === "verified";
  const isPending = rawStatus === "unverified" || rawStatus === "pending";
  const isRejected = rawStatus === "rejected";
  const isUnverified = !isVerified && !isPending && !isRejected;

  // Rejection feedback details (can be supplied from user state/API response)
  const rejectionReason =
    user?.rejectionReason ||
    "The documents uploaded were blurry and could not be verified by our compliance team. Please upload clearer images showing your full name and expiry date.";

  const documentRejectionDetails = {
    studentIdRejected: user?.isStudentIdRejected ?? true,
    studentIdReason: "Text is blurry and ID card is expired.",
    admissionLetterRejected: user?.isAdmissionLetterRejected ?? false,
    admissionLetterReason: "Valid document accepted.",
  };

  const canUpload = isUnverified || isRejected;

  const isRestricted = user?.status === "restricted";
  const restrictionReason = user?.statusReason;

  // Deadline to resubmit before an automatic restriction kicks in. Only
  // shown while it's still in the future — once it passes, the account
  // shows as restricted instead (see isRestricted above).
  const graceDeadline = user?.verificationGraceExpiresAt
    ? new Date(user.verificationGraceExpiresAt)
    : null;
  const graceDeadlinePassed = graceDeadline ? graceDeadline.getTime() <= Date.now() : true;
  const graceDaysLeft =
    graceDeadline && !graceDeadlinePassed
      ? Math.max(1, Math.ceil((graceDeadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : 0;

  const [studentId, setStudentId] = useState<PickedFile | null>(null);
  const [admissionLetter, setAdmissionLetter] = useState<PickedFile | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh user data when verification status changes
  useEffect(() => {
    // If user is verified or rejected, fetch fresh data from server
    // to ensure we have the latest rejectionReason and other fields
    if (isVerified || isRejected) {
      const fetchFreshData = async () => {
        try {
          setIsRefreshing(true);
          await refreshUser();
        } catch (error) {
          console.log("Auto-refresh failed:", error);
        } finally {
          setIsRefreshing(false);
        }
      };

      fetchFreshData();
    }
  }, [isVerified, isRejected]);

  useEffect(() => {
    if (!studentId && user?.schoolIdCardUrl) {
      setStudentId({
        name: "Student ID Card (previously uploaded)",
        uri: user.schoolIdCardUrl,
      });
    }
    if (!admissionLetter && user?.administrationLetterUrl) {
      setAdmissionLetter({
        name: "Admission Letter (previously uploaded)",
        uri: user.administrationLetterUrl,
      });
    }
  }, [user]);

  async function pickDocument(setter: (file: PickedFile | null) => void) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: "image/*",
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setter({
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType || undefined,
        });
      }
    } catch (err) {
      console.log("Document picking error:", err);
    }
  }

  const handleSubmit = async () => {
    if (!studentId && !admissionLetter) {
      showError("Please upload at least one document to proceed.");
      return;
    }
    if (!accepted) {
      showError("Please confirm that the documents belong to you.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      if (studentId && !studentId.uri.startsWith("http")) {
        const name = studentId.name || "student_id.png";
        formData.append("schoolIdCard", {
          uri: studentId.uri,
          name,
          type: studentId.mimeType || "image/png",
        } as any);
      }

      if (admissionLetter && !admissionLetter.uri.startsWith("http")) {
        const name = admissionLetter.name || "admission_letter.png";
        formData.append("administrationLetter", {
          uri: admissionLetter.uri,
          name,
          type: admissionLetter.mimeType || "image/png",
        } as any);
      }

      const response = await authService.submitStudentVerification(formData);

      if (response?.user) {
        updateUser(response.user);
      }

      showSuccess(
        "Your documents have been submitted for review.",
        "Verification Resubmitted"
      );

      // Refresh to get any updated verification status from server
      try {
        await refreshUser();
      } catch (error) {
        console.log("Post-submit refresh failed:", error);
      }
    } catch (error: any) {
      console.log("Student Verification Error:", error);
      const message =
        error?.response?.data?.message?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Unable to submit your documents. Please try again.";
      showError(
        Array.isArray(message) ? message.join(", ") : message,
        "Submission Failed"
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
          {t("verification.title")}
        </ThemedText>
        <View style={styles.placeholderIconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Restricted Account Notice */}
        {isRestricted && (
          <View style={[styles.restrictionNoticeCard, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
            <View style={styles.rejectionNoticeHeader}>
              <ShieldAlert size={18} color={colors.warning} />
              <ThemedText style={[styles.restrictionNoticeTitle, { color: colors.warning }]}>
                Your account is restricted
              </ThemedText>
            </View>
            <ThemedText style={[styles.restrictionNoticeText, { color: colors.text }]}>
              {restrictionReason ||
                "Your account is on restricted access. You can still browse, comment, message, and buy, but you can't create new posts, listings, or send gifts."}
            </ThemedText>
            {isRejected && (
              <ThemedText style={[styles.restrictionNoticeText, { color: colors.text, marginTop: 6, fontWeight: "600" }]}>
                Resubmit your documents below to lift this automatically.
              </ThemedText>
            )}
          </View>
        )}

        {/* Verification Status Banner */}
        <ThemedView
          style={[
            styles.statusCard,
            {
              borderColor: isVerified
                ? "rgba(34, 197, 94, 0.4)"
                : isPending
                ? "rgba(245, 158, 11, 0.4)"
                : isRejected
                ? "rgba(239, 68, 68, 0.4)"
                : colors.border,
              backgroundColor: isVerified
                ? "rgba(34, 197, 94, 0.08)"
                : isPending
                ? "rgba(245, 158, 11, 0.08)"
                : isRejected
                ? "rgba(239, 68, 68, 0.08)"
                : colors.card,
            },
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor: isVerified
                  ? "rgba(34, 197, 94, 0.15)"
                  : isPending
                  ? "rgba(245, 158, 11, 0.15)"
                  : isRejected
                  ? "rgba(239, 68, 68, 0.15)"
                  : colors.primaryLight,
              },
            ]}
          >
            <Ionicons
              name={
                isVerified
                  ? "checkmark-circle"
                  : isPending
                  ? "time"
                  : isRejected
                  ? "close-circle"
                  : "shield-outline"
              }
              size={28}
              color={
                isVerified
                  ? "#22C55E"
                  : isPending
                  ? "#F59E0B"
                  : isRejected
                  ? "#EF4444"
                  : primaryAccent
              }
            />
          </View>

          <ThemedText
            style={[
              styles.statusTitle,
              {
                color: isVerified
                  ? "#22C55E"
                  : isPending
                  ? "#F59E0B"
                  : isRejected
                  ? "#EF4444"
                  : colors.text,
              },
            ]}
          >
            {isVerified
              ? "Congratulations! 🎉"
              : isPending
              ? "Verification Under Review"
              : isRejected
              ? "Verification Rejected"
              : "Student Verification"}
          </ThemedText>

          <ThemedText style={[styles.statusSubtitle, { color: colors.muted }]}>
            {isVerified
              ? `Your student identity has been verified successfully!${
                  user?.schoolName ? ` School: ${user.schoolName}` : ""
                }`
              : isPending
              ? "Your submitted documents are currently under review by our team. This usually takes less than 15 minutes. You'll receive a notification once approved."
              : isRejected
              ? "Your verification request could not be approved. Review the feedback below and upload clear, updated documents to re-apply."
              : "Verify your student identity to unlock verified-only features like exclusive campus communities and student deals."}
          </ThemedText>
        </ThemedView>

        {/* Global Rejection Feedback Box */}
        {isRejected && (
          <View style={styles.rejectionNoticeCard}>
            <View style={styles.rejectionNoticeHeader}>
              <AlertTriangle size={18} color="#EF4444" />
              <ThemedText style={styles.rejectionNoticeTitle}>
                Reason for Rejection
              </ThemedText>
            </View>
            <ThemedText style={styles.rejectionNoticeText}>
              {rejectionReason}
            </ThemedText>
            {graceDeadline && !graceDeadlinePassed && (
              <ThemedText style={styles.graceDeadlineText}>
                Resubmit within {graceDaysLeft} day{graceDaysLeft === 1 ? "" : "s"} (by{" "}
                {graceDeadline.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
                ) or your account will be automatically restricted.
              </ThemedText>
            )}
          </View>
        )}

        {/* Action Form or Read-Only State */}
        {canUpload ? (
          <>
            <ThemedText style={[styles.sectionHeader, { color: colors.muted }]}>
              {isRejected ? "RE-UPLOAD DOCUMENTS" : "UPLOAD DOCUMENTS"}
            </ThemedText>
            <ThemedText style={[styles.bodyText, { color: colors.muted }]}>
              {isRejected
                ? "Replace the flagged documents below with high-resolution, unedited photos."
                : "Upload at least one document below. Ensure your full name and institution are clearly readable."}
            </ThemedText>

            {/* Student ID Section */}
            <View style={styles.documentFieldContainer}>
              <UploadCard
                title={t("verification.studentId")}
                subtitle={
                  studentId ? "Document Attached" : t("pastQ.tapToUpload")
                }
                icon="credit-card"
                file={studentId}
                onPress={() => pickDocument(setStudentId)}
              />
              {isRejected && documentRejectionDetails.studentIdRejected && (
                <View style={styles.docFeedbackBadge}>
                  <FileX size={14} color="#EF4444" />
                  <ThemedText style={styles.docFeedbackText}>
                    Document Rejected: {documentRejectionDetails.studentIdReason}
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.orDivider}>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <ThemedText style={[styles.orText, { color: colors.muted }]}>
                OR
              </ThemedText>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>

            {/* Admission Letter Section */}
            <View style={styles.documentFieldContainer}>
              <UploadCard
                title={t("verification.admissionLetter")}
                subtitle={
                  admissionLetter ? "Document Attached" : t("pastQ.tapToUpload")
                }
                icon="file-text"
                file={admissionLetter}
                onPress={() => pickDocument(setAdmissionLetter)}
              />
              {isRejected && documentRejectionDetails.admissionLetterRejected && (
                <View style={styles.docFeedbackBadge}>
                  <FileX size={14} color="#EF4444" />
                  <ThemedText style={styles.docFeedbackText}>
                    Document Rejected: {documentRejectionDetails.admissionLetterReason}
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.checkboxWrapper}>
              <CheckBox
                checked={accepted}
                onToggle={() => setAccepted(!accepted)}
                title={t("verification.confirmDocs")}
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting || (!studentId && !admissionLetter) || !accepted}
              style={[
                styles.submitButton,
                { backgroundColor: primaryAccent },
                (isSubmitting || (!studentId && !admissionLetter) || !accepted) &&
                  styles.submitButtonDisabled,
              ]}
            >
              {isRejected && <RefreshCw size={18} color="#FFFFFF" style={{ marginRight: 8 }} />}
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting
                  ? "Submitting..."
                  : isRejected
                  ? "Resubmit Documents"
                  : "Submit Documents"}
              </ThemedText>
            </Pressable>
          </>
        ) : isPending ? (
          <ThemedView
            style={[styles.verifiedInfo, { borderColor: colors.border }]}
          >
            <Pressable
              onPress={async () => {
                setIsRefreshing(true);
                try {
                  await refreshUser();
                  showSuccess("Data refreshed", "Verification Status Updated");
                } catch (error) {
                  showError("Failed to refresh. Please try again.");
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <RefreshCw size={16} color={isRefreshing ? colors.muted : "#F59E0B"} style={{ animationDuration: 1000 }} />
              <ThemedText style={[styles.verifiedInfoText, { color: colors.muted }]}>
                {isRefreshing
                  ? "Refreshing..."
                  : "Your documents are submitted. Click to refresh or tap to check status."}
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <ThemedView
            style={[styles.verifiedInfo, { borderColor: colors.border }]}
          >
            <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
            <ThemedText
              style={[styles.verifiedInfoText, { color: colors.muted }]}
            >
              You're all set! Your verified student badge is active on your profile.
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
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
  statusCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  statusSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  rejectionNoticeCard: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  restrictionNoticeCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },
  restrictionNoticeTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  restrictionNoticeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  rejectionNoticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  rejectionNoticeTitle: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
  rejectionNoticeText: {
    color: "#EF4444",
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  graceDeadlineText: {
    color: "#EF4444",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  documentFieldContainer: {
    gap: 6,
  },
  docFeedbackBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  docFeedbackText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  line: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: "600",
  },
  checkboxWrapper: {
    marginTop: 8,
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  verifiedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
  },
  verifiedInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});