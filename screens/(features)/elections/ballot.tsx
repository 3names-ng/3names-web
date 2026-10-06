import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import AuthHeader from '@/components/auth/authHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { showError } from '@/components/ui/toast';
import { BallotSkeleton } from '@/components/elections/electionSkeleton';
import {
  candidateName,
  electionsService,
  type BallotSelection,
  type ElectionCandidate,
  type ElectionDetail,
  type ElectionPosition,
} from '@/service/elections.service';

/** A position on this voter's ballot, with only its approved candidates. */
type BallotPosition = ElectionPosition & { approved: ElectionCandidate[] };

type Stage = 'choose' | 'review' | 'code' | 'done';

export default function BallotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [election, setElection] = useState<ElectionDetail | null>(null);
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<Stage>('choose');
  const [choices, setChoices] = useState<Record<string, BallotSelection>>({});
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!id) return;
    electionsService
      .getDetail(id)
      .then(setElection)
      .catch((err) => {
        showError(err?.response?.data?.message || 'Could not load the ballot');
        setLoadFailed(true);
      });
  }, [id]);

  // Same rule as the server: positions you're eligible for that have approved candidates
  const ballot: BallotPosition[] = useMemo(
    () =>
      (election?.positions ?? [])
        .filter((p) => p.eligible)
        .map((p) => ({ ...p, approved: p.candidates.filter((c) => c.status === 'approved') }))
        .filter((p) => p.approved.length > 0),
    [election],
  );

  if (!election) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <AuthHeader title="Ballot" subtitle="" showBackButton />
        {loadFailed ? (
          <ThemedText style={{ textAlign: 'center', marginTop: 40, paddingHorizontal: 24, color: colors.muted }}>
            The ballot couldn't be loaded. Go back and try again.
          </ThemedText>
        ) : (
          <BallotSkeleton />
        )}
      </SafeAreaView>
    );
  }

  if (election.status !== 'voting' || !election.me.onVoterRoll || election.me.hasVoted) {
    if (stage !== 'done') {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <AuthHeader title="Ballot" subtitle={election.title} showBackButton />
          <ThemedText style={{ textAlign: 'center', marginTop: 40, paddingHorizontal: 24, color: colors.muted }}>
            {election.me.hasVoted ? 'You have already voted in this election.' : 'Voting is not open for you right now.'}
          </ThemedText>
        </SafeAreaView>
      );
    }
  }

  const choose = (selection: BallotSelection) => setChoices((prev) => ({ ...prev, [selection.positionId]: selection }));

  const describeChoice = (p: BallotPosition): string => {
    const c = choices[p.id];
    if (!c) return '—';
    if (c.choice === 'abstain') return 'Abstain';
    if (c.choice === 'yes') return `Yes to ${candidateName(p.approved[0])}`;
    if (c.choice === 'no') return `No to ${candidateName(p.approved[0])}`;
    const cand = p.approved.find((x) => x.id === c.candidateId);
    return cand ? candidateName(cand) : '—';
  };

  const requestCode = async () => {
    setSending(true);
    try {
      const res = await electionsService.requestVoteCode(election.id);
      setMaskedEmail(res.email);
      setStage('code');
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Could not send the code');
    } finally {
      setSending(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await electionsService.castVote(
        election.id,
        code.trim(),
        ballot.map((p) => choices[p.id]),
      );
      setReceipt(res.receiptCode);
      setStage('done');
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Your ballot was not accepted');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Receipt ──
  if (stage === 'done' && receipt) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <ThemedText style={{ fontSize: 22, fontWeight: '800', marginTop: 12 }}>Your vote is in</ThemedText>
          <ThemedText style={{ color: colors.muted, textAlign: 'center', marginTop: 6 }}>
            Save this receipt code — we've also emailed it to you. After results are published you can use it to
            confirm your ballot was counted. It doesn't reveal who you voted for.
          </ThemedText>
          <View style={[styles.receipt, { borderColor: colors.primary }]}>
            <ThemedText selectable style={{ fontSize: 24, fontWeight: '800', letterSpacing: 2 }}>
              {receipt}
            </ThemedText>
          </View>
          <Pressable onPress={() => router.back()} style={[styles.bigBtn, { backgroundColor: colors.primary, alignSelf: 'stretch' }]}>
            <ThemedText style={styles.bigBtnText}>Done</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (ballot.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <AuthHeader title="Ballot" subtitle={election.title} showBackButton />
        <ThemedText style={{ textAlign: 'center', marginTop: 40, paddingHorizontal: 24, color: colors.muted }}>
          There are no positions with candidates on your ballot.
        </ThemedText>
      </SafeAreaView>
    );
  }

  // ── One position at a time ──
  if (stage === 'choose') {
    const p = ballot[step];
    const selected = choices[p.id];
    const uncontested = p.approved.length === 1;
    const isLast = step === ballot.length - 1;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <AuthHeader title={p.title} subtitle={`Position ${step + 1} of ${ballot.length}`} showBackButton />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {p.description ? <ThemedText style={{ color: colors.muted, marginBottom: 12 }}>{p.description}</ThemedText> : null}

          {uncontested ? (
            <>
              <CandidateCard candidate={p.approved[0]} selected={false} onPress={undefined} />
              <ThemedText style={{ fontWeight: '700', marginVertical: 10 }}>
                Only one candidate is standing. Do you want them elected?
              </ThemedText>
              {(['yes', 'no'] as const).map((answer) => (
                <OptionRow
                  key={answer}
                  label={answer === 'yes' ? 'Yes' : 'No'}
                  selected={selected?.choice === answer}
                  onPress={() => choose({ positionId: p.id, choice: answer })}
                />
              ))}
            </>
          ) : (
            p.approved.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                selected={selected?.choice === 'candidate' && selected.candidateId === c.id}
                onPress={() => choose({ positionId: p.id, choice: 'candidate', candidateId: c.id })}
              />
            ))
          )}
          <OptionRow
            label="Abstain (no vote for this position)"
            selected={selected?.choice === 'abstain'}
            onPress={() => choose({ positionId: p.id, choice: 'abstain' })}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {step > 0 && (
              <Pressable onPress={() => setStep(step - 1)} style={[styles.navBtn, { backgroundColor: colors.border }]}>
                <ThemedText style={{ fontWeight: '700' }}>Back</ThemedText>
              </Pressable>
            )}
            <Pressable
              disabled={!selected}
              onPress={() => (isLast ? setStage('review') : setStep(step + 1))}
              style={[styles.navBtn, { flex: 1, backgroundColor: colors.primary, opacity: selected ? 1 : 0.5 }]}
            >
              <ThemedText style={styles.bigBtnText}>{isLast ? 'Review ballot' : 'Next'}</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Review + confirm with code ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthHeader title="Review your ballot" subtitle={election.title} showBackButton />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {ballot.map((p, idx) => (
          <Pressable
            key={p.id}
            disabled={stage === 'code'}
            onPress={() => {
              setStep(idx);
              setStage('choose');
            }}
            style={[styles.reviewRow, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <View style={{ flex: 1 }}>
              <ThemedText style={{ color: colors.muted, fontSize: 12 }}>{p.title}</ThemedText>
              <ThemedText style={{ fontWeight: '700', marginTop: 2 }}>{describeChoice(p)}</ThemedText>
            </View>
            {stage === 'review' && <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Change</ThemedText>}
          </Pressable>
        ))}

        <View style={[styles.warning, { backgroundColor: colors.warning + '18' }]}>
          <Ionicons name="lock-closed" size={16} color={colors.warning} />
          <ThemedText style={{ flex: 1, color: colors.text, fontSize: 13 }}>
            Once submitted, your vote is final and can't be changed. Nobody can see who you voted for.
          </ThemedText>
        </View>

        {stage === 'review' ? (
          <Pressable disabled={sending} onPress={requestCode} style={[styles.bigBtn, { backgroundColor: colors.success, opacity: sending ? 0.6 : 1 }]}>
            <ThemedText style={styles.bigBtnText}>{sending ? 'Sending code…' : 'Confirm with email code'}</ThemedText>
          </Pressable>
        ) : (
          <>
            <ThemedText style={{ marginTop: 16, fontWeight: '700' }}>Enter the 6-digit code sent to {maskedEmail}</ThemedText>
            <TextInput
              style={[styles.codeInput, { borderColor: colors.border, color: colors.text }]}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              placeholderTextColor={colors.muted}
              autoFocus
            />
            <Pressable
              disabled={submitting || code.trim().length !== 6}
              onPress={submit}
              style={[styles.bigBtn, { backgroundColor: colors.success, opacity: submitting || code.trim().length !== 6 ? 0.5 : 1 }]}
            >
              <ThemedText style={styles.bigBtnText}>{submitting ? 'Submitting…' : 'Submit my vote'}</ThemedText>
            </Pressable>
            <Pressable disabled={sending} onPress={requestCode} style={{ alignSelf: 'center', marginTop: 12 }}>
              <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Send a new code</ThemedText>
            </Pressable>
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CandidateCard({
  candidate,
  selected,
  onPress,
}: {
  candidate: ElectionCandidate;
  selected: boolean;
  onPress: (() => void) | undefined;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const name = candidateName(candidate);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.candidateCard,
        { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + '12' : colors.card },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {candidate.user?.profilePictureUrl ? (
          <Image source={{ uri: candidate.user.profilePictureUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary + '25', alignItems: 'center', justifyContent: 'center' }]}>
            <ThemedText style={{ fontWeight: '800', fontSize: 18 }}>{name.charAt(0).toUpperCase()}</ThemedText>
          </View>
        )}
        <ThemedText style={{ flex: 1, fontWeight: '700', fontSize: 16 }}>{name}</ThemedText>
        {onPress && (
          <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={24} color={selected ? colors.primary : colors.muted} />
        )}
      </View>
      <Pressable onPress={() => setExpanded((v) => !v)} style={{ marginTop: 8 }}>
        <ThemedText numberOfLines={expanded ? undefined : 3} style={{ color: colors.muted, lineHeight: 20 }}>
          {candidate.manifesto}
        </ThemedText>
        <ThemedText style={{ color: colors.primary, fontSize: 12, marginTop: 4 }}>
          {expanded ? 'Show less' : 'Read manifesto'}
        </ThemedText>
      </Pressable>
    </Pressable>
  );
}

function OptionRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionRow,
        { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + '12' : colors.card },
      ]}
    >
      <ThemedText style={{ flex: 1, fontWeight: '600' }}>{label}</ThemedText>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.primary : colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  candidateCard: { borderWidth: 2, borderRadius: 14, padding: 14, marginBottom: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 12, padding: 14, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  navBtn: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center' },
  bigBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  warning: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 10, marginTop: 8 },
  codeInput: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: 12,
    fontSize: 26,
    letterSpacing: 10,
    textAlign: 'center',
    fontWeight: '700',
  },
  receipt: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, marginTop: 20 },
});
