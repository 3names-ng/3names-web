import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, SlidersHorizontal } from "lucide-react-native";

import SearchInput from "@/components/search/searchInput";
import SuggestedUserCard from "@/components/search/suggestedUserCard";
import EmptySearch from "@/components/search/emptySearch";
import NoResult from "@/components/search/noResult";
import { SuggestedUserListSkeleton } from "@/components/search/searchSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTranslation } from "@/hooks/useTranslation";

import { searchService, type SearchUserItem } from "@/service/search.service";

export default function SearchResultsScreen() {
  const { q } = useLocalSearchParams();
  const [query, setQuery] = useState((q as string) || "");
  const [selectedTab, setSelectedTab] = useState("All");
  const [results, setResults] = useState<SearchUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const showSkeleton = useDelayedLoading(loading);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  const tabs = [
    t("searchResults.all"),
    t("searchResults.people"),
    t("searchResults.schools"),
    t("searchResults.courses"),
  ];

  useEffect(() => {
    let isMounted = true;

    if (!query.trim()) {
      setResults([]);
      return () => {
        isMounted = false;
      };
    }

    const runSearch = async () => {
      try {
        setLoading(true);
        const response = await searchService.searchUsers(query.trim(), 20);
        if (isMounted) {
          setResults(response.items || []);
        }
      } catch (error) {
        console.log("Search request failed", error);
        if (isMounted) {
          setResults([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    runSearch();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const mappedResults = useMemo(
    () =>
      results.map((user) => ({
        id: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username,
        username: user.username,
        avatar: user.profilePictureUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        school: user.school?.name || t("searchResults.unknownSchool"),
        department: user.department?.name || user.faculty?.name || t("searchResults.unknownDept"),
        level: user.faculty?.name ? t("searchResults.student") : t("searchResults.student"),
        followers: 0,
        xp: 0,
        verified: false,
        following: user.isFollowing ?? false,
        profileFrame: (user as any).profileFrame,
        appLevel: (user as any).appLevel || null,
      })),
    [results]
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: isDark ? "#111827" : "#FFFFFF",
      }}
    >
      <ThemedView className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft
            size={24}
            color={isDark ? "#FFF" : "#111"}
          />
        </Pressable>

        <ThemedView className="flex-1 mx-3">
          <SearchInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            onSubmit={setQuery}
          />
        </ThemedView>

        <Pressable>
          <SlidersHorizontal
            size={22}
            color={isDark ? "#FFF" : "#111"}
          />
        </Pressable>
      </ThemedView>

      <FlatList
        horizontal
        data={tabs}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
        }}
        renderItem={({ item }) => {
          const active = item === selectedTab;

          return (
            <Pressable
              onPress={() => setSelectedTab(item)}
              className="mr-3 px-5 py-3 rounded-full"
              style={{
                backgroundColor: active
                  ? "#6F3FF5"
                  : isDark
                  ? "#1F2937"
                  : "#F3F4F6",
              }}
            >
              <ThemedText
                style={{
                  color: active
                    ? "#FFF"
                    : isDark
                    ? "#D1D5DB"
                    : "#374151",
                }}
                className="font-semibold"
              >
                {item}
              </ThemedText>
            </Pressable>
          );
        }}
      />

      {query.length === 0 ? (
        <EmptySearch />
      ) : loading ? (
        showSkeleton ? <SuggestedUserListSkeleton /> : null
      ) : results.length === 0 ? (
        <NoResult />
      ) : (
        <FlatList
          data={mappedResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 120,
            gap: 18,
          }}
          renderItem={({ item }) => (
            <SuggestedUserCard user={item} />
          )}
        />
      )}
    </SafeAreaView>
  );
}