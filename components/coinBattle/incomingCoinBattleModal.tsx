import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Animated, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useCoinBattleStore } from '@/store/coinBattleStore';
import { coinBattleService } from '@/service/coinBattle.service';
import { useCoinBattleSocket, type CoinChallengeSentPayload } from '@/service/useCoinBattleSocket';
import { showError } from '@/components/ui/toast';

/**
 * Global "you've been challenged" popup for coin battles. Mounted once at the
 * root layout so it can pop up over any screen the moment a
 * coin-battle:challenge_sent event arrives, mirroring the department war
 * IncomingChallengeModal.
 */
export function IncomingCoinBattleModal() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [challenge, setChallenge] = useState<CoinChallengeSentPayload | null>(null);
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const visible = !!challenge;

  const { joinBattleRoom } = useCoinBattleSocket({
    onChallengeSent: (data) => setChallenge(data),
    onChallengeRejected: (data) => {
      // The challenger cancelled — dismiss if it's this challenge.
      setChallenge((cur) => (cur && cur.battleId === data.battleId ? null : cur));
    },
  });

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    }
  }, [challenge?.battleId]);

  // Countdown + auto-dismiss when the challenge expires
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
        setChallenge(null);
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

  const handleAccept = async () => {
    setBusy('accept');
    try {
      const result = await coinBattleService.acceptChallenge(challenge.battleId);
      const store = useCoinBattleStore.getState();
      // The challenger is player1; the acceptor is player2.
      store.setBattleId(challenge.battleId);
      store.setMatchFound({
        stake: challenge.stake,
        pot: challenge.pot,
        winnerPrize: challenge.winnerPrize,
        platformFee: challenge.platformFee,
        player1Id: challenge.challenger.id,
        opponent: {
          id: challenge.challenger.id,
          username: challenge.challenger.username,
          firstName: challenge.challenger.firstName,
          profilePictureUrl: challenge.challenger.profilePictureUrl,
        },
      });
      store.setQuestions(result.questions);
      store.setCurrentQuestion({ questionIndex: 0, selectedOption: null, result: null, correctOption: null });
      store.setMyScore(0);
      store.setOpponentScore(0);
      setChallenge(null);
      joinBattleRoom(challenge.battleId);
      router.push('/(features)/games/coinBattleArena' as any);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'That challenge is no longer available');
      setChallenge(null);
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy('reject');
    try {
      await coinBattleService.rejectChallenge(challenge.battleId);
    } catch {
      // Already expired/cancelled server-side — fine, just drop it locally.
    } finally {
      setChallenge(null);
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
                backgroundColor: '#F59E0B',
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
              backgroundColor: '#FFD70020',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <ThemedText style={{ color: '#F59E0B', fontWeight: '700', fontSize: 12 }}>
              ⭐ COIN BATTLE CHALLENGE
            </ThemedText>
          </View>

          {/* Title */}
          <ThemedText style={{ fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
            {displayName} challenged you!
          </ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
            Answer trivia head-to-head. Winner takes the Stars!
          </ThemedText>

          {/* Entry card */}
          <View
            style={{
              width: '100%',
              backgroundColor: isDark ? '#0F172A' : '#FFF8E1',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: isDark ? '#1E293B' : '#FDE68A',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 20, fontWeight: '800', color: '#F59E0B' }}>
                  ⭐ {challenge.stake}
                </ThemedText>
                <ThemedText style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                  Your entry
                </ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 20, fontWeight: '800', color: '#F59E0B' }}>
                  ⭐ {challenge.pot}
                </ThemedText>
                <ThemedText style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                  Total prize
                </ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 20, fontWeight: '800', color: '#10B981' }}>
                  ⭐ {challenge.winnerPrize}
                </ThemedText>
                <ThemedText style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                  Winner gets
                </ThemedText>
              </View>
            </View>
          </View>

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
                backgroundColor: '#F59E0B',
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