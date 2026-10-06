import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

export const TABS = ["For You", "Following", "Campus"] as const;
export type TabName = (typeof TABS)[number];

/** Map internal tab keys to translation keys */
const TAB_LABELS: Record<TabName, string> = {
  "For You": "explore.forYou",
  "Following": "tab.following",
  "Campus": "explore.trending",
};

interface FeedTabsProps {
  activeTab: TabName;
  onSelectTab: (tab: TabName) => void;
  onPressFilter?: () => void;
  isSticky?: boolean;
}

export default function FeedTabs({
  activeTab,
  onSelectTab,
  onPressFilter,
  isSticky = false,
}: FeedTabsProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      className={`z-10 flex-row items-center w-full px-2 py-2 ${
        isSticky ? "justify-center" : "justify-start"
      }`}
      style={[
        { backgroundColor: "transparent" },
        isSticky && { paddingTop: insets.top + 4, marginTop: 0 },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: isSticky ? "center" : "flex-start",
          alignItems: "center",
        }}
        className="w-full"
      >
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab;
          const isLast = index === TABS.length - 1;

          // Compute contrast-safe text color
          const getTextColor = () => {
            if (isSticky) {
              return isActive ? colors.white : "rgba(255, 255, 255, 0.7)";
            }
            return isActive ? colors.muted : colors.muted;
          };

          return (
            <Pressable
              key={tab}
              onPress={() => onSelectTab(tab)}
              className={isLast ? "" : "mr-2"}
            >
              <View
                style={[
                  {
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  },
                  isActive && {
                    borderBottomWidth: 3,
                    borderBottomColor: colors.primary,
                  },
                ]}
              >
                <ThemedText
                  className={`text-lg ${
                    isSticky ? "text-center" : "text-left"
                  }`}
                  style={{
                    color: getTextColor(),
                    fontWeight: isActive ? "900" : "800",
                    // textShadowColor: isSticky ? "transparent" : "rgba(0,0,0,0.55)",
                    // textShadowOffset: isSticky ? { width: 0, height: 0 } : { width: 0, height: 1 },
                    // textShadowRadius: isSticky ? 0 : 3,
                  }}
                >
                  {t(TAB_LABELS[tab] as any)}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}