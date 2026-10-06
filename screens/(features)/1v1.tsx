import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput,
  Animated,
  ScrollView,
  BackHandler,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useDepartmentWarStore } from '@/store/departmentWarStore';
import { departmentWarService, type OpponentSearchResult, type UserWarStats } from '@/service/departmentWar.service';
import { OpponentCard } from '@/components/departmentWar/opponentCard';
import { QuestionCard } from '@/components/departmentWar/questionCard';
import { ScoreBar } from '@/components/departmentWar/scoreBar';
import { CountdownOverlay } from '@/components/departmentWar/countdownOverlay';
import { WarRewardModal } from '@/components/departmentWar/warRewardModal';
import { showError } from '@/components/ui/toast';
import {
  useWarSocket,
  type BattleStartPayload,
  type QuestionStartPayload,
  type AnswerSubmittedPayload,
  type BattleEndedPayload,
  type ChallengeRejectedPayload,
  type ChallengeAcceptedPayload,
} from '@/service/useWarSocket';
import AuthHeader from '@/components/auth/authHeader';

// ── Flow states ──
type FlowState = 'home' | 'search' | 'waiting' | 'countdown' | 'battle' | 'results' | 'leaderboard';

export default function OneVsOneBattle() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const currentUser = useAuthStore((state) => state.user);

  // ── Core state ──
  const [flowState, setFlowState] = useState<FlowState>('home');
  const [myStats, setMyStats] = useState<UserWarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Search state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [opponents, setOpponents] = useState<OpponentSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  // ── Waiting state ──
  const [waitingBattleId, setWaitingBattleId] = useState<string | null>(null);
  const [waitingOpponent, setWaitingOpponent] = useState<OpponentSearchResult | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Battle state ──
  const [battleId, setBattleId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Array<{ id: string; questionText: string; options: string[] }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentName, setOpponentName] = useState('Opponent');
  const [opponentAvatar, setOpponentAvatar] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [showCountdown, setShowCountdown] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const questionStartTimeRef = useRef<number>(0);

  // ── Results state ──
  const [showResults, setShowResults] = useState(false);
  const [battleResult, setBattleResult] = useState<{
    winnerId: string | null;
    myScore: number;
    opponentScore: number;
    departmentPoints: number;
  } | null>(null);

  // ── Leaderboard ──
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // ── Pulsing animation ──
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Active match (resume) ──
  const [activeMatch, setActiveMatch] = useState<{
    status: 'countdown' | 'active' | 'finished';
    battleId: string;
    questionIndex: number;
    totalQuestions: number;
    myScore: number;
    opponentScore: number;
    opponentName: string | null;
    opponentAvatar: string | null;
  } | null>(null);

  const checkForResume = useCallback(async () => {
    try {
      const resume = await departmentWarService.resumeBattle();
      if (resume.status === 'none') {
        setActiveMatch(null);
        return;
      }
      const amP1 = currentUser?.id === resume.player1Id;
      const myScore = amP1 ? resume.player1Score : resume.player2Score;
      const opponentScore = amP1 ? resume.player2Score : resume.player1Score;

      // Pull the opponent's name/avatar for the card (best-effort).
      let opponentName: string | null = null;
      let opponentAvatar: string | null = null;
      try {
        const battle = await departmentWarService.getActiveBattle();
        const opp =
          battle && battle.id === resume.battleId
            ? amP1
              ? battle.player2
              : battle.player1
            : null;
        opponentName = opp?.username || opp?.firstName || null;
        opponentAvatar = opp?.profilePictureUrl || null;
      } catch {
        // Best-effort — the card works without names.
      }

      setActiveMatch({
        status: resume.status,
        battleId: resume.battleId,
        questionIndex: resume.status === 'finished' ? 0 : resume.questionIndex,
        totalQuestions: resume.status === 'finished' ? 0 : resume.totalQuestions,
        myScore,
        opponentScore,
        opponentName,
        opponentAvatar,
      });
    } catch {
      // Resume is best-effort — ignore failures.
    }
  }, [currentUser?.id]);

  // Check on mount and again whenever the socket (re)connects, so the
  // active-match card stays in sync (a battle started on another device,
  // or one just ended, gets picked up here).
  useEffect(() => {
    checkForResume();
  }, [checkForResume]);

  // ═══════════════════════════════════════
  // TIMER HELPERS
  // ═══════════════════════════════════════
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  // ═══════════════════════════════════════
  // BLOCK HARDWARE BACK DURING BATTLE
  // ═══════════════════════════════════════
  useEffect(() => {
    const isBattleActive = flowState === 'countdown' || flowState === 'battle';
    if (!isBattleActive) return;

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Leave Battle?',
        'If you leave now, you\'ll forfeit the battle and your opponent will win.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              clearTimer();
              if (battleId) leaveBattleRoom(battleId);
              setBattleId(null);
              setQuestions([]);
              setCurrentQuestionIndex(0);
              setMyScore(0);
              setOpponentScore(0);
              setFlowState('home');
              loadStats();
            },
          },
        ],
      );
      return true; // block default back behaviour
    });

    return () => handler.remove();
  }, [flowState, battleId]);

  const handleSubmitTimeoutRef = useRef<() => void>(() => {});
  const handleSubmitTimeout = useCallback(async () => {
    if (isLocked || !battleId) return;
    setIsLocked(true);
    clearTimer();
    try {
      const result = await departmentWarService.submitAnswer(battleId, currentQuestionIndex, 0, 15000);
      setSelectedOption(null);
      setAnswerResult(result.isCorrect ? 'correct' : 'wrong');
      setCorrectOption(result.correctOption ?? null);
      setMyScore((prev) => prev + (result.points || 0));
    } catch {
      setSelectedOption(null);
      setAnswerResult('wrong');
    } finally {
      setIsLocked(false);
    }
  }, [isLocked, battleId, currentQuestionIndex]);

  handleSubmitTimeoutRef.current = handleSubmitTimeout;

  const startTimer = useCallback((seconds: number) => {
    clearTimer();
    setTimeRemaining(seconds);
    questionStartTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          handleSubmitTimeoutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ═══════════════════════════════════════
  // SOCKET EVENTS
  // ═══════════════════════════════════════
  const { joinBattleRoom, leaveBattleRoom } = useWarSocket({
    onConnect: checkForResume,
    onChallengeAccepted: (data: ChallengeAcceptedPayload) => {
      if (data.battleId === waitingBattleId) {
        setOpponentName(data.opponent.username || data.opponent.firstName || 'Opponent');
        setOpponentAvatar(data.opponent.profilePictureUrl || null);
      }
    },
    onBattleStart: (data: BattleStartPayload) => {
      if (data.battleId === waitingBattleId || data.battleId === battleId) {
        clearTimer();
        setWaitingBattleId(null);
        setWaitingOpponent(null);
        // Store questions in Zustand so battleArena can read them on mount
        const store = useDepartmentWarStore.getState();
        store.setQuestions(data.questions as any);
        store.setCurrentQuestion({ questionIndex: 0, selectedOption: null, result: null, correctOption: null });
        store.setMyScore(0);
        store.setOpponentScore(0);
        // The challenger (current user) is always player1 in this flow — set
        // it immediately so battleArena maps player1/player2 scores correctly
        // without waiting for the async getActiveBattle() fetch.
        store.setActiveBattle({
          id: data.battleId,
          player1Id: currentUser?.id || "",
          player2Id: null,
        } as any);
        router.push({
          pathname: '/(features)/departmentWar/battleArena',
          params: { battleId: data.battleId },
        });
      }
    },
    onQuestionStart: (data: QuestionStartPayload) => {
      if (data.battleId === battleId) {
        setCurrentQuestionIndex(data.questionIndex);
        setSelectedOption(null);
        setAnswerResult(null);
        setCorrectOption(null);
        setIsLocked(false);
        setShowCountdown(false);
        setFlowState('battle');
        startTimer(15);
      }
    },
    onAnswerSubmitted: (data: AnswerSubmittedPayload) => {
      if (data.battleId === battleId && data.answeredBy !== currentUser?.id) {
        const battle = useDepartmentWarStore.getState().activeBattle;
        const amP1 = battle != null && currentUser?.id === battle.player1Id;
        setOpponentScore(amP1 ? data.player2Score : data.player1Score);
      }
    },
    onBattleEnded: (data: BattleEndedPayload) => {
      if (data.battleId === battleId) {
        clearTimer();
        setMyScore(data.player1Score);
        setOpponentScore(data.player2Score);
        setBattleResult({
          winnerId: data.winnerId,
          myScore: data.player1Score,
          opponentScore: data.player2Score,
          departmentPoints: data.departmentPoints,
        });
        setShowResults(true);
        setFlowState('results');
      }
    },
    onChallengeRejected: (data: ChallengeRejectedPayload) => {
      if (data.battleId === waitingBattleId) {
        clearTimer();
        const msg = data.reason === 'expired'
          ? "Challenge expired — opponent didn't respond."
          : data.reason === 'cancelled'
          ? 'Challenge was cancelled.'
          : 'Challenge declined.';
        showError(msg);
        setWaitingBattleId(null);
        setWaitingOpponent(null);
        setFlowState('home');
      }
    },
  });

  // ═══════════════════════════════════════
  // WAITING STATE EFFECTS
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!waitingBattleId) { clearTimer(); return; }
    setSecondsLeft(30);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => { if (prev <= 1) { clearTimer(); return 0; } return prev - 1; });
    }, 1000);
    return () => clearTimer();
  }, [waitingBattleId]);

  useEffect(() => {
    if (!waitingBattleId) { pulseAnim.setValue(1); return; }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [waitingBattleId]);

  useEffect(() => {
    if (waitingBattleId) { joinBattleRoom(waitingBattleId); return () => leaveBattleRoom(waitingBattleId); }
  }, [waitingBattleId]);

  // ═══════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════
  const loadStats = useCallback(async () => {
    try { const s = await departmentWarService.getMyStats(); setMyStats(s); } catch {}
  }, []);

  const loadOpponents = useCallback(async (query?: string) => {
    setSearchLoading(true);
    try {
      const data = query?.trim()
        ? await departmentWarService.searchOpponents(query.trim())
        : await departmentWarService.getQuickMatchCandidates();
      setOpponents(data);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to load opponents');
    } finally { setSearchLoading(false); }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try { const d = await departmentWarService.getUserLeaderboard(); setLeaderboard(d); } catch {}
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await Promise.all([loadStats(), loadOpponents()]); setLoading(false); })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadOpponents(searchQuery)]);
    setRefreshing(false);
  }, [searchQuery]);

  // ═══════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════
  const handleChallenge = async (opponent: OpponentSearchResult) => {
    if (sendingTo || waitingBattleId) return;
    setSendingTo(opponent.id);
    try {
      const result = await departmentWarService.findMatch(opponent.id);
      setWaitingBattleId(result.battleId);
      setWaitingOpponent(opponent);
      setOpponentName(opponent.firstName || opponent.username || 'Opponent');
      setOpponentAvatar(opponent.profilePictureUrl || null);
      setFlowState('waiting');
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to send challenge');
    } finally { setSendingTo(null); }
  };

  const handleCancelWaiting = async () => {
    if (!waitingBattleId) return;
    try { await departmentWarService.cancelChallenge(waitingBattleId); } catch {}
    finally { clearTimer(); leaveBattleRoom(waitingBattleId); setWaitingBattleId(null); setWaitingOpponent(null); setFlowState('home'); }
  };

  const handleSelectOption = useCallback(async (optionIndex: number) => {
    if (isLocked || !battleId) return;
    setIsLocked(true);
    clearTimer();
    const timeTakenMs = Date.now() - questionStartTimeRef.current;
    try {
      const result = await departmentWarService.submitAnswer(battleId, currentQuestionIndex, optionIndex, timeTakenMs);
      setSelectedOption(optionIndex);
      setAnswerResult(result.isCorrect ? 'correct' : 'wrong');
      setCorrectOption(result.correctOption ?? null);
      setMyScore((prev) => prev + (result.points || 0));
      if (!result.bothAnswered && questions.length > 0) {
        setTimeout(() => {
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setSelectedOption(null); setAnswerResult(null); setCorrectOption(null);
            setIsLocked(false); startTimer(15);
          }
        }, 1500);
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to submit answer');
      setIsLocked(false);
    }
  }, [isLocked, battleId, currentQuestionIndex, questions]);

  const handleResultsClose = () => {
    setShowResults(false); setBattleResult(null); setBattleId(null);
    setQuestions([]); setCurrentQuestionIndex(0); setFlowState('home'); loadStats();
  };

  const handlePlayAgain = () => {
    setShowResults(false); setBattleResult(null); setBattleId(null);
    setQuestions([]); setCurrentQuestionIndex(0); setFlowState('search');
    loadOpponents(searchQuery);
  };

  // ═══════════════════════════════════════
  // RENDER: HOME
  // ═══════════════════════════════════════
  if (flowState === 'home') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <AuthHeader title='⚔️ 1v1 Battle' subtitle=''/>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C3EF4" />}
        >
          {/* Header */}
          {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 }}>
            <ThemedText style={{ fontSize: 24, fontWeight: '900' }}>⚔️ 1v1 Battle</ThemedText>
            {myStats && myStats.totalPointsEarned > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B20', borderWidth: 1, borderColor: '#F59E0B40', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                <FontAwesome5 name="coins" size={12} color="#F59E0B" />
                <ThemedText style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                  {myStats.totalPointsEarned.toLocaleString()}
                </ThemedText>
              </View>
            )}
          </View> */}

          {/* Hero */}
          <View style={{ backgroundColor: '#6C3EF420', borderWidth: 1, borderColor: '#6C3EF440', padding: 20, borderRadius: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <ThemedText style={{ fontWeight: '700', fontSize: 17, marginBottom: 6 }}>Compete against active students</ThemedText>
              <ThemedText style={{ color: '#A78BFA', fontSize: 13 }}>Prove your skills & earn war points!</ThemedText>
            </View>
            <FontAwesome5 name="trophy" size={44} color="#6C3EF4" />
          </View>

          {/* Active Match — resume an in-progress (or just-finished) battle */}
          {activeMatch && (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(features)/departmentWar/battleArena',
                  params: { battleId: activeMatch.battleId },
                })
              }
              style={{ backgroundColor: '#F59E0B18', borderWidth: 1, borderColor: '#F59E0B55', padding: 16, borderRadius: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}
            >
              {activeMatch.opponentAvatar ? (
                <Image source={{ uri: activeMatch.opponentAvatar }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F59E0B30', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="flash" size={20} color="#F59E0B" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontWeight: '800', fontSize: 15 }}>
                  {activeMatch.status === 'finished' ? 'Battle Ended' : 'Active Battle'}
                </ThemedText>
                {activeMatch.status === 'finished' ? (
                  <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                    {activeMatch.myScore > activeMatch.opponentScore
                      ? 'You won!'
                      : activeMatch.myScore < activeMatch.opponentScore
                        ? 'You lost'
                        : "It's a draw"}
                  </ThemedText>
                ) : (
                  <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                    {activeMatch.opponentName || 'Your opponent'} · Question {activeMatch.questionIndex + 1}/{activeMatch.totalQuestions} · You {activeMatch.myScore} : {activeMatch.opponentScore} Them
                  </ThemedText>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ThemedText style={{ color: '#F59E0B', fontWeight: '800', fontSize: 13, marginRight: 4 }}>
                  {activeMatch.status === 'finished' ? 'VIEW RESULT' : 'RESUME'}
                </ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
              </View>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <ThemedText style={{ color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>STATS</ThemedText>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Battles', value: myStats?.totalBattles ?? 0, color: colors.text },
              { label: 'Wins', value: myStats?.wins ?? 0, color: '#10B981' },
              { label: 'Losses', value: myStats?.losses ?? 0, color: '#EF4444' },
              { label: 'Win Rate', value: myStats && myStats.totalBattles > 0 ? `${Math.round((myStats.wins / myStats.totalBattles) * 100)}%` : '0%', color: '#F59E0B' },
              { label: 'Streak', value: myStats?.currentWinStreak ?? 0, color: '#F59E0B' },
            ].map((s) => (
              <View key={s.label} style={{ flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 14, alignItems: 'center' }}>
                <ThemedText style={{ color: colors.muted, fontSize: 10 }}>{s.label}</ThemedText>
                <ThemedText style={{ color: s.color, fontWeight: '800', fontSize: 17, marginTop: 4 }}>{s.value}</ThemedText>
              </View>
            ))}
          </View>

          {/* How it works */}
          <ThemedText style={{ color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>HOW IT WORKS</ThemedText>
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 20, marginBottom: 24, gap: 14 }}>
            {[
              { icon: 'search', text: 'Find an active opponent' },
              { icon: 'send', text: 'Send a challenge request' },
              { icon: 'time', text: 'Answer questions in real-time' },
              { icon: 'trophy', text: 'Win and earn department points' },
            ].map((step, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#6C3EF430', borderWidth: 1, borderColor: '#6C3EF450', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={step.icon as any} size={14} color="#6C3EF4" />
                </View>
                <ThemedText style={{ flex: 1, fontSize: 14 }}>{step.text}</ThemedText>
              </View>
            ))}
          </View>

          {/* Find Opponent */}
          <TouchableOpacity
            onPress={() => { setFlowState('search'); loadOpponents(searchQuery); }}
            style={{ backgroundColor: '#6C3EF4', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 }}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>FIND OPPONENT</ThemedText>
          </TouchableOpacity>

          {/* Leaderboard */}
          <TouchableOpacity
            onPress={() => { setFlowState('leaderboard'); loadLeaderboard(); }}
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 }}
          >
            <Ionicons name="trophy-outline" size={18} color="#F59E0B" />
            <ThemedText style={{ fontWeight: '600', fontSize: 14 }}>View Leaderboard</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════
  // RENDER: SEARCH
  // ═══════════════════════════════════════
  if (flowState === 'search') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setFlowState('home')} style={{ marginRight: 12 }}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText style={{ fontSize: 22, fontWeight: '900', flex: 1 }}>Find Opponent</ThemedText>
          </View>
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 }}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={(t) => { setSearchQuery(t); t.trim() ? loadOpponents(t) : loadOpponents(); }}
              placeholder="Search by username..."
              placeholderTextColor={colors.muted}
              style={{ flex: 1, color: colors.text, fontSize: 14, marginLeft: 10 }}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); loadOpponents(); }}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {searchLoading ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator size="large" color="#6C3EF4" />
            <ThemedText style={{ color: colors.muted, marginTop: 12 }}>Finding opponents...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={opponents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C3EF4" />}
            renderItem={({ item }) => (
              <OpponentCard
                username={item.username} firstName={item.firstName} lastName={item.lastName}
                profilePictureUrl={item.profilePictureUrl} stats={item.stats}
                showChallengeButton={!sendingTo && !waitingBattleId}
                onChallenge={() => handleChallenge(item)}
              />
            )}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 60 }}>
                <Ionicons name="moon-outline" size={48} color={colors.muted} />
                <ThemedText style={{ color: colors.muted, marginTop: 12, fontSize: 15, textAlign: 'center' }}>
                  {searchQuery ? 'No users found.' : 'No one is online right now.'}
                </ThemedText>
              </View>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════
  // RENDER: WAITING
  // ═══════════════════════════════════════
  if (flowState === 'waiting' && waitingBattleId && waitingOpponent) {
    const displayName = waitingOpponent.firstName || waitingOpponent.username || 'Someone';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          {waitingOpponent.profilePictureUrl ? (
            <Image source={{ uri: waitingOpponent.profilePictureUrl }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 20 }} />
          ) : (
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#6C3EF4', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 40 }}>{displayName.charAt(0).toUpperCase()}</ThemedText>
            </View>
          )}

          <Animated.View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#F59E0B', marginBottom: 16, opacity: pulseAnim }} />

          <ThemedText style={{ fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>Challenge sent!</ThemedText>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', color: '#6C3EF4', marginBottom: 6 }}>{displayName}</ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 15, textAlign: 'center', marginBottom: 24 }}>Waiting for them to accept or decline...</ThemedText>

          {/* VS preview */}
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 20, borderRadius: 20, width: '100%', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%' }}>
              <View style={{ alignItems: 'center' }}>
                {currentUser?.profilePictureUrl ? (
                  <Image source={{ uri: currentUser.profilePictureUrl }} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 8 }} />
                ) : (
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#6C3EF4', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 24 }}>{(currentUser?.username || 'Y').charAt(0).toUpperCase()}</ThemedText>
                  </View>
                )}
                <ThemedText style={{ fontWeight: '700', fontSize: 14 }}>You</ThemedText>
              </View>

              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#6C3EF4', alignItems: 'center', justifyContent: 'center' }}>
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
  // RENDER: COUNTDOWN
  // ═══════════════════════════════════════
  if (flowState === 'countdown') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <CountdownOverlay visible={showCountdown} onComplete={() => {}} />
        <ThemedText style={{ color: colors.muted, fontSize: 16 }}>Get ready to battle!</ThemedText>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════
  // RENDER: BATTLE
  // ═══════════════════════════════════════
  if (flowState === 'battle' && questions.length > 0) {
    const currentQ = questions[currentQuestionIndex];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScoreBar
          myName={currentUser?.username || 'You'} myAvatar={currentUser?.profilePictureUrl || null}
          myScore={myScore} opponentName={opponentName} opponentAvatar={opponentAvatar}
          opponentScore={opponentScore} isLeading={myScore > opponentScore}
        />
        {currentQ && (
          <QuestionCard
            questionText={currentQ.questionText} options={currentQ.options}
            questionIndex={currentQuestionIndex} totalQuestions={totalQuestions}
            selectedOption={selectedOption} result={answerResult} correctOption={correctOption}
            timeRemaining={timeRemaining} timePerQuestion={15}
            onSelectOption={handleSelectOption} disabled={isLocked}
          />
        )}
        <CountdownOverlay visible={showCountdown} onComplete={() => setShowCountdown(false)} />
        <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 10 }}>
          <ThemedText style={{ color: '#EF444480', fontSize: 11, fontWeight: '600' }}>⚠ REPORT QUESTION</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════
  // RENDER: RESULTS
  // ═══════════════════════════════════════
  if (flowState === 'results' && battleResult) {
    const isWinner = battleResult.winnerId === currentUser?.id;
    const isDraw = battleResult.winnerId === null;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <WarRewardModal
          visible={showResults} isWinner={isWinner} isDraw={isDraw}
          myScore={battleResult.myScore} opponentScore={battleResult.opponentScore}
          departmentPoints={battleResult.departmentPoints} onClose={handleResultsClose}
        />
        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 }}>
          <FontAwesome5 name="trophy" size={56} color={isDraw ? '#F59E0B' : isWinner ? '#10B981' : '#EF4444'} />
          <ThemedText style={{ fontSize: 28, fontWeight: '900', marginTop: 16 }}>
            {isDraw ? "It's a Draw!" : isWinner ? 'Victory!' : 'Defeated'}
          </ThemedText>
          <ThemedText style={{ color: colors.muted, marginTop: 8 }}>
            {isDraw ? 'Both warriors fought well!' : isWinner ? 'You crushed it!' : 'Better luck next time!'}
          </ThemedText>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 20 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <ThemedText style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>YOU</ThemedText>
              <ThemedText style={{ fontSize: 42, fontWeight: '900', color: isWinner ? '#10B981' : colors.text }}>{battleResult.myScore}</ThemedText>
            </View>
            <ThemedText style={{ fontSize: 22, color: colors.muted, marginHorizontal: 16 }}>vs</ThemedText>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <ThemedText style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>THEM</ThemedText>
              <ThemedText style={{ fontSize: 42, fontWeight: '900', color: !isWinner && !isDraw ? '#10B981' : colors.text }}>{battleResult.opponentScore}</ThemedText>
            </View>
          </View>

          {battleResult.departmentPoints > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#312E81' : '#EEF2FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 30 }}>
              <Ionicons name="school" size={18} color="#6C3EF4" />
              <ThemedText style={{ marginLeft: 8, fontWeight: '600', color: '#6C3EF4' }}>+{battleResult.departmentPoints} Department Points</ThemedText>
            </View>
          )}

          <TouchableOpacity onPress={handlePlayAgain} style={{ backgroundColor: '#6C3EF4', paddingVertical: 16, borderRadius: 16, alignItems: 'center', width: '100%', marginBottom: 12 }}>
            <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>PLAY AGAIN</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleResultsClose} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, borderRadius: 16, alignItems: 'center', width: '100%', marginBottom: 20 }}>
            <ThemedText style={{ fontWeight: '600', fontSize: 14 }}>BACK TO HOME</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════
  // RENDER: LEADERBOARD
  // ═══════════════════════════════════════
  if (flowState === 'leaderboard') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setFlowState('home')} style={{ marginRight: 12 }}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText style={{ fontSize: 22, fontWeight: '900' }}>🏆 Leaderboard</ThemedText>
          </View>
        </View>
        <FlatList
          data={leaderboard}
          keyExtractor={(item: any) => item.id || String(Math.random())}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderItem={({ item, index }: any) => {
            const user = item.user;
            const displayName = user?.firstName || user?.username || 'Unknown';
            const isMe = user?.id === currentUser?.id;
            return (
              <View style={{ backgroundColor: isMe ? '#6C3EF420' : colors.card, borderWidth: 1, borderColor: isMe ? '#6C3EF450' : colors.border, padding: 14, borderRadius: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                <ThemedText style={{ color: index < 3 ? '#F59E0B' : colors.muted, fontWeight: '800', fontSize: 16, width: 30 }}>{index + 1}</ThemedText>
                {user?.profilePictureUrl ? (
                  <Image source={{ uri: user.profilePictureUrl }} style={{ width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 }} />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C3EF4', alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 }}>
                    <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{displayName.charAt(0).toUpperCase()}</ThemedText>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontWeight: '700', fontSize: 14 }}>{displayName}{isMe ? ' (You)' : ''}</ThemedText>
                  <ThemedText style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{item.wins ?? 0}W · {item.losses ?? 0}L</ThemedText>
                </View>
                <ThemedText style={{ color: '#6C3EF4', fontWeight: '800', fontSize: 14 }}>{item.totalPointsEarned ?? 0} pts</ThemedText>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="trophy-outline" size={48} color={colors.muted} />
              <ThemedText style={{ color: colors.muted, marginTop: 12, fontSize: 15 }}>No leaderboard data yet.</ThemedText>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════
  // DEFAULT: Loading
  // ═══════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#6C3EF4" />
      <ThemedText style={{ color: colors.muted, marginTop: 12 }}>Loading...</ThemedText>
    </SafeAreaView>
  );
}
