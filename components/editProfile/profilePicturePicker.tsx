import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TouchableOpacity,
} from "react-native";

import { Camera } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { ThemedView } from "../ui/ThemedView";
import { ThemedText } from "../ui/ThemedText";

interface Props {
  image: string;
  onPress: () => void;
}

export default function ProfilePicturePicker({ image, onPress }: Props) {
     const { colors } = useTheme();
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Profile Picture</ThemedText>

      <ThemedView style={{borderColor:colors.border, borderWidth:1, borderRadius: 22,
    
    paddingVertical: 28,}}>
        <ThemedView style={styles.content}>
          <TouchableOpacity onPress={onPress}>
            <LinearGradient
              colors={["#FE2C55", "#A855F7", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <Image source={{ uri: image }} style={styles.avatar} />

              {/* <Pressable
              style={
                styles.cameraButton
                }
              onPress={onPress}
            >
              <Camera
                color="#FFF"
                size={18}
              />
            </Pressable> */}
            </LinearGradient>
          </TouchableOpacity>
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              styles.changeButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <ThemedText style={styles.changeText}>Change Photo</ThemedText>
          </Pressable>

          <ThemedText style={styles.helper}>JPG, PNG or WEBP • Max 5MB</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const AVATAR_SIZE = 150;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginBottom: 24,
  },

  title: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  card: {
    // backgroundColor: "#141418",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#26262D",
    paddingVertical: 28,
  },

  content: {
    alignItems: "center",
  },

  avatarRing: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: "#09090B",
  },

  cameraButton: {
    position: "absolute",
    right: 14,
    bottom: 8,

    width: 42,
    height: 42,
    borderRadius: 21,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#2D2D36",

    borderWidth: 2,
    borderColor: "#FFF",

    elevation: 5,
  },

  changeButton: {
    marginTop: 18,
  },

  changeText: {
    color: "#A855F7",
    fontSize: 18,
    fontWeight: "600",
  },

  helper: {
    color: "#8A8A94",
    fontSize: 13,
    marginTop: 8,
  },
});
