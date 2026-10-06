import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";

import {
  Bell,
  BellOff,
  Star,
  Share2,
  UserPlus,
  Flag,
  Pencil,
  Shield,
  ChevronRight,
//   ChevronRight,
} from "lucide-react-native";

interface Props {
  isAdmin?: boolean;
  notificationsEnabled?: boolean;

  onNotifications?: () => void;
  onFavorite?: () => void;
  onInvite?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  onEditGroup?: () => void;
  onManageGroup?: () => void;
}

export default function SettingsSection({
  isAdmin = false,
  notificationsEnabled = true,
  onNotifications,
  onFavorite,
  onInvite,
  onShare,
  onReport,
  onEditGroup,
  onManageGroup,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Group Settings
      </Text>

      
      <SettingItem
        icon={
          <UserPlus
            size={22}
            color="#22C55E"
          />
        }
        title="Invite Members"
        subtitle="Share an invitation link"
        onPress={onInvite}
      />


      <SettingItem
        icon={
          notificationsEnabled ? (
            <Bell
              size={22}
              color="#3B82F6"
            />
          ) : (
            <BellOff
              size={22}
              color="#3B82F6"
            />
          )
        }
        title="Notifications"
        subtitle={
          notificationsEnabled
            ? "Notifications are enabled"
            : "Notifications are muted"
        }
        onPress={onNotifications}
      />

      <SettingItem
        icon={
          <Star
            size={22}
            color="#FACC15"
          />
        }
        title="Favorite Group"
        subtitle="Pin this community to the top"
        onPress={onFavorite}
      />

      <SettingItem
        icon={
          <Share2
            size={22}
            color="#8B5CF6"
          />
        }
        title="Share Community"
        subtitle="Send this group to friends"
        onPress={onShare}
      />

      <SettingItem
        icon={
          <Flag
            size={22}
            color="#EF4444"
          />
        }
        title="Report Community"
        subtitle="Report inappropriate content"
        onPress={onReport}
      />

      {isAdmin && (
        <>
          <View style={styles.separator} />

          <Text style={styles.adminTitle}>
            Admin Tools
          </Text>

          <SettingItem
            icon={
              <Pencil
                size={22}
                color="#38BDF8"
              />
            }
            title="Edit Community"
            subtitle="Update name, bio and cover"
            onPress={onEditGroup}
          />

          <SettingItem
            icon={
              <Shield
                size={22}
                color="#10B981"
              />
            }
            title="Manage Members"
            subtitle="Promote, remove and approve members"
            onPress={onManageGroup}
          />
        </>
      )}
    </View>
  );
}

interface ItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
}: ItemProps) {
  return (
    <Pressable
      style={
        // ({ pressed }) => [
        styles.item
       
      }
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
    marginTop: 32,
    paddingHorizontal: 18,
  },

  sectionTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: "#18181B",

    borderRadius: 18,
    padding: 16,
    marginBottom: 14,

    borderWidth: 1,
    borderColor: "#27272A",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#27272A",

    marginRight: 14,
  },

  title: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  subtitle: {
    color: "#A1A1AA",
    fontSize: 13,
    marginTop: 4,
  },

  separator: {
    height: 1,
    backgroundColor: "#27272A",
    marginVertical: 20,
  },

  adminTitle: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 16,
  },
});