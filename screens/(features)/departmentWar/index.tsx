import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useDepartmentWarStore } from '@/store/departmentWarStore';
import { departmentWarService, type Battle } from '@/service/departmentWar.service';
import { OpponentCard } from '@/components/departmentWar/opponentCard';
import { showError, showSuccess } from '@/components/ui/toast';
import { useWarSocket, type ChallengeRejectedPayload, type ChallengeSentPayload } from '@/service/useWarSocket';

type TabType = 'quickmatch' | 'challenges' | 'scheduled';

export default function DepartmentWarScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<TabType>('quickmatch');
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [removingBattleId, setRemovingBattleId] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [pendingChallenges, setPendingChallenges] = useState<Battle[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // ── Resume check (reconnect mid-battle) ──
  const resumeCheckedRef = useRef(false);
  const checkForResume = useCallback(async () => {
    if (resumeCheckedRef.current) return;
    resumeCheckedRef.current = true;
    try {
      const resume = await departmentWarService.resumeBattle();
      if (resume.status === 'countdown' || resume.status === 'active') {
        // Battle still running — take the player straight back to the current question.
        router.push({
          pathname: '/(features)/departmentWar/battleArena',
          params: { battleId: resume.battleId },
        });
      } else if (resume.status === 'finished') {
        // Don't re-route users who already dismissed this battle's result —
        // that caused a loop: "Try Again" → back here → auto-push → the
        // result modal opens again.
        if (useDepartmentWarStore.getState().dismissedFinishedBattleId === resume.battleId) {
          return;
        }
        // Battle ended while they were away — show the "battle ended" result.
        router.push({
          pathname: '/(features)/departmentWar/battleArena',
          params: { battleId: resume.battleId },
        });
      }
    } catch {
      // Resume is best-effort — ignore failures.
    }
  }, [router]);

  // Check once on mount and again whenever the socket (re)connects.
  useEffect(() => {
    checkForResume();
  }, [checkForResume]);

  const {
    myStats,
    setMyStats,
    scheduledBattles,
    setScheduledBattles,
    deptLeaderboard,
    setDeptLeaderboard,
  } = useDepartmentWarStore();

  // ── Load data ──
  const loadData = useCallback(async () => {
    try {
      const [stats, scheduled, leaderboard, pending] = await Promise.all([
        departmentWarService.getMyStats(),
        departmentWarService.getScheduledBattles(),
        departmentWarService.getDeptLeaderboard(),
        departmentWarService.getPendingChallenges(),
      ]);
      setMyStats(stats);
      setScheduledBattles(scheduled);
      setDeptLeaderboard(leaderboard);
      setPendingChallenges(pending);
    } catch (err) {
      console.error('Failed to load war data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // ── Auto-refresh when a battle is cancelled, rejected, or expires ──
  useWarSocket({
    onConnect: checkForResume,
    onChallengeSent: (data: ChallengeSentPayload) => {
      // A new challenge arrived — refresh pending list so the challenges tab updates
      loadData();
    },
    onChallengeRejected: (data: ChallengeRejectedPayload) => {
      // If we have this battle in our scheduled list, animate it out first
      const isInSchedule = scheduledBattles.some((b) => b.id === data.battleId);
      if (isInSchedule) {
        setRemovingBattleId(data.battleId);
        fadeAnim.setValue(1);
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
          loadData();
          setRemovingBattleId(null);
          fadeAnim.setValue(1);
        });
      } else {
        loadData();
      }
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleQuickMatch = () => {
    router.push('/(features)/departmentWar/quickMatchUsers');
  };

  const handleSearchOpponent = () => {
    router.push('/(features)/departmentWar/searchOpponent');
  };

  const handleCancelScheduled = (battle: Battle) => {
    const opponentName =
      (user?.id === battle.player1Id
        ? battle.player2?.firstName || battle.player2?.username
        : battle.player1?.firstName || battle.player1?.username) || 'opponent';

    Alert.alert(
      'Cancel Scheduled Battle',
      `Are you sure you want to cancel the battle with ${opponentName}?`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Battle',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(battle.id);
            try {
              await departmentWarService.cancelScheduledBattle(battle.id);
              showSuccess('Scheduled battle cancelled');
              await loadData();
            } catch (err: any) {
              showError(err?.response?.data?.message || 'Failed to cancel');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <ThemedText style={{ fontSize: 28, fontWeight: '900' }}>⚔️ Brain Battle</ThemedText>
        <ThemedText style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
          Battle classmates, earn points for your department
        </ThemedText>
      </View>

      {/* My Stats Card */}
      {myStats && (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <StatBlock label="Battles" value={myStats.totalBattles} colors={colors} />
            <StatBlock label="Wins" value={myStats.wins} color="#10B981" colors={colors} />
            <StatBlock label="Losses" value={myStats.losses} color="#EF4444" colors={colors} />
            <StatBlock
              label="Win Rate"
              value={
                myStats.totalBattles > 0
                  ? `${Math.round((myStats.wins / myStats.totalBattles) * 100)}%`
                  : '0%'
              }
              colors={colors}
            />
          </View>
          {myStats.currentWinStreak > 0 && (
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <ThemedText style={{ color: '#F59E0B', fontWeight: '700' }}>
                🔥 {myStats.currentWinStreak} Win Streak!
              </ThemedText>
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.push('/(features)/departmentWar/battleHistory')}
            style={{ alignItems: 'center', marginTop: 12 }}
          >
            <ThemedText style={{ color: '#6C3EF4', fontWeight: '600', fontSize: 14 }}>
              View Battle History →
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab bar */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 16,
          marginBottom: 16,
          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
          borderRadius: 14,
          padding: 4,
        }}
      >
        {[
          { key: 'quickmatch' as TabType, label: 'Quick Match', icon: 'flash' },
          { key: 'challenges' as TabType, label: 'Challenge', icon: 'people' },
          { key: 'scheduled' as TabType, label: 'Scheduled', icon: 'calendar' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: activeTab === tab.key ? '#6C3EF4' : 'transparent',
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={14}
              color={activeTab === tab.key ? '#fff' : colors.muted}
            />
            <ThemedText
              style={{
                marginLeft: 4,
                fontSize: 13,
                fontWeight: '600',
                color: activeTab === tab.key ? '#fff' : colors.muted,
              }}
            >
              {tab.label}
            </ThemedText>
            {tab.key === 'challenges' && pendingChallenges.length > 0 && (
              <View
                style={{
                  marginLeft: 6,
                  backgroundColor: '#EF4444',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                }}
              >
                <ThemedText style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                  {pendingChallenges.length > 99 ? '99+' : pendingChallenges.length}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary || '#6C3EF4'} />
        }
      >
        {/* Tab content */}
        {activeTab === 'quickmatch' && (
          <View style={{ paddingHorizontal: 16 }}>
            {/* Quick Match CTA */}
            <TouchableOpacity
              onPress={handleQuickMatch}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#6C3EF4',
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="flash" size={28} color="#fff" />
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <ThemedText style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
                  Quick Match
                </ThemedText>
                <ThemedText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
                  Pick an online classmate to battle right now
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            {/* Search opponent */}
            <TouchableOpacity
              onPress={handleSearchOpponent}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.card,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isDark ? '#312E81' : '#EEF2FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="search" size={22} color="#6C3EF4" />
              </View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <ThemedText style={{ fontWeight: '700', fontSize: 16 }}>Find Opponent</ThemedText>
                <ThemedText style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                  Search and challenge someone specific
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </TouchableOpacity>

            {/* Dept Leaderboard preview */}
            {deptLeaderboard.length > 0 && (
              <View>
                <ThemedText style={{ fontWeight: '700', fontSize: 16, marginBottom: 12 }}>
                  🏆 Department Rankings
                </ThemedText>
                {deptLeaderboard.slice(0, 5).map((dept, index) => (
                  <View
                    key={dept.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <ThemedText
                      style={{
                        fontWeight: '900',
                        fontSize: 16,
                        width: 28,
                        color: index === 0 ? '#F59E0B' : index === 1 ? '#9CA3AF' : index === 2 ? '#CD7F32' : colors.muted,
                      }}
                    >
                      #{index + 1}
                    </ThemedText>
                    <ThemedText style={{ flex: 1, fontWeight: '600', fontSize: 15 }}>
                      {dept.department?.name || 'Unknown Dept'}
                    </ThemedText>
                    <ThemedText style={{ fontWeight: '700', color: '#6C3EF4' }}>
                      {dept.totalPoints} pts
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'challenges' && (
          <View style={{ paddingHorizontal: 16 }}>
            <TouchableOpacity
              onPress={handleSearchOpponent}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#6C3EF4',
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="people" size={20} color="#fff" />
              <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 8 }}>
                Challenge a Friend
              </ThemedText>
            </TouchableOpacity>

            {pendingChallenges.length === 0 ? (
              <ThemedText style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>
                No pending challenges yet.{'\n'}Challenge someone from the search screen!
              </ThemedText>
            ) : (
              pendingChallenges.map((battle) => {
                const challenger = battle.player1;
                const challengerName = challenger?.firstName || challenger?.username || 'Someone';
                const isAccepting = acceptingId === battle.id;
                const isRejecting = rejectingId === battle.id;

                const handleAcceptChallenge = async () => {
                  setAcceptingId(battle.id);
                  try {
                    await departmentWarService.acceptChallenge(battle.id);
                    showSuccess('Challenge accepted! Starting battle...');
                    router.push({
                      pathname: '/(features)/departmentWar/battleArena',
                      params: { battleId: battle.id },
                    });
                  } catch (err: any) {
                    showError(err?.response?.data?.message || 'Failed to accept challenge');
                  } finally {
                    setAcceptingId(null);
                  }
                };

                const handleRejectChallenge = async () => {
                  setRejectingId(battle.id);
                  try {
                    await departmentWarService.rejectChallenge(battle.id);
                  } catch {
                    // Already expired — fine
                  } finally {
                    await loadData();
                    setRejectingId(null);
                  }
                };

                return (
                  <View
                    key={battle.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {/* Challenger avatar */}
                      {challenger?.profilePictureUrl ? (
                        <Image
                          source={{ uri: challenger.profilePictureUrl }}
                          style={{ width: 48, height: 48, borderRadius: 24 }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: '#6C3EF4',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 20 }}>
                            {challengerName.charAt(0).toUpperCase()}
                          </ThemedText>
                        </View>
                      )}

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <ThemedText style={{ fontWeight: '700', fontSize: 15 }}>
                          {challengerName} challenged you!
                        </ThemedText>
                        <ThemedText style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                          ⚔️ {battle.type === 'quick_match' ? 'Quick Match' : 'Direct Challenge'}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Challenger stats */}
                    {battle.challengerStats && battle.challengerStats.totalBattles > 0 && (
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-around',
                          marginTop: 12,
                          paddingVertical: 10,
                          paddingHorizontal: 8,
                          backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                          borderRadius: 12,
                        }}
                      >
                        <View style={{ alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                            {battle.challengerStats.totalBattles}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 11, color: colors.muted }}>Battles</ThemedText>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 16, fontWeight: '800', color: '#10B981' }}>
                            {battle.challengerStats.wins}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 11, color: colors.muted }}>Wins</ThemedText>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 16, fontWeight: '800', color: '#EF4444' }}>
                            {battle.challengerStats.losses}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 11, color: colors.muted }}>Losses</ThemedText>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <ThemedText style={{ fontSize: 16, fontWeight: '800', color: '#F59E0B' }}>
                            {battle.challengerStats.winRate}%
                          </ThemedText>
                          <ThemedText style={{ fontSize: 11, color: colors.muted }}>Win Rate</ThemedText>
                        </View>
                        {battle.challengerStats.currentWinStreak > 0 && (
                          <View style={{ alignItems: 'center' }}>
                            <ThemedText style={{ fontSize: 16, fontWeight: '800', color: '#F59E0B' }}>
                              🔥{battle.challengerStats.currentWinStreak}
                            </ThemedText>
                            <ThemedText style={{ fontSize: 11, color: colors.muted }}>Streak</ThemedText>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Accept / Reject buttons */}
                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                      <TouchableOpacity
                        onPress={handleRejectChallenge}
                        disabled={isAccepting || isRejecting}
                        style={{
                          flex: 1,
                          marginRight: 8,
                          paddingVertical: 10,
                          borderRadius: 14,
                          borderWidth: 1.5,
                          borderColor: colors.border,
                          alignItems: 'center',
                          opacity: isAccepting ? 0.5 : 1,
                        }}
                      >
                        <ThemedText style={{ fontWeight: '700', fontSize: 14, color: colors.muted }}>
                          {isRejecting ? '...' : 'Decline'}
                        </ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleAcceptChallenge}
                        disabled={isAccepting || isRejecting}
                        style={{
                          flex: 1,
                          marginLeft: 8,
                          paddingVertical: 10,
                          borderRadius: 14,
                          backgroundColor: '#6C3EF4',
                          alignItems: 'center',
                          opacity: isRejecting ? 0.5 : 1,
                        }}
                      >
                        <ThemedText style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>
                          {isAccepting ? '...' : 'Accept'}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'scheduled' && (
          <View style={{ paddingHorizontal: 16 }}>
            <TouchableOpacity
              onPress={() => router.push('/(features)/departmentWar/searchOpponent?schedule=true')}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#6C3EF4',
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 8 }}>
                Schedule a Battle
              </ThemedText>
            </TouchableOpacity>

            {scheduledBattles.length === 0 ? (
              <ThemedText style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>
                No scheduled battles yet.{'\n'}Plan a battle with a classmate!
              </ThemedText>
            ) : (
              scheduledBattles.map((battle) => {
                const isChallenger = user?.id === battle.player1Id;
                const opponent = isChallenger ? battle.player2 : battle.player1;
                const opponentName = opponent?.firstName || opponent?.username || 'Unknown';

                const isRemoving = removingBattleId === battle.id;

                return (
                  <Animated.View
                    key={battle.id}
                    style={{
                      opacity: isRemoving ? fadeAnim : 1,
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {/* Opponent avatar */}
                      {opponent?.profilePictureUrl ? (
                        <Image
                          source={{ uri: opponent.profilePictureUrl }}
                          style={{ width: 44, height: 44, borderRadius: 22 }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: '#6C3EF4',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>
                            {opponentName.charAt(0).toUpperCase()}
                          </ThemedText>
                        </View>
                      )}

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <ThemedText style={{ fontWeight: '700', fontSize: 15 }}>
                          {isChallenger ? 'vs ' : 'Challenged by '}{opponentName}
                        </ThemedText>
                        <ThemedText style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                          📅 {new Date(battle.scheduledAt!).toLocaleString()}
                        </ThemedText>
                      </View>

                      {/* Cancel button */}
                      <TouchableOpacity
                        onPress={() => handleCancelScheduled(battle)}
                        disabled={cancellingId === battle.id}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: '#EF4444',
                          opacity: cancellingId === battle.id ? 0.5 : 1,
                        }}
                      >
                        <ThemedText style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>
                          {cancellingId === battle.id ? '...' : 'Cancel'}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBlock({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: string | number;
  color?: string;
  colors: any;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <ThemedText style={{ fontSize: 24, fontWeight: '900', color: color || colors.text }}>
        {value}
      </ThemedText>
      <ThemedText style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>{label}</ThemedText>
    </View>
  );
}
