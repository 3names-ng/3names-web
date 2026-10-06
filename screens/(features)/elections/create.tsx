import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import AuthHeader from '@/components/auth/authHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { showError, showSuccess } from '@/components/ui/toast';
import { ElectionFormSkeleton } from '@/components/elections/electionSkeleton';
import { electionsService, formatElectionDate, type ElectionStatus } from '@/service/elections.service';

type DateKey = 'nominationsOpenAt' | 'nominationsCloseAt' | 'votingOpenAt' | 'votingCloseAt';

const STAGE_ORDER: ElectionStatus[] = [
  'draft',
  'rejected',
  'pending_approval',
  'approved',
  'nominations',
  'campaign',
  'voting',
  'closed',
  'results_published',
  'certified',
];
/** The stage each date moves the election into */
const DATE_STEP: Record<DateKey, ElectionStatus> = {
  nominationsOpenAt: 'nominations',
  nominationsCloseAt: 'campaign',
  votingOpenAt: 'voting',
  votingCloseAt: 'closed',
};

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

/** Date + time picker row. Android shows the date dialog, then the time dialog. */
function DateTimeField({
  label,
  hint,
  value,
  onChange,
  locked,
}: {
  label: string;
  hint: string;
  value: Date;
  onChange: (d: Date) => void;
  /** Already happened — shown, but can't be changed */
  locked?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const [mode, setMode] = useState<'date' | 'time' | null>(null);

  if (locked) {
    return (
      <View style={styles.field}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <ThemedText style={[styles.hint, { color: colors.muted }]}>Already happened — can't be changed</ThemedText>
        <View style={[styles.input, { borderColor: colors.border, justifyContent: 'center', opacity: 0.6 }]}>
          <ThemedText>{formatElectionDate(value.toISOString())}</ThemedText>
        </View>
      </View>
    );
  }

  const handle = (event: DateTimePickerEvent, picked?: Date) => {
    if (event.type !== 'set' || !picked) {
      setMode(null);
      return;
    }
    const next = new Date(value);
    if (mode === 'date') {
      next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      onChange(next);
      // Android: chain into the time dialog
      setMode(Platform.OS === 'android' ? 'time' : 'date');
    } else {
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      onChange(next);
      setMode(Platform.OS === 'android' ? null : 'time');
    }
  };

  return (
    <View style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={[styles.hint, { color: colors.muted }]}>{hint}</ThemedText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => setMode('date')}
          style={[styles.input, { flex: 1, borderColor: colors.border, justifyContent: 'center' }]}
        >
          <ThemedText>{formatElectionDate(value.toISOString())}</ThemedText>
        </Pressable>
        {Platform.OS === 'ios' && (
          <Pressable
            onPress={() => setMode(mode === 'time' ? null : 'time')}
            style={[styles.input, { borderColor: colors.border, justifyContent: 'center' }]}
          >
            <ThemedText>Time</ThemedText>
          </Pressable>
        )}
      </View>
      {mode && (
        <View>
          {Platform.OS === 'ios' && (
            <Pressable onPress={() => setMode(null)} style={{ alignSelf: 'flex-end', padding: 6 }}>
              <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Done</ThemedText>
            </Pressable>
          )}
          <DateTimePicker
            value={value}
            mode={mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={mode === 'date' ? new Date() : undefined}
            onChange={handle}
            themeVariant={isDark ? 'dark' : 'light'}
          />
        </View>
      )}
    </View>
  );
}

/** Creates a draft, or — with an `id` param — edits a draft or sent-back election. */
export default function CreateElectionScreen() {
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const now = Date.now();
  // Sensible defaults: nominations in a day for 3 days, campaign 2 days, voting 1 day
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [nominationsOpenAt, setNominationsOpenAt] = useState(new Date(now + DAY));
  const [nominationsCloseAt, setNominationsCloseAt] = useState(new Date(now + 4 * DAY));
  const [votingOpenAt, setVotingOpenAt] = useState(new Date(now + 6 * DAY));
  const [votingCloseAt, setVotingCloseAt] = useState(new Date(now + 7 * DAY));
  const [challengeHours, setChallengeHours] = useState('48');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [status, setStatus] = useState<ElectionStatus | null>(null);
  // Saved dates, to tell which ones have already happened
  const [saved, setSaved] = useState<Record<DateKey, number> | null>(null);

  const running = !!status && !['draft', 'rejected', 'pending_approval'].includes(status);
  // Same rule as the server: a date is locked once the stage it starts has happened
  const isLocked = (key: DateKey) => !!status && STAGE_ORDER.indexOf(status) >= STAGE_ORDER.indexOf(DATE_STEP[key]);

  useEffect(() => {
    if (!editId) return;
    electionsService
      .getDetail(editId)
      .then((e) => {
        setTitle(e.title);
        setDescription(e.description ?? '');
        setNominationsOpenAt(new Date(e.nominationsOpenAt));
        setNominationsCloseAt(new Date(e.nominationsCloseAt));
        setVotingOpenAt(new Date(e.votingOpenAt));
        setVotingCloseAt(new Date(e.votingCloseAt));
        setChallengeHours(String(e.challengeHours));
        setStatus(e.status);
        setSaved({
          nominationsOpenAt: new Date(e.nominationsOpenAt).getTime(),
          nominationsCloseAt: new Date(e.nominationsCloseAt).getTime(),
          votingOpenAt: new Date(e.votingOpenAt).getTime(),
          votingCloseAt: new Date(e.votingCloseAt).getTime(),
        });
      })
      .catch((err: any) => {
        showError(err?.response?.data?.message || 'Could not load the election');
        router.back();
      })
      .finally(() => setLoading(false));
  }, [editId]);

  const validate = (): string | null => {
    if (title.trim().length < 3) return 'Give the election a title';
    // Dates that haven't happened yet must stay in the future
    const now = Date.now();
    const dates: [DateKey, Date, string][] = [
      ['nominationsOpenAt', nominationsOpenAt, 'Nominations must open in the future'],
      ['nominationsCloseAt', nominationsCloseAt, 'Nominations must close in the future'],
      ['votingOpenAt', votingOpenAt, 'Voting must open in the future'],
      ['votingCloseAt', votingCloseAt, 'Voting must close in the future'],
    ];
    for (const [key, value, message] of dates) {
      // Unchanged dates are left as they are (the server ignores them too)
      const unchanged = !!saved && saved[key] === value.getTime();
      if (!isLocked(key) && !unchanged && value.getTime() <= now) return message;
    }
    if (nominationsCloseAt <= nominationsOpenAt) return 'Nominations must close after they open';
    if (votingOpenAt < nominationsCloseAt) return 'Voting cannot open before nominations close';
    if (votingCloseAt <= votingOpenAt) return 'Voting must close after it opens';
    const hours = Number(challengeHours);
    if (!Number.isInteger(hours) || hours < 0 || hours > 336) return 'Challenge window must be 0–336 hours';
    return null;
  };

  const handleCreate = async () => {
    const problem = validate();
    if (problem) {
      showError(problem);
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      nominationsOpenAt: nominationsOpenAt.toISOString(),
      nominationsCloseAt: nominationsCloseAt.toISOString(),
      votingOpenAt: votingOpenAt.toISOString(),
      votingCloseAt: votingCloseAt.toISOString(),
      challengeHours: Number(challengeHours),
    };
    try {
      if (editId) {
        // An empty string clears the description on the server
        await electionsService.update(editId, { ...payload, description: description.trim() });
        showSuccess('Election updated');
        router.back();
      } else {
        const election = await electionsService.create({ ...payload, description: description.trim() || undefined });
        showSuccess('Draft created. Now add the positions.');
        router.replace({ pathname: '/(features)/elections/[id]', params: { id: election.id } } as any);
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || (editId ? 'Could not save the changes' : 'Could not create the election'));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.text }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthHeader
        title={editId ? 'Edit election' : 'New election'}
        subtitle={
          !editId
            ? 'Set it up, then submit it for approval'
            : running
              ? 'Dates for stages that have happened are locked'
              : 'Change the details, then submit for approval'
        }
        showBackButton
      />
      {loading ? (
        <ElectionFormSkeleton />
      ) : (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <ThemedText style={styles.label}>Title</ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="e.g. SUG General Elections 2026"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={150}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Description (optional)</ThemedText>
            <TextInput
              style={[...inputStyle, { minHeight: 90, textAlignVertical: 'top' }]}
              placeholder="Rules, eligibility, who is on the electoral committee…"
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={5000}
            />
          </View>

          <DateTimeField
            label="Nominations open"
            hint="Students can start applying to run"
            value={nominationsOpenAt}
            onChange={setNominationsOpenAt}
            locked={isLocked('nominationsOpenAt')}
          />
          <DateTimeField
            label="Nominations close"
            hint="Campaigning starts; you can still screen candidates until voting opens"
            value={nominationsCloseAt}
            onChange={setNominationsCloseAt}
            locked={isLocked('nominationsCloseAt')}
          />
          <DateTimeField
            label="Voting opens"
            hint="The voter list is frozen at this moment"
            value={votingOpenAt}
            onChange={setVotingOpenAt}
            locked={isLocked('votingOpenAt')}
          />
          <DateTimeField
            label="Voting closes"
            hint="No ballots accepted after this"
            value={votingCloseAt}
            onChange={setVotingCloseAt}
            locked={isLocked('votingCloseAt')}
          />

          <View style={styles.field}>
            <ThemedText style={styles.label}>Challenge window (hours)</ThemedText>
            <ThemedText style={[styles.hint, { color: colors.muted }]}>
              How long after results are published they can be challenged before being certified
            </ThemedText>
            <TextInput
              style={inputStyle}
              keyboardType="number-pad"
              value={challengeHours}
              onChangeText={setChallengeHours}
              maxLength={3}
            />
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={saving}
            style={[styles.submit, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
          >
            <ThemedText style={styles.submitText}>
              {editId ? (saving ? 'Saving…' : 'Save changes') : saving ? 'Creating…' : 'Create draft'}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  hint: { fontSize: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, minHeight: 44 },
  submit: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
