import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const achievements = [
  {
    id: "1",
    title: "Top Creator",
    subtitle: "Top 1% Creator",
    color: "#FFE8B3",
    icon: (
      <MaterialCommunityIcons
        name="trophy"
        size={30}
        color="#F4A300"
      />
    ),
  },

  {
    id: "2",
    title: "30 Day Streak",
    subtitle: "Logged in 30 days",
    color: "#FFE2E2",
    icon: (
      <Ionicons
        name="flame"
        size={28}
        color="#FF4B4B"
      />
    ),
  },

  {
    id: "3",
    title: "Contributor",
    subtitle: "Uploaded 100 Notes",
    color: "#DFFFE7",
    icon: (
      <MaterialCommunityIcons
        name="file-document"
        size={28}
        color="#16A34A"
      />
    ),
  },

  {
    id: "4",
    title: "Campus Hero",
    subtitle: "100 Helpful Answers",
    color: "#ECE8FF",
    icon: (
      <FontAwesome5
        name="medal"
        size={25}
        color="#6C3EF4"
      />
    ),
  },
];

export default function AchievementSection() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Achievements
        </Text>

        <Text style={styles.viewAll}>
          View All
        </Text>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={achievements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: item.color,
              },
            ]}
          >
            <View style={styles.icon}>
              {item.icon}
            </View>

            <Text style={styles.cardTitle}>
              {item.title}
            </Text>

            <Text style={styles.subtitle}>
              {item.subtitle}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
  },

  header: {
    paddingHorizontal: 20,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 18,
  },

  title: {
    fontSize: 22,

    fontWeight: "700",

    color: "#111",
  },

  viewAll: {
    color: "#6C3EF4",

    fontWeight: "700",
  },

  card: {
    width: 170,

    borderRadius: 22,

    padding: 20,

    marginLeft: 20,

    marginBottom: 5,
  },

  icon: {
    width: 60,

    height: 60,

    borderRadius: 30,

    backgroundColor: "#fff",

    justifyContent: "center",

    alignItems: "center",
  },

  cardTitle: {
    marginTop: 18,

    fontSize: 18,

    fontWeight: "700",

    color: "#111",
  },

  subtitle: {
    marginTop: 8,

    color: "#555",

    lineHeight: 20,
  },
});