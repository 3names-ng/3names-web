import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";

import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { ScoreListSkeleton } from "@/components/games/gameSkeletons";
import { LevelBadge } from "@/components/levelBadge";
import { showSuccess } from "@/components/ui/toast";
import {
  puzzleService,
  type PuzzleLeaderboardEntry,
} from "@/service/puzzle.service";

const GRID_SIZE = 4;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BOARD_PADDING = 12;
const CELL_GAP = 10;
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, 380);
const CELL_SIZE = (BOARD_SIZE - BOARD_PADDING * 2 - CELL_GAP * (GRID_SIZE - 1)) / GRID_SIZE;

type Board = number[][];

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: "#EEF2FF", text: "#3730A3" },
  4: { bg: "#E0E7FF", text: "#3730A3" },
  8: { bg: "#A5B4FC", text: "#1E1B4B" },
  16: { bg: "#818CF8", text: "#FFFFFF" },
  32: { bg: "#6366F1", text: "#FFFFFF" },
  64: { bg: "#4F46E5", text: "#FFFFFF" },
  128: { bg: "#F59E0B", text: "#FFFFFF" },
  256: { bg: "#F97316", text: "#FFFFFF" },
  512: { bg: "#EF4444", text: "#FFFFFF" },
  1024: { bg: "#DC2626", text: "#FFFFFF" },
  2048: { bg: "#7C3AED", text: "#FFFFFF" },
};

function emptyBoard(): Board {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function emptyCells(board: Board): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

function addRandomTile(board: Board): Board {
  const cells = emptyCells(board);
  if (cells.length === 0) return board;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  const next = cloneBoard(board);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function transpose(board: Board): Board {
  const next = emptyBoard();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      next[c][r] = board[r][c];
    }
  }
  return next;
}

function reverseRows(board: Board): Board {
  return board.map((row) => [...row].reverse());
}

/** Slides + merges a single row leftward. Returns the new row and points gained. */
function collapseRowLeft(row: number[]): { row: number[]; gained: number } {
  const tiles = row.filter((v) => v !== 0);
  const result: number[] = [];
  let gained = 0;

  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === tiles[i + 1]) {
      const merged = tiles[i] * 2;
      result.push(merged);
      gained += merged;
      i++;
    } else {
      result.push(tiles[i]);
    }
  }

  while (result.length < GRID_SIZE) result.push(0);
  return { row: result, gained };
}

type Direction = "left" | "right" | "up" | "down";

function move(board: Board, direction: Direction): { board: Board; gained: number; moved: boolean } {
  let working = cloneBoard(board);
  let transposed = false;

  if (direction === "up" || direction === "down") {
    working = transpose(working);
    transposed = true;
  }
  if (direction === "right" || direction === "down") {
    working = reverseRows(working);
  }

  let gained = 0;
  working = working.map((row) => {
    const { row: newRow, gained: rowGained } = collapseRowLeft(row);
    gained += rowGained;
    return newRow;
  });

  if (direction === "right" || direction === "down") {
    working = reverseRows(working);
  }
  if (transposed) {
    working = transpose(working);
  }

  const moved = JSON.stringify(working) !== JSON.stringify(board);
  return { board: working, gained, moved };
}

function highestTileOf(board: Board): number {
  return board.reduce((max, row) => Math.max(max, ...row), 0);
}

function hasMovesLeft(board: Board): boolean {
  if (emptyCells(board).length > 0) return true;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const value = board[r][c];
      if (c < GRID_SIZE - 1 && board[r][c + 1] === value) return true;
      if (r < GRID_SIZE - 1 && board[r + 1][c] === value) return true;
    }
  }
  return false;
}

function newGameBoard(): Board {
  let board = emptyBoard();
  board = addRandomTile(board);
  board = addRandomTile(board);
  return board;
}

const SEEN_INSTRUCTIONS_KEY = "puzzle2048_seen_instructions";

// The user id is appended to this so two accounts on one device never resume
// each other's run.
const SAVED_GAME_KEY = "puzzle2048_saved_game";
// A finished game whose score couldn't be sent (e.g. offline); retried the
// next time the screen opens so the result isn't lost.
const PENDING_SCORE_KEY = "puzzle2048_pending_score";

type SavedGame = {
  board: Board;
  score: number;
  gameOver: boolean;
};

/** Guards against a truncated or hand-edited entry replacing the real board. */
function isSavedBoard(value: unknown): value is Board {
  return (
    Array.isArray(value) &&
    value.length === GRID_SIZE &&
    value.every(
      (row) =>
        Array.isArray(row) &&
        row.length === GRID_SIZE &&
        row.every((cell) => typeof cell === "number" && Number.isFinite(cell) && cell >= 0),
    )
  );
}

const HOW_TO_PLAY_STEPS = [
  { icon: "move" as const, text: "Swipe up, down, left, or right to slide every tile that way." },
  { icon: "git-merge" as const, text: "Two tiles with the same number merge into one when they touch." },
  { icon: "plus-circle" as const, text: "A new tile (2 or sometimes 4) appears after every move." },
  { icon: "flag" as const, text: "Reach the 2048 tile to win — but you can keep going for a higher score." },
  { icon: "alert-triangle" as const, text: "The game ends once the board is full and no more merges are possible." },
  { icon: "award" as const, text: "Earn XP the first time you reach 128, 256, 512, 1024, and 2048, plus Stars for a new personal best." },
];

export default function Puzzle2048Screen() {
  const { colors } = useTheme();
  const userId = useAuthStore((state) => state.user?.id);

  const [board, setBoard] = useState<Board>(() => newGameBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState<PuzzleLeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const showScoresSkeleton = useDelayedLoading(loadingLeaderboard);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const savedGameKey = `${SAVED_GAME_KEY}:${userId ?? "guest"}`;
  const pendingScoreKey = `${PENDING_SCORE_KEY}:${userId ?? "guest"}`;
  // Only set once the run saved under `savedGameKey` has been read back, so the
  // fresh starting board can't overwrite it before it loads.
  const [restoredKey, setRestoredKey] = useState<string | null>(null);

  const scale = useSharedValue(1);
  const boardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const boardRef = useRef(board);
  boardRef.current = board;
  const gameOverRef = useRef(gameOver);
  gameOverRef.current = gameOver;
  const scoreRef = useRef(score);
  scoreRef.current = score;

  useEffect(() => {
    puzzleService
      .getMyStats()
      .then((stats) => setBestScore((prev) => Math.max(prev, stats.bestScore)))
      .catch(() => {});
  }, []);

  // Show the rules automatically the first time someone opens this game.
  useEffect(() => {
    AsyncStorage.getItem(SEEN_INSTRUCTIONS_KEY)
      .then((seen) => {
        if (!seen) {
          setInstructionsVisible(true);
          AsyncStorage.setItem(SEEN_INSTRUCTIONS_KEY, "true").catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // A run only lives in memory, so leaving the screen used to throw the board
  // away. Pick the saved one back up on mount — including a finished board, so
  // the player still sees the game-over card with their final score.
  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(savedGameKey)
      .then((raw) => {
        if (cancelled || !raw) return;
        const saved = JSON.parse(raw) as Partial<SavedGame>;
        if (!isSavedBoard(saved.board) || typeof saved.score !== "number") return;
        setBoard(saved.board);
        setScore(saved.score);
        setGameOver(saved.gameOver === true);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRestoredKey(savedGameKey);
      });

    return () => {
      cancelled = true;
    };
  }, [savedGameKey]);

  // Mirror every move into storage so the run survives leaving the screen, the
  // app being backgrounded, or the process being killed.
  useEffect(() => {
    if (restoredKey !== savedGameKey) return;
    AsyncStorage.setItem(savedGameKey, JSON.stringify({ board, score, gameOver })).catch(() => {});
  }, [restoredKey, savedGameKey, board, score, gameOver]);

  // Sends a finished game's score. Runs in the background: the game-over card
  // offers Play Again straight away, and a failed send is kept and retried
  // later rather than shown as an error.
  const sendScore = useCallback(
    async (finalScore: number, highestTile: number) => {
      try {
        const result = await puzzleService.submitScore(finalScore, highestTile);
        setBestScore(result.bestScore);
        AsyncStorage.removeItem(pendingScoreKey).catch(() => {});

        if (result.newMilestones.length > 0) {
          showSuccess(
            `You reached ${result.newMilestones[result.newMilestones.length - 1]}! +${result.xpAwarded} XP`,
            "New Milestone!"
          );
        } else if (result.coinsAwarded > 0) {
          showSuccess(`New personal best! +${result.coinsAwarded} ⭐ Stars`, "High Score!");
        }
      } catch (err: any) {
        console.warn("[2048] score not saved, will retry:", err?.response?.data ?? err);
        // Keep only the higher of the stored and new pending scores.
        try {
          const raw = await AsyncStorage.getItem(pendingScoreKey);
          const pending = raw ? JSON.parse(raw) : null;
          if (!pending || finalScore > pending.score) {
            await AsyncStorage.setItem(
              pendingScoreKey,
              JSON.stringify({ score: finalScore, highestTile }),
            );
          }
        } catch {
          // Storage unavailable — nothing more we can do quietly.
        }
      }
    },
    [pendingScoreKey],
  );

  const submitResult = useCallback((finalScore: number, finalBoard: Board) => {
    // Show the new best right away instead of waiting for the server.
    setBestScore((prev) => Math.max(prev, finalScore));
    sendScore(finalScore, highestTileOf(finalBoard));
  }, [sendScore]);

  // Retry a score that couldn't be sent last time.
  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(pendingScoreKey)
      .then((raw) => {
        if (!raw) return;
        const pending = JSON.parse(raw);
        if (typeof pending?.score === "number") {
          sendScore(pending.score, pending.highestTile ?? 0);
        }
      })
      .catch(() => {});
  }, [userId, pendingScoreKey, sendScore]);

  const handleSwipe = useCallback((direction: Direction) => {
    if (gameOverRef.current) return;

    const { board: nextBoard, gained, moved } = move(boardRef.current, direction);
    if (!moved) return;

    const withNewTile = addRandomTile(nextBoard);
    const newScore = scoreRef.current + gained;

    setBoard(withNewTile);
    setScore(newScore);

    scale.value = withTiming(0.97, { duration: 80 }, () => {
      scale.value = withSpring(1);
    });

    if (!hasMovesLeft(withNewTile)) {
      setGameOver(true);
      submitResult(newScore, withNewTile);
    }
  }, [submitResult]);

  const panGesture = Gesture.Pan()
    .minDistance(20)
    .onEnd((e) => {
      "worklet";
      const { translationX, translationY } = e;
      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);

      let direction: Direction;
      if (absX > absY) {
        direction = translationX > 0 ? "right" : "left";
      } else {
        direction = translationY > 0 ? "down" : "up";
      }

      // Worklets run on the UI thread and can't call JS state setters/API
      // calls directly — runOnJS hops back to the JS thread for handleSwipe.
      runOnJS(handleSwipe)(direction);
    });

  function startNewGame() {
    setBoard(newGameBoard());
    setScore(0);
    setGameOver(false);
  }

  async function openLeaderboard() {
    setLeaderboardVisible(true);
    setLoadingLeaderboard(true);
    try {
      const data = await puzzleService.getLeaderboard();
      setLeaderboard(data);
    } catch {
      // best-effort
    } finally {
      setLoadingLeaderboard(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="chevron-left" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>2048</ThemedText>
        <View style={styles.headerRightGroup}>
          <Pressable
            onPress={() => setInstructionsVisible(true)}
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="help-circle" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={openLeaderboard}
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="award" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View style={[styles.scoreBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={[styles.scoreLabel, { color: colors.muted }]}>SCORE</ThemedText>
          <ThemedText style={styles.scoreValue}>{score}</ThemedText>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={[styles.scoreLabel, { color: colors.muted }]}>BEST</ThemedText>
          <ThemedText style={styles.scoreValue}>{bestScore}</ThemedText>
        </View>
        <Pressable
          onPress={startNewGame}
          style={[styles.newGameButton, { backgroundColor: "#7C3AED" }]}
        >
          <Feather name="refresh-cw" size={16} color="#FFF" />
          <ThemedText style={styles.newGameText}>New</ThemedText>
        </Pressable>
      </View>

      <View style={styles.boardWrapper}>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.board,
              boardStyle,
              { width: BOARD_SIZE, height: BOARD_SIZE, backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {board.map((row, r) => (
              <View key={r} style={styles.boardRow}>
                {row.map((value, c) => {
                  const tone = TILE_COLORS[value];
                  return (
                    <View
                      key={c}
                      style={[
                        styles.cell,
                        {
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          backgroundColor: tone ? tone.bg : colors.background,
                        },
                      ]}
                    >
                      {value > 0 && (
                        <ThemedText
                          style={[
                            styles.cellText,
                            { color: tone?.text ?? colors.text, fontSize: value >= 1000 ? 20 : 26 },
                          ]}
                        >
                          {value}
                        </ThemedText>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </Animated.View>
        </GestureDetector>

        <ThemedText style={[styles.hint, { color: colors.muted }]}>
          Swipe to merge matching tiles
        </ThemedText>
      </View>

      {/* Game Over overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <ThemedView style={[styles.overlayCard, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.overlayTitle}>Game Over</ThemedText>
            <ThemedText style={[styles.overlayScore, { color: colors.muted }]}>
              Final Score: {score}
            </ThemedText>
            <Pressable
              onPress={startNewGame}
              style={[styles.overlayButton, { backgroundColor: "#7C3AED" }]}
            >
              <ThemedText style={styles.overlayButtonText}>Play Again</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      )}

      {/* Leaderboard modal */}
      <Modal visible={leaderboardVisible} animationType="slide" transparent onRequestClose={() => setLeaderboardVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ThemedView style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Top Scores</ThemedText>
              <Pressable onPress={() => setLeaderboardVisible(false)}>
                <Feather name="x" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingLeaderboard ? (
                showScoresSkeleton ? <ScoreListSkeleton /> : null
              ) : leaderboard.length === 0 ? (
                <ThemedText style={{ textAlign: "center", marginTop: 20, color: colors.muted }}>
                  No scores yet — be the first!
                </ThemedText>
              ) : (
                leaderboard.map((entry, index) => (
                  <View key={entry.userId} style={[styles.leaderboardRow, { borderBottomColor: colors.border }]}>
                    <ThemedText style={[styles.rankText, { color: colors.muted }]}>#{index + 1}</ThemedText>
                    <ProfileFrame
                      uri={entry.profilePictureUrl}
                      frameId={entry.profileFrame}
                      size={36}
                      initial={entry.username?.[0]?.toUpperCase()}
                    />
                    <View style={styles.leaderboardUserInfo}>
                      <ThemedText style={styles.leaderboardUsername} numberOfLines={1}>
                        {entry.username || "Unknown"}
                      </ThemedText>
                      <LevelBadge level={entry.level} />
                    </View>
                    <ThemedText style={styles.leaderboardScore}>{entry.bestScore}</ThemedText>
                  </View>
                ))
              )}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

      {/* How to Play modal */}
      <Modal visible={instructionsVisible} animationType="slide" transparent onRequestClose={() => setInstructionsVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ThemedView style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>How to Play</ThemedText>
              <Pressable onPress={() => setInstructionsVisible(false)}>
                <Feather name="x" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {HOW_TO_PLAY_STEPS.map((step, index) => (
                <View key={index} style={styles.howToRow}>
                  <View style={[styles.howToIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Feather name={step.icon} size={18} color="#7C3AED" />
                  </View>
                  <ThemedText style={styles.howToText}>{step.text}</ThemedText>
                </View>
              ))}

              <Pressable
                onPress={() => setInstructionsVisible(false)}
                style={[styles.overlayButton, { backgroundColor: "#7C3AED", alignSelf: "stretch", alignItems: "center", marginTop: 8, marginBottom: 20 }]}
              >
                <ThemedText style={styles.overlayButtonText}>Got it, let's play</ThemedText>
              </Pressable>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  headerRightGroup: {
    flexDirection: "row",
    gap: 10,
  },
  howToRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  howToIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  howToText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 6,
  },
  scoreRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  scoreBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  newGameButton: {
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  newGameText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  boardWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  board: {
    borderRadius: 16,
    borderWidth: 1,
    padding: BOARD_PADDING,
  },
  boardRow: {
    flexDirection: "row",
    marginBottom: CELL_GAP,
  },
  cell: {
    borderRadius: 10,
    marginRight: CELL_GAP,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: {
    fontWeight: "800",
  },
  hint: {
    marginTop: 20,
    fontSize: 13,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    width: "80%",
  },
  overlayTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  overlayScore: {
    fontSize: 15,
    marginBottom: 20,
  },
  overlayButton: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  overlayButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  rankText: {
    width: 28,
    fontWeight: "700",
  },
  leaderboardUserInfo: {
    flex: 1,
    gap: 2,
  },
  leaderboardUsername: {
    fontWeight: "600",
  },
  leaderboardScore: {
    fontWeight: "800",
    color: "#7C3AED",
  },
});
