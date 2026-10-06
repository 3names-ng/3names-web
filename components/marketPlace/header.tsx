import React from "react";
import { View, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { ThemedText } from "../ui/ThemedText";

export default function Header() {
  return (
    <LinearGradient
      colors={["#7C3AED", "#5B21B6", "#4C1D95"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        height: 220,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: "hidden",
        paddingHorizontal: 20,
        paddingTop: 20,
      }}
    >
      {/* Decorative Background */}

      <View
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: "rgba(255,255,255,0.05)",
          right: -80,
          top: -70,
        }}
      />

      <View
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: "rgba(255,255,255,0.04)",
          left: -60,
          bottom: -60,
        }}
      />

      {/* Top Row */}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Logo */}

        <View>
          <ThemedText
            style={{
              color: "#fff",
              fontSize: 32,
              fontWeight: "900",
            }}
          >
            3NAMES
          </ThemedText>

          <ThemedText
            style={{
              color: "#E9D5FF",
              marginTop: 6,
              fontSize: 17,
            }}
          >
            Student Marketplace
          </ThemedText>
        </View>

        {/* Right Icons */}

        <View
          style={{
            flexDirection: "row",
          }}
        >
          <TouchableOpacity
            style={{
              marginLeft: 18,
            }}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              color="#fff"
              size={28}
            />

            <View
              style={{
                position: "absolute",
                right: -4,
                top: -5,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#EF4444",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: "800",
                }}
              >
                3
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              marginLeft: 20,
            }}
          >
            <Ionicons
              name="notifications-outline"
              color="#fff"
              size={28}
            />

            <View
              style={{
                position: "absolute",
                right: -4,
                top: -5,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#EF4444",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{
                  color: "#fff",
                  fontWeight: "800",
                  fontSize: 11,
                }}
              >
                8
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero */}

      <View
        style={{
          marginTop: 26,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Text */}

        <View style={{ flex: 1 }}>
          <ThemedText
            style={{
              color: "#fff",
              fontWeight: "900",
              fontSize: 34,
            }}
          >
            Buy & Sell
          </ThemedText>

          <ThemedText
            style={{
              color: "#E9D5FF",
              marginTop: 8,
              fontSize: 17,
              lineHeight: 25,
            }}
          >
            Find affordable used items
          </ThemedText>

          <ThemedText
            style={{
              color: "#E9D5FF",
              fontSize: 17,
            }}
          >
            from students around campus.
          </ThemedText>
        </View>

        {/* Shopping Illustration */}

        <View
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: "rgba(255,255,255,0.12)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name="shopping"
            size={52}
            color="#FFD54F"
          />
        </View>
      </View>
    </LinearGradient>
  );
}