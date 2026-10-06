import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";

import {
  Megaphone,
  Image,
  Folder,
  Pin,
  CalendarDays,
  UserPlus,
  ChevronRight,
} from "lucide-react-native";

interface Props {
  onAnnouncements?: () => void;
  onMedia?: () => void;
  onFiles?: () => void;
  onPinned?: () => void;
  onEvents?: () => void;
  onInvite?: () => void;
}

export default function QuickActions({
  onAnnouncements,
  onMedia,
  onFiles,
  onPinned,
  onEvents,
  onInvite,
}: Props) {
  return (
    <View style={styles.container}>

      <Text style={styles.sectionTitle}>
        Quick Actions
      </Text>

      <ActionItem
        title="Announcements"
        subtitle="Latest updates from admins"
        color="#3B82F6"
        icon={
          <Megaphone
            size={22}
            color="#3B82F6"
          />
        }
        onPress={onAnnouncements}
      />

      <ActionItem
        title="Shared Media"
        subtitle="Photos and videos"
        color="#EC4899"
        icon={
          <Image
            size={22}
            color="#EC4899"
          />
        }
        onPress={onMedia}
      />

      <ActionItem
        title="Files"
        subtitle="Lecture notes & documents"
        color="#10B981"
        icon={
          <Folder
            size={22}
            color="#10B981"
          />
        }
        onPress={onFiles}
      />

      <ActionItem
        title="Pinned Messages"
        subtitle="Important conversations"
        color="#F59E0B"
        icon={
          <Pin
            size={22}
            color="#F59E0B"
          />
        }
        onPress={onPinned}
      />

      <ActionItem
        title="Events"
        subtitle="Upcoming activities"
        color="#8B5CF6"
        icon={
          <CalendarDays
            size={22}
            color="#8B5CF6"
          />
        }
        onPress={onEvents}
      />

      <ActionItem
        title="Invite Members"
        subtitle="Share community invite"
        color="#06B6D4"
        icon={
          <UserPlus
            size={22}
            color="#06B6D4"
          />
        }
        onPress={onInvite}
      />

    </View>
  );
}

interface ItemProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  onPress?: () => void;
}

function ActionItem({
  title,
  subtitle,
  icon,
  onPress,
}: ItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        pressed && { opacity: 0.75 },
      ]}
      onPress={onPress}
    >
      <View style={styles.left}>

        <View style={styles.iconBox}>
          {icon}
        </View>

        <View style={{ flex: 1 }}>

          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.subtitle}>
            {subtitle}
          </Text>

        </View>

      </View>

      <ChevronRight
        size={20}
        color="#71717A"
      />

    </Pressable>
  );
}

const styles = StyleSheet.create({

  container: {
    marginTop: 18,
    paddingHorizontal: 18,
  },

  sectionTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },

  item: {
    backgroundColor: "#18181B",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#27272A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#27272A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  title: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  subtitle: {
    color: "#A1A1AA",
    marginTop: 4,
    fontSize: 13,
  },

});