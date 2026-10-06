import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

export default function LevelCard() {
  const currentXP = 5450;
  const nextLevelXP = 10000;

  const progress = (currentXP / nextLevelXP) * 100;

  return (
    <LinearGradient
      colors={["#6C3EF4", "#8A5BFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Top */}

      <View style={styles.topRow}>
        <View style={styles.levelCircle}>
          <MaterialCommunityIcons
            name="shield-crown"
            size={42}
            color="#FFD54F"
          />
        </View>

        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.level}>Level 12</Text>

          <Text style={styles.rank}>
            ⭐ Influencer
          </Text>

          <Text style={styles.subtitle}>
            Keep engaging to reach the next level.
          </Text>
        </View>

   
      </View>

      {/* Progress */}

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {currentXP.toLocaleString()} /{" "}
          {nextLevelXP.toLocaleString()} XP
        </Text>
      </View>


    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 20,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  levelCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  level: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },

  rank: {
    color: "#FFD54F",
    fontWeight: "700",
    fontSize: 18,
    marginTop: 2,
  },

  subtitle: {
    color: "#E9DEFF",
    marginTop: 6,
    lineHeight: 20,
  },

  badge: {
    backgroundColor: "#FFD54F",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },

  badgeText: {
    color: "#4A2BB5",
    fontWeight: "700",
    fontSize: 12,
  },

  progressContainer: {
    marginTop: 28,
  },

  progressBackground: {
    width: "100%",
    height: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 6,
    overflow: "hidden",
  },

  progressFill: {
    height: 12,
    backgroundColor: "#FFD54F",
    borderRadius: 6,
  },

  progressText: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },

  infoCard: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
  },

  infoValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },

  infoLabel: {
    color: "#DDD4FF",
    marginTop: 5,
    fontSize: 13,
  },
});