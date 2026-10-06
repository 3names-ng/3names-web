import React from "react";
import {
  Image,
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  title: string;
  price: string;
  image: string;
  seller: string;
  sellerAvatar: string;
  location: string;
  onPress?: () => void;
    appLevel: {
    name: string;
    icon: string;
  };
}

export default function SmallProductCard({
  title,
  price,
  image,
  seller,
  sellerAvatar,
  location,
  appLevel,
  onPress,
}: Props) {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        width: "48%",
      }}
    >
      <ThemedView
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,

          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: {
            width: 0,
            height: 4,
          },

          elevation: 3,
        }}
      >
        {/* Product Image */}

        <View>
          <Image
            source={{ uri: image }}
            style={{
              width: "100%",
              height: 140,
            }}
          />

          <TouchableOpacity
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#FFFFFF",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="heart-outline"
              size={18}
              color="#555"
            />
          </TouchableOpacity>

          <View
            style={{
              position: "absolute",
              left: 10,
              bottom: 10,
              backgroundColor: "#7C3AED",
              paddingHorizontal: 10,
              height: 28,
              borderRadius: 14,
              justifyContent: "center",
            }}
          >
            <ThemedText
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              {price}
            </ThemedText>
          </View>
        </View>

        {/* Content */}

        <View
          style={{
            padding: 12,
          }}
        >
          <ThemedText
            numberOfLines={2}
            style={{
              fontWeight: "700",
              fontSize: 15,
              color: colors.text,
              minHeight: 40,
            }}
          >
            {title}
          </ThemedText>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <Image
              source={{ uri: sellerAvatar }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
              }}
            />
<View className="flex">
            <ThemedText
              numberOfLines={1}
              style={{
                marginLeft: 8,
                flex: 1,
                color: colors.text,
                fontSize: 13,
              }}
            >
              {seller}
            </ThemedText>
                        <ThemedText
                        style={{
                          marginTop: 4,
                          color: "#8B5CF6",
                          fontWeight: "600",
                        }}
                      >
                        {appLevel.icon} {appLevel.name}
                      </ThemedText></View>
          </View>

          

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <Ionicons
              name="location-outline"
              size={14}
              color={isDark ? "#A1A1AA" : "#9CA3AF"}
            />
  

            <ThemedText
              numberOfLines={1}
              style={{
                marginLeft: 4,
                fontSize: 12,
                color: "#9CA3AF",
              }}
            >
              {location}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}