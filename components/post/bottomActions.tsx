import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  loading?: boolean;

  estimatedXp?: number;

  onSaveDraft?: () => void;
  onPreview?: () => void;
  onPost?: () => void;
}

export default function BottomActions({
  loading = false,

  estimatedXp = 15,

  onSaveDraft,
  onPreview,
  onPost,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: insets.bottom + 12,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      ]}
    >
    
      {/* Buttons */}

      <View style={styles.row}>
        {/* Draft */}

        {!!onSaveDraft && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onSaveDraft}
          style={[
            styles.secondaryButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={colors.text}
          />

          <ThemedText style={styles.secondaryText}>
            {t("explore.saveDraft")}
          </ThemedText>
        </TouchableOpacity>
        )}

        {/* Preview */}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPreview}
          style={[
            styles.secondaryButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Ionicons
            name="eye-outline"
            size={18}
            color={colors.text}
          />

          <ThemedText style={styles.secondaryText}>
            {t("post.preview")}
          </ThemedText>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,

    paddingHorizontal: 10,
    paddingTop: 16,
  },

  xpCard: {
    flexDirection: "row",
    alignItems: "center",

    borderRadius: 16,

    padding: 14,

    marginBottom: 16,
  },

  xpText: {
    marginLeft: 10,
    fontSize: 15,
  },

  xpValue: {
    color: "#2563EB",
    fontWeight: "700",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  secondaryButton: {
    flex: 1,

    height: 54,

    borderRadius: 16,

    borderWidth: 1,

    justifyContent: "center",
    alignItems: "center",

    flexDirection: "row",

    marginHorizontal: 4,
  },

  secondaryText: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 15,
  },

  postButton: {
    height: 58,

    marginTop: 16,

    borderRadius: 18,

    backgroundColor: "#7C3AED",

    justifyContent: "center",
    alignItems: "center",

    flexDirection: "row",
  },

  postText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 17,
    marginLeft: 10,
  },
});