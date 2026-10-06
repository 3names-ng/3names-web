import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface BannerCardProps {
  onPress?: () => void;
}

const BannerCard: React.FC<BannerCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={["#6F3FF5", "#4C1DCC", "#3715A7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Left Content */}
        <View style={styles.left}>
          <Text style={styles.title}>
            Your ideas, your notes,{"\n"}
            your success.
          </Text>

          <Text style={styles.subtitle}>
            Keep track of important things{"\n"}
            that matter.
          </Text>
        </View>

        {/* Right Illustration */}
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/3075/3075908.png",
          }}
          resizeMode="contain"
          style={styles.image}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default BannerCard;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginTop: 12,
  },

  container: {
    height: 190,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    overflow: "hidden",

    shadowColor: "#5B2CE8",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 18,

    elevation: 8,
  },

  left: {
    flex: 1,
    paddingRight: 10,
  },

  title: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 46,
  },

  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 20,
    lineHeight: 30,
    marginTop: 20,
    fontWeight: "400",
  },

  image: {
    width: 150,
    height: 150,
    marginLeft: 12,
  },
});