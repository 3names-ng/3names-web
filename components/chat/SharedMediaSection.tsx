/**
 * SharedMediaSection — horizontal scrollable gallery of shared images.
 * Extracted from both chat screens (identical in both).
 */
import React from "react";
import { View, Image, ScrollView, TouchableOpacity } from "react-native";
import { ImageIcon } from "lucide-react-native";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";

interface SharedMediaItem {
  id: string;
  url: string;
}

interface SharedMediaSectionProps {
  mediaList: SharedMediaItem[];
  onPreview: (url: string) => void;
  colors: { border?: string };
  styles: {
    sectionContainer: any;
    sectionHeader: any;
    sectionTitleRow: any;
    sectionTitle: any;
  };
}

export default function SharedMediaSection({
  mediaList,
  onPreview,
  colors,
  styles: s,
}: SharedMediaSectionProps) {
  return (
    <ThemedView style={s.sectionContainer}>
      <ThemedView style={s.sectionHeader}>
        <ThemedView style={s.sectionTitleRow}>
          <ImageIcon size={22} color="#3B82F6" />
          <ThemedText style={s.sectionTitle}>Shared Media</ThemedText>
        </ThemedView>
        <ThemedText style={{ color: "#A1A1AA", fontSize: 13, fontWeight: "600" }}>
          {mediaList.length} {mediaList.length === 1 ? "item" : "items"}
        </ThemedText>
      </ThemedView>

      {mediaList.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row gap-2.5"
        >
          {mediaList.map((media) => (
            <TouchableOpacity
              key={media.id}
              activeOpacity={0.8}
              onPress={() => onPreview(media.url)}
              className="rounded-xl overflow-hidden border border-zinc-800"
            >
              <Image
                source={{ uri: media.url }}
                style={{ width: 100, height: 100 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ThemedView
          style={{ borderWidth: 1, borderColor: colors.border }}
          className="py-6 items-center justify-center rounded-xl"
        >
          <ThemedText style={{ color: "#71717A", fontSize: 13 }}>
            No photos or media shared yet.
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}
