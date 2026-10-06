import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ui/ThemedText";
import AuthProgress from "@/components/auth/authProgress";
import PrimaryButton from "@/components/auth/primaryButton";
import { router } from "expo-router";
import AuthHeader from "@/components/auth/authHeader";
import { avatars } from "@/constants/avatar";
import { ThemedView } from "@/components/ui/ThemedView";
import { useOnboardingStore } from "@/store/onboardingStore";
import { showError } from "@/components/ui/toast";

export default function UploadProfilePictureScreen() {
  const { colors } = useTheme();
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();

  const isAvatarUrl = (url?: string) => !!url && avatars.includes(url);

  const [image, setImage] = useState<string | undefined>(
    isAvatarUrl(onboardingData.profilePictureUrl) ? undefined : onboardingData.profilePictureUrl
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    isAvatarUrl(onboardingData.profilePictureUrl) ? onboardingData.profilePictureUrl : null
  );

  // Modal visibility state
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState<boolean>(false);

  useEffect(() => {
    if (onboardingData.profilePictureUrl) {
      const savedUrl = onboardingData.profilePictureUrl;
      if (avatars.includes(savedUrl)) {
        setSelectedAvatar(savedUrl);
        setImage(undefined);
      } else {
        setImage(savedUrl);
        setSelectedAvatar(null);
      }
    }
  }, [onboardingData.profilePictureUrl]);

  const displayImage = image || selectedAvatar;

  const handleSelectImage = (uri: string, isAvatar: boolean) => {
    if (isAvatar) {
      setSelectedAvatar(uri);
      setImage(undefined);
    } else {
      setImage(uri);
      setSelectedAvatar(null);
    }
    updateData({ profilePictureUrl: uri });
  };

  async function openGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled) {
      handleSelectImage(result.assets[0].uri, false);
    }
  }

  async function openCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled) {
      handleSelectImage(result.assets[0].uri, false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthHeader
        title="Add Profile Photo"
        subtitle="Help other students recognize you."
      />
      <ThemedView style={{ paddingHorizontal: 24 }}>
        <AuthProgress currentStep={3} totalSteps={4} />
      </ThemedView>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mt-24">
          <View style={{ width: 170, height: 170, position: "relative" }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openGallery}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 85,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: "#7C3AED",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                backgroundColor: "#F5F3FF",
              }}
            >
              {displayImage ? (
                <Image
                  source={{ uri: displayImage }}
                  resizeMode="cover"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Ionicons name="person" size={70} color="#7C3AED" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={openGallery}
              style={{
                position: "absolute",
                right: 4,
                bottom: 4,
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: "#7C3AED",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                justifyContent: "center",
                alignItems: "center",
                elevation: 4,
              }}
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={openCamera}
          className="mt-12 h-14 rounded-2xl bg-violet-600 items-center justify-center flex-row"
        >
          <Ionicons name="camera" size={20} color="#FFFFFF" />
          <ThemedText style={{ color: "#fff" }} className="ml-3 text-white font-bold">
            Take Photo
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openGallery}
          className="mt-4 h-14 rounded-2xl border border-violet-600 items-center justify-center flex-row"
        >
          <Feather name="image" size={20} color="#7C3AED" />
          <ThemedText style={{ color: "#7C3AED" }} className="ml-3 text-violet-600 font-bold">
            Choose From Gallery
          </ThemedText>
        </TouchableOpacity>

        <View className="items-center mt-4">
          <TouchableOpacity
            onPress={() => setIsAvatarModalVisible(true)}
            className="h-14 w-44 border-b border-violet-600 flex-row items-center justify-center"
          >
            <Ionicons name="happy" size={20} color="#7C3AED" />
            <ThemedText className="ml-3 text-violet-600 font-bold">
              Choose Avatar
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} />
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
        <PrimaryButton
          title="Continue"
          disabled={!displayImage}
          onPress={() => {
            if (!displayImage) {
              showError("Please select a profile picture or avatar");
              return;
            }
            nextStep();
            router.push("/auth/studentVerificationScreen");
          }}
        />
      </View>

      {/* Avatar Picker Modal */}
      <Modal
        visible={isAvatarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAvatarModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsAvatarModalVisible(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingHorizontal: 24,
                  paddingTop: 16,
                  maxHeight: "55%",
                  paddingBottom: 30,
                }}
              >
                {/* Header with Title and Close Button */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
                    Select Avatar
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setIsAvatarModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={26} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={avatars}
                  keyExtractor={(item, index) => `${index}`}
                  numColumns={3}
                  showsVerticalScrollIndicator={false}
                  columnWrapperStyle={{
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        handleSelectImage(item, true);
                        setIsAvatarModalVisible(false);
                      }}
                      style={{ alignItems: "center" }}
                    >
                      <Image
                        source={{ uri: item }}
                        style={{
                          width: 90,
                          height: 90,
                          borderRadius: 45,
                          borderWidth: 3,
                          borderColor:
                            selectedAvatar === item ? "#7C3AED" : "#E5E7EB",
                        }}
                      />
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}