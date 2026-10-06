import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { openLegalPage } from "@/constants/legal";

// Bump the version if what's shared with the AI provider changes, so users
// are asked again.
const CONSENT_KEY = "ai-assistant-consent-v1";

/**
 * App Store guideline 5.1.2(i): tell users their data goes to a third-party
 * AI provider and get consent before anything is sent. Shown once per device.
 */
export function useAIConsent() {
  const [status, setStatus] = useState<"loading" | "granted" | "needed">("loading");

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY)
      .then((value) => setStatus(value === "granted" ? "granted" : "needed"))
      .catch(() => setStatus("needed"));
  }, []);

  const grant = () => {
    setStatus("granted");
    AsyncStorage.setItem(CONSENT_KEY, "granted").catch(() => {});
  };

  return { status, grant };
}

export function AIConsentModal({ visible, onAgree }: { visible: boolean; onAgree: () => void }) {
  const { colors, isDark } = useTheme();
  const text = colors?.text || (isDark ? "#FFFFFF" : "#0F172A");
  const muted = colors?.muted || (isDark ? "#9CA3AF" : "#64748B");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => router.back()}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors?.card || (isDark ? "#130F22" : "#FFFFFF") }]}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={22} color="#C084FC" />
          </View>
          <Text style={[styles.title, { color: text }]}>Before you use the AI Assistant</Text>

          <Text style={[styles.body, { color: muted }]}>
            To answer you, the messages, images and voice notes you send here are shared with
            Google (Gemini), a third-party AI provider. They aren&apos;t shared with other users.
          </Text>
          <Text style={[styles.body, { color: muted }]}>
            Don&apos;t include sensitive personal information. AI replies can be inaccurate, so
            double-check anything important. You can report a reply with the flag under it.
          </Text>

          <TouchableOpacity onPress={() => openLegalPage("privacy")}>
            <Text style={styles.link}>Read our Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primary} onPress={onAgree} accessibilityRole="button">
            <Text style={styles.primaryText}>I agree</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => router.back()} accessibilityRole="button">
            <Text style={[styles.secondaryText, { color: muted }]}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 20,
    padding: 24,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(168,85,247,0.15)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  link: {
    color: "#A855F7",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 18,
  },
  primary: {
    backgroundColor: "#A855F7",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  secondary: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
