import React, { useState, useCallback } from 'react';
import { View, FlatList, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { departmentWarService, type OpponentSearchResult } from '@/service/departmentWar.service';
import { OpponentCard } from '@/components/departmentWar/opponentCard';
import { OpponentListSkeleton } from '@/components/departmentWar/warSkeleton';
import { useDelayedLoading } from '@/components/ui/skeleton';
import { showError, showSuccess } from '@/components/ui/toast';
import { useDepartmentWarStore } from '@/store/departmentWarStore';

export default function SearchOpponentScreen() {
  const router = useRouter();
  const { schedule } = useLocalSearchParams<{ schedule?: string }>();
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpponentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const showSkeleton = useDelayedLoading(loading);
  const [searched, setSearched] = useState(false);

  const { setActiveBattle, setOpponentInfo, setBattlePhase } = useDepartmentWarStore();

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const data = await departmentWarService.searchOpponents(searchQuery);
      setResults(data);
      setSearched(true);
    } catch (err) {
      showError('Failed to search opponents');
    } finally {
      setLoading(false);
    }
  }, [user?.departmentId]);

  const handleChallenge = (opponent: OpponentSearchResult) => {
    const displayName = opponent.firstName || opponent.username || 'this user';

    Alert.alert(
      schedule ? 'Schedule Battle' : 'Challenge Opponent',
      `Send ${schedule ? 'a battle request' : 'a challenge'} to ${displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: schedule ? 'Schedule' : 'Challenge',
          onPress: async () => {
            try {
              if (schedule) {
                // For now, use a simple date picker placeholder
                // In production, use @react-native-community/datetimepicker
                const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                tomorrow.setHours(20, 0, 0, 0); // 8 PM tomorrow

                const result = await departmentWarService.scheduleBattle(
                  opponent.id,
                  tomorrow.toISOString(),
                );
                showSuccess(`Battle scheduled for ${tomorrow.toLocaleDateString()} at 8:00 PM`);
                router.back();
              } else {
                const result = await departmentWarService.challenge(opponent.id);
                setActiveBattle({ id: result.battleId } as any);
                setOpponentInfo(opponent);
                setBattlePhase('lobby');
                showSuccess(`Challenge sent to ${displayName}!`);

                // Navigate to battle arena to wait
                router.replace({
                  pathname: '/(features)/departmentWar/battleArena',
                  params: { battleId: result.battleId },
                });
              }
            } catch (err: any) {
              showError(err?.response?.data?.message || 'Failed to send challenge');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <ThemedText style={{ fontSize: 22, fontWeight: '900' }}>
          {schedule ? '📅 Schedule Battle' : '🔍 Find Opponent'}
        </ThemedText>
        <ThemedText style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
          Search by username or name
        </ThemedText>
      </View>

      {/* Search bar */}
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 16,
          backgroundColor: colors.card,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          height: 48,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch(query)}
          placeholder="Search classmates..."
          placeholderTextColor={colors.muted}
          style={{
            flex: 1,
            marginLeft: 10,
            color: colors.text,
            fontSize: 16,
          }}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.muted}
            onPress={() => {
              setQuery('');
              setResults([]);
              setSearched(false);
            }}
          />
        )}
      </View>

      {/* Results */}
      {loading ? (
        showSkeleton ? <OpponentListSkeleton count={3} /> : null
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <OpponentCard
              username={item.username}
              firstName={item.firstName}
              lastName={item.lastName}
              profilePictureUrl={item.profilePictureUrl}
              stats={item.stats}
              showChallengeButton
              onChallenge={() => handleChallenge(item)}
            />
          )}
          ListEmptyComponent={
            searched ? (
              <View style={{ alignItems: 'center', marginTop: 60 }}>
                <Ionicons name="search-outline" size={48} color={colors.muted} />
                <ThemedText style={{ color: colors.muted, marginTop: 12, fontSize: 16 }}>
                  No users found matching "{query}"
                </ThemedText>
              </View>
            ) : (
              <View style={{ alignItems: 'center', marginTop: 60 }}>
                <Ionicons name="people-outline" size={48} color={colors.muted} />
                <ThemedText style={{ color: colors.muted, marginTop: 12, fontSize: 16 }}>
                  Type a name to find classmates
                </ThemedText>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
