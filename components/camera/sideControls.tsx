import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface Props {
  flash: "on" | "off";
  timer: number;
  grid: boolean;
  filterActive?: boolean; // Track if a photo filter is currently active
  onFlash: () => void;
  onTimer: () => void;
  onGrid: () => void;
  onFilter: () => void; // Added callback to toggle or open filters
  onHDR?: () => void;
  onAspectRatio?: () => void;
}

export default function SideControls({
  flash,
  timer,
  grid,
  filterActive = false,
  onFlash,
  onTimer,
  onGrid,
  onFilter,
  onHDR,
  onAspectRatio,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Flash */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.button}
        onPress={onFlash}
      >
        <Ionicons
          name={flash === "on" ? "flash" : "flash-off"}
          size={24}
          color="#FFF"
        />
      </TouchableOpacity>

      {/* Timer */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.button}
        onPress={onTimer}
      >
        <MaterialCommunityIcons
          name="timer-outline"
          size={24}
          color="#FFF"
        />

        {timer > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{timer}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Grid */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.button,
          grid && styles.activeButton,
        ]}
        onPress={onGrid}
      >
        <MaterialCommunityIcons
          name="grid"
          size={24}
          color="#FFF"
        />
      </TouchableOpacity>

      {/* Filters */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.button,
          filterActive && styles.activeButton,
        ]}
        onPress={onFilter}
      >
        <MaterialCommunityIcons
          name="auto-fix"
          size={24}
          color="#FFF"
        />
      </TouchableOpacity>

      {/* HDR */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.button}
        onPress={onHDR}
      >
        <Text style={styles.hdr}>HDR</Text>
      </TouchableOpacity>

      {/* Aspect Ratio */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.button}
        onPress={onAspectRatio}
      >
        <MaterialCommunityIcons
          name="aspect-ratio"
          size={24}
          color="#FFF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 18,
    top: 140,
    alignItems: "center",
  },

  button: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(0,0,0,0.45)",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 18,
  },

  activeButton: {
    backgroundColor: "#7C3AED",
  },

  badge: {
    position: "absolute",
    top: 5,
    right: 5,

    minWidth: 18,
    height: 18,
    borderRadius: 9,

    backgroundColor: "#EF4444",

    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },

  hdr: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
});