import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { ThemedView } from "@/components/ui/ThemedView";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import { useHostelStore } from "@/store/hostelStore";
import Input from "@/components/hostel/input";
import TextArea from "@/components/hostel/textArea";
import PrimaryButton from "@/components/hostel/primaryButton";
import AuthHeader from "@/components/auth/authHeader";
import AuthProgress from "@/components/auth/authProgress";
import { useTheme } from "@/hooks/useTheme";
import { showError } from "@/components/ui/toast";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTranslation } from "@/hooks/useTranslation";

export default function AddHostelScreen() {
  const { hostel, updateField } = useHostelStore();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [errors, setErrors] = useState({
    hostelName: "",
    description: "",
    photos: "",
  });

  const photos = hostel.photos || [];

  const handleAddPhoto = async () => {
    if (photos.length >= 10) {
      showError(t("hostel.photoLimitTitle"), t("hostel.photoLimitMsg"));
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showError(
        t("hostel.photoPermTitle"),
        t("hostel.photoPermMsg")
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10 - photos.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map((asset) => asset.uri);
      const updatedPhotos = [...photos, ...newUris].slice(0, 10);
      updateField("photos", updatedPhotos);
      setErrors((prev) => ({ ...prev, photos: "" }));
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const updatedPhotos = photos.filter((_, index) => index !== indexToRemove);
    updateField("photos", updatedPhotos);
  };

  function validate() {
    const newErrors = {
      hostelName: "",
      description: "",
      photos: "",
    };

    let valid = true;

    if (!hostel.photos || hostel.photos.length === 0) {
      newErrors.photos = t("hostel.photoRequired");
      valid = false;
    }

    if (!hostel.hostelName?.trim()) {
      newErrors.hostelName = t("hostel.nameRequired");
      valid = false;
    }

    if (!hostel.description?.trim()) {
      newErrors.description = t("hostel.descRequired");
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) {
      const firstErrorMessage =
        newErrors.photos ||
        newErrors.hostelName ||
        newErrors.description ||
        t("hostel.fillRequired");

      showError(t("hostel.validationError"), firstErrorMessage);
      return;
    }

    router.push("/(features)/hostel/add/addLocation");
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <View>
          <AuthHeader
            title={t("hostel.photosTitle")}
            subtitle={t("hostel.photosSubtitle")}
          />
        </View>

        <ThemedView style={{ paddingHorizontal: 24 }}>
          <AuthProgress currentStep={1} totalSteps={6} />
        </ThemedView>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
          }}
        >
          <View className="mb-5">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photosScrollView}
            >
              {photos.map((uri, index) => (
                <ThemedView key={`${uri}-${index}`} style={styles.photoWrapper}>
                  <Image source={{ uri }} style={styles.photoImage} />
                  {index === 0 && (
                    <ThemedView style={styles.coverBadge}>
                      <ThemedText style={styles.coverBadgeText}>
                        {t("hostel.coverBadge")}
                      </ThemedText>
                    </ThemedView>
                  )}
                  <Pressable
                    onPress={() => handleRemovePhoto(index)}
                    style={styles.removePhotoButton}
                  >
                    <Feather name="x" size={14} color="#111827" />
                  </Pressable>
                </ThemedView>
              ))}

              {photos.length < 10 && (
                <Pressable
                  onPress={handleAddPhoto}
                  style={styles.addPhotoButton}
                >
                  <ThemedView style={styles.addPhotoIconCircle}>
                    <Feather name="plus" size={22} color="#FFF" />
                  </ThemedView>
                  <ThemedText style={styles.addPhotoText}>
                    {t("hostel.addPhoto")}
                  </ThemedText>
                </Pressable>
              )}
            </ScrollView>

            {errors.photos ? (
              <ThemedText style={styles.errorText}>{errors.photos}</ThemedText>
            ) : null}
          </View>

          <Input
            label={t("hostel.hostelNameLabel")}
            placeholder={t("hostel.hostelNamePlaceholder")}
            value={hostel.hostelName || ""}
            onChangeText={(text: string) => {
              updateField("hostelName", text);
              if (errors.hostelName) {
                setErrors((prev) => ({ ...prev, hostelName: "" }));
              }
            }}
            error={errors.hostelName}
          />

          <TextArea
            label={t("hostel.descLabel")}
            placeholder={t("hostel.descPlaceholder")}
            value={hostel.description || ""}
            onChangeText={(text: string) => {
              updateField("description", text);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: "" }));
              }
            }}
            error={errors.description}
          />
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <PrimaryButton title={t("hostel.next")} onPress={validate} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  photosScrollView: {
    marginTop: 12,
  },
  photoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    position: "relative",
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  coverBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coverBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  removePhotoButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#6C47FF",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6C47FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6C47FF",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
  },
});