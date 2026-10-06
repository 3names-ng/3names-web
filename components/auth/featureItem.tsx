import React from "react";
import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface FeatureItemProps {
  title: string;
}

export default function FeatureItem({
  title,
}: FeatureItemProps) {

   const { colors } = useTheme();
  
  return (
    <View className="flex-row items-center py-3">
      {/* Check Icon */}

      <View
      style={{backgroundColor:"#7F48EF"}}
       className="w-7 h-7 rounded-full items-center justify-center">
        <Ionicons
          name="checkmark"
          size={16}
          color="#EAE6FA"
        />
      </View>

      {/* Text */}

      <ThemedText
        className="ml-4 flex-1 text-[15px] font-semibold"
      style={{color:colors.muted}}
      >
        {title}
      </ThemedText>
    </View>
  );
}