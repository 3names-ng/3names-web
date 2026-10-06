import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useAlertBannerStore, type AlertBannerType } from "@/store/alertBannerStore";
import { useColorScheme } from "nativewind";
import { ThemedText } from "./ui/ThemedText";

const TYPE_COLORS: Record<AlertBannerType, { accent: string; bg: string; border: string }> = {
  success: { accent: "#12B76A", bg: "#F0FFF4", border: "#34D399" },
  error: { accent: "#E11D48", bg: "#FFF5F5", border: "#FB7185" },
  info: { accent: "#5B2EFF", bg: "#F5F3FF", border: "#A78BFA" },
};

const TYPE_COLORS_DARK: Record<AlertBannerType, { accent: string; bg: string; border: string }> = {
  success: { accent: "#34D399", bg: "#064E3B", border: "#10B981" },
  error: { accent: "#FB7185", bg: "#4C0519", border: "#F43F5E" },
  info: { accent: "#A78BFA", bg: "#1E1B4B", border: "#7C3AED" },
};

interface AlertBannerProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
  duration?: number;
  themeColors?: {
    cardBg: string;
    border: string;
    textSecondary: string;
    accent: string;
  };
  type?: AlertBannerType;
  isDark?: boolean;
}

export const AlertBanner = ({
  visible,
  onClose,
  message = "Earn XP from interactions to level up and gain exclusive perks!",
  duration = 5000,
  themeColors,
  type = "info",
  isDark = false,
}: AlertBannerProps) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const palette = isDark ? TYPE_COLORS_DARK[type] : TYPE_COLORS[type];
  const cardBg = themeColors?.cardBg ?? palette.bg;
  const borderColor = themeColors?.border ?? palette.border;
  const textColor = themeColors?.textSecondary ?? (isDark ? "#E2E8F0" : "#1E293B");

  useEffect(() => {
    if (visible) {
      // 1. Slide down
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 2. Auto-hide after specified duration (5 seconds)
      const timer = setTimeout(() => {
        hideBanner();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideBanner();
    }
  }, [visible]);

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.topBanner,
        {
          backgroundColor: cardBg,
          borderColor: borderColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ThemedText
        style={[
          styles.topBannerText,
          { color: textColor },
        ]}
      >
        {message}
      </ThemedText>
    </Animated.View>
  );
};

/**
 * Global AlertBanner — reads from the zustand store so any file can call
 * `useAlertBannerStore.getState().show("message", "error")` and this
 * banner appears automatically.
 */
export function GlobalAlertBanner() {
  const { visible, message, type, hide } = useAlertBannerStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <AlertBanner
      visible={visible}
      onClose={hide}
      message={message}
      type={type}
      isDark={isDark}
      duration={4000}
    />
  );
}

const styles = StyleSheet.create({
  topBanner: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999, 
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6, 
  },
  topBannerText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
});