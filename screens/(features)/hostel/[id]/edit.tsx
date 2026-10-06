import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { hostelService, UpdateHostelFormPayload } from "@/service/hostel.service";
import { showError, showSuccess } from "@/components/ui/toast";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { syncKeys } from "@/store/syncStore";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import Input from "@/components/hostel/input";
import TextArea from "@/components/hostel/textArea";
import PrimaryButton from "@/components/hostel/primaryButton";
import SectionTitle from "@/components/hostel/sectionTitle";

const ROOM_TYPES = [
  "Single Room",
  "Self Contain",
  "One Bedroom",
  "Two Bedroom",
  "Apartment",
] as const;

const GENDERS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Mixed", value: "mixed" },
] as const;

const AMENITY_IDS = [
  "wifi", "electricity", "water", "security", "cctv",
  "parking", "laundry", "kitchen", "wardrobe", "study",
  "generator", "furnished", "aircondition", "balcony", "tv",
] as const;

const AMENITY_ICONS: Record<string, string> = {
  wifi: "wifi",
  electricity: "lightning-bolt",
  water: "water",
  security: "shield-check",
  cctv: "cctv",
  parking: "car",
  laundry: "washing-machine",
  kitchen: "silverware-fork-knife",
  wardrobe: "wardrobe",
  study: "desk",
  generator: "engine",
  furnished: "sofa",
  aircondition: "air-conditioner",
  balcony: "balcony",
  tv: "television",
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: "Wi-Fi",
  electricity: "24/7 Electricity",
  water: "Running Water",
  security: "Security",
  cctv: "CCTV",
  parking: "Parking",
  laundry: "Laundry",
  kitchen: "Kitchen",
  wardrobe: "Wardrobe",
  study: "Study Area",
  generator: "Generator",
  furnished: "Fully Furnished",
  aircondition: "Air Conditioner",
  balcony: "Balcony",
  tv: "Smart TV",
};

export default function EditHostelScreen() {
  const { colors } = useTheme();
  const currentUser = useAuthStore((state) => state.user);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  // Photos already saved on the listing can't be removed here — only ones
  // the user adds during this edit session. Tracked by URL since new photos
  // are always appended, so this stays correct even if the array is later
  // sliced/reordered.
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<Set<string>>(new Set());
  const [hostelName, setHostelName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [cautionFee, setCautionFee] = useState("");
  const [roomType, setRoomType] = useState("");
  const [gender, setGender] = useState("");
  const [capacity, setCapacity] = useState("");
  const [availableRooms, setAvailableRooms] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [curfew, setCurfew] = useState("");
  const [visitorsAllowed, setVisitorsAllowed] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [lookingForRoommate, setLookingForRoommate] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await hostelService.getHostelById(id);
        const hostel = data?.data || data;

        if (currentUser?.id && hostel?.sellerId && currentUser.id !== hostel.sellerId) {
          showError("You can only edit your own listing.");
          router.back();
          return;
        }

        const loadedPhotos: string[] = hostel?.imageUrls ?? [];
        setPhotos(loadedPhotos);
        setExistingPhotoUrls(new Set(loadedPhotos));
        setHostelName(hostel?.hostelName ?? "");
        setDescription(hostel?.description ?? "");
        setAddress(hostel?.address ?? "");
        setCity(hostel?.city ?? "");
        setState(hostel?.state ?? "");
        setMonthlyRent(hostel?.monthlyRent?.toString() ?? "");
        setServiceCharge(hostel?.serviceCharge?.toString() ?? "");
        setCautionFee(hostel?.cautionFee?.toString() ?? "");
        setRoomType(hostel?.roomType ?? "");
        setGender(hostel?.gender ?? "");
        setCapacity(hostel?.capacity?.toString() ?? "");
        setAvailableRooms(hostel?.availableRooms?.toString() ?? "");
        setAmenities(hostel?.amenities ?? []);
        setCurfew(hostel?.curfew ?? "");
        setVisitorsAllowed(Boolean(hostel?.visitorsAllowed));
        setPetsAllowed(Boolean(hostel?.petsAllowed));
        setSmokingAllowed(Boolean(hostel?.smokingAllowed));
        setLookingForRoommate(Boolean(hostel?.lookingForRoommate));
        setContactName(hostel?.contactName ?? "");
        setContactPhone(hostel?.contactPhone ?? "");
        setWhatsapp(hostel?.whatsapp ?? "");
        setContactEmail(hostel?.contactEmail ?? "");
      } catch (err: any) {
        showError(
          err?.response?.data?.message || "Failed to load listing.",
          "Something went wrong"
        );
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAddPhoto = async () => {
    if (photos.length >= 10) {
      showError("You can only upload up to 10 photos.");
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showError("Please allow photo access to upload images.");
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
    setPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  function toggleAmenity(amenityId: string) {
    setAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((a) => a !== amenityId) : [...prev, amenityId]
    );
  }

  // Syncs in the background after the user has already gone back. The
  // destination screens listen for the invalidated keys and refetch once the
  // request settles, so they never settle on the pre-edit snapshot.
  const updateHostelMutation = useOptimisticMutation<
    unknown,
    { id: string; payload: UpdateHostelFormPayload }
  >({
    apply: () => {},
    rollback: () => {},
    request: ({ id: hostelId, payload }) =>
      hostelService.updateHostel(hostelId, payload),
    onSuccess: () =>
      showSuccess("Your listing has been updated.", "Listing Updated"),
    onError: (err: any) =>
      showError(
        err?.response?.data?.message ||
          "Failed to update listing. Please try again.",
        "Update Failed"
      ),
    invalidateKeys: [syncKeys.hostel(id), syncKeys.hostelList],
  });

  function handleSave() {
    if (!hostelName.trim()) {
      showError("Please enter a hostel name.");
      return;
    }
    if (photos.length === 0) {
      showError("Please add at least one photo.");
      return;
    }

    setIsSubmitting(true);
    updateHostelMutation
      .run({
        id,
        payload: {
          photos,
          hostelName: hostelName.trim(),
          description: description.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          monthlyRent,
          serviceCharge,
          cautionFee,
          roomType,
          gender,
          capacity,
          availableRooms,
          amenities,
          curfew: curfew.trim(),
          visitorsAllowed,
          petsAllowed,
          smokingAllowed,
          lookingForRoommate,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          whatsapp: whatsapp.trim(),
          contactEmail: contactEmail.trim(),
        },
      })
      .finally(() => setIsSubmitting(false));

    // Leave immediately — the update continues in the background.
    router.back();
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#6C47FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          disabled={isSubmitting}
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.card }}
        >
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={{ fontSize: 17, fontWeight: "700" }}>Edit Listing</ThemedText>
        <Pressable onPress={handleSave} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#6C47FF" />
          ) : (
            <ThemedText style={{ color: "#6C47FF", fontSize: 16, fontWeight: "700" }}>Save</ThemedText>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 4 }}
          >
            {photos.map((uri, index) => (
              <ThemedView
                key={`${uri}-${index}`}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  marginRight: 12,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Image source={{ uri }} style={{ width: "100%", height: "100%", borderRadius: 12 }} />
                {index === 0 && (
                  <ThemedView
                    style={{
                      position: "absolute",
                      bottom: 6,
                      left: 6,
                      backgroundColor: "rgba(0,0,0,0.75)",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <ThemedText style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "600" }}>
                      Cover
                    </ThemedText>
                  </ThemedView>
                )}
                {/* Existing photos can't be removed — except a broken legacy
                    entry (a local file URI that was never actually
                    uploaded), which is junk data anyway. */}
                {(!existingPhotoUrls.has(uri) || !/^https?:\/\//.test(uri)) && (
                  <Pressable
                    onPress={() => handleRemovePhoto(index)}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="trash-2" size={14} color="#111827" />
                  </Pressable>
                )}
              </ThemedView>
            ))}

            {photos.length < 10 && (
              <Pressable
                onPress={handleAddPhoto}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: "#6C47FF",
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ThemedView
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#6C47FF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                  }}
                >
                  <Feather name="plus" size={22} color="#FFF" />
                </ThemedView>
                <ThemedText style={{ fontSize: 11, fontWeight: "600", color: "#6C47FF" }}>
                  Add Photo
                </ThemedText>
              </Pressable>
            )}
          </ScrollView>

          <View style={{ marginTop: 20 }}>
            <Input label="Hostel Name" placeholder="e.g. Sunshine Lodge" value={hostelName} onChangeText={setHostelName} />
            <TextArea label="Description" placeholder="Describe the hostel" value={description} onChangeText={setDescription} />
            <Input label="Address" placeholder="Street address" value={address} onChangeText={setAddress} />
            <Input label="City" placeholder="City" value={city} onChangeText={setCity} />
            <Input label="State" placeholder="State" value={state} onChangeText={setState} />
          </View>

          <SectionTitle title="Pricing" />
          <Input keyboardType="numeric" label="Monthly Rent" placeholder="0" value={monthlyRent} onChangeText={setMonthlyRent} />
          <Input keyboardType="numeric" label="Service Charge" placeholder="0" value={serviceCharge} onChangeText={setServiceCharge} />
          <Input keyboardType="numeric" label="Caution Fee" placeholder="0" value={cautionFee} onChangeText={setCautionFee} />

          <SectionTitle title="Room Details" />
          <ThemedText style={{ fontWeight: "700", fontSize: 16, marginBottom: 10 }}>Room Type</ThemedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 }}>
            {ROOM_TYPES.map((type) => {
              const selected = roomType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setRoomType(type)}
                  style={{
                    width: "48%",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    backgroundColor: selected ? "#7C3AED" : colors.card,
                    borderWidth: 1,
                    borderColor: selected ? "#7C3AED" : colors.border,
                  }}
                >
                  <ThemedText style={{ fontWeight: "700", color: selected ? "#FFF" : colors.text }}>{type}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText style={{ fontWeight: "700", fontSize: 16, marginBottom: 10 }}>Gender</ThemedText>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16, gap: 8 }}>
            {GENDERS.map((g) => {
              const active = gender === g.value;
              return (
                <Pressable
                  key={g.value}
                  onPress={() => setGender(g.value)}
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    paddingVertical: 14,
                    alignItems: "center",
                    backgroundColor: active ? "#7C3AED" : colors.card,
                    borderWidth: 1,
                    borderColor: active ? "#7C3AED" : colors.border,
                  }}
                >
                  <ThemedText style={{ fontWeight: "600", color: active ? "#FFF" : colors.text }}>{g.label}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Input keyboardType="numeric" label="Maximum Occupants" placeholder="4" value={capacity} onChangeText={setCapacity} />
          <Input keyboardType="numeric" label="Available Rooms" placeholder="6" value={availableRooms} onChangeText={setAvailableRooms} />

          <SectionTitle title="Amenities" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {AMENITY_IDS.map((amenityId) => {
              const active = amenities.includes(amenityId);
              return (
                <Pressable
                  key={amenityId}
                  onPress={() => toggleAmenity(amenityId)}
                  style={{
                    width: "48%",
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: 12,
                    alignItems: "center",
                    backgroundColor: active ? "#7C3AED" : colors.card,
                    borderWidth: 1,
                    borderColor: active ? "#7C3AED" : colors.border,
                  }}
                >
                  <MaterialCommunityIcons
                    name={AMENITY_ICONS[amenityId] as any}
                    size={30}
                    color={active ? "#FFF" : "#7C3AED"}
                  />
                  <ThemedText style={{ marginTop: 10, fontWeight: "600", textAlign: "center", color: active ? "#FFF" : colors.text }}>
                    {AMENITY_LABELS[amenityId]}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <SectionTitle title="Rules" />
          {[
            { label: "Visitors Allowed", value: visitorsAllowed, onChange: setVisitorsAllowed },
            { label: "Smoking Allowed", value: smokingAllowed, onChange: setSmokingAllowed },
            { label: "Pets Allowed", value: petsAllowed, onChange: setPetsAllowed },
            { label: "Looking for a Roommate", value: lookingForRoommate, onChange: setLookingForRoommate },
          ].map((rule) => (
            <ThemedView
              key={rule.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 16,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <ThemedText style={{ fontSize: 15, fontWeight: "600" }}>{rule.label}</ThemedText>
              <Switch value={rule.value} onValueChange={rule.onChange} />
            </ThemedView>
          ))}
          <Input label="Curfew Time" placeholder="e.g. 10:00 PM" value={curfew} onChangeText={setCurfew} />

          {/* <SectionTitle title="Contact" />
          <Input label="Contact Person" placeholder="Full name" value={contactName} onChangeText={setContactName} />
          <Input keyboardType="phone-pad" label="Phone Number" placeholder="Phone number" value={contactPhone} onChangeText={setContactPhone} />
          <Input keyboardType="phone-pad" label="WhatsApp" placeholder="WhatsApp number" value={whatsapp} onChangeText={setWhatsapp} />
          <Input keyboardType="email-address" autoCapitalize="none" label="Email" placeholder="Email address" value={contactEmail} onChangeText={setContactEmail} /> */}

          <View style={{ marginTop: 24 }}>
            <PrimaryButton title={isSubmitting ? "Saving..." : "Save Changes"} onPress={handleSave} disabled={isSubmitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
