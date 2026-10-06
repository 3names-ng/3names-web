import React, { useEffect, useRef } from 'react';
import { View, Modal, Animated, TouchableOpacity, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';

interface WarRewardModalProps {
  visible: boolean;
  isWinner: boolean;
  isDraw: boolean;
  myScore: number;
  opponentScore: number;
  departmentPoints: number;
  /** Optional note shown as a banner, e.g. "This battle ended while you were away" */
  note?: string;
  onClose: () => void;
}

export function WarRewardModal({
  visible,
  isWinner,
  isDraw,
  myScore,
  opponentScore,
  departmentPoints,
  note,
  onClose,
}: WarRewardModalProps) {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Bounce the trophy
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 10,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible]);

  const title = isDraw ? "It's a Draw!" : isWinner ? 'Victory!' : 'Defeated';
  const subtitle = isDraw
    ? 'Both warriors fought well!'
    : isWinner
    ? 'You crushed it!'
    : 'Better luck next time!';
  const icon = isDraw ? 'hand-left' : isWinner ? 'trophy' : 'skull';
  const iconColor = isDraw ? '#F59E0B' : isWinner ? '#10B981' : '#EF4444';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 30,
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            backgroundColor: isDark ? '#1E293B' : '#fff',
            borderRadius: 28,
            padding: 32,
            width: '100%',
            alignItems: 'center',
          }}
        >
          {/* Icon */}
          <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: `${iconColor}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Ionicons name={icon as any} size={56} color={iconColor} />
            </View>
          </Animated.View>

          {/* Title */}
          <ThemedText style={{ fontSize: 28, fontWeight: '900', marginBottom: 8 }}>
            {title}
          </ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 15, marginBottom: 24 }}>
            {subtitle}
          </ThemedText>

          {/* Optional note (e.g. battle ended while the player was away) */}
          {note && (
            <View
              style={{
                backgroundColor: '#F59E0B20',
                borderWidth: 1,
                borderColor: '#F59E0B40',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 24,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="flash" size={15} color="#F59E0B" />
              <ThemedText style={{ color: '#F59E0B', fontSize: 13, fontWeight: '600', marginLeft: 8, flex: 1 }}>
                {note}
              </ThemedText>
            </View>
          )}

          {/* Score */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <View style={{ alignItems: 'center', flex: 1 }}>
              <ThemedText style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>YOU</ThemedText>
              <ThemedText
                style={{
                  fontSize: 36,
                  fontWeight: '900',
                  color: isWinner ? '#10B981' : colors.text,
                }}
              >
                {myScore}
              </ThemedText>
            </View>

            <ThemedText style={{ fontSize: 20, color: colors.muted, marginHorizontal: 16 }}>vs</ThemedText>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <ThemedText style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>THEM</ThemedText>
              <ThemedText
                style={{
                  fontSize: 36,
                  fontWeight: '900',
                  color: !isWinner && !isDraw ? '#10B981' : colors.text,
                }}
              >
                {opponentScore}
              </ThemedText>
            </View>
          </View>

          {/* Department points */}
          {departmentPoints > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? '#312E81' : '#EEF2FF',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              <Ionicons name="school" size={18} color="#6C3EF4" />
              <ThemedText style={{ marginLeft: 8, fontWeight: '600', color: '#6C3EF4' }}>
                +{departmentPoints} Department Points
              </ThemedText>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: '#6C3EF4',
              paddingHorizontal: 40,
              paddingVertical: 14,
              borderRadius: 24,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {isWinner ? 'Battle Again!' : 'Try Again'}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
