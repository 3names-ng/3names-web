import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

// Department Quiz Dataset
const DEPARTMENT_QUIZZES = [
  {
    id: 'cs',
    name: 'Computer Science',
    icon: '💻',
    questions: [
      {
        id: 1,
        question: 'Which data structure operates on a First-In, First-Out (FIFO) basis?',
        options: ['Stack', 'Queue', 'Binary Tree', 'Graph'],
        correctAnswer: 1,
      },
      {
        id: 2,
        question: 'What is the time complexity of searching in a balanced Binary Search Tree?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
        correctAnswer: 2,
      },
      {
        id: 3,
        question: 'Which layer of the OSI model handles end-to-end communication control?',
        options: ['Network', 'Transport', 'Data Link', 'Physical'],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: 'med',
    name: 'Medicine & Health',
    icon: '🩺',
    questions: [
      {
        id: 1,
        question: 'Which chamber of the human heart pumps oxygenated blood to the body?',
        options: ['Right Atrium', 'Left Atrium', 'Right Ventricle', 'Left Ventricle'],
        correctAnswer: 3,
      },
      {
        id: 2,
        question: 'What is the standard adult human blood pressure baseline?',
        options: ['120/80 mmHg', '140/90 mmHg', '100/60 mmHg', '110/70 mmHg'],
        correctAnswer: 0,
      },
      {
        id: 3,
        question: 'Which organ produces insulin in the body?',
        options: ['Liver', 'Kidney', 'Pancreas', 'Gallbladder'],
        correctAnswer: 2,
      },
    ],
  },
  {
    id: 'law',
    name: 'Faculty of Law',
    icon: '⚖️',
    questions: [
      {
        id: 1,
        question: 'What standard of proof is required in criminal prosecutions?',
        options: [
          'Preponderance of evidence',
          'Beyond reasonable doubt',
          'Clear and convincing',
          'Probable cause',
        ],
        correctAnswer: 1,
      },
      {
        id: 2,
        question: 'What does the Latin legal phrase "Stare Decisis" mean?',
        options: [
          'To stand by things decided',
          'The law of the place',
          'In good faith',
          'Guilty mind',
        ],
        correctAnswer: 0,
      },
    ],
  },
  {
    id: 'bus',
    name: 'Business Admin',
    icon: '📊',
    questions: [
      {
        id: 1,
        question: 'In financial accounting, what does EBITDA stand for?',
        options: [
          'Earnings Before Interest, Taxes, Depreciation, and Amortization',
          'Equity Before Income, Taxes, Debt, and Amortization',
          'Earnings By Investment, Taxes, Dividends, and Assets',
          'Estimated Balance In Taxes, Debt, and Amortization',
        ],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'Which component is NOT one of the 4 Ps of Marketing?',
        options: ['Product', 'Price', 'Positioning', 'Promotion'],
        correctAnswer: 2,
      },
    ],
  },
];

type QuizState = 'SELECT_DEPT' | 'IN_QUIZ' | 'RESULTS';

export default function DepartmentQuizApp() {
  const [appState, setAppState] = useState<QuizState>('SELECT_DEPT');
  const [selectedDeptIndex, setSelectedDeptIndex] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const activeDepartment =
    selectedDeptIndex !== null ? DEPARTMENT_QUIZZES[selectedDeptIndex] : null;
  const currentQuestion = activeDepartment
    ? activeDepartment.questions[currentQuestionIndex]
    : null;

  // Handle Department Selection
  const handleSelectDepartment = (index: number) => {
    setSelectedDeptIndex(index);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setAppState('IN_QUIZ');
  };

  // Handle Option Selection
  const handleOptionPress = (index: number) => {
    if (selectedOption !== null || !currentQuestion) return;

    setSelectedOption(index);
    if (index === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  // Move to Next Question
  const handleNextQuestion = () => {
    if (!activeDepartment) return;

    if (currentQuestionIndex < activeDepartment.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setAppState('RESULTS');
    }
  };

  // Reset to Main Menu
  const handleReturnHome = () => {
    setAppState('SELECT_DEPT');
    setSelectedDeptIndex(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
  };

  // --- SCREEN 1: DEPARTMENT SELECTION ---
  if (appState === 'SELECT_DEPT') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.title}>Campus Trivia</Text>
          <Text style={styles.subtitle}>Select your department to begin</Text>
        </View>

        <ScrollView contentContainerStyle={styles.deptList}>
          {DEPARTMENT_QUIZZES.map((dept, index) => (
            <TouchableOpacity
              key={dept.id}
              style={styles.deptCard}
              activeOpacity={0.8}
              onPress={() => handleSelectDepartment(index)}
            >
              <Text style={styles.deptIcon}>{dept.icon}</Text>
              <View style={styles.deptInfo}>
                <Text style={styles.deptName}>{dept.name}</Text>
                <Text style={styles.deptQuestionCount}>
                  {dept.questions.length} Questions
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- SCREEN 2: RESULTS ---
  if (appState === 'RESULTS' && activeDepartment) {
    const totalQuestions = activeDepartment.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerCard}>
          <Text style={styles.deptTag}>{activeDepartment.name} Assessment</Text>
          <Text style={styles.resultTitle}>Quiz Finished! 🎓</Text>
          <Text style={styles.scoreText}>
            You scored {score} / {totalQuestions}
          </Text>
          <Text style={styles.percentageText}>{percentage}%</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleSelectDepartment(selectedDeptIndex!)}
          >
            <Text style={styles.primaryButtonText}>Retake Department Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleReturnHome}>
            <Text style={styles.secondaryButtonText}>Choose Another Department</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- SCREEN 3: ACTIVE QUIZ ---
  if (!activeDepartment || !currentQuestion) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header & Navigation */}
      <View style={styles.quizHeader}>
        <TouchableOpacity onPress={handleReturnHome}>
          <Text style={styles.backButtonText}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.activeDeptName}>{activeDepartment.name}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {activeDepartment.questions.length}
        </Text>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${
                  ((currentQuestionIndex + 1) / activeDepartment.questions.length) *
                  100
                }%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Question Card */}
      <View style={styles.card}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {/* Option Choices */}
        {currentQuestion.options.map((option, index) => {
          let optionStyle: StyleProp<ViewStyle> = styles.optionButton;
          let textStyle: StyleProp<TextStyle> = styles.optionText;

          if (selectedOption !== null) {
            if (index === currentQuestion.correctAnswer) {
              optionStyle = [styles.optionButton, styles.correctOption];
              textStyle = [styles.optionText, styles.whiteText];
            } else if (index === selectedOption) {
              optionStyle = [styles.optionButton, styles.wrongOption];
              textStyle = [styles.optionText, styles.whiteText];
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              activeOpacity={0.8}
              onPress={() => handleOptionPress(index)}
              disabled={selectedOption !== null}
            >
              <Text style={textStyle}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Next Step */}
      {selectedOption !== null && (
        <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex === activeDepartment.questions.length - 1
              ? 'Complete Assessment'
              : 'Next Question'}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    marginTop: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  deptList: {
    gap: 12,
    paddingBottom: 20,
  },
  deptCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  deptIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  deptInfo: {
    flex: 1,
  },
  deptName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  deptQuestionCount: {
    fontSize: 13,
    color: '#6366F1',
    marginTop: 2,
    fontWeight: '600',
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  backButtonText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 16,
  },
  activeDeptName: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
  },
  centerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 20,
    lineHeight: 26,
  },
  optionButton: {
    backgroundColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  optionText: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  whiteText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  correctOption: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  wrongOption: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  nextButton: {
    marginTop: 20,
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deptTag: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 4,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#6366F1',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});