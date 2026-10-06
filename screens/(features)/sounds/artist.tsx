import React, { useCallback, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import AuthHeader from '@/components/auth/authHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { showError, showSuccess } from '@/components/ui/toast';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import {
  GENRE_LABEL,
  SOUND_GENRES,
  formatClock,
  soundService,
  type Sound,
  type SoundGenre,
  type SoundStatus,
} from '@/service/sound.service';

const MAX_BYTES = 25 * 1024 * 1024;

const STATUS_LABEL: Record<SoundStatus, string> = {
  pending: 'In review',
  approved: 'Live',
  rejected: 'Not approved',
  taken_down: 'Taken down',
};

/** "1:05" or "65" → ms; empty → 0; invalid → null */
function parseStart(text: string): number | null {
  const t = text.trim();
  if (!t) return 0;
  const m = /^(\d+):([0-5]?\d)$/.exec(t);
  if (m) return (Number(m[1]) * 60 + Number(m[2])) * 1000;
  if (/^\d+$/.test(t)) return Number(t) * 1000;
  return null;
}

/**
 * Artist portal: independent artists upload songs they own so students can
 * use them on posts and stories. Every upload is reviewed by an admin first.
 */
export default function ArtistUploadScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const statusColor: Record<SoundStatus, string> = {
    pending: colors.warning,
    approved: colors.success,
    rejected: colors.danger,
    taken_down: colors.danger,
  };

  const [audio, setAudio] = useState<{ uri: string; name: string; type: string; size?: number } | null>(null);
  const [cover, setCover] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState(user?.username ?? '');
  const [genre, setGenre] = useState<SoundGenre>('afrobeats');
  const [tags, setTags] = useState('');
  const [start, setStart] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [mine, setMine] = useState<Sound[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMine = useCallback(async () => {
    try {
      setMine(await soundService.mine());
    } catch {
      setMine([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMine();
    }, [loadMine]),
  );

  const pickAudio = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets?.[0]) return;
    const file = res.assets[0];
    if (file.size && file.size > MAX_BYTES) {
      showError('That file is over 25MB. Export it as an MP3 or M4A and try again.');
      return;
    }
    setAudio({
      uri: file.uri,
      name: file.name || `song-${Date.now()}.mp3`,
      type: file.mimeType || 'audio/mpeg',
      size: file.size,
    });
    // Suggest a title from the file name
    if (!title.trim() && file.name) setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 150));
  };

  const pickCover = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    const ext = (a.fileName?.split('.').pop() || 'jpg').toLowerCase();
    setCover({
      uri: a.uri,
      name: a.fileName || `cover-${Date.now()}.${ext}`,
      type: a.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg'),
    });
  };

  const submit = async () => {
    if (!audio) return showError('Choose the song file');
    if (!title.trim()) return showError('Add the song title');
    if (!artistName.trim()) return showError('Add the artist name');
    const startMs = parseStart(start);
    if (startMs === null) return showError('Best part start must look like 1:05');
    if (!accepted) return showError('Confirm you own this song');

    setUploading(true);
    try {
      await soundService.artistUpload({
        audio,
        cover,
        title: title.trim(),
        artistName: artistName.trim(),
        genre,
        tags,
        suggestedStartMs: startMs,
      });
      showSuccess('Uploaded! Our team will review it shortly.');
      setAudio(null);
      setCover(null);
      setTitle('');
      setTags('');
      setStart('');
      setAccepted(false);
      loadMine();
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Upload failed — please try again');
    } finally {
      setUploading(false);
    }
  };

  const input = [styles.input, { borderColor: colors.border, color: colors.text }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthHeader title="Upload your music" subtitle="Get your songs on 3NAMES posts and stories" showBackButton />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMine(); }} />}
        >
          <View style={[styles.intro, { backgroundColor: colors.primary + '14' }]}>
            <Ionicons name="musical-notes" size={20} color={colors.primary} />
            <ThemedText style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>
              Upload songs you own. Once approved, students can put them on their posts and stories, and you’ll see how
              many people use them.
            </ThemedText>
          </View>

          {/* Song file */}
          <ThemedText style={styles.label}>Song file</ThemedText>
          <Pressable onPress={pickAudio} style={[styles.picker, { borderColor: audio ? colors.primary : colors.border }]}>
            <Ionicons name={audio ? 'checkmark-circle' : 'cloud-upload-outline'} size={22} color={audio ? colors.primary : colors.muted} />
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontWeight: '600' }} numberOfLines={1}>
                {audio ? audio.name : 'Choose an MP3, M4A or WAV file'}
              </ThemedText>
              <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
                {audio?.size ? `${(audio.size / 1024 / 1024).toFixed(1)} MB` : 'Up to 25MB, 5 seconds to 10 minutes'}
              </ThemedText>
            </View>
          </Pressable>

          {/* Cover */}
          <ThemedText style={styles.label}>Cover art (optional)</ThemedText>
          <Pressable onPress={pickCover} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {cover ? (
              <Image source={{ uri: cover.uri }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, { borderColor: colors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="image-outline" size={26} color={colors.muted} />
              </View>
            )}
            <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>{cover ? 'Change cover' : 'Add a square cover'}</ThemedText>
          </Pressable>

          <ThemedText style={styles.label}>Song title</ThemedText>
          <TextInput style={input} value={title} onChangeText={setTitle} maxLength={150} placeholder="e.g. Campus Love" placeholderTextColor={colors.muted} />

          <ThemedText style={styles.label}>Artist name</ThemedText>
          <TextInput style={input} value={artistName} onChangeText={setArtistName} maxLength={150} placeholder="Your stage name" placeholderTextColor={colors.muted} />

          <ThemedText style={styles.label}>Genre</ThemedText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SOUND_GENRES.map((g) => {
              const selected = genre === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => setGenre(g)}
                  style={[styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' }]}
                >
                  <ThemedText style={{ fontSize: 13, fontWeight: '600', color: selected ? '#fff' : colors.text }}>{GENRE_LABEL[g]}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText style={styles.label}>Tags (optional)</ThemedText>
          <TextInput style={input} value={tags} onChangeText={setTags} placeholder="love, campus, dance" placeholderTextColor={colors.muted} autoCapitalize="none" />

          <ThemedText style={styles.label}>Where the best part starts (optional)</ThemedText>
          <TextInput style={input} value={start} onChangeText={setStart} placeholder="e.g. 0:45" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" />

          {/* Rights */}
          <Pressable onPress={() => setAccepted((v) => !v)} style={[styles.terms, { borderColor: accepted ? colors.primary : colors.border }]}>
            <Ionicons name={accepted ? 'checkbox' : 'square-outline'} size={22} color={accepted ? colors.primary : colors.muted} />
            <ThemedText style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>
              I own this song (or have the right to share it), it doesn’t use anyone else’s music without permission, and I
              allow 3NAMES users to put it on their posts and stories. I understand it can be taken down if this isn’t true.
            </ThemedText>
          </Pressable>

          <Pressable
            disabled={uploading}
            onPress={submit}
            style={[styles.submit, { backgroundColor: colors.primary, opacity: uploading || !accepted || !audio ? 0.6 : 1 }]}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{uploading ? 'Uploading…' : 'Submit for review'}</ThemedText>
          </Pressable>

          {/* My uploads */}
          <ThemedText style={[styles.label, { marginTop: 32, fontSize: 16 }]}>Your uploads</ThemedText>
          {mine === null ? (
            <SkeletonGroup label="Loading your uploads">
              {[0, 1].map((i) => (
                <View key={i} style={[styles.mineRow, { borderColor: colors.border }]}>
                  <Skeleton width={48} height={48} radius={8} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="60%" height={13} radius={6} />
                    <Skeleton width="30%" height={11} radius={5} />
                  </View>
                </View>
              ))}
            </SkeletonGroup>
          ) : mine.length === 0 ? (
            <ThemedText style={{ color: colors.muted }}>Nothing yet — your songs will show here with their review status.</ThemedText>
          ) : (
            mine.map((s) => (
              <View key={s.id} style={[styles.mineRow, { borderColor: colors.border }]}>
                {s.coverUrl ? (
                  <Image source={{ uri: s.coverUrl }} style={{ width: 48, height: 48, borderRadius: 8 }} />
                ) : (
                  <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: colors.primary + '25', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="musical-notes" size={20} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontWeight: '700' }} numberOfLines={1}>{s.title}</ThemedText>
                  <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
                    {formatClock(s.durationMs)}
                    {s.status === 'approved' ? ` · used in ${s.usageCount.toLocaleString()} ${s.usageCount === 1 ? 'post' : 'posts'}` : ''}
                  </ThemedText>
                  {s.reviewNote && (s.status === 'rejected' || s.status === 'taken_down') ? (
                    <ThemedText style={{ color: colors.danger, fontSize: 12, marginTop: 2 }}>{s.reviewNote}</ThemedText>
                  ) : null}
                </View>
                <View style={[styles.badge, { backgroundColor: statusColor[s.status] + '20' }]}>
                  <ThemedText style={{ color: statusColor[s.status], fontSize: 11, fontWeight: '700' }}>{STATUS_LABEL[s.status]}</ThemedText>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '700', marginTop: 18, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 14 },
  cover: { width: 72, height: 72, borderRadius: 10 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  terms: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 22 },
  submit: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 18 },
  mineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});
