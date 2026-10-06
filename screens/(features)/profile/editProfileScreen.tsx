import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemedText } from "@/components/ui/ThemedText";
import { router } from "expo-router";
import { avatars } from "@/constants/avatar";
import { ThemedView } from "@/components/ui/ThemedView";
import { showError, showSuccess } from "@/components/ui/toast";
import {
  ArrowLeft,
  AtSign,
  Check,
  FileText,
  Camera,
  Image as ImageIcon,
  Smile,
  X,
  AlertCircle,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { userService } from "@/service/profile.Service";
import { authService } from "@/service/auth.service";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { syncKeys } from "@/store/syncStore";
import ProfileFramePicker from "@/components/editProfile/ProfileFramePicker";
import { ProfileFrame } from "@/components/ui/ProfileFrame";

type Mode = "idle" | "options" | "avatars";

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [loading, setLoading] = useState(false);

  // --- Username Suggestion States ---
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Selected image & frame state
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(user?.profileFrame || null);

  // Active view for photo picker section
  const [pickerMode, setPickerMode] = useState<Mode>("idle");

  // Priority: local image selection -> local avatar selection -> stored profile picture
  const displayImage = selectedImage || selectedAvatar || user?.profilePictureUrl;

  // --- Debounced Username Verification Endpoint Check ---
  useEffect(() => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername || trimmedUsername.length < 3 || trimmedUsername === user?.username) {
      setIsUsernameAvailable(null);
      setSuggestions([]);
      setUsernameChecking(false);
      return;
    }

    const handler = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const data = await authService.checkUsername(trimmedUsername);
        setIsUsernameAvailable(data.available);
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.log("Failed checking username uniqueness:", err);
      } finally {
        setUsernameChecking(false);
      }
    }, 550);

    return () => clearTimeout(handler);
  }, [username, user?.username]);

  const handleSelectImage = (uri: string, isAvatar: boolean) => {
    if (isAvatar) {
      setSelectedAvatar(uri);
      setSelectedImage(undefined);
    } else {
      setSelectedImage(uri);
      setSelectedAvatar(null);
    }
    setPickerMode("idle");
  };

  async function openGallery() {
    setPickerMode("idle");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError("Permission Required", "Please grant access to your photo library.");
      return;
    }

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
    setPickerMode("idle");
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showError("Permission Required", "Please grant access to your camera.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled) {
      handleSelectImage(result.assets[0].uri, false);
    }
  }

  // Profile edits apply to the auth store immediately, so the Profile screen
  // shows the new name/bio/photo the moment the user taps save. The upload
  // (which can be slow for a new avatar) finishes in the background.
  const saveProfileMutation = useOptimisticMutation<
    any,
    { formData: FormData; optimistic: Record<string, any>; previous: Record<string, any> }
  >({
    apply: ({ optimistic }) => updateUser(optimistic),
    // Restore the snapshot taken before the optimistic apply — reading `user`
    // here would already return the optimistic values.
    rollback: ({ previous }) => updateUser(previous),
    request: ({ formData }) => userService.updateProfile(formData),
    onSuccess: (res) => {
      const updatedUserData = res?.user || res?.data?.user || res?.data || res;
      if (updatedUserData && typeof updatedUserData === "object") {
        updateUser(updatedUserData);
      }
    },
    onError: (error: any) => {
      if (error?.response) {
        console.error("❌ Backend Error Data:", error.response.data);
        showError(
          error.response.data?.message || "Server validation failed.",
          "Error"
        );
      } else {
        console.error("❌ Network Error:", error?.message);
        showError("Network error. Please check backend connection.", "Error");
      }
    },
    invalidateKeys: [syncKeys.profile],
  });

  const handleSave = () => {
    if (isUsernameAvailable === false) {
      showError("Please pick an available username.", "Error");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("username", username.trim());
    formData.append("bio", bio.trim());

    if (selectedFrame !== null) {
      formData.append("profileFrame", selectedFrame);
    }

    if (selectedImage && (selectedImage.startsWith("file://") || selectedImage.startsWith("ph://"))) {
      const filename = selectedImage.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";

      formData.append("profilePicture", {
        uri: Platform.OS === "android" ? selectedImage : selectedImage.replace("file://", ""),
        name: filename,
        type: mimeType,
      } as any);
    } else if (selectedAvatar) {
      formData.append("profilePictureUrl", selectedAvatar);
    }

    const optimistic: Record<string, any> = {
      username: username.trim(),
      bio: bio.trim(),
      profileFrame: selectedFrame,
    };
    // Prefer the freshly-picked local image so the avatar changes instantly.
    if (selectedImage) optimistic.profilePictureUrl = selectedImage;
    else if (selectedAvatar) optimistic.profilePictureUrl = selectedAvatar;

    saveProfileMutation
      .run({
        formData,
        optimistic,
        // Snapshot the fields being changed so a failed upload can roll back.
        previous: {
          username: user?.username ?? null,
          bio: user?.bio ?? null,
          profileFrame: user?.profileFrame ?? null,
          profilePictureUrl: user?.profilePictureUrl ?? null,
        },
      })
      .finally(() => setLoading(false));

    showSuccess("Profile updated successfully!", "Success");
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <ThemedView style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.navButton, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.text} size={20} />
        </Pressable>

        <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>

        <Pressable
          style={[
            styles.saveIconButton,
            { backgroundColor: colors.primary || "#7C3AED" },
          ]}
          onPress={handleSave}
          disabled={loading || usernameChecking || isUsernameAvailable === false}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Check color="#FFF" size={20} />
          )}
        </Pressable>
      </ThemedView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar & Frame Container */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPickerMode((prev) => (prev === "idle" ? "options" : "idle"))}
            >
              <ProfileFrame
                frameId={selectedFrame}
                uri={displayImage}
                size={120}
                initial={username?.[0]?.toUpperCase()}
                fallbackColor={colors.primary || "#7C3AED"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setPickerMode((prev) => (prev === "idle" ? "options" : "idle"))}
              style={[
                styles.cameraBadge,
                { backgroundColor: colors.primary || "#7C3AED", borderColor: colors.background },
              ]}
            >
              <Ionicons name="camera" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setPickerMode((prev) => (prev === "idle" ? "options" : "idle"))}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ThemedText style={[styles.changePhotoText, { color: colors.primary || "#7C3AED" }]}>
              {pickerMode === "idle" ? "Change Profile Picture" : "Close Options"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Profile Frame Selection Section */}
        <View style={styles.framePickerContainer}>
          <ProfileFramePicker
            selectedFrame={selectedFrame}
            onSelectFrame={(frameUri) => setSelectedFrame(frameUri)}
          />
        </View>

        {/* Inline Photo Picker Selector */}
        {pickerMode === "options" && (
          <View style={[styles.inlinePickerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={styles.sectionTitle}>Choose Photo Source</ThemedText>

            <TouchableOpacity
              style={[styles.optionRow, { borderColor: colors.border }]}
              onPress={openCamera}
            >
              <View style={[styles.iconCircle, { backgroundColor: "#F3E8FF" }]}>
                <Camera size={20} color="#7C3AED" />
              </View>
              <ThemedText style={styles.optionText}>Take Photo</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionRow, { borderColor: colors.border }]}
              onPress={openGallery}
            >
              <View style={[styles.iconCircle, { backgroundColor: "#E0F2FE" }]}>
                <ImageIcon size={20} color="#0284C7" />
              </View>
              <ThemedText style={styles.optionText}>Choose from Gallery</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionRow, { borderColor: colors.border }]}
              onPress={() => setPickerMode("avatars")}
            >
              <View style={[styles.iconCircle, { backgroundColor: "#DCFCE7" }]}>
                <Smile size={20} color="#16A34A" />
              </View>
              <ThemedText style={styles.optionText}>Choose an Avatar</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Inline Avatar Grid Selector */}
        {pickerMode === "avatars" && (
          <View style={[styles.inlinePickerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.avatarHeader}>
              <ThemedText style={styles.sectionTitle}>Select Avatar</ThemedText>
              <TouchableOpacity onPress={() => setPickerMode("options")}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarGridContainer}>
              {avatars.map((item, index) => {
                const isSelected = selectedAvatar === item;
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    onPress={() => handleSelectImage(item, true)}
                    style={styles.avatarGridItem}
                  >
                    <Image
                      source={{ uri: item }}
                      style={[
                        styles.avatarGridImage,
                        {
                          borderColor: isSelected
                            ? colors.primary || "#7C3AED"
                            : colors.border,
                          borderWidth: isSelected ? 3 : 1,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Input Fields */}
        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.inputLabel, { color: colors.muted }]}>
            Username
          </ThemedText>
          <ThemedView
            style={[
              styles.inputWrapper,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <AtSign size={18} color={colors.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
            />
            {usernameChecking && <ActivityIndicator size="small" color={colors.primary || "#7C3AED"} />}
            {!usernameChecking && isUsernameAvailable === true && (
              <Check size={18} color="#16A34A" />
            )}
            {!usernameChecking && isUsernameAvailable === false && (
              <AlertCircle size={18} color="#DC2626" />
            )}
          </ThemedView>

          {/* Username Suggestions */}
          {!usernameChecking && isUsernameAvailable === false && (
            <View style={styles.suggestionsContainer}>
              <ThemedText style={styles.errorText}>Username is already taken.</ThemedText>
              {suggestions.length > 0 && (
                <>
                  <ThemedText style={[styles.suggestionLabel, { color: colors.muted }]}>
                    Suggested usernames:
                  </ThemedText>
                  <View style={styles.suggestionsList}>
                    {suggestions.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setUsername(item)}
                      >
                        <ThemedText style={[styles.suggestionChipText, { color: colors.primary || "#7C3AED" }]}>
                          @{item}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          <ThemedView style={styles.labelWithCounter}>
            <ThemedText style={[styles.inputLabel, { color: colors.muted }]}>
              Bio
            </ThemedText>
            <ThemedText style={[styles.counterText, { color: colors.muted }]}>
              {bio.length}/150
            </ThemedText>
          </ThemedView>
          <ThemedView
            style={[
              styles.inputWrapper,
              styles.bioWrapper,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <FileText
              size={18}
              color={colors.muted}
              style={[styles.inputIcon, { marginTop: 12 }]}
            />
            <TextInput
              style={[styles.textInput, styles.bioTextInput, { color: colors.text }]}
              value={bio}
              onChangeText={(text) => text.length <= 150 && setBio(text)}
              placeholder="Write a short bio about yourself..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
            />
          </ThemedView>
        </ThemedView>
      </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  saveIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: "relative",
  },

  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  framePickerContainer: {
    marginBottom: 20,
  },
  inlinePickerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  avatarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  avatarGridItem: {
    alignItems: "center",
  },
  avatarGridImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  formGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelWithCounter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counterText: {
    fontSize: 12,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  suggestionLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  suggestionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  bioWrapper: {
    height: 110,
    alignItems: "flex-start",
  },
  bioTextInput: {
    textAlignVertical: "top",
    paddingTop: 12,
    paddingBottom: 12,
  },
});