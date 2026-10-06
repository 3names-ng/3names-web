import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { formatClock, type SoundSelection } from '@/service/sound.service';

/** "Add sound" row for the create screens; shows the chosen sound once picked. */
export default function AddSoundRow({
  selection,
  onPress,
  onRemove,
  tone = 'default',
}: {
  selection: SoundSelection | null;
  onPress: () => void;
  onRemove: () => void;
  /** "onDark" for full-screen camera/composer overlays */
  tone?: 'default' | 'onDark';
}) {
  const { colors } = useTheme();
  const onDark = tone === 'onDark';
  const text = onDark ? '#fff' : colors.text;
  const muted = onDark ? 'rgba(255,255,255,0.7)' : colors.muted;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        onDark
          ? { backgroundColor: 'rgba(0,0,0,0.45)', borderColor: 'rgba(255,255,255,0.25)' }
          : { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {selection?.sound.coverUrl ? (
        <Image source={{ uri: selection.sound.coverUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, { backgroundColor: colors.primary + (onDark ? 'cc' : '25'), alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="musical-notes" size={18} color={onDark ? '#fff' : colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        {selection ? (
          <>
            <ThemedText style={{ fontWeight: '700', color: text }} numberOfLines={1}>
              {selection.sound.title}
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: muted }} numberOfLines={1}>
              {selection.sound.artistName} · from {formatClock(selection.startMs)}
            </ThemedText>
          </>
        ) : (
          <>
            <ThemedText style={{ fontWeight: '700', color: text }}>Add sound</ThemedText>
            <ThemedText style={{ fontSize: 12, color: muted }}>Put a song on your post</ThemedText>
          </>
        )}
      </View>
      {selection ? (
        <Pressable onPress={onRemove} hitSlop={10}>
          <Ionicons name="close-circle" size={22} color={muted} />
        </Pressable>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={muted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 10, marginHorizontal: 16, marginVertical: 8 },
  cover: { width: 40, height: 40, borderRadius: 8 },
});
