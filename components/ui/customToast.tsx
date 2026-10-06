import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedText } from "./ThemedText";

interface ToastProps {
  text1?: string;
  text2?: string;
}

export const SuccessToast = ({ text1, text2 }: ToastProps) => {
  return (
    <View
      style={{
        width: "90%",
        backgroundColor: "#16A34A",
        padding: 15,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Ionicons name="checkmark-circle" size={28} color="white" />

      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text
          style={{
            color: "white",
            fontWeight: "800",
            fontSize: 15,
          }}
        >
          {text1}
        </Text>

        <Text
          style={{
            color: "white",
            marginTop: 3,
            fontSize: 13,
          }}
        >
          {text2}
        </Text>
      </View>
    </View>
  );
};

export const ErrorToast = ({ text1, text2 }: ToastProps) => {
  return (
    <View
      style={{
        width: "90%",
        backgroundColor: "#DC2626",
        padding: 15,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Ionicons name="close-circle" size={28} color="white" />

      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text
          style={{
            color: "white",
            fontWeight: "800",
            fontSize: 15,
          }}
        >
          {text1}
        </Text>

        <Text
          style={{
            color: "white",
            marginTop: 3,
            fontSize: 13,
          }}
        >
          {text2}
        </Text>
      </View>
    </View>
  );
};

interface LevelUpAlertProps {
  visible: boolean;
  onClose: () => void;
  username?: string | null;
  profilePictureUrl?: string | null;
  emoji?: string;
  title?: string;
  level?: number;
  color?: string;
}

/**
 * Standalone level-up overlay rendered directly in _layout.tsx (not inside
 * react-native-toast-message). Uses zIndex: 10000 so it always appears
 * above every other screen element, including the GiftSendOverlay (999).
 */
export const LevelUpAlert = ({
  visible,
  onClose,
  username,
  emoji = "🎉",
  title,
  level,
  color,
}: LevelUpAlertProps) => {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const brandColor = color || "#7C3AED";

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(-120);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.alertContainer,
        {
          borderColor: brandColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.iconBadge, { backgroundColor: brandColor }]}>
        <ThemedText style={{ fontSize: 18 }}>{emoji}</ThemedText>
      </View>


      <View style={{ flex: 1, marginLeft: 12 }}>
  <ThemedText numberOfLines={1}>
    <ThemedText style={styles.titleText}>
      {username ? `@${username}` : "Someone"} leveled up! {emoji || "🎉"}
    </ThemedText>
    <ThemedText style={[styles.subtitleText, { color: brandColor }]}>
      {" • "}Level {level ?? ""}{title ? ` · ${title}` : ""}
    </ThemedText>
  </ThemedText>
</View>

    </Animated.View>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    position: "absolute",
    top: 54,
    alignSelf: "center",
    width: "90%",
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    zIndex: 10000,
    elevation: 10000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    // color: "white",
    // fontWeight: "800",
    fontSize: 8,
  },
  subtitleText: {
    // fontWeight: "700",
    fontSize: 8,
    // marginTop: 2,
  },
});