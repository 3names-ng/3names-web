import React from "react";
import { Image, View } from "react-native";

interface Props {
  image?: any;
}

export default function AuthIllustration({
  image = require("@/assets/images/welcome.png"),
}: Props) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        
        
      }}
    >
      <Image
        source={image}
        resizeMode="contain"
        style={{
          width: "100%",
          height: 300,
        }}
      />
    </View>
  );
}