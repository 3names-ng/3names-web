import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BackHandler, Alert, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useCoinBattleStore } from '@/store/coinBattleStore';
import { coinBattleService } from '@/service/coinBattle.service';
import { useCoinBattleSocket, type CoinBattleEndedPayload, type CoinScoreUpdatePayload } from '@/service/useCoinBattleSocket';

export default function CoinBattleArena() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const currentUser = useAuthStore((state) => state.user);

  const {
    questions, setQuestions,
    currentQuestion, setCurrentQuestion,
    myScore, setMyScore,
    opponentScore, setOpponentScore,
    matchData,
    lastResult, setLastResult,
    resetBattle,
  } = useCoinBattleStore();

  const [showCountdown, setShowCountdown] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTimeRef = useRef<number>(0);
  const initializedRef = useRef(false);
  const totalQuestions = questions.length;
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [myLastPoints, setMyLastPoints] = useState<number | null>(null);
  const [oppLastPoints, setOppLastPoints] = useState<number | null>(null);
  // Opponent dropped mid-battle: seconds until they forfeit (null = connected)
  const [opponentForfeitAt, setOpponentForfeitAt] = useState<string | null>(null);
  const [forfeitSecondsLeft, setForfeitSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!opponentForfeitAt) {
      setForfeitSecondsLeft(null);
      return;
    }
    const deadline = new Date(opponentForfeitAt).getTime();
    const tick = () => setForfeitSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [opponentForfeitAt]);

  // Resolved player-1 identity — resolved once from matchData.player1Id
  // (set by the stake screen before the arena is pushed) and cached, so score
  // events are never assigned to the wrong player.
  const amPlayer1Ref = useRef<boolean | null>(null);

  const getAmPlayer1 = useCallback(() => {
    if (amPlayer1Ref.current !== null) return amPlayer1Ref.current;
    const match = useCoinBattleStore.getState().matchData;
    // Only cache the identity once we have both sides of the comparison;
    // otherwise fall back to a best-effort answer without caching it.
    if (match?.player1Id && currentUser?.id) {
      const isP1 = currentUser.id === match.player1Id;
      amPlayer1Ref.current = isP1;
      return isP1;
    }
    return currentUser?.id !== match?.opponent?.id;
  }, [currentUser?.id]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showResultBriefly = useCallback((result: { isCorrect: boolean; correctOption?: number; selectedOption: number | null }) => {
    setCurrentQuestion({
      selectedOption: result.selectedOption,
      result: result.isCorrect ? 'correct' : 'wrong',
      correctOption: result.correctOption ?? null,
    });
    setTimeout(() => {
      setCurrentQuestion({ result: null, correctOption: null, selectedOption: null });
    }, 2000);
  }, [setCurrentQuestion]);

  const showFailedBriefly = useCallback(() => {
    setCurrentQuestion({
      result: 'failed',
      correctOption: null,
      selectedOption: null,
    });
    setTimeout(() => {
      setCurrentQuestion({ result: null, correctOption: null, selectedOption: null });
    }, 2000);
  }, [setCurrentQuestion]);

  // When the user last tapped an option — used as the real time-to-answer at
  // submission so the speed bonus is earned.
  const lastSelectionTimeRef = useRef<number>(0);

  const startQuestionTimer = useCallback((seconds: number) => {
    clearTimer();
    setTimeRemaining(seconds);
    questionStartTimeRef.current = Date.now();
    lastSelectionTimeRef.current = 0;
    setHasSubmitted(false);
    setOpponentAnswered(false);
    setMyLastPoints(null);
    setOppLastPoints(null);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          const state = useCoinBattleStore.getState();
          if (!state.currentQuestion.result && state.battleId) {
            setHasSubmitted(true);
            const selected = state.currentQuestion.selectedOption;
            const timeTakenMs =
              lastSelectionTimeRef.current > 0
                ? lastSelectionTimeRef.current
                : seconds * 1000;

            if (selected != null) {
              // Submit the player's FINAL selection when time runs out. The
              // server holds a short grace period after the question times out,
              // so this lands even though the client clock trails the server
              // by network latency.
              coinBattleService.submitAnswer({
                battleId: state.battleId,
                questionIndex: state.currentQuestion.questionIndex,
                selectedOption: selected,
                timeTakenMs,
              }).then((result) => {
                showResultBriefly({ isCorrect: result.isCorrect, correctOption: result.correctOption, selectedOption: selected });
                // Also apply the scores straight from the response, so a
                // missed socket score_update can't leave the board stale.
                const amP1 = getAmPlayer1();
                setMyScore(amP1 ? result.player1Score : result.player2Score);
                setOpponentScore(amP1 ? result.player2Score : result.player1Score);
              }).catch(() => {});
            } else {
              // No answer chosen — the server records the no-answer itself and
              // drives the next question. Never auto-advance on the client.
              showFailedBriefly();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer, showResultBriefly, showFailedBriefly, getAmPlayer1]);

  useEffect(() => {
    if (questions.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setShowCountdown(true);
      const timer = setTimeout(() => {
        setShowCountdown(false);
        startQuestionTimer(15);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [questions.length, startQuestionTimer]);

  const { joinBattleRoom, leaveBattleRoom } = useCoinBattleSocket({
    onBattleStart: (data) => {
      if (!initializedRef.current) {
        setQuestions(data.questions);
        setCurrentQuestion({ questionIndex: 0, selectedOption: null, result: null, correctOption: null });
        setMyScore(0);
        setOpponentScore(0);
      }
    },
    onQuestionStart: (data) => {
      setCurrentQuestion({
        questionIndex: data.questionIndex,
        selectedOption: null,
        result: null,
        correctOption: null,
      });
      setHasSubmitted(false);
      setOpponentAnswered(false);
      setMyLastPoints(null);
      setOppLastPoints(null);

      const amP1 = getAmPlayer1();
      setMyScore(amP1 ? data.player1Score : data.player2Score);
      setOpponentScore(amP1 ? data.player2Score : data.player1Score);

      startQuestionTimer(15);
    },
    onScoreUpdate: (data: CoinScoreUpdatePayload) => {
      const amP1 = getAmPlayer1();
      setMyScore(amP1 ? data.player1Score : data.player2Score);
      setOpponentScore(amP1 ? data.player2Score : data.player1Score);

      if (data.youAnswered) {
        setMyLastPoints(data.pointsEarned);
        setTimeout(() => setMyLastPoints(null), 1500);
      } else {
        setOppLastPoints(data.pointsEarned);
        setTimeout(() => setOppLastPoints(null), 1500);
      }

      setOpponentAnswered(amP1 ? data.player2Answered : data.player1Answered);
    },
    onBattleEnded: (data: CoinBattleEndedPayload) => {
      clearTimer();
      setOpponentForfeitAt(null);
      const amP1 = getAmPlayer1();
      const myFinalScore = amP1 ? data.player1Score : data.player2Score;
      const oppFinalScore = amP1 ? data.player2Score : data.player1Score;

      setMyScore(myFinalScore);
      setOpponentScore(oppFinalScore);
      setLastResult({
        winnerId: data.winnerId,
        myScore: myFinalScore,
        opponentScore: oppFinalScore,
        stake: data.stake,
        pot: data.pot,
        winnerPrize: data.winnerPrize,
        platformFee: data.platformFee,
        isDraw: data.isDraw,
        forfeitedBy: data.forfeitedBy ?? null,
      });
      setShowResults(true);
    },
    onOpponentReconnecting: (data) => {
      setOpponentForfeitAt(data.forfeitAt);
    },
    onOpponentReconnected: () => {
      setOpponentForfeitAt(null);
    },
    // Sent when the battle is cancelled before it's decided — stakes refunded
    onOpponentDisconnected: () => {
      clearTimer();
      setOpponentForfeitAt(null);
      Alert.alert('Battle Cancelled', 'The battle was cancelled and your stake has been refunded.', [
        { text: 'OK', onPress: handleCloseResults },
      ]);
    },
  });

  useEffect(() => {
    const battleId = useCoinBattleStore.getState().battleId;
    if (battleId) {
      joinBattleRoom(battleId);
    }
    return () => {
      clearTimer();
      if (battleId) leaveBattleRoom(battleId);
    };
  }, []);

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (hasSubmitted) return;
      // Selection only — the FINAL answer is submitted when the timer expires,
      // so the user can freely change their mind until time runs out. Record
      // when they locked in their (latest) choice for the speed bonus.
      lastSelectionTimeRef.current = Math.max(0, Date.now() - questionStartTimeRef.current);
      setCurrentQuestion({ selectedOption: optionIndex });
    },
    [hasSubmitted, setCurrentQuestion],
  );

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  const handleCloseResults = () => {
    setShowResults(false);
    resetBattle();
    router.dismissAll();
    setTimeout(() => router.replace('/(features)/games'), 50);
  };

  if (questions.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText style={{ color: colors.muted }}>Waiting for battle to start...</ThemedText>
      </SafeAreaView>
    );
  }

  const currentQ = questions[currentQuestion.questionIndex];
  const isLeading = myScore > opponentScore;
  const stake = matchData?.stake || 0;
  const winnerPrize = matchData?.winnerPrize || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Score Bar */}
      <View style={[scoreStyles.bar, { backgroundColor: isDark ? '#1a1f3a' : '#F8FAFC', borderBottomColor: colors.border }]}>
        {/* Me */}
        <View style={scoreStyles.player}>
          <View style={[scoreStyles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <ThemedText style={{ fontSize: 14, fontWeight: '700' }}>
              {(currentUser?.username || 'Y')[0].toUpperCase()}
            </ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={scoreStyles.name} numberOfLines={1}>You</ThemedText>
            <View style={scoreStyles.scoreRow}>
              <ThemedText style={[scoreStyles.score, { color: colors.primary }]}>{myScore}</ThemedText>
              {myLastPoints != null && (
                <ThemedText style={[scoreStyles.pointsAnim, { color: '#22c55e' }]}>+{myLastPoints}</ThemedText>
              )}
            </View>
          </View>
          {isLeading && <View style={[scoreStyles.leadingDot, { backgroundColor: '#22c55e' }]} />}
        </View>

        {/* VS */}
        <View style={scoreStyles.vsContainer}>
          <ThemedText style={scoreStyles.vsText}>VS</ThemedText>
          <View style={[scoreStyles.potBadge, { backgroundColor: '#FFD700' + '20' }]}>
            <ThemedText style={[scoreStyles.potText, { color: '#FFD700' }]}>⭐ {stake * 2}</ThemedText>
          </View>
        </View>

        {/* Opponent */}
        <View style={scoreStyles.player}>
          {!isLeading && <View style={[scoreStyles.leadingDot, { backgroundColor: '#ef4444' }]} />}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <ThemedText style={scoreStyles.name} numberOfLines={1}>{matchData?.opponent?.username || 'Opponent'}</ThemedText>
            <View style={scoreStyles.scoreRow}>
              {oppLastPoints != null && (
                <ThemedText style={[scoreStyles.pointsAnim, { color: '#22c55e' }]}>+{oppLastPoints}</ThemedText>
              )}
              <ThemedText style={[scoreStyles.score, { color: '#ef4444' }]}>{opponentScore}</ThemedText>
            </View>
          </View>
          <View style={[scoreStyles.avatar, { backgroundColor: '#ef4444' + '20' }]}>
            <ThemedText style={{ fontSize: 14, fontWeight: '700' }}>
              {(matchData?.opponent?.username || 'O')[0].toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Opponent dropped — they forfeit if they don't return in time */}
      {forfeitSecondsLeft !== null && !showResults && (
        <View style={forfeitStyles.banner}>
          <Text style={forfeitStyles.text}>
            Opponent disconnected — they forfeit in {forfeitSecondsLeft}s if they don't return
          </Text>
        </View>
      )}

      {/* Timer */}
      <View style={[timerStyles.container, { backgroundColor: timeRemaining <= 5 ? '#ef444420' : 'transparent' }]}>
        <View style={[timerStyles.circle, {
          backgroundColor: timeRemaining <= 5 ? '#ef4444' : colors.primary,
          transform: [{ scale: timeRemaining <= 5 ? 1.1 : 1 }],
        }]}>
          <Text style={timerStyles.time}>{timeRemaining}</Text>
        </View>
        <ThemedText style={timerStyles.label}>
          Q{currentQuestion.questionIndex + 1}/{totalQuestions}
        </ThemedText>
      </View>

      {/* Question Card */}
      {currentQ && (
        <View style={[qStyles.card, { backgroundColor: isDark ? '#1a1f3a' : '#FFFFFF', borderColor: colors.border }]}>
          <ThemedText style={qStyles.question}>{currentQ.questionText}</ThemedText>
          <View style={qStyles.options}>
            {currentQ.options.map((option, idx) => {
              const isSelected = currentQuestion.selectedOption === idx;
              const isCorrect = currentQuestion.correctOption === idx;
              const showCorrect = currentQuestion.result !== null && isCorrect;
              const showWrong = currentQuestion.result === 'wrong' && isSelected;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    qStyles.option,
                    {
                      backgroundColor: showCorrect ? '#22c55e20' : showWrong ? '#ef444420' : isSelected ? colors.primary + '15' : isDark ? '#0a0d1d' : '#F3F4F6',
                      borderColor: showCorrect ? '#22c55e' : showWrong ? '#ef4444' : isSelected ? colors.primary : isDark ? '#2a2f4a' : '#E5E7EB',
                    },
                  ]}
                  onPress={() => handleSelectOption(idx)}
                  disabled={hasSubmitted}
                  activeOpacity={0.7}
                >
                  <View style={[qStyles.optionLetter, {
                    backgroundColor: showCorrect ? '#22c55e' : showWrong ? '#ef4444' : isSelected ? colors.primary : isDark ? '#2a2f4a' : '#D1D5DB',
                  }]}>
                    <Text style={[qStyles.optionLetterText, {
                      color: showCorrect || showWrong || isSelected ? '#fff' : colors.text,
                    }]}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <ThemedText style={[qStyles.optionText, {
                    color: showCorrect ? '#22c55e' : showWrong ? '#ef4444' : colors.text,
                  }]} numberOfLines={2}>
                    {option}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Waiting for opponent */}
      {hasSubmitted && !opponentAnswered && currentQuestion.result === null && (
        <ThemedText style={{ textAlign: 'center', color: colors.muted, marginTop: 12, fontSize: 14 }}>
          Waiting for opponent...
        </ThemedText>
      )}

      {/* Countdown Overlay */}
      {showCountdown && (
        <View style={countdownStyles.overlay}>
          <CountdownValue />
        </View>
      )}

      {/* Results Modal */}
      {showResults && lastResult && (
        <View style={resultsStyles.overlay}>
          <View style={[resultsStyles.card, { backgroundColor: isDark ? '#1a1f3a' : '#FFFFFF' }]}>
            <Text style={resultsStyles.emoji}>
              {lastResult.isDraw ? '🤝' : (lastResult.winnerId === currentUser?.id ? '🏆' : '😔')}
            </Text>
            <ThemedText style={resultsStyles.title}>
              {lastResult.isDraw ? "It's a Draw!" : (lastResult.winnerId === currentUser?.id ? 'You Won!' : 'You Lost')}
            </ThemedText>
            {lastResult.forfeitedBy && (
              <ThemedText style={{ textAlign: 'center', color: colors.muted, fontSize: 13, marginBottom: 8 }}>
                {lastResult.forfeitedBy === currentUser?.id
                  ? "You were disconnected too long and forfeited."
                  : "Your opponent didn't reconnect in time and forfeited."}
              </ThemedText>
            )}

            {/* Scores */}
            <View style={resultsStyles.scoreRow}>
              <View style={resultsStyles.scoreBox}>
                <ThemedText style={resultsStyles.scoreLabel}>You</ThemedText>
                <ThemedText style={[resultsStyles.scoreValue, { color: colors.primary }]}>{lastResult.myScore}</ThemedText>
              </View>
              <ThemedText style={resultsStyles.vsText}>vs</ThemedText>
              <View style={resultsStyles.scoreBox}>
                <ThemedText style={resultsStyles.scoreLabel}>Opponent</ThemedText>
                <ThemedText style={[resultsStyles.scoreValue, { color: '#ef4444' }]}>{lastResult.opponentScore}</ThemedText>
              </View>
            </View>

            {/* Coin breakdown */}
            <View style={[resultsStyles.coinBreakdown, { backgroundColor: isDark ? '#0a0d1d' : '#F9FAFB' }]}>
              <View style={resultsStyles.coinRow}>
                <ThemedText style={resultsStyles.coinLabel}>Your entry</ThemedText>
                <ThemedText style={resultsStyles.coinValue}>-{lastResult.stake} ⭐</ThemedText>
              </View>
              <View style={resultsStyles.coinRow}>
                <ThemedText style={resultsStyles.coinLabel}>Total prize</ThemedText>
                <ThemedText style={resultsStyles.coinValue}>{lastResult.pot} ⭐</ThemedText>
              </View>
              <View style={resultsStyles.coinRow}>
                <ThemedText style={resultsStyles.coinLabel}>Platform fee</ThemedText>
                <ThemedText style={[resultsStyles.coinValue, { color: '#ef4444' }]}>-{lastResult.platformFee} ⭐</ThemedText>
              </View>
              <View style={[resultsStyles.coinRow, { borderTopWidth: 1, borderTopColor: isDark ? '#2a2f4a' : '#E5E7EB', paddingTop: 8, marginTop: 4 }]}>
                <ThemedText style={[resultsStyles.coinLabel, { fontWeight: '700' }]}>
                  {lastResult.isDraw ? 'Refund' : (lastResult.winnerId === currentUser?.id ? 'You won' : 'Opponent won')}
                </ThemedText>
                <ThemedText style={[resultsStyles.coinValue, {
                  color: lastResult.isDraw ? colors.primary : (lastResult.winnerId === currentUser?.id ? '#22c55e' : '#ef4444'),
                  fontWeight: '700',
                  fontSize: 16,
                }]}>
                  {lastResult.isDraw ? `+${lastResult.stake}` : (lastResult.winnerId === currentUser?.id ? `+${lastResult.winnerPrize}` : `-${lastResult.stake}`)} ⭐
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity style={[resultsStyles.closeBtn, { backgroundColor: colors.primary }]} onPress={handleCloseResults}>
              <Text style={resultsStyles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Countdown sub-component ──
function CountdownValue() {
  const [count, setCount] = useState(3);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <Animated.Text style={[countdownStyles.text, { transform: [{ scale: scaleAnim }] }]}>
      {count}
    </Animated.Text>
  );
}

// ── Styles ──
const scoreStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  player: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  score: {
    fontSize: 20,
    fontWeight: '800',
  },
  pointsAnim: {
    fontSize: 14,
    fontWeight: '700',
  },
  leadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    opacity: 0.5,
  },
  potBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  potText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

const timerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
});

const qStyles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 16,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
});

const countdownStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 80,
    fontWeight: '900',
    color: '#fff',
  },
});

const forfeitStyles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#D97706',
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center' },
});

const resultsStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  vsText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.5,
  },
  coinBreakdown: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  coinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  coinLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  coinValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
