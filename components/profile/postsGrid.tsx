import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface Props {
  tab: string;
}

const posts = [
  {
    id: "1",
    image: "https://picsum.photos/400/500?random=1",
    likes: 520,
    comments: 84,
  },
  {
    id: "2",
    image: "https://picsum.photos/400/500?random=2",
    likes: 120,
    comments: 25,
  },
  {
    id: "3",
    image: "https://picsum.photos/400/500?random=3",
    likes: 890,
    comments: 212,
  },
  {
    id: "4",
    image: "https://picsum.photos/400/500?random=4",
    likes: 301,
    comments: 45,
  },
  {
    id: "5",
    image: "https://picsum.photos/400/500?random=5",
    likes: 150,
    comments: 10,
  },
  {
    id: "6",
    image: "https://picsum.photos/400/500?random=6",
    likes: 980,
    comments: 302,
  },
];

const materials = [
  {
    id: "1",
    title: "CSC 301 Data Structures",
    downloads: 1450,
  },
  {
    id: "2",
    title: "MTH 201 Calculus II",
    downloads: 910,
  },
];

const questions = [
  {
    id: "1",
    title: "2024 CSC Past Question",
    year: "2024",
  },
  {
    id: "2",
    title: "2023 GST Past Question",
    year: "2023",
  },
];

export default function PostsGrid({ tab }: Props) {
  if (tab === "Posts" || tab === "Videos" || tab === "Liked") {
    return (
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.postCard}>
            <Image
              source={{ uri: item.image }}
              style={styles.image}
            />

            <View style={styles.overlay}>
              <View style={styles.stat}>
                <Ionicons
                  name="heart"
                  size={14}
                  color="#fff"
                />
                <Text style={styles.statText}>
                  {item.likes}
                </Text>
              </View>

              <View style={styles.stat}>
                <Ionicons
                  name="chatbubble"
                  size={14}
                  color="#fff"
                />
                <Text style={styles.statText}>
                  {item.comments}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  }

  if (tab === "Materials") {
    return (
      <View style={styles.section}>
        {materials.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
          >
            <MaterialCommunityIcons
              name="book-open-page-variant"
              color="#6C3EF4"
              size={34}
            />

            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.title}>
                {item.title}
              </Text>

              <Text style={styles.subtitle}>
                {item.downloads} Downloads
              </Text>
            </View>

            <Ionicons
              name="download-outline"
              size={26}
              color="#6C3EF4"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (tab === "Past Questions") {
    return (
      <View style={styles.section}>
        {questions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              color="#6C3EF4"
              size={34}
            />

            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.title}>
                {item.title}
              </Text>

              <Text style={styles.subtitle}>
                {item.year}
              </Text>
            </View>

            <Ionicons
              name="download-outline"
              size={24}
              color="#6C3EF4"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (tab === "Achievements") {
    return (
      <View style={styles.section}>
        <View style={styles.achievement}>
          <Ionicons
            name="trophy"
            color="#F5A623"
            size={55}
          />

          <Text style={styles.achievementTitle}>
            Top Creator
          </Text>

          <Text style={styles.subtitle}>
            Top 1% of your university
          </Text>
        </View>

        <View style={styles.achievement}>
          <Ionicons
            name="flame"
            color="#FF4D4D"
            size={55}
          />

          <Text style={styles.achievementTitle}>
            30 Day Streak
          </Text>

          <Text style={styles.subtitle}>
            Logged in every day
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },

  row: {
    justifyContent: "space-between",
  },

  postCard: {
    width: "48%",
    height: 220,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: "#EEE",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  stat: {
    flexDirection: "row",
    alignItems: "center",
  },

  statText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "600",
  },

  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  subtitle: {
    color: "#666",
    marginTop: 5,
  },

  achievement: {
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 30,
    marginBottom: 20,
  },

  achievementTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 15,
    color: "#111",
  },
});