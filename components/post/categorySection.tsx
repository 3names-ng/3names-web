import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

interface Category {
  id: string;
  title: string;
  backendValue: string; // The exact string expected by NestJS class-validator
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

interface Props {
  category?: string;
  onChange?: (backendCategory: string) => void;
}

const CATEGORIES: Category[] = [
  {
    id: "1",
    title: "post.campusLife",
    backendValue: "campus_life",
    icon: "school",
    color: "#2563EB",
  },
  {
    id: "2",
    title: "post.academics",
    backendValue: "academics",
    icon: "book-open-page-variant",
    color: "#7C3AED",
  },
  {
    id: "3",
    title: "post.sports",
    backendValue: "sports",
    icon: "basketball",
    color: "#F97316",
  },
  {
    id: "4",
    title: "post.hostel",
    backendValue: "other", // Fallback to 'other' until backend adds specific enum values
    icon: "home-city",
    color: "#10B981",
  },
  {
    id: "5",
    title: "post.marketplace",
    backendValue: "other", // Fallback
    icon: "storefront",
    color: "#EC4899",
  },
  {
    id: "6",
    title: "post.events",
    backendValue: "events",
    icon: "calendar-star",
    color: "#EAB308",
  },
  {
    id: "7",
    title: "post.food",
    backendValue: "other", // Fallback
    icon: "food",
    color: "#EF4444",
  },
  {
    id: "8",
    title: "post.entertainment",
    backendValue: "other", // Fallback
    icon: "movie-open",
    color: "#6366F1",
  },
  {
    id: "9",
    title: "post.general",
    backendValue: "general",
    icon: "shape",
    color: "#64748B",
  },
];

export default function CategorySection({
  category: propCategory,
  onChange,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  // Stores the backend-compatible string format ('general', 'sports', etc.)
  const [internalCategory, setInternalCategory] = useState<string>("");

  const activeCategory = propCategory !== undefined ? propCategory : internalCategory;

  // Track selection matching against the backend value configuration
  const selected = activeCategory 
    ? CATEGORIES.find((item) => item.backendValue === activeCategory || item.title === activeCategory) 
    : null;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setVisible(true)}
        style={[styles.container, { borderBottomColor: colors.border }]}
      >
        <View style={styles.content}>
          {/* Left Side: Category Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="pricetag-outline"
              size={22}
              color="#A78BFA"
            />
          </View>

          {/* Middle: Row Label */}
          <View style={styles.labelContainer}>
            <ThemedText style={styles.title}>{t("explore.categoryLabel")}</ThemedText>
          </View>

          {/* Right Side: Selected Value */}
          <View style={styles.rightContainer}>
            <ThemedText style={styles.selectedValue}>
              {selected ? t(selected.title as any) : ""}
            </ThemedText>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#9CA3AF"
              style={styles.arrow}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            <View style={styles.header}>
              <ThemedText style={styles.headerTitle}>
                {t("post.selectCategory")}
              </ThemedText>

              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons
                  name="close"
                  size={28}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {CATEGORIES.map((item) => {
                // Evaluates selection based on title layout matching
                const isSelected = selected?.title === item.title;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    style={[
                      styles.item,
                      isSelected && {
                        backgroundColor: "#7C3AED15",
                        borderColor: "#7C3AED",
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => {
                      setInternalCategory(item.backendValue);
                      onChange?.(item.backendValue); // Fires the lowercase string up to parent screen state
                      setVisible(false);
                    }}
                  >
                    <View
                      style={[
                        styles.itemIcon,
                        {
                          backgroundColor: item.color + "20",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={22}
                        color={item.color}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <ThemedText 
                        style={[
                          styles.itemTitle, 
                          isSelected && { color: "#7C3AED" }
                        ]}
                      >
                        {t(item.title as any)}
                      </ThemedText>
                    </View>

                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#7C3AED"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 30,
    alignItems: "flex-start",
  },
  labelContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedValue: {
    fontSize: 15,
    color: "#9CA3AF",
    marginRight: 6,
  },
  arrow: {
    marginTop: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,.35)",
  },
  sheet: {
    height: "75%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginVertical: 4,
    borderRadius: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
});