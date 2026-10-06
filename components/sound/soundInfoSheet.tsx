import React, { useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ui/ThemedText';
import { showError, showSuccess } from '@/components/ui/toast';
import { useTheme } from '@/hooks/useTheme';
import { usePendingSoundStore, type PendingSoundTarget } from '@/store/pendingSoundStore';
import {
  GENRE_LABEL,
  formatClock,
  soundService,
  type Sound,
  type SoundReportReason,
} from '@/service/sound.service';

/** Roughly how long a modal takes to animate closed */
const MODAL_CLOSE_MS = 400;

const REASONS:{ key: SoundReportReason; label: string }[] = [
  { key: 'copyright', label: 'Copyright — I own this or it isn’t theirs' },
  { key: 'offensive', label: 'Offensive or harmful' },
  { key: 'wrong_info', label: 'Wrong title or artist' },
  { key: 'other', label: 'Something else' },
];

/** Bottom sheet for a post/story sound: what it is, credit, "use this sound" and reporting. */
export default function SoundInfoSheet({
  sound,
  startMs,
  visible,
  onClose,
  beforeUse,
}: {
  sound: Sound | null;
  /** Where the post/story started the track — a new post using it starts there too */
  startMs?: number;
  visible: boolean;
  onClose: () => void;
  /** Called before leaving for the camera, e.g. to close a story viewer */
  beforeUse?: () => void;
}) {
  const { colors } = useTheme();
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<SoundReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  // Where "use this sound" is heading, while the sheet closes
  const useTarget = useRef<PendingSoundTarget | null>(null);

  const close = () => {
    setReporting(false);
    setReason(null);
    setDetails('');
    onClose();
  };

  const submitReport = async () => {
    if (!sound || !reason) return;
    setSending(true);
    try {
      await soundService.report(sound.id, reason, details.trim());
      showSuccess('Thanks — our team will review this sound');
      close();
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Could not send the report');
    } finally {
      setSending(false);
    }
  };

  // Opens the post camera, or the "Create Story" sheet, with this sound already picked
  const pickSound = (target: PendingSoundTarget) => {
    if (!sound) return;
    usePendingSoundStore.getState().setPending(
      {
        sound,
        startMs: startMs ?? sound.suggestedStartMs ?? 0,
        soundVolume: 1,
        // The new video's own audio is muted under the sound
        originalVolume: 0,
      },
      target,
    );
    // Navigating while a modal is still animating closed leaves an invisible
    // modal window over the app on iOS that swallows every touch (the app looks
    // frozen). So close this sheet first and only leave once it's gone.
    useTarget.current = target;
    close();
    if (Platform.OS !== 'ios') setTimeout(leaveForCamera, MODAL_CLOSE_MS);
  };

  // Runs once the sheet has closed (onDismiss on iOS, a timer elsewhere)
  const leaveForCamera = () => {
    const target = useTarget.current;
    useTarget.current = null;
    if (!target) return;
    const open = () => {
      if (target === 'post') {
        router.push('/(tabs)/explore');
        return;
      }
      // The full "Create Story" flow (camera/media or text) lives in the story rail
      router.navigate('/(tabs)/chatListScreen' as any);
      usePendingSoundStore.getState().requestStoryChooser();
    };
    if (beforeUse) {
      // e.g. the story viewer — itself a modal, so let it close too
      beforeUse();
      setTimeout(open, MODAL_CLOSE_MS);
    } else {
      open();
    }
  };

  if (!sound) return null;
  // Sounds being reviewed or taken down can't be picked for new posts
  const usable = !sound.status || sound.status === 'approved';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
      onDismiss={Platform.OS === 'ios' ? leaveForCamera : undefined}
    >
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          {sound.coverUrl ? (
            <Image source={{ uri: sound.coverUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, { backgroundColor: colors.primary + '30', alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="musical-notes" size={28} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 17, fontWeight: '800' }} numberOfLines={2}>
              {sound.title}
            </ThemedText>
            <ThemedText style={{ color: colors.muted, marginTop: 2 }} numberOfLines={1}>
              {sound.artistName}
            </ThemedText>
            <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
              {GENRE_LABEL[sound.genre] ?? sound.genre} · {formatClock(sound.durationMs)} ·{' '}
              {sound.usageCount.toLocaleString()} {sound.usageCount === 1 ? 'post' : 'posts'}
            </ThemedText>
          </View>
        </View>

        {sound.attribution ? (
          <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>{sound.attribution}</ThemedText>
        ) : null}

        {!reporting ? (
          <>
            {usable && (
              <View style={styles.useRow}>
                <Pressable onPress={() => pickSound('post')} style={[styles.useBtn, { backgroundColor: colors.primary }]}>
                  <Ionicons name="videocam" size={18} color="#fff" />
                  <ThemedText style={{ color: '#fff', fontWeight: '800' }}>Use this sound</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => pickSound('story')}
                  style={[styles.useBtn, styles.storyBtn, { borderColor: colors.border }]}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.text} />
                  <ThemedText style={{ fontWeight: '700' }}>Story</ThemedText>
                </Pressable>
              </View>
            )}
            <Pressable
              onPress={() => {
                close();
                router.push('/(features)/sounds/artist' as any);
              }}
              style={[styles.row, { borderColor: colors.border }]}
            >
              <Ionicons name="mic-outline" size={20} color={colors.text} />
              <ThemedText style={{ flex: 1, fontWeight: '600' }}>Are you an artist? Upload your music</ThemedText>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
            <Pressable onPress={() => setReporting(true)} style={[styles.row, { borderColor: colors.border }]}>
              <Ionicons name="flag-outline" size={20} color={colors.danger} />
              <ThemedText style={{ flex: 1, fontWeight: '600', color: colors.danger }}>Report sound</ThemedText>
            </Pressable>
          </>
        ) : (
          <View style={{ marginTop: 14 }}>
            <ThemedText style={{ fontWeight: '700', marginBottom: 8 }}>Why are you reporting this sound?</ThemedText>
            {REASONS.map((r) => (
              <Pressable
                key={r.key}
                onPress={() => setReason(r.key)}
                style={[styles.reason, { borderColor: reason === r.key ? colors.primary : colors.border }]}
              >
                <Ionicons
                  name={reason === r.key ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={reason === r.key ? colors.primary : colors.muted}
                />
                <ThemedText style={{ flex: 1 }}>{r.label}</ThemedText>
              </Pressable>
            ))}
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Anything that helps us check (optional)"
              placeholderTextColor={colors.muted}
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={500}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pressable onPress={() => setReporting(false)} style={[styles.btn, { backgroundColor: colors.border, flex: 1 }]}>
                <ThemedText style={{ fontWeight: '700' }}>Back</ThemedText>
              </Pressable>
              <Pressable
                disabled={!reason || sending}
                onPress={submitReport}
                style={[styles.btn, { backgroundColor: colors.danger, flex: 1, opacity: !reason || sending ? 0.5 : 1 }]}
              >
                <ThemedText style={{ color: '#fff', fontWeight: '700' }}>{sending ? 'Sending…' : 'Report'}</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 34 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  cover: { width: 64, height: 64, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 60, textAlignVertical: 'top', marginTop: 4 },
  btn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  useRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  useBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12 },
  storyBtn: { flex: 0, paddingHorizontal: 18, borderWidth: 1 },
});
