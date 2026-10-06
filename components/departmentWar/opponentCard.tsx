import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useTheme } from '@/hooks/useTheme';

interface OpponentCardProps {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  stats?: {
    totalBattles: number;
    wins: number;
    losses: number;
    winRate: number;
    currentWinStreak: number;
  };
  onPress?: () => void;
  onChallenge?: () => void;
  showChallengeButton?: boolean;
  compact?: boolean;
}

export function OpponentCard({
  username,
  firstName,
  lastName,
  profilePictureUrl,
  stats,
  onPress,
  onChallenge,
  showChallengeButton = false,
  compact = false,
}: OpponentCardProps) {
  const { colors, isDark } = useTheme();
  const displayName = firstName || username || 'Unknown';
  const subtitle = lastName ? `${firstName || ''} ${lastName}` : username;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {profilePictureUrl ? (
          <Image
            source={{ uri: profilePictureUrl }}
            style={{ width: 44, height: 44, borderRadius: 22 }}
          />
        ) : (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary || '#6C3EF4',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>
              {displayName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}

        <View style={{ flex: 1, marginLeft: 12 }}>
          <ThemedText style={{ fontWeight: '600', fontSize: 15 }}>{displayName}</ThemedText>
          {stats && (
            <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
              {stats.wins}W {stats.losses}L · {stats.winRate}%
            </ThemedText>
          )}
        </View>

        {showChallengeButton && onChallenge && (
          <TouchableOpacity
            onPress={onChallenge}
            style={{
              backgroundColor: '#6C3EF4',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Battle</ThemedText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  // Full card
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {profilePictureUrl ? (
          <Image
            source={{ uri: profilePictureUrl }}
            style={{ width: 56, height: 56, borderRadius: 28 }}
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#6C3EF4',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 22 }}>
              {displayName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}

        <View style={{ flex: 1, marginLeft: 14 }}>
          <ThemedText style={{ fontWeight: '700', fontSize: 17 }}>{displayName}</ThemedText>
          {subtitle !== displayName && (
            <ThemedText style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{subtitle}</ThemedText>
          )}
        </View>

        {showChallengeButton && onChallenge && (
          <TouchableOpacity
            onPress={onChallenge}
            style={{
              backgroundColor: '#6C3EF4',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="flash" size={16} color="#fff" />
            <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 6 }}>
              Challenge
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {stats && (
        <View
          style={{
            flexDirection: 'row',
            marginTop: 14,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <StatItem label="Battles" value={stats.totalBattles} colors={colors} />
          <StatItem label="Wins" value={stats.wins} colors={colors} />
          <StatItem label="Losses" value={stats.losses} colors={colors} />
          <StatItem label="Win Rate" value={`${stats.winRate}%`} colors={colors} />
          {stats.currentWinStreak > 0 && (
            <StatItem label="🔥 Streak" value={stats.currentWinStreak} colors={colors} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function StatItem({ label, value, colors }: { label: string; value: string | number; colors: any }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <ThemedText style={{ fontWeight: '800', fontSize: 16 }}>{value}</ThemedText>
      <ThemedText style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{label}</ThemedText>
    </View>
  );
}
