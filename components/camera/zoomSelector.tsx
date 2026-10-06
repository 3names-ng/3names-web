import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";

interface Props {
  zoom: number;
  onChange: (zoom: number) => void;
}

const ZOOMS = [
  {
    label: "0.5x",
    value: 0,
  },
  {
    label: "1x",
    value: 0.15,
  },
  {
    label: "2x",
    value: 0.35,
  },
];

export default function ZoomSelector({
  zoom,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      {ZOOMS.map((item) => {
        const selected =
          Math.abs(item.value - zoom) < 0.02;

        return (
          <TouchableOpacity
            key={item.label}
            activeOpacity={0.8}
            onPress={() => onChange(item.value)}
            style={[
              styles.button,
              selected && styles.selectedButton,
            ]}
          >
            <Text
              style={[
                styles.text,
                selected && styles.selectedText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",

    flexDirection: "row",

    backgroundColor: "rgba(0,0,0,0.45)",

    borderRadius: 28,

    paddingHorizontal: 6,
    paddingVertical: 6,

    marginBottom: 25,
  },

  button: {
    width: 56,
    height: 40,

    justifyContent: "center",
    alignItems: "center",

    borderRadius: 20,
  },

  selectedButton: {
    backgroundColor: "#FFFFFF",
  },

  text: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  selectedText: {
    color: "#7C3AED",
  },
});