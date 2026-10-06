import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, ScrollView, View, StyleSheet, ActivityIndicator } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import AuthProgress from "@/components/auth/authProgress";
import AuthInput from "@/components/auth/authInput";
import PrimaryButton from "@/components/auth/primaryButton";
import AuthHeader from "@/components/auth/authHeader";
import { schoolService } from "@/service/sch.service";
import { showError } from "@/components/ui/toast";
import { useOnboardingStore } from "@/store/onboardingStore";
import AuthDivider from "@/components/auth/authDivider";

type FormData = {
  programType: string;
  university: string;
  facultyId: string;
  departmentId: string;
  level: string;
  matricNumber: string;
  jambNumber: string;
};

const PROGRAM_OPTIONS = [
  { label: "Undergraduate", value: "undergraduate" },
  { label: "Postgraduate", value: "postgraduate" },
];

export default function AcademicInfoScreen() {
  const { colors } = useTheme();

  // States for dropdown lists
  const [schools, setSchools] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departmentIds, setdepartmentIds] = useState<any[]>([]);

  // Loading states
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingdepartmentIds, setLoadingdepartmentIds] = useState(false);

  const {
    data: onboardingData,
    _hasHydrated,
    updateData,
    nextStep,
  } = useOnboardingStore();

  const { control, handleSubmit, setValue, reset, watch } = useForm<FormData>({
    defaultValues: {
      programType: onboardingData.programType || "",
      university: onboardingData.schoolId || "",
      facultyId: onboardingData.facultyId || "",
      departmentId: onboardingData.departmentId || "",
      level: "",
      matricNumber: onboardingData.matricNumber || "",
      jambNumber: onboardingData.jambNumber || "",
    },
  });

  // Real-time watched fields for button state calculation
  const watchedProgramType = watch("programType");
  const watchedUniversity = watch("university");
  const watchedFacultyId = watch("facultyId");
  const watchedDepartmentId = watch("departmentId");
  const watchedMatricNumber = watch("matricNumber");
  const watchedJambNumber = watch("jambNumber");

  // Check dropdown requirements
  const areDropdownsValid = Boolean(
    watchedProgramType?.trim() &&
      watchedUniversity?.trim() &&
      watchedFacultyId?.trim() &&
      watchedDepartmentId?.trim()
  );

  // Check that at least one identifier is provided
  const hasIdentifier = Boolean(
    watchedMatricNumber?.trim() || watchedJambNumber?.trim()
  );

  // Is any async call running?
  const isAsyncLoading =
    loadingSchools || loadingFaculties || loadingdepartmentIds;

  // Final button disable condition
  const isButtonDisabled = !areDropdownsValid || !hasIdentifier || isAsyncLoading;

  // 1. Initial Load: Fetch all schools and restore chained lists if editing/navigating back
  useEffect(() => {
    const initializeDropdownsAndData = async () => {
      try {
        setLoadingSchools(true);
        const fetchedSchools = await schoolService.getSchools();
        setSchools(fetchedSchools);

        // If the user went back and we already have a saved schoolId, pull its faculties
        if (onboardingData.schoolId) {
          setLoadingFaculties(true);
          const fetchedFaculties = await schoolService.getFaculties(
            onboardingData.schoolId
          );
          setFaculties(fetchedFaculties);

          // If we also have a saved facultyId, pull its departments
          if (onboardingData.facultyId) {
            setLoadingdepartmentIds(true);
            const fetchedDepartments = await schoolService.getDepartments(
              onboardingData.facultyId
            );
            setdepartmentIds(fetchedDepartments);
          }
        }
      } catch (error) {
        console.error(error);
        showError("Unable to load academic setup data");
      } finally {
        setLoadingSchools(false);
        setLoadingFaculties(false);
        setLoadingdepartmentIds(false);
      }
    };

    if (_hasHydrated) {
      initializeDropdownsAndData();
    }
  }, [_hasHydrated]);

  // 2. Hydration synchronizer: Make sure react-hook-form grabs storage data when ready
  useEffect(() => {
    if (_hasHydrated) {
      reset({
        programType: onboardingData.programType || "",
        university: onboardingData.schoolId || "",
        facultyId: onboardingData.facultyId || "",
        departmentId: onboardingData.departmentId || "",
        level: "",
        matricNumber: onboardingData.matricNumber || "",
        jambNumber: onboardingData.jambNumber || "",
      });
    }
  }, [_hasHydrated, onboardingData, reset]);

  const onSubmit = (data: FormData) => {
    if (!data.programType) {
      showError("Please select your program type.");
      return;
    }

    if (!data.university || !data.facultyId || !data.departmentId) {
      showError("Please select your University, Faculty, and Department.");
      return;
    }

    if (!data.matricNumber?.trim() && !data.jambNumber?.trim()) {
      showError(
        "Please enter either your Matric Number or JAMB Registration Number."
      );
      return;
    }

    updateData({
      programType: data.programType,
      schoolId: data.university,
      facultyId: data.facultyId,
      departmentId: data.departmentId,
      matricNumber: data.matricNumber.trim(),
      jambNumber: data.jambNumber.trim(),
    });

    nextStep();

    router.push("/auth/uploadProfilePictureScreen");
  };

  // Guard Clause: Wait until storage finishes hydrating
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
          Loading academic data...
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
      <View>
        <AuthHeader
          title="Academic Information"
          subtitle="Complete your student details"
        />
      </View>

      <ThemedView style={{ paddingHorizontal: 24 }}>
        <AuthProgress currentStep={2} totalSteps={4} />
      </ThemedView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 40,
        }}
      >
        <View className="mt-10 gap-y-4">
          {/* Program Type Dropdown */}
          <Controller
            control={control}
            name="programType"
            render={({ field: { onChange, value } }) => (
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
                data={PROGRAM_OPTIONS}
                labelField="label"
                valueField="value"
                placeholder="Select Program"
                value={value}
                onChange={(item) => {
                  onChange(item.value);
                  updateData({ programType: item.value });
                }}
              />
            )}
          />

          {/* University Dropdown */}
          <Controller
            control={control}
            name="university"
            render={({ field: { onChange, value } }) => (
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
                data={schools.map((school) => ({
                  label: school.name,
                  value: school.id,
                }))}
                labelField="label"
                valueField="value"
                search
                searchPlaceholder="Search schools..."
                searchPlaceholderTextColor={colors.muted}
                placeholder={
                  loadingSchools
                    ? "Loading schools..."
                    : "Select University"
                }
                value={value}
                onChange={async (item) => {
                  onChange(item.value);

                  updateData({
                    schoolId: item.value,
                  });

                  // Reset child fields in react-hook-form state
                  setValue("facultyId", "");
                  setValue("departmentId", "");
                  setFaculties([]);
                  setdepartmentIds([]);

                  try {
                    setLoadingFaculties(true);
                    const response = await schoolService.getFaculties(
                      item.value
                    );
                    
                    setFaculties(response);
                  } catch (error) {
                    showError("Unable to load faculties");
                  } finally {
                    setLoadingFaculties(false);
                  }
                }}
              />
            )}
          />

          {/* Faculty Dropdown */}
          <Controller
            control={control}
            name="facultyId"
            render={({ field: { onChange, value } }) => (
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
                data={faculties.map((fac) => ({
                  label: fac.name,
                  value: fac.id,
                }))}
                labelField="label"
                valueField="value"
                search
                searchPlaceholder="Search faculties..."
                searchPlaceholderTextColor={colors.muted}
                placeholder={
                  loadingFaculties
                    ? "Loading faculties..."
                    : "Select Faculty"
                }
                value={value}
                disable={faculties.length === 0}
                onChange={async (item) => {
                  onChange(item.value);

                  updateData({
                    facultyId: item.value,
                  });

                  // Reset grandchild field in react-hook-form state
                  setValue("departmentId", "");
                  setdepartmentIds([]);

                  try {
                    setLoadingdepartmentIds(true);
                    const response = await schoolService.getDepartments(
                      item.value
                    );
                 
                    setdepartmentIds(response);
                  } catch (error) {
                    showError("Unable to load departments");
                  } finally {
                    setLoadingdepartmentIds(false);
                  }
                }}
              />
            )}
          />

          {/* Department Dropdown */}
          <Controller
            control={control}
            name="departmentId"
            render={({ field: { onChange, value } }) => (
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
                data={departmentIds.map((dept) => ({
                  label: dept.name,
                  value: dept.id,
                }))}
                labelField="label"
                valueField="value"
                search
                searchPlaceholder="Search departments..."
                searchPlaceholderTextColor={colors.muted}
                placeholder={
                  loadingdepartmentIds
                    ? "Loading departments..."
                    : "Select Department"
                }
                value={value}
                disable={departmentIds.length === 0}
                onChange={(item) => {
                  onChange(item.value);

                  updateData({
                    departmentId: item.value,
                  });
                }}
              />
            )}
          />

          {/* Matric Number Input */}
          <Controller
            control={control}
            name="matricNumber"
            render={({ field }) => (
              <AuthInput
                label="Matric Number"
                icon="hash"
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Matric Number"
              />
            )}
          />

           <AuthDivider />

          {/* JAMB Reg. Number Input */}
          <Controller
            control={control}
            name="jambNumber"
            render={({ field }) => (
              <AuthInput
                label="JAMB Reg. Number"
                icon="hash"
                value={field.value}
                onChangeText={field.onChange}
                placeholder="JAMB Registration Number"
              />
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

const styles = StyleSheet.create({
  dropdown: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
});