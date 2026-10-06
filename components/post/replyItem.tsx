import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  Heart,
  MoreHorizontal,
} from "lucide-react-native";

import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";

import { useTheme } from "@/hooks/useTheme";
import getRelativeTime, {
  formatCount,
} from "@/service/helper";
import { postService } from "@/service/post.service";
import { ProfileFrame } from "../ui/ProfileFrame";

interface Props {
  reply: any;
}

export default function ReplyItem({
  reply,
}: Props) {
  const { colors } = useTheme();

  const [liked, setLiked] = useState(
    reply.isLiked ?? false
  );

  const [likes, setLikes] = useState(
    reply.likesCount ?? 0
  );

  const [loading, setLoading] =
    useState(false);

  async function toggleLike() {
    if (loading) return;

    setLoading(true);

    const previousLiked = liked;
    const previousLikes = likes;

    setLiked(!previousLiked);

    setLikes((prev:any) =>
      previousLiked ? prev - 1 : prev + 1
    );

    try {
      if (previousLiked) {
        await postService.unlikeComments(
          reply.id
        );
      } else {
        await postService.likeComment(
          reply.id
        );
      }
    } catch {
      setLiked(previousLiked);
      setLikes(previousLikes);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ProfileFrame
        frameId={reply.user.profileFrame}
        uri={reply.user.profilePictureUrl}
        size={34}
        initial={reply.user.username?.[0]?.toUpperCase()}
      />

      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View
              style={styles.nameRow}
            >
              <ThemedText
                style={styles.name}
              >
                {reply.user.firstName}{" "}
                {reply.user.lastName}
              </ThemedText>

              {reply.user.level && (
                <View
                  style={[
                    styles.level,
                    {
                      backgroundColor:
                        reply.user.level
                          .color,
                    },
                  ]}
                >
                  <ThemedText
                    style={
                      styles.levelText
                    }
                  >
                    {
                      reply.user.level
                        .emoji
                    }{" "}
                    {
                      reply.user.level
                        .title
                    }
                  </ThemedText>
                </View>
              )}
            </View>

            <ThemedText
              style={styles.time}
            >
              {getRelativeTime(
                reply.createdAt
              )}
            </ThemedText>
          </View>

          <Pressable>
            <MoreHorizontal
              size={18}
              color={colors.text}
            />
          </Pressable>
        </View>

        <ThemedText
          style={styles.text}
        >
          {reply.text}
        </ThemedText>

        <Pressable
          style={styles.likeButton}
          onPress={toggleLike}
        >
          <Heart
            size={17}
            color={
              liked
                ? "#EF4444"
                : colors.text
            }
            fill={
              liked
                ? "#EF4444"
                : "transparent"
            }
          />

          <ThemedText
            style={[
              styles.likeText,
              liked && {
                color: "#EF4444",
              },
            ]}
          >
            {formatCount(likes)}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginTop: 14,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },

  header: {
    flexDirection: "row",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  name: {
    fontWeight: "700",
    fontSize: 14,
  },

  level: {
    marginLeft: 6,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  levelText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },

  time: {
    color: "#999",
    fontSize: 11,
    marginTop: 2,
  },

  text: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },

  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  likeText: {
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 12,
  },
});