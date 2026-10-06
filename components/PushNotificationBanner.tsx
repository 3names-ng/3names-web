import React, { useCallback, useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { usePushNotificationBannerStore } from "@/store/pushNotificationBannerStore";
import { ThemedText } from "./ui/ThemedText";
import { navigateFromNotification } from "@/utils/notifications/deepLink";
import { useColorScheme } from "nativewind";

// ─── Icon + colour per notification type ────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  new_follower: { icon: "person-add", color: "#06B6D4" },
  gift_received: { icon: "gift", color: "#EC4899" },
  post_liked: { icon: "heart", color: "#EF4444" },
  post_commented: { icon: "chatbubble", color: "#3B82F6" },
  post_reshared: { icon: "repeat", color: "#10B981" },
  story_reply: { icon: "sparkles", color: "#8B5CF6" },
  story_reaction: { icon: "sparkles", color: "#8B5CF6" },
  group_message: { icon: "chatbubbles", color: "#3B82F6" },
  level_up: { icon: "trophy", color: "#F59E0B" },
  marketplace_item_listed: { icon: "cart", color: "#7C3AED" },
  hostel_listed: { icon: "home", color: "#14B8A6" },
  event_created: { icon: "calendar", color: "#F97316" },
  election: { icon: "checkbox", color: "#7C3AED" },
};

const DEFAULT_CONFIG = { icon: "notifications" as const, color: "#64748B" };

function getTypeConfig(type: string) {
  for (const [key, config] of Object.entries(TYPE_CONFIG)) {
    if (type.includes(key)) return config;
  }
  return DEFAULT_CONFIG;
}

// ─── Component ─────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 5000;
/** How far the user must swipe (px) to trigger dismiss */
const SWIPE_THRESHOLD = 100;

export default function PushNotificationBanner() {
  const { current, hide } = usePushNotificationBannerStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const slideAnim = useRef(new Animated.Value(-120)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoDismiss = useCallback(() => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearAutoDismiss();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      translateX.setValue(0);
      opacity.setValue(1);
      hide(); // pops queue → shows next if any
    });
  }, [clearAutoDismiss, hide, opacity, slideAnim, translateX]);

  // Slide in + auto-dismiss whenever `current` changes
  useEffect(() => {
    if (current) {
      // Reset values
      slideAnim.setValue(-120);
      translateX.setValue(0);
      opacity.setValue(1);

      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss
      autoDismissTimer.current = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
      return () => clearAutoDismiss();
    } else {
      slideAnim.setValue(-120);
    }
  }, [current]);

  // ── Swipe-to-dismiss gesture ──────────────────────────────────────────
  // runOnJS: the callbacks drive react-native `Animated.Value`s, which can't be
  // copied to Reanimated's UI thread (crashes with "Cannot copy value of type AnimatedValue")
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-10, 10]) // only activate after 10px horizontal movement
    .onUpdate((e) => {
      translateX.setValue(e.translationX);
      // Fade out proportionally as user swipes
      const progress = Math.min(Math.abs(e.translationX) / SWIPE_THRESHOLD, 1);
      opacity.setValue(1 - progress * 0.6);
    })
    .onEnd((e) => {
      const shouldDismiss =
        Math.abs(e.translationX) > SWIPE_THRESHOLD ||
        Math.abs(e.velocityX) > 800;
      if (shouldDismiss) {
        // Fly off screen in swipe direction
        const direction = e.translationX > 0 ? 1 : -1;
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: direction * 400,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          translateX.setValue(0);
          opacity.setValue(1);
          hide();
          clearAutoDismiss();
        });
      } else {
        // Snap back
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

  const handlePress = () => {
    if (current?.data) {
      navigateFromNotification(current.data as Record<string, unknown>);
    }
    dismiss();
  };

  if (!current) return null;

  const { icon, color } = getTypeConfig(current.type);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateX }, { translateY: slideAnim }],
            opacity,
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            borderColor: isDark ? "#334155" : "#E2E8F0",
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
          style={styles.inner}
        >
          {/* Icon badge */}
          <View style={[styles.iconBadge, { backgroundColor: color }]}>
            <Ionicons name={icon} size={20} color="#fff" />
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <ThemedText
              numberOfLines={1}
              style={[styles.title, { color: isDark ? "#F1F5F9" : "#0F172A" }]}
            >
              {current.title}
            </ThemedText>
            {current.body ? (
              <ThemedText
                numberOfLines={1}
                style={[
                  styles.body,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                {current.body}
              </ThemedText>
            ) : null}
          </View>

          {/* Close */}
          <TouchableOpacity onPress={dismiss} hitSlop={12} style={styles.close}>
            <Ionicons
              name="close"
              size={16}
              color={isDark ? "#94A3B8" : "#94A3B8"}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 14,
    right: 14,
    zIndex: 10000,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 2,
  },
  close: {
    marginLeft: 8,
    padding: 4,
  },
});
