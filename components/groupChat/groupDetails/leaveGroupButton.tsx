import React from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  LogOut,
  TriangleAlert,
} from "lucide-react-native";

interface Props {
  onLeave?: () => void;
}

export default function LeaveGroupButton({
  onLeave,
}: Props) {
  function handleLeave() {
    Alert.alert(
      "Leave Community",
      "Are you sure you want to leave this community? You can join again later if it's a public community or receive another invitation for a private one.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => onLeave?.(),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Warning Card */}

      <View style={styles.warningCard}>
        <TriangleAlert
          size={20}
          color="#F59E0B"
        />

        <Text style={styles.warningText}>
          Leaving this community removes you from all future conversations,
          announcements and events until you join again.
        </Text>
      </View>

      {/* Leave Button */}

      <Pressable
        style={
            // ({ pressed }) => [
          styles.button
        //   pressed && {
        //     opacity: 0.85,
        //     transform: [{ scale: 0.98 }],
        //   },
        }
        onPress={handleLeave}
      >
        <LogOut
          size={22}
          color="#FFFFFF"
        />

        <Text style={styles.buttonText}>
          Leave Community
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    marginBottom: 120,
    paddingHorizontal: 18,
  },

  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",

    backgroundColor: "#2A1706",

    borderRadius: 18,

    padding: 16,

    borderWidth: 1,
    borderColor: "#854D0E",

    marginBottom: 18,
  },

  warningText: {
    flex: 1,

    color: "#FDE68A",

    fontSize: 14,

    lineHeight: 22,

    marginLeft: 12,
  },

  button: {
    height: 60,

    backgroundColor: "#DC2626",

    borderRadius: 18,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    shadowColor: "#DC2626",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 10,
  },

  buttonText: {
    color: "#FFFFFF",

    fontSize: 18,

    fontWeight: "700",

    marginLeft: 10,
  },
});