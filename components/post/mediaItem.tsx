import React, { useState, useEffect } from "react";
import { StyleSheet, View, Image, Text, Pressable, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as VideoThumbnails from "expo-video-thumbnails";
import FilteredImage from "@/components/camera/filteredImage";
import { FILTER_BY_ID } from "@/constants/cameraFilters";

export interface Media {
  id: string;
  uri: string;
  type: "image" | "video";
  duration?: string | number; // Updated to accept both raw strings and numbers
  thumbnail?: string;
  /**
   * Camera filter to apply: videos → by the server on upload; photos → baked on
   * the phone at publish. Live-filtered photos have it in the pixels already.
   */
  filterId?: string;
  /** Filtered while filming (live filter camera) — no after-capture filter picker */
  liveFiltered?: boolean;
}

interface MediaItemProps {
  item: Media;
  showMore: boolean;
  remaining: number;
  onPress: () => void;
  onRemove: () => void;
}

/**
 * Formats a duration in seconds or milliseconds into a human-readable string (e.g., "0:05", "3:45", "1:15:30")
 */
function formatDuration(rawDuration: string | number | undefined): string {
  if (rawDuration === undefined || rawDuration === null) return "00:00";

  let totalSeconds = typeof rawDuration === "string" ? parseFloat(rawDuration) : rawDuration;

  if (isNaN(totalSeconds)) return "00:00";

  // Check if value is in milliseconds (typical when fetching assets from local device storage)
  // E.g., 30,000ms vs 30 seconds.
  if (totalSeconds > 10000) {
    totalSeconds = Math.round(totalSeconds / 1000);
  } else {
    totalSeconds = Math.round(totalSeconds);
  }

  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedSecs = secs < 10 ? `0${secs}` : secs;

  if (hrs > 0) {
    const paddedMins = mins < 10 ? `0${mins}` : mins;
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }

  return `${mins}:${paddedSecs}`;
}

export default function MediaItem({
  item,
  showMore,
  remaining,
  onPress,
  onRemove,
}: MediaItemProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate thumbnail if the item type is a video
  useEffect(() => {
    let isMounted = true;

    if (item.type === "video") {
      async function generateThumbnail() {
        try {
          setLoading(true);
          const { uri } = await VideoThumbnails.getThumbnailAsync(item.uri, {
            time: 1000, // Pull frame from 1s mark to avoid starting-frame blackness
            quality: 0.6,
          });
          if (isMounted) {
            setThumbnail(uri);
          }
        } catch (error) {
          console.warn("Error creating video thumbnail: ", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
      generateThumbnail();
    }

    return () => {
      isMounted = false;
    };
  }, [item.uri, item.type]);

  const displayUri = item.type === "video" ? thumbnail : item.uri;
  // Filter-camera videos are recorded raw — show their thumbnail with the filter applied
  const filter = item.filterId ? FILTER_BY_ID[item.filterId] : undefined;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {displayUri && filter ? (
        <FilteredImage uri={displayUri} filter={filter.params} style={styles.media} />
      ) : displayUri ? (
        <Image source={{ uri: displayUri }} style={styles.media} resizeMode="cover" />
      ) : (
        <View style={[styles.media, styles.fallback]}>
          {loading ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Ionicons name="videocam" size={24} color="#A78BFA" />
          )}
        </View>
      )}

      {/* --- Center Play Button Overlay for Videos --- */}
      {item.type === "video" && !loading && !showMore && (
        <View style={styles.centerPlayOverlay}>
          <View style={styles.centerPlayButton}>
            <Ionicons 
              name="play" 
              size={16} 
              color="#FFF" 
              style={styles.centerPlayIcon} 
            />
          </View>
        </View>
      )}

      {/* Small Duration Badge (Bottom Left) */}
      {/* {item.type === "video" && !loading && item.duration !== undefined && (
        <View style={styles.videoBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>
      )} */}

      {/* "Show More" Remaining Items Overlay */}
      {showMore && remaining > 0 && (
        <View style={styles.moreOverlay}>
          <Text style={styles.moreText}>+{remaining}</Text>
        </View>
      )}

      {/* Remove Button (Hides if "Show More" is blocking) */}
      {!showMore && (
        <Pressable 
          onPress={(e) => {
            e.stopPropagation(); // Prevents launching the video player
            onRemove();
          }} 
          style={styles.removeBtn}
        >
          <Ionicons name="close" size={14} color="#FFF" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
  },
  /* Center Play Button Styling */
  centerPlayOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)", // Subtle dimming for better contrast
  },
  centerPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  centerPlayIcon: {
    marginLeft: 3, // Offsets visual imbalance of the triangle play icon shape
  },
  videoBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(124, 58, 237, 0.75)", // Royal purple color overlay
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});