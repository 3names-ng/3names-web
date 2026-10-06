/**
 * callHistoryScreen.tsx
 *
 * Displays the user's call history — both sent and received calls.
 * Persists locally like WhatsApp so it loads instantly on revisit.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ui/ThemedText";
import CallHistoryItem from "@/components/call/CallHistoryItem";
import { api } from "@/service/api";
import {
  useCallHistoryStore,
  type CallHistoryRecord,
} from "@/store/callHistoryStore";

export default function CallHistoryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Use persisted store — loads instantly from AsyncStorage
  const calls = useCallHistoryStore((s) => s.calls);
  const setCalls = useCallHistoryStore((s) => s.setCalls);
  const addCalls = useCallHistoryStore((s) => s.addCalls);

  const [loading, setLoading] = useState(calls.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchCalls = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        const { data } = await api.get("/calls/history", {
          params: { page: pageNum, limit: 20 },
        });

        const items: CallHistoryRecord[] = data.items || [];
        if (append) {
          addCalls(items);
        } else {
          setCalls(items);
        }
        setHasMore(items.length === 20);
        setPage(pageNum);
      } catch (err) {
        console.error("Failed to fetch call history:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [setCalls, addCalls],
  );

  // Load cached data instantly, then fetch fresh data in background
  useFocusEffect(
    useCallback(() => {
      // Always fetch fresh data when screen is focused
      setLoading(calls.length === 0);
      fetchCalls(1);
    }, [fetchCalls, calls.length]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCalls(1);
  }, [fetchCalls]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchCalls(page + 1, true);
  }, [loadingMore, hasMore, page, fetchCalls]);

  const handlePressCall = (call: CallHistoryRecord) => {
    router.push({
      pathname: "/(features)/chatScreen",
      params: {
        id: call.otherUser.id,
        isUserId: "true",
        user: JSON.stringify(call.otherUser),
      },
    });
  };

  const handleCallback = (call: CallHistoryRecord) => {
    router.push({
      pathname: "/(features)/chatScreen",
      params: {
        id: call.otherUser.id,
        isUserId: "true",
        user: JSON.stringify(call.otherUser),
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/chatListScreen")}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontSize: 20, fontWeight: "bold" }}>
            Call History
          </ThemedText>
          <ThemedText style={{ fontSize: 13, color: colors.muted || "#71717a" }}>
            Your video and voice calls
          </ThemedText>
        </View>
      </View>

      {/* Call List — shows cached data instantly */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary || "#7C3AED"} />
        </View>
      ) : (
        <FlatList
          data={calls}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CallHistoryItem
              call={item}
              onPress={handlePressCall}
              onCallback={handleCallback}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary || "#7C3AED"}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={colors.primary || "#7C3AED"} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 80, paddingHorizontal: 40 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="call-outline" size={36} color={colors.muted || "#71717a"} />
              </View>
              <ThemedText style={{ fontSize: 18, fontWeight: "700", textAlign: "center" }}>
                No calls yet
              </ThemedText>
              <ThemedText
                style={{
                  fontSize: 14,
                  color: colors.muted || "#71717a",
                  textAlign: "center",
                  marginTop: 8,
                  lineHeight: 20,
                }}
              >
                Your video and voice calls will appear here.{"\n"}Start a call from any chat!
              </ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
