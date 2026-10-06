import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import MenuItem, { MenuItemProps } from "./menuItem";
import { ThemedView } from "../ui/ThemedView";
import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  title: string;
  items: MenuItemProps[];
}

export default function MenuSection({
  title,
  items,
}: Props) {

   const { colors } = useTheme();
  return (
     <ThemedView className="flex-1" style={{backgroundColor:colors.background}}>
    <ThemedView style={styles.container}>
      {/* Section Title */}

      <ThemedText style={styles.title}>
        {title}
      </ThemedText>

      {/* Card */}

      <ThemedView style={{borderColor:colors.border, borderRadius: 22,
    overflow: "hidden",

    borderWidth: 1,}}>
        {items.map((item, index) => (
          <ThemedView key={index}>
            <MenuItem {...item} />

            {index !== items.length - 1 && (
              <ThemedView style={styles.separator} />
            )}
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 6,
    textTransform: "uppercase",
  },

  card: {
    // backgroundColor: "#17171F",
    borderRadius: 22,
    overflow: "hidden",

    borderWidth: 1,
    // borderColor: "#23232B",
  },

  separator: {
    height: 1,
    // backgroundColor: "#23232B",
    marginLeft: 78,
  },
});