import { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useNotificationStore } from "@/store/notificationStore";

type CustomHeaderProps = {
  title: string;
  subtitle: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  notificationCount?: number;
  rightElement?: ReactNode;
};

export default function AuthHeader({
  title,
  subtitle,
  onBackPress,
  showBackButton = true,
  showNotification = false,
  onNotificationPress,
  notificationCount: propNotificationCount,
  rightElement,
}: CustomHeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const storeNotificationCount = useNotificationStore(
    (state) => state.unreadNotificationCount
  );

  const activeNotificationCount =
    propNotificationCount !== undefined
      ? propNotificationCount
      : storeNotificationCount;

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push("/(features)/notificationScreen");
    }
  };

  return (
    <View
      className="pb-4 mb-2 flex-row items-center justify-between px-4"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View className="flex-1 flex-row items-center gap-3">
        {showBackButton && (
          <Pressable
            onPress={handleBack}
            className="h-10 w-10 items-center justify-center rounded-full border"
            style={{ borderColor: colors.border }}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={colors.text}
            />
          </Pressable>
        )}

        <View className="flex-1">
          <ThemedText className="text-2xl font-bold">
            {title}
          </ThemedText>

          {Boolean(subtitle) && (
            <ThemedText
              className="mt-0.5 text-sm"
              style={{ color: colors.secondary }}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Right Custom Element OR Optional Notification Bell */}
      {rightElement ? (
        rightElement
      ) : (
        showNotification && (
          <Pressable
            onPress={handleNotificationPress}
            className="relative p-2 ml-2"
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.primary || "#7C3AED"}
            />

            {activeNotificationCount > 0 && (
              <View
                className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1"
                style={{ backgroundColor: "#EF4444" }}
              >
                <ThemedText
                  style={{
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {activeNotificationCount > 99
                    ? "99+"
                    : activeNotificationCount}
                </ThemedText>
              </View>
            )}
          </Pressable>
        )
      )}
    </View>
  );
}