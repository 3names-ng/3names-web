import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, FlatList, RefreshControl, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { departmentWarService, type OpponentSearchResult } from '@/service/departmentWar.service';
import { OpponentCard } from '@/components/departmentWar/opponentCard';
import { OpponentListSkeleton } from '@/components/departmentWar/warSkeleton';
import { useDelayedLoading } from '@/components/ui/skeleton';
import { showError, showSuccess } from '@/components/ui/toast';
import { useDepartmentWarStore } from '@/store/departmentWarStore';
import {
  useWarSocket,
  type BattleStartPayload,
  type ChallengeRejectedPayload,
} from '@/service/useWarSocket';

export default function QuickMatchUsersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [users, setUsers] = useState<OpponentSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDelayedLoading(loading);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  // ── Waiting state ──
  const [waitingBattleId, setWaitingBattleId] = useState<string | null>(null);
  const [waitingOpponent, setWaitingOpponent] = useState<OpponentSearchResult | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { setActiveBattle, setOpponentInfo, setBattlePhase } = useDepartmentWarStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Socket: listen for battle start & rejection ──
  const { joinBattleRoom, leaveBattleRoom } = useWarSocket({
    onBattleStart: (data: BattleStartPayload) => {
      if (data.battleId === waitingBattleId) {
        clearTimer();
        // Navigate to battle arena
        setWaitingBattleId(null);
        setWaitingOpponent(null);
        router.replace({
          pathname: '/(features)/departmentWar/battleArena',
          params: { battleId: data.battleId },
        });
      }
    },
    onChallengeRejected: (data: ChallengeRejectedPayload) => {
      if (data.battleId === waitingBattleId) {
        clearTimer();
        const message =
          data.reason === 'expired'
            ? 'Challenge expired — opponent didn\'t respond in time.'
            : data.reason === 'cancelled'
            ? 'Challenge was cancelled.'
            : 'Challenge declined.';
        showError(message);
        setWaitingBattleId(null);
        setWaitingOpponent(null);
      }
    },
  });

  // ── Join / leave battle room when waiting state changes ──
  useEffect(() => {
    if (waitingBattleId) {
      joinBattleRoom(waitingBattleId);
      return () => {
        leaveBattleRoom(waitingBattleId);
      };
    }
  }, [waitingBattleId]);

  // ── Countdown timer while waiting ──
  useEffect(() => {
    if (!waitingBattleId) {
      clearTimer();
      return;
    }

    setSecondsLeft(30);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          // Backend auto-cancels after expiresAt, but clean up locally too
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimer();
  }, [waitingBattleId]);

  // ── Pulsing animation while waiting ──
  useEffect(() => {
    if (!waitingBattleId) {
      pulseAnim.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [waitingBattleId]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ── Load available users ──
  const loadUsers = useCallback(async () => {
    try {
      const data = await departmentWarService.getQuickMatchCandidates();
      setUsers(data);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to load active users');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadUsers();
      setLoading(false);
    })();
  }, [loadUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }, [loadUsers]);

  // ── Send challenge request ──
  const handlePick = async (opponent: OpponentSearchResult) => {
    if (sendingTo || waitingBattleId) return;
    setSendingTo(opponent.id);
    try {
      const result = await departmentWarService.findMatch(opponent.id);
      setActiveBattle({ id: result.battleId } as any);
      setOpponentInfo(result.opponent);
      setBattlePhase('lobby');
      setWaitingBattleId(result.battleId);
      setWaitingOpponent(opponent);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to send match request');
    } finally {
      setSendingTo(null);
    }
  };

  // ── Cancel waiting challenge ──
  const handleCancel = async () => {
    if (!waitingBattleId) return;
    try {
      await departmentWarService.cancelChallenge(waitingBattleId);
      clearTimer();
      leaveBattleRoom(waitingBattleId);
      setWaitingBattleId(null);
      setWaitingOpponent(null);
    } catch (err: any) {
      // Battle may have already been accepted or expired — just drop locally
      clearTimer();
      leaveBattleRoom(waitingBattleId);
      setWaitingBattleId(null);
      setWaitingOpponent(null);
    }
  };

  // ── Waiting state: show opponent + countdown ──
  if (waitingBattleId && waitingOpponent) {
    const displayName = waitingOpponent.firstName || waitingOpponent.username || 'Someone';

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          {/* Opponent avatar */}
          {waitingOpponent.profilePictureUrl ? (
            <Image
              source={{ uri: waitingOpponent.profilePictureUrl }}
              style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 20 }}
            />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: '#6C3EF4',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 36 }}>
                {displayName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          )}

          {/* Pulsing indicator */}
          <Animated.View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#F59E0B',
              marginBottom: 16,
              opacity: pulseAnim,
            }}
          />

          <ThemedText style={{ fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
            Challenge sent!
          </ThemedText>
          <ThemedText style={{ fontSize: 16, fontWeight: '600', color: '#6C3EF4', marginBottom: 6 }}>
            {displayName}
          </ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            Waiting for them to accept or decline...
          </ThemedText>

          {/* Countdown */}
          {secondsLeft > 0 && (
            <View
              style={{
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 10,
                marginBottom: 32,
              }}
            >
              <ThemedText style={{ color: '#F59E0B', fontWeight: '700', fontSize: 15 }}>
                Expires in {secondsLeft}s
              </ThemedText>
            </View>
          )}

          {secondsLeft <= 0 && (
            <ThemedText style={{ color: '#EF4444', fontWeight: '600', fontSize: 14, marginBottom: 32 }}>
              Challenge expired
            </ThemedText>
          )}

          {/* Cancel button */}
          <TouchableOpacity
            onPress={handleCancel}
            style={{
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: 24,
              paddingVertical: 14,
              paddingHorizontal: 40,
            }}
          >
            <ThemedText style={{ fontWeight: '700', fontSize: 15, color: colors.muted }}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Normal state: show list of available users ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <ThemedText style={{ fontSize: 22, fontWeight: '900' }}>⚡ Quick Match</ThemedText>
        <ThemedText style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
          Pick someone online in your department to battle
        </ThemedText>
      </View>

      {/* Auto-match fallback */}
      <TouchableOpacity
        onPress={() => router.push('/(features)/departmentWar/matchmaking')}
        activeOpacity={0.8}
        style={{
          marginHorizontal: 16,
          marginBottom: 16,
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Ionicons name="shuffle" size={18} color="#6C3EF4" />
        <ThemedText style={{ marginLeft: 10, flex: 1, fontWeight: '600', fontSize: 14 }}>
          Not picky? Auto-match me with anyone
        </ThemedText>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </TouchableOpacity>

      {loading ? (
        showSkeleton ? <OpponentListSkeleton /> : null
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C3EF4" />}
          renderItem={({ item }) => (
            <OpponentCard
              username={item.username}
              firstName={item.firstName}
              lastName={item.lastName}
              profilePictureUrl={item.profilePictureUrl}
              stats={item.stats}
              showChallengeButton={!sendingTo && !waitingBattleId}
              onChallenge={() => handlePick(item)}
              onPress={() => handlePick(item)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="moon-outline" size={48} color={colors.muted} />
              <ThemedText style={{ color: colors.muted, marginTop: 12, fontSize: 15, textAlign: 'center' }}>
                No one from your department is online right now.{'\n'}Try auto-match or check back soon.
              </ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
