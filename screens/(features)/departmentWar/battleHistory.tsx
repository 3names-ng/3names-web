import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useDelayedLoading } from '@/components/ui/skeleton';
import { BattleHistorySkeleton } from '@/components/departmentWar/warSkeleton';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { departmentWarService, type BattleHistoryItem } from '@/service/departmentWar.service';

export default function BattleHistoryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const currentUser = useAuthStore((state) => state.user);

  const [battles, setBattles] = useState<BattleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDelayedLoading(loading);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const loadBattles = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setCursor(null);
    } else if (battles.length > 0) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await departmentWarService.getHistory(20, isRefresh ? undefined : cursor || undefined);
      if (isRefresh) {
        setBattles(result.battles);
      } else {
        setBattles((prev) => [...prev, ...result.battles]);
      }
      setCursor(result.nextCursor);
    } catch (err) {
      console.error('Failed to load battle history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [cursor, battles.length]);

  useEffect(() => {
    loadBattles(true);
  }, []);

  const handleLoadMore = () => {
    if (cursor && !loadingMore) {
      loadBattles();
    }
  };

  const getOpponent = (battle: BattleHistoryItem) => {
    if (battle.player1Id === currentUser?.id) {
      return battle.player2;
    }
    return battle.player1;
  };

  const getResult = (battle: BattleHistoryItem): 'win' | 'loss' | 'draw' => {
    if (!battle.winnerId) return 'draw';
    return battle.winnerId === currentUser?.id ? 'win' : 'loss';
  };

  const getResultColor = (result: 'win' | 'loss' | 'draw') => {
    switch (result) {
      case 'win': return '#10B981';
      case 'loss': return '#EF4444';
      case 'draw': return '#F59E0B';
    }
  };

  const getResultLabel = (result: 'win' | 'loss' | 'draw') => {
    switch (result) {
      case 'win': return 'W';
      case 'loss': return 'L';
      case 'draw': return 'D';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quick_match': return '⚡ Quick Match';
      case 'challenge': return '🎯 Challenge';
      case 'scheduled': return '📅 Scheduled';
      default: return type;
    }
  };

  const renderBattleItem = ({ item }: { item: BattleHistoryItem }) => {
    const opponent = getOpponent(item);
    const result = getResult(item);
    const resultColor = getResultColor(result);
    const myScore = item.player1Id === currentUser?.id ? item.player1Score : item.player2Score;
    const oppScore = item.player1Id === currentUser?.id ? item.player2Score : item.player1Score;
    const isMyScoreHigher = myScore > oppScore;

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Result badge */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${resultColor}20`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}
        >
          <ThemedText style={{ color: resultColor, fontWeight: '900', fontSize: 16 }}>
            {getResultLabel(result)}
          </ThemedText>
        </View>

        {/* Opponent info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {opponent?.profilePictureUrl ? (
              <Image
                source={{ uri: opponent.profilePictureUrl }}
                style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}
              />
            ) : (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#6C3EF4',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                  {(opponent?.username || 'U').charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
            <ThemedText style={{ fontWeight: '600', fontSize: 15 }} numberOfLines={1}>
              {opponent?.firstName || opponent?.username || 'Unknown'}
            </ThemedText>
          </View>
          <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
            {getTypeLabel(item.type)}
            {item.finishedAt && ` · ${new Date(item.finishedAt).toLocaleDateString()}`}
          </ThemedText>
        </View>

        {/* Score */}
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: '900',
                color: isMyScoreHigher ? '#10B981' : colors.text,
              }}
            >
              {myScore}
            </ThemedText>
            <ThemedText style={{ fontSize: 16, color: colors.muted, marginHorizontal: 4 }}>:</ThemedText>
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: '900',
                color: !isMyScoreHigher && myScore !== oppScore ? '#10B981' : colors.text,
              }}
            >
              {oppScore}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' }}>
          Battle History
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats summary */}
      {battles.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <ThemedText style={{ fontSize: 22, fontWeight: '900', color: '#10B981' }}>
              {battles.filter((b) => getResult(b) === 'win').length}
            </ThemedText>
            <ThemedText style={{ color: colors.muted, fontSize: 12 }}>Wins</ThemedText>
          </View>
          <View style={{ alignItems: 'center' }}>
            <ThemedText style={{ fontSize: 22, fontWeight: '900', color: '#EF4444' }}>
              {battles.filter((b) => getResult(b) === 'loss').length}
            </ThemedText>
            <ThemedText style={{ color: colors.muted, fontSize: 12 }}>Losses</ThemedText>
          </View>
          <View style={{ alignItems: 'center' }}>
            <ThemedText style={{ fontSize: 22, fontWeight: '900', color: '#F59E0B' }}>
              {battles.filter((b) => getResult(b) === 'draw').length}
            </ThemedText>
            <ThemedText style={{ color: colors.muted, fontSize: 12 }}>Draws</ThemedText>
          </View>
        </View>
      )}

      {/* Battle list */}
      {loading ? (
        showSkeleton ? <BattleHistorySkeleton /> : null
      ) : (
        <FlatList
          data={battles}
          keyExtractor={(item) => item.id}
          renderItem={renderBattleItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadBattles(true)}
              tintColor={colors.primary || '#6C3EF4'}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color="#6C3EF4" style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="flash-outline" size={56} color={colors.muted} />
              <ThemedText style={{ color: colors.muted, marginTop: 12, fontSize: 16, textAlign: 'center' }}>
                No battles yet{'\n'}Start a battle to see your history here!
              </ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
