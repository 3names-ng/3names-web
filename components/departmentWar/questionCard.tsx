import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface QuestionCardProps {
  questionText: string;
  options: string[];
  questionIndex: number;
  totalQuestions: number;
  selectedOption: number | null;
  result: 'correct' | 'wrong' | 'failed' | null;
  correctOption: number | null;
  timeRemaining: number;
  timePerQuestion: number;
  onSelectOption: (index: number) => void;
  disabled?: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function QuestionCard({
  questionText,
  options,
  questionIndex,
  totalQuestions,
  selectedOption,
  result,
  correctOption,
  timeRemaining,
  timePerQuestion,
  onSelectOption,
  disabled = false,
}: QuestionCardProps) {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation on time warning
  useEffect(() => {
    if (timeRemaining <= 5 && timeRemaining > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [timeRemaining, scaleAnim]);

  // Pulse the checkmark when an option is selected (before submission)
  useEffect(() => {
    if (selectedOption !== null && !result) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [selectedOption, result, pulseAnim]);

  const getOptionStyle = (index: number) => {
    const base: any = {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 2,
    };

    if (selectedOption === index) {
      if (result === 'correct') {
        return { ...base, backgroundColor: '#10B981', borderColor: '#10B981' };
      }
      if (result === 'wrong') {
        return { ...base, backgroundColor: '#EF4444', borderColor: '#EF4444' };
      }
      return { ...base, backgroundColor: '#6C3EF4', borderColor: '#6C3EF4' };
    }

    if (result && correctOption === index) {
      return { ...base, backgroundColor: '#10B981', borderColor: '#10B981' };
    }

    return base;
  };

  const getOptionTextStyle = (index: number) => {
    if (selectedOption === index || (result && correctOption === index)) {
      return { color: '#fff', fontWeight: '600' as const };
    }
    return { color: colors.text };
  };

  const timerColor = timeRemaining <= 5 ? '#EF4444' : timeRemaining <= 10 ? '#F59E0B' : colors.primary || '#6C3EF4';
  const timerPercentage = (timeRemaining / timePerQuestion) * 100;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Header: Question number + Timer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <ThemedText style={{ color: colors.muted, fontSize: 14, fontWeight: '600' }}>
          Question {questionIndex + 1}/{totalQuestions}
        </ThemedText>

        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            backgroundColor: timerColor,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            {timeRemaining}s
          </ThemedText>
        </Animated.View>
      </View>

      {/* Timer bar */}
      <View
        style={{
          height: 4,
          backgroundColor: isDark ? '#333' : '#E5E7EB',
          borderRadius: 2,
          marginBottom: 20,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${timerPercentage}%`,
            backgroundColor: timerColor,
            borderRadius: 2,
          }}
        />
      </View>

      {/* Question text */}
      <ThemedText style={{ fontSize: 20, fontWeight: '700', lineHeight: 28, marginBottom: 24 }}>
        {questionText}
      </ThemedText>

      {/* Options */}
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => !disabled && onSelectOption(index)}
          activeOpacity={disabled ? 1 : 0.7}
          disabled={disabled}
          style={[
            getOptionStyle(index),
            {
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 14,
              marginBottom: 12,
            },
          ]}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor:
                selectedOption === index || (result && correctOption === index)
                  ? 'rgba(255,255,255,0.25)'
                  : isDark
                  ? '#374151'
                  : '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            {selectedOption === index && !result ? (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </Animated.View>
            ) : (
              <ThemedText
                style={[
                  getOptionTextStyle(index),
                  { fontWeight: '800', fontSize: 15 },
                ]}
              >
                {OPTION_LABELS[index]}
              </ThemedText>
            )}
          </View>
          <ThemedText
            style={[
              getOptionTextStyle(index),
              { flex: 1, fontSize: 16, lineHeight: 22 },
            ]}
          >
            {option}
          </ThemedText>
        </TouchableOpacity>
      ))}

      {/* Failed / Selection hint */}
      {result === 'failed' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, backgroundColor: '#EF444422', paddingVertical: 10, borderRadius: 12 }}>
          <Ionicons name="close-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <ThemedText style={{ color: '#EF4444', fontSize: 15, fontWeight: '700' }}>
            Time's up — No answer
          </ThemedText>
        </View>
      )}
      {selectedOption !== null && !result && !disabled && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <Ionicons name="finger-print-outline" size={14} color={colors.muted} style={{ marginRight: 6 }} />
          <ThemedText style={{ color: colors.muted, fontSize: 13, fontStyle: 'italic' }}>
            Tap another option to change
          </ThemedText>
        </View>
      )}
    </View>
  );
}
