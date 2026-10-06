import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SendHorizonal, X } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { ThemedView } from "../ui/ThemedView";
import { ThemedText } from "../ui/ThemedText";
import { postService } from "@/service/post.service";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { showError } from "../ui/toast";

interface Props {
  postId: string;
  activeReply: { id: string; name: string } | null;
  onCancelReply: () => void;
  onCreated: (comment: any) => void;
  onServerConfirmed?: (tempId: string, serverComment: any) => void;
  onServerFailed?: (tempId: string) => void;
}

export default function CommentInput({
  postId,
  activeReply,
  onCancelReply,
  onCreated,
  onServerConfirmed,
  onServerFailed,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const inputRef = useRef<TextInput>(null);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeReply) {
      inputRef.current?.focus();
    }
  }, [activeReply]);

  async function sendComment() {
    const text = comment.trim();
    if (text === "" && !image) return;

    Keyboard.dismiss();

    // Ensure timestamp uses exact current local/UTC ISO representation
    const currentTimestamp = new Date().toISOString();

    // ── REPLIES ──
    if (activeReply) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const optimisticReply = {
        id: tempId,
        text,
        createdAt: currentTimestamp,
        likesCount: 0,
        user: {
          id: user?.id,
          username: user?.username,
          firstName: user?.firstName,
          lastName: user?.lastName,
          profilePictureUrl: user?.profilePictureUrl,
          profileFrame: user?.profileFrame,
          appLevel: user?.appLevel,
        },
      };

      DeviceEventEmitter.emit("REPLY_OPTIMISTIC_ADDED", {
        commentId: activeReply.id,
        reply: optimisticReply,
      });

      setComment("");
      setImage(undefined);
      inputRef.current?.clear();
      onCancelReply();

      try {
        const response = await postService.replyToComment(activeReply.id, text);
        DeviceEventEmitter.emit("REPLY_OPTIMISTIC_CONFIRMED", {
          commentId: activeReply.id,
          tempId,
          reply: response,
        });
      } catch (e) {
        console.log("Failed to send reply:", e);
        DeviceEventEmitter.emit("REPLY_OPTIMISTIC_FAILED", {
          commentId: activeReply.id,
          tempId,
        });
        showError(t("post.couldNotPostComment"), t("error.error"));
      }
      return;
    }

    // ── TOP-LEVEL COMMENT ──
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimisticComment = {
      id: tempId,
      text,
      createdAt: currentTimestamp,
      likesCount: 0,
      repliesCount: 0,
      user: {
        id: user?.id,
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName,
        profilePictureUrl: user?.profilePictureUrl,
        profileFrame: user?.profileFrame,
        appLevel: user?.appLevel,
      },
    };

    onCreated(optimisticComment);
    setComment("");
    setImage(undefined);
    inputRef.current?.clear();

    try {
      const response = await postService.addComment(postId, text);
      onServerConfirmed?.(tempId, response);
    } catch (e) {
      console.log("Failed to send comment:", e);
      onServerFailed?.(tempId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border || "#E5E7EB",
        },
      ]}
    >
      {activeReply && (
        <View style={[styles.replyBanner, { backgroundColor: colors.card }]}>
          <ThemedText style={styles.replyBannerText}>
            Replying to{" "}
            <ThemedText style={{ fontWeight: "700" }}>
              @{activeReply.name}
            </ThemedText>
          </ThemedText>
          <Pressable onPress={onCancelReply} hitSlop={6}>
            <X size={16} color={colors.text} />
          </Pressable>
        </View>
      )}

      {image && (
        <View style={styles.preview}>
          <Image source={{ uri: image.uri }} style={styles.previewImage} />
          <Pressable
            style={styles.remove}
            onPress={() => setImage(undefined)}
          >
            <X size={15} color="#FFF" />
          </Pressable>
        </View>
      )}

      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          value={comment}
          onChangeText={setComment}
          placeholder={
            activeReply ? `Reply to ${activeReply.name}...` : "Write a comment..."
          }
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
            },
          ]}
        />

        <Pressable
          disabled={loading || (!comment.trim() && !image)}
          onPress={sendComment}
          style={[
            styles.send,
            {
              opacity: loading || (!comment.trim() && !image) ? 0.5 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <SendHorizonal size={18} color="#FFF" />
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 15,
    paddingTop: 18,
    paddingBottom: Platform.OS === "ios" ? 24 : 24,
  },
  replyBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyBannerText: {
    fontSize: 13,
  },
  preview: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  remove: {
    position: "absolute",
    right: -6,
    top: -6,
    backgroundColor: "#EF4444",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
  },
  send: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
});