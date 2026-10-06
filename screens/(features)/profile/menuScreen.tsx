import React from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColorScheme } from "nativewind";

import {
  ACCOUNT_ITEMS,
  ACTIVITY_ITEMS,
  SETTINGS_ITEMS,
  ProfileMenuItemProps,
} from "@/data/menu";
import LogoutButton from "@/components/logoutButton";
import AuthHeader from "@/components/auth/authHeader";
import { ThemedView } from "@/components/ui/ThemedView";
import MenuSection from "@/components/profile/menuection";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

export default function MenuScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
const {colors} = useTheme()
const { t } = useTranslation()
  const toggleTheme = () => {
    setColorScheme(colorScheme === "dark" ? "light" : "dark");
  };

  // Helper function to handle item presses reliably
  const handleItemPress = (item: ProfileMenuItemProps) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.route && item.route !== "#") {
      router.push(item.route as any);
    }
  };

  // Attach navigation & actions to items, and translate titles/subtitles
  const prepareItems = (items: ProfileMenuItemProps[]) =>
    items.map((item) => {
      const translatedItem = {
        ...item,
        title: t(item.title as any),
        subtitle: item.subtitle ? t(item.subtitle as any) : undefined,
      };
      if (item.title === "settings.appearance") {
        return {
          ...translatedItem,
          value: colorScheme === "dark" ? t("settings.dark") : t("settings.light"),
          onPress: toggleTheme,
        };
      }
      return {
        ...translatedItem,
        onPress: () => handleItemPress(item),
      };
    });

  return (
    <ThemedView className="flex-1"style={{backgroundColor:colors.background}}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="default" />

        {/* Header Container with Integrated Theme Toggle Button */}
        <View className="flex-row items-center justify-between pr-5">
          <View className="flex-1">
            <AuthHeader
              onBackPress={() => router.back()}
              title={t("profile.title")}
              subtitle={t("profile.manageAccount")}
            />
          </View>

          {/* Quick Toggle Theme Button */}
          {/* <Pressable onPress={toggleTheme} className="p-2">
            <Ionicons
              name={colorScheme === "dark" ? "sunny" : "moon"}
              size={22}
              color="#7C3AED"
            />
          </Pressable> */}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <MenuSection title={t("profile.account")} items={prepareItems(ACCOUNT_ITEMS)} />
          <MenuSection title={t("profile.activity")} items={prepareItems(ACTIVITY_ITEMS)} />
          <MenuSection title={t("settings.title")} items={prepareItems(SETTINGS_ITEMS)} />

          <View style={styles.logoutWrapper}>
            <LogoutButton />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  logoutWrapper: {
    // paddingHorizontal: 20,
    marginTop: 5,
  },
});