import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { X, SendHorizonal } from "lucide-react-native";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemedText } from "../ui/ThemedText";
import { postService } from "@/service/post.service";

interface Props {
  postId: string;
  parentCommentId: string;

  replyingTo: {
    firstName: string;
    lastName: string;
  };

  onCancel: () => void;
  onCreated: (reply: any) => void;
}

export default function ReplyInput({
  postId,
  parentCommentId,
  replyingTo,
  onCancel,
  onCreated,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const inputRef = useRef<TextInput>(null);

  const [text, setText] = useState("");

  const [loading, setLoading] = useState(false);

  async function sendReply() {
    if (!text.trim()) return;

    try {
      setLoading(true);

    //   const res = await postService.createComment(postId, {
    //     text,
    //     parentCommentId,
    //   });

    //   onCreated(res.data);

      setText("");

      inputRef.current?.clear();

      onCancel();
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText style={styles.replyingText}>
          {t("post.replyingTo", { name: `${replyingTo.firstName} ${replyingTo.lastName}` })}
        </ThemedText>

        <Pressable onPress={onCancel}>
          <X size={18} color="#888" />
        </Pressable>
      </View>

      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder={t("post.writeReply")}
        placeholderTextColor="#999"
        multiline
        autoFocus
        style={[
          styles.input,
          {
            color: colors.text,
          },
        ]}
      />

      <View style={styles.footer}>
        <Pressable
          disabled={loading || text.trim() === ""}
          onPress={sendReply}
          style={[
            styles.sendButton,
            {
              opacity:
                loading || text.trim() === ""
                  ? 0.5
                  : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <SendHorizonal
              color="#FFF"
              size={18}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,

    borderWidth: 1,

    borderRadius: 18,

    padding: 12,
  },

  header: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 10,
  },

  replyingText: {
    fontSize: 13,
  },

  input: {
    minHeight: 60,

    maxHeight: 120,

    textAlignVertical: "top",

    fontSize: 15,
  },

  footer: {
    alignItems: "flex-end",

    marginTop: 12,
  },

  sendButton: {
    backgroundColor: "#7C3AED",

    width: 42,

    height: 42,

    borderRadius: 21,

    justifyContent: "center",

    alignItems: "center",
  },
});