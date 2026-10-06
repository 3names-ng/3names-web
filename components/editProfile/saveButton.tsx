import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Save } from "lucide-react-native";

interface Props {
  title?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => Promise<void> | void;
}

export default function SaveButton({
  title = "Save Changes",
  loading = false,
  disabled = false,
  onPress,
}: Props) {
  const [pressed, setPressed] = useState(false);

  const handlePress = async () => {
    if (loading || disabled) return;

    await onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.container,
        pressed && styles.pressed,
        (loading || disabled) && styles.disabled,
      ]}
    >
      <LinearGradient
        colors={["#FE2C55", "#A855F7", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color="#FFF"
          />
        ) : (
          <>
            <Save
              color="#FFF"
              size={20}
            />

            <Text style={styles.title}>
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 58,

    marginHorizontal: 18,

    marginBottom: 30,

    borderRadius: 18,

    overflow: "hidden",

    elevation: 6,

    shadowColor: "#FE2C55",

    shadowOpacity: 0.35,

    shadowRadius: 14,

    shadowOffset: {
      width: 0,
      height: 8,
    },
  },

  pressed: {
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  disabled: {
    opacity: 0.6,
  },

  gradient: {
    flex: 1,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",
  },

  title: {
    color: "#FFF",

    fontSize: 17,

    fontWeight: "700",

    marginLeft: 10,
  },
});