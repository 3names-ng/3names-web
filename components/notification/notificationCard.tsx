import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { formatDistanceToNowStrict } from "date-fns";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { NotificationUI } from "@/screens/(features)/notificationScreen";

interface Props {
  item: NotificationUI;
  onPress?: () => void;
}

// Helper to determine icon based on backend notification type string
const getIcon = (type: string) => {
  if (type.includes("gift")) {
    return <MaterialCommunityIcons name="gift" size={16} color="#fff" />;
  }
  if (type.includes("comment")) {
    return <Ionicons name="chatbubble" size={16} color="#fff" />;
  }
  if (type.includes("like")) {
    return <Ionicons name="heart" size={16} color="#fff" />;
  }
  if (type.includes("reshare") || type.includes("share")) {
    return <Ionicons name="repeat" size={16} color="#fff" />;
  }
  if (type.includes("story") || type.includes("reaction")) {
    return <Ionicons name="sparkles" size={16} color="#fff" />;
  }
  if (type.includes("level") || type.includes("leaderboard")) {
    return <Ionicons name="trophy" size={16} color="#fff" />;
  }
  if (type.includes("marketplace")) {
    return <Ionicons name="cart" size={16} color="#fff" />;
  }
  if (type.includes("hostel")) {
    return <Ionicons name="home" size={16} color="#fff" />;
  }
  if (type.includes("follower")) {
    return <Ionicons name="person-add" size={16} color="#fff" />;
  }
  if (type.includes("message")) {
    return <Ionicons name="chatbubbles" size={16} color="#fff" />;
  }
  if (type.includes("event")) {
    return <Ionicons name="calendar" size={16} color="#fff" />;
  }
  if (type.includes("question") || type.includes("past_question")) {
    return <Ionicons name="school" size={16} color="#fff" />;
  }
  if (type.includes("tagged") || type === "post_tagged") {
    return <Ionicons name="pricetag" size={16} color="#fff" />;
  }

  return <FontAwesome5 name="bell" size={14} color="#fff" />;
};

// Helper to determine theme accent color per notification type
const getColor = (type: string) => {
  if (type.includes("gift")) return "#EC4899"; // Pink
  if (type.includes("comment")) return "#3B82F6"; // Blue
  if (type.includes("like")) return "#EF4444"; // Red
  if (type.includes("reshare")) return "#10B981"; // Green
  if (type.includes("story")) return "#8B5CF6"; // Purple
  if (type.includes("level")) return "#F59E0B"; // Amber
  if (type.includes("marketplace")) return "#7C3AED"; // Violet
  if (type.includes("follower")) return "#06B6D4"; // Cyan
  if (type.includes("message")) return "#3B82F6"; // Blue
  if (type.includes("event")) return "#F97316"; // Orange
  if (type.includes("hostel")) return "#14B8A6"; // Teal
  if (type.includes("question")) return "#6366F1"; // Indigo
  if (type.includes("tagged") || type === "post_tagged") return "#F59E0B"; // Amber/Gold
  return "#64748B"; // Slate
};

// Generates dynamic card title and description based on API notification types
const getNotificationDetails = (item: NotificationUI) => {
  switch (item.type) {
    case "gift_received":
      return {
        title: "Gift Received!",
        message: "Someone sent you a gift.",
      };
    case "post_reshared":
      return {
        title: "Post Reshared",
        message: "Your post was shared with other users.",
      };
    case "post_liked":
      return {
        title: "New Like",
        message: "Someone liked your post.",
      };
    case "post_commented":
      return {
        title: "New Comment",
        message: "Someone commented on your post.",
      };
    case "comment_liked":
      return {
        title: "Comment Liked",
        message: "Someone liked your comment.",
      };
    case "comment_replied":
      return {
        title: "Reply to Comment",
        message: "Someone replied to your comment.",
      };
    case "post_tagged":
      return {
        title: "You Were Tagged",
        message: "Someone tagged you in a post.",
      };
    case "new_follower":
      return {
        title: "New Follower",
        message: "Someone started following you.",
      };
    case "story_reply":
      return {
        title: "Story Reply",
        message: "Someone replied to your story.",
      };
    case "story_reaction":
      return {
        title: "Story Reaction",
        message: "Someone reacted to your story.",
      };
    case "group_message":
      return {
        title: "New Message",
        message: "You have a new message.",
      };
    case "level_up":
      return {
        title: "Level Up! 🎉",
        message: "Congratulations! You reached a new level.",
      };
    case "marketplace_item_listed":
      return {
        title: "New Marketplace Listing",
        message: "A new item is available on the marketplace.",
      };
    case "marketplace_liked":
      return {
        title: "Marketplace Like",
        message: "Someone liked your marketplace item.",
      };
    case "hostel_liked":
      return {
        title: "Hostel Listing Liked",
        message: "Someone liked your hostel listing.",
      };
    case "hostel_listed":
      return {
        title: "New Hostel Listing",
        message: "A new hostel listing was posted.",
      };
    case "event_created":
      return {
        title: "New Event",
        message: "A new event was created.",
      };
    case "event_rsvp":
      return {
        title: "Event RSVP",
        message: "Someone RSVP'd to your event.",
      };
    case "past_question_purchased":
      return {
        title: "Purchase Confirmed",
        message: "Your past question purchase was successful.",
      };
    case "past_question_uploaded":
      return {
        title: "New Past Question",
        message: "A new past question was uploaded.",
      };
    default:
      return {
        title: "Notification",
        message: item.message || "You have a new update.",
      };
  }
};

export default function NotificationCard({ item, onPress }: Props) {
  const { colors, isDark } = useTheme();

  const { title, message: fallbackMessage } = getNotificationDetails(item);
  const message = item.message || fallbackMessage;
  const iconColor = getColor(item.type);

  const actorPicture = item.actor?.profilePictureUrl || null;
  const actorName =
    item.actor?.username ||
    `${item.actor?.firstName ?? ""} ${item.actor?.lastName ?? ""}`.trim();
  const actorInitial = actorName ? actorName[0].toUpperCase() : null;

  // Format relative timestamp (e.g. "2m ago", "3h ago")
  const relativeTime = item.createdAt
    ? `${formatDistanceToNowStrict(new Date(item.createdAt))} ago`
    : "";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        marginHorizontal: 20,
        marginBottom: 14,
      }}
    >
      <ThemedView
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderRadius: 22,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: item.read ? colors.border : "#DDD6FE",

         
        }}
      >
        {/* Left Icon / Avatar Container */}
        <View style={{ position: "relative" }}>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              justifyContent: "center",
              alignItems: "center",
             
              overflow: "hidden",
            }}
          >
            {/* The person who triggered it; system notifications (no actor)
                keep the type icon. */}
            {actorPicture ? (
              <Image
                source={{ uri: actorPicture }}
                style={{ width: 50, height: 50 }}
              />
            ) : actorInitial ? (
              <ThemedText
                style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}
              >
                {actorInitial}
              </ThemedText>
            ) : (
              getIcon(item.type)
            )}
          </View>

          {/* Type Badge */}
          <View
            style={{
              position: "absolute",
              right: -3,
              bottom: -3,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: iconColor,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: colors.card,
            }}
          >
            {getIcon(item.type)}
          </View>
        </View>

        {/* Content Section */}
        <View
          style={{
            flex: 1,
            marginLeft: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <ThemedText
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: "800",
                color: colors.text,
              }}
            >
              {title}
            </ThemedText>

            {!item.read && (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#7C3AED",
                  marginLeft: 8,
                }}
              />
            )}
          </View>

          <ThemedText
            numberOfLines={2}
            style={{
              marginTop: 4,
              fontSize: 14,
              color: colors.secondary,
              lineHeight: 20,
            }}
          >
            {message}
          </ThemedText>

          {relativeTime ? (
            <ThemedText
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#7C3AED",
                fontWeight: "700",
              }}
            >
              {relativeTime}
            </ThemedText>
          ) : null}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}