import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface AuthProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function AuthProgress({
  currentStep,
  totalSteps,
}: AuthProgressProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const completed = index + 1 < currentStep;
        const active = index + 1 === currentStep;

        return (
          <React.Fragment key={index}>
            <StepCircle
              completed={completed}
              active={active}
              colors={colors}
            />

            {index !== totalSteps - 1 && (
              <ProgressLine
                filled={completed}
                colors={colors}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

interface StepCircleProps {
  completed: boolean;
  active: boolean;
  colors: any;
}

function StepCircle({
  completed,
  active,
  colors,
}: StepCircleProps) {
  const scale = useRef(new Animated.Value(active ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: active ? 1.15 : 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [active]);

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          transform: [{ scale }],
          backgroundColor: completed
            ? colors.primary
            : active
            ? colors.primary
            : colors.card,
          borderColor: active
            ? colors.primary
            : colors.border,
        },
      ]}
    >
      {completed ? (
        <Ionicons
          name="checkmark"
          size={14}
          color="#fff"
        />
      ) : (
        <View
          style={[
            styles.innerDot,
            {
              backgroundColor: active
                ? "#fff"
                : colors.border,
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

interface ProgressLineProps {
  filled: boolean;
  colors: any;
}

function ProgressLine({
  filled,
  colors,
}: ProgressLineProps) {
  const progress = useRef(
    new Animated.Value(filled ? 1 : 0)
  ).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: filled ? 1 : 0,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [filled]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={[
        styles.line,
        {
          backgroundColor: colors.border,
        },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            width,
            backgroundColor: colors.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
  },

  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  line: {
    flex: 1,
    height: 4,
    borderRadius: 20,
    marginHorizontal: 8,
    overflow: "hidden",
  },
});