import React, { useState, useEffect, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Controller, useForm } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import { useTheme } from "@/hooks/useTheme";
import AuthHeader from "@/components/auth/authHeader";
import AuthInput from "@/components/auth/authInput";
import AuthProgress from "@/components/auth/authProgress";
import PrimaryButton from "@/components/auth/primaryButton";
import { router } from "expo-router";
import { ThemedText } from "@/components/ui/ThemedText";
import { Dropdown } from "react-native-element-dropdown";
import { ThemedView } from "@/components/ui/ThemedView";
import { useOnboardingStore } from "@/store/onboardingStore";
import { authService } from "@/service/auth.service";

type FormData = {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  gender: string;
  dob: Date | null;
};

export default function CompleteProfileScreen() {
  const {
    data: onboardingData,
    _hasHydrated,
    updateData,
    nextStep,
  } = useOnboardingStore();

  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- Username Suggestion States ---
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // --- Phone Checking States ---
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [isPhoneAvailable, setIsPhoneAvailable] = useState<boolean | null>(null);

  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormData>({
    defaultValues: {
      firstName: onboardingData.firstName || "",
      lastName: onboardingData.lastName || "",
      username: onboardingData.username || "",
      phone: onboardingData.phoneNumber || "",
      gender: onboardingData.gender || "",
      dob: onboardingData.dateOfBirth
        ? new Date(onboardingData.dateOfBirth)
        : null,
    },
  });

  const watchedFirstName = watch("firstName");
  const watchedLastName = watch("lastName");
  const watchedUsername = watch("username");
  const watchedPhone = watch("phone");
  const watchedGender = watch("gender");
  const watchedDob = watch("dob");

  // Check if every field is filled
  const isFormFilled = Boolean(
    watchedFirstName?.trim() &&
    watchedLastName?.trim() &&
    watchedUsername?.trim() &&
    watchedPhone?.trim() &&
    watchedGender?.trim() &&
    watchedDob
  );

  // Determine if the "Continue" button should be disabled
  const isButtonDisabled =
    !isFormFilled ||
    isUsernameAvailable === false ||
    isPhoneAvailable === false ||
    usernameChecking ||
    phoneChecking;

  // Populate default form values when store hydrator finishes loading
  useEffect(() => {
    if (_hasHydrated) {
      reset({
        firstName: onboardingData.firstName || "",
        lastName: onboardingData.lastName || "",
        username: onboardingData.username || "",
        phone: onboardingData.phoneNumber || "",
        gender: onboardingData.gender || "",
        dob: onboardingData.dateOfBirth
          ? new Date(onboardingData.dateOfBirth)
          : null,
      });
    }
  }, [_hasHydrated, onboardingData, reset]);

  // --- Debounced Username Verification Endpoint Check ---
  useEffect(() => {
    if (!watchedUsername || watchedUsername.trim().length < 3) {
      setIsUsernameAvailable(null);
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const data = await authService.checkUsername(watchedUsername.trim());
        setIsUsernameAvailable(data.available);
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.log("Failed checking username uniqueness:", err);
      } finally {
        setUsernameChecking(false);
      }
    }, 550);

    return () => clearTimeout(handler);
  }, [watchedUsername]);

  // --- Debounced Phone Verification Endpoint Check ---
  useEffect(() => {
    if (!watchedPhone || watchedPhone.trim().length < 7) {
      setIsPhoneAvailable(null);
      return;
    }

    const handler = setTimeout(async () => {
      setPhoneChecking(true);
      try {
        const data = await authService.checkPhone(watchedPhone.trim());
        setIsPhoneAvailable(data.available);
      } catch (err) {
        console.log("Failed checking phone uniqueness:", err);
      } finally {
        setPhoneChecking(false);
      }
    }, 550);

    return () => clearTimeout(handler);
  }, [watchedPhone]);

  const onSubmit = (data: FormData) => {
    // Safety guard: ensure all fields are filled & available before advancing
    if (!isFormFilled || isUsernameAvailable === false || isPhoneAvailable === false) {
      return;
    }

    updateData({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      username: data.username.toLowerCase().trim(),
      phoneNumber: data.phone.trim(),
      gender: data.gender,
      dateOfBirth: data.dob ? data.dob.toISOString() : "",
    });

    nextStep();
    router.push("/auth/academicInfoScreen");
  };

  if (!_hasHydrated) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary ?? "#0000ff"} />
        <ThemedText style={{ marginTop: 12 }}>
          Loading your profile data...
        </ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <AuthHeader
      showBackButton={false}
        title="Complete Your Profile"
        subtitle="Let's get to know you better."
      />
      <ThemedView style={{ paddingHorizontal: 24 }}>
        <AuthProgress currentStep={1} totalSteps={4} />
      </ThemedView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 40,
        }}
      >
        <View style={{ marginTop: 40 }}>
          <Controller
            control={control}
            name="firstName"
            render={({ field }) => (
              <AuthInput
                label="First Name"
                placeholder="First Name"
                icon="user"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field }) => (
              <AuthInput
                label="Last Name"
                placeholder="Last Name"
                icon="user"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />

          {/* Username with Availability Feedback & Suggestions */}
          <Controller
            control={control}
            name="username"
            render={({ field }) => (
              <View style={{ marginBottom: 0 }}>
                <AuthInput
                  label="Username"
                  icon="at-sign"
                  placeholder="Username"
                  value={field.value}
                  autoCapitalize="none"
                  onChangeText={(text) =>
                    field.onChange(text.toLowerCase().replace(/\s+/g, ""))
                  }
                />

                {/* Inline Validation Status Display */}
                {usernameChecking && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <ThemedText
                      style={{ fontSize: 12, color: colors.secondary }}
                    >
                      Checking availability...
                    </ThemedText>
                  </View>
                )}

                {!usernameChecking && isUsernameAvailable === true && (
                  <ThemedText
                    style={{ fontSize: 12, color: "#10b981", marginTop: 4, marginBottom: 10 }}
                  >
                    ✓ Username is available!
                  </ThemedText>
                )}

                {!usernameChecking && isUsernameAvailable === false && (
                  <View style={{ marginTop: 6 }}>
                    <ThemedText
                      style={{
                        fontSize: 12,
                        color: "#ef4444",
                        marginBottom: 8,
                      }}
                    >
                      ✗ Username is already taken
                    </ThemedText>

                    {/* Render Suggestions */}
                    {suggestions.length > 0 && (
                      <View>
                        <ThemedText
                          style={{
                            fontSize: 11,
                            color: colors.secondary,
                            marginBottom: 8,
                          }}
                        >
                          Suggested usernames (tap to select):
                        </ThemedText>
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                            marginBottom: 10,
                          }}
                        >
                          {suggestions.map((suggestion) => (
                            <TouchableOpacity
                              key={suggestion}
                              activeOpacity={0.7}
                              onPress={() => {
                                setValue("username", suggestion);
                                setIsUsernameAvailable(true);
                                setSuggestions([]);
                              }}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: colors.primary,
                                backgroundColor: colors.card,
                              }}
                            >
                              <ThemedText
                                style={{
                                  fontSize: 12,
                                  color: colors.primary,
                                  fontWeight: "600",
                                }}
                              >
                                {suggestion}
                              </ThemedText>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <View style={{ marginBottom: 0 }}>
                <AuthInput
                  label="Phone Number"
                  icon="phone"
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                />

                {phoneChecking && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                      marginBottom: 10,
                    }}
                  >
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <ThemedText
                      style={{ fontSize: 12, color: colors.secondary }}
                    >
                      Checking phone status...
                    </ThemedText>
                  </View>
                )}

                {!phoneChecking && isPhoneAvailable === true && (
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: "#10b981",
                      marginTop: 4,
                      marginBottom: 10,
                    }}
                  >
                    ✓ Phone number is available!
                  </ThemedText>
                )}

                {!phoneChecking && isPhoneAvailable === false && (
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: "#ef4444",
                      marginTop: 4,
                      marginBottom: 10,
                    }}
                  >
                    ✗ This phone number is already linked to an account
                  </ThemedText>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="gender"
            render={({ field: { value, onChange } }) => (
              <View style={{ marginBottom: 16 }}>
                <Dropdown
                  style={{
                    height: 55,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    backgroundColor: colors.card,
                  }}
                  placeholderStyle={{ color: colors.secondary }}
                  selectedTextStyle={{ color: colors.text }}
                  data={genderOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Select gender"
                  value={value}
                  onChange={(item) => onChange(item.value)}
                />
              </View>
            )}
          />

          {/* Date of Birth Picker */}
          <Controller
            control={control}
            name="dob"
            render={({ field: { value, onChange } }) => (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View pointerEvents="none">
                    <AuthInput
                      label="Date of Birth"
                      icon="calendar"
                      value={value ? format(value, "dd MMM yyyy") : ""}
                      placeholder="Select your date of birth"
                      editable={false}
                      onChangeText={onChange}
                    />
                  </View>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={value ?? new Date(2005, 6, 10)}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === "android") {
                        setShowDatePicker(false);
                      }

                      if (selectedDate) {
                        onChange(selectedDate);
                      }
                    }}
                  />
                )}
              </>
            )}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
        <PrimaryButton
          title="Continue"
          disabled={isButtonDisabled}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaView>
  );
}