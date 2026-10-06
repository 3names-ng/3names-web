import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, Easing, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { departmentWarService } from '@/service/departmentWar.service';
import { useDepartmentWarStore } from '@/store/departmentWarStore';
import { showError } from '@/components/ui/toast';

export default function MatchmakingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [searching, setSearching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setActiveBattle, setOpponentInfo, setBattlePhase } = useDepartmentWarStore();

  // Spinning animation
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );

    spin.start();
    pulse.start();

    return () => {
      spin.stop();
      pulse.stop();
    };
  }, []);

  // Auto-start matchmaking
  useEffect(() => {
    startMatchmaking();
  }, []);

  const startMatchmaking = async () => {
    setSearching(true);
    setError(null);

    try {
      const result = await departmentWarService.findMatch();

      // Match found! Navigate to battle arena
      setActiveBattle({ id: result.battleId } as any);
      setOpponentInfo(result.opponent);
      setBattlePhase('lobby');

      router.replace({
        pathname: '/(features)/departmentWar/battleArena',
        params: { battleId: result.battleId },
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'No opponents found right now';
      setError(msg);
      setSearching(false);
    }
  };

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        {/* Spinning ring */}
        <Animated.View
          style={{
            width: 180,
            height: 180,
            borderRadius: 90,
            borderWidth: 4,
            borderColor: '#6C3EF4',
            borderTopColor: 'transparent',
            transform: [{ rotate: spinInterpolation }, { scale: pulseAnim }],
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: isDark ? '#1E293B' : '#F5F3FF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="flash" size={56} color="#6C3EF4" />
          </View>
        </Animated.View>

        {/* Status text */}
        <ThemedText style={{ fontSize: 24, fontWeight: '900', marginBottom: 8 }}>
          {searching ? 'Finding Opponent...' : error ? 'No Match Found' : 'Match Found!'}
        </ThemedText>
        <ThemedText style={{ color: colors.muted, textAlign: 'center', fontSize: 15 }}>
          {searching
            ? 'Searching for someone in your department...'
            : error || 'Tap to try again'}
        </ThemedText>

        {/* Loading dots */}
        {searching && (
          <View style={{ flexDirection: 'row', marginTop: 24 }}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#6C3EF4',
                  marginHorizontal: 4,
                  opacity: pulseAnim,
                }}
              />
            ))}
          </View>
        )}

        {/* Error: retry button */}
        {error && (
          <View
            style={{
              marginTop: 30,
              backgroundColor: '#6C3EF4',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 24,
            }}
            // Using TouchableOpacity would require import, using ThemedText press instead
          >
            <ThemedText
              onPress={startMatchmaking}
              style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}
            >
              Try Again
            </ThemedText>
          </View>
        )}

        {/* Cancel button */}
        <ThemedText
          onPress={() => router.back()}
          style={{
            marginTop: 20,
            color: colors.muted,
            fontSize: 15,
            fontWeight: '600',
          }}
        >
          Cancel
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}
