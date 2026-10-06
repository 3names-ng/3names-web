import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { marketplaceService } from "@/service/marketplace.service";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { showError, showSuccess } from "@/components/ui/toast";
import { useTheme } from "@/hooks/useTheme";
import { useCreateRestriction } from "@/hooks/useCreateRestriction";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { syncKeys } from "@/store/syncStore";

const CATEGORIES = [
  "Electronics",
  "Fashion & Clothing",
  "Home & Furniture",
  "Books & Stationery",
  "Phones & Tablets",
  "Computers & Accessories",
  "Gaming",
  "Beauty & Personal Care",
  "Sports & Fitness",
  "Other",
];

const CONDITIONS = [
  "Brand New",
  "Like New",
  "Used - Excellent",
  "Used - Good",
  "Used - Fair",
  "Refurbished",
];

const CONTACT_METHODS: ("Chat" | "Call" | "WhatsApp")[] = ["Chat", "Call", "WhatsApp"];

export default function AddMarketplaceItemScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  const isEditing = Boolean(params.id);
  const headerOffset = 64 + insets.top;
  const { isRestricted, guardCreate } = useCreateRestriction();

  // Photos state
  const [photos, setPhotos] = useState<string[]>([]);
  // Photos already saved on the listing can't be removed here — only ones
  // the user adds during this edit session.
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<Set<string>>(new Set());

  // Form Field States
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState<"Yes" | "No">("Yes");
  const [discountPrice, setDiscountPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsApp, setWhatsApp] = useState("");
  const [preferredContact, setPreferredContact] = useState<"Chat" | "Call" | "WhatsApp">("Chat");

  // Loading States
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Picker Modal States
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [conditionModalVisible, setConditionModalVisible] = useState(false);

  // Preload data if in Edit Mode
  useEffect(() => {
    if (!isEditing || !params.id) return;

    const fetchItemDetails = async () => {
      try {
        setIsLoading(true);
        const item = await marketplaceService.getItemById(params.id as string);

        if (item) {
          setTitle(item.title || "");
          setCategory(item.category || "");
          setCondition(item.condition || "");
          setDescription(item.description || "");
          setPrice(item.price ? String(item.price) : "");
          setIsNegotiable(item.isNegotiable ? "Yes" : "No");
          setDiscountPrice(item.discountPrice ? String(item.discountPrice) : "");
          setBrand(item.brand || "");
          setModel(item.model || "");
          setQuantity(item.quantity ? String(item.quantity) : "1");
          setLocation(item.location || "");
          setPhone(item.phone || item.contactPhone || "");
          setWhatsApp(item.whatsApp || "");
          setPreferredContact(item.preferredContact || "Chat");

          const extractedPhotos = item.photos || item.imageUrls || [];
          setPhotos(extractedPhotos);
          setExistingPhotoUrls(new Set(extractedPhotos));
        }
      } catch (error: any) {
        Alert.alert("Error", "Failed to load listing details.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemDetails();
  }, [params.id, isEditing]);

  const handleAddPhoto = async () => {
    if (photos.length >= 10) {
      Alert.alert("Limit Reached", "You can only upload up to 10 photos.");
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "You need to grant photo library permissions to select images."
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
      setPhotos((prev) => [...prev, ...newUris].slice(0, 10));
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  // Leaving the screen no longer waits on the network. The create/update is
  // fired in the background and the destination screens refetch when it
  // settles (see the invalidateKeys below + useSyncSignal).
  const publishMutation = useOptimisticMutation<
    any,
    { id?: string; payload: any }
  >({
    apply: () => {},
    rollback: () => {},
    request: ({ id, payload }) =>
      id
        ? marketplaceService.updateItem(id, payload)
        : marketplaceService.createItem(payload),
    onSuccess: (_res, { id }) => {
      if (id) {
        showSuccess("Your item listing has been updated!");
      } else {
        showSuccess(
          "Your listing has been sent to an admin for approval and will appear in the marketplace once approved.",
          "Submitted for Review"
        );
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        `Failed to ${isEditing ? "update" : "publish"} item. Please try again.`;
      showError(Array.isArray(message) ? message.join("\n") : message);
    },
    invalidateKeys: [
      syncKeys.marketplaceList,
      ...(params.id ? [syncKeys.marketplace(params.id)] : []),
    ],
  });

  const handlePublish = () => {
    if (!isEditing && !guardCreate("Creating new marketplace listings is disabled while your account is restricted.")) {
      return;
    }
    if (!isEditing && photos.length === 0) {
      Alert.alert("Missing Photos", "Please add at least one photo for your listing.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a title.");
      return;
    }
    if (!category) {
      Alert.alert("Validation Error", "Please select a category.");
      return;
    }
    if (!condition) {
      Alert.alert("Validation Error", "Please select the condition of your item.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Validation Error", "Please enter a description.");
      return;
    }
    if (!price.trim()) {
      Alert.alert("Validation Error", "Please specify a price.");
      return;
    }

    const payload = {
      title: title.trim(),
      category,
      condition,
      description: description.trim(),
      price: Number(price),
      isNegotiable: isNegotiable === "Yes",
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      quantity: quantity ? Number(quantity) : 1,
      location: location.trim() || undefined,
      phone: phone.trim() || undefined,
      whatsApp: whatsApp.trim() || undefined,
      preferredContact,
      photos,
    };

    setIsSubmitting(true);
    publishMutation
      .run({ id: isEditing ? params.id : undefined, payload })
      .finally(() => setIsSubmitting(false));

    // Leave immediately — the listing syncs in the background.
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6C47FF" />
        <ThemedText style={styles.loadingText}>Loading item details...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Fixed Top Header */}
      <ThemedView style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card || "#F9FAFB" }]}
          disabled={isSubmitting}
        >
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <ThemedView style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle}>
            {isEditing ? "Edit Listing" : "Add New Item"}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {isEditing ? "Update your item information" : "List your item for sale"}
          </ThemedText>
        </ThemedView>
        <Pressable
          onPress={handlePublish}
          disabled={isSubmitting || (!isEditing && isRestricted)}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#6C47FF" />
          ) : (
            <ThemedText
              style={[styles.publishHeaderText, !isEditing && isRestricted && { opacity: 0.4 }]}
            >
              {isEditing ? "Save" : "Publish"}
            </ThemedText>
          )}
        </Pressable>
      </ThemedView>

      {!isEditing && isRestricted && (
        <ThemedView style={[styles.restrictedBanner, { backgroundColor: colors.dangerLight }]}>
          <ThemedText style={[styles.restrictedBannerText, { color: colors.danger }]}>
            New listings are disabled while your account is restricted
          </ThemedText>
        </ThemedView>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={headerOffset}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photos Section */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionHeader}>
              Add Photos {!isEditing && <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>}
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Add up to 5 photos (First photo will be cover)
            </ThemedText>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photosScrollView}
              >
                {photos.map((uri, index) => (
                  <ThemedView key={index} style={styles.photoWrapper}>
                    <Image source={{ uri }} style={styles.photoImage} />
                    {index === 0 && (
                      <ThemedView style={styles.coverBadge}>
                        <ThemedText style={styles.coverBadgeText}>Cover</ThemedText>
                      </ThemedView>
                    )}
                    {/* Existing photos can't be removed — except a broken
                        legacy entry (a local file URI that was never actually
                        uploaded), which is junk data anyway. */}
                    {(!existingPhotoUrls.has(uri) || !/^https?:\/\//.test(uri)) && (
                      <Pressable
                        onPress={() => handleRemovePhoto(index)}
                        style={styles.removePhotoButton}
                        disabled={isSubmitting}
                      >
                        <Feather name="trash-2" size={14} color="#111827" />
                      </Pressable>
                    )}
                  </ThemedView>
                ))}

                {photos.length < 10 && (
                  <Pressable
                    onPress={handleAddPhoto}
                    style={styles.addPhotoButton}
                    disabled={isSubmitting}
                  >
                    <ThemedView style={styles.addPhotoIconCircle}>
                      <Feather name="plus" size={22} color="#FFF" />
                    </ThemedView>
                    <ThemedText style={styles.addPhotoText}>Add Photo</ThemedText>
                  </Pressable>
                )}
            </ScrollView>
          </ThemedView>

          {/* Basic Information Section */}
          <ThemedText style={styles.sectionCategoryTitle}>Basic Information</ThemedText>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>
              Title <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>
            </ThemedText>
            <ThemedView style={[styles.inputContainer, { borderWidth: 1, borderColor: colors.border }]}>
              <Feather name="tag" size={18} color="#6C47FF" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="e.g. HP Pavilion 15 Laptop"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                editable={!isSubmitting}
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.row}>
            {/* Category Dropdown Picker */}
            <ThemedView style={[styles.inputGroup, styles.flex1]}>
              <ThemedText style={styles.inputLabel}>
                Category <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>
              </ThemedText>
              <Pressable
                onPress={() => setCategoryModalVisible(true)}
                style={[styles.inputContainer, { borderWidth: 1, borderColor: colors.border }]}
                disabled={isSubmitting}
              >
                <Ionicons name="grid-outline" size={18} color="#6C47FF" style={styles.inputIcon} />
                <ThemedText
                  style={[category ? styles.textInputValue : styles.placeholderText, { color: category ? colors.text : "#9CA3AF" }]}
                  numberOfLines={1}
                >
                  {category || "Select category"}
                </ThemedText>
                <Feather name="chevron-down" size={18} color="#6B7280" />
              </Pressable>
            </ThemedView>

            {/* Condition Dropdown Picker */}
            <ThemedView style={[styles.inputGroup, styles.flex1]}>
              <ThemedText style={styles.inputLabel}>
                Condition <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>
              </ThemedText>
              <Pressable
                onPress={() => setConditionModalVisible(true)}
                style={[styles.inputContainer, { borderWidth: 1, borderColor: colors.border }]}
                disabled={isSubmitting}
              >
                <Feather name="shield" size={18} color="#6C47FF" style={styles.inputIcon} />
                <ThemedText
                  style={[condition ? styles.textInputValue : styles.placeholderText, { color: condition ? colors.text : "#9CA3AF" }]}
                  numberOfLines={1}
                >
                  {condition || "Select condition"}
                </ThemedText>
                <Feather name="chevron-down" size={18} color="#6B7280" />
              </Pressable>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>
              Description <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>
            </ThemedText>
            <ThemedView style={[styles.inputContainer, styles.textAreaContainer, { borderWidth: 1, borderColor: colors.border }]}>
              <Feather name="align-left" size={18} color="#6C47FF" style={styles.textAreaIcon} />
              <TextInput
                style={[styles.textInput, styles.textArea, { color: colors.text }]}
                placeholder="Describe your item..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
                value={description}
                onChangeText={setDescription}
                editable={!isSubmitting}
              />
              <ThemedText style={styles.charCounter}>{description.length}/500</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Pricing Section */}
          <ThemedText style={styles.sectionCategoryTitle}>Pricing & Quantity</ThemedText>

          <ThemedView style={styles.row}>
            <ThemedView style={[styles.inputGroup, { flex: 1.2 }]}>
              <ThemedText style={styles.inputLabel}>
                Price (₦) <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>
              </ThemedText>
              <ThemedView style={[styles.inputContainer, { borderWidth: 1, borderColor: colors.border }]}>
                <ThemedView style={styles.currencyIconWrapper}>
                  <ThemedText style={styles.currencySymbol}>₦</ThemedText>
                </ThemedView>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="e.g. 150000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                  editable={!isSubmitting}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedView style={styles.labelWithInfoRow}>
                <ThemedText style={styles.inputLabel}>Negotiable</ThemedText>
                <Feather name="info" size={13} color="#9CA3AF" style={{ marginLeft: 4 }} />
              </ThemedView>
              <ThemedView style={[styles.segmentedControl, { borderColor: colors.border }]}>
                <Pressable
                  onPress={() => setIsNegotiable("Yes")}
                  disabled={isSubmitting}
                  style={[
                    styles.segmentButton,
                    isNegotiable === "Yes" && styles.segmentButtonActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.segmentText,
                      isNegotiable === "Yes" && styles.segmentTextActive,
                    ]}
                  >
                    Yes
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setIsNegotiable("No")}
                  disabled={isSubmitting}
                  style={[
                    styles.segmentButton,
                    isNegotiable === "No" && styles.segmentButtonActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.segmentText,
                      isNegotiable === "No" && styles.segmentTextActive,
                    ]}
                  >
                    No
                  </ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.row}>
            <ThemedView style={[styles.inputGroup, styles.flex1]}>
              <ThemedText style={styles.inputLabel}>Discount Price (₦) (Optional)</ThemedText>
              <ThemedView style={[styles.inputContainer, { borderWidth: 1, borderColor: colors.border }]}>
                <Feather name="percent" size={18} color="#6C47FF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="e.g. 120000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={discountPrice}
                  onChangeText={setDiscountPrice}
                  editable={!isSubmitting}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={[styles.inputGroup, { width: 100 }]}>
              <ThemedText style={styles.inputLabel}>Quantity</ThemedText>
              <ThemedView style={[styles.inputContainer, { borderWidth: 1, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text, textAlign: "center" }]}
                  placeholder="1"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={quantity}
                  onChangeText={setQuantity}
                  editable={!isSubmitting}
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Details Section */}
          <ThemedText style={styles.sectionCategoryTitle}>Details & Specifications</ThemedText>

          <ThemedView style={styles.row}>
            <ThemedView style={[styles.inputGroup, styles.flex1]}>
              <ThemedText style={styles.inputLabel}>Brand (Optional)</ThemedText>
              <ThemedView style={[styles.inputContainer, { borderWidth: 1, borderColor: colors.border }]}>
                <Feather name="home" size={18} color="#6C47FF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="e.g. HP"
                  placeholderTextColor="#9CA3AF"
                  value={brand}
                  onChangeText={setBrand}
                  editable={!isSubmitting}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={[styles.inputGroup, styles.flex1]}>
              <ThemedText style={styles.inputLabel}>Model (Optional)</ThemedText>
              <ThemedView style={[styles.inputContainer, { borderWidth: 1, borderColor: colors.border }]}>
                <Feather name="smartphone" size={18} color="#6C47FF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="e.g. Pavilion 15"
                  placeholderTextColor="#9CA3AF"
                  value={model}
                  onChangeText={setModel}
                  editable={!isSubmitting}
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Contact & Location Section */}
          <ThemedText style={styles.sectionCategoryTitle}>Location & Contact</ThemedText>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Location (Optional)</ThemedText>
            <ThemedView style={[styles.inputContainer, { borderWidth: 1, borderColor: colors.border }]}>
              <Feather name="map-pin" size={18} color="#6C47FF" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="e.g. Unilag Campus / Yaba, Lagos"
                placeholderTextColor="#9CA3AF"
                value={location}
                onChangeText={setLocation}
                editable={!isSubmitting}
              />
            </ThemedView>
          </ThemedView>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Button */}
      <Pressable
        onPress={handlePublish}
        style={[
          styles.publishButton,
          (isSubmitting || (!isEditing && isRestricted)) && styles.publishButtonDisabled,
        ]}
        disabled={isSubmitting || (!isEditing && isRestricted)}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Feather name={isEditing ? "check" : "tag"} size={18} color="#FFF" style={{ marginRight: 8 }} />
            <ThemedText style={styles.publishButtonText}>
              {isEditing ? "Update Listing" : "Publish Item"}
            </ThemedText>
          </>
        )}
      </Pressable>

      {/* Category Selection Modal */}
      <Modal visible={categoryModalVisible} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
          <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <ThemedView style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={styles.modalTitle}>Select Category</ThemedText>
              <Pressable onPress={() => setCategoryModalVisible(false)}>
                <Feather name="x" size={20} color={colors.text} />
              </Pressable>
            </ThemedView>
            <ScrollView style={{ maxHeight: 320 }}>
              {CATEGORIES.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: colors.border },
                    category === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setCategory(item);
                    setCategoryModalVisible(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      { color: colors.text },
                      category === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </ThemedText>
                  {category === item && <Feather name="check" size={18} color="#6C47FF" />}
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>

      {/* Condition Selection Modal */}
      <Modal visible={conditionModalVisible} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setConditionModalVisible(false)}>
          <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <ThemedView style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={styles.modalTitle}>Select Condition</ThemedText>
              <Pressable onPress={() => setConditionModalVisible(false)}>
                <Feather name="x" size={20} color={colors.text} />
              </Pressable>
            </ThemedView>
            <ScrollView style={{ maxHeight: 300 }}>
              {CONDITIONS.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: colors.border },
                    condition === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setCondition(item);
                    setConditionModalVisible(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      { color: colors.text },
                      condition === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </ThemedText>
                  {condition === item && <Feather name="check" size={18} color="#6C47FF" />}
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  publishHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6C47FF",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
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
  sectionCategoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
  },
  textInputValue: {
    flex: 1,
    fontSize: 13,
  },
  placeholderText: {
    flex: 1,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  textAreaContainer: {
    height: 90,
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  textAreaIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  textArea: {
    height: "100%",
    textAlignVertical: "top",
  },
  charCounter: {
    position: "absolute",
    bottom: 8,
    right: 12,
    fontSize: 11,
    color: "#9CA3AF",
  },
  currencyIconWrapper: {
    marginRight: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6C47FF",
  },
  labelWithInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  segmentedControl: {
    flexDirection: "row",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: "#6C47FF",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  publishButton: {
    flexDirection: "row",
    height: 52,
    backgroundColor: "#6C47FF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  restrictedBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  restrictedBannerText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalOptionSelected: {
    backgroundColor: "rgba(108, 71, 255, 0.05)",
  },
  modalOptionText: {
    fontSize: 14,
  },
  modalOptionTextSelected: {
    fontWeight: "700",
    color: "#6C47FF",
  },
});