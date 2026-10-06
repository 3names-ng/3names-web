import React from "react";
import { StyleSheet, Text, View, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import PrimaryButton from "@/components/auth/primaryButton";
import { ThemedText } from "@/components/ui/ThemedText";

export default function VerificationPendingScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleContinue = () => {
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        {/* 1. Illustration Area */}
        <View style={styles.imageContainer}>
          {/* Using your local asset file for the exact image from the mockup */}
          <Image
            source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946849/review2_f6iy3j.png"}}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* 2. Text Header */}
        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>Under Review</ThemedText>
          <ThemedText
            style={{
              fontSize: 18,
              color: colors.muted,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            Thanks! Your documents are being reviewed by our team.
          </ThemedText>
        </View>

        {/* 3. Information Card List */}
        <View style={styles.infoCard}>
          {/* Row 1: Time */}
          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Feather name="clock" size={18} color="#6366f1" />
            </View>
            <ThemedText style={styles.infoText}>
              You’ll get a notification within{" "}
              <ThemedText style={styles.boldText}>10–15 minutes</ThemedText>
            </ThemedText>
          </View>

          <View style={styles.divider} />

          {/* Row 2: Explore */}
          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#6366f1"
              />
            </View>
            <ThemedText style={styles.infoText}>
              You can still explore{" "}
              <ThemedText style={styles.boldText}>3NAMES</ThemedText>
            </ThemedText>
          </View>

          <View style={styles.divider} />

          {/* Row 3: Email */}
          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Feather name="mail" size={18} color="#6366f1" />
            </View>
            <ThemedText style={styles.infoText}>
              We’ll email you once you’re{" "}
              <ThemedText style={styles.boldText}>verified</ThemedText>
            </ThemedText>
          </View>
        </View>
      </View>

      {/* 4. Action Button at Bottom */}
      <View style={styles.footer}>
        <PrimaryButton title="Explore 3NAMES" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  imageContainer: {
    width: "100%",
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",

    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#4A5568",
    textAlign: "center",
    lineHeight: 24,
  },
  infoCard: {
    width: "100%",
    backgroundColor: "#F8F9FE",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0FB",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EEF0FB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#4F5E7B",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "600",
    color: "#6366f1", // Main purple-indigo color
  },
  divider: {
    height: 1,
    backgroundColor: "#ECEEF9",
    width: "100%",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
