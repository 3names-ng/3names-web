import React from "react";
import {
  Image,
  View,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

export default function LoginIllustration() {
  return (
    <View className="items-center my-8">
      <Image
        source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946847/login2_urln7h.png"}}
        resizeMode="contain"
        style={{
          width: width * 0.7,
          height: width * 0.5,
        }}
      />
    </View>
  );
}