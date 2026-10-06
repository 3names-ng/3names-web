import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BackHandler, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useDepartmentWarStore } from '@/store/departmentWarStore';
import { departmentWarService } from '@/service/departmentWar.service';
import {
  useWarSocket,
  type BattleStartPayload,
  type QuestionStartPayload,
  type ScoreUpdatePayload,
  type BattleEndedPayload,
  type BattleResumedPayload,
  type ChallengeRejectedPayload,
} from '@/service/useWarSocket';
import { QuestionCard } from '@/components/departmentWar/questionCard';
import { ScoreBar } from '@/components/departmentWar/scoreBar';
import { CountdownOverlay } from '@/components/departmentWar/countdownOverlay';
import { WarRewardModal } from '@/components/departmentWar/warRewardModal';

export default function BattleArenaScreen() {
  const router = useRouter();
  const { battleId } = useLocalSearchParams<{ battleId: string }>();
  const { colors } = useTheme();
  const currentUser = useAuthStore((state) => state.user);

  const {
    questions, setQuestions,
    currentQuestion, setCurrentQuestion,
    myScore, setMyScore,
    opponentScore, setOpponentScore,
    opponentInfo, setActiveBattle, setOpponentInfo,
    lastResult, setLastResult,
    resetBattle,
  } = useDepartmentWarStore();

  const [showCountdown, setShowCountdown] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  /** True when the results modal was shown because the player reconnected after the battle had already ended */
  const [resumedFinished, setResumedFinished] = useState(false);
  const hasSubmittedRef = useRef(false);
  const updateHasSubmitted = useCallback((v: boolean) => {
    hasSubmittedRef.current = v;
    setHasSubmitted(v);
  }, []);
  const [, setHasInteracted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTimeRef = useRef<number>(0);
  // When the user last tapped an option — used as the real time-to-answer
  // at submission so the speed bonus is earned.
  const lastSelectionTimeRef = useRef<number>(0);
  const initializedRef = useRef(false);
  const totalQuestions = questions.length;

  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [myLastPoints, setMyLastPoints] = useState<number | null>(null);
  const [oppLastPoints, setOppLastPoints] = useState<number | null>(null);

  // Resolved player-1 identity — set as soon as any source tells us which
  // side we're on (getActiveBattle / battle resume), so score events are
  // never assigned to the wrong player during the initial fetch race.
  const amPlayer1Ref = useRef<boolean | null>(null);

  const getAmPlayer1 = useCallback(() => {
    if (amPlayer1Ref.current !== null) return amPlayer1Ref.current;
    const battle = useDepartmentWarStore.getState().activeBattle;
    return battle != null && currentUser?.id === battle.player1Id;
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

  // Use a ref for startQuestionTimer to break circular dependency
  const startTimerRef = useRef<(seconds: number) => void>(() => {});

  const startQuestionTimer = useCallback((seconds: number) => {
    clearTimer();
    setTimeRemaining(seconds);
    questionStartTimeRef.current = Date.now();
    lastSelectionTimeRef.current = 0;
    updateHasSubmitted(false);
    setHasInteracted(false);
    setOpponentAnswered(false);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          if (!hasSubmittedRef.current && !useDepartmentWarStore.getState().currentQuestion.result && battleId) {
            updateHasSubmitted(true);
            const state = useDepartmentWarStore.getState();
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
              departmentWarService.submitAnswer(battleId, state.currentQuestion.questionIndex, selected, timeTakenMs)
                .then((result) => {
                  showResultBriefly({ isCorrect: result.isCorrect, correctOption: result.correctOption, selectedOption: selected });
                  // Also apply the scores straight from the response, so a
                  // missed socket score_update can't leave the board stale.
                  const amP1 = getAmPlayer1();
                  setMyScore(amP1 ? result.player1Score : result.player2Score);
                  setOpponentScore(amP1 ? result.player2Score : result.player1Score);
                })
                .catch(() => {});
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
  }, [clearTimer, battleId, showResultBriefly, showFailedBriefly, updateHasSubmitted, getAmPlayer1]);

  useEffect(() => {
    startTimerRef.current = startQuestionTimer;
  }, [startQuestionTimer]);

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

  const { joinBattleRoom, leaveBattleRoom, resumeBattle } = useWarSocket({
    onBattleStart: (data: BattleStartPayload) => {
      if (data.battleId === battleId && !initializedRef.current) {
        setQuestions(data.questions as any);
        setCurrentQuestion({ questionIndex: 0, selectedOption: null, result: null, correctOption: null });
        setMyScore(0);
        setOpponentScore(0);
      }
    },
    onQuestionStart: (data: QuestionStartPayload) => {
      if (data.battleId === battleId) {
        setCurrentQuestion({
          questionIndex: data.questionIndex,
          selectedOption: null,
          result: null,
          correctOption: null,
        });
        updateHasSubmitted(false);
        setHasInteracted(false);
        setOpponentAnswered(false);
        setMyLastPoints(null);
        setOppLastPoints(null);

        if (data.player1Score != null && data.player2Score != null) {
          const amP1 = getAmPlayer1();
          setMyScore(amP1 ? data.player1Score : data.player2Score);
          setOpponentScore(amP1 ? data.player2Score : data.player1Score);
        }

        startQuestionTimer(15);
      }
    },
    onScoreUpdate: (data: ScoreUpdatePayload) => {
      if (data.battleId !== battleId) return;

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
    onBattleEnded: (data: BattleEndedPayload) => {
      if (data.battleId === battleId) {
        clearTimer();
        const amP1 = getAmPlayer1();
        const myFinalScore = amP1 ? data.player1Score : data.player2Score;
        const oppFinalScore = amP1 ? data.player2Score : data.player1Score;

        setMyScore(myFinalScore);
        setOpponentScore(oppFinalScore);
        setLastResult({
          winnerId: data.winnerId,
          myScore: myFinalScore,
          opponentScore: oppFinalScore,
          departmentPoints: data.departmentPoints,
          stats: data.stats,
        });
        setShowResults(true);
      }
    },
    onChallengeRejected: (data: ChallengeRejectedPayload) => {
      if (data.battleId === battleId) {
        const message =
          data.reason === 'expired'
            ? "Your opponent didn't respond in time."
            : 'Your opponent declined the battle request.';
        Alert.alert('No Battle', message, [
          {
            text: 'OK',
            onPress: () => {
              resetBattle();
              router.dismissAll();
              setTimeout(() => router.replace('/(features)/departmentWar'), 50);
            },
          },
        ]);
      }
    },
    /**
     * Player reconnected mid-battle (or after it ended). Restore the exact
     * question they're on, or show the final result if the battle already ended.
     */
    onBattleResumed: (data: BattleResumedPayload) => {
      if (data.status === 'countdown') {
        // Battle is in the 3-2-1 countdown — just make sure questions are loaded.
        if (data.battleId === battleId && data.questions.length > 0) {
          setQuestions(data.questions as any);
        }
        return;
      }

      if (data.status === 'active') {
        if (data.battleId !== battleId) return;
        // Skip the countdown overlay — we're resuming an in-progress battle.
        initializedRef.current = true;
        setQuestions(data.questions as any);
        setCurrentQuestion({
          questionIndex: data.questionIndex,
          selectedOption: null,
          result: null,
          correctOption: null,
        });
        const amP1 = currentUser?.id === data.player1Id;
        amPlayer1Ref.current = amP1;
        setMyScore(amP1 ? data.player1Score : data.player2Score);
        setOpponentScore(amP1 ? data.player2Score : data.player1Score);
        setMyLastPoints(null);
        setOppLastPoints(null);
        // Resume the countdown with whatever time is left on this question.
        startQuestionTimer(data.timeLeft ?? data.timePerQuestion);
        updateHasSubmitted(amP1 ? data.player1Answered : data.player2Answered);
        setOpponentAnswered(amP1 ? data.player2Answered : data.player1Answered);
        return;
      }

      if (data.status === 'finished') {
        if (data.battleId !== battleId) return;
        clearTimer();
        initializedRef.current = true;
        const amP1 = currentUser?.id === data.player1Id;
        amPlayer1Ref.current = amP1;
        const myFinalScore = amP1 ? data.player1Score : data.player2Score;
        const oppFinalScore = amP1 ? data.player2Score : data.player1Score;
        setMyScore(myFinalScore);
        setOpponentScore(oppFinalScore);
        setLastResult({
          winnerId: data.winnerId,
          myScore: myFinalScore,
          opponentScore: oppFinalScore,
          departmentPoints: data.departmentPoints,
          stats: undefined,
        });
        setResumedFinished(true);
        setShowResults(true);
      }
    },
  });

  useEffect(() => {
    if (battleId) {
      joinBattleRoom(battleId);
      // Ask the server where the battle is so we can resume on the current question.
      resumeBattle(battleId);
      departmentWarService.getActiveBattle().then((battle) => {
        if (battle && battle.id === battleId) {
          setActiveBattle(battle);
          const amP1 = currentUser?.id === battle.player1Id;
          amPlayer1Ref.current = amP1;
          const opponent = amP1 ? battle.player2 : battle.player1;
          if (opponent) {
            setOpponentInfo({
              id: opponent.id,
              username: opponent.username,
              firstName: opponent.firstName,
              profilePictureUrl: opponent.profilePictureUrl,
            });
          }
        }
      }).catch(() => {});
    }
    return () => {
      clearTimer();
      if (battleId) leaveBattleRoom(battleId);
    };
  }, [battleId, joinBattleRoom, leaveBattleRoom, resumeBattle, clearTimer, setActiveBattle, currentUser?.id, setOpponentInfo]);

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (hasSubmitted || !battleId) return;
      setHasInteracted(true);
      // Selection only — the FINAL answer is submitted when the timer expires,
      // so the user can freely change their mind until time runs out. Record
      // when they locked in their (latest) choice for the speed bonus.
      lastSelectionTimeRef.current = Math.max(0, Date.now() - questionStartTimeRef.current);
      setCurrentQuestion({ selectedOption: optionIndex });
    },
    [hasSubmitted, battleId, setCurrentQuestion],
  );

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  const handleCloseResults = () => {
    setShowResults(false);
    // Remember this finished battle so the departmentWar home screen doesn't
    // auto-route back into its result modal ("Try Again" → home → resume →
    // result modal again — a loop).
    useDepartmentWarStore.getState().setDismissedFinishedBattle(battleId);
    resetBattle();
    router.dismissAll();
    setTimeout(() => router.replace('/(features)/departmentWar'), 50);
  };

  if (questions.length === 0) {
    // Reconnected after the battle already ended — show the result.
    if (lastResult && showResults) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <WarRewardModal
            visible={showResults}
            isWinner={lastResult.winnerId === currentUser?.id}
            isDraw={lastResult.winnerId === null}
            myScore={lastResult.myScore}
            opponentScore={lastResult.opponentScore}
            departmentPoints={lastResult.departmentPoints}
            note={resumedFinished ? 'This battle ended while you were away.' : undefined}
            onClose={handleCloseResults}
          />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText style={{ color: colors.muted }}>Waiting for battle to start...</ThemedText>
      </SafeAreaView>
    );
  }

  const currentQ = questions[currentQuestion.questionIndex];
  const isLeading = myScore > opponentScore;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScoreBar
        myName={currentUser?.username || 'You'}
        myAvatar={currentUser?.profilePictureUrl || null}
        myScore={myScore}
        opponentName={opponentInfo?.username || 'Opponent'}
        opponentAvatar={opponentInfo?.profilePictureUrl || null}
        opponentScore={opponentScore}
        isLeading={isLeading}
        opponentAnswered={opponentAnswered}
        myAnswered={hasSubmitted}
        myLastPoints={myLastPoints}
        oppLastPoints={oppLastPoints}
      />
      {currentQ && (
        <QuestionCard
          questionText={currentQ.questionText}
          options={currentQ.options}
          questionIndex={currentQuestion.questionIndex}
          totalQuestions={totalQuestions}
          selectedOption={currentQuestion.selectedOption}
          result={currentQuestion.result}
          correctOption={currentQuestion.correctOption}
          timeRemaining={timeRemaining}
          timePerQuestion={15}
          onSelectOption={handleSelectOption}
          disabled={hasSubmitted}
        />
      )}
      {hasSubmitted && !opponentAnswered && currentQuestion.result === null && (
        <ThemedText style={{ textAlign: 'center', color: colors.muted, marginTop: 12, fontSize: 14 }}>
          Waiting for opponent...
        </ThemedText>
      )}
      <CountdownOverlay visible={showCountdown} onComplete={() => setShowCountdown(false)} />
      {lastResult && (
        <WarRewardModal
          visible={showResults}
          isWinner={lastResult.winnerId === currentUser?.id}
          isDraw={lastResult.winnerId === null}
          myScore={lastResult.myScore}
          opponentScore={lastResult.opponentScore}
          departmentPoints={lastResult.departmentPoints}
          note={resumedFinished ? 'This battle ended while you were away.' : undefined}
          onClose={handleCloseResults}
        />
      )}
    </SafeAreaView>
  );
}