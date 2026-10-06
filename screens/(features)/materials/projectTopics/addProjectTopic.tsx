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
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { showError, showSuccess } from "@/components/ui/toast";
import { useTheme } from "@/hooks/useTheme";
import {
  projectTopicsService,
} from "@/service/projectTopics.service";

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level"];
const CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Machine Learning / AI",
  "Data Science",
  "Networking & Security",
  "Database Systems",
  "Software Engineering",
  "Embedded Systems",
  "Cloud Computing",
  "Other",
];

export default function AddProjectTopicScreen() {
  const { colors } = useTheme();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Submission
  const [loading, setLoading] = useState(false);

  // Dropdown modal
  const [modalVisible, setModalVisible] = useState(false);
  const [activeSelect, setActiveSelect] = useState<"level" | "category" | null>(null);

  const openPicker = (type: "level" | "category") => {
    setActiveSelect(type);
    setModalVisible(true);
  };

  const getOptions = () => {
    switch (activeSelect) {
      case "level":
        return LEVELS;
      case "category":
        return CATEGORIES;
      default:
        return [];
    }
  };

  const handleSelectOption = (option: string) => {
    if (activeSelect === "level") setLevel(option);
    if (activeSelect === "category") setCategory(option);
    setModalVisible(false);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      showError("Tag already added.");
      return;
    }
    if (tags.length >= 5) {
      showError("Maximum 5 tags allowed.");
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  };

  const handleRemoveTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError("Please enter a project topic title.");
      return;
    }

    try {
      setLoading(true);

      await projectTopicsService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        courseCode: courseCode.trim().toUpperCase() || undefined,
        course: course.trim() || undefined,
        level: level || undefined,
        category: category || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      showSuccess("Project topic submitted successfully!", "Success");
      router.back();
    } catch (error: any) {
      const message =
        error?.response?.data?.message?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Unable to submit project topic. Please try again.";
      showError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="default" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            New Project Topic
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>
            Share a research idea with your department
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Topic Title */}
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Text style={{ color: colors.primary }}>1.</Text> Topic Details
            </Text>
            <Text style={[styles.sectionSubtext, { color: colors.secondary }]}>
              Give your project topic a clear, descriptive title.
            </Text>

            <View style={[styles.inputFullContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.inputLeft}>
                <View style={[styles.inputIconBg, { backgroundColor: colors.primaryLight || "rgba(124,58,237,0.08)" }]}>
                  <MaterialCommunityIcons name="lightbulb-on" size={18} color={colors.primary || "#7C3AED"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.secondary }]}>
                    Project Title <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.textInputFull, { color: colors.text }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Design of a Smart Attendance System using Face Recognition"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            <View style={[styles.inputFullContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.inputLeft}>
                <View style={[styles.inputIconBg, { backgroundColor: colors.primaryLight || "rgba(124,58,237,0.08)" }]}>
                  <Ionicons name="document-text-outline" size={18} color={colors.primary || "#7C3AED"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.secondary }]}>
                    Description (optional)
                  </Text>
                  <TextInput                   
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Briefly describe the project scope or objectives..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    style={[styles.textInputFull, styles.textArea, { color: colors.text }]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Academic Info */}
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Text style={{ color: colors.primary }}>2.</Text> Academic Info
            </Text>
            <Text style={[styles.sectionSubtext, { color: colors.secondary }]}>
              Help others find your topic by adding course details.
            </Text>

            <View style={styles.gridRow}>
              <TouchableOpacity
                style={[styles.selectInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => openPicker("level")}
              >
                <View style={styles.inputLeft}>
                  <View style={[styles.inputIconBg, { backgroundColor: colors.primaryLight || "rgba(124,58,237,0.08)" }]}>
                    <Ionicons name="bar-chart-outline" size={18} color={colors.primary || "#7C3AED"} />
                  </View>
                  <View>
                    <Text style={[styles.inputLabel, { color: colors.secondary }]}>Level</Text>
                    <Text style={[styles.inputValue, { color: colors.text }]}>{level || "Select"}</Text>
                  </View>
                </View>
                <Feather name="chevron-down" size={18} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selectInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => openPicker("category")}
              >
                <View style={styles.inputLeft}>
                  <View style={[styles.inputIconBg, { backgroundColor: colors.primaryLight || "rgba(124,58,237,0.08)" }]}>
                    <Ionicons name="folder-outline" size={18} color={colors.primary || "#7C3AED"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.secondary }]}>Category</Text>
                    <Text style={[styles.inputValue, { color: colors.text }]} numberOfLines={1}>
                      {category || "Select"}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-down" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputFullContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.inputLeft}>
                <View style={[styles.inputIconBg, { backgroundColor: colors.primaryLight || "rgba(124,58,237,0.08)" }]}>
                  <Ionicons name="code-slash-outline" size={18} color={colors.primary || "#7C3AED"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.secondary }]}>Course Code (optional)</Text>
                  <TextInput
                    style={[styles.textInputFull, { color: colors.text }]}
                    value={courseCode}
                    onChangeText={setCourseCode}
                    placeholder="e.g. CSC 411"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </View>

            <View style={[styles.inputFullContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.inputLeft}>
                <View style={[styles.inputIconBg, { backgroundColor: colors.primaryLight || "rgba(124,58,237,0.08)" }]}>
                  <Ionicons name="book-outline" size={18} color={colors.primary || "#7C3AED"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.secondary }]}>Course Title (optional)</Text>
                  <TextInput
                    style={[styles.textInputFull, { color: colors.text }]}
                    value={course}
                    onChangeText={setCourse}
                    placeholder="e.g. Artificial Intelligence"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Tags */}
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Text style={{ color: colors.primary }}>3.</Text> Tags
            </Text>
            <Text style={[styles.sectionSubtext, { color: colors.secondary }]}>
              Add keywords to make your topic easier to discover (max 5).
            </Text>

            {/* Tag Input */}
            <View style={[styles.tagInputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.tagInput, { color: colors.text }]}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="e.g. React Native, Firebase"
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity
                style={[styles.tagAddBtn, { backgroundColor: colors.primary || "#7C3AED" }]}
                onPress={handleAddTag}
              >
                <Feather name="plus" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Tags List */}
            {tags.length > 0 && (
              <View style={styles.tagsList}>
                {tags.map((tag, idx) => (
                  <View
                    key={idx}
                    style={[styles.tagChip, { backgroundColor: colors.primaryLight || "rgba(124,58,237,0.08)" }]}
                  >
                    <Text style={[styles.tagChipText, { color: colors.primary || "#7C3AED" }]}>{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(idx)}>
                      <Feather name="x" size={14} color={colors.primary || "#7C3AED"} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary || "#7C3AED" }, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="lightbulb-on" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.submitButtonText}>
              {loading ? "Submitting..." : "Submit Project Topic"}
            </Text>
          </TouchableOpacity>

          <View style={styles.footerLock}>
            <Feather name="lock" size={13} color="#6B7280" />
            <Text style={styles.footerLockText}>
              Only students in your department can view this topic.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dropdown Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select {activeSelect === "level" ? "Level" : "Category"}
            </Text>
            <FlatList
              data={getOptions()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectOption(item)}
                >
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>{item}</Text>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  sectionSubtext: {
    fontSize: 12,
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
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputFullContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  textInputFull: {
    fontSize: 12,
    fontWeight: "600",
    padding: 0,
    marginTop: 2,
  },
  textArea: {
    minHeight: 60,
    paddingTop: 4,
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  inputValue: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 1,
  },

  // Tags
  tagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 10,
  },
  tagAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Submit
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 12,
    shadowColor: "#7C3AED",
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

  // Modal
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
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
