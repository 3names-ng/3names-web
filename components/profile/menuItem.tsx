import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { ThemedView } from "../ui/ThemedView";
import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

export interface MenuItemProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  value?: string;
  badge?: number;
  danger?: boolean;
  onPress?: () => void;
}

export default function MenuItem({
  title,
  subtitle,
  icon,
  value,
  badge,
  danger,
  onPress,
}: MenuItemProps) {
   const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,}
    }
    >
      {/* Left Section */}
      <ThemedView style={styles.left}>
        <ThemedView
          style={[
            styles.iconContainer,
            danger && styles.dangerIcon,
          ]}
        >
          {icon}
        </ThemedView>

        <ThemedView style={styles.textArea}>
          <ThemedText
            style={[
              styles.title,
              danger && styles.dangerText,
            ]}
          >
            {title}
          </ThemedText>

          {!!subtitle && (
            <ThemedText style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>

      {/* Right Section */}
      <ThemedView style={styles.right}>
        {!!value && (
          <ThemedText style={styles.value}>
            {value}
          </ThemedText>
        )}

        {!!badge && (
          <ThemedView style={styles.badge}>
            <ThemedText style={styles.badgeText}>
              {badge}
            </ThemedText>
          </ThemedView>
        )}

        <ChevronRight
          size={18}
          color="#8A8A94"
        />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#23232B",
  },
  pressed: {
    backgroundColor: "#1C1C24",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#202028",
  },
  dangerIcon: {
    backgroundColor: "rgba(254,44,85,.15)",
  },
  textArea: {
    marginLeft: 15,
    flex: 1,
  },
  title: {
    
    fontSize: 17,
    fontWeight: "600",
  },
  subtitle: {
    color: "#8A8A94",
    fontSize: 13,
    marginTop: 3,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    color: "#A1A1AA",
    marginRight: 12,
    fontSize: 14,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FE2C55",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    marginRight: 10,
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 12,
  },
  dangerText: {
    color: "#FE2C55",
  },
});