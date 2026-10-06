/**
 * ringtoneSettingsScreen.tsx
 *
 * Screen where users can preview and select their incoming call ringtone.
 * Follows the same style as notificationSettingsScreen.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { RINGTONES, getRingtoneById, getRingtoneAsset } from "@/config/ringtones";
import { useRingtoneStore } from "@/store/ringtoneStore";
import { showSuccess } from "@/components/ui/toast";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

export default function RingtoneSettingsScreen() {
  const { colors } = useTheme();
  const primaryAccent = colors.primary || "#7C3AED";
  const selectedId = useRingtoneStore((s) => s.selectedRingtoneId);
  const setSelectedRingtone = useRingtoneStore((s) => s.setSelectedRingtone);
  const [previewSound, setPreviewSound] = useState<AudioPlayer | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const stopPreview = useCallback(async () => {
    try {
      if (previewSound) {
        previewSound.pause();
        previewSound.remove();
        setPreviewSound(null);
      }
    } catch {
      setPreviewSound(null);
    }
    setPreviewingId(null);
  }, [previewSound]);

  const handlePreview = useCallback(
    async (ringtoneId: string) => {
      // Stop any currently playing preview
      await stopPreview();

      // If tapping the same one, just stop
      if (previewingId === ringtoneId) return;

      try {
        const asset = getRingtoneAsset(ringtoneId);
        if (!asset) return;

        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });

        const sound = createAudioPlayer(asset);
        setPreviewSound(sound);
        setPreviewingId(ringtoneId);
        sound.play();

        // Auto-stop after 5 seconds
        setTimeout(() => {
          try {
            sound.pause();
            sound.remove();
          } catch {}
          // Only clear the UI if this sound is still the one being previewed
          setPreviewSound((prev) => (prev === sound ? null : prev));
          setPreviewingId((prev) => (prev === ringtoneId ? null : prev));
        }, 5000);
      } catch (err) {
        console.warn("[Ringtone] Preview failed:", err);
      }
    },
    [previewingId, stopPreview],
  );

  const handleSelect = useCallback(
    async (ringtoneId: string) => {
      await stopPreview();
      setSelectedRingtone(ringtoneId);
      const ringtone = getRingtoneById(ringtoneId);
      showSuccess(`Ringtone set to "${ringtone.name}"`);
    },
    [setSelectedRingtone, stopPreview],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === "#fff" ? "light-content" : "dark-content"} />

      {/* Header */}
      <ThemedView
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Pressable
          onPress={() => {
            stopPreview();
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Incoming Call Ringtone</ThemedText>
        <View style={styles.backButton} />
      </ThemedView>

      {/* Ringtone List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        <ThemedText style={[styles.sectionLabel, { color: colors.muted || "#888" }]}>
          Choose a ringtone for incoming calls
        </ThemedText>

        {RINGTONES.map((ringtone) => {
          const isSelected = selectedId === ringtone.id;
          const isPreviewing = previewingId === ringtone.id;

          return (
            <Pressable
              key={ringtone.id}
              onPress={() => handleSelect(ringtone.id)}
              style={[
                styles.ringtoneRow,
                {
                  backgroundColor: isSelected
                    ? `${primaryAccent}15`
                    : colors.card || "transparent",
                  borderColor: isSelected ? primaryAccent : colors.border,
                },
              ]}
            >
              {/* Radio indicator */}
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: isSelected ? primaryAccent : colors.border,
                    backgroundColor: isSelected ? primaryAccent : "transparent",
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>

              {/* Name */}
              <View style={styles.ringtoneInfo}>
                <ThemedText
                  style={[
                    styles.ringtoneName,
                    { color: isSelected ? primaryAccent : colors.text },
                    isSelected && styles.ringtoneNameSelected,
                  ]}
                >
                  {ringtone.name}
                </ThemedText>
                {isSelected && (
                  <ThemedText style={[styles.activeLabel, { color: primaryAccent }]}>
                    Active
                  </ThemedText>
                )}
              </View>

              {/* Preview button */}
              <Pressable
                onPress={() => handlePreview(ringtone.id)}
                style={styles.previewButton}
              >
                <Ionicons
                  name={isPreviewing ? "pause" : "play"}
                  size={20}
                  color={isPreviewing ? primaryAccent : colors.text}
                />
              </Pressable>
            </Pressable>
          );
        })}

        <ThemedText style={[styles.hint, { color: colors.muted || "#888" }]}>
          Tap a ringtone to select it. Tap the play button to preview.
        </ThemedText>
      </ScrollView>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
  },
  ringtoneRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  ringtoneInfo: {
    flex: 1,
  },
  ringtoneName: {
    fontSize: 16,
    fontWeight: "500",
  },
  ringtoneNameSelected: {
    fontWeight: "700",
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  previewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  hint: {
    fontSize: 12,
    marginTop: 16,
    textAlign: "center",
  },
});
