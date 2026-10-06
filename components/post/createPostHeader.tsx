import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  loading?: boolean;
  onPost?: () => void;
}

export default function CreatePostHeader({
  loading = false,
  onPost,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Close */}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.back()}
        style={styles.iconButton}
      >
        {/* <Ionicons
          name="close"
          size={30}
          color={colors.text}
        /> */}
      </TouchableOpacity>

      {/* Title */}

      <ThemedText style={styles.title}>
        {t("createPost.title")}
      </ThemedText>

      {/* Post */}

      <TouchableOpacity
        activeOpacity={0.8}
        disabled={loading}
        onPress={onPost}
        style={styles.postButton}
      >
        <ThemedText
          style={[
            styles.postText,
            {
              opacity: loading ? 0.6 : 1,
            },
          ]}
        >
           {t("createPost.preview")}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 62,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 18,

    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  iconButton: {
    width: 40,
    height: 40,

    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },

  postButton: {
    minWidth: 60,
    alignItems: "flex-end",
  },

  postText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
  },
});