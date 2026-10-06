import React, { useMemo } from "react";
import {
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  maxLength?: number;
}

export default function CaptionInput({
  value,
  onChangeText,
  maxLength = 2000,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const charactersLeft = useMemo(
    () => maxLength - value.length,
    [value, maxLength]
  );

  const counterColor = useMemo(() => {
    if (charactersLeft <= 100) return "#EF4444";
    if (charactersLeft <= 300) return "#F59E0B";
    return "#9CA3AF";
  }, [charactersLeft]);

  return (
    <View style={styles.container}>
      {/* Container Box acting as the border wrapper */}
      <View style={[styles.inputBox, { borderColor: colors.border }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={t("post.captionPlaceholder")}
          placeholderTextColor="#9CA3AF"
          multiline
          autoCorrect
          textAlignVertical="top"
          maxLength={maxLength}
          style={[styles.input, { color: colors.text }]}
        />

        {/* Counter positioned directly inside the bottom-right of the box */}
        <ThemedText
          style={[
            styles.counter,
            {
              color: counterColor,
            },
          ]}
        >
          {value.length}/{maxLength}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    marginBottom:10
  },

  inputBox: {
    position: "relative",
    borderWidth: 1,
    borderRadius: 12,
    height: 150, 
  },

  input: {
    flex: 1, 
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 32, 
  },

  counter: {
    position: "absolute",
    bottom: 8,
    right: 12,
    fontSize: 12,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
});