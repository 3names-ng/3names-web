import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import {
  Feather,
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

export default function UploadPastQuestionScreen() {
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([
    "data structures",
    "linked list",
    "stack",
    "trees",
    "hash table",
  ]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Upload Past Question</Text>
          <Text style={styles.headerSubtitle}>
            Help your schoolmates succeed
          </Text>
        </View>
        <TouchableOpacity style={styles.tipsButton}>
          <Feather name="info" size={16} color="#6366F1" />
          <Text style={styles.tipsText}>Uploading Tips</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Verification Info Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconContainer}>
            <Ionicons name="school-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>For verified students only</Text>
            <Text style={styles.bannerSubtitle}>
              Past questions are only visible to students in your institution
              and relevant department.
            </Text>
          </View>
        </View>

        {/* Section 1: Academic Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.purpleText}>1.</Text> Academic Details
          </Text>
          <Text style={styles.sectionSubtext}>
            Make sure these details are correct so others can find your upload.
          </Text>

          {/* Form Grid */}
          <View style={styles.gridRow}>
            {/* Institution */}
            <TouchableOpacity style={styles.selectInput}>
              <View style={styles.inputLeft}>
                <View style={styles.inputIconBg}>
                  <Ionicons name="school-outline" size={18} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.inputLabel}>
                    Institution <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.inputValue}>
                    University of Lagos (UNILAG)
                  </Text>
                </View>
              </View>
              <Feather name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>

            {/* Faculty */}
            <TouchableOpacity style={styles.selectInput}>
              <View style={styles.inputLeft}>
                <View style={styles.inputIconBg}>
                  <Ionicons name="people-outline" size={18} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.inputLabel}>
                    Faculty <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.inputValue}>Science</Text>
                </View>
              </View>
              <Feather name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* Department */}
            <TouchableOpacity style={styles.selectInput}>
              <View style={styles.inputLeft}>
                <View style={styles.inputIconBg}>
                  <Feather name="briefcase" size={18} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.inputLabel}>
                    Department <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.inputValue}>Computer Science</Text>
                </View>
              </View>
              <Feather name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>

            {/* Level */}
            <TouchableOpacity style={styles.selectInput}>
              <View style={styles.inputLeft}>
                <View style={styles.inputIconBg}>
                  <Ionicons name="bar-chart-outline" size={18} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.inputLabel}>
                    Level <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.inputValue}>300 Level</Text>
                </View>
              </View>
              <Feather name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Course / Subject */}
          <TouchableOpacity style={styles.selectInputFull}>
            <View style={styles.inputLeft}>
              <View style={styles.inputIconBg}>
                <Ionicons name="book-outline" size={18} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.inputLabel}>
                  Course / Subject <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.inputValue}>
                  Data Structures and Algorithms (CSC 312)
                </Text>
              </View>
            </View>
            <Feather name="chevron-down" size={18} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.gridRow}>
            {/* Academic Session */}
            <TouchableOpacity style={styles.selectInput}>
              <View style={styles.inputLeft}>
                <View style={styles.inputIconBg}>
                  <Feather name="calendar" size={18} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.inputLabel}>
                    Academic Session / Year <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.inputValue}>2023/2024</Text>
                </View>
              </View>
              <Feather name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>

            {/* Exam Type */}
            <TouchableOpacity style={styles.selectInput}>
              <View style={styles.inputLeft}>
                <View style={styles.inputIconBg}>
                  <Feather name="file-text" size={18} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.inputLabel}>
                    Exam Type <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.inputValue}>Semester Exam</Text>
                </View>
              </View>
              <Feather name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Upload Files */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.purpleText}>2.</Text> Upload Files
          </Text>
          <Text style={styles.sectionSubtext}>
            Upload clear files. You can upload multiple files.
          </Text>

          {/* Dashed Drop Area */}
          <TouchableOpacity style={styles.dropZone}>
            <View style={styles.uploadIconCircle}>
              <Feather name="upload-cloud" size={24} color="#6366F1" />
            </View>
            <Text style={styles.dropText}>Tap to upload files</Text>
            <Text style={styles.dropSubtext}>PDF, JPG, PNG up to 10MB each</Text>
          </TouchableOpacity>

          {/* Attached File Row */}
          <View style={styles.fileItemRow}>
            <View style={styles.pdfIconBadge}>
              <Text style={styles.pdfIconText}>PDF</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.fileName} numberOfLines={1}>
                CSC_312_2023_Exam_Past_Questions.pdf
              </Text>
              <Text style={styles.fileSize}>2.45 MB</Text>
            </View>
            <View style={styles.fileActions}>
              <Feather name="check-circle" size={18} color="#10B981" />
              <TouchableOpacity style={{ marginLeft: 12 }}>
                <Feather name="x" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Add More Action */}
          <TouchableOpacity style={styles.addMoreButton}>
            <Feather name="plus" size={16} color="#6366F1" />
            <Text style={styles.addMoreText}>Add more files</Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: Add Tags */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.purpleText}>3.</Text> Add Tags{" "}
            <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <Text style={styles.sectionSubtext}>
            Add relevant topics or keywords to help others find your upload.
          </Text>

          {/* Input & Add Button */}
          <View style={styles.tagInputContainer}>
            <View style={styles.tagInputField}>
              <Feather name="tag" size={16} color="#8B5CF6" />
              <TextInput
                style={styles.textInput}
                placeholder="Add tags (e.g. recursion, stack, tree)"
                placeholderTextColor="#9CA3AF"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
              />
            </View>
            <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Tags Chips */}
          <View style={styles.chipsWrap}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(index)}>
                  <Feather name="x" size={14} color="#6366F1" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Ensure Disclaimer Banner */}
        <View style={styles.disclaimerCard}>
          <Feather
            name="shield"
            size={18}
            color="#6366F1"
            style={{ marginTop: 2 }}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.disclaimerTitle}>Please ensure:</Text>
            <Text style={styles.disclaimerBullet}>
              • The questions are from your institution.
            </Text>
            <Text style={styles.disclaimerBullet}>
              • Do not upload materials you do not own.
            </Text>
            <Text style={styles.disclaimerBullet}>
              • Misleading or wrong uploads may lead to suspension.
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton}>
          <Feather name="upload" size={18} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>Upload Past Question</Text>
        </TouchableOpacity>

        {/* Footer Guarantee */}
        <View style={styles.footerLock}>
          <Feather name="lock" size={13} color="#6B7280" />
          <Text style={styles.footerLockText}>
            Only students in your institution can view this content.
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
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
  optionalText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#64748B",
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
  selectInputFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
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
  tagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tagInputField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: "#1E293B",
  },
  addTagButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addTagButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
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
});