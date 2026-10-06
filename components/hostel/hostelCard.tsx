import React from "react";
import {
  Image,
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";

import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  name: string;
  image: string;
  location: string;
  price: number;
  rating: number;
  rooms: number;
  
  onPress?: () => void;
  beds?: number;
}

export default function FeaturedHostel({
  name,
  image,
  location,
  price,
  rating,
  rooms,
    beds,
  onPress,
}: Props) {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        marginHorizontal: 20,
        marginBottom: 25,
      }}
    >
  <ThemedView
  style={{
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: isDark ? 0 : 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  }}
>
  {/* LEFT IMAGE */}

  <View
    style={{
      width: 145,
      height: 170,
    }}
  >
    <Image
      source={{ uri: image }}
      style={{
        width: "100%",
        height: "100%",
      }}
      resizeMode="cover"
    />

  </View>

  {/* RIGHT CONTENT */}

  <View
    style={{
      flex: 1,
      padding: 18,
      justifyContent: "space-between",
    }}
  >
    <View>
      <ThemedText
        style={{
          fontSize: 21,
          fontWeight: "800",
          color: colors.text,
        }}
      >
        {name}
      </ThemedText>

      {/* Location */}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <Ionicons
          name="location"
          size={15}
          color="#7C3AED"
        />

        <ThemedText
          style={{
            marginLeft: 5,
            color: colors.secondary,
            fontSize: 14,
          }}
        >
          {location}
        </ThemedText>
      </View>

      {/* Rating */}
{/* 
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <Ionicons
          name="star"
          color="#FBBF24"
          size={18}
        />

        <ThemedText
          style={{
            marginLeft: 6,
            fontWeight: "700",
            color: colors.text,
          }}
        >
          {rating}
        </ThemedText>
      </View> */}

      {/* Rooms */}

      <View
        style={{
          flexDirection: "row",
          marginTop: 6,
          alignItems: "center",
        }}
      >
        <Feather
          name="home"
          size={17}
          color="#7C3AED"
        />

        <ThemedText
          style={{
            marginLeft: 6,
            color: colors.text,
          }}
        >
          {rooms} Rooms
        </ThemedText>
      </View>

      {/* Beds */}

      {/* <View
        style={{
          flexDirection: "row",
          marginTop: 10,
          alignItems: "center",
        }}
      >
        <Ionicons
          name="bed-outline"
          size={18}
          color="#7C3AED"
        />

        <ThemedText
          style={{
            marginLeft: 6,
            color: colors.text,
          }}
        >
          {beds} Beds
        </ThemedText>
      </View> */}
    </View>

    {/* Bottom */}

    <View>
      <ThemedText
        style={{
          fontSize: 20,
          fontWeight: "900",
          color: "#7C3AED",
          marginBottom: 6,
        }}
      >
        ₦{price.toLocaleString()}
      </ThemedText>

    </View>
  </View>
</ThemedView>
    </TouchableOpacity>
  );
}