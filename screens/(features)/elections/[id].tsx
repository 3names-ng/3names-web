import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import AuthHeader from '@/components/auth/authHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { showError, showSuccess } from '@/components/ui/toast';
import { ElectionDetailSkeleton, StudentSearchSkeleton } from '@/components/elections/electionSkeleton';
import { schoolService } from '@/service/sch.service';
import {
  candidateName,
  electionsService,
  ELECTION_STATUS_COLOR,
  ELECTION_STATUS_LABEL,
  formatElectionDate,
  type CommitteeEntry,
  type ElectionCandidate,
  type ElectionDetail,
  type PositionResult,
  type PositionScope,
  type ReceiptCheck,
  type ReceiptSelection,
  type StudentSearchResult,
} from '@/service/elections.service';

type Option = { id: string; name: string };

export default function ElectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [election, setElection] = useState<ElectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setElection(await electionsService.getDetail(id));
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Could not load the election');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  /** Run a committee/candidate action, then reload. */
  const run = async (action: () => Promise<unknown>, success: string): Promise<boolean> => {
    setBusy(true);
    try {
      await action();
      showSuccess(success);
      await load();
      return true;
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Something went wrong');
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (loading || !election) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <AuthHeader title="Election" subtitle="" showBackButton />
        {loading ? (
          <ElectionDetailSkeleton />
        ) : (
          <ThemedText style={{ textAlign: 'center', marginTop: 40, color: colors.muted }}>Election not found</ThemedText>
        )}
      </SafeAreaView>
    );
  }

  const s = election.status;
  const me = election.me;
  const editable = me.isCommittee && (s === 'draft' || s === 'rejected');
  const screening = s === 'nominations' || s === 'campaign';
  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthHeader title={election.title} subtitle={ELECTION_STATUS_LABEL[s]} showBackButton />
      {/* Keeps the receipt check and committee inputs above the keyboard */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {/* Status + timeline */}
        <View style={cardStyle}>
          <View style={[styles.badge, { backgroundColor: ELECTION_STATUS_COLOR[s] + '20', alignSelf: 'flex-start' }]}>
            <ThemedText style={[styles.badgeText, { color: ELECTION_STATUS_COLOR[s] }]}>{ELECTION_STATUS_LABEL[s]}</ThemedText>
          </View>
          {election.description ? (
            <ThemedText style={{ marginTop: 10, lineHeight: 20 }}>{election.description}</ThemedText>
          ) : null}
          <View style={{ marginTop: 12, gap: 6 }}>
            <TimelineRow label="Nominations" value={`${formatElectionDate(election.nominationsOpenAt)} – ${formatElectionDate(election.nominationsCloseAt)}`} />
            <TimelineRow label="Voting" value={`${formatElectionDate(election.votingOpenAt)} – ${formatElectionDate(election.votingCloseAt)}`} />
            {election.challengeEndsAt && (
              <TimelineRow label="Challenges until" value={formatElectionDate(election.challengeEndsAt)} />
            )}
          </View>
          {s === 'rejected' && election.rejectionReason && (
            <View style={[styles.notice, { backgroundColor: colors.danger + '15' }]}>
              <ThemedText style={{ color: colors.danger, fontWeight: '700' }}>Sent back by admin</ThemedText>
              <ThemedText style={{ color: colors.danger, marginTop: 2 }}>{election.rejectionReason}</ThemedText>
            </View>
          )}
        </View>

        {/* Turnout (never vote counts while voting is open) */}
        {election.turnout && (
          <View style={cardStyle}>
            <ThemedText style={styles.cardTitle}>Turnout</ThemedText>
            <ThemedText style={{ fontSize: 22, fontWeight: '800', marginTop: 4 }}>
              {election.turnout.voted.toLocaleString()}
              <ThemedText style={{ color: colors.muted, fontSize: 15, fontWeight: '600' }}>
                {' '}of {election.turnout.eligible.toLocaleString()} have voted
              </ThemedText>
            </ThemedText>
            <ProgressBar value={election.turnout.eligible ? election.turnout.voted / election.turnout.eligible : 0} />
          </View>
        )}

        {/* The student's own part — committee members vote too; only the chair account doesn't */}
        {!me.isChair && <MyPart election={election} run={run} busy={busy} />}

        {/* Who is running the election */}
        <CommitteeCard election={election} run={run} busy={busy} />


        {/* Committee tools */}
        {me.isCommittee && (
          <CommitteePanel election={election} schoolId={user?.schoolId ?? null} run={run} busy={busy} />
        )}

        {/* Results or positions */}
        {election.results ? (
          <ResultsSection election={election} />
        ) : (
          <>
            <ThemedText style={styles.sectionTitle}>Positions</ThemedText>
            {election.positions.length === 0 && (
              <ThemedText style={{ color: colors.muted, marginBottom: 12 }}>No positions yet.</ThemedText>
            )}
            {election.positions.map((p) => (
              <View key={p.id} style={cardStyle}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.cardTitle}>{p.title}</ThemedText>
                    <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                      {p.scope === 'school' ? 'Whole school votes' : p.scope === 'faculty' ? 'Faculty position' : 'Department position'}
                      {!me.isCommittee && !p.eligible ? ' · not on your ballot' : ''}
                    </ThemedText>
                  </View>
                  {editable && (
                    <Pressable
                      onPress={() => run(() => electionsService.removePosition(election.id, p.id), 'Position removed')}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                  )}
                </View>
                {p.description ? <ThemedText style={{ marginTop: 6, color: colors.muted }}>{p.description}</ThemedText> : null}
                {p.candidates.length === 0 ? (
                  <ThemedText style={{ marginTop: 10, color: colors.muted, fontSize: 13 }}>No candidates yet</ThemedText>
                ) : (
                  p.candidates.map((c) => (
                    <CandidateRow
                      key={c.id}
                      candidate={c}
                      canScreen={me.isCommittee && screening && c.status === 'pending'}
                      onApprove={() => run(() => electionsService.approveCandidate(election.id, c.id), 'Candidate approved')}
                      onReject={(reason) => run(() => electionsService.rejectCandidate(election.id, c.id, reason), 'Candidate rejected')}
                      showStatus={me.isCommittee || c.userId === user?.id}
                    />
                  ))
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Pieces ──

function TimelineRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <ThemedText style={{ color: colors.muted, fontSize: 13 }}>{label}</ThemedText>
      <ThemedText style={{ fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{value}</ThemedText>
    </View>
  );
}

function ProgressBar({ value }: { value: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, marginTop: 10, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, Math.round(value * 100))}%`, height: 8, backgroundColor: colors.success }} />
    </View>
  );
}

function CandidateRow({
  candidate,
  canScreen,
  showStatus,
  onApprove,
  onReject,
}: {
  candidate: ElectionCandidate;
  canScreen: boolean;
  showStatus: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const name = candidateName(candidate);
  const statusColor =
    candidate.status === 'approved' ? colors.success : candidate.status === 'pending' ? colors.warning : colors.danger;

  return (
    <View style={[styles.candidate, { borderTopColor: colors.border }]}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {candidate.user?.profilePictureUrl ? (
          <Image source={{ uri: candidate.user.profilePictureUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary + '25', alignItems: 'center', justifyContent: 'center' }]}>
            <ThemedText style={{ fontWeight: '700' }}>{name.charAt(0).toUpperCase()}</ThemedText>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontWeight: '700' }}>{name}</ThemedText>
          {showStatus && (
            <ThemedText style={{ color: statusColor, fontSize: 12, textTransform: 'capitalize' }}>{candidate.status}</ThemedText>
          )}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {expanded && (
        <ThemedText style={{ marginTop: 8, lineHeight: 20 }}>{candidate.manifesto}</ThemedText>
      )}
      {showStatus && candidate.rejectionReason && (
        <ThemedText style={{ marginTop: 6, color: colors.danger, fontSize: 12 }}>{candidate.rejectionReason}</ThemedText>
      )}
      {canScreen && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Pressable onPress={onApprove} style={[styles.smallBtn, { backgroundColor: colors.success }]}>
            <ThemedText style={styles.smallBtnText}>Approve</ThemedText>
          </Pressable>
          <Pressable onPress={() => setRejecting(true)} style={[styles.smallBtn, { backgroundColor: colors.danger }]}>
            <ThemedText style={styles.smallBtnText}>Reject</ThemedText>
          </Pressable>
        </View>
      )}
      <Modal visible={rejecting} transparent animationType="fade" onRequestClose={() => setRejecting(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.cardTitle}>Reject {name}?</ThemedText>
            <ThemedText style={{ color: colors.muted, marginTop: 4, marginBottom: 10 }}>
              The candidate will see this reason.
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Reason"
              placeholderTextColor={colors.muted}
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={500}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pressable onPress={() => setRejecting(false)} style={[styles.smallBtn, { backgroundColor: colors.border, flex: 1 }]}>
                <ThemedText style={{ fontWeight: '700' }}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                disabled={reason.trim().length < 3}
                onPress={() => {
                  setRejecting(false);
                  onReject(reason.trim());
                }}
                style={[styles.smallBtn, { backgroundColor: colors.danger, flex: 1, opacity: reason.trim().length < 3 ? 0.5 : 1 }]}
              >
                <ThemedText style={styles.smallBtnText}>Reject</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** A student's own status: their candidacy (the committee registers candidates) and voting. */
function MyPart({
  election,
  run,
  busy,
}: {
  election: ElectionDetail;
  run: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
  busy: boolean;
}) {
  const { colors } = useTheme();
  const s = election.status;
  const me = election.me;
  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];
  const activeCandidacy = me.candidacy && me.candidacy.status !== 'withdrawn' ? me.candidacy : null;

  const [editingManifesto, setEditingManifesto] = useState(false);
  const [manifestoDraft, setManifestoDraft] = useState('');
  const [showFullManifesto, setShowFullManifesto] = useState(false);

  const confirmWithdraw = () =>
    Alert.alert('Withdraw your candidacy?', 'Only the electoral committee can put you back on the ballot.', [
      { text: 'Keep running', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: () => run(() => electionsService.withdraw(election.id), 'You have withdrawn') },
    ]);

  return (
    <>
      {/* Voting */}
      {s === 'voting' && (
        <View style={cardStyle}>
          {me.hasVoted ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <ThemedText style={{ fontWeight: '700' }}>You have voted. Thank you!</ThemedText>
            </View>
          ) : me.onVoterRoll ? (
            <>
              <ThemedText style={styles.cardTitle}>Voting is open</ThemedText>
              <ThemedText style={{ color: colors.muted, marginTop: 4 }}>
                Closes {formatElectionDate(election.votingCloseAt)}. Your vote is secret and final once submitted.
              </ThemedText>
              <Pressable
                onPress={() => router.push({ pathname: '/(features)/elections/ballot', params: { id: election.id } } as any)}
                style={[styles.bigBtn, { backgroundColor: colors.success }]}
              >
                <ThemedText style={styles.bigBtnText}>Vote now</ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <ThemedText style={styles.cardTitle}>You are not on the voter list</ThemedText>
              <ThemedText style={{ color: colors.muted, marginTop: 4 }}>
                Only students whose identity and matric number were verified when voting opened can vote.
              </ThemedText>
            </>
          )}
        </View>
      )}

      {/* Candidacy */}
      {activeCandidacy && (
        <View style={cardStyle}>
          <ThemedText style={styles.cardTitle}>Your candidacy</ThemedText>
          <ThemedText style={{ marginTop: 4 }}>
            {election.positions.find((p) => p.id === activeCandidacy.positionId)?.title ?? 'Position'} ·{' '}
            <ThemedText style={{ textTransform: 'capitalize', fontWeight: '700' }}>{activeCandidacy.status}</ThemedText>
          </ThemedText>
          {activeCandidacy.rejectionReason && (
            <ThemedText style={{ color: colors.danger, marginTop: 4 }}>{activeCandidacy.rejectionReason}</ThemedText>
          )}

          {/* Manifesto — editable from nominations until voting opens */}
          {editingManifesto ? (
            <>
              <ThemedText style={[styles.label, { marginTop: 12 }]}>Your manifesto</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: 140, textAlignVertical: 'top' }]}
                placeholder="What will you do if elected? (at least 20 characters)"
                placeholderTextColor={colors.muted}
                value={manifestoDraft}
                onChangeText={setManifestoDraft}
                multiline
                maxLength={5000}
                autoFocus
              />
              <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'right' }}>
                {manifestoDraft.trim().length}/5000
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Pressable onPress={() => setEditingManifesto(false)} style={[styles.smallBtn, { backgroundColor: colors.border, flex: 1 }]}>
                  <ThemedText style={{ fontWeight: '700' }}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  disabled={busy || manifestoDraft.trim().length < 20}
                  onPress={() =>
                    run(() => electionsService.updateManifesto(election.id, manifestoDraft.trim()), 'Manifesto updated').then(
                      (ok) => ok && setEditingManifesto(false),
                    )
                  }
                  style={[
                    styles.smallBtn,
                    { backgroundColor: colors.primary, flex: 1, opacity: busy || manifestoDraft.trim().length < 20 ? 0.5 : 1 },
                  ]}
                >
                  <ThemedText style={styles.smallBtnText}>Save</ThemedText>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {activeCandidacy.manifesto ? (
                <ThemedText style={{ marginTop: 10, lineHeight: 20 }} numberOfLines={showFullManifesto ? undefined : 4}>
                  {activeCandidacy.manifesto}
                </ThemedText>
              ) : (
                <ThemedText style={{ marginTop: 10, color: colors.muted }}>
                  You don't have a manifesto yet — add one so voters know what you stand for.
                </ThemedText>
              )}
              {activeCandidacy.manifesto.length > 200 && (
                <Pressable onPress={() => setShowFullManifesto((v) => !v)}>
                  <ThemedText style={{ color: colors.primary, fontSize: 12, marginTop: 4 }}>
                    {showFullManifesto ? 'Show less' : 'Show all'}
                  </ThemedText>
                </Pressable>
              )}
              {(s === 'nominations' || s === 'campaign') &&
                (activeCandidacy.status === 'pending' || activeCandidacy.status === 'approved') && (
                  <Pressable
                    disabled={busy}
                    onPress={() => {
                      setManifestoDraft(activeCandidacy.manifesto);
                      setEditingManifesto(true);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>
                      {activeCandidacy.manifesto ? 'Edit manifesto' : 'Add manifesto'}
                    </ThemedText>
                  </Pressable>
                )}
            </>
          )}
          {(s === 'nominations' || s === 'campaign') &&
            (activeCandidacy.status === 'pending' || activeCandidacy.status === 'approved') && (
              <Pressable disabled={busy} onPress={confirmWithdraw} style={{ marginTop: 10 }}>
                <ThemedText style={{ color: colors.danger, fontWeight: '700' }}>Withdraw</ThemedText>
              </Pressable>
            )}
        </View>
      )}

    </>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + '20' : 'transparent' },
      ]}
    >
      <ThemedText style={{ color: selected ? colors.primary : colors.text, fontWeight: '600', fontSize: 13 }}>{label}</ThemedText>
    </Pressable>
  );
}

/** Setup, approval, screening, publication — for the Student Union account running it. */
function CommitteePanel({
  election,
  schoolId,
  run,
  busy,
}: {
  election: ElectionDetail;
  schoolId: string | null;
  run: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
  busy: boolean;
}) {
  const { colors } = useTheme();
  const s = election.status;
  const editable = s === 'draft' || s === 'rejected';
  // Title, description and upcoming dates stay editable until voting opens
  const detailsEditable = ['draft', 'rejected', 'pending_approval', 'approved', 'nominations', 'campaign'].includes(s);
  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.primary + '60' }];

  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<PositionScope>('school');
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [faculties, setFaculties] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [facultyForDept, setFacultyForDept] = useState<string | null>(null);

  useEffect(() => {
    if (!editable || !schoolId || scope === 'school') return;
    schoolService.getFaculties(schoolId).then((list: Option[]) => setFaculties(list ?? [])).catch(() => {});
  }, [editable, schoolId, scope]);

  useEffect(() => {
    if (scope !== 'department' || !facultyForDept) return;
    schoolService.getDepartments(facultyForDept).then((list: Option[]) => setDepartments(list ?? [])).catch(() => {});
  }, [scope, facultyForDept]);

  const pendingCandidates = election.positions.flatMap((p) => p.candidates).filter((c) => c.status === 'pending').length;

  const addPosition = () => {
    if (title.trim().length < 2) return showError('Name the position');
    if (scope !== 'school' && !scopeId) return showError(`Choose the ${scope}`);
    run(
      () => electionsService.addPosition(election.id, { title: title.trim(), scope, scopeId: scope === 'school' ? undefined : scopeId! }),
      'Position added',
    ).then((ok) => {
      if (!ok) return;
      setTitle('');
      setScopeId(null);
    });
  };

  const confirm = (titleText: string, message: string, onYes: () => void, destructive = false) =>
    Alert.alert(titleText, message, [
      { text: 'Not now', style: 'cancel' },
      { text: 'Yes', style: destructive ? 'destructive' : 'default', onPress: onYes },
    ]);

  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
        <ThemedText style={styles.cardTitle}>Committee tools</ThemedText>
      </View>

      {detailsEditable && (
        <Pressable
          disabled={busy}
          onPress={() => router.push({ pathname: '/(features)/elections/create', params: { id: election.id } } as any)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Edit election</ThemedText>
        </Pressable>
      )}

      {editable && (
        <>
          <ThemedText style={{ color: colors.muted, marginTop: 6 }}>
            Add every position, then submit for approval. You can't change the setup after approval.
          </ThemedText>
          <ThemedText style={[styles.label, { marginTop: 12 }]}>New position</ThemedText>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="e.g. President"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {(['school', 'faculty', 'department'] as PositionScope[]).map((opt) => (
              <Chip
                key={opt}
                label={opt === 'school' ? 'Whole school' : opt === 'faculty' ? 'One faculty' : 'One department'}
                selected={scope === opt}
                onPress={() => {
                  setScope(opt);
                  setScopeId(null);
                  setFacultyForDept(null);
                }}
              />
            ))}
          </View>
          {scope !== 'school' && (
            <>
              <ThemedText style={[styles.label, { marginTop: 10 }]}>Faculty</ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {faculties.map((f) => (
                  <Chip
                    key={f.id}
                    label={f.name}
                    selected={scope === 'faculty' ? scopeId === f.id : facultyForDept === f.id}
                    onPress={() => (scope === 'faculty' ? setScopeId(f.id) : (setFacultyForDept(f.id), setScopeId(null)))}
                  />
                ))}
              </View>
            </>
          )}
          {scope === 'department' && facultyForDept && (
            <>
              <ThemedText style={[styles.label, { marginTop: 10 }]}>Department</ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {departments.map((d) => (
                  <Chip key={d.id} label={d.name} selected={scopeId === d.id} onPress={() => setScopeId(d.id)} />
                ))}
              </View>
            </>
          )}
          <Pressable disabled={busy} onPress={addPosition} style={[styles.smallBtn, { backgroundColor: colors.primary, marginTop: 12 }]}>
            <ThemedText style={styles.smallBtnText}>Add position</ThemedText>
          </Pressable>
          <Pressable
            disabled={busy || election.positions.length === 0}
            onPress={() =>
              confirm('Submit for approval?', 'An admin will review the election before it goes live.', () =>
                run(() => electionsService.submit(election.id), 'Submitted for approval'),
              )
            }
            style={[styles.bigBtn, { backgroundColor: colors.success, opacity: election.positions.length === 0 ? 0.5 : 1 }]}
          >
            <ThemedText style={styles.bigBtnText}>Submit for approval</ThemedText>
          </Pressable>
        </>
      )}

      {s === 'pending_approval' && (
        <ThemedText style={{ color: colors.muted, marginTop: 6 }}>Waiting for an admin to approve this election.</ThemedText>
      )}
      {s === 'approved' && (
        <ThemedText style={{ color: colors.muted, marginTop: 6 }}>
          Approved. Nominations open automatically on {formatElectionDate(election.nominationsOpenAt)}.
        </ThemedText>
      )}
      {(s === 'nominations' || s === 'campaign') && (
        <ThemedText style={{ color: colors.muted, marginTop: 6 }}>
          {pendingCandidates > 0
            ? `${pendingCandidates} candidate${pendingCandidates === 1 ? '' : 's'} waiting for screening below. Anyone not screened when voting opens is rejected automatically.`
            : 'No candidates waiting for screening.'}
        </ThemedText>
      )}
      {(s === 'nominations' || s === 'campaign') && <RegisterCandidateForm election={election} run={run} busy={busy} />}
      {s === 'voting' && (
        <ThemedText style={{ color: colors.muted, marginTop: 6 }}>
          Voting is open. Nobody, including the committee, can see the counts until it closes — then results are
          published automatically.
        </ThemedText>
      )}
      {s === 'closed' && (
        <ThemedText style={{ color: colors.muted, marginTop: 6 }}>
          Voting has closed. Results are published automatically — pull down to refresh.
        </ThemedText>
      )}

      {election.me.isChair && ['draft', 'rejected', 'pending_approval', 'approved', 'nominations', 'campaign'].includes(s) && (
        <Pressable
          disabled={busy}
          onPress={() =>
            confirm('Cancel this election?', 'This cannot be undone.', () => run(() => electionsService.cancel(election.id), 'Election cancelled'), true)
          }
          style={{ marginTop: 14 }}
        >
          <ThemedText style={{ color: colors.danger, fontWeight: '700' }}>Cancel election</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

/** Who runs the election. Everyone sees it; the chair can add and remove members until voting closes. */
function CommitteeCard({
  election,
  run,
  busy,
}: {
  election: ElectionDetail;
  run: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
  busy: boolean;
}) {
  const { colors } = useTheme();
  const canManage =
    election.me.isChair && !['closed', 'results_published', 'certified', 'cancelled'].includes(election.status);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!adding || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      electionsService
        .searchStudents(election.id, query.trim())
        .then((list) => !cancelled && setResults(list))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setSearching(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [adding, query, election.id]);

  const personName = (u: CommitteeEntry['user'] | StudentSearchResult | null) =>
    (u && ([u.firstName, u.lastName].filter(Boolean).join(' ') || u.username)) || 'Student';

  const add = (st: StudentSearchResult) =>
    run(() => electionsService.addCommitteeMember(election.id, st.id), `${personName(st)} joined the committee`).then(
      (ok) => {
        if (!ok) return;
        setQuery('');
        setResults([]);
        setAdding(false);
      },
    );

  const remove = (entry: CommitteeEntry) =>
    Alert.alert(`Remove ${personName(entry.user)}?`, 'They will lose access to the committee tools for this election.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => run(() => electionsService.removeCommitteeMember(election.id, entry.userId), 'Removed from the committee'),
      },
    ]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ThemedText style={styles.cardTitle}>Committee</ThemedText>
      <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
        Runs this election. Committee members can't stand as candidates.
      </ThemedText>

      {election.committee.map((entry) => (
        <View key={entry.userId} style={[styles.candidate, { borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
          {entry.user?.profilePictureUrl ? (
            <Image source={{ uri: entry.user.profilePictureUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary + '25', alignItems: 'center', justifyContent: 'center' }]}>
              <ThemedText style={{ fontWeight: '700' }}>{personName(entry.user).charAt(0).toUpperCase()}</ThemedText>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: '700' }}>{personName(entry.user)}</ThemedText>
            <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
              {entry.role === 'chair' ? 'Chair · Student Union' : 'Member'}
              {entry.user?.username ? ` · @${entry.user.username}` : ''}
            </ThemedText>
          </View>
          {canManage && entry.role === 'member' && (
            <Pressable disabled={busy} onPress={() => remove(entry)} hitSlop={8}>
              <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
            </Pressable>
          )}
        </View>
      ))}

      {canManage &&
        (adding ? (
          <View style={{ marginTop: 12 }}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Search by name, username or matric number"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {searching && results.length === 0 && <StudentSearchSkeleton />}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
                No verified students with a matric number match that.
              </ThemedText>
            )}
            {results.map((st) => {
              const blocked = st.onCommittee || st.alreadyCandidate;
              return (
                <Pressable
                  key={st.id}
                  disabled={blocked || busy}
                  onPress={() => add(st)}
                  style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, opacity: blocked ? 0.45 : 1 }}
                >
                  <ThemedText style={{ fontWeight: '600' }}>{personName(st)}</ThemedText>
                  <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
                    {st.matricNumber}
                    {st.username ? ` · @${st.username}` : ''}
                    {st.onCommittee ? ' · already on the committee' : st.alreadyCandidate ? ' · a candidate' : ''}
                  </ThemedText>
                </Pressable>
              );
            })}
            <Pressable onPress={() => { setAdding(false); setQuery(''); }} style={{ marginTop: 10 }}>
              <ThemedText style={{ color: colors.muted, fontWeight: '700' }}>Cancel</ThemedText>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setAdding(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <Ionicons name="person-add-outline" size={16} color={colors.primary} />
            <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Add committee member</ThemedText>
          </Pressable>
        ))}
    </View>
  );
}

/** Committee puts a student straight on the ballot (approved immediately). */
function RegisterCandidateForm({
  election,
  run,
  busy,
}: {
  election: ElectionDetail;
  run: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
  busy: boolean;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [positionId, setPositionId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [student, setStudent] = useState<StudentSearchResult | null>(null);
  const [manifesto, setManifesto] = useState('');

  const position = election.positions.find((p) => p.id === positionId) ?? null;
  const inScope = (st: StudentSearchResult) =>
    !position ||
    position.scope === 'school' ||
    (position.scope === 'faculty' ? st.facultyId === position.scopeId : st.departmentId === position.scopeId);

  // Search as the committee types (debounced)
  useEffect(() => {
    if (!open || student || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      electionsService
        .searchStudents(election.id, query.trim())
        .then((list) => !cancelled && setResults(list))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setSearching(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, student, election.id]);

  const reset = () => {
    setStudent(null);
    setQuery('');
    setManifesto('');
    setResults([]);
  };

  const submit = () => {
    if (!positionId) return showError('Choose the position');
    if (!student) return showError('Choose the student');
    run(
      () => electionsService.registerCandidate(election.id, student.id, positionId, manifesto.trim() || undefined),
      `${[student.firstName, student.lastName].filter(Boolean).join(' ') || student.username} is on the ballot`,
    ).then((ok) => ok && reset());
  };

  const studentName = (st: StudentSearchResult) =>
    [st.firstName, st.lastName].filter(Boolean).join(' ') || st.username || 'Student';

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
        <Ionicons name="person-add-outline" size={16} color={colors.primary} />
        <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Register a candidate</ThemedText>
      </Pressable>
    );
  }

  return (
    <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText style={{ fontWeight: '700' }}>Register a candidate</ThemedText>
        <Pressable onPress={() => { reset(); setOpen(false); }} hitSlop={8}>
          <Ionicons name="close" size={18} color={colors.muted} />
        </Pressable>
      </View>
      <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
        They go straight on the ballot as approved and get a notification.
      </ThemedText>

      <ThemedText style={[styles.label, { marginTop: 10 }]}>Position</ThemedText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {election.positions.map((p) => (
          <Chip key={p.id} label={p.title} selected={positionId === p.id} onPress={() => setPositionId(p.id)} />
        ))}
      </View>

      <ThemedText style={[styles.label, { marginTop: 10 }]}>Student</ThemedText>
      {student ? (
        <View style={[styles.input, { borderColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: '700' }}>{studentName(student)}</ThemedText>
            <ThemedText style={{ color: colors.muted, fontSize: 12 }}>{student.matricNumber}</ThemedText>
          </View>
          <Pressable onPress={() => setStudent(null)} hitSlop={8}>
            <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Change</ThemedText>
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Name, username or matric number"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searching && results.length === 0 && <StudentSearchSkeleton />}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
              No verified students with a matric number match that.
            </ThemedText>
          )}
          {results.map((st) => {
            const blocked = st.alreadyCandidate || st.onCommittee || !inScope(st);
            return (
              <Pressable
                key={st.id}
                disabled={blocked}
                onPress={() => setStudent(st)}
                style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, opacity: blocked ? 0.45 : 1 }}
              >
                <ThemedText style={{ fontWeight: '600' }}>{studentName(st)}</ThemedText>
                <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
                  {st.matricNumber}
                  {st.username ? ` · @${st.username}` : ''}
                  {st.alreadyCandidate
                    ? ' · already a candidate'
                    : st.onCommittee
                      ? ' · on the committee'
                      : !inScope(st)
                        ? ' · not eligible for this position'
                        : ''}
                </ThemedText>
              </Pressable>
            );
          })}
        </>
      )}

      <ThemedText style={[styles.label, { marginTop: 10 }]}>Manifesto (optional)</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: 80, textAlignVertical: 'top' }]}
        placeholder="What the candidate stands for"
        placeholderTextColor={colors.muted}
        value={manifesto}
        onChangeText={setManifesto}
        multiline
        maxLength={5000}
      />

      <Pressable
        disabled={busy || !student || !positionId}
        onPress={submit}
        style={[styles.bigBtn, { backgroundColor: colors.primary, opacity: !student || !positionId ? 0.5 : 1 }]}
      >
        <ThemedText style={styles.bigBtnText}>Add to ballot</ThemedText>
      </Pressable>
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
      <ThemedText style={{ color: colors.muted, fontSize: 13, flexShrink: 1 }}>{label}</ThemedText>
      <ThemedText style={{ fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{value}</ThemedText>
    </View>
  );
}

function ResultsSection({ election }: { election: ElectionDetail }) {
  const { colors } = useTheme();
  const results = election.results!;
  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];
  const [code, setCode] = useState('');
  const [checkResult, setCheckResult] = useState<ReceiptCheck | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      setCheckResult(await electionsService.checkReceipt(election.id, code.trim()));
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Could not check that code');
    } finally {
      setChecking(false);
    }
  };

  const describeSelection = (sel: ReceiptSelection) => {
    if (sel.choice === 'abstain') return 'Abstained';
    if (sel.choice === 'yes') return `Yes to ${sel.candidateName ?? 'the candidate'}`;
    if (sel.choice === 'no') return `No to ${sel.candidateName ?? 'the candidate'}`;
    return sel.candidateName ?? 'Candidate';
  };

  const renderPosition = (r: PositionResult) => {
    if (r.type === 'no_candidates') {
      return <ThemedText style={{ color: colors.muted, marginTop: 6 }}>No candidates stood.</ThemedText>;
    }
    if (r.type === 'uncontested') {
      const total = (r.yes ?? 0) + (r.no ?? 0);
      return (
        <View style={{ marginTop: 8 }}>
          <ThemedText style={{ fontWeight: '700' }}>
            {r.candidate?.name ?? 'Candidate'} — {r.elected ? 'Elected' : 'Not elected'}
          </ThemedText>
          <ThemedText style={{ color: colors.muted, marginTop: 2 }}>
            Yes {r.yes} · No {r.no} · Abstained {r.abstain}
          </ThemedText>
          <ProgressBar value={total ? (r.yes ?? 0) / total : 0} />
        </View>
      );
    }
    const total = (r.candidates ?? []).reduce((sum, c) => sum + c.votes, 0);
    return (
      <View style={{ marginTop: 6 }}>
        {r.tie && (
          <ThemedText style={{ color: colors.warning, fontWeight: '700', marginBottom: 4 }}>
            Tie — to be settled under the committee's rules
          </ThemedText>
        )}
        {(r.candidates ?? []).map((c) => {
          const won = r.winnerCandidateIds?.includes(c.candidateId) && !r.tie;
          return (
            <View key={c.candidateId} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText style={{ fontWeight: won ? '800' : '500' }}>
                  {c.name ?? 'Candidate'} {won ? '🏆' : ''}
                </ThemedText>
                <ThemedText style={{ fontWeight: '700' }}>{c.votes.toLocaleString()}</ThemedText>
              </View>
              <ProgressBar value={total ? c.votes / total : 0} />
            </View>
          );
        })}
        <ThemedText style={{ color: colors.muted, marginTop: 6, fontSize: 12 }}>Abstained: {r.abstain}</ThemedText>
      </View>
    );
  };

  return (
    <>
      <ThemedText style={styles.sectionTitle}>Results</ThemedText>
      {results.positions.map((r) => (
        <View key={r.positionId} style={cardStyle}>
          <ThemedText style={styles.cardTitle}>{r.title}</ThemedText>
          {renderPosition(r)}
        </View>
      ))}

      <View style={cardStyle}>
        <ThemedText style={styles.cardTitle}>Check your receipt</ThemedText>
        <ThemedText style={{ color: colors.muted, marginTop: 4, marginBottom: 8 }}>
          Enter the code you got after voting to confirm your ballot was counted. If it's your receipt, you'll also see
          how you voted — nobody else can.
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text }]}
            placeholder="ABCD-EFGH-JK"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            value={code}
            onChangeText={(t) => {
              setCode(t);
              setCheckResult(null);
            }}
          />
          <Pressable
            onPress={check}
            disabled={checking || code.trim().length < 6}
            style={[styles.smallBtn, { backgroundColor: colors.primary, opacity: checking || code.trim().length < 6 ? 0.6 : 1 }]}
          >
            <ThemedText style={styles.smallBtnText}>{checking ? '…' : 'Check'}</ThemedText>
          </Pressable>
        </View>
        {checkResult !== null && (
          <ThemedText style={{ marginTop: 8, fontWeight: '700', color: checkResult.counted ? colors.success : colors.danger }}>
            {checkResult.counted ? '✓ This ballot was counted' : 'No ballot with that receipt code'}
          </ThemedText>
        )}
        {checkResult?.counted && checkResult.isYours && (
          <View style={[styles.receiptDetails, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="lock-closed" size={14} color={colors.muted} />
              <ThemedText style={{ color: colors.muted, fontSize: 12, flex: 1 }}>Your ballot — only visible to you</ThemedText>
            </View>
            <ReceiptRow label="Receipt" value={code.trim().toUpperCase()} />
            <ReceiptRow label="Election" value={election.title} />
            {checkResult.votedOn && (
              <ReceiptRow
                label="Voted on"
                value={new Date(`${checkResult.votedOn}T12:00:00Z`).toLocaleDateString([], {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
            )}
            <ThemedText style={{ fontWeight: '700', marginTop: 10 }}>Your choices</ThemedText>
            {(checkResult.selections ?? []).map((sel) => (
              <ReceiptRow key={sel.positionId} label={sel.positionTitle} value={describeSelection(sel)} />
            ))}
          </View>
        )}
        {checkResult?.counted && checkResult.isYours === false && (
          <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
            Ballot details are only shown to the student who cast it.
          </ThemedText>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 10, opacity: 0.8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  notice: { marginTop: 12, padding: 10, borderRadius: 10 },
  candidate: { borderTopWidth: 1, marginTop: 10, paddingTop: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  smallBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  smallBtnText: { color: '#fff', fontWeight: '700' },
  bigBtn: { paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 16, padding: 18 },
  receiptDetails: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 10 },
});
