import React, { useCallback, useEffect, useState } from "react";
import { DeviceEventEmitter, View } from "react-native";

import { useDelayedLoading } from "@/components/ui/skeleton";
import ContributorCard from "./contributorCard";
import { ContributorListSkeleton } from "./pastQuestionSkeleton";
import { pastQuestionsService } from "@/service/pastQuestions.service";
import { userService } from "@/service/profile.Service";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "../ui/ThemedText";

interface Contributor {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePictureUrl: string;
  profileFrame?: string | null;
  departmentId: string;
  uploads: number;
  levelNumber?: number | null;
  badge?: string | null;
  emoji?: string | null;
  color?: string | null;
  levelTitle?: string | null;
  isFollowing?: boolean;
}

export default function ContributorList() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDelayedLoading(loading);
  const { colors } = useTheme();

  // Optimistic follow state per contributor
  const [followState, setFollowState] = useState<Record<string, boolean>>({});

  const handleFollow = useCallback(async (targetUserId: string, currentlyFollowing: boolean) => {
    const nextState = !currentlyFollowing;
    // Optimistic update
    setFollowState((prev) => ({ ...prev, [targetUserId]: nextState }));
    DeviceEventEmitter.emit("USER_FOLLOW_TOGGLED", { userId: targetUserId, isFollowing: nextState });
    try {
      if (currentlyFollowing) {
        await userService.unfollowUser(targetUserId);
      } else {
        await userService.followUser(targetUserId);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      // Rollback
      setFollowState((prev) => ({ ...prev, [targetUserId]: currentlyFollowing }));
      DeviceEventEmitter.emit("USER_FOLLOW_TOGGLED", { userId: targetUserId, isFollowing: currentlyFollowing });
    }
  }, []);

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        setLoading(true);
        const data = await pastQuestionsService.getTopContributors();
        setContributors(data || []);
      } catch (err) {
        console.error("Failed to fetch top contributors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContributors();
  }, []);

  if (loading) {
    return showSkeleton ? <ContributorListSkeleton /> : null;
  }

  if (contributors.length === 0) {
    return (
      <View style={{ paddingVertical: 16, alignItems: "center" }}>
        <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
          No contributors yet in your department
        </ThemedText>
      </View>
    );
  }

  return (
    <View>
      {contributors.map((item, index) => {
        const displayName = item.username || "Anonymous";

        const appLevel = item.levelNumber
          ? { level: item.levelNumber, badge: item.badge, emoji: item.emoji, color: item.color, title: item.levelTitle }
          : null;

        const isFollowing = followState[item.userId] ?? item.isFollowing ?? false;

        return (
          <ContributorCard
            key={item.userId}
            rank={index + 1}
            name={displayName}
            avatar={item.profilePictureUrl || "https://i.pravatar.cc/150"}
            profileFrame={item.profileFrame}
            appLevel={appLevel}
            uploads={item.uploads}
            isFollowing={isFollowing}
            onFollow={() => handleFollow(item.userId, isFollowing)}
          />
        );
      })}
    </View>
  );
}