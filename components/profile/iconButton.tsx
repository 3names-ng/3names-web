import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

interface Props {
  icon: React.ReactNode;
  badge?: number;
  onPress?: () => void;
}

export default function IconButton({
  icon,
  badge,
  onPress,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {icon}

      {!!badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badge > 99 ? "99+" : badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#17171F",
    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#24242D",
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },

  badge: {
    position: "absolute",
    top: 2,
    right: 2,

    minWidth: 22,
    height: 22,
    borderRadius: 11,

    backgroundColor: "#FE2C55",

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 5,

    borderWidth: 2,
    borderColor: "#09090B",
  },

  badgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
});