import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import AuthHeader from '@/components/auth/authHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { showError } from '@/components/ui/toast';
import { ElectionListSkeleton } from '@/components/elections/electionSkeleton';
import {
  electionsService,
  ELECTION_STATUS_COLOR,
  ELECTION_STATUS_LABEL,
  committeeTermEndsAt,
  electionYear,
  formatElectionDate,
  type Election,
} from '@/service/elections.service';

type LevelFilter = 'all' | 'school' | 'faculty' | 'department';

const LEVEL_FILTERS: { key: LevelFilter; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'school', label: 'School', icon: 'school-outline' },
  { key: 'faculty', label: 'My faculty', icon: 'business-outline' },
  { key: 'department', label: 'My department', icon: 'people-outline' },
];

const LEVEL_TAG: Record<'school' | 'faculty' | 'department', string> = {
  school: 'School',
  faculty: 'Faculty',
  department: 'Department',
};

/** The next date that matters for an election, in plain words. */
function nextMilestone(e: Election): string | null {
  switch (e.status) {
    case 'approved':
      return `Nominations open ${formatElectionDate(e.nominationsOpenAt)}`;
    case 'nominations':
      return `Nominations close ${formatElectionDate(e.nominationsCloseAt)}`;
    case 'campaign':
      return `Voting opens ${formatElectionDate(e.votingOpenAt)}`;
    case 'voting':
      return `Voting closes ${formatElectionDate(e.votingCloseAt)}`;
    case 'closed':
      return 'Votes are being counted';
    default:
      return null;
  }
}

export default function ElectionsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isUnionAccount = !!user?.studentUnion && user?.studentUnionStatus === 'verified';

  const [elections, setElections] = useState<Election[]>([]);
  const [mine, setMine] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Years the user opened/closed; by default only the latest year is open
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [level, setLevel] = useState<LevelFilter>('all');

  const load = useCallback(async () => {
    try {
      const [school, own] = await Promise.all([
        electionsService.listForSchool(),
        // Chairs and committee members both get the elections they help run
        electionsService.listMine(),
      ]);
      setElections(school);
      setMine(own);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Could not load elections');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderCard = (e: Election) => {
    const milestone = nextMilestone(e);
    return (
      <Pressable
        key={e.id}
        onPress={() => router.push({ pathname: '/(features)/elections/[id]', params: { id: e.id } } as any)}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.cardTop}>
          <ThemedText style={styles.cardTitle} numberOfLines={2}>
            {e.title}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: ELECTION_STATUS_COLOR[e.status] + '20' }]}>
            <ThemedText style={[styles.badgeText, { color: ELECTION_STATUS_COLOR[e.status] }]}>
              {ELECTION_STATUS_LABEL[e.status]}
            </ThemedText>
          </View>
        </View>
        {milestone && <ThemedText style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>{milestone}</ThemedText>}
        {(e.positionScopes?.length ?? 0) > 0 && (
          <View style={styles.tagRow}>
            {(['school', 'faculty', 'department'] as const)
              .filter((lvl) => e.positionScopes!.some((s) => s.scope === lvl))
              .map((lvl) => (
                <View key={lvl} style={[styles.tag, { backgroundColor: colors.border }]}>
                  <ThemedText style={{ fontSize: 11, fontWeight: '600', color: colors.muted }}>{LEVEL_TAG[lvl]}</ThemedText>
                </View>
              ))}
          </View>
        )}
        {e.status === 'rejected' && e.rejectionReason && (
          <ThemedText style={{ color: colors.danger, fontSize: 13, marginTop: 6 }}>{e.rejectionReason}</ThemedText>
        )}
      </Pressable>
    );
  };

  // Committee's own elections that students can't see yet (drafts etc.) go in their own section
  const mineNotPublic = mine.filter((m) => !elections.some((e) => e.id === m.id));

  /**
   * Level filter, based on the election's positions. On the school list,
   * "faculty"/"department" mean the viewer's own; for elections the viewer
   * helps run, any faculty/department position counts.
   */
  const matchesLevel = (e: Election, ownOnly: boolean) => {
    if (level === 'all') return true;
    const scopes = e.positionScopes ?? [];
    if (level === 'school') return scopes.some((s) => s.scope === 'school');
    const ownId = level === 'faculty' ? user?.facultyId : user?.departmentId;
    return scopes.some((s) => s.scope === level && (!ownOnly || s.scopeId === ownId));
  };
  const visibleElections = elections.filter((e) => matchesLevel(e, true));
  const visibleMine = mineNotPublic.filter((e) => matchesLevel(e, false));

  const termEndsAt = isUnionAccount ? committeeTermEndsAt(user?.studentUnionVerifiedAt) : null;
  // No date yet (profile cached before terms existed) → don't claim it ended; the server enforces it anyway
  const termActive = !termEndsAt || termEndsAt.getTime() > Date.now();

  /** Elections split by the year voting opens, newest year first. */
  const byYear = (list: Election[]) => {
    const groups = new Map<number, Election[]>();
    for (const e of list) {
      const year = electionYear(e);
      groups.set(year, [...(groups.get(year) ?? []), e]);
    }
    return [...groups.entries()].sort(([a], [b]) => b - a);
  };
  const schoolYears = byYear(visibleElections);
  const latestYear = schoolYears[0]?.[0];
  const isOpen = (year: number) => expandedYears[year] ?? year === latestYear;

  const renderYears = (groups: [number, Election[]][], collapsible: boolean) =>
    groups.map(([year, list]) => {
      const open = !collapsible || isOpen(year);
      return (
        <View key={year}>
          <Pressable
            disabled={!collapsible}
            onPress={() => setExpandedYears((prev) => ({ ...prev, [year]: !open }))}
            style={styles.yearRow}
          >
            <ThemedText style={styles.yearTitle}>{year}</ThemedText>
            <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
              {list.length} election{list.length === 1 ? '' : 's'}
            </ThemedText>
            <View style={{ flex: 1 }} />
            {collapsible && <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />}
          </Pressable>
          {open && list.map(renderCard)}
        </View>
      );
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthHeader title="Elections" subtitle="Student Union elections at your school" showBackButton />

      {loading ? (
        <ElectionListSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {/* Level filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {LEVEL_FILTERS.map((f) => {
              const unavailable =
                (f.key === 'faculty' && !user?.facultyId) || (f.key === 'department' && !user?.departmentId);
              const selected = level === f.key;
              return (
                <Pressable
                  key={f.key}
                  disabled={unavailable}
                  onPress={() => setLevel(f.key)}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary : 'transparent',
                      opacity: unavailable ? 0.4 : 1,
                    },
                  ]}
                >
                  <Ionicons name={f.icon} size={14} color={selected ? '#fff' : colors.muted} />
                  <ThemedText style={{ color: selected ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>
                    {f.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          {isUnionAccount && (
            <>
              {termActive ? (
                <>
                  <Pressable
                    onPress={() => router.push('/(features)/elections/create' as any)}
                    style={[styles.createBtn, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <ThemedText style={styles.createBtnText}>Create an election</ThemedText>
                  </Pressable>
                  {termEndsAt && (
                    <ThemedText style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: -4, marginBottom: 12 }}>
                      Your committee term runs until{' '}
                      {termEndsAt.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                    </ThemedText>
                  )}
                </>
              ) : (
                <View style={[styles.notice, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '50' }]}>
                  <Ionicons name="time-outline" size={20} color={colors.warning} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: '700' }}>Your committee term has ended</ThemedText>
                    <ThemedText style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                      {termEndsAt
                        ? `It ended on ${termEndsAt.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}. `
                        : ''}
                      Committee access lasts one year. Submit a new Student Union document to be re-verified, then you can
                      create elections again. Elections you already started carry on.
                    </ThemedText>
                    <Pressable onPress={() => router.push('/(features)/events' as any)} style={{ marginTop: 8 }}>
                      <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>Renew Student Union verification</ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          )}

          {visibleMine.length > 0 && (
            <>
              <ThemedText style={styles.sectionTitle}>Run by your committee</ThemedText>
              {renderYears(byYear(visibleMine), false)}
            </>
          )}

          <ThemedText style={styles.sectionTitle}>At your school</ThemedText>
          {visibleElections.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkbox-outline" size={40} color={colors.muted} />
              <ThemedText style={{ color: colors.muted, marginTop: 8, textAlign: 'center' }}>
                {elections.length === 0
                  ? 'No elections yet. When your Student Union schedules one, it appears here.'
                  : level === 'school'
                    ? 'No school-wide elections.'
                    : level === 'faculty'
                      ? 'No elections for your faculty.'
                      : 'No elections for your department.'}
              </ThemedText>
            </View>
          ) : (
            renderYears(schoolYears, true)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 10, opacity: 0.8 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, marginBottom: 4 },
  filterRow: { gap: 8, paddingBottom: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  yearTitle: { fontSize: 18, fontWeight: '800' },
  notice: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
});
