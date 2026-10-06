import React, { useRef } from "react";
import {
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";

interface Props {
  onPress: () => void;
}

export default function FloatingCreateButton({
  onPress,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <LinearGradient
          colors={["#3B82F6", "#2563EB", "#1D4ED8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Plus
            size={30}
            color="#FFF"
            strokeWidth={2.5}
          />
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 30,
    right: 24,

    shadowColor: "#2563EB",
    shadowOpacity: 0.45,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 12,
  },

  button: {
    width: 68,
    height: 68,
    borderRadius: 34,

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
});