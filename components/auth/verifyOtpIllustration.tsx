import React from "react";
import {
  Dimensions,
  Image,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function VerifyOtpIllustration() {
  return (
    <View className="items-center my-8">
      <Image
        source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946849/welcome_h0lj9f.png"}}
        resizeMode="contain"
        style={{
          width: width * 0.65,
          height: width * 0.65,
        }}
      />
    </View>
  );
}