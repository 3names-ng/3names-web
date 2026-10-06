import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";

import { showError, showSuccess } from "@/components/ui/toast";
import { pastQuestionsService } from "@/service/pastQuestions.service";
import { useTranslation } from "@/hooks/useTranslation";

interface AttachedFile {
  name: string;
  size?: number;
  uri: string;
  mimeType?: string;
}

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level"];
const SESSIONS = ["2020/2021", "2021/2022", "2022/2023", "2023/2024", "2024/2025"];
const SEMESTERS = ["First Semester", "Second Semester", "Mid-Semester Test"];

export default function UploadPastQuestionScreen() {
  const { t } = useTranslation();
  // Form State
  const [level, setLevel] = useState("");
  const [courseCode, setCourseCode] = useState(""); // 👈 Added Course Code state
  const [course, setCourse] = useState("");
  const [session, setSession] = useState("");
  const [semester, setSemester] = useState("First Semester");

  // Files & Tags State
  const [files, setFiles] = useState<AttachedFile[]>([]);

  // Submission State
  const [loading, setLoading] = useState(false);

  // Dropdown Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [activeSelect, setActiveSelect] = useState<"level" | "session" | "semester" | null>(null);

  // Modal selector helpers
  const openPicker = (type: "level" | "session" | "semester") => {
    setActiveSelect(type);
    setModalVisible(true);
  };

  const getOptions = () => {
    switch (activeSelect) {
      case "level":
        return LEVELS;
      case "session":
        return SESSIONS;
      case "semester":
        return SEMESTERS;
      default:
        return [];
    }
  };

  const handleSelectOption = (option: string) => {
    if (activeSelect === "level") setLevel(option);
    if (activeSelect === "session") setSession(option);
    if (activeSelect === "semester") setSemester(option);
    setModalVisible(false);
  };

  // File Picker Functionality
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: AttachedFile[] = result.assets.map((asset) => ({
          name: asset.name,
          size: asset.size,
          uri: asset.uri,
          mimeType: asset.mimeType,
        }));
        setFiles((prev) => [...prev, ...newFiles].slice(0, 10));
      }
    } catch (error) {
      Alert.alert(t("error.error"), t("error.couldNotLoad"));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!level) {
      showError(t("pastQ.selectLevel"));
      return;
    }
    if (!courseCode.trim()) {
      showError(t("pastQ.courseCode"));
      return;
    }
    if (!course.trim()) {
      showError(t("pastQ.courseTitle"));
      return;
    }
    if (!session) {
      showError(t("pastQ.selectSession"));
      return;
    }
    if (files.length === 0) {
      showError(t("pastQ.tapToUpload"));
      return;
    }

    try {
      setLoading(true);

      await pastQuestionsService.create({
        level,
        courseCode: courseCode.trim().toUpperCase(),
        course: course.trim(),
        session,
        semester,
        files: files.map((file) => ({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        })),
      });

      showSuccess(t("pastQ.uploadSuccess"), t("pastQ.uploadSuccessful"));
      router.back();
    } catch (error: any) {
      const message =
        error?.response?.data?.message?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Unable to upload your past question. Please try again.";
      showError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="default" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t("pastQ.uploadTitle")}</Text>
          <Text style={styles.headerSubtitle}>{t("pastQ.uploadSubtitle")}</Text>
        </View>
        <TouchableOpacity style={styles.tipsButton}>
          <Feather name="info" size={16} color="#6366F1" />
          <Text style={styles.tipsText}>{t("pastQ.tips")}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Verification Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconContainer}>
            <Ionicons name="school-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{t("pastQ.verifiedOnly")}</Text>
            <Text style={styles.bannerSubtitle}>
              {t("pastQ.verifiedDesc")}
            </Text>
          </View>
        </View>

        {/* Section 1: Academic Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.purpleText}>1.</Text> {t("pastQ.academicDetails")}
          </Text>
          <Text style={styles.sectionSubtext}>
            {t("pastQ.academicDetailsHint")}
          </Text>

          {/* Level Dropdown */}
          <View style={styles.gridRow}>
            <TouchableOpacity style={styles.selectInput} onPress={() => openPicker("level")}>
              <View style={styles.inputLeft}>
                <View style={styles.inputIconBg}>
                  <Ionicons name="bar-chart-outline" size={18} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.inputLabel}>
                    {t("pastQ.level")} <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.inputValue}>{level || t("pastQ.selectLevel")}</Text>
                </View>
              </View>
              <Feather name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Course Code Field (NEW) */}
          <View style={styles.inputFullContainer}>
            <View style={styles.inputLeft}>
              <View style={styles.inputIconBg}>
                <Ionicons name="code-slash-outline" size={18} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>
                  {t("pastQ.courseCode")} <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInputFull}
                  value={courseCode}
                  onChangeText={setCourseCode}
                  placeholder={t("pastQ.courseCodePlaceholder")}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>

          {/* Course Title / Subject (TextInput) */}
          <View style={styles.inputFullContainer}>
            <View style={styles.inputLeft}>
              <View style={styles.inputIconBg}>
                <Ionicons name="book-outline" size={18} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>
                  {t("pastQ.courseTitle")} <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInputFull}
                  value={course}
                  onChangeText={setCourse}
                  placeholder={t("pastQ.courseTitlePlaceholder")}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>

          {/* Session & Semester Dropdowns */}
          <View style={styles.gridRow}>
            <TouchableOpacity style={styles.selectInput} onPress={() => openPicker("session")}>
              <View style={styles.inputLeft}>
                <View style={styles.inputIconBg}>
                  <Feather name="calendar" size={18} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.inputLabel}>
                    {t("pastQ.academicSession")} <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.inputValue}>{session || t("pastQ.selectSession")}</Text>
                </View>
              </View>
              <Feather name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.selectInput} onPress={() => openPicker("semester")}>
              <View style={styles.inputLeft}>
                <View style={styles.inputIconBg}>
                  <Feather name="file-text" size={18} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>
                    {t("pastQ.examSemester")} <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.inputValue} numberOfLines={1}>
                    {semester}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Upload Files */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.purpleText}>2.</Text> {t("pastQ.uploadFiles")}
          </Text>
          <Text style={styles.sectionSubtext}>
            {t("pastQ.uploadFilesHint")}
          </Text>

          <TouchableOpacity style={styles.dropZone} onPress={handlePickDocument}>
            <View style={styles.uploadIconCircle}>
              <Feather name="upload-cloud" size={24} color="#6366F1" />
            </View>
            <Text style={styles.dropText}>{t("pastQ.tapToUpload")}</Text>
            <Text style={styles.dropSubtext}>{t("pastQ.fileFormats")}</Text>
          </TouchableOpacity>

          {/* Render List of Attached Files */}
          {files.map((file, index) => (
            <View key={index} style={styles.fileItemRow}>
              <View style={styles.pdfIconBadge}>
                <Text style={styles.pdfIconText}>
                  {file.name.endsWith(".pdf") ? "PDF" : "IMG"}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
              </View>
              <View style={styles.fileActions}>
                <Feather name="check-circle" size={18} color="#10B981" />
                <TouchableOpacity onPress={() => handleRemoveFile(index)} style={{ marginLeft: 12 }}>
                  <Feather name="x" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addMoreButton} onPress={handlePickDocument}>
            <Feather name="plus" size={16} color="#6366F1" />
            <Text style={styles.addMoreText}>{t("pastQ.addMore")}</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Feather name="shield" size={18} color="#6366F1" style={{ marginTop: 2 }} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.disclaimerTitle}>{t("pastQ.disclaimerTitle")}</Text>
            <Text style={styles.disclaimerBullet}>• {t("pastQ.disclaimerBullet1")}</Text>
            <Text style={styles.disclaimerBullet}>• {t("pastQ.disclaimerBullet2")}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="upload" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.submitButtonText}>
            {loading ? t("pastQ.uploading") : t("pastQ.uploadButton")}
          </Text>
        </TouchableOpacity>

        {/* Footer Guarantee */}
        <View style={styles.footerLock}>
          <Feather name="lock" size={13} color="#6B7280" />
          <Text style={styles.footerLockText}>
            {t("pastQ.onlyInstitution")}
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Dynamic Dropdown Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {t("pastQ.selectOption", { type: activeSelect === "level" ? t("pastQ.level") : activeSelect === "session" ? t("pastQ.academicSession") : t("pastQ.examSemester") })}
            </Text>
            <FlatList
              data={getOptions()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalOption} onPress={() => handleSelectOption(item)}>
                  <Text style={styles.modalOptionText}>{item}</Text>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  tipsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  tipsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366F1",
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  bannerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E1B4B",
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#4338CA",
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  purpleText: {
    color: "#6366F1",
  },
  sectionSubtext: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  selectInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputFullContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  textInputFull: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    padding: 0,
    marginTop: 2,
  },
  inputLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 6,
  },
  inputIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  required: {
    color: "#EF4444",
  },
  inputValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 1,
  },
  dropZone: {
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
    borderStyle: "dashed",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  dropText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
  },
  dropSubtext: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  fileItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  pdfIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  pdfIconText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  fileName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  fileSize: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  fileActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  addMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366F1",
    marginLeft: 4,
  },
  disclaimerCard: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E1B4B",
    marginBottom: 4,
  },
  disclaimerBullet: {
    fontSize: 11,
    color: "#4338CA",
    lineHeight: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 12,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  footerLock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  footerLockText: {
    fontSize: 11,
    color: "#6B7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxHeight: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalOptionText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
});