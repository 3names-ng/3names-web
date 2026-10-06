import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import Input from "@/components/hostel/input";
import PrimaryButton from "@/components/hostel/primaryButton";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";

import { useHostelStore } from "@/store/hostelStore";
import AuthHeader from "@/components/auth/authHeader";
import AuthProgress from "@/components/auth/authProgress";
import { useTheme } from "@/hooks/useTheme";

const roomTypes = [
  "Single Room",
  "Self Contain",
  "One Bedroom",
  "Two Bedroom",
  "Apartment",
] as const;

const genders = [
  {
    label: "Male",
    value: "male",
  },
  {
    label: "Female",
    value: "female",
  },
  {
    label: "Mixed",
    value: "mixed",
  },
] as const;

const availability = [
  {
    label: "Available Now",
    value: "available",
  },
  {
    label: "Next Month",
    value: "limited",
  },
  {
    label: "Coming Soon",
    value: "full",
  },
] as const;

export default function RoomDetailsScreen() {
  const { hostel, updateField } = useHostelStore();
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <View>
        <AuthHeader
          title="Room Details"
          subtitle="Tell students what rooms are available."
        />
      </View>

      <ThemedView style={{ paddingHorizontal: 24 }}>
        <AuthProgress currentStep={3} totalSteps={6} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 80,
        }}
      >
        {/* <SectionTitle
          title="Room Details"
          subtitle="Tell students what rooms are available."
        /> */}

        {/* Room Type */}

        <ThemedText className="font-semibold text-lg mb-3">
          Room Type
        </ThemedText>

        <ThemedView className="flex-row flex-wrap justify-between bg-transparent mb-6">
          {roomTypes.map((type) => {
            const selected = hostel.roomType === type;

            return (
              <Pressable
                key={type}
                onPress={() => updateField("roomType", type)}
                className="w-[48%] rounded-2xl p-5 mb-4"
                style={{
                  backgroundColor: selected ? "#7C3AED" : "#F8FAFC",
                }}
              >
                <ThemedText
                  style={{
                    color: selected ? "#FFF" : "#111827",
                  }}
                  className="font-bold"
                >
                  {type}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        {/* Gender */}

        <ThemedText className="font-semibold text-lg mb-3">Gender</ThemedText>

        <ThemedView className="flex-row justify-between bg-transparent mb-6">
          {genders.map((gender) => {
            const active = hostel.gender === gender.value;

            return (
              <Pressable
                key={gender.value}
                onPress={() => updateField("gender", gender.value)}
                className="flex-1 rounded-2xl py-4 mx-1 items-center"
                style={{
                  backgroundColor: active ? "#7C3AED" : "#F8FAFC",
                }}
              >
                <ThemedText
                  style={{
                    color: active ? "#FFF" : "#111827",
                  }}
                  className="font-semibold"
                >
                  {gender.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        <Input
          label="Maximum Occupants"
          keyboardType="numeric"
          placeholder="4"
          value={hostel.capacity?.toString() ?? ""}
          onChangeText={(v: string) => updateField("capacity", Number(v))}
        />

        <Input
          label="Total Rooms"
          keyboardType="numeric"
          placeholder="20"
          value={hostel.totalRooms?.toString() ?? ""}
          onChangeText={(v: string) => updateField("totalRooms", Number(v))}
        />

        <Input
          label="Available Rooms"
          keyboardType="numeric"
          placeholder="6"
          value={hostel.availableRooms?.toString() ?? ""}
          onChangeText={(v: string) => updateField("availableRooms", Number(v))}
        />

        {/* Availability */}

        <ThemedText className="font-semibold text-lg mb-3">
          Availability
        </ThemedText>

        <ThemedView className="bg-transparent flex-row flex-wrap mb-8">
          {availability.map((item) => {
            const active = hostel.availability === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => updateField("availability", item.value)}
                className="rounded-full px-5 py-3 mr-3 mb-3"
                style={{
                  backgroundColor: active ? "#7C3AED" : "#EEF2FF",
                }}
              >
                <ThemedText
                  style={{
                    color: active ? "#FFF" : "#4338CA",
                  }}
                >
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        {/* Roommate */}

        <Pressable
          onPress={() =>
            updateField("lookingForRoommate", !hostel.lookingForRoommate)
          }
          className={`flex-row items-center justify-between rounded-2xl p-5 mb-6 border transition-all ${
            hostel.lookingForRoommate
              ? "bg-violet-600/10 border-violet-500/50"
              : "bg-zinc-900/60 border-zinc-800"
          }`}
        >
          <View className="flex-1 mr-4">
            <ThemedText className="text-base font-semibold text-white">
              Looking for a roommate?
            </ThemedText>

            <ThemedText className="text-xs text-zinc-400 mt-1">
              {hostel.lookingForRoommate
                ? "Your listing will show that you're seeking a roommate"
                : "You are listing this space for yourself only"}
            </ThemedText>
          </View>

          {/* Custom Toggle Switch */}
          <View
            className={`w-12 h-7 rounded-full justify-center px-0.5 ${
              hostel.lookingForRoommate ? "bg-violet-600" : "bg-zinc-700"
            }`}
          >
            <View
              className={`w-6 h-6 rounded-full bg-white shadow-md transform ${
                hostel.lookingForRoommate ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </View>
        </Pressable>
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <PrimaryButton
          title="Next"
          onPress={() => router.push("/(features)/hostel/add/amentities")}
        />
      </View>
    </SafeAreaView>
  );
}