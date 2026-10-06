import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { showError, showSuccess } from "@/components/ui/toast";
import {
  wordGameService,
  type LetterStatus,
  type WordGameStats,
} from "@/service/wordGame.service";
import { postService } from "@/service/post.service";

const WORD_LENGTH = 5;
const SEEN_INSTRUCTIONS_KEY = "word_game_seen_instructions";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
];

const STATUS_COLORS: Record<LetterStatus, { bg: string; text: string }> = {
  correct: { bg: "#22C55E", text: "#FFFFFF" },
  present: { bg: "#F59E0B", text: "#FFFFFF" },
  absent: { bg: "#6B7280", text: "#FFFFFF" },
};

const STATUS_PRIORITY: Record<LetterStatus, number> = {
  absent: 0,
  present: 1,
  correct: 2,
};

const HOW_TO_PLAY_STEPS = [
  { icon: "target" as const, text: "Guess the 5-letter word in 6 tries. Everyone gets the same word each day." },
  { icon: "square" as const, text: "Green means the letter is correct and in the right spot." },
  { icon: "square" as const, text: "Yellow means the letter is in the word, but the wrong spot." },
  { icon: "square" as const, text: "Gray means the letter isn't in the word at all." },
  { icon: "zap" as const, text: "Win in fewer guesses for more XP, and keep your streak alive by playing daily." },
  { icon: "share-2" as const, text: "Share your result grid when you finish — it never spoils the answer." },
];

function buildShareGrid(feedback: LetterStatus[][], puzzleNumber: number, won: boolean, maxGuesses: number): string {
  const emojiFor = (status: LetterStatus) => (status === "correct" ? "🟩" : status === "present" ? "🟨" : "⬛");
  const lines = feedback.map((row) => row.map(emojiFor).join(""));
  const attempts = won ? String(feedback.length) : "X";
  return `Campus Word Puzzle #${puzzleNumber} ${attempts}/${maxGuesses}\n\n${lines.join("\n")}`;
}

export default function WordGameScreen() {
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [puzzleNumber, setPuzzleNumber] = useState(0);
  const [maxGuesses, setMaxGuesses] = useState(6);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<LetterStatus[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [completed, setCompleted] = useState(false);
  const [won, setWon] = useState(false);
  const [answer, setAnswer] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<WordGameStats | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [today, myStats] = await Promise.all([
          wordGameService.getToday(),
          wordGameService.getStats().catch(() => null),
        ]);
        setPuzzleNumber(today.puzzleNumber);
        setMaxGuesses(today.maxGuesses);
        setGuesses(today.guesses);
        setFeedback(today.feedback);
        setCompleted(today.completed);
        setWon(today.won);
        setAnswer(today.answer);
        if (myStats) setStats(myStats);
        if (today.completed) setResultVisible(true);
      } catch (err: any) {
        showError(err?.response?.data?.message || "Failed to load today's puzzle.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const keyStatuses = useMemo(() => {
    const map: Record<string, LetterStatus> = {};
    guesses.forEach((guess, rowIndex) => {
      const rowFeedback = feedback[rowIndex];
      if (!rowFeedback) return;
      guess.split("").forEach((letter, colIndex) => {
        const status = rowFeedback[colIndex];
        const upper = letter.toUpperCase();
        const existing = map[upper];
        if (!existing || STATUS_PRIORITY[status] > STATUS_PRIORITY[existing]) {
          map[upper] = status;
        }
      });
    });
    return map;
  }, [guesses, feedback]);

  const handleSubmitGuess = useCallback(async () => {
    if (currentGuess.length !== WORD_LENGTH) {
      showError("Not enough letters.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await wordGameService.submitGuess(currentGuess);
      setPuzzleNumber(result.puzzleNumber);
      setGuesses(result.guesses);
      setFeedback(result.feedback);
      setCompleted(result.completed);
      setWon(result.won);
      setAnswer(result.answer);
      setStats(result.stats);
      setCurrentGuess("");

      if (result.completed) {
        setResultVisible(true);
        if (result.won && result.xpAwarded > 0) {
          showSuccess(`Solved in ${result.guesses.length}! +${result.xpAwarded} XP`, "Nice one!");
        }
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }, [currentGuess]);

  function handleKeyPress(key: string) {
    if (completed || submitting) return;

    if (key === "ENTER") {
      handleSubmitGuess();
      return;
    }
    if (key === "BACK") {
      setCurrentGuess((prev) => prev.slice(0, -1));
      return;
    }
    setCurrentGuess((prev) => (prev.length < WORD_LENGTH ? prev + key.toLowerCase() : prev));
  }

  async function handleShare() {
    const shareText = buildShareGrid(feedback, puzzleNumber, won, maxGuesses);
    try {
      await Share.share({ message: shareText });
    } catch {
      // user cancelled or share failed — nothing to do
    }
  }

  async function handlePostToFeed() {
    setSharing(true);
    try {
      const shareText = buildShareGrid(feedback, puzzleNumber, won, maxGuesses);
      await postService.createPost({ description: shareText }, []);
      showSuccess("Your result was posted to the feed.", "Shared!");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to post to feed.");
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </SafeAreaView>
    );
  }

  // Rows: submitted guesses first, then the row being typed, then empty rows.
  const rows: Array<{ letters: string[]; statuses: (LetterStatus | null)[] }> = [];
  for (let i = 0; i < maxGuesses; i++) {
    if (i < guesses.length) {
      rows.push({ letters: guesses[i].toUpperCase().split(""), statuses: feedback[i] });
    } else if (i === guesses.length && !completed) {
      const letters = currentGuess.toUpperCase().split("");
      while (letters.length < WORD_LENGTH) letters.push("");
      rows.push({ letters, statuses: new Array(WORD_LENGTH).fill(null) });
    } else {
      rows.push({ letters: new Array(WORD_LENGTH).fill(""), statuses: new Array(WORD_LENGTH).fill(null) });
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
        <ThemedText style={styles.headerTitle}>Word Puzzle</ThemedText>
        <View style={styles.headerRightGroup}>
          <Pressable
            onPress={() => setInstructionsVisible(true)}
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="help-circle" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => setResultVisible(true)}
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="bar-chart-2" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {stats && (
        <View style={styles.streakRow}>
          <Feather name="zap" size={14} color="#F59E0B" />
          <ThemedText style={[styles.streakText, { color: colors.muted }]}>
            {stats.currentStreak} day streak · Puzzle #{puzzleNumber}
          </ThemedText>
        </View>
      )}

      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.letters.map((letter, colIndex) => {
              const status = row.statuses[colIndex];
              const tone = status ? STATUS_COLORS[status] : null;
              return (
                <View
                  key={colIndex}
                  style={[
                    styles.tile,
                    {
                      backgroundColor: tone ? tone.bg : colors.background,
                      borderColor: letter ? (tone ? tone.bg : colors.text) : colors.border,
                    },
                  ]}
                >
                  <ThemedText style={[styles.tileText, tone ? { color: tone.text } : { color: colors.text }]}>
                    {letter}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.keyboard}>
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyboardRow}>
            {row.map((key) => {
              const status = keyStatuses[key];
              const tone = status ? STATUS_COLORS[status] : null;
              const isWide = key === "ENTER" || key === "BACK";
              return (
                <Pressable
                  key={key}
                  onPress={() => handleKeyPress(key)}
                  disabled={completed || submitting}
                  style={[
                    styles.key,
                    isWide && styles.keyWide,
                    {
                      backgroundColor: tone ? tone.bg : colors.card,
                      opacity: completed || submitting ? 0.5 : 1,
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.keyText, { color: tone ? tone.text : colors.text, fontSize: isWide ? 11 : 15 }]}
                  >
                    {key === "BACK" ? "⌫" : key}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Result modal */}
      <Modal visible={resultVisible} animationType="slide" transparent onRequestClose={() => setResultVisible(false)}>
        <View style={styles.modalBackdrop}>
          <ThemedView style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{completed ? (won ? "You got it!" : "So close!") : "Stats"}</ThemedText>
              <Pressable onPress={() => setResultVisible(false)}>
                <Feather name="x" size={22} color={colors.text} />
              </Pressable>
            </View>

            {completed && answer && !won && (
              <ThemedText style={[styles.answerReveal, { color: colors.muted }]}>
                The word was <ThemedText style={{ fontWeight: "800" }}>{answer.toUpperCase()}</ThemedText>
              </ThemedText>
            )}

            {stats && (
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <ThemedText style={styles.statValue}>{stats.totalPlayed}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.muted }]}>Played</ThemedText>
                </View>
                <View style={styles.statBox}>
                  <ThemedText style={styles.statValue}>
                    {stats.totalPlayed > 0 ? Math.round((stats.totalWon / stats.totalPlayed) * 100) : 0}%
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.muted }]}>Win Rate</ThemedText>
                </View>
                <View style={styles.statBox}>
                  <ThemedText style={styles.statValue}>{stats.currentStreak}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.muted }]}>Streak</ThemedText>
                </View>
                <View style={styles.statBox}>
                  <ThemedText style={styles.statValue}>{stats.longestStreak}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.muted }]}>Best</ThemedText>
                </View>
              </View>
            )}

            {completed && (
              <View style={styles.shareRow}>
                <Pressable
                  onPress={handleShare}
                  style={[styles.shareButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Feather name="share-2" size={16} color={colors.text} />
                  <ThemedText style={{ fontWeight: "700" }}>Share</ThemedText>
                </Pressable>
                <Pressable
                  onPress={handlePostToFeed}
                  disabled={sharing}
                  style={[styles.shareButton, { backgroundColor: "#7C3AED", opacity: sharing ? 0.6 : 1 }]}
                >
                  <Feather name="send" size={16} color="#FFF" />
                  <ThemedText style={{ fontWeight: "700", color: "#FFF" }}>
                    {sharing ? "Posting..." : "Post to Feed"}
                  </ThemedText>
                </Pressable>
              </View>
            )}

            {completed && (
              <ThemedText style={[styles.comeBackText, { color: colors.muted }]}>
                Come back tomorrow for a new word!
              </ThemedText>
            )}
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
                style={[styles.shareButton, { backgroundColor: "#7C3AED", alignSelf: "stretch", justifyContent: "center", marginTop: 8, marginBottom: 20 }]}
              >
                <ThemedText style={{ fontWeight: "700", color: "#FFF" }}>Got it, let's play</ThemedText>
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
    fontSize: 18,
    fontWeight: "800",
  },
  headerRightGroup: {
    flexDirection: "row",
    gap: 10,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    alignItems: "center",
    marginVertical: 8,
  },
  gridRow: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 6,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: {
    fontSize: 24,
    fontWeight: "800",
  },
  keyboard: {
    paddingHorizontal: 6,
    marginTop: "auto",
    marginBottom: 12,
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
    gap: 5,
  },
  key: {
    minWidth: 30,
    height: 46,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  keyWide: {
    minWidth: 46,
    paddingHorizontal: 8,
  },
  keyText: {
    fontWeight: "700",
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
    maxHeight: "75%",
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
  answerReveal: {
    textAlign: "center",
    fontSize: 15,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  shareRow: {
    flexDirection: "row",
    gap: 10,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
  },
  comeBackText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
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
});
