import React, { useState, useEffect } from "react";
import { ScrollView, View } from "react-native";

import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import AuthProgress from "@/components/auth/authProgress";
import PrimaryButton from "@/components/auth/primaryButton";
import CheckBox from "@/components/auth/checkBox";
import UploadCard from "@/components/auth/uploadCard";
import { router } from "expo-router";
import AuthHeader from "@/components/auth/authHeader";
import { ThemedView } from "@/components/ui/ThemedView";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useAuthStore } from "@/store/authStore";
import { showError, showSuccess } from "@/components/ui/toast";
import { authService } from "@/service/auth.service";

export default function StudentVerificationScreen() {
  const { data, updateData, resetOnboarding } = useOnboardingStore();
  const { updateUser } = useAuthStore();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const [studentId, setStudentId] = useState<any>(null);
  const [admissionLetter, setAdmissionLetter] = useState<any>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const storeData = data as any;
    if (storeData.schoolIdCard) setStudentId(storeData.schoolIdCard);
    if (storeData.administrationLetter) setAdmissionLetter(storeData.administrationLetter);
  }, [data]);

  async function pickDocument(setter: any, storeKey: "schoolIdCard" | "administrationLetter") {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: "*/*",
      });

      if (!result.canceled) {
        const fileData = result.assets[0];
        setter(fileData);
        updateData({ [storeKey]: fileData } as any);
      }
    } catch (err) {
      console.log("Document picking error:", err);
    }
  }

  const submitVerification = async () => {
    // Check if AT LEAST ONE document is provided
    if (!studentId && !admissionLetter) {
      showError("Please upload either your Student ID or Admission Letter.");
      return;
    }

    if (!accepted) {
      showError("Please confirm the documents belong to you");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // 1. Gather text attributes
      const textData = {
        firstName: data.firstName,
        programType: data.programType,
        lastName: data.lastName,
        username: data.username,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        phoneNumber: data.phoneNumber,
        matricNumber: data.matricNumber,
        jambNumber: data.jambNumber,
        schoolId: data.schoolId,
        facultyId: data.facultyId,
        departmentId: data.departmentId,
        termsAccepted: true,
      };

      Object.entries(textData).forEach(([key, value]) => {
        if (
          value !== undefined && 
          value !== null && 
          value !== "" && 
          String(value) !== "null" && 
          String(value) !== "undefined"
        ) {
          formData.append(key, String(value));
        }
      });

      // 2. Append Identity & Document Files (Only if provided)
      if (studentId) {
        const studentIdName = studentId.name || studentId.uri.split("/").pop() || "student_id.png";
        const studentIdType = studentId.mimeType || "image/png";

        formData.append("schoolIdCard", {
          uri: studentId.uri,
          name: studentIdName,
          type: studentIdType,
        } as any);
      }

      if (admissionLetter) {
        const admissionLetterName = admissionLetter.name || admissionLetter.uri.split("/").pop() || "admission_letter.png";
        const admissionLetterType = admissionLetter.mimeType || "image/png";

        formData.append("administrationLetter", {
          uri: admissionLetter.uri,
          name: admissionLetterName,
          type: admissionLetterType,
        } as any);
      }

      // 3. Handle Profile Picture (Local Capture/Pick vs Remote Preset Avatars)
      if (data.profilePictureUrl) {
        const isLocalFile = 
          data.profilePictureUrl.startsWith("file://") || 
          data.profilePictureUrl.startsWith("content://") ||
          data.profilePictureUrl.startsWith("assets-library://");

        if (isLocalFile) {
          // A: User uploaded custom photo from camera/gallery
          const profilePicName = data.profilePictureUrl.split("/").pop() || "profile.jpg";
          formData.append("profilePicture", {
            uri: data.profilePictureUrl,
            name: profilePicName,
            type: "image/jpeg",
          } as any);
          console.log("Appended local profile image path successfully.");
        } else {
          // B: User picked a remote preset avatar URL -> Download to cache
          try {
            const avatarFilename = `avatar_${Date.now()}.png`;
            
            console.log("Downloading preset avatar from Cloudinary down to local cache...");
            const downloadedFile = await File.downloadFileAsync(
              data.profilePictureUrl,
              Paths.cache,
            );

            if (downloadedFile.exists) {
              console.log("Download successful. Local cached file URI:", downloadedFile.uri);
              
              formData.append("profilePicture", {
                uri: downloadedFile.uri,
                name: avatarFilename,
                type: "image/png", 
              } as any);
            } else {
              console.error("Image download failed");
            }
          } catch (downloadError) {
            console.error("Local file system cache failure:", downloadError);
          }
        }
      }

      console.log("Submitting complete onboarding payload...");
      const response = await authService.completeOnboarding(formData);
      console.log("Onboarding success details:", response);

      if (response?.user || response?.data) {
        updateUser(response.user || response.data);
      } else if (response) {
        updateUser(response);
      }

      showSuccess("Your documents have been submitted", "Verification Started");
      resetOnboarding();
      router.replace("/auth/verificationPendingScreen");
    } catch (error: any) {
      console.log("Onboarding verification failed details:", error);
      const backendError = error?.response?.data?.message;
      const errorMessage = Array.isArray(backendError) ? backendError.join(", ") : backendError;

      // 1. Check if the error indicates onboarding is already completed
      if (errorMessage && errorMessage.toLowerCase().includes("already complete")) {
        console.log("Onboarding already complete detected. Fetching fresh user state...");
        
        try {
          // 2. Fetch the fresh profile from the server to get the updated fields
          const freshUser = await authService.getMe(); 
          
          if (freshUser) {
           
            updateUser(freshUser);
          }
        } catch (fetchError) {
          console.log("Failed to fetch fresh profile fallback:", fetchError);
        }

        // 3. Clear onboarding wizard state and route them out safely
        showSuccess("Your account is ready!", "Welcome Back");
        resetOnboarding();
        router.replace("/auth/verificationPendingScreen"); 
        return;
      }

      showError(errorMessage || "Unable to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasAtLeastOneDoc = Boolean(studentId || admissionLetter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthHeader
        title="Verify Your Student Identity"
        subtitle="Upload at least one document below. Verification usually takes less than 24 hours."
      />

      <ThemedView style={{ paddingHorizontal: 24 }}>
        <AuthProgress currentStep={4} totalSteps={4} />
      </ThemedView>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
      >
        <View style={{ marginTop: 40 }}>
          <UploadCard
            title="Student ID Card"
            subtitle="Optional"
            file={studentId}
            icon="credit-card"
            onPress={() => pickDocument(setStudentId, "schoolIdCard")}
          />

          <UploadCard
            title="Admission Letter"
            subtitle="Optional"
            file={admissionLetter}
            icon="file-text"
            onPress={() => pickDocument(setAdmissionLetter, "administrationLetter")}
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <CheckBox
            checked={accepted}
            onToggle={() => setAccepted(!accepted)}
            title="I confirm these documents belong to me."
          />
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
        <PrimaryButton
          title="Submit For Verification"
          disabled={!accepted || !hasAtLeastOneDoc || loading}
          onPress={submitVerification}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}