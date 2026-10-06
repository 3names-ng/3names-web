import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import {
  Users,
  MessageCircle,
  Gift,
  FolderOpen,
} from "lucide-react-native";

interface Group {
  members: number;
  messages: number;
  gifts: number;
  files: number;
}

interface Props {
  group: Group;
}

export default function GroupStats({
  group,
}: Props) {
  return (
    <View style={styles.container}>

      <StatCard
        icon={
          <Users
            size={24}
            color="#3B82F6"
          />
        }
        title="Members"
        value={0}
      />

      <StatCard
        icon={
          <MessageCircle
            size={24}
            color="#10B981"
          />
        }
        title="Messages"
        value={0}
      />

   

      <StatCard
        icon={
          <FolderOpen
            size={24}
            color="#A855F7"
          />
        }
        title="Files"
        value={group.files}
      />

    </View>
  );
}

interface CardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
}

function StatCard({
  icon,
  title,
  value,
}: CardProps) {
  return (
    <View style={styles.card}>

      <View style={styles.iconContainer}>
        {icon}
      </View>

      <Text style={styles.value}>
        {value}
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>

    </View>
  );
}

function formatNumber(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toString();
}

const styles = StyleSheet.create({

  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginTop: 28,
  },

  card: {
    width: "48%",
    backgroundColor: "#18181B",
    borderRadius: 20,
    paddingVertical: 22,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#27272A",
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#27272A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  value: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },

  title: {
    color: "#A1A1AA",
    fontSize: 14,
    marginTop: 6,
  },

});