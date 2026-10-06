import React from "react";
import {
  Dimensions,
  Image,
  View,
} from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

const { width } = Dimensions.get("window");

interface Props {
  title: string;
  subtitle: string;
  image?: any;
}

export default function SuccessComponent({
  title,
  subtitle,
  image = {
    uri: "https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946858/successImage2_gs9olp.png",
  },
}: Props) {
  const { colors } = useTheme();

  return (
    <View className="items-center">
      <Image
        source={image}
        resizeMode="contain"
        style={{
          width: width * 0.75,
          height: width * 0.75,
        }}
      />

      <ThemedText
        className="text-3xl font-extrabold text-center"
      >
        {title}
      </ThemedText>

      <ThemedText
        className="text-center mt-2 leading-7 px-6"
        style={{
          color: colors.muted,
          fontSize: 18,
        }}
      >
        {subtitle}
      </ThemedText>
    </View>
  );
}