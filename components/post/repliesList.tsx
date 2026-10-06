import React, { useState, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

import { ThemedText } from "../ui/ThemedText";
import { Skeleton, SkeletonCircle, SkeletonGroup } from "../ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import ReplyItem from "./replyItem";
import { postService } from "@/service/post.service";

interface Props {
  commentId: string;
  initialReplies?: any[];
  repliesCount?: number;
}

export default function RepliesList({
  commentId,
  initialReplies = [],
  repliesCount = 0,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState(initialReplies);
  const { t } = useTranslation();

  // Sync state if new replies are appended directly via local creation callbacks
  useEffect(() => {
    if (initialReplies.length > replies.length) {
      setReplies(initialReplies);
      setExpanded(true);
    }
  }, [initialReplies]);

  async function loadReplies() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (replies.length === 0) {
      try {
        setLoading(true);
        const res = await postService.getReplies(commentId);
        setReplies(res.data.items || []);

        console.log("reply", res)
      } catch (err) {
        console.error("Error fetching replies:", err);
      } finally {
        setLoading(false);
      }
    }

    setExpanded(true);
  }

  if (repliesCount === 0) return null;

  return (
    <View style={styles.container}>
      {/* Interactive Toggle with Dropdown Indicator */}
      <Pressable 
        onPress={loadReplies} 
        style={styles.toggleRow}
        hitSlop={8}
      >
        <ThemedText style={styles.viewReplies}>
          {expanded
            ? t("post.hideReplies")
            : repliesCount === 1
              ? t("post.viewReply", { count: repliesCount })
              : t("post.viewReplies", { count: repliesCount })}
        </ThemedText>
        
        {expanded ? (
          <ChevronUp size={16} color="#7C3AED" style={styles.chevron} />
        ) : (
          <ChevronDown size={16} color="#7C3AED" style={styles.chevron} />
        )}
      </Pressable>

      {loading && (
        <SkeletonGroup label="Loading replies" style={styles.listWrapper}>
          {Array.from({ length: Math.min(repliesCount, 2) }).map((_, i) => (
            <View key={i} style={styles.replySkeleton}>
              <SkeletonCircle size={34} />
              <View style={styles.replySkeletonText}>
                <Skeleton width="40%" height={12} radius={6} />
                <Skeleton width="85%" height={12} radius={6} />
              </View>
            </View>
          ))}
        </SkeletonGroup>
      )}

      {expanded && !loading && (
        <View style={styles.listWrapper}>
          {replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginLeft: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#E5E7EB",
    paddingLeft: 14,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  viewReplies: {
    color: "#7C3AED",
    fontWeight: "700",
    fontSize: 13,
  },
  chevron: {
    marginLeft: 4,
  },
  listWrapper: {
    marginTop: 6,
  },
  replySkeleton: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  replySkeletonText: {
    flex: 1,
    marginLeft: 10,
    gap: 6,
  },
});