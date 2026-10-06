import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/store/authStore";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import { jobsService, Job, JobApplication } from "@/service/jobs.service";
import { showError, showSuccess } from "@/components/ui/toast";
import AuthHeader from "@/components/auth/authHeader";
import { JobDetailSkeleton } from "@/components/jobs/jobSkeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: "#10B981",
  part_time: "#3B82F6",
  internship: "#8B5CF6",
  remote: "#F59E0B",
  contract: "#EC4899",
  nysc: "#EF4444",
  freelance: "#06B6D4",
};

const JOB_TYPE_GRADIENTS: Record<string, readonly [string, string]> = {
  full_time: ["#10B981", "#059669"],
  part_time: ["#3B82F6", "#2563EB"],
  internship: ["#8B5CF6", "#7C3AED"],
  remote: ["#F59E0B", "#D97706"],
  contract: ["#EC4899", "#DB2777"],
  nysc: ["#EF4444", "#DC2626"],
  freelance: ["#06B6D4", "#0891B2"],
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#D97706" },
  reviewed: { bg: "#DBEAFE", text: "#2563EB" },
  shortlisted: { bg: "#D1FAE5", text: "#059669" },
  rejected: { bg: "#FEE2E2", text: "#DC2626" },
  accepted: { bg: "#D1FAE5", text: "#059669" },
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showApplications, setShowApplications] = useState(false);

  const isOwner = job?.postedById === currentUser?.id;
  const typeColor = JOB_TYPE_COLORS[job?.type || ""] || "#6B7280";
  const gradients = JOB_TYPE_GRADIENTS[job?.type || ""] || ["#6B7280", "#4B5563"];

  useEffect(() => {
    if (id) loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const data = await jobsService.getJob(id!);
      setJob(data);
    } catch (error) {
      console.error("Failed to load job:", error);
      showError(t("jobs.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      showError(t("jobs.pleaseWriteCover"));
      return;
    }
    try {
      setApplying(true);
      await jobsService.applyToJob(id!, { coverLetter: coverLetter.trim() });
      showSuccess(t("jobs.applicationSent"), t("jobs.applicationSubmitted"));
      setShowApplyModal(false);
      setCoverLetter("");
      loadJob();
    } catch (error: any) {
      showError(error?.response?.data?.message || t("jobs.failedToApply"));
    } finally {
      setApplying(false);
    }
  };

  const loadApplications = async () => {
    try {
      const data = await jobsService.getApplications(id!);
      setApplications(data);
      setShowApplications(true);
    } catch (error) {
      showError(t("jobs.failedToLoadApps"));
    }
  };

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      await jobsService.updateApplicationStatus(appId, status);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status } : a))
      );
      showSuccess(t("jobs.statusUpdated"));
    } catch (error) {
      showError(t("jobs.failedToUpdate"));
    }
  };

  const handleDelete = async () => {
    Alert.alert(t("jobs.deleteJob"), t("jobs.deleteConfirm"), [
      { text: t("action.cancel"), style: "cancel" },
      {
        text: t("action.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await jobsService.deleteJob(id!);
            showSuccess(t("jobs.jobDeleted"));
            router.back();
          } catch (error) {
            showError(t("jobs.failedToDelete"));
          }
        },
      },
    ]);
  };

  if (loading) {
    // Real header (with its back button) stays up; only the body is a skeleton
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <AuthHeader title={t("jobs.detailTitle")} subtitle={t("jobs.detailSubtitle")} />
        <JobDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyState, { backgroundColor: isDark ? "#1E293B" : "#F8FAFC" }]}>
          <Ionicons name="briefcase-outline" size={48} color={colors.muted} />
          <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
            {t("jobs.notFound")}
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.muted }]}>
            {t("jobs.notFoundDesc")}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Hero Section with Gradient */}
      <LinearGradient
        colors={isDark ? ["#1E293B", "#0F172A"] : ["#F8FAFC", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Header */}
        {/* <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.05)" }]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            Job Details
          </ThemedText>

          {isOwner ? (
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.deleteBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 42 }} />
          )}
        </View> */}

        <AuthHeader 
            title={t("jobs.detailTitle")} 
            subtitle={t("jobs.detailSubtitle")} 
          />

        {/* Company Hero Section */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.companyLogoLarge,
              {
                shadowColor: typeColor,
                shadowOpacity: isDark ? 0.3 : 0.2,
                shadowRadius: 16,
              },
            ]}
          >
            <LinearGradient
              colors={gradients}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradientLarge}
            >
              <ThemedText style={styles.companyInitialLarge}>
                {job.company?.[0]?.toUpperCase() || "C"}
              </ThemedText>
            </LinearGradient>
          </View>

          <ThemedText style={[styles.jobTitleLarge, { color: colors.text }]}>
            {job.title}
          </ThemedText>
          <ThemedText style={[styles.companyNameLarge, { color: colors.muted }]}>
            {job.company}
          </ThemedText>

          {/* Type Badge */}
          <LinearGradient
            colors={gradients}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroTypeBadge}
          >
            <Ionicons name="briefcase" size={14} color="#FFFFFF" />
            <ThemedText style={styles.heroTypeText}>
              {job.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </ThemedText>
          </LinearGradient>
        </View>

        {/* Quick Info Chips */}
        <View style={styles.quickInfo}>
          {job.location && (
            <View style={[styles.infoChip, { backgroundColor: `${colors.primary}12` }]}>
              <Ionicons name="location" size={15} color={colors.primary} />
              <ThemedText style={[styles.infoChipText, { color: colors.primary }]}>
                {job.location}
              </ThemedText>
            </View>
          )}
          {job.salary && (
            <View style={[styles.infoChip, { backgroundColor: "#10B98112" }]}>
              <Ionicons name="cash" size={15} color="#10B981" />
              <ThemedText style={[styles.infoChipText, { color: "#10B981" }]}>
                {job.salary}
              </ThemedText>
            </View>
          )}
          {job.applicationsCount > 0 && (
            <View style={[styles.infoChip, { backgroundColor: `${colors.secondary}12` }]}>
              <Ionicons name="people" size={15} color={colors.secondary} />
              <ThemedText style={[styles.infoChipText, { color: colors.secondary }]}>
                {job.applicationsCount} applicants
              </ThemedText>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Description Section */}
        {job.description && (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name="document-text" size={18} color={colors.primary} />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                {t("jobs.description")}
              </ThemedText>
            </View>
            <ThemedText style={[styles.bodyText, { color: colors.muted }]}>
              {job.description}
            </ThemedText>
          </View>
        )}

        {/* Requirements Section */}
        {job.requirements && job.requirements.length > 0 && (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: "#10B98112" }]}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                {t("jobs.requirements")}
              </ThemedText>
            </View>
            {job.requirements.map((req, i) => (
              <View key={i} style={[styles.listItem, { borderBottomColor: isDark ? "rgba(148,163,184,0.06)" : "rgba(0,0,0,0.03)" }]}>
                <View style={styles.checkIconContainer}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
                <ThemedText style={[styles.listText, { color: colors.muted }]}>
                  {req}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Benefits Section */}
        {job.benefits && job.benefits.length > 0 && (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: "#F59E0B12" }]}>
                <Ionicons name="gift" size={18} color="#F59E0B" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                {t("jobs.benefits")}
              </ThemedText>
            </View>
            {job.benefits.map((ben, i) => (
              <View key={i} style={[styles.listItem, { borderBottomColor: isDark ? "rgba(148,163,184,0.06)" : "rgba(0,0,0,0.03)" }]}>
                <View style={[styles.benefitIconContainer, { backgroundColor: "#F59E0B15" }]}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                </View>
                <ThemedText style={[styles.listText, { color: colors.muted }]}>
                  {ben}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Posted By Section */}
        {/* {job.postedBy && (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.secondary}12` }]}>
                <Ionicons name="person" size={18} color={colors.secondary} />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Posted By
              </ThemedText>
            </View>
            <View style={styles.posterRow}>
              <ProfileFrame
                uri={job.postedBy.profilePictureUrl}
                size={48}
                initial={job.postedBy.firstName?.[0]?.toUpperCase()}
                fallbackColor={colors.primary}
              />
              <View style={styles.posterInfo}>
                <ThemedText style={[styles.posterName, { color: colors.text }]}>
                  {job.postedBy.firstName} {job.postedBy.lastName}
                </ThemedText>
                <ThemedText style={[styles.posterUsername, { color: colors.muted }]}>
                  @{job.postedBy.username}
                </ThemedText>
              </View>
              <View style={[styles.viewProfileBtn, { backgroundColor: `${colors.primary}12` }]}>
                <ThemedText style={[styles.viewProfileText, { color: colors.primary }]}>
                  View Profile
                </ThemedText>
              </View>
            </View>
          </View>
        )} */}

        {/* Applications Count (Owner Only) */}
        {isOwner && job.applicationsCount > 0 && (
          <TouchableOpacity
            onPress={loadApplications}
            activeOpacity={0.8}
            style={[
              styles.applicationsCard,
              {
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <LinearGradient
              colors={isDark ? ["rgba(91,46,255,0.1)", "rgba(124,58,237,0.05)"] : ["rgba(91,46,255,0.05)", "rgba(124,58,237,0.02)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.applicationsGradient}
            >
              <View style={styles.applicationsLeft}>
                <View style={styles.applicationsIconContainer}>
                  <Ionicons name="people" size={22} color={colors.primary} />
                </View>
                <View>
                  <ThemedText style={[styles.applicationsTitle, { color: colors.text }]}>
                  {job.applicationsCount} {t("jobs.applications")}
                </ThemedText>
                <ThemedText style={[styles.applicationsSubtitle, { color: colors.muted }]}>
                  {t("jobs.viewManage")}
                  </ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Apply Button (Non-Owner) */}
      {!isOwner && (
        <View style={[styles.bottomBar, { backgroundColor: isDark ? "#0F172A" : "#FFFFFF" }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowApplyModal(true)}
            style={styles.applyBtnContainer}
          >
            <LinearGradient
              colors={["#5B2EFF", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyBtnGradient}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <ThemedText style={styles.applyBtnText}>{t("jobs.applyNow")}</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Apply Modal */}
      <Modal visible={showApplyModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#0F172A" : "#FFFFFF" }]}>
            {/* Modal Handle */}
            <View style={[styles.modalHandle, { backgroundColor: isDark ? "#334155" : "#E5E7EB" }]} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                  {t("jobs.applyTo", { company: job.company })}
                </ThemedText>
                <ThemedText style={[styles.modalSubtitle, { color: colors.muted }]}>
                  {t("jobs.coverLetterHint")}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setShowApplyModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.05)" }]}
              >
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Text Area */}
            <View style={[styles.textAreaContainer, { backgroundColor: isDark ? "#1E293B" : "#F8FAFC", borderColor: isDark ? "rgba(148,163,184,0.15)" : "rgba(0,0,0,0.08)" }]}>
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                placeholder={t("jobs.coverLetterPlaceholder")}
                placeholderTextColor={colors.muted}
                value={coverLetter}
                onChangeText={setCoverLetter}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleApply}
              disabled={applying}
              style={[styles.submitBtnContainer, { opacity: applying ? 0.7 : 1 }]}
            >
              <LinearGradient
                colors={["#5B2EFF", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                {applying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.submitBtnText}>{t("jobs.submitApplication")}</ThemedText>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Applications List Modal */}
      <Modal visible={showApplications} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#0F172A" : "#FFFFFF", maxHeight: "85%" }]}>
            {/* Modal Handle */}
            <View style={[styles.modalHandle, { backgroundColor: isDark ? "#334155" : "#E5E7EB" }]} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                  {t("jobs.applications")}
                </ThemedText>
                <ThemedText style={[styles.modalSubtitle, { color: colors.muted }]}>
                  {applications.length} {t("jobs.applicants")}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setShowApplications(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.05)" }]}
              >
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {applications.map((app) => {
                const statusStyle = STATUS_COLORS[app.status] || { bg: "#F3F4F6", text: "#6B7280" };

                return (
                  <View
                    key={app.id}
                    style={[
                      styles.applicationCard,
                      {
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                        borderColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.06)",
                      },
                    ]}
                  >
                    {/* Application Header */}
                    <View style={styles.applicationHeader}>
                      <ProfileFrame
                        uri={app.user?.profilePictureUrl}
                        size={44}
                        initial={app.user?.firstName?.[0]?.toUpperCase()}
                        fallbackColor={colors.primary}
                      />
                      <View style={styles.applicantInfo}>
                        <ThemedText style={[styles.applicantName, { color: colors.text }]}>
                          {app.user?.firstName} {app.user?.lastName}
                        </ThemedText>
                        <ThemedText style={[styles.applicantDate, { color: colors.muted }]}>
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>
                          {app.status}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Cover Letter Preview */}
                    {app.coverLetter && (
                      <View style={[styles.coverLetterContainer, { backgroundColor: isDark ? "rgba(15,23,42,0.5)" : "#FFFFFF" }]}>
                        <ThemedText style={[styles.coverLetter, { color: colors.muted }]} numberOfLines={3}>
                          "{app.coverLetter}"
                        </ThemedText>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      {app.status === "pending" && (
                        <>
                          <TouchableOpacity
                            onPress={() => handleUpdateStatus(app.id, "shortlisted")}
                            activeOpacity={0.8}
                            style={[styles.actionBtn, styles.shortlistBtn]}
                          >
                            <Ionicons name="star" size={14} color="#10B981" />
                            <ThemedText style={styles.shortlistText}>Shortlist</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleUpdateStatus(app.id, "rejected")}
                            activeOpacity={0.8}
                            style={[styles.actionBtn, styles.rejectBtn]}
                          >
                            <Ionicons name="close-circle" size={14} color="#EF4444" />
                            <ThemedText style={styles.rejectText}>Reject</ThemedText>
                          </TouchableOpacity>
                        </>
                      )}
                      {app.status === "shortlisted" && (
                        <TouchableOpacity
                          onPress={() => handleUpdateStatus(app.id, "accepted")}
                          activeOpacity={0.8}
                          style={[styles.actionBtn, styles.acceptBtn]}
                        >
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                          <ThemedText style={styles.acceptText}>Accept</ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}

              {applications.length === 0 && (
                <View style={styles.emptyApplications}>
                  <Ionicons name="people-outline" size={40} color={colors.muted} />
                  <ThemedText style={[styles.emptyApplicationsText, { color: colors.muted }]}>
                    No applications yet
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    paddingHorizontal: 40,
    paddingVertical: 32,
    borderRadius: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  heroGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  companyLogoLarge: {
    width: 80,
    height: 80,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  logoGradientLarge: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  companyInitialLarge: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  jobTitleLarge: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  companyNameLarge: {
    fontSize: 16,
    marginTop: 4,
    fontWeight: "500",
  },
  heroTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 14,
    gap: 6,
  },
  heroTypeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  infoChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
    paddingTop: 12,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  checkIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  benefitIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  listText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 21,
  },
  posterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  posterInfo: {
    flex: 1,
    marginLeft: 14,
  },
  posterName: {
    fontSize: 16,
    fontWeight: "600",
  },
  posterUsername: {
    fontSize: 13,
    marginTop: 2,
  },
  viewProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: "600",
  },
  applicationsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
  },
  applicationsGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
  },
  applicationsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  applicationsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(91,46,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  applicationsTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  applicationsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  applyBtnContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  applyBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  applyBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textAreaContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  textArea: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 130,
    padding: 14,
  },
  submitBtnContainer: {
    borderRadius: 14,
    overflow: "hidden",
  },
  submitBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  applicationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  applicationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  applicantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  applicantName: {
    fontSize: 15,
    fontWeight: "600",
  },
  applicantDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  coverLetterContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  coverLetter: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  shortlistBtn: {
    backgroundColor: "#10B98115",
  },
  shortlistText: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "600",
  },
  rejectBtn: {
    backgroundColor: "#EF444415",
  },
  rejectText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
  acceptBtn: {
    backgroundColor: "#10B98115",
  },
  acceptText: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyApplications: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyApplicationsText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
