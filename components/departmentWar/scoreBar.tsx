import React, { useRef, useEffect } from 'react';
import { View, Image, Animated } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';

interface ScoreBarProps {
  myName: string;
  myAvatar: string | null;
  myScore: number;
  opponentName: string;
  opponentAvatar: string | null;
  opponentScore: number;
  isLeading: boolean;
  /** Whether the opponent has already answered the current question */
  opponentAnswered?: boolean;
  /** Whether the local user has answered the current question */
  myAnswered?: boolean;
  /** Points earned on the last answer */
  myLastPoints?: number | null;
  /** Points earned by opponent on their last answer */
  oppLastPoints?: number | null;
}

export function ScoreBar({
  myName,
  myAvatar,
  myScore,
  opponentName,
  opponentAvatar,
  opponentScore,
  isLeading,
  opponentAnswered = false,
  myAnswered = false,
  myLastPoints = null,
  oppLastPoints = null,
}: ScoreBarProps) {
  const { colors, isDark } = useTheme();

  // ── Score flash animation ──
  const myFlashAnim = useRef(new Animated.Value(0)).current;
  const oppFlashAnim = useRef(new Animated.Value(0)).current;
  const prevMyScore = useRef(myScore);
  const prevOppScore = useRef(opponentScore);

  useEffect(() => {
    if (myScore !== prevMyScore.current) {
      prevMyScore.current = myScore;
      Animated.sequence([
        Animated.timing(myFlashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(myFlashAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start();
    }
  }, [myScore]);

  useEffect(() => {
    if (opponentScore !== prevOppScore.current) {
      prevOppScore.current = opponentScore;
      Animated.sequence([
        Animated.timing(oppFlashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(oppFlashAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start();
    }
  }, [opponentScore]);

  const myScoreBg = myFlashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#10B98133'],
  });

  const oppScoreBg = oppFlashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#10B98133'],
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
        borderRadius: 16,
        marginHorizontal: 16,
      }}
    >
      {/* My side */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {myAvatar ? (
          <Image source={{ uri: myAvatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isLeading ? '#10B981' : '#6C3EF4',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
              {myName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}
        <View style={{ marginLeft: 8, flex: 1 }}>
          <ThemedText style={{ fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
            {myName || 'You'}
          </ThemedText>
          {myLastPoints != null && myLastPoints > 0 ? (
            <ThemedText style={{ fontSize: 10, color: '#10B981', fontWeight: '700' }}>
              +{myLastPoints} pts
            </ThemedText>
          ) : myAnswered ? (
            <ThemedText style={{ fontSize: 10, color: '#10B981', fontWeight: '500' }}>
              ✓ answered
            </ThemedText>
          ) : null}
        </View>
      </View>

      {/* Score */}
      <Animated.View
        style={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: myScoreBg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ThemedText
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: isLeading ? '#10B981' : colors.text,
            }}
          >
            {myScore}
          </ThemedText>
          <ThemedText style={{ fontSize: 20, fontWeight: '600', color: colors.muted, marginHorizontal: 8 }}>
            :
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: !isLeading && myScore !== opponentScore ? '#10B981' : colors.text,
            }}
          >
            {opponentScore}
          </ThemedText>
        </View>
      </Animated.View>

      {/* Opponent side */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
        <View style={{ marginRight: 8, alignItems: 'flex-end', flex: 1 }}>
          <ThemedText style={{ fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
            {opponentName || 'Opponent'}
          </ThemedText>
          {oppLastPoints != null && oppLastPoints > 0 ? (
            <ThemedText style={{ fontSize: 10, color: '#10B981', fontWeight: '700' }}>
              +{oppLastPoints} pts
            </ThemedText>
          ) : opponentAnswered ? (
            <ThemedText style={{ fontSize: 10, color: '#10B981', fontWeight: '500' }}>
              ✓ answered
            </ThemedText>
          ) : null}
        </View>
        {opponentAvatar ? (
          <Image source={{ uri: opponentAvatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: !isLeading && myScore !== opponentScore ? '#10B981' : '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
              {opponentName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}
