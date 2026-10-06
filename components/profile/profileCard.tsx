import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import {
  BadgeCheck,
  ChevronRight,
} from "lucide-react-native";

interface Props {
  onPress?: () => void;
}

export default function ProfileCard({
  onPress,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {/* Avatar */}

      <LinearGradient
        colors={[
          "#FE2C55",
          "#A855F7",
          "#3B82F6",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatarRing}
      >
        <Image
          source={{
            uri: "https://i.pravatar.cc/300?img=12",
          }}
          style={styles.avatar}
        />

        <View style={styles.onlineDot} />
      </LinearGradient>

      {/* Info */}

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            Daniel Okafor
          </Text>

          <BadgeCheck
            size={20}
            color="#3EA6FF"
            fill="#3EA6FF"
          />
        </View>

        <Text style={styles.username}>
          @daniel.dev
        </Text>

        <Text style={styles.subtitle}>
          View your profile
        </Text>
      </View>

      {/* Arrow */}

      <ChevronRight
        size={24}
        color="#8A8A94"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 26,

    backgroundColor: "#17171F",

    borderRadius: 24,

    padding: 18,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#24242D",
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },

  avatarRing: {
    width: 78,
    height: 78,
    borderRadius: 39,

    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,

    borderWidth: 3,
    borderColor: "#17171F",
  },

  onlineDot: {
    position: "absolute",

    right: 4,
    bottom: 4,

    width: 18,
    height: 18,

    borderRadius: 9,

    backgroundColor: "#22C55E",

    borderWidth: 2,
    borderColor: "#17171F",
  },

  content: {
    flex: 1,
    marginLeft: 18,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 30,
    marginRight: 8,
  },

  username: {
    color: "#8A8A94",
    fontSize: 18,
    marginTop: 3,
  },

  subtitle: {
    color: "#BDBDC7",
    fontSize: 16,
    marginTop: 12,
  },
});