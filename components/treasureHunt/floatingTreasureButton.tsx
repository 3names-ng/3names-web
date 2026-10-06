import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTreasureHunt } from '@/hooks/useTreasureHunt';
import { ThemedText } from '@/components/ui/ThemedText';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { GiftSendOverlayRef } from '@/components/gift/GiftSendOverlay';
import type { Gifts } from '@/components/gift/GiftGridItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Gift animation that plays once when the treasure is claimed.
function TreasureGiftVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.play();
  });

  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: '100%' }}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export function FloatingTreasureButton({
  giftOverlayRef,
}: {
  giftOverlayRef?: React.RefObject<GiftSendOverlayRef | null>;
}) {
  const {
    treasure,
    loading,
    claiming,
    claimResult,
    showClaimModal,
    setShowClaimModal,
    claim,
    dismiss,
    hasTreasure,
  } = useTreasureHunt();

  // When claim succeeds and we have a gift, show it via the GiftSendOverlay
  const lastClaimGiftIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!claimResult?.gift || !giftOverlayRef?.current) return;
    // Avoid re-triggering for the same claim
    if (lastClaimGiftIdRef.current === claimResult.gift.id) return;
    lastClaimGiftIdRef.current = claimResult.gift.id;

    // Close the claim modal first
    setShowClaimModal(false);

    // Map the treasure gift to the UIGift shape expected by GiftSendOverlay
    const overlayGift: Gifts = {
      id: claimResult.gift.id,
      rarity: 'epic',
      icon: '🎁',
      name: claimResult.gift.name,
      coins: claimResult.bonusCoins,
      animationUrl: claimResult.gift.animationUrl || '',
      videoUrl: claimResult.gift.videoUrl || null,
    };

    // Small delay so the claim modal fade-out finishes first
    setTimeout(() => {
      giftOverlayRef.current?.show(overlayGift, 'You', 1);
    }, 300);
  }, [claimResult?.gift?.id]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Pulse animation when treasure is available
  useEffect(() => {
    if (!hasTreasure) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
      pulseAnim.setValue(1);
      glowAnim.setValue(0.3);
    };
  }, [hasTreasure]);

  if (loading || !hasTreasure || !treasure) return null;

  return (
    <>
      {/* Floating 🎁 button */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          zIndex: 9999,
          transform: [{ scale: pulseAnim }],
        }}
      >
        <TouchableOpacity
          onPress={() => setShowClaimModal(true)}
          activeOpacity={0.8}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#FFD700',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#FFD700',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              width: 72,
              height: 72,
              borderRadius: 36,
              borderWidth: 2,
              borderColor: '#FFD700',
              opacity: glowAnim,
            }}
          />
          <Ionicons name="gift" size={28} color="#8B4513" />
        </TouchableOpacity>
      </Animated.View>

      {/* Claim modal */}
      <Modal
        visible={showClaimModal}
        transparent
        animationType="fade"
        onRequestClose={dismiss}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#1C1C1E',
              borderRadius: 24,
              padding: 32,
              width: Math.min(SCREEN_WIDTH - 48, 380),
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#2C2C2E',
            }}
          >
            {claimResult ? (
              // ── Success state ──
              <>
                <Animated.View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#10B981',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="checkmark" size={40} color="#fff" />
                </Animated.View>
                <ThemedText
                  style={{
                    fontSize: 22,
                    fontWeight: '800',
                    color: '#FFFFFF',
                    textAlign: 'center',
                  }}
                >
                  🎉 Treasure Claimed!
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 15,
                    color: '#A1A1AA',
                    textAlign: 'center',
                    marginTop: 8,
                    lineHeight: 22,
                  }}
                >
                  {claimResult.message}
                </ThemedText>

                {/* Gift video preview */}
                {claimResult.gift?.videoUrl && (
                  <View
                    style={{
                      width: 160,
                      height: 160,
                      borderRadius: 16,
                      overflow: 'hidden',
                      marginTop: 16,
                    }}
                  >
                    <TreasureGiftVideo uri={claimResult.gift.videoUrl} />
                  </View>
                )}

                {claimResult.bonusCoins > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 12,
                      backgroundColor: '#FFD700' + '20',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <Ionicons name="sparkles" size={20} color="#FFD700" />
                    <ThemedText
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: '#FFD700',
                        marginLeft: 8,
                      }}
                    >
                      +{claimResult.bonusCoins} coins
                    </ThemedText>
                  </View>
                )}

              </>
            ) : (
              // ── Claim state ──
              <>
                {/* Gift icon */}
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#FFD700' + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="gift" size={40} color="#FFD700" />
                </View>

                <ThemedText
                  style={{
                    fontSize: 22,
                    fontWeight: '800',
                    color: '#FFFFFF',
                    textAlign: 'center',
                  }}
                >
                  🏴‍☠️ Treasure Found!
                </ThemedText>

                <ThemedText
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFD700',
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  {treasure.name}
                </ThemedText>

                {treasure.description && (
                  <ThemedText
                    style={{
                      fontSize: 14,
                      color: '#A1A1AA',
                      textAlign: 'center',
                      marginTop: 4,
                      lineHeight: 20,
                    }}
                  >
                    {treasure.description}
                  </ThemedText>
                )}

                {/* Gift info */}
                {treasure.gift && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 16,
                      backgroundColor: '#2C2C2E',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  >
                    <Ionicons name="diamond" size={20} color="#8B5CF6" />
                    <ThemedText
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#FFFFFF',
                        marginLeft: 8,
                      }}
                    >
                      {treasure.gift.name}
                    </ThemedText>
                  </View>
                )}

                {treasure.bonusCoins > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 8,
                      backgroundColor: '#FFD700' + '15',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                    }}
                  >
                    <Ionicons name="sparkles" size={20} color="#FFD700" />
                    <ThemedText
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#FFD700',
                        marginLeft: 8,
                      }}
                    >
                      +{treasure.bonusCoins} bonus coins
                    </ThemedText>
                  </View>
                )}

                {treasure.claimsRemaining <= 3 && (
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: '#EF4444',
                      marginTop: 8,
                    }}
                  >
                    ⚡ Only {treasure.claimsRemaining} claim(s) remaining!
                  </ThemedText>
                )}

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
                  <TouchableOpacity
                    onPress={dismiss}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: '#2C2C2E',
                      alignItems: 'center',
                    }}
                  >
                    <ThemedText style={{ fontSize: 15, fontWeight: '600', color: '#A1A1AA' }}>
                      Later
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={claim}
                    disabled={claiming}
                    style={{
                      flex: 1.5,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: claiming ? '#6C3EF480' : '#6C3EF4',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                  >
                    {claiming ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="gift" size={18} color="#fff" />
                        <ThemedText
                          style={{
                            fontSize: 15,
                            fontWeight: '700',
                            color: '#FFFFFF',
                            marginLeft: 8,
                          }}
                        >
                          Claim Now
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
