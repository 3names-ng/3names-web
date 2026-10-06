import React from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import MediaItem, { Media } from "./mediaItem";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  media: Media[];
  maxVisible?: number; 
  onRemove?: (id: string) => void;
  onAddMore?: () => void;
  onPressItem?: (item: Media, index: number) => void;
  isPreview?: boolean; // New prop to toggle preview mode
}

export default function MediaGrid({
  media = [],
  maxVisible = 6, 
  onRemove,
  onAddMore,
  onPressItem,
  isPreview = false,
}: Props) {
  const { width } = useWindowDimensions();
 const { colors } = useTheme();
  const containerPadding = 40; // 20px left, 20px right
  const gap = 10;

  // Exact size to fit exactly 3 items per row with gaps
  const itemSize = (width - containerPadding - (gap * 2)) / 3;

  // --- 1. Slice items based on visibility limits ---
  const visibleMedia = media.slice(0, maxVisible);
  const remaining = media.length > maxVisible ? media.length - maxVisible : 0;

  // --- 2. Build the Grid Data Array ---
  type GridItem = { type: "media"; data: Media; originalIndex: number } | { type: "add" };

  const gridData: GridItem[] = visibleMedia.map((item, index) => ({
    type: "media" as const,
    data: item,
    originalIndex: index,
  }));

  // Append 'Add More' only if not in preview mode, under 20 items, and no hidden/remaining items
  const showAddMore = !isPreview && media.length < 20 && remaining === 0;
  if (showAddMore) {
    gridData.push({ type: "add" });
  }

  // --- 3. If completely empty ---
  if (gridData.length === 0) {
    if (isPreview) return null;

    return (
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAddMore}
          style={[styles.addMore, { width: itemSize, height: itemSize }]}
        >
          <Ionicons name="add" size={30} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        scrollEnabled={false}
        data={gridData}
        numColumns={3}
        key={"three-columns"} 
        keyExtractor={(item, index) => (item.type === "media" ? item.data.id : "add-btn-" + index)}
        columnWrapperStyle={styles.row}
        renderItem={({ item, index }) => {
          if (item.type === "add") {
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onAddMore}
                style={[styles.addMore, { width: itemSize, height: itemSize, backgroundColor:colors.background }]}
              >
                <Ionicons name="add" size={30} color={colors.primary} />
              </TouchableOpacity>
            );
          }

          // Check if this is the last visible space and there are more assets hidden
          const isLastCard = index === maxVisible - 1 && remaining > 0;

          return (
            <View style={{ width: itemSize, height: itemSize }}>
              <MediaItem
                item={item.data}
                showMore={isLastCard}
                remaining={remaining}
                onPress={() => onPressItem?.(item.data, item.originalIndex)}
                // In preview mode, provide a no-op to satisfy the expected function type
                // (prevents action while keeping the prop type safe)
                onRemove={isPreview ? () => {} : () => onRemove?.(item.data.id)}
              />
            </View>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 5,
  },

  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10, 
    marginBottom: 10,
  },

  addMore: {
    borderRadius: 14, 
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    
  },
});