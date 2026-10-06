import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";

export default function CameraHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 10,
        },
      ]}
    >
      {/* Close */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.back()}
        style={styles.iconButton}
      >
        <Ionicons
          name="close"
          size={28}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* Right Icons */}
      {/* <View style={styles.right}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons
            name="image-multiple-outline"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconButton}
        >
          <Ionicons
            name="settings-outline"
            size={23}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    width: "100%",
    paddingHorizontal: 20,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,.45)",

    justifyContent: "center",
    alignItems: "center",

    marginLeft: 12,
  },
});