import React, { useState, useRef } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  hashtags: string[];
  onAddHashtag?: (hashtag: string) => void;
  onRemoveHashtag?: (hashtag: string) => void;
}

export default function HashtagSection({
  hashtags = [],
  onAddHashtag,
  onRemoveHashtag,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Helper logic to clean and submit tags safely
  const processAndAddTag = (text: string) => {
    // Strip hashtags symbols and any extra spacing/newlines
    const cleanTag = text.replace(/#/g, "").replace(/\s/g, "");
    if (!cleanTag) return;

    // Check against current array to avoid duplicates
    if (!hashtags.includes(cleanTag)) {
      onAddHashtag?.(cleanTag);
    }
    setValue("");
  };

  // Handles dynamic typing (like spacing items)
  const handleTextChange = (text: string) => {
    // If user enters a space, submit the chunk they just typed
    if (text.endsWith(" ")) {
      processAndAddTag(text);
    } else {
      setValue(text);
    }
  };

  function handleSubmit() {
    processAndAddTag(value);
  }

  const handleRowPress = () => {
    inputRef.current?.focus();
  };

  return (
    <TouchableWithoutFeedback onPress={handleRowPress}>
      <View style={[styles.container, { borderBottomColor: colors.border }]}>
        <View style={styles.content}>
          {/* Left Side: Hash Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="pricetags-outline"
              size={22}
              color="#3B82F6" 
            />
          </View>

          {/* Middle: Input field and flow */}
          <View style={styles.rightContent}>
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={handleTextChange}
                placeholder={t("post.addHashtag")}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {/* Render Active Hashtags */}
            {hashtags.length > 0 && (
              <View style={styles.tagsContainer}>
                {hashtags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    {/* Add visual hash prefix here dynamically so it looks pretty in the UI */}
                    <ThemedText style={styles.tagText}>#{tag}</ThemedText>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => onRemoveHashtag?.(tag)}
                      style={styles.closeBtn}
                    >
                      <Ionicons name="close" size={12} color="#1E40AF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right Side: Indicator */}
          <View style={styles.arrowContainer}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#9CA3AF"
            />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1, 
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 30,
    alignItems: "flex-start",
    marginTop: 2,
  },
  rightContent: {
    flex: 1,
    paddingRight: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    padding: 0,
    height: 24,
  },
  arrowContainer: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF", 
    borderWidth: 1,
    borderColor: "#DBEAFE",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: "#1E40AF", 
    fontWeight: "600",
    fontSize: 13,
    marginRight: 6,
  },
  closeBtn: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
});