import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getFrameById } from "@/constants/profileFrames";

interface ProfileFrameProps {
  /** The frame ID (e.g. "gold-ring") */
  frameId?: string | null;
  /** Avatar image URI */
  uri?: string | null;
  /** Size of the avatar (width = height) */
  size: number;
  /** Username initial to show when no image */
  initial?: string;
  /** Background color for the initial fallback */
  fallbackColor?: string;
}

/**
 * Renders an avatar wrapped in a gradient frame ring.
 * If no frame is selected, renders a plain avatar.
 */
export function ProfileFrame({
  frameId,
  uri,
  size,
  initial,
  fallbackColor = "#6C3EF4",
}: ProfileFrameProps) {
  const frame = getFrameById(frameId);
  const hasFrame = frame && frame.id !== "none" && frame.colors[0] !== "transparent";

  // Frame ring thickness scales with avatar size
  const ringWidth = Math.max(3, Math.round(size * 0.06));
  const innerSize = hasFrame ? size - ringWidth * 2 : size;

  const renderInitial = (dimension: number, color?: string) => {
    if (!initial) return null;
    return (
      <View style={styles.initialContainer}>
        <Text style={[styles.initialText, { fontSize: dimension * 0.4, color: color || "#FFFFFF" }]}>
          {initial}
        </Text>
      </View>
    );
  };

  if (!hasFrame) {
    // No frame — plain avatar
    if (uri) {
      return (
        <Image
          source={{ uri }}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      );
    }
    return (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: fallbackColor,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        {renderInitial(size)}
      </View>
    );
  }

  // Has frame — gradient ring around avatar
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={frame.colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <View
          style={[
            styles.innerBorder,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={[
                styles.avatar,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerSize / 2,
                },
              ]}
            />
          ) : (
            <View
              style={[
                styles.fallback,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerSize / 2,
                  backgroundColor: fallbackColor,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              {renderInitial(innerSize)}
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Glow effect */}
      {frame.glow && (
        <View
          style={[
            styles.glow,
            {
              width: size + 8,
              height: size + 8,
              borderRadius: (size + 8) / 2,
              backgroundColor: frame.glow,
              top: -4,
              left: -4,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    resizeMode: "cover",
  },
  fallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  initialContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  initialText: {
    fontWeight: "700",
  },
  gradientRing: {
    justifyContent: "center",
    alignItems: "center",
  },
  innerBorder: {
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    zIndex: -1,
  },
});
