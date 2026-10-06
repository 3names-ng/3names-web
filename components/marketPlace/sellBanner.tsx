import React from "react";
import { View, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { ThemedText } from "../ui/ThemedText";

export default function SellBanner() {
  return (
    <LinearGradient
      colors={["#7C3AED", "#6D28D9", "#5B21B6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        marginHorizontal: 20,
        marginTop: 22,
        borderRadius: 28,
        overflow: "hidden",
        padding: 20,
      }}
    >
      {/* Decorative circles */}

      <View
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "rgba(255,255,255,0.05)",
          top: -80,
          right: -70,
        }}
      />

      <View
        style={{
          position: "absolute",
          width: 170,
          height: 170,
          borderRadius: 85,
          backgroundColor: "rgba(255,255,255,0.04)",
          bottom: -70,
          left: -50,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
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
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="pricetag"
              size={20}
              color="#FACC15"
            />

            <ThemedText
              style={{
                color: "#FFFFFF",
                fontSize: 22,
                fontWeight: "800",
                marginLeft: 8,
              }}
            >
              Sell Faster
            </ThemedText>
          </View>

          <ThemedText
            style={{
              color: "#E9D5FF",
              marginTop: 10,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            Sell your used textbooks,
            gadgets, furniture and more
            to students around campus.
          </ThemedText>

          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              marginTop: 18,
              alignSelf: "flex-start",
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              paddingHorizontal: 18,
              height: 42,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="add-circle"
              size={18}
              color="#6D28D9"
            />

            <ThemedText
              style={{
                color: "#6D28D9",
                fontWeight: "700",
                marginLeft: 8,
              }}
            >
              Sell an Item
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Right Illustration */}

        <View
          style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: "rgba(255,255,255,0.12)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name="shopping-outline"
            size={58}
            color="#FACC15"
          />

          <Ionicons
            name="cash-outline"
            size={20}
            color="#FFFFFF"
            style={{
              position: "absolute",
              bottom: 18,
              right: 18,
            }}
          />
        </View>
      </View>
    </LinearGradient>
  );
}