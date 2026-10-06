import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { jobsService } from "@/service/jobs.service";
import { showError, showSuccess } from "@/components/ui/toast";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { syncKeys } from "@/store/syncStore";

const JOB_TYPES = [
  { key: "full_time", label: "Full-Time" },
  { key: "part_time", label: "Part-Time" },
  { key: "internship", label: "Internship" },
  { key: "remote", label: "Remote" },
  { key: "contract", label: "Contract" },
  { key: "nysc", label: "NYSC" },
  { key: "freelance", label: "Freelance" },
];

export default function PostJobScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("full_time");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Posting runs in the background — the screen closes immediately and the
  // jobs list refetches once the write settles.
  const postJobMutation = useOptimisticMutation<any, { payload: any }>({
    apply: () => {},
    rollback: () => {},
    request: ({ payload }) => jobsService.createJob(payload),
    onSuccess: () =>
      showSuccess(t("jobs.applicationSent"), t("jobs.applicationSubmitted")),
    onError: (error: any) =>
      showError(error?.response?.data?.message || t("jobs.failedToApply")),
    invalidateKeys: [syncKeys.jobs],
  });

  const handlePost = () => {
    if (!title.trim()) return showError(t("jobs.detailTitle"));
    if (!company.trim()) return showError(t("jobs.applyTo", { company: "" }));

    const payload = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim() || undefined,
      type: type as any,
      salary: salary.trim() || undefined,
      description: description.trim() || undefined,
      requirements: requirements.split("\n").filter((r) => r.trim()),
      benefits: benefits.split("\n").filter((b) => b.trim()),
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
    };

    setSubmitting(true);
    postJobMutation.run({ payload }).finally(() => setSubmitting(false));

    // Leave immediately — the job syncs in the background.
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t("jobs.title")}</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Job Type Selector */}
        <ThemedText style={styles.label}>{t("jobs.detailTitle")} *</ThemedText>
        <View style={styles.typeGrid}>
          {JOB_TYPES.map((jt) => (
            <TouchableOpacity
              key={jt.key}
              onPress={() => setType(jt.key)}
              style={[
                styles.typeChip,
                {
                  backgroundColor: type === jt.key ? colors.primary : colors.card,
                  borderColor: type === jt.key ? colors.primary : colors.border,
                },
              ]}
            >
              <ThemedText
                style={[styles.typeChipText, { color: type === jt.key ? "#fff" : colors.text }]}
              >
                {jt.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <ThemedText style={styles.label}>{t("jobs.detailTitle")} *</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="e.g. Frontend Developer Intern"
          placeholderTextColor={colors.muted}
          value={title}
          onChangeText={setTitle}
        />

        {/* Company */}
        <ThemedText style={styles.label}>{t("jobs.applyTo", { company: "" }).replace("\s", "")} *</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="e.g. TechCorp Nigeria"
          placeholderTextColor={colors.muted}
          value={company}
          onChangeText={setCompany}
        />

        {/* Location */}
        <ThemedText style={styles.label}>Location</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="e.g. Lagos, Nigeria or Remote"
          placeholderTextColor={colors.muted}
          value={location}
          onChangeText={setLocation}
        />

        {/* Salary */}
        <ThemedText style={styles.label}>Salary / Compensation</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="e.g. ₦150,000/month or Negotiable"
          placeholderTextColor={colors.muted}
          value={salary}
          onChangeText={setSalary}
        />

        {/* Description */}
        <ThemedText style={styles.label}>Job Description</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="Describe the role, responsibilities, and what the ideal candidate looks like..."
          placeholderTextColor={colors.muted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* Requirements */}
        <ThemedText style={styles.label}>Requirements (one per line)</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="e.g. React/TypeScript experience&#10;Good communication skills&#10;Available for 3 months"
          placeholderTextColor={colors.muted}
          value={requirements}
          onChangeText={setRequirements}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Benefits */}
        <ThemedText style={styles.label}>Benefits (one per line)</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="e.g. Remote work&#10;Mentorship program&#10;Certificate of completion"
          placeholderTextColor={colors.muted}
          value={benefits}
          onChangeText={setBenefits}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Contact */}
        <ThemedText style={styles.label}>Contact Email</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="hr@company.com"
          placeholderTextColor={colors.muted}
          value={contactEmail}
          onChangeText={setContactEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <ThemedText style={styles.label}>Contact Phone</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="+234 801 234 5678"
          placeholderTextColor={colors.muted}
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 },
          ]}
          onPress={handlePost}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.submitBtnText}>{t("jobs.applyNow")}</ThemedText>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { paddingHorizontal: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 100 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeChipText: { fontSize: 13, fontWeight: "600" },
  submitBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
