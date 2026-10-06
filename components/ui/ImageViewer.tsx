import React from "react";
import {
  Modal,
  View,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";

const { width, height } = Dimensions.get("window");

interface Props {
  visible: boolean;
  imageUrl?: string | null;
  username?: string | null;
  onClose: () => void;
}

export default function ImageViewer({
  visible,
  imageUrl,
  username,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />
      <Pressable style={styles.overlay} onPress={onClose}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholder}>
            <ThemedText style={styles.initial}>
              {username?.[0]?.toUpperCase() ?? "?"}
            </ThemedText>
          </View>
        )}

        {/* Close button */}
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: width,
    height: height,
  },
  placeholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  initial: {
    fontSize: 64,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  closeButton: {
    position: "absolute",
    top: 54,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
