import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MessageCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  onPress?: () => void;
}

export default function ContinueChatButton({
  onPress,
}: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.shadow}
        onPress={onPress}
      >
        <LinearGradient
          colors={[
            "#2563EB",
            "#3B82F6",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <MessageCircle
            color="#FFF"
            size={22}
          />

          <Text style={styles.text}>
            Continue Chat
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 28,
  },

  shadow: {
    borderRadius: 18,

    shadowColor: "#2563EB",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 12,
  },

  button: {
    height: 60,
    borderRadius: 18,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },
});