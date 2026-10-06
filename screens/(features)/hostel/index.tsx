import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";

import Header from "@/components/header";
import { useTheme } from "@/hooks/useTheme";
import SectionHeader from "@/components/hostel/sectionHeader";
import HostelList from "@/components/hostel/hostelList";
import { ThemedView } from "@/components/ui/ThemedView";
import { hostelService } from "@/service/hostel.service";
import AuthHeader from "@/components/auth/authHeader";

export default function HostelScreen() {
  const { colors, isDark } = useTheme();

  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHostels = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await hostelService.getAllHostels();
      const data = Array.isArray(response)
        ? response
        : response?.data || response?.hostels || [];

      setHostels(data);
    } catch (err: any) {
      console.error("Failed to fetch hostels:", err);
      setError("Unable to load hostel listings. Please check your network connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const onRefresh = useCallback(() => {
    fetchHostels(true);
  }, []);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <StatusBar
        translucent={false}
        backgroundColor={isDark ? "#18181B" : "#FFFFFF"}
        barStyle={isDark ? "light-content" : "dark-content"}
      />
    <AuthHeader
        title="Campus Hostels"
        subtitle="Find & book student accommodations"
        rightElement={
          <TouchableOpacity
            onPress={() => router.push("/(features)/hostel/myListings" as any)}
            style={{ padding: 6 }}
          >
            <Feather name="list" size={22} color={colors.text} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={["#6366F1"]}
          />
        }
      >
        {/* Hero */}
        <ThemedView className="px-4 mt-6 mb-4 bg-transparent">
          <Image
            source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946859/hostel-hero_th6ucx.png"}}
            className="w-full h-44 rounded-3xl"
            resizeMode="cover"
          />
        </ThemedView>

        <SectionHeader title="Available Hostels" action="" />

        {/* Hostel List Component */}
        <HostelList
          hostels={hostels}
          loading={loading}
          refreshing={refreshing}
          error={error}
          onRetry={() => fetchHostels()}
          onRefresh={onRefresh}
        />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
        ]}
        onPress={() => router.push("/(features)/hostel/add" as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 50,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});