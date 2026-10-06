import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useCoinBattleStore } from '@/store/coinBattleStore';
import { useCoinBattleSocket } from '@/service/useCoinBattleSocket';
import {
  coinBattleService,
  type CoinBattleStake,
  type CoinActiveUser,
  type PendingCoinChallenge,
} from '@/service/coinBattle.service';
import { coinService } from '@/service/coin.service';
import { GameCoinsBadge, GameCoinsHint } from '@/components/games/gameCoins';
import { OnlinePlayersSkeleton } from '@/components/games/gameSkeletons';
import { useDelayedLoading } from '@/components/ui/skeleton';
import { showError } from '@/components/ui/toast';

const STAKE_OPTIONS: { amount: CoinBattleStake; label: string; emoji: string; color: string }[] = [
  { amount: 50, label: 'Bronze', emoji: '🥉', color: '#CD7F32' },
  { amount: 100, label: 'Silver', emoji: '🥈', color: '#C0C0C0' },
  { amount: 250, label: 'Gold', emoji: '🥇', color: '#FFD700' },
  { amount: 500, label: 'Diamond', emoji: '💎', color: '#B9F2FF' },
];

type FlowState = 'select' | 'waiting';

export default function CoinBattleStakeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const currentUser = useAuthStore((state) => state.user);

  // ── Flow state ──
  const [flowState, setFlowState] = useState<FlowState>('select');
  const [selectedStake, setSelectedStake] = useState<CoinBattleStake | null>(null);
  const [balance, setBalance] = useState<number>(0);

  // ── Opponent picker ──
  const [users, setUsers] = useState<CoinActiveUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const showPlayersSkeleton = useDelayedLoading(usersLoading);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  // ── Waiting state ──
  const [waitingBattleId, setWaitingBattleId] = useState<string | null>(null);
  const [waitingOpponent, setWaitingOpponent] = useState<CoinActiveUser | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30);

  // ── Incoming challenges (we are the challenged user) ──
  const [pendingChallenges, setPendingChallenges] = useState<PendingCoinChallenge[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Stars (game coins, the only currency that can be staked)
  const refreshBalance = useCallback(() => {
    coinService.getBalance().then((b) => setBalance(coinService.stakeableCoins(b))).catch(() => {});
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const loadPending = useCallback(async () => {
    try {
      setPendingChallenges(await coinBattleService.getPendingChallenges());
    } catch {
      // best-effort
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  // Load online users for the selected stake (the "category")
  useEffect(() => {
    if (!selectedStake) {
      setUsers([]);
      return;
    }
    setUsersLoading(true);
    coinBattleService
      .getActiveUsers(selectedStake)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [selectedStake]);

  // Challenge request countdown (30s, then the server expires it)
  useEffect(() => {
    if (!waitingBattleId) return;
    setSecondsLeft(30);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [waitingBattleId]);

  // Socket handlers
  const { joinBattleRoom, leaveBattleRoom } = useCoinBattleSocket({
    onChallengeAccepted: (data) => {
      if (data.battleId === waitingBattleId) {
        const store = useCoinBattleStore.getState();
        // The challenger is always player1.
        store.setBattleId(data.battleId);
        store.setMatchFound({
          stake: data.stake,
          pot: data.pot,
          winnerPrize: data.winnerPrize,
          platformFee: data.platformFee,
          player1Id: currentUser?.id || '',
          opponent: {
            id: data.opponent.id,
            username: data.opponent.username,
            firstName: data.opponent.firstName,
            profilePictureUrl: data.opponent.profilePictureUrl,
          },
        });
        joinBattleRoom(data.battleId);
        setFlowState('select');
        setWaitingBattleId(null);
        setWaitingOpponent(null);
        router.push('/(features)/games/coinBattleArena' as any);
      }
    },
    onChallengeRejected: (data) => {
      if (data.battleId === waitingBattleId) {
        setWaitingBattleId(null);
        setWaitingOpponent(null);
        setFlowState('select');
        const msg =
          data.reason === 'expired'
            ? "Challenge expired — opponent didn't respond."
            : data.reason === 'cancelled'
              ? 'Challenge was cancelled.'
              : 'Challenge declined.';
        showError(msg);
      } else {
        // One of OUR pending incoming challenges was resolved elsewhere
        // (cancelled by the challenger) — refresh the list.
        loadPending();
      }
    },
    onChallengeSent: () => {
      // A new incoming challenge arrived while this screen is open
      loadPending();
    },
  });

  const handleSelectStake = (amount: CoinBattleStake) => {
    setSelectedStake(amount);
  };

  const handleChallenge = async (opponent: CoinActiveUser) => {
    if (!selectedStake || sendingTo || waitingBattleId) return;
    setSendingTo(opponent.id);
    try {
      const result = await coinBattleService.challenge(opponent.id, selectedStake);
      setWaitingBattleId(result.battleId);
      setWaitingOpponent(opponent);
      setFlowState('waiting');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send challenge');
    } finally {
      setSendingTo(null);
    }
  };

  const handleCancelWaiting = async () => {
    if (!waitingBattleId) return;
    try {
      await coinBattleService.cancelChallenge(waitingBattleId);
    } catch {
      // already expired/cancelled — fine
    }
    leaveBattleRoom(waitingBattleId);
    setWaitingBattleId(null);
    setWaitingOpponent(null);
    setFlowState('select');
  };

  const handleAcceptChallenge = async (challenge: PendingCoinChallenge) => {
    setAcceptingId(challenge.id);
    try {
      const result = await coinBattleService.acceptChallenge(challenge.id);
      const store = useCoinBattleStore.getState();
      // The challenger is player1; the acceptor is player2.
      store.setBattleId(challenge.id);
      store.setMatchFound({
        stake: challenge.stake,
        pot: challenge.pot,
        winnerPrize: challenge.winnerPrize,
        platformFee: challenge.platformFee,
        player1Id: challenge.challenger?.id || '',
        opponent: challenge.challenger
          ? {
              id: challenge.challenger.id,
              username: challenge.challenger.username,
              firstName: challenge.challenger.firstName,
              profilePictureUrl: challenge.challenger.profilePictureUrl,
            }
          : null,
      });
      store.setQuestions(result.questions);
      store.setCurrentQuestion({ questionIndex: 0, selectedOption: null, result: null, correctOption: null });
      store.setMyScore(0);
      store.setOpponentScore(0);
      setPendingChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
      joinBattleRoom(challenge.id);
      router.push('/(features)/games/coinBattleArena' as any);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to accept challenge');
      loadPending();
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectChallenge = async (challenge: PendingCoinChallenge) => {
    setRejectingId(challenge.id);
    try {
      await coinBattleService.rejectChallenge(challenge.id);
    } catch {
      // already expired — fine
    } finally {
      setPendingChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
      setRejectingId(null);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadPending(),
      selectedStake
        ? coinBattleService.getActiveUsers(selectedStake).then(setUsers).catch(() => {})
        : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [selectedStake, loadPending]);

  const filteredUsers = searchQuery.trim()
    ? users.filter((u) =>
        [u.firstName, u.lastName, u.username].filter(Boolean).some((n) => n!.toLowerCase().includes(searchQuery.trim().toLowerCase())),
      )
    : users;

  const getPotentialWin = (stake: number) => {
    const pot = stake * 2;
    const fee = Math.floor((pot * 10) / 100);
    return pot - fee;
  };

  // ═══════════════════════════════════════
  // RENDER: WAITING (challenge sent)
  // ═══════════════════════════════════════
  if (flowState === 'waiting' && waitingBattleId && waitingOpponent) {
    const displayName = waitingOpponent.firstName || waitingOpponent.username || 'Someone';
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          {waitingOpponent.profilePictureUrl ? (
            <Image source={{ uri: waitingOpponent.profilePictureUrl }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 20 }} />
          ) : (
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 40 }}>{displayName.charAt(0).toUpperCase()}</ThemedText>
            </View>
          )}

          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#F59E0B', marginBottom: 16 }} />

          <ThemedText style={{ fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>Challenge sent!</ThemedText>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', color: '#F59E0B', marginBottom: 6 }}>{displayName}</ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 15, textAlign: 'center', marginBottom: 24 }}>
            Waiting for them to accept or decline...
          </ThemedText>

          {/* VS preview */}
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 20, borderRadius: 20, width: '100%', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%' }}>
              <View style={{ alignItems: 'center' }}>
                {currentUser?.profilePictureUrl ? (
                  <Image source={{ uri: currentUser.profilePictureUrl }} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 8 }} />
                ) : (
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 24 }}>{(currentUser?.username || 'Y').charAt(0).toUpperCase()}</ThemedText>
                  </View>
                )}
                <ThemedText style={{ fontWeight: '700', fontSize: 14 }}>You</ThemedText>
              </View>

              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
                <ThemedText style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>VS</ThemedText>
              </View>

              <View style={{ alignItems: 'center' }}>
                {waitingOpponent.profilePictureUrl ? (
                  <Image source={{ uri: waitingOpponent.profilePictureUrl }} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 8 }} />
                ) : (
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 24 }}>{displayName.charAt(0).toUpperCase()}</ThemedText>
                  </View>
                )}
                <ThemedText style={{ fontWeight: '700', fontSize: 14 }}>{displayName}</ThemedText>
              </View>
            </View>

            {/* Entry */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={{ color: '#F59E0B', fontWeight: '800', fontSize: 15 }}>⭐ {selectedStake}</ThemedText>
                <ThemedText style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>Your entry</ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={{ color: '#F59E0B', fontWeight: '800', fontSize: 15 }}>⭐ {selectedStake ? selectedStake * 2 : 0}</ThemedText>
                <ThemedText style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>Total prize</ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={{ color: '#22c55e', fontWeight: '800', fontSize: 15 }}>⭐ {selectedStake ? getPotentialWin(selectedStake) : 0}</ThemedText>
                <ThemedText style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>Winner gets</ThemedText>
              </View>
            </View>
          </View>

          {secondsLeft > 0 ? (
            <View style={{ backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 24 }}>
              <ThemedText style={{ color: '#F59E0B', fontWeight: '700', fontSize: 15 }}>Expires in {secondsLeft}s</ThemedText>
            </View>
          ) : (
            <ThemedText style={{ color: '#EF4444', fontWeight: '600', fontSize: 14, marginBottom: 24 }}>Challenge expired</ThemedText>
          )}

          <TouchableOpacity onPress={handleCancelWaiting} style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 40 }}>
            <ThemedText style={{ fontWeight: '700', fontSize: 15, color: colors.muted }}>Cancel Challenge</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════
  // RENDER: SELECT (stake + opponent picker)
  // ═══════════════════════════════════════
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

         {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>Coin Battle</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Challenge players for Stars</ThemedText>
          </View>
          <GameCoinsBadge balance={balance} />
        </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
      >
     

        {/* Incoming challenges */}
        {pendingChallenges.length > 0 && (
          <>
            <ThemedText style={styles.sectionTitle}>Incoming Challenges</ThemedText>
            {pendingChallenges.map((challenge) => {
              const challengerName = challenge.challenger?.firstName || challenge.challenger?.username || 'Someone';
              const isAccepting = acceptingId === challenge.id;
              const isRejecting = rejectingId === challenge.id;
              return (
                <View
                  key={challenge.id}
                  style={{ backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F59E0B55' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {challenge.challenger?.profilePictureUrl ? (
                      <Image source={{ uri: challenge.challenger.profilePictureUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                    ) : (
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
                        <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{challengerName.charAt(0).toUpperCase()}</ThemedText>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={{ fontWeight: '700', fontSize: 15 }}>{challengerName}</ThemedText>
                      <ThemedText style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13, marginTop: 2 }}>
                        ⭐ {challenge.stake} stake · 🏆 {challenge.winnerPrize} to win
                      </ThemedText>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleRejectChallenge(challenge)}
                      disabled={isAccepting || isRejecting}
                      style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: 9, alignItems: 'center' }}
                    >
                      {isRejecting ? (
                        <ActivityIndicator size="small" color={colors.muted} />
                      ) : (
                        <ThemedText style={{ fontWeight: '600', fontSize: 13, color: colors.muted }}>Decline</ThemedText>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAcceptChallenge(challenge)}
                      disabled={isAccepting || isRejecting}
                      style={{ flex: 1, backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 9, alignItems: 'center' }}
                    >
                      {isAccepting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <ThemedText style={{ fontWeight: '700', fontSize: 13, color: '#fff' }}>Accept</ThemedText>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* How it works */}
        <ThemedView style={[styles.infoCard, { backgroundColor: isDark ? '#1a1f3a' : '#F0F4FF' }]}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#DBEAFE' }]}>
              <Text style={{ fontSize: 18 }}>💰</Text>
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoTitle}>How it Works</ThemedText>
              <ThemedText style={styles.infoDesc}>Pick your entry • Choose an online opponent • Send a request • Win</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Stake Selection */}
        <ThemedText style={styles.sectionTitle}>Choose Your Entry</ThemedText>
        <View style={styles.stakeGrid}>
          {STAKE_OPTIONS.map((option) => {
            const isSelected = selectedStake === option.amount;
            const canAfford = balance >= option.amount;
            const potentialWin = getPotentialWin(option.amount);

            return (
              <TouchableOpacity
                key={option.amount}
                style={[
                  styles.stakeCard,
                  {
                    backgroundColor: isSelected
                      ? option.color + '20'
                      : isDark ? '#1a1f3a' : '#FFFFFF',
                    borderColor: isSelected ? option.color : isDark ? '#2a2f4a' : '#E5E7EB',
                    opacity: canAfford ? 1 : 0.5,
                  },
                ]}
                onPress={() => canAfford && handleSelectStake(option.amount)}
                activeOpacity={0.8}
                disabled={!canAfford}
              >
                <Text style={styles.stakeEmoji}>{option.emoji}</Text>
                <ThemedText style={[styles.stakeAmount, { color: option.color }]}>
                  {option.amount} ⭐
                </ThemedText>
                <ThemedText style={styles.stakeLabel}>{option.label}</ThemedText>
                <View style={[styles.potBadge, { backgroundColor: option.color + '15' }]}>
                  <ThemedText style={[styles.potText, { color: option.color }]}>
                    Win {potentialWin} ⭐
                  </ThemedText>
                </View>
                {!canAfford && (
                  <View style={styles.lockedOverlay}>
                    <Ionicons name="lock-closed" size={16} color="#999" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        {STAKE_OPTIONS.some((option) => balance < option.amount) && (
          <GameCoinsHint text="Need more Stars? Win games or collect rewards to earn more." />
        )}

        {/* Opponent picker (once a stake is selected) */}
        {selectedStake && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <ThemedText style={styles.sectionTitle}>Choose Your Opponent</ThemedText>
              <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
                {usersLoading ? 'Loading...' : `${filteredUsers.length} online`}
              </ThemedText>
            </View>

            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginBottom: 12 }}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name..."
                placeholderTextColor={colors.muted}
                style={{ flex: 1, color: colors.text, fontSize: 14, marginLeft: 10 }}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            {usersLoading ? (
              showPlayersSkeleton ? <OnlinePlayersSkeleton /> : null
            ) : filteredUsers.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 24 }}>
                <Ionicons name="moon-outline" size={44} color={colors.muted} />
                <ThemedText style={{ color: colors.muted, marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                  {searchQuery ? 'No users found.' : `No one is online in the ${selectedStake} ⭐ category right now.`}
                </ThemedText>
                <TouchableOpacity onPress={onRefresh} style={{ marginTop: 14 }}>
                  <ThemedText style={{ color: '#F59E0B', fontWeight: '700', fontSize: 14 }}>↻ Refresh</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              filteredUsers.map((user) => {
                const displayName = user.firstName || user.username || 'Unknown';
                const isSending = sendingTo === user.id;
                return (
                  <View
                    key={user.id}
                    style={{ backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }}
                  >
                    {user.profilePictureUrl ? (
                      <Image source={{ uri: user.profilePictureUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                    ) : (
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
                        <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{displayName.charAt(0).toUpperCase()}</ThemedText>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={{ fontWeight: '600', fontSize: 15 }}>{displayName}</ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Text style={{ fontSize: 12 }}>⭐</Text>
                        <ThemedText style={{ color: '#F59E0B', fontWeight: '700', fontSize: 12, marginLeft: 2 }}>
                          {user.balance.toLocaleString()} available
                        </ThemedText>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleChallenge(user)}
                      disabled={!!sendingTo || !!waitingBattleId}
                      style={{ backgroundColor: '#F59E0B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', opacity: sendingTo && !isSending ? 0.5 : 1 }}
                    >
                      {isSending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="flash" size={14} color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 4 }}>Challenge</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* Prize Info */}
        {selectedStake && (
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
                  <ThemedText style={styles.prizeLabel}>Total prize:</ThemedText>
                  <ThemedText style={styles.prizeValue}>{selectedStake * 2} ⭐</ThemedText>
                </View>
                <View style={styles.prizeDetail}>
                  <ThemedText style={styles.prizeLabel}>Platform fee (10%):</ThemedText>
                  <ThemedText style={[styles.prizeValue, { color: '#ef4444' }]}>
                    -{Math.floor((selectedStake * 2 * 10) / 100)} ⭐
                  </ThemedText>
                </View>
                <View style={[styles.prizeDetail, styles.prizeTotal]}>
                  <ThemedText style={[styles.prizeLabel, { fontWeight: '700' }]}>Winner gets:</ThemedText>
                  <ThemedText style={[styles.prizeValue, { color: '#22c55e', fontWeight: '700', fontSize: 16 }]}>
                    {getPotentialWin(selectedStake)} ⭐
                  </ThemedText>
                </View>
              </View>
            </View>
          </ThemedView>
        )}

        {/* Stats hint */}
        <View style={styles.statsHint}>
          <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
          <ThemedText style={[styles.statsHintText, { color: colors.muted }]}>
            10 questions • 15s each • Highest score takes the Stars
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
     paddingHorizontal: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  balanceCoin: {
    fontSize: 14,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Info
  infoCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoDesc: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  // Stake
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  stakeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  stakeCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  stakeEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  stakeAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  stakeLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  potBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  potText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  // Prize
  prizeCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  prizeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  prizeDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  prizeLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  prizeValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  prizeTotal: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  statsHintText: {
    fontSize: 12,
  },
});