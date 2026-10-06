import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useWhotStore } from '@/store/whotStore';
import { useWhotSocket } from '@/service/useWhotSocket';
import { whotService, type WhotStake, type WhotTableSize } from '@/service/whot.service';
import { coinService } from '@/service/coin.service';
import { GameCoinsBadge, GameCoinsHint } from '@/components/games/gameCoins';

const STAKE_OPTIONS: { amount: WhotStake; label: string; emoji: string; color: string }[] = [
  { amount: 50, label: 'Bronze', emoji: '🥉', color: '#CD7F32' },
  { amount: 100, label: 'Silver', emoji: '🥈', color: '#C0C0C0' },
  { amount: 250, label: 'Gold', emoji: '🥇', color: '#FFD700' },
  { amount: 500, label: 'Diamond', emoji: '💎', color: '#B9F2FF' },
];

const TABLE_SIZES: WhotTableSize[] = [2, 3, 4];

type FlowState = 'select' | 'waiting';
type OpponentMode = 'online' | 'bot';

export default function WhotStakeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [flowState, setFlowState] = useState<FlowState>('select');
  const [opponentMode, setOpponentMode] = useState<OpponentMode>('online');
  const [selectedStake, setSelectedStake] = useState<WhotStake | null>(null);
  const [selectedSize, setSelectedSize] = useState<WhotTableSize>(2);
  const [balance, setBalance] = useState<number>(0);
  const [joining, setJoining] = useState(false);
  const [queueStats, setQueueStats] = useState<{ playersInQueue: number; key: string } | null>(null);

  const waitingTableIdRef = useRef<string | null>(null);

  const {
    seats,
    setQueued,
    setTableId,
    applyTableUpdate,
    applyTableStart,
    resetTable,
  } = useWhotStore();

  // Fetch Stars (game coins, the only currency that can be staked)
  const refreshBalance = useCallback(() => {
    coinService.getBalance().then((b) => setBalance(coinService.stakeableCoins(b))).catch(() => {});
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // Resume an already-active table (e.g. app was backgrounded mid-game).
  useEffect(() => {
    whotService
      .getActiveTable()
      .then((table) => {
        if (table && (table.status === 'active' || table.status === 'countdown')) {
          setTableId(table.id);
          router.replace('/(features)/games/whotTable' as any);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll queue stats for the selected stake/size while picking.
  useEffect(() => {
    if (!selectedStake || flowState !== 'select' || opponentMode !== 'online') {
      return;
    }
    let cancelled = false;
    // Tag each response with the stake/size it was requested for, so a result
    // that arrives after the user switches tiers is ignored at render time
    // instead of being cleared with a setState inside this effect.
    const key = `${selectedStake}-${selectedSize}`;
    const load = () => {
      whotService
        .getQueueStats(selectedStake, selectedSize)
        .then((stats) => {
          if (!cancelled) setQueueStats({ playersInQueue: stats.playersInQueue, key });
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedStake, selectedSize, flowState, opponentMode]);

  const goToTable = useCallback(() => {
    setFlowState('select');
    router.push('/(features)/games/whotTable' as any);
  }, [router]);

  const { joinTableRoom, leaveTableRoom } = useWhotSocket({
    onQueueJoined: (data) => {
      if (data.tableId === waitingTableIdRef.current) {
        setTableId(data.tableId);
      }
    },
    onTableUpdate: (data) => {
      if (data.tableId === waitingTableIdRef.current) {
        applyTableUpdate(data);
      }
    },
    onTableStart: (data) => {
      if (data.tableId === waitingTableIdRef.current) {
        applyTableStart(data);
        waitingTableIdRef.current = null;
        goToTable();
      }
    },
  });

  const effectiveSize = opponentMode === 'bot' ? 2 : selectedSize;
  const queueKey = selectedStake ? `${selectedStake}-${selectedSize}` : null;
  const currentQueueStats =
    queueStats && queueStats.key === queueKey ? queueStats : null;

  const handleSelectStake = (amount: WhotStake) => setSelectedStake(amount);

  const handleJoinTable = async () => {
    if (!selectedStake || joining) return;
    setJoining(true);
    try {
      const result =
        opponentMode === 'bot'
          ? await whotService.startBotTable(selectedStake)
          : await whotService.joinQueue(selectedStake, selectedSize);
      waitingTableIdRef.current = result.tableId;
      setQueued(true, result.stake, result.maxPlayers);
      setTableId(result.tableId);
      joinTableRoom(result.tableId);

      if (result.status === 'active') {
        // Table was already full and started immediately.
        const activeTable = await whotService.getActiveTable();
        if (activeTable) {
          waitingTableIdRef.current = null;
          goToTable();
          return;
        }
      }
      setFlowState('waiting');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to join table');
    } finally {
      setJoining(false);
    }
  };

  const handleCancelWaiting = async () => {
    try {
      await whotService.leaveQueue();
    } catch {
      // already left/started — fine
    }
    if (waitingTableIdRef.current) {
      leaveTableRoom(waitingTableIdRef.current);
    }
    waitingTableIdRef.current = null;
    resetTable();
    setFlowState('select');
  };

  const getPotentialWin = (stake: number, size: number) => {
    const pot = stake * size;
    const fee = Math.floor((pot * 10) / 100);
    return pot - fee;
  };

  // ═══════════════════════════════════════
  // RENDER: WAITING (in queue / table filling up)
  // ═══════════════════════════════════════
  if (flowState === 'waiting') {
    const filled = seats.length;
    const needed = opponentMode === 'bot' ? 2 : selectedSize;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <ActivityIndicator size="large" color="#F59E0B" style={{ marginBottom: 20 }} />
          <ThemedText style={{ fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
            {opponentMode === 'bot' ? 'Dealing your cards...' : 'Finding a table...'}
          </ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {opponentMode === 'bot'
              ? 'Setting up your match against the Computer'
              : `Waiting for ${needed - filled > 0 ? needed - filled : 0} more player${needed - filled === 1 ? '' : 's'} to join`}
          </ThemedText>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
            {Array.from({ length: needed }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: i < filled ? '#F59E0B' : (isDark ? '#1E293B' : '#F1F5F9'),
                  borderWidth: i < filled ? 0 : 1.5,
                  borderColor: colors.border,
                  borderStyle: i < filled ? 'solid' : 'dashed',
                }}
              >
                {i < filled ? (
                  <Ionicons name="person" size={22} color="#fff" />
                ) : (
                  <Ionicons name="person-outline" size={22} color={colors.muted} />
                )}
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, width: '100%', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={{ color: '#F59E0B', fontWeight: '800', fontSize: 15 }}>⭐ {selectedStake}</ThemedText>
                <ThemedText style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>Your entry</ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={{ color: '#F59E0B', fontWeight: '800', fontSize: 15 }}>⭐ {(selectedStake || 0) * needed}</ThemedText>
                <ThemedText style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>Total prize</ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={{ color: '#22c55e', fontWeight: '800', fontSize: 15 }}>
                  ⭐ {selectedStake ? getPotentialWin(selectedStake, needed) : 0}
                </ThemedText>
                <ThemedText style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>Winner gets</ThemedText>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleCancelWaiting} style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 40 }}>
            <ThemedText style={{ fontWeight: '700', fontSize: 15, color: colors.muted }}>Leave Queue</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════
  // RENDER: SELECT (stake + table size)
  // ═══════════════════════════════════════
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>Naija Whot</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Play for Stars, outplay the table</ThemedText>
        </View>
        <GameCoinsBadge balance={balance} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={[styles.infoCard, { backgroundColor: isDark ? '#1a1f3a' : '#F0F4FF' }]}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#DBEAFE' }]}>
              <Text style={{ fontSize: 18 }}>🃏</Text>
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoTitle}>How it Works</ThemedText>
              <ThemedText style={styles.infoDesc}>Pick your entry • Pick table size • Join queue • First to empty your hand wins</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Opponent mode */}
        <ThemedText style={styles.sectionTitle}>Who Are You Playing?</ThemedText>
        <View style={[styles.segmented, { backgroundColor: isDark ? '#1a1f3a' : '#F1F5F9', borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setOpponentMode('online')}
            style={[styles.segmentItem, opponentMode === 'online' && { backgroundColor: '#F59E0B' }]}
          >
            <ThemedText style={{ fontWeight: '700', fontSize: 14, color: opponentMode === 'online' ? '#fff' : colors.text }}>
              Online Players
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setOpponentMode('bot')}
            style={[styles.segmentItem, opponentMode === 'bot' && { backgroundColor: '#F59E0B' }]}
          >
            <ThemedText style={{ fontWeight: '700', fontSize: 14, color: opponentMode === 'bot' ? '#fff' : colors.text }}>
              🤖 Computer
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Stake Selection */}
        <ThemedText style={styles.sectionTitle}>Choose Your Entry</ThemedText>
        <View style={styles.stakeGrid}>
          {STAKE_OPTIONS.map((option) => {
            const isSelected = selectedStake === option.amount;
            const canAfford = balance >= option.amount;

            return (
              <TouchableOpacity
                key={option.amount}
                style={[
                  styles.stakeCard,
                  {
                    backgroundColor: isSelected ? option.color + '20' : isDark ? '#1a1f3a' : '#FFFFFF',
                    borderColor: isSelected ? option.color : isDark ? '#2a2f4a' : '#E5E7EB',
                    opacity: canAfford ? 1 : 0.5,
                  },
                ]}
                onPress={() => canAfford && handleSelectStake(option.amount)}
                activeOpacity={0.8}
                disabled={!canAfford}
              >
                <Text style={styles.stakeEmoji}>{option.emoji}</Text>
                <ThemedText style={[styles.stakeAmount, { color: option.color }]}>{option.amount} ⭐</ThemedText>
                <ThemedText style={styles.stakeLabel}>{option.label}</ThemedText>
                {!canAfford && (
                  <View style={styles.lockedOverlay}>
                    <Ionicons name="lock-closed" size={16} color="#999" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Table size (online only — vs Computer is always 1v1) */}
        {opponentMode === 'online' && (
          <>
            <ThemedText style={styles.sectionTitle}>Table Size</ThemedText>
            <View style={[styles.segmented, { backgroundColor: isDark ? '#1a1f3a' : '#F1F5F9', borderColor: colors.border }]}>
              {TABLE_SIZES.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setSelectedSize(size)}
                    style={[
                      styles.segmentItem,
                      isSelected && { backgroundColor: '#F59E0B' },
                    ]}
                  >
                    <ThemedText style={{ fontWeight: '700', fontSize: 14, color: isSelected ? '#fff' : colors.text }}>
                      {size} Players
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {selectedStake && (
          <>
            <ThemedView style={[styles.prizeCard, { backgroundColor: isDark ? '#1a2a1a' : '#F0FFF4' }]}>
              <View style={styles.prizeRow}>
                <Text style={{ fontSize: 24 }}>🏆</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <ThemedText style={styles.prizeTitle}>Prize Breakdown</ThemedText>
                  <View style={styles.prizeDetail}>
                    <ThemedText style={styles.prizeLabel}>Your entry:</ThemedText>
                    <ThemedText style={styles.prizeValue}>{selectedStake} ⭐</ThemedText>
                  </View>
                  <View style={styles.prizeDetail}>
                    <ThemedText style={styles.prizeLabel}>Total prize ({effectiveSize} players):</ThemedText>
                    <ThemedText style={styles.prizeValue}>{selectedStake * effectiveSize} ⭐</ThemedText>
                  </View>
                  <View style={styles.prizeDetail}>
                    <ThemedText style={styles.prizeLabel}>Platform fee (10%):</ThemedText>
                    <ThemedText style={[styles.prizeValue, { color: '#ef4444' }]}>
                      -{Math.floor((selectedStake * effectiveSize * 10) / 100)} ⭐
                    </ThemedText>
                  </View>
                  <View style={[styles.prizeDetail, styles.prizeTotal]}>
                    <ThemedText style={[styles.prizeLabel, { fontWeight: '700' }]}>Winner gets:</ThemedText>
                    <ThemedText style={[styles.prizeValue, { color: '#22c55e', fontWeight: '700', fontSize: 16 }]}>
                      {getPotentialWin(selectedStake, effectiveSize)} ⭐
                    </ThemedText>
                  </View>
                </View>
              </View>
            </ThemedView>

            {opponentMode === 'online' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
                <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                  {currentQueueStats
                    ? `${currentQueueStats.playersInQueue} player${currentQueueStats.playersInQueue === 1 ? '' : 's'} in queue`
                    : 'Checking queue...'}
                </ThemedText>
              </View>
            )}

            <TouchableOpacity
              onPress={handleJoinTable}
              disabled={joining || balance < selectedStake}
              style={[styles.joinBtn, { backgroundColor: '#F59E0B', opacity: joining || balance < selectedStake ? 0.6 : 1 }]}
              activeOpacity={0.85}
            >
              {joining ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name={opponentMode === 'bot' ? 'hardware-chip-outline' : 'albums-outline'} size={18} color="#fff" />
                  <Text style={styles.joinBtnText}>{opponentMode === 'bot' ? 'Play vs Computer' : 'Join Table'}</Text>
                </>
              )}
            </TouchableOpacity>
            {balance < selectedStake && <GameCoinsHint />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  balanceCoin: { fontSize: 14 },
  balanceText: { fontSize: 14, fontWeight: '700' },
  infoCard: { borderRadius: 12, padding: 14, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 14, fontWeight: '700' },
  infoDesc: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  stakeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  stakeCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  stakeEmoji: { fontSize: 28, marginBottom: 6 },
  stakeAmount: { fontSize: 18, fontWeight: '800' },
  stakeLabel: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  lockedOverlay: { position: 'absolute', top: 8, right: 8 },
  segmented: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  prizeCard: { borderRadius: 14, padding: 16, marginBottom: 16 },
  prizeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  prizeTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  prizeDetail: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  prizeLabel: { fontSize: 13, opacity: 0.7 },
  prizeValue: { fontSize: 13, fontWeight: '600' },
  prizeTotal: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    paddingVertical: 16,
  },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
