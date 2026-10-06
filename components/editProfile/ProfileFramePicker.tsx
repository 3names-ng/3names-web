import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { usePerks } from "@/hooks/usePerks";
import { PROFILE_FRAMES, ProfileFrame } from "@/constants/profileFrames";

interface ProfileFramePickerProps {
  /** Currently selected frame ID */
  selectedFrame: string | null;
  /** Called when user selects a frame */
  onSelectFrame: (frameId: string) => void;
}

export default function ProfileFramePicker({
  selectedFrame: selectedFrameId,
  onSelectFrame: onSelect,
}: ProfileFramePickerProps) {
  const { colors } = useTheme();
  const { hasPerk } = usePerks();
  const isUnlocked = hasPerk("Custom profile frame");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Profile Frame
        </ThemedText>
        {!isUnlocked && (
          <View
            style={[
              styles.lockBadge,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="lock-closed" size={12} color={colors.muted} />
            <ThemedText style={[styles.lockText, { color: colors.muted }]}>
              Level 6
            </ThemedText>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PROFILE_FRAMES.map((frame: ProfileFrame) => {
          const isSelected = selectedFrameId === frame.id;
          const isNone = frame.id === "none";
          const isDisabled = !isUnlocked && !isNone;

          return (
            <TouchableOpacity
              key={frame.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              style={[
                styles.frameItem,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              onPress={() => {
                if (isDisabled) return;
                onSelect(frame.id);
              }}
              activeOpacity={isDisabled ? 1 : 0.7}
            >
              {/* Frame preview ring */}
              <View style={styles.framePreview}>
                {isNone ? (
                  <View
                    style={[
                      styles.previewCircle,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color={colors.muted}
                    />
                  </View>
                ) : (
                  <LinearGradient
                    colors={frame.colors as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientPreview}
                  >
                    <View
                      style={[
                        styles.previewInner,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <ThemedText style={styles.frameEmoji}>
                        {frame.emoji}
                      </ThemedText>
                    </View>
                  </LinearGradient>
                )}

                {/* Lock overlay */}
                {isDisabled && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={14} color="#FFF" />
                  </View>
                )}
              </View>

              <ThemedText
                style={[
                  styles.frameName,
                  {
                    color: isSelected ? colors.primary : colors.muted,
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
                numberOfLines={1}
              >
                {frame.name}
              </ThemedText>

              {/* Selected indicator */}
              <View
                style={[
                  styles.selectedDot,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : "transparent",
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  lockText: {
    fontSize: 11,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  frameItem: {
    alignItems: "center",
    width: 72,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 2,
  },
  framePreview: {
    position: "relative",
    width: 48,
    height: 48,
    marginBottom: 6,
  },
  previewCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  gradientPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  previewInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  frameEmoji: {
    fontSize: 16,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  frameName: {
    fontSize: 10,
    textAlign: "center",
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
});