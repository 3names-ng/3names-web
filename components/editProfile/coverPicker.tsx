import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";

import { Camera } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  image: string;
  onPress: () => void;
}

export default function CoverPicker({
  image,
  onPress,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Cover Photo
      </Text>

      <View style={styles.card}>
        <Image
          source={{ uri: image }}
          style={styles.cover}
        />

        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,.45)",
            "rgba(0,0,0,.75)",
          ]}
          style={StyleSheet.absoluteFill}
        />

        <Pressable
          style={
            styles.changeButton}
            // pressed && {
            //   opacity: 0.85,
            // },}
          onPress={onPress}
        >
          <Camera
            size={20}
            color="#FFF"
          />

          <Text style={styles.buttonText}>
            Change Cover
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginBottom: 25,
  },

  title: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  card: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#27272A",
  },

  cover: {
    width: "100%",
    height: 200,
  },

  changeButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: 20,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "rgba(20,20,20,.75)",

    paddingHorizontal: 20,

    paddingVertical: 12,

    borderRadius: 999,
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 10,
  },
});