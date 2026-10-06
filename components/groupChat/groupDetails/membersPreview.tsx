import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  FlatList,
} from "react-native";

import {
  Users,
  Search,
  ChevronRight,
  Crown,
  ShieldCheck,
} from "lucide-react-native";

interface Member {
  id: string;
  name: string;
  role: "Owner" | "Admin" | "Member";
  avatar: string;
}

interface Props {
  members: Member[];
  onViewAll?: () => void;
  onSearch?: () => void;
  onMemberPress?: (member: Member) => void;
}

export default function MembersPreview({
  members,
  onViewAll,
  onSearch,
  onMemberPress,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Users
            size={22}
            color="#3B82F6"
          />

          <Text style={styles.title}>
            Members
          </Text>
        </View>

        <Pressable onPress={onSearch}>
          <Search
            size={20}
            color="#A1A1AA"
          />
        </Pressable>
      </View>

      {/* Members */}

      <FlatList
        scrollEnabled={false}
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.memberRow}
            onPress={() => onMemberPress?.(item)}
          >
            <View style={styles.left}>
              <View>

                <Image
                  source={{ uri: item.avatar }}
                  style={styles.avatar}
                />

                <View style={styles.online} />

              </View>

              <View style={{ marginLeft: 14 }}>

                <View style={styles.nameRow}>

                  <Text style={styles.name}>
                    {item.name}
                  </Text>

                  {item.role === "Owner" && (
                    <Crown
                      size={16}
                      color="#FACC15"
                    />
                  )}

                  {item.role === "Admin" && (
                    <ShieldCheck
                      size={16}
                      color="#3B82F6"
                    />
                  )}

                </View>

                <Text style={styles.role}>
                  {item.role}
                </Text>

              </View>
            </View>

            <ChevronRight
              size={18}
              color="#71717A"
            />
          </Pressable>
        )}
      />

      {/* View all */}

      <Pressable
        style={styles.button}
        onPress={onViewAll}
      >
        <Text style={styles.buttonText}>
          View All Members
        </Text>

        <ChevronRight
          size={18}
          color="#FFF"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    marginTop: 28,
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },

  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272A",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  online: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#18181B",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
  },

  role: {
    color: "#A1A1AA",
    marginTop: 4,
    fontSize: 13,
  },

  button: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
    marginRight: 6,
  },

});