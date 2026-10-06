import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import {
  materialsService,
  type CampusMaterial,
  type MaterialCategory,
} from "@/service/materials.service";
import AuthHeader from "../auth/authHeader";
import { useMaterialCacheStore } from "@/store/materialCacheStore";
import ReportContentSheet from "@/components/ui/reportContentSheet";
import { useDelayedLoading } from "@/components/ui/skeleton";
import MaterialListSkeleton from "./materialCardSkeleton";

interface MaterialListScreenProps {
  category: MaterialCategory;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function MaterialListScreen({
  category,
  title,
  subtitle,
  icon,
  color,
}: MaterialListScreenProps) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [materials, setMaterials] = useState<CampusMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const showSkeleton = useDelayedLoading(loading && materials.length === 0);
  const [reportingId, setReportingId] = useState<string | null>(null);

  // Offline cache (persisted to AsyncStorage) — lets materials display without network
  const materialsByCategory = useMaterialCacheStore(
    (state) => state.materialsByCategory
  );
  const materialsCacheRehydrated = useMaterialCacheStore(
    (state) => state.rehydrated
  );
  const setCachedMaterials = useMaterialCacheStore(
    (state) => state.setCachedMaterials
  );

  const fetchMaterials = useCallback(async () => {
    try {
      const data = await materialsService.listByCategory(category);
      setMaterials(data);
      // Keep a local snapshot so materials still show when offline
      setCachedMaterials(category, data);
    } catch (err) {
      // Offline / network error — cached materials (if any) stay on screen
      console.error(`Failed to load ${category}:`, err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, setCachedMaterials]);

  // Show persisted materials immediately (works offline) while the network fetch runs
  useEffect(() => {
    if (!materialsCacheRehydrated || materials.length > 0) return;
    const cached = materialsByCategory[category] || [];
    if (cached.length > 0) {
      setMaterials(cached);
    }
  }, [materialsCacheRehydrated, materialsByCategory, category, materials.length]);

  useFocusEffect(
    useCallback(() => {
      fetchMaterials();
    }, [fetchMaterials])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMaterials();
  }, [fetchMaterials]);

  // First load: keep the real header (and its back button) above a card skeleton
  if (loading && materials.length === 0) {
    return (
      <ThemedView className="flex-1" style={{ backgroundColor: colors.background }}>
        <SafeAreaView className="flex-1">
          <StatusBar barStyle="default" />
          <AuthHeader title={title} subtitle={subtitle} showBackButton={true} />
          <View style={styles.listContent}>
            {showSkeleton ? <MaterialListSkeleton /> : null}
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="default" />

        {/* Header */}
        {/* <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: color + "20" }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
          </View>
        </View> */}

        <AuthHeader title={title} subtitle={subtitle} showBackButton={true}/>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {materials.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={[styles.emptyIconWrapper, { backgroundColor: color + "15" }]}>
                <Ionicons name={icon} size={40} color={color} />
              </View>
              <ThemedText style={styles.emptyTitle}>
                No {title.toLowerCase()} yet
              </ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Check back later for {title.toLowerCase()} in your department.
              </ThemedText>
            </View>
          ) : (
            materials.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: color + "15" }]}>
                    <ThemedText style={[styles.categoryBadgeText, { color }]}>
                      {item.courseCode ?? item.category.replace("_", " ")}
                    </ThemedText>
                  </View>
                  <View style={styles.headerRight}>
                    {item.level && (
                      <ThemedText style={styles.levelText}>{item.level}</ThemedText>
                    )}
                    {item.uploader?.id !== user?.id && (
                      <TouchableOpacity
                        onPress={() => setReportingId(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel="Report material"
                      >
                        <Ionicons name="flag-outline" size={16} color="#888" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <ThemedText style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </ThemedText>

                {item.description && (
                  <ThemedText style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                  </ThemedText>
                )}

                <View style={styles.cardMeta}>
                  {item.course && (
                    <View style={styles.metaItem}>
                      <Ionicons name="school-outline" size={14} color="#888" />
                      <ThemedText style={styles.metaText}>{item.course}</ThemedText>
                    </View>
                  )}
                  {item.author && (
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={14} color="#888" />
                      <ThemedText style={styles.metaText}>{item.author}</ThemedText>
                    </View>
                  )}
                  {item.dueDate && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#E53935" />
                      <ThemedText style={[styles.metaText, { color: "#E53935" }]}>
                        Due {new Date(item.dueDate).toLocaleDateString()}
                      </ThemedText>
                    </View>
                  )}
                  {item.labSession && (
                    <View style={styles.metaItem}>
                      <Ionicons name="flask-outline" size={14} color="#888" />
                      <ThemedText style={styles.metaText}>{item.labSession}</ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <ThemedText style={styles.downloadsText}>
                    {item.downloadsCount} downloads
                  </ThemedText>
                  {item.priceCoins > 0 ? (
                    <View style={[styles.priceBadge, { backgroundColor: color + "15" }]}>
                      <ThemedText style={[styles.priceText, { color }]}>
                        {item.priceCoins} coins
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={[styles.priceBadge, { backgroundColor: "#10B98115" }]}>
                      <ThemedText style={[styles.priceText, { color: "#10B981" }]}>
                        Free
                      </ThemedText>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <ReportContentSheet
          visible={reportingId !== null}
          targetType="material"
          targetId={reportingId ?? undefined}
          subject="material"
          onClose={() => setReportingId(null)}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 13, color: "#888", marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  levelText: { fontSize: 11, color: "#888" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  cardDescription: { fontSize: 13, color: "#666", marginBottom: 8 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#888" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 10,
  },
  downloadsText: { fontSize: 12, color: "#888" },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: { fontSize: 12, fontWeight: "700" },
});
