import React from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
} from "react-native";

import {
  ArrowLeft,
  ShieldCheck,
  Users,
  Calendar,
  MoreVertical,
} from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

interface Group {
  id: string;
  name: string;
  verified: boolean;
  avatar: string;
  cover: string;
  description: string;
  members: number;
  online: number;
  gifts: number;
  files: number;
  messages: number;
  created: string;
}

interface Props {
  group: Group;
}

export default function GroupHero({ group }: Props) {
  const router = useRouter();

  return (
    <View>
      <ImageBackground
        source={{ uri: group.cover }}
        style={styles.cover}
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,.45)",
            "#09090B",
          ]}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}

        <View style={styles.header}>

          <Pressable
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <ArrowLeft
              color="#FFF"
              size={22}
            />
          </Pressable>

          <Pressable style={styles.iconButton}>
            <MoreVertical
              color="#FFF"
              size={22}
            />
          </Pressable>

        </View>
      </ImageBackground>

      {/* Avatar */}

      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: group.avatar }}
          style={styles.avatar}
        />
      </View>

      {/* Content */}

      <View style={styles.content}>

        <View style={styles.nameRow}>

          <Text style={styles.name}>
            {group.name}
          </Text>

          {group.verified && (
            <ShieldCheck
              size={20}
              color="#3B82F6"
              fill="#3B82F6"
            />
          )}

        </View>

        <View style={styles.infoRow}>

          <Users
            size={15}
            color="#A1A1AA"
          />

          <Text style={styles.info}>
            {group.members} Members
          </Text>

          <View style={styles.onlineDot} />

          <Text style={styles.online}>
            {group.online} Online
          </Text>

        </View>

        <View style={styles.infoRow}>

          <Calendar
            size={15}
            color="#A1A1AA"
          />

          <Text style={styles.info}>
            Created {group.created}
          </Text>

        </View>

        <Text style={styles.description}>
          {group.description}
        </Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  cover: {
    height: 240,
    justifyContent: "space-between",
  },

  header: {
    marginTop: 55,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,.35)",
  },

  avatarContainer: {
    alignSelf: "center",
    marginTop: -52,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#09090B",
  },

  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 16,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  name: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "700",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  info: {
    color: "#A1A1AA",
    marginLeft: 6,
    fontSize: 14,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginHorizontal: 10,
  },

  online: {
    color: "#22C55E",
    fontWeight: "600",
    fontSize: 14,
  },

  description: {
    color: "#D4D4D8",
    textAlign: "center",
    marginTop: 18,
    lineHeight: 22,
    fontSize: 15,
  },

});