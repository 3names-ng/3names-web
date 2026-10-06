import React, { useEffect, useRef, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "./ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { ProfileFrame } from "@/components/ui/ProfileFrame";

interface HeaderProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
  showSearch?: boolean;
  onSearch?: (text: string) => void;
  notificationCount?: number;
  onNotificationPress?: () => void;
  showProfile?: boolean;
  showBrandTitle?: boolean;
  feedTabs?: React.ReactNode;
  transparent?: boolean;
}

export default function Header({
  showBackButton = false,
  onBackPress,
  showSearch = false,
  onSearch,
  notificationCount: propNotificationCount,
  onNotificationPress,
  showProfile = true,
  showBrandTitle = true,
  feedTabs,
  transparent = false,
}: HeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const storeNotificationCount = useNotificationStore(
    (state) => state.unreadNotificationCount
  );

  const activeNotificationCount =
    propNotificationCount !== undefined ? propNotificationCount : storeNotificationCount;

  const searchRef = useRef<TextInput>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus();
    }
  }, [searchOpen]);

  const handleSearch = () => {
    onSearch?.(search);
    searchRef.current?.blur();
  };

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      className="flex-row items-center justify-between px-4 pb-3"
      style={{
        position: "relative",
        zIndex: 50,
        paddingTop: transparent ? insets.top : 0,
        backgroundColor: transparent ? "transparent" : colors.background,
        borderBottomWidth: transparent ? 0 : 1,
        borderBottomColor: transparent ? "transparent" : colors.border,
        paddingBottom: transparent ? 0 : 10,
      }}
    >
      {searchOpen ? (
        <ThemedView className="mr-4 flex-1 flex-row items-center rounded-xl px-3 bg-transparent">
          <Feather name="search" size={20} color={colors.text} />

          <TextInput
            ref={searchRef}
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            className="ml-2 flex-1"
            style={{
              color: colors.text,
            }}
          />
        </ThemedView>
      ) : (
        <View className="flex-1 flex-row items-center gap-3 bg-transparent">
          {showBackButton && (
            <TouchableOpacity
              onPress={handleBack}
              className="h-10 w-10 items-center justify-center rounded-full border"
              style={{ borderColor: colors.border }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
          )}

          {/* Optional Profile Display */}
          {showProfile && !showBackButton && (
            <TouchableOpacity onPress={() => router.push("/profile")}>
              <ProfileFrame
                frameId={user?.profileFrame}
                uri={user?.profilePictureUrl}
                size={40}
                initial={(
                  user?.firstName?.[0] ||
                  user?.lastName?.[0] ||
                  user?.username?.[0] ||
                  ""
                )?.toUpperCase()}
                fallbackColor={colors.primary}
              />
            </TouchableOpacity>
          )}

          {/* Optional Brand Title Display */}
          {showBrandTitle && (
            <ThemedText
              className="text-2xl font-bold"
              style={{ color: colors.primary, fontFamily: "Montserrat" }}
            >
              3NAMES
            </ThemedText>
          )}

          {/* Custom Feed Tabs Slot */}
          {feedTabs && <View className="flex-1 bg-transparent">{feedTabs}</View>}
        </View>
      )}

      {/* Right Section Actions */}
      <View className="flex-row items-center gap-4 mr-3">
        <TouchableOpacity onPress={() => router.push("/(features)/searchScreen")}>
          <Feather
            name="search"
            size={24}
            color={transparent ? "#FFFFFF" : colors.text}
            style={
              transparent
                ? {
                    textShadowColor: "rgba(0,0,0,0.55)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }
                : undefined
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}