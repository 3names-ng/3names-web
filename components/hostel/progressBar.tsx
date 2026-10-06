import React from "react";
import { View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

interface Props {
  progress: number;
}

export default function ProgressBar({ progress }: Props) {
  const { colors } = useTheme();

  return (
    <View className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <View
        style={{
          width: `${Math.min(Math.max(progress * 100, 0), 100)}%`,
          backgroundColor: colors.primary,
          height: "100%",
        }}
      />
    </View>
  );
}
