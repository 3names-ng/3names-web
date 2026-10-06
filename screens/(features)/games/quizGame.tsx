import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  FlatList,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  departmentCategories,
  generalCategories,
  getRandomQuestions,
  findDepartmentCategory,
} from "@/data/quiz";
import { QuizCategory, QuizQuestion } from "@/data/quiz/types";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/useTheme";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthHeader from "@/components/auth/authHeader";

type Phase = "home" | "category" | "setup" | "playing" | "results";
type Mode = "department" | "general";

interface WrongAnswer {
  question: string;
  yourAnswer: string;
  correctAnswer: string;
}

const QUESTION_TIME = 20;
const LETTERS = ["A", "B", "C", "D"];
const QUESTION_COUNTS = [5, 10, 15, 20];

export default function QuizGame() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { colors, isDark } = useTheme();
  const [phase, setPhase] = useState<Phase>("home");
  const [mode, setMode] = useState<Mode>("general");
  const [category, setCategory] = useState<QuizCategory | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myDepartment = useCallback(() => {
    return findDepartmentCategory(user?.departmentName, user?.facultyName);
  }, [user?.departmentName, user?.facultyName]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Countdown per question
  useEffect(() => {
    if (phase !== "playing") return;
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex, category?.id, questionCount]);

  const startCategory = (cat: QuizCategory, modeValue: Mode, count: number) => {
    setCategory(cat);
    setMode(modeValue);
    setQuestionCount(count);
    const qs = getRandomQuestions(cat, count);
    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setWrongAnswers([]);
    setSelectedOption(null);
    setLastCorrect(null);
    setPhase("playing");
  };

  const handleTimeout = () => {
    clearTimer();
    const question = questions[qIndex];
    if (!question || selectedOption !== null) return;
    setSelectedOption(-1);
    setLastCorrect(false);
    setWrongAnswers((prev) => [
      ...prev,
      {
        question: question.q,
        yourAnswer: "Time ran out",
        correctAnswer: question.o[question.a],
      },
    ]);
  };

  const selectOption = (index: number) => {
    if (selectedOption !== null) return;
    clearTimer();
    setSelectedOption(index);
    const question = questions[qIndex];
    const isCorrect = index === question.a;
    setLastCorrect(isCorrect);
    if (isCorrect) {
      setScore((prev) => prev + 1);
    } else {
      setWrongAnswers((prev) => [
        ...prev,
        {
          question: question.q,
          yourAnswer: question.o[index],
          correctAnswer: question.o[question.a],
        },
      ]);
    }
  };

  const handleNext = () => {
    if (qIndex < questions.length - 1) {
      setQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setLastCorrect(null);
    } else {
      clearTimer();
      setPhase("results");
    }
  };

  const exitQuiz = () => {
    clearTimer();
    setPhase("home");
    setCategory(null);
  };

  const goHome = () => {
    router.back();
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border || (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"),
    },
    iconBg: {
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    },
    backBtn: {
      backgroundColor: colors.card,
    },
    titleText: { color: colors.text },
    subtitleText: { color: colors.muted || colors.text },
    primaryAccentText: { color: colors.primary || "#6366F1" },
    trackBg: { backgroundColor: colors.card },
    fillBg: { backgroundColor: colors.primary || "#6366F1" },
  };

  // ---------------- HOME ----------------
  if (phase === "home") {
    const dept = myDepartment();
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
              <AuthHeader title="Campus Quiz" subtitle="Test your knowledge, earn bragging rights" /> 
        <ScrollView contentContainerStyle={styles.content}>


          {/* My department */}
          {/* <TouchableOpacity
            style={[styles.modeCard, dynamicStyles.card]}
            activeOpacity={0.85}
            onPress={() => {
              setMode("department");
              setCategory(dept);
              setPhase("setup");
            }}
          >
            <ThemedView style={[styles.modeIcon, dynamicStyles.iconBg]}>
              <ThemedText style={styles.modeIconText}>🎓</ThemedText>
            </ThemedView>
            <View style={styles.modeInfo}>
              <ThemedText style={[styles.modeTitle, dynamicStyles.titleText]}>My Department</ThemedText>
              <ThemedText style={[styles.modeSubtitle, dynamicStyles.subtitleText]}>
                {dept.name} · {dept.questions.length} questions
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.muted || colors.text} />
          </TouchableOpacity> */}

          {/* Browse departments */}
          <TouchableOpacity
            style={[styles.modeCard, dynamicStyles.card]}
            activeOpacity={0.85}
            onPress={() => {
              setMode("department");
              setPhase("category");
            }}
          >
            <ThemedView style={[styles.modeIcon, dynamicStyles.iconBg]}>
              <ThemedText style={styles.modeIconText}>🏛️</ThemedText>
            </ThemedView>
            <View style={styles.modeInfo}>
              <ThemedText style={[styles.modeTitle, dynamicStyles.titleText]}>Department Library</ThemedText>
              <ThemedText style={[styles.modeSubtitle, dynamicStyles.subtitleText]}>
                {departmentCategories.length} departments to choose from
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.muted || colors.text} />
          </TouchableOpacity>

          {/* General knowledge */}
          <TouchableOpacity
            style={[styles.modeCard, dynamicStyles.card]}
            activeOpacity={0.85}
            onPress={() => {
              setMode("general");
              setPhase("category");
            }}
          >
            <ThemedView style={[styles.modeIcon, dynamicStyles.iconBg]}>
              <ThemedText style={styles.modeIconText}>🌍</ThemedText>
            </ThemedView>
            <View style={styles.modeInfo}>
              <ThemedText style={[styles.modeTitle, dynamicStyles.titleText]}>General Knowledge</ThemedText>
              <ThemedText style={[styles.modeSubtitle, dynamicStyles.subtitleText]}>
                {generalCategories.length} categories · everything and anything
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.muted || colors.text} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------------- CATEGORY SELECT ----------------
  if (phase === "category") {
    const cats = mode === "department" ? departmentCategories : generalCategories;
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ThemedView style={styles.subHeader}>
          <TouchableOpacity style={[styles.backButton, dynamicStyles.backBtn]} onPress={exitQuiz}>
            <Ionicons name="arrow-back" size={22} color={colors.muted || colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.subHeaderTitle, dynamicStyles.titleText]}>
            {mode === "department" ? "Choose a Department" : "Choose a Category"}
          </ThemedText>
          <ThemedView style={{ width: 40 }} />
        </ThemedView>

        <FlatList
          data={cats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryCard, dynamicStyles.card]}
              activeOpacity={0.85}
              onPress={() => {
                setCategory(item);
                setPhase("setup");
              }}
            >
              <ThemedText style={styles.categoryIcon}>{item.icon}</ThemedText>
              <View style={styles.categoryInfo}>
                <ThemedText style={[styles.categoryName, dynamicStyles.titleText]}>{item.name}</ThemedText>
                <ThemedText style={[styles.categoryCount, dynamicStyles.subtitleText]}>
                  {item.questions.length} questions
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted || colors.text} />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  // ---------------- SETUP (question count) ----------------
  if (phase === "setup" && category) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ThemedView style={styles.subHeader}>
          <TouchableOpacity style={[styles.backButton, dynamicStyles.backBtn]} onPress={exitQuiz}>
            <Ionicons name="arrow-back" size={22} color={colors.muted || colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.subHeaderTitle, dynamicStyles.titleText]}>How many questions?</ThemedText>
          <ThemedView style={{ width: 40 }} />
        </ThemedView>

        <ThemedView style={styles.setupContent}>
          <ThemedText style={styles.setupCategory}>
            {category.icon} {category.name}
          </ThemedText>

          {QUESTION_COUNTS.map((count) => (
            <TouchableOpacity
              key={count}
              style={[styles.countCard, dynamicStyles.card]}
              activeOpacity={0.85}
              onPress={() => startCategory(category, mode, count)}
            >
              <ThemedText style={styles.countNumber}>{count}</ThemedText>
              <ThemedText style={[styles.countLabel, dynamicStyles.titleText]}>questions</ThemedText>
              <Ionicons name="play-circle" size={28} color="#FBBF24" />
            </TouchableOpacity>
          ))}

          <ThemedText style={[styles.setupNote, dynamicStyles.subtitleText]}>
            You have {QUESTION_TIME} seconds per question
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // ---------------- RESULTS ----------------
  if (phase === "results" && category) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 50;
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <ThemedText style={styles.resultsEmoji}>{passed ? "🎉" : "💪"}</ThemedText>
          <ThemedText style={[styles.resultsTitle, dynamicStyles.titleText]}>
            {score === questions.length
              ? "PERFECT SCORE!"
              : passed
              ? "WELL DONE!"
              : "KEEP PRACTICING!"}
          </ThemedText>
          <ThemedText style={[styles.resultsCategory, dynamicStyles.subtitleText]}>
            {category.icon} {category.name}
          </ThemedText>

          <ThemedView style={[styles.resultsScoreCard, dynamicStyles.card, { borderColor: colors.primary || "#6366F1" }]}>
            <ThemedText style={[styles.resultsScore, dynamicStyles.titleText]}>
              {score} / {questions.length}
            </ThemedText>
            <ThemedText style={[styles.resultsPercentage, dynamicStyles.primaryAccentText]}>
              {percentage}%
            </ThemedText>
          </ThemedView>

          {wrongAnswers.length > 0 && (
            <ThemedView style={styles.reviewSection}>
              <ThemedText style={[styles.reviewTitle, dynamicStyles.titleText]}>
                Review Wrong Answers
              </ThemedText>
              {wrongAnswers.map((wrong, idx) => (
                <ThemedView key={idx} style={[styles.reviewCard, dynamicStyles.card]}>
                  <ThemedText style={[styles.reviewQuestion, dynamicStyles.titleText]}>
                    {wrong.question}
                  </ThemedText>
                  <ThemedText style={styles.reviewWrong}>
                    ✗ Your answer: {wrong.yourAnswer}
                  </ThemedText>
                  <ThemedText style={styles.reviewCorrect}>
                    ✓ Correct: {wrong.correctAnswer}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary || "#6366F1" }]}
            onPress={() => startCategory(category, mode, questionCount)}
          >
            <ThemedText style={styles.primaryButtonText}>PLAY AGAIN</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={exitQuiz}>
            <ThemedText style={[styles.secondaryButtonText, dynamicStyles.subtitleText]}>
              Choose Another Category
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------------- PLAYING ----------------
  const question = questions[qIndex];
  if (!category || !question) return null;

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <ThemedView style={styles.quizHeader}>
        <TouchableOpacity style={[styles.backButton, dynamicStyles.backBtn]} onPress={exitQuiz}>
          <Ionicons name="close" size={24} color={colors.muted || colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.quizHeaderTitle, dynamicStyles.titleText]}>
          {qIndex + 1} / {questions.length}
        </ThemedText>
        <ThemedView
          style={[
            styles.timerCircle,
            dynamicStyles.card,
            { borderColor: colors.primary || "#6366F1" },
            timeLeft <= 5 && styles.timerCircleDanger,
          ]}
        >
          <ThemedText style={[styles.timerText, dynamicStyles.titleText]}>{timeLeft}</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Progress */}
      <ThemedView style={[styles.progressTrack, dynamicStyles.trackBg]}>
        <ThemedView
          style={[
            styles.progressFill,
            dynamicStyles.fillBg,
            { width: `${((qIndex + (selectedOption !== null ? 1 : 0)) / questions.length) * 100}%` },
          ]}
        />
      </ThemedView>

      <ScrollView contentContainerStyle={styles.quizContent}>
        <ThemedView style={[styles.questionCard, dynamicStyles.card]}>
          <ThemedText style={[styles.questionCategory, dynamicStyles.primaryAccentText]}>
            {category.name}
          </ThemedText>
          <ThemedText style={[styles.questionText, dynamicStyles.titleText]}>
            {question.q}
          </ThemedText>
        </ThemedView>

        {question.o.map((option, index) => {
          let optionStyle: StyleProp<ViewStyle> = [styles.optionButton, dynamicStyles.card];
          let textStyle: StyleProp<TextStyle> = [styles.optionText, dynamicStyles.titleText];
          let letterStyle: StyleProp<ViewStyle> = [styles.optionLetter, dynamicStyles.iconBg];
          let letterTextStyle: StyleProp<TextStyle> = [styles.optionLetterText, dynamicStyles.titleText];

          if (selectedOption !== null) {
            if (index === question.a) {
              optionStyle = [styles.optionButton, styles.optionCorrect];
              textStyle = [styles.optionText, styles.optionTextLight];
              letterStyle = [styles.optionLetter, styles.optionLetterLight];
              letterTextStyle = [styles.optionLetterText, styles.optionTextLight];
            } else if (index === selectedOption) {
              optionStyle = [styles.optionButton, styles.optionWrong];
              textStyle = [styles.optionText, styles.optionTextLight];
              letterStyle = [styles.optionLetter, styles.optionLetterLight];
              letterTextStyle = [styles.optionLetterText, styles.optionTextLight];
            } else {
              optionStyle = [styles.optionButton, dynamicStyles.card, styles.optionDimmed];
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => selectOption(index)}
              disabled={selectedOption !== null}
              activeOpacity={0.85}
            >
              <ThemedView style={letterStyle}>
                <ThemedText style={letterTextStyle}>{LETTERS[index]}</ThemedText>
              </ThemedView>
              <ThemedText style={textStyle}>{option}</ThemedText>
            </TouchableOpacity>
          );
        })}

        {selectedOption !== null && (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.primary || "#6366F1" }]}
            onPress={handleNext}
          >
            <ThemedText style={styles.nextButtonText}>
              {qIndex === questions.length - 1 ? "SEE RESULTS" : "NEXT QUESTION"}
            </ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  modeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  modeIconText: {
    fontSize: 26,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modeSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  subHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  categoryList: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "700",
  },
  categoryCount: {
    fontSize: 12,
    marginTop: 2,
  },
  setupContent: {
    padding: 20,
  },
  setupCategory: {
    color: "#FBBF24",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 16,
  },
  countCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
    gap: 12,
  },
  countNumber: {
    color: "#FBBF24",
    fontSize: 24,
    fontWeight: "900",
    width: 60,
  },
  countLabel: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  setupNote: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 12,
  },
  quizHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  quizHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  timerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  timerCircleDanger: {
    borderColor: "#EF4444",
  },
  timerText: {
    fontSize: 15,
    fontWeight: "800",
  },
  progressTrack: {
    height: 6,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  quizContent: {
    padding: 16,
    paddingBottom: 30,
  },
  questionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  questionCategory: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  optionCorrect: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  optionWrong: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  optionDimmed: {
    opacity: 0.35,
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionLetterLight: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  optionLetterText: {
    fontWeight: "800",
    fontSize: 14,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  optionTextLight: {
    color: "#FFFFFF",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 25,
    gap: 8,
    marginTop: 8,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  resultsContent: {
    padding: 24,
    alignItems: "center",
    paddingBottom: 40,
  },
  resultsEmoji: {
    fontSize: 64,
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 12,
  },
  resultsCategory: {
    fontSize: 14,
    marginTop: 6,
  },
  resultsScoreCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    width: "100%",
    marginVertical: 20,
  },
  resultsScore: {
    fontSize: 34,
    fontWeight: "900",
  },
  resultsPercentage: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  reviewSection: {
    width: "100%",
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  reviewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  reviewQuestion: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  reviewWrong: {
    color: "#F87171",
    fontSize: 13,
    marginBottom: 3,
  },
  reviewCorrect: {
    color: "#34D399",
    fontSize: 13,
  },
  primaryButton: {
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});