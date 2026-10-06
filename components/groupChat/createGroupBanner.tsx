import React from "react";
import {
  Image,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";

interface Props {
  onPress?: () => void;
}

export default function CreateGroupBanner({
  onPress,
}: Props) {
  return (
    <LinearGradient
      colors={["#7C3AED", "#6D28D9", "#5B21B6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        marginHorizontal: 20,
        marginBottom: 22,
        borderRadius: 26,
        overflow: "hidden",
      }}
    >
      {/* Decorative Circle */}

      <View
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />

      <View
        style={{
          position: "absolute",
          bottom: -70,
          left: -60,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 22,
        }}
      >
        {/* Left */}

        <View
          style={{
            flex: 1,
            paddingRight: 16,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "rgba(255,255,255,0.15)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="people"
              size={28}
              color="#FFFFFF"
            />
          </View>

          <ThemedText
            style={{
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: "800",
              marginTop: 18,
            }}
          >
            Create Your Group
          </ThemedText>

          <ThemedText
            style={{
              color: "#E9D5FF",
              marginTop: 10,
              lineHeight: 22,
              fontSize: 15,
            }}
          >
            Start a study group, hostel community,
            departmentIdal chat or marketplace community
            and invite your classmates.
          </ThemedText>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={{
              marginTop: 22,
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 18,
              height: 46,
              borderRadius: 23,
            }}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color="#7C3AED"
            />

            <ThemedText
              style={{
                marginLeft: 8,
                color: "#7C3AED",
                fontWeight: "800",
                fontSize: 15,
              }}
            >
              Create Group
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Right Illustration */}

        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/681/681494.png",
          }}
          resizeMode="contain"
          style={{
            width: 120,
            height: 120,
          }}
        />
      </View>
    </LinearGradient>
  );
}