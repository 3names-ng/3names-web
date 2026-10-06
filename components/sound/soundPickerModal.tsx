import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ui/ThemedText';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { useTheme } from '@/hooks/useTheme';
import { useSoundPlayback } from '@/hooks/useSoundPlayback';
import {
  GENRE_LABEL,
  SOUND_CLIP_MS,
  SOUND_GENRES,
  formatClock,
  soundService,
  type Sound,
  type SoundGenre,
  type SoundSelection,
} from '@/service/sound.service';
import SimpleSlider from './simpleSlider';

type Sort = 'trending' | 'new';

/**
 * "Add sound" for posts and stories: browse/search the library, preview,
 * then pick the clip start and the mix. Returns a SoundSelection (or null to remove).
 */
export default function SoundPickerModal({
  visible,
  onClose,
  value,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  /** The current choice, if any — opens straight on the adjust step */
  value: SoundSelection | null;
  onChange: (selection: SoundSelection | null) => void;
}) {
  const { colors } = useTheme();
  const [step, setStep] = useState<'browse' | 'adjust'>('browse');
  const [sort, setSort] = useState<Sort>('trending');
  const [genre, setGenre] = useState<SoundGenre | null>(null);
  const [query, setQuery] = useState('');
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SoundSelection | null>(null);

  // Open on the adjust step when editing an existing choice
  useEffect(() => {
    if (!visible) return;
    if (value) {
      setDraft(value);
      setStep('adjust');
    } else {
      setDraft(null);
      setStep('browse');
    }
    setPreviewId(null);
  }, [visible, value]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await soundService.list({ q: query.trim() || undefined, genre: genre ?? undefined, sort, limit: 40 });
      setSounds(res.items);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not load sounds');
    } finally {
      setLoading(false);
    }
  }, [query, genre, sort]);

  // Debounced search; immediate for tab/genre changes
  useEffect(() => {
    if (!visible || step !== 'browse') return;
    const t = setTimeout(load, query ? 350 : 0);
    return () => clearTimeout(t);
  }, [visible, step, load, query]);

  // ── Previews ──
  const previewSound = sounds.find((s) => s.id === previewId) ?? null;
  const browsePreview = useMemo<SoundSelection | null>(
    () =>
      previewSound
        ? { sound: previewSound, startMs: previewSound.suggestedStartMs, soundVolume: 1, originalVolume: 1 }
        : null,
    [previewSound],
  );
  useSoundPlayback(browsePreview, visible && step === 'browse' && !!browsePreview, { ignoreMute: true });

  // While adjusting, the preview restarts from the new start once dragging ends
  const [committedStart, setCommittedStart] = useState(0);
  useEffect(() => {
    if (draft) setCommittedStart(draft.startMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.sound.id]);
  const adjustPreview = useMemo<SoundSelection | null>(
    () => (draft ? { ...draft, startMs: committedStart } : null),
    // volume changes apply live without restarting
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft?.sound.id, committedStart, draft?.soundVolume],
  );
  // Full song while choosing the start point (a cut clip per slider move would be slow)
  useSoundPlayback(adjustPreview, visible && step === 'adjust' && !!adjustPreview, { ignoreMute: true, fullTrack: true });

  const choose = (sound: Sound) => {
    setPreviewId(null);
    setDraft({
      sound,
      startMs: sound.suggestedStartMs,
      soundVolume: 1,
      // A sound replaces the video's own audio
      originalVolume: 0,
    });
    setStep('adjust');
  };

  const close = () => {
    setPreviewId(null);
    onClose();
  };

  // ── Browse ──
  const renderSound = ({ item }: { item: Sound }) => {
    const playing = previewId === item.id;
    return (
      <Pressable
        onPress={() => setPreviewId(playing ? null : item.id)}
        style={[styles.soundRow, { borderBottomColor: colors.border }]}
      >
        <View>
          {item.coverUrl ? (
            <Image source={{ uri: item.coverUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, { backgroundColor: colors.primary + '25', alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="musical-notes" size={22} color={colors.primary} />
            </View>
          )}
          <View style={styles.playBadge}>
            <Ionicons name={playing ? 'pause' : 'play'} size={14} color="#fff" />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontWeight: '700' }} numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>
            {item.artistName}
          </ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
            {formatClock(item.durationMs)} · {GENRE_LABEL[item.genre] ?? item.genre}
            {item.usageCount > 0 ? ` · ${item.usageCount.toLocaleString()} posts` : ''}
          </ThemedText>
        </View>
        <Pressable onPress={() => choose(item)} style={[styles.useBtn, { backgroundColor: colors.primary }]}>
          <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Use</ThemedText>
        </Pressable>
      </Pressable>
    );
  };

  const browse = (
    <>
      <View style={[styles.search, { borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={{ flex: 1, color: colors.text, paddingVertical: 8 }}
          placeholder="Search songs or artists"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tabs}>
        {(['trending', 'new'] as Sort[]).map((key) => (
          <Pressable key={key} onPress={() => setSort(key)} style={[styles.tab, sort === key && { borderBottomColor: colors.primary }]}>
            <ThemedText style={{ fontWeight: '700', color: sort === key ? colors.text : colors.muted }}>
              {key === 'trending' ? 'Trending' : 'New'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genres}>
        {[null, ...SOUND_GENRES].map((g) => {
          const selected = genre === g;
          return (
            <Pressable
              key={g ?? 'all'}
              onPress={() => setGenre(g)}
              style={[styles.genreChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' }]}
            >
              <ThemedText style={{ fontSize: 13, fontWeight: '600', color: selected ? '#fff' : colors.text }}>
                {g ? GENRE_LABEL[g] : 'All'}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>  */}

      {loading && sounds.length === 0 ? (
        <SkeletonGroup label="Loading sounds" style={{ paddingHorizontal: 16 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.soundRow, { borderBottomColor: colors.border }]}>
              <Skeleton width={52} height={52} radius={10} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={13} radius={6} />
                <Skeleton width="40%" height={11} radius={5} />
              </View>
            </View>
          ))}
        </SkeletonGroup>
      ) : (
        <FlatList
          data={sounds}
          keyExtractor={(s) => s.id}
          renderItem={renderSound}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="musical-notes-outline" size={36} color={colors.muted} />
              <ThemedText style={{ color: colors.muted, marginTop: 8, textAlign: 'center' }}>
                {error ?? (query ? 'No sounds match that.' : 'No sounds here yet.')}
              </ThemedText>
            </View>
          }
          ListFooterComponent={
            <Pressable
              onPress={() => {
                close();
                router.push('/(features)/sounds/artist' as any);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 18 }}
            >
              <Ionicons name="mic-outline" size={16} color={colors.primary} />
              <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Are you an artist? Upload your music</ThemedText>
            </Pressable>
          }
        />
      )}
    </>
  );

  // ── Adjust ──
  const adjust = draft && (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        {draft.sound.coverUrl ? (
          <Image source={{ uri: draft.sound.coverUrl }} style={[styles.cover, { width: 72, height: 72 }]} />
        ) : (
          <View style={[styles.cover, { width: 72, height: 72, backgroundColor: colors.primary + '25', alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="musical-notes" size={28} color={colors.primary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontSize: 17, fontWeight: '800' }} numberOfLines={2}>
            {draft.sound.title}
          </ThemedText>
          <ThemedText style={{ color: colors.muted }} numberOfLines={1}>
            {draft.sound.artistName}
          </ThemedText>
          <ThemedText style={{ color: colors.success, fontSize: 12, marginTop: 4 }}>▶ Playing preview</ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.label, { marginTop: 24 }]}>Choose the part to use</ThemedText>
      <ThemedText style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>
        Drag to where the clip starts. It plays {Math.round(SOUND_CLIP_MS / 1000)} seconds from there, on repeat.
      </ThemedText>
      <SimpleSlider
        value={draft.sound.durationMs ? draft.startMs / draft.sound.durationMs : 0}
        windowFraction={draft.sound.durationMs ? SOUND_CLIP_MS / draft.sound.durationMs : 0}
        onChange={(v) => setDraft((d) => (d ? { ...d, startMs: Math.round(v * Math.max(0, d.sound.durationMs - 1000)) } : d))}
        onComplete={(v) => setCommittedStart(Math.round(v * Math.max(0, draft.sound.durationMs - 1000)))}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
          Starts at {formatClock(draft.startMs)}
        </ThemedText>
        <ThemedText style={{ color: colors.muted, fontSize: 12 }}>{formatClock(draft.sound.durationMs)}</ThemedText>
      </View>
      {draft.sound.suggestedStartMs > 0 && draft.startMs !== draft.sound.suggestedStartMs && (
        <Pressable
          onPress={() => {
            setDraft((d) => (d ? { ...d, startMs: d.sound.suggestedStartMs } : d));
            setCommittedStart(draft.sound.suggestedStartMs);
          }}
          style={{ marginTop: 6 }}
        >
          <ThemedText style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
            Use the best part ({formatClock(draft.sound.suggestedStartMs)})
          </ThemedText>
        </Pressable>
      )}

      <ThemedText style={[styles.label, { marginTop: 24 }]}>Sound volume · {Math.round(draft.soundVolume * 100)}%</ThemedText>
      <SimpleSlider value={draft.soundVolume} onChange={(v) => setDraft((d) => (d ? { ...d, soundVolume: Math.round(v * 100) / 100 } : d))} />
      <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
        Videos play with this sound only — their own audio is muted.
      </ThemedText>


      {draft.sound.attribution ? (
        <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 18 }}>{draft.sound.attribution}</ThemedText>
      ) : null}

      <Pressable
        onPress={() => {
          onChange(draft);
          close();
        }}
        style={[styles.doneBtn, { backgroundColor: colors.primary }]}
      >
        <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Use this sound</ThemedText>
      </Pressable>
      <Pressable onPress={() => setStep('browse')} style={{ alignItems: 'center', marginTop: 14 }}>
        <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Choose a different sound</ThemedText>
      </Pressable>
      {value && (
        <Pressable
          onPress={() => {
            onChange(null);
            close();
          }}
          style={{ alignItems: 'center', marginTop: 14 }}
        >
          <ThemedText style={{ color: colors.danger, fontWeight: '700' }}>Remove sound</ThemedText>
        </Pressable>
      )}
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close} presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <Pressable
            onPress={step === 'adjust' && !value ? () => setStep('browse') : close}
            hitSlop={10}
          >
            <Ionicons name={step === 'adjust' && !value ? 'chevron-back' : 'close'} size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={{ fontSize: 17, fontWeight: '800' }}>{step === 'browse' ? 'Add sound' : 'Adjust sound'}</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        {step === 'browse' ? browse : adjust ?? <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginHorizontal: 16 },
  tabs: { flexDirection: 'row', gap: 20, paddingHorizontal: 16, marginTop: 12 },
  tab: { paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  genres: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  genreChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  cover: { width: 52, height: 52, borderRadius: 10 },
  playBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  useBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  doneBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 28 },
});
