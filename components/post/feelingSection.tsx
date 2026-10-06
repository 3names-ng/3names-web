import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Feeling {
  emoji: string;
  title: string;
}

interface Props {
  value?: Feeling | null;
  onChange?: (feeling: Feeling) => void;
}

const FEELINGS: Feeling[] = [
  { emoji: "😊", title: "Happy" },
  { emoji: "😍", title: "Loved" },
  { emoji: "🎉", title: "Celebrating" },
  { emoji: "🥳", title: "Excited" },
  { emoji: "😎", title: "Confident" },
  { emoji: "🤩", title: "Inspired" },
  { emoji: "📚", title: "Studying" },
  { emoji: "☕", title: "Chilling" },
  { emoji: "🏀", title: "Playing Sports" },
  { emoji: "🎵", title: "Listening to Music" },
  { emoji: "🍕", title: "Eating" },
  { emoji: "✈️", title: "Travelling" },
  { emoji: "💼", title: "Working" },
  { emoji: "🎮", title: "Gaming" },
  { emoji: "💤", title: "Sleepy" },
];

export default function FeelingSection({
  value,
  onChange,
}: Props) {
  const { colors } = useTheme();

  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setVisible(true)}
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.left}>
          <Ionicons
            name="happy-outline"
            size={24}
            color="#F59E0B"
          />

          <View style={{ marginLeft: 12 }}>
            <ThemedText style={styles.title}>
              Feeling / Activity
            </ThemedText>

            <ThemedText
              style={styles.subtitle}
            >
              {value
                ? `${value.emoji} ${value.title}`
                : "Add how you're feeling"}
            </ThemedText>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color="#999"
        />
      </TouchableOpacity>

      {/* Modal */}

      <Modal
        animationType="slide"
        transparent
        visible={visible}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor:
                  colors.background,
              },
            ]}
          >
            <View style={styles.header}>
              <ThemedText
                style={styles.headerTitle}
              >
                Select Feeling
              </ThemedText>

              <TouchableOpacity
                onPress={() =>
                  setVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={28}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {FEELINGS.map((item) => (
                <TouchableOpacity
                  key={item.title}
                  activeOpacity={0.85}
                  style={styles.item}
                  onPress={() => {
                    onChange?.(item);
                    setVisible(false);
                  }}
                >
                  <ThemedText
                    style={styles.emoji}
                  >
                    {item.emoji}
                  </ThemedText>

                  <ThemedText
                    style={styles.itemTitle}
                  >
                    {item.title}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 20,

    borderWidth: 1,
    borderRadius: 18,

    padding: 18,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 4,
    color: "#888",
    fontSize: 14,
  },

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,.35)",
  },

  sheet: {
    height: "75%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 16,

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },

  emoji: {
    fontSize: 30,
    marginRight: 18,
  },

  itemTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
});