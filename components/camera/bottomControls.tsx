import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Text,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface Props {
  mode: string;
  onModeChange: (mode: string) => void;
  onCapture: () => void;
  onFlip: () => void;
  onGalleryPress: () => void;
  isRecording?: boolean;
  galleryThumbnail?: string | null; 
}

const MODES = ["PHOTO", "VIDEO"];

export default function BottomControls({
  mode,
  onModeChange,
  onCapture,
  onFlip,
  onGalleryPress,
  isRecording = false,
  galleryThumbnail = null, // Defaults to null
}: Props) {
  return (
    <View style={styles.container}>
      {/* Camera Modes */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeContainer}
      >
        {MODES.map((item) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.8}
            onPress={() => {
              if (isRecording) return;
              onModeChange(item);
            }}
            style={[
              styles.modeButton,
              mode === item && styles.activeMode,
            ]}
          >
            <MaterialCommunityIcons
              name={item === "PHOTO" ? "image" : "video"}
              size={16}
              color={mode === item ? "#7C3AED" : "#FFFFFF"}
            />

            <View style={{ width: 6 }} />

            <Text
              style={{
                color: mode === item ? "#7C3AED" : "#FFFFFF",
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottom}>
        {/* Gallery Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onGalleryPress}
          style={styles.sideButton}
          disabled={isRecording}
        >
          {galleryThumbnail ? (
            <Image
              source={{ uri: galleryThumbnail }}
              style={[styles.gallery, isRecording && { opacity: 0.5 }]}
            />
          ) : (
            // Fallback icon if no photo exists or permission is denied
            <Ionicons 
              name="images" 
              size={24} 
              color={isRecording ? "rgba(255,255,255,0.4)" : "#FFF"} 
            />
          )}
        </TouchableOpacity>

        {/* Capture / Record Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onCapture}
          style={[
            styles.captureOuter,
            mode === "VIDEO" && styles.videoOuter,
            isRecording && styles.recordingOuter,
          ]}
        >
          <View
            style={[
              styles.captureInner,
              mode === "VIDEO" && styles.videoInner,
              isRecording && styles.recordingInner,
            ]}
          />
        </TouchableOpacity>

        {/* Flip Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onFlip}
          style={styles.sideButton}
          disabled={isRecording}
        >
          <Ionicons
            name="camera-reverse"
            size={28}
            color={isRecording ? "rgba(255,255,255,0.4)" : "#FFF"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingBottom: 20,
  },

  modeContainer: {
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },

  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 6,
    backgroundColor: "rgba(0,0,0,.35)",
  },

  activeMode: {
    backgroundColor: "#FFFFFF",
  },

  bottom: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  sideButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,.45)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  gallery: {
    width: "100%",
    height: "100%",
  },

  captureOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 6,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },

  videoOuter: {
    borderColor: "rgba(255,255,255,0.8)",
  },

  recordingOuter: {
    borderColor: "#EF4444",
  },

  captureInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
  },

  videoInner: {
    backgroundColor: "#EF4444",
  },

  recordingInner: {
    backgroundColor: "#EF4444",
    width: 44,
    height: 44,
    borderRadius: 8, // Turns the circle into a rounded stop square
  },
});