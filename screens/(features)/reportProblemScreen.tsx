import React, { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  TextInput,
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
import { supportService } from "@/service/support.service";

const CATEGORIES = [
  { label: "Bug", icon: "bug" as const },
  { label: "Feature Request", icon: "sparkles" as const },
  { label: "Content Issue", icon: "document-text" as const },
  { label: "Account & Billing", icon: "card" as const },
  { label: "Other", icon: "ellipsis-horizontal-circle" as const },
];

export default function ReportProblemScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const primaryAccent = colors.primary || "#7C3AED";

  const [category, setCategory] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    !!category && message.trim().length >= 10 && !isSubmitting;

  const handleSubmit = async () => {
    if (!category) {
      showError("Please select a category for your report.");
      return;
    }
    if (message.trim().length < 10) {
      showError("Please describe the problem in at least 10 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await supportService.reportProblem({
        category,
        subject: subject.trim() || undefined,
        message: message.trim(),
      });

      showSuccess(
        "Your report has been submitted. Our support team will review it shortly.",
        "Report Sent"
      );
      router.back();
    } catch (error: any) {
      console.log("Report Problem Error:", error);
      const errMessage =
        error?.response?.data?.message?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Unable to submit your report. Please try again.";
      showError(
        Array.isArray(errMessage) ? errMessage.join(", ") : errMessage,
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
          Report a Problem
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
          <ThemedText style={[styles.introText, { color: colors.muted }]}>
            Tell us what went wrong. The more detail you provide, the faster we
            can fix it.
          </ThemedText>

          <ThemedText style={[styles.label, { color: colors.muted }]}>
            CATEGORY
          </ThemedText>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((item) => {
              const active = category === item.label;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => setCategory(item.label)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active
                        ? primaryAccent
                        : colors.card,
                      borderColor: active ? primaryAccent : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={active ? "#FFFFFF" : colors.muted}
                  />
                  <ThemedText
                    style={[
                      styles.chipText,
                      { color: active ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText style={[styles.label, { color: colors.muted }]}>
            SUBJECT <ThemedText style={[styles.optional, { color: colors.muted }]}>(optional)</ThemedText>
          </ThemedText>
          <ThemedView
            style={[
              styles.inputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Short summary of the issue"
              placeholderTextColor="#9CA3AF"
              style={[styles.textInput, { color: colors.text }]}
              maxLength={255}
              editable={!isSubmitting}
            />
          </ThemedView>

          <ThemedText style={[styles.label, { color: colors.muted }]}>
            DESCRIPTION
          </ThemedText>
          <ThemedView
            style={[
              styles.inputContainer,
              styles.textAreaContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Describe what happened, what you expected, and any steps to reproduce the issue"
              placeholderTextColor="#9CA3AF"
              style={[styles.textInput, styles.textArea, { color: colors.text }]}
              multiline
              textAlignVertical="top"
              maxLength={2000}
              editable={!isSubmitting}
            />
            <ThemedText style={[styles.charCounter, { color: colors.muted }]}>
              {message.length}/2000
            </ThemedText>
          </ThemedView>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[
              styles.submitButton,
              { backgroundColor: primaryAccent },
              !canSubmit && styles.submitButtonDisabled,
            ]}
          >
            <ThemedText style={styles.submitButtonText}>
              {isSubmitting ? t("report.submitting") : t("report.submitReport")}
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
  introText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 16,
  },
  optional: {
    fontWeight: "400",
    letterSpacing: 0,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputContainer: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  textAreaContainer: {
    minHeight: 140,
    paddingTop: 12,
    paddingBottom: 28,
  },
  textInput: {
    fontSize: 14,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 100,
  },
  charCounter: {
    position: "absolute",
    bottom: 8,
    right: 12,
    fontSize: 11,
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
