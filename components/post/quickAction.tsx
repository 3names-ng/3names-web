import React from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  onPhoto?: () => void;
  onVideo?: () => void;
  onLocation?: () => void;
  onFeeling?: () => void;
  onTagPeople?: () => void;
}

export default function QuickActions({
  onPhoto,
  onVideo,
  onLocation,
  onFeeling,
  onTagPeople,
}: Props) {
  const { isDark, colors } = useTheme();

  const actions = [
    {
      id: "photo",
      title: "Photo",
      icon: (
        <Ionicons
          name="image"
          size={22}
          color="#2563EB"
        />
      ),
      onPress: onPhoto,
    },
    {
      id: "video",
      title: "Video",
      icon: (
        <Ionicons
          name="videocam"
          size={22}
          color="#EF4444"
        />
      ),
      onPress: onVideo,
    },
    {
      id: "location",
      title: "Location",
      icon: (
        <Ionicons
          name="location"
          size={22}
          color="#10B981"
        />
      ),
      onPress: onLocation,
    },
    // {
    //   id: "feeling",
    //   title: "Feeling",
    //   icon: (
    //     <Ionicons
    //       name="happy"
    //       size={22}
    //       color="#F59E0B"
    //     />
    //   ),
    //   onPress: onFeeling,
    // },
    // {
    //   id: "tag",
    //   title: "Tag",
    //   icon: (
    //     <MaterialCommunityIcons
    //       name="account-plus"
    //       size={22}
    //       color="#7C3AED"
    //     />
    //   ),
    //   onPress: onTagPeople,
    // },
  ];

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>
        Quick Actions
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingRight: 20,
        }}
      >
        {actions.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={item.onPress}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F5F5F5" }]}>
              {item.icon}
            </View>

            <ThemedText style={styles.label}>
              {item.title}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Divider */}

      <View
        style={[
          styles.divider,
          {
            backgroundColor: colors.border,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 20,
    marginBottom: 14,
  },

  card: {
    width: "55%",
    height: 95,

    marginLeft: 20,

    borderRadius: 18,
    borderWidth: 1,

    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  label: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    marginTop: 24,
    marginHorizontal: 20,
  },
});