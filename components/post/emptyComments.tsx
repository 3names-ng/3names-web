import React from "react";
import { StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { ThemedView } from "../ui/ThemedView";
import { ThemedText } from "../ui/ThemedText";

import { useTheme } from "@/hooks/useTheme";

export default function EmptyComments() {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedView
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="comment-processing-outline"
          size={48}
          color="#7C3AED"
        />
      </ThemedView>

      <ThemedText style={styles.title}>
        No comments yet
      </ThemedText>

      <ThemedText
        style={[
          styles.subtitle,
          {
            color: colors.secondary ?? "#888",
          },
        ]}
      >
        Be the first to start the conversation.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 40,
    paddingTop: 80,
  },

  iconContainer: {
    width: 100,
    height: 100,

    borderRadius: 50,

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
  },

  title: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
});