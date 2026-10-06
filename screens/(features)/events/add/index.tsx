import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import {
  X,
  Camera,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Tag,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { EventsApi, EventCategory, ImageFile } from "@/service/events.service";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { showError, showSuccess } from "@/components/ui/toast";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { syncKeys } from "@/store/syncStore";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateEventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const { colors, isDark } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<EventCategory>("Academic");
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditing);

  // Date & Time Picker States
  const [dateValue, setDateValue] = useState<Date>(new Date());
  const [hasSelectedDate, setHasSelectedDate] = useState(false);
  const [hasSelectedTime, setHasSelectedTime] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const categories: EventCategory[] = [
    "Academic",
    "Social",
    "Sports",
    "Arts",
    "Professional",
  ];

  // Dynamic theme shortcuts
  const primaryColor = colors.primary || "#6F3FF5";
  const cardBackground = colors.card || (isDark ? "#1F2937" : "#FFFFFF");
  const borderColor = colors.border || (isDark ? "#374151" : "#E5E7EB");
  const textSecondary = colors.text || (isDark ? "#9CA3AF" : "#6B7280");
  const placeholderColor = isDark ? "#6B7280" : "#9CA3AF";

  // Pre-fill form fields when editing
  useEffect(() => {
    if (id) {
      const loadEvent = async () => {
        try {
          setFetchingData(true);
          const findFn = EventsApi.getDetail || (EventsApi as any).findById;
          if (findFn) {
            const event = await findFn(id);
            if (event) {
              setTitle(event.title || "");
              setDescription(event.description || "");
              setLocation(event.location || "");
              if (event.category) setCategory(event.category);
              if (event.isFeatured !== undefined) setIsFeatured(event.isFeatured);
              if (event.coverImage) setExistingImageUrl(event.coverImage);

              // Parse date and time if available
              if (event.date) {
                const parsedDate = new Date(event.date);
                if (!isNaN(parsedDate.getTime())) {
                  setDateValue(parsedDate);
                  setHasSelectedDate(true);
                  setHasSelectedTime(true);
                }
              }
            }
          }
        } catch (err: any) {
          showError("Error", "Failed to fetch event details for editing.");
        } finally {
          setFetchingData(false);
        }
      };
      loadEvent();
    }
  }, [id]);

  const formatDateForBackend = (d: Date): string => {
    return d.toISOString().split("T")[0];
  };

  const formatDateForDisplay = (d: Date): string => {
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimeForDisplay = (d: Date): string => {
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "set" && selectedDate) {
      const updatedDate = new Date(selectedDate);
      updatedDate.setHours(
        dateValue.getHours(),
        dateValue.getMinutes(),
        0,
        0
      );
      setDateValue(updatedDate);
      setHasSelectedDate(true);
    }
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (event.type === "set" && selectedTime) {
      const updatedDate = new Date(dateValue);
      updatedDate.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0
      );

      if (updatedDate < new Date() && !isEditing) {
        Alert.alert(
          "Invalid Time",
          "You cannot select a time in the past for today."
        );
        return;
      }

      setDateValue(updatedDate);
      setHasSelectedTime(true);
    }
  };

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "Permission to access camera roll is required!"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.uri.split("/").pop() || "cover.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      setSelectedImage({
        uri: asset.uri,
        name: filename,
        type: type,
      });
    }
  };

  // Event create/update runs in the background; the events list refetches when
  // it settles (see invalidateKeys + useSyncSignal on the list screen), so the
  // user can leave this screen immediately.
  const submitMutation = useOptimisticMutation<
    any,
    { id?: string; payload: any; image?: ImageFile }
  >({
    apply: () => {},
    rollback: () => {},
    request: ({ id: eventId, payload, image }) => {
      if (eventId) {
        const updateFn = EventsApi.updateEvent || (EventsApi as any).update;
        return updateFn
          ? Promise.resolve(updateFn(eventId, payload, image))
          : Promise.resolve(undefined);
      }
      return EventsApi.createEvent(payload, image);
    },
    onSuccess: (_res, { id: eventId }) => {
      if (eventId) showSuccess("Success", "Event updated successfully!");
      else showSuccess("Success", "Event created successfully!");
    },
    onError: (error: any) =>
      showError(
        "Error",
        error?.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} event. Please try again.`
      ),
    invalidateKeys: [syncKeys.events],
  });

  const handleSubmit = () => {
    if (
      !title.trim() ||
      !description.trim() ||
      !hasSelectedDate ||
      !hasSelectedTime ||
      !location.trim()
    ) {
      Alert.alert(
        "Missing Fields",
        "Please fill in all required fields including Date and Time."
      );
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      date: formatDateForBackend(dateValue),
      time: formatTimeForDisplay(dateValue),
      location: location.trim(),
      category,
      isFeatured,
    };

    setLoading(true);
    submitMutation
      .run({
        id: isEditing && id ? id : undefined,
        payload,
        image: selectedImage || undefined,
      })
      .finally(() => setLoading(false));

    // Leave immediately — the event syncs in the background.
    router.replace("/(features)/events" as any);
  };

  const dynamicInputStyle = [
    styles.input,
    {
      backgroundColor: cardBackground,
      borderColor: borderColor,
      color: colors.text || (isDark ? "#F9FAFB" : "#111827"),
    },
  ];

  const dynamicPickerButtonStyle = [
    styles.pickerButton,
    {
      backgroundColor: cardBackground,
      borderColor: borderColor,
    },
  ];

  if (fetchingData) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={{ marginTop: 12, color: textSecondary }}>Loading event details...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background || (isDark ? "#111827" : "#F9FAFB") },
      ]}
    >
      <View
        style={[
          styles.navHeader,
          {
            borderBottomColor: borderColor,
            borderBottomWidth: 1,
          },
        ]}
      >
        <Pressable
          style={[
            styles.iconBtn,
            { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
          ]}
          onPress={() => router?.back()}
          disabled={loading}
        >
          <X size={20} color={colors.text || (isDark ? "#F3F4F6" : "#374151")} />
        </Pressable>
        <ThemedText style={styles.navTitle}>
          {isEditing ? "Edit Event" : "Create Event"}
        </ThemedText>
        <Pressable
          style={[
            styles.publishBtn,
            { backgroundColor: primaryColor },
            loading && styles.disabledBtn,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <ThemedText style={styles.publishBtnText}>
            {isEditing ? "Save" : "Publish"}
          </ThemedText>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Pressable
            style={[
              styles.imagePicker,
              {
                borderColor: borderColor,
                backgroundColor: cardBackground,
              },
            ]}
            onPress={handlePickImage}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.previewImage}
              />
            ) : existingImageUrl ? (
              <Image
                source={{ uri: existingImageUrl }}
                style={styles.previewImage}
              />
            ) : (
              <ThemedView style={styles.imagePickerPlaceholder}>
                <View
                  style={[
                    styles.cameraCircle,
                    { backgroundColor: isDark ? "#312E81" : "#F3E8FF" },
                  ]}
                >
                  <Camera size={22} color={primaryColor} />
                </View>
                <ThemedText style={styles.imagePickerTitle}>
                  Upload Event Cover
                </ThemedText>
                <ThemedText
                  style={[styles.imagePickerSub, { color: textSecondary }]}
                >
                  PNG, JPG or WEBP (Max 5MB)
                </ThemedText>
              </ThemedView>
            )}
          </Pressable>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Event Title *</ThemedText>
            <TextInput
              style={dynamicInputStyle}
              placeholder="e.g. Freshers Welcome Party"
              placeholderTextColor={placeholderColor}
              value={title}
              onChangeText={setTitle}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Description *</ThemedText>
            <TextInput
              style={[dynamicInputStyle, styles.textArea]}
              placeholder="What is your event about? Include key details..."
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedView style={styles.labelRow}>
              <Tag size={16} color={textSecondary} />
              <ThemedText style={styles.labelWithIcon}>Category</ThemedText>
            </ThemedView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((cat) => {
                const selected = category === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: cardBackground,
                        borderColor: borderColor,
                      },
                      selected && {
                        backgroundColor: isDark ? "#312E81" : "#F3E8FF",
                        borderColor: primaryColor,
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <ThemedText
                      style={[
                        styles.categoryText,
                        { color: textSecondary },
                        selected && { color: primaryColor },
                      ]}
                    >
                      {cat}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </ThemedView>

          {/* Date & Time Input Row */}
          <ThemedView style={styles.rowInputs}>
            <ThemedView style={[styles.formGroup, styles.flex1]}>
              <ThemedView style={styles.labelRow}>
                <CalendarIcon size={16} color={textSecondary} />
                <ThemedText style={styles.labelWithIcon}>Date *</ThemedText>
              </ThemedView>
              <Pressable
                style={dynamicPickerButtonStyle}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText
                  style={[
                    styles.pickerText,
                    !hasSelectedDate && { color: placeholderColor },
                  ]}
                >
                  {hasSelectedDate
                    ? formatDateForDisplay(dateValue)
                    : "Select Date"}
                </ThemedText>
              </Pressable>
            </ThemedView>

            <ThemedView style={[styles.formGroup, styles.flex1]}>
              <ThemedView style={styles.labelRow}>
                <Clock size={16} color={textSecondary} />
                <ThemedText style={styles.labelWithIcon}>Time *</ThemedText>
              </ThemedView>
              <Pressable
                style={dynamicPickerButtonStyle}
                onPress={() => setShowTimePicker(true)}
              >
                <ThemedText
                  style={[
                    styles.pickerText,
                    !hasSelectedTime && { color: placeholderColor },
                  ]}
                >
                  {hasSelectedTime
                    ? formatTimeForDisplay(dateValue)
                    : "Select Time"}
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>

          {/* Date Picker Modal/Popup */}
          {showDatePicker && (
            <ThemedView>
              {Platform.OS === "ios" && (
                <Pressable
                  style={[styles.doneBtn, { backgroundColor: primaryColor }]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <ThemedText style={styles.doneBtnText}>Done</ThemedText>
                </Pressable>
              )}
              <DateTimePicker
                value={dateValue}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={isEditing ? undefined : new Date()}
                onChange={handleDateChange}
                themeVariant={isDark ? "dark" : "light"}
              />
            </ThemedView>
          )}

          {/* Time Picker Modal/Popup */}
          {showTimePicker && (
            <ThemedView>
              {Platform.OS === "ios" && (
                <Pressable
                  style={[styles.doneBtn, { backgroundColor: primaryColor }]}
                  onPress={() => setShowTimePicker(false)}
                >
                  <ThemedText style={styles.doneBtnText}>Done</ThemedText>
                </Pressable>
              )}
              <DateTimePicker
                value={dateValue}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleTimeChange}
                themeVariant={isDark ? "dark" : "light"}
              />
            </ThemedView>
          )}

          <ThemedView style={styles.formGroup}>
            <ThemedView style={styles.labelRow}>
              <MapPin size={16} color={textSecondary} />
              <ThemedText style={styles.labelWithIcon}>Location *</ThemedText>
            </ThemedView>
            <TextInput
              style={dynamicInputStyle}
              placeholder="e.g. Student Center, Main Campus"
              placeholderTextColor={placeholderColor}
              value={location}
              onChangeText={setLocation}
            />
          </ThemedView>

          <Pressable
            style={[
              styles.submitBtn,
              { backgroundColor: primaryColor, shadowColor: primaryColor },
              loading && styles.disabledBtn,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ThemedText style={styles.submitBtnText}>
                {isEditing ? "Update Event" : "Create & Publish"}
              </ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 20,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  publishBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  publishBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imagePicker: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 20,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  cameraCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  imagePickerTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  imagePickerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  labelWithIcon: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
  },
  pickerText: {
    fontSize: 14,
  },
  doneBtn: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  textArea: {
    height: 100,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  categoryScroll: {
    flexDirection: "row",
  },
  categoryPill: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.6,
  },
});