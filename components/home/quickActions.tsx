import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { ComponentProps, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  Modal,
  PanResponder,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { usePerks } from "@/hooks/usePerks";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";

type IonIconName = ComponentProps<typeof Ionicons>["name"];

// One entry per action: label (translation key, shown via t()), icon image,
// color and route. Entries without an image fall back to their Ionicons icon.
// To remove or reorder an action, just remove/move its whole entry.
const QUICK_ACTIONS: {
  key: string;
  icon: IonIconName;
  image?: ImageSourcePropType;
  color: string;
  route: string;
}[] = [
  {
    key: "quickactions.leaderboard",
    icon: "trophy",
    image: require("../../assets/quickActionIcon/trophy.png"),
    color: "#F1C40F",
    route: "/(features)/leaderboaderScreen",
  },
  {
    key: "quickactions.marketplace",
    icon: "storefront",
    image: require("../../assets/quickActionIcon/storefront.png"),
    color: "#F44336",
    route: "/(features)/marketplace",
  },
  {
    key: "quickactions.hostels",
    icon: "bed",
    image: require("../../assets/quickActionIcon/bed.png"),
    color: "#6C3EF4",
    route: "/(features)/hostel",
  },
  {
    key: "quickactions.events",
    icon: "calendar",
    image: require("../../assets/quickActionIcon/calendar.png"),
    color: "#2196F3",
    route: "/(features)/events",
  },
  {
    key: "quickactions.groups",
    icon: "people",
    image: require("../../assets/quickActionIcon/people.png"),
    color: "#4CAF50",
    route: "/(features)/groupChatScreen",
  },
  {
    key: "quickactions.elections",
    icon: "checkbox",
    image: require("../../assets/quickActionIcon/vote.png"),
    color: "#16A34A",
    route: "/(features)/elections",
  },
  // {
  //   key: "quickactions.achievement",
  //   icon: "shield-checkmark",
  //   image: require("../../assets/quickActionIcon/shield-checkmark.png"),
  //   color: "#F39C12",
  //   route: "/(features)/levelsScreen",
  // },
  {
    key: "quickactions.jobs",
    icon: "briefcase",
    image: require("../../assets/quickActionIcon/briefcase.png"),
    color: "#3F51B5",
    route: "/(features)/jobsScreen",
  },
  {
    key: "quickactions.notes",
    icon: "document-text",
    image: require("../../assets/quickActionIcon/document-text.png"),
    color: "#9C27B0",
    route: "/(features)/notes",
  },
  {
    key: "quickactions.games",
    icon: "game-controller",
    image: require("../../assets/quickActionIcon/game-controller.png"),
    color: "#E91E63",
    route: "/(features)/games",
  },
  {
    key: "quickactions.aiTutor",
    icon: "sparkles",
    image: require("../../assets/quickActionIcon/sparkles.png"),
    color: "#7C4DFF",
    route: "/(features)/aIAssistantScreen",
  },
];

// No longer gating navigation to Events/Groups — only creation is gated inside those screens
const PERK_MAP: Record<string, { perk: string; level: string } | null> = {};

interface QuickActionsProps {
  isFloating?: boolean;
}

const FAB_SIZE = 56;
const FAB_MARGIN = 24;
// Movement below this (in px) is treated as a tap, not a drag.
const TAP_SLOP = 6;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function QuickActions({
  isFloating = false,
}: QuickActionsProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const { hasPerk } = usePerks();
  const { t } = useTranslation();

  // --- Draggable floating button state ---
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const initialPosition = useRef({
    x: screenWidth - FAB_SIZE - FAB_MARGIN,
    y: screenHeight - FAB_SIZE - FAB_MARGIN,
  }).current;
  const dragPos = useRef(
    new Animated.ValueXY({ x: initialPosition.x, y: initialPosition.y }),
  ).current;
  const currentPos = useRef({ ...initialPosition });
  const dragStart = useRef({ ...initialPosition });
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > TAP_SLOP || Math.abs(gesture.dy) > TAP_SLOP,
        onPanResponderGrant: () => {
          dragStart.current = { ...currentPos.current };
          setIsDragging(true);
        },
        onPanResponderMove: (_, gesture) => {
          const next = {
            x: clamp(
              dragStart.current.x + gesture.dx,
              0,
              screenWidth - FAB_SIZE,
            ),
            y: clamp(
              dragStart.current.y + gesture.dy,
              0,
              screenHeight - FAB_SIZE,
            ),
          };
          currentPos.current = next;
          dragPos.setValue(next);
        },
        onPanResponderRelease: () => setIsDragging(false),
        onPanResponderTerminate: () => setIsDragging(false),
      }),
    [dragPos, screenWidth, screenHeight],
  );

  const handleNavigate = (route: string, key?: string) => {
    setModalVisible(false);
    if (route !== "#") {
      if (key) {
        const perkConfig = PERK_MAP[key];
        if (perkConfig && !hasPerk(perkConfig.perk)) return;
      }
      router.push(route as any);
    }
  };

  const renderGridItems = () => (
    <View className="flex-row flex-wrap justify-between">
      {QUICK_ACTIONS.map((config) => {
        const { key } = config;
        const perkConfig = PERK_MAP[key];
        const isLocked = perkConfig && !hasPerk(perkConfig.perk);
        return (
          <TouchableOpacity
            key={key}
            className="mb-6 w-[20%] items-center"
            activeOpacity={0.7}
            onPress={() => handleNavigate(config.route, key)}
          >
            {isLocked ? (
              <Ionicons name="lock-closed" size={32} color="#6B7280" />
            ) : config.image ? (
              <Image
                source={config.image}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name={config.icon} size={32} color={config.color} />
            )}
            <ThemedText className="mt-2 text-center text-xs" numberOfLines={1}>
              {t(key as any)}
            </ThemedText>
            {isLocked && (
              <ThemedText className="mt-0.5 text-center">
                🔒 {perkConfig.level}
              </ThemedText>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // --- FLOATING MODE (FAB + Modal Sheet) ---
  if (isFloating) {
    return (
      <>
        {/* Floating Trigger Button (draggable) */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 50,
            transform: [
              { translateX: dragPos.x },
              { translateY: dragPos.y },
              { scale: isDragging ? 1.1 : 1 },
            ],
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setModalVisible(true)}
            className="h-14 w-14 items-center justify-center rounded-full bg-violet-600 shadow-lg elevation-5"
          >
            <Ionicons name="grid" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions Popup Sheet */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={() => setModalVisible(false)}
          >
            <Pressable
              className="rounded-t-3xl bg-white p-6 dark:bg-neutral-900"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="mb-4 flex-row items-center justify-between">
                <ThemedText className="text-lg font-bold">
                  {t("quickactions.title")}
                </ThemedText>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={32} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {renderGridItems()}
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  // --- STANDARD MODE (Inline Grid) ---
  return (
    <ThemedView className="mx-4 mt-2 mb-6 rounded-3xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      {renderGridItems()}
    </ThemedView>
  );
}
