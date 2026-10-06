import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Animated, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { departmentWarService } from '@/service/departmentWar.service';
import { useDepartmentWarStore } from '@/store/departmentWarStore';
import { showError } from '@/components/ui/toast';

interface OpponentStats {
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number;
  currentWinStreak: number;
  bestWinStreak: number;
}

/**
 * Global "you've been challenged" popup. Mounted once at the root layout so
 * it can pop up over any screen the moment a war:challenge_sent event
 * arrives, and gates the battle from starting until this user responds.
 */
export function IncomingChallengeModal() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const { pendingChallenges, dequeueChallenge, setActiveBattle, setOpponentInfo, setBattlePhase, setQuestions, setCurrentQuestion, setMyScore, setOpponentScore } =
    useDepartmentWarStore();
  const challenge = pendingChallenges[0] ?? null;
  const visible = !!challenge;
  const opponentStats = challenge?.challengerStats ?? null;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    }
  }, [challenge?.battleId]);

  // Countdown + auto-reject when the challenge expires
  useEffect(() => {
    if (!challenge?.expiresAt) {
      setSecondsLeft(null);
      return;
    }

    const expiresAtMs = new Date(challenge.expiresAt).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.round((expiresAtMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        dequeueChallenge(challenge.battleId);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [challenge?.battleId, challenge?.expiresAt]);

  if (!challenge) {
    return null;
  }

  const displayName = challenge.challenger.firstName || challenge.challenger.username || 'Someone';
  const isQuickMatch = challenge.type === 'quick_match';

  const handleAccept = async () => {
    setBusy('accept');
    try {
      const result = await departmentWarService.acceptChallenge(challenge.battleId);
      setActiveBattle({ id: challenge.battleId } as any);
      setOpponentInfo(challenge.challenger);
      setBattlePhase('countdown');
      // Store questions directly in Zustand — avoids URL param serialization issues
      setQuestions(result.questions as any);
      setCurrentQuestion({ questionIndex: 0, selectedOption: null, result: null, correctOption: null });
      setMyScore(0);
      setOpponentScore(0);
      dequeueChallenge(challenge.battleId);
      router.push({
        pathname: '/(features)/departmentWar/battleArena',
        params: { battleId: challenge.battleId },
      });
    } catch (err: any) {
      showError(err?.response?.data?.message || 'That challenge is no longer available');
      dequeueChallenge(challenge.battleId);
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy('reject');
    try {
      await departmentWarService.rejectChallenge(challenge.battleId);
    } catch {
      // Already expired/cancelled server-side — fine, just drop it locally.
    } finally {
      dequeueChallenge(challenge.battleId);
      setBusy(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 30,
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            backgroundColor: isDark ? '#1E293B' : '#fff',
            borderRadius: 28,
            padding: 32,
            width: '100%',
            alignItems: 'center',
          }}
        >
          {/* Avatar */}
          {challenge.challenger.profilePictureUrl ? (
            <Image
              source={{ uri: challenge.challenger.profilePictureUrl }}
              style={{ width: 84, height: 84, borderRadius: 42, marginBottom: 16 }}
            />
          ) : (
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: '#6C3EF4',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 32 }}>
                {displayName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          )}

          {/* Type badge */}
          <View
            style={{
              backgroundColor: isDark ? '#312E81' : '#EEF2FF',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <ThemedText style={{ color: '#6C3EF4', fontWeight: '700', fontSize: 12 }}>
              {isQuickMatch ? '⚡ QUICK MATCH' : '⚔️ DIRECT CHALLENGE'}
            </ThemedText>
          </View>

          {/* Title */}
          <ThemedText style={{ fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
            {displayName} challenged you!
          </ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
            Answer trivia questions head-to-head and earn points for your department.
          </ThemedText>

          {/* ── Opponent Stats Card ── */}
          {opponentStats && opponentStats.totalBattles > 0 && (
            <View
              style={{
                width: '100%',
                backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              }}
            >
              <ThemedText
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 10,
                  textAlign: 'center',
                }}
              >
                Opponent Record
              </ThemedText>

              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {/* Battles */}
                <View style={{ alignItems: 'center' }}>
                  <ThemedText style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>
                    {opponentStats.totalBattles}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    Battles
                  </ThemedText>
                </View>

                {/* Wins */}
                <View style={{ alignItems: 'center' }}>
                  <ThemedText style={{ fontSize: 20, fontWeight: '800', color: '#10B981' }}>
                    {opponentStats.wins}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    Wins
                  </ThemedText>
                </View>

                {/* Losses */}
                <View style={{ alignItems: 'center' }}>
                  <ThemedText style={{ fontSize: 20, fontWeight: '800', color: '#EF4444' }}>
                    {opponentStats.losses}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    Losses
                  </ThemedText>
                </View>

                {/* Win Rate */}
                <View style={{ alignItems: 'center' }}>
                  <ThemedText style={{ fontSize: 20, fontWeight: '800', color: '#F59E0B' }}>
                    {opponentStats.winRate}%
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    Win Rate
                  </ThemedText>
                </View>
              </View>

              {/* Win Streak */}
              {opponentStats.currentWinStreak > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 10,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
                  }}
                >
                  <ThemedText style={{ fontSize: 16, marginRight: 6 }}>🔥</ThemedText>
                  <ThemedText style={{ fontSize: 14, fontWeight: '700', color: '#F59E0B' }}>
                    {opponentStats.currentWinStreak} win streak
                  </ThemedText>
                  {opponentStats.bestWinStreak > opponentStats.currentWinStreak && (
                    <ThemedText style={{ fontSize: 12, color: colors.muted, marginLeft: 8 }}>
                      (best: {opponentStats.bestWinStreak})
                    </ThemedText>
                  )}
                </View>
              )}
            </View>
          )}

          {secondsLeft !== null && (
            <ThemedText style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13, marginBottom: 20 }}>
              Expires in {secondsLeft}s
            </ThemedText>
          )}
          {secondsLeft === null && <View style={{ marginBottom: 20 }} />}

          {/* Actions */}
          <View style={{ flexDirection: 'row', width: '100%' }}>
            <TouchableOpacity
              onPress={handleReject}
              disabled={busy !== null}
              style={{
                flex: 1,
                marginRight: 8,
                borderWidth: 1.5,
                borderColor: colors.border,
                paddingVertical: 14,
                borderRadius: 24,
                alignItems: 'center',
                opacity: busy === 'accept' ? 0.5 : 1,
              }}
            >
              {busy === 'reject' ? (
                <Ionicons name="hourglass-outline" size={18} color={colors.muted} />
              ) : (
                <ThemedText style={{ fontWeight: '700', fontSize: 15, color: colors.muted }}>Decline</ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAccept}
              disabled={busy !== null}
              style={{
                flex: 1,
                marginLeft: 8,
                backgroundColor: '#6C3EF4',
                paddingVertical: 14,
                borderRadius: 24,
                alignItems: 'center',
                opacity: busy === 'reject' ? 0.5 : 1,
              }}
            >
              {busy === 'accept' ? (
                <Ionicons name="hourglass-outline" size={18} color="#fff" />
              ) : (
                <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Accept</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
