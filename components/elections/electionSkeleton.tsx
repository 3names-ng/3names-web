import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { Skeleton, SkeletonCircle, SkeletonGroup, SkeletonText } from '@/components/ui/skeleton';

function useCardStyle() {
  const { colors } = useTheme();
  return [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];
}

/** One placeholder matching an election card: title with status badge, then the next milestone. */
function ElectionCardSkeleton() {
  const cardStyle = useCardStyle();
  return (
    <View style={cardStyle}>
      <View style={styles.cardTop}>
        <Skeleton width="60%" height={16} radius={8} />
        <Skeleton width={84} height={20} radius={8} />
      </View>
      <Skeleton width="50%" height={12} radius={6} style={{ marginTop: 10 }} />
    </View>
  );
}

/** Elections list first load: a section title and stacked cards. */
export function ElectionListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading elections" style={styles.screen}>
      <Skeleton width={110} height={13} radius={6} style={styles.sectionTitle} />
      {Array.from({ length: count }).map((_, i) => (
        <ElectionCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

function CandidateRowSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.candidate, { borderTopColor: colors.border }]}>
      <SkeletonCircle size={40} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="55%" height={13} radius={6} />
        <Skeleton width="25%" height={10} radius={5} />
      </View>
    </View>
  );
}

/** Election detail first load: status and timeline card, then position cards with candidates. */
export function ElectionDetailSkeleton() {
  const cardStyle = useCardStyle();
  return (
    <SkeletonGroup label="Loading election" style={styles.screen}>
      <View style={cardStyle}>
        <Skeleton width={96} height={20} radius={8} />
        <SkeletonText lines={2} lineHeight={12} lastLineWidth="70%" style={{ marginTop: 12 }} />
        <View style={{ marginTop: 14, gap: 8 }}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.timelineRow}>
              <Skeleton width={80} height={11} radius={5} />
              <Skeleton width="45%" height={11} radius={5} />
            </View>
          ))}
        </View>
      </View>

      <Skeleton width={80} height={13} radius={6} style={styles.sectionTitle} />
      {[0, 1].map((i) => (
        <View key={i} style={cardStyle}>
          <Skeleton width="45%" height={15} radius={7} />
          <Skeleton width="30%" height={10} radius={5} style={{ marginTop: 6 }} />
          <CandidateRowSkeleton />
          <CandidateRowSkeleton />
        </View>
      ))}
    </SkeletonGroup>
  );
}

/** Ballot first load: progress, the position being voted on, and its choices. */
export function BallotSkeleton() {
  const cardStyle = useCardStyle();
  return (
    <SkeletonGroup label="Loading ballot" style={styles.screen}>
      <Skeleton width={120} height={11} radius={5} />
      <Skeleton width="100%" height={6} radius={3} style={{ marginTop: 8 }} />
      <Skeleton width="55%" height={20} radius={10} style={{ marginTop: 20 }} />
      <Skeleton width="80%" height={12} radius={6} style={{ marginTop: 8, marginBottom: 16 }} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={[cardStyle, styles.option]}>
          <SkeletonCircle size={40} />
          <Skeleton width="50%" height={14} radius={7} />
        </View>
      ))}
      <Skeleton width="100%" height={48} radius={12} style={{ marginTop: 8 }} />
    </SkeletonGroup>
  );
}

/** Edit-election form while the saved details load: labelled fields. */
export function ElectionFormSkeleton() {
  return (
    <SkeletonGroup label="Loading election" style={styles.screen}>
      {[44, 90, 44, 44, 44, 44, 44].map((height, i) => (
        <View key={i} style={styles.field}>
          <Skeleton width={i === 1 ? 140 : 120} height={13} radius={6} />
          {i > 1 && <Skeleton width="65%" height={10} radius={5} style={{ marginTop: 6 }} />}
          <Skeleton width="100%" height={height} radius={10} style={{ marginTop: 8 }} />
        </View>
      ))}
    </SkeletonGroup>
  );
}

/** Student search results (committee registering a candidate). */
export function StudentSearchSkeleton({ count = 3 }: { count?: number }) {
  const { colors } = useTheme();
  return (
    <SkeletonGroup label="Searching students">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.searchRow, { borderBottomColor: colors.border }]}>
          <Skeleton width="50%" height={13} radius={6} />
          <Skeleton width="35%" height={10} radius={5} />
        </View>
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { marginTop: 8, marginBottom: 12 },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  candidate: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, marginTop: 10, paddingTop: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  field: { marginBottom: 16 },
  searchRow: { paddingVertical: 8, borderBottomWidth: 1, gap: 6 },
});
