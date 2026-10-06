import React from "react";
import {
  FlatList,
  Image,
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { Group } from "@/data/groups";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "../ui/ThemedText";

interface Props {
  groups: Group[];
  onPress?: (group: Group) => void;
}

export default function ActiveGroups({
  groups,
  onPress,
}: Props) {
  const { colors, isDark } = useTheme();

  const activeGroups = groups
    .filter((group) => group.online > 0)
    .sort((a, b) => b.online - a.online);

  return (
    <View
      style={{
        marginBottom: 24,
      }}
    >
      {/* Header */}

      <View
        style={{
          paddingHorizontal: 20,
          marginBottom: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="flame"
            size={22}
            color="#F97316"
          />

          <ThemedText
            style={{
              marginLeft: 8,
              fontSize: 22,
              fontWeight: "800",
              color: colors.text,
            }}
          >
            Trending Groups
          </ThemedText>
        </View>

        <TouchableOpacity>
          <ThemedText
            style={{
              color: "#7C3AED",
              fontWeight: "700",
            }}
          >
            View All
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Horizontal List */}

      <FlatList
        horizontal
        data={activeGroups}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPress?.(item)}
            style={{
              width: 250,
              marginRight: 16,
              borderRadius: 22,
              overflow: "hidden",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,

              shadowColor: "#000",
              shadowOpacity: isDark ? 0 : 0.06,
              shadowRadius: 8,
              shadowOffset: {
                width: 0,
                height: 4,
              },
              elevation: 3,
            }}
          >
            {/* Cover */}

            <Image
              source={{
                uri: item.cover,
              }}
              style={{
                width: "100%",
                height: 120,
              }}
            />

            {/* Content */}

            <View
              style={{
                padding: 16,
              }}
            >
              {/* Name */}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <ThemedText
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                >
                  {item.name}
                </ThemedText>

                {item.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#3B82F6"
                  />
                )}
              </View>

              {/* Description */}

              <ThemedText
                numberOfLines={2}
                style={{
                  marginTop: 6,
                  color: colors.secondary,
                  lineHeight: 20,
                }}
              >
                {item.description}
              </ThemedText>

              {/* Online */}

              <View
                style={{
                  marginTop: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#22C55E",
                  }}
                />

                <ThemedText
                  style={{
                    marginLeft: 8,
                    fontWeight: "700",
                  }}
                >
                  {item.online} Online
                </ThemedText>
              </View>

              {/* Members */}

              <View
                style={{
                  marginTop: 10,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="people"
                  size={18}
                  color="#7C3AED"
                />

                <ThemedText
                  style={{
                    marginLeft: 6,
                    color: colors.secondary,
                  }}
                >
                  {item.members.toLocaleString()} Members
                </ThemedText>
              </View>

              {/* Join */}

              <TouchableOpacity
                activeOpacity={0.85}
                style={{
                  marginTop: 18,
                  height: 44,
                  borderRadius: 14,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: item.joined
                    ? "#E9D5FF"
                    : "#7C3AED",
                }}
              >
                <ThemedText
                  style={{
                    color: item.joined
                      ? "#7C3AED"
                      : "#FFFFFF",
                    fontWeight: "800",
                  }}
                >
                  {item.joined
                    ? "Joined"
                    : "Join Group"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}