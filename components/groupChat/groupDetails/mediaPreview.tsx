import React from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";

import {
  Image as ImageIcon,
  Play,
  ChevronRight,
} from "lucide-react-native";

interface Props {
  media: string[];
  onViewAll?: () => void;
  onMediaPress?: (index: number) => void;
}

export default function MediaPreview({
  media,
  onViewAll,
  onMediaPress,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ImageIcon
            size={22}
            color="#EC4899"
          />

          <Text style={styles.title}>
            Shared Media
          </Text>
        </View>

        <Pressable
          style={styles.viewAll}
          onPress={onViewAll}
        >
          <Text style={styles.viewAllText}>
            View All
          </Text>

          <ChevronRight
            size={18}
            color="#3B82F6"
          />
        </Pressable>
      </View>

      {/* Gallery */}

      <FlatList
        horizontal
        data={media}
        keyExtractor={(_, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingRight: 20,
        }}
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.imageContainer}
            onPress={() => onMediaPress?.(index)}
          >
            <Image
              source={{ uri: item }}
              style={styles.image}
            />

            {/* Play Icon */}

            <View style={styles.playButton}>
              <Play
                size={16}
                color="#FFF"
                fill="#FFF"
              />
            </View>
          </Pressable>
        )}
      />

      {/* Summary */}

      <View style={styles.summaryCard}>

        <Text style={styles.summaryTitle}>
          Recent Activity
        </Text>

        <Text style={styles.summaryText}>
          Photos, videos and GIFs shared by members will
          automatically appear here.
        </Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    marginTop: 30,
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 20,
    marginLeft: 8,
  },

  viewAll: {
    flexDirection: "row",
    alignItems: "center",
  },

  viewAllText: {
    color: "#3B82F6",
    fontWeight: "600",
    marginRight: 4,
  },

  imageContainer: {
    marginRight: 14,
  },

  image: {
    width: 120,
    height: 120,
    borderRadius: 18,
    backgroundColor: "#18181B",
  },

  playButton: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,.65)",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryCard: {
    marginTop: 18,
    backgroundColor: "#18181B",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#27272A",
  },

  summaryTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  summaryText: {
    color: "#A1A1AA",
    marginTop: 8,
    lineHeight: 22,
    fontSize: 14,
  },

});