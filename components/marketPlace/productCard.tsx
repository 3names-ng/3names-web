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
  title: string;
  price: string;
  image: string;
  seller: string;
  sellerAvatar: string;
  location: string;
  featured?: boolean;
  onPress?: () => void;
    appLevel: {
    name: string;
    icon: string;
  };
}

export default function ProductCard({
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
        width: 280,
        marginLeft: 20,
      }}
    >
      <ThemedView
        style={{
          backgroundColor: colors.card,
          borderRadius: 24,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,

          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: {
            width: 0,
            height: 6,
          },

          elevation: 4,
        }}
      >
        {/* Product Image */}

        <View>
          <Image
            source={{ uri: image }}
            style={{
              width: "100%",
              height: 180,
            }}
            resizeMode="cover"
          />

          {/* Favourite */}

          <TouchableOpacity
            style={{
              position: "absolute",
              right: 14,
              top: 14,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#FFFFFF",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="heart-outline"
              size={20}
              color="#444"
            />
          </TouchableOpacity>

          {/* Price */}

          <View
            style={{
              position: "absolute",
              left: 14,
              bottom: 14,
              backgroundColor: "#7C3AED",
              paddingHorizontal: 14,
              height: 34,
              borderRadius: 17,
              justifyContent: "center",
            }}
          >
            <ThemedText
              style={{
                color: "#fff",
                fontWeight: "800",
                fontSize: 15,
              }}
            >
              {price}
            </ThemedText>
          </View>
        </View>

        {/* Content */}

        <View
          style={{
            padding: 16,
          }}
        >
          <ThemedText
            numberOfLines={2}
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {title}
          </ThemedText>

          {/* Seller */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <Image
              source={{
                uri: sellerAvatar,
              }}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
              }}
            />

            <View
              style={{
                flex: 1,
                marginLeft: 12,
              }}
            >
              <ThemedText
                style={{
                  fontWeight: "700",
                  color: colors.text,
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
                        </ThemedText>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 3,
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={14}
                  color="#9CA3AF"
                />

                <ThemedText
                  style={{
                    marginLeft: 4,
                    color: "#9CA3AF",
                    fontSize: 13,
                  }}
                >
                  {location}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Buttons */}

        
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}