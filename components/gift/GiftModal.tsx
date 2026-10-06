import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Animated,
  DeviceEventEmitter,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from 'react-native-svg';
import { RARITY } from './giftsData';
import GiftGridItem, { Gifts } from './GiftGridItem';
import TopUpModal from './topUpModal';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '../ui/ThemedText';
import { ThemedView } from '../ui/ThemedView';
import { coinService } from '@/service/post.service';
import { useAuthStore } from '@/store/authStore';
import { useGiftStore } from '@/store/giftStore';
import { useGiftThumbnail } from '@/hooks/useGiftThumbnail';
import { useCreateRestriction } from '@/hooks/useCreateRestriction';

interface GiftModalProps {
  visible: boolean;
  onClose: () => void;
  coinBalance?: number; // Optional override
  onSend?: (gift: Gifts) => void;
  onTopUpSuccess?: (addedCoins: number) => void;
}

const TABS = [
  { key: 'all', label: 'Popular' },
  { key: RARITY.RARE, label: 'Rare' },
  { key: RARITY.EPIC, label: 'Epic' },
  { key: RARITY.LEGENDARY, label: 'Legendary' },
];

const COMBO_WINDOW = 3000; 
const BUTTON_SIZE = 60; 
const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function GiftModal({
  visible,
  onClose,
  coinBalance: propCoinBalance,
  onSend,
  onTopUpSuccess,
}: GiftModalProps) {
  // Always read reactive coins directly from global Zustand store
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  // FIX: Give Zustand state precedence so store updates reflect instantly
  const coinBalance = user?.coins ?? propCoinBalance ?? 0;

  const { isRestricted, guardCreate } = useCreateRestriction();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedGift, setSelectedGift] = useState<Gifts | null>(null);
  const [localComboCount, setLocalComboCount] = useState<number>(0);
  const [isTopUpVisible, setIsTopUpVisible] = useState<boolean>(false);
  
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activeTimer = useRef<Animated.CompositeAnimation | null>(null);
  const circleRef = useRef<any>(null);

  const { colors } = useTheme();

  // Video thumbnail of the selected gift, shown on the send button. A
  // spinner is shown while it's being generated instead of the emoji icon.
  const selectedThumb = useGiftThumbnail(selectedGift?.videoUrl);

  // const fetchBalance = async () => {
  //   try {
  //     const response = await coinService.getBalance();
  //     const nextBalance = typeof response?.balance === 'number' ? response.balance : response;
  //     if (typeof nextBalance === 'number') {
  //       updateUser({ coins: nextBalance });
  //     }
  //   } catch (error) {
  //     console.error('Error fetching coin balance in GiftModal:', error);
  //   }
  // };

    const fetchBalance = async () => {
    try {
      const response = await coinService.getBalance();
      const rawNum = typeof response?.balance === "number" ? response.balance : response;
      
      if (typeof rawNum === "number" && !isNaN(rawNum)) {
        const sanitizedBalance = Math.max(0, rawNum);
        updateUser({ coins: sanitizedBalance });
      }
    } catch (error) {
      console.error("Error fetching live coin balance:", error);
    }
  };

  // Read the cached catalog straight from the store — it renders instantly
  // and only refreshes in the background when stale (see store/giftStore.ts).
  const gifts = useGiftStore((state) => state.gifts);
  const ensureGiftsLoaded = useGiftStore((state) => state.ensureGiftsLoaded);

  useEffect(() => {
    if (visible) {
      ensureGiftsLoaded();
      fetchBalance();
    }
  }, [visible]);

  // Global balance listener across all active components
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "GIFT_TRANSACTION_COMPLETE",
      (data?: { newBalance?: number }) => {
        if (data && typeof data.newBalance === "number") {
          updateUser({ coins: data.newBalance });
        } else {
          fetchBalance();
        }
      }
    );

    return () => {
      sub.remove();
    };
  }, []);

  const data = useMemo<Gifts[]>(() => {
    if (activeTab === 'all') return gifts;
    return gifts.filter((g) => g.rarity === activeTab);
  }, [activeTab, gifts]);

  const canAfford = selectedGift ? coinBalance >= selectedGift.coins : false;

  useEffect(() => {
    const listenerId = countdownAnim.addListener((value) => {
      if (circleRef.current) {
        const offset = CIRCUMFERENCE - (value.value * CIRCUMFERENCE);
        circleRef.current.setNativeProps({
          strokeDashoffset: offset
        });
      }
    });

    return () => {
      countdownAnim.removeListener(listenerId);
    };
  }, []);

  useEffect(() => {
    resetCombo();
  }, [selectedGift]);

  const resetCombo = () => {
    if (activeTimer.current) activeTimer.current.stop();
    countdownAnim.setValue(0);
    setLocalComboCount(0);
  };

  const handleSend = () => {
    if (!selectedGift) return;

    if (!canAfford) {
      setIsTopUpVisible(true);
      return;
    }

    if (!guardCreate("Sending gifts is disabled while your account is restricted.")) {
      return;
    }

    // NOTE: the sound is played by the parent (feed/story screen) only after
    // the backend confirms the gift was sent successfully.
    onSend?.(selectedGift);

    const nextCombo = localComboCount + 1;
    setLocalComboCount(nextCombo);

    scaleAnim.setValue(0.85);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 60,
      useNativeDriver: true,
    }).start();

    if (activeTimer.current) activeTimer.current.stop();
    
    countdownAnim.setValue(1);
    
    activeTimer.current = Animated.timing(countdownAnim, {
      toValue: 0,
      duration: COMBO_WINDOW,
      useNativeDriver: false,
    });

    activeTimer.current.start(({ finished }) => {
      if (finished) {
        setLocalComboCount(0);
      }
    });
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <ThemedView style={styles.backdrop}>
          <Pressable style={styles.backdropTouch} onPress={onClose} />

          <SafeAreaView style={[styles.sheet, { backgroundColor: colors.background }]}>
            <ThemedView style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={styles.header}>
              <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                Send a Gift
              </ThemedText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                <Text style={[styles.closeButtonText, { color: colors.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {isRestricted && (
              <ThemedView style={[styles.restrictedBanner, { backgroundColor: colors.dangerLight }]}>
                <ThemedText style={[styles.restrictedBannerText, { color: colors.danger }]}>
                  Sending gifts is disabled while your account is restricted
                </ThemedText>
              </ThemedView>
            )}

            {/* Tabs Navigation */}
            <ThemedView style={styles.tabRow}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tab, 
                    activeTab === tab.key && { backgroundColor: '#FE2C55' }
                  ]}
                >
                  <ThemedText 
                    style={[
                      styles.tabText, 
                      { color: colors.muted },
                      activeTab === tab.key && { color: '#FFFFFF' }
                    ]}
                  >
                    {tab.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>

            {/* Grid Selection Map */}
            <FlatList
              data={data}
              keyExtractor={(item) => String(item.id)}
              numColumns={4}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <GiftGridItem
                  gift={item}
                  selected={selectedGift?.id === item.id}
                  onPress={setSelectedGift} 
                />
              )} 
            />

            {/* Transaction Footer Control */}
            <ThemedView style={[styles.footer, { borderTopColor: colors.border }]}>
              <ThemedView style={styles.balance}>
                <ThemedText style={styles.coinIcon}>🪙</ThemedText>
                <ThemedText style={styles.balanceText}>{coinBalance.toLocaleString()}</ThemedText>
                {selectedGift && (
                  <ThemedText 
                    style={[
                      styles.giftPriceCost, 
                      { color: colors.muted },
                      !canAfford && { color: colors.danger }
                    ]}
                    numberOfLines={1}
                  >
                    {selectedGift.name} · {selectedGift.coins} coins
                  </ThemedText>
                )}
              </ThemedView>

              {/* Dynamic Combo Button System */}
              <View style={styles.buttonActionArea}>
                {selectedGift ? (
                  !canAfford ? (
                    <TouchableOpacity
                      style={[styles.topUpButton, styles.roundSendButton, { backgroundColor: colors.warning }]}
                      onPress={handleSend}
                    >
                      <ThemedText style={[styles.topUpButtonText, { color: '#fff' }]}>TOP UP</ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.buttonWrapper}>
                      {localComboCount > 0 && (
                        <Animated.View style={[styles.svgPositioner, { opacity: countdownAnim }]}>
                          <Svg width={BUTTON_SIZE + 8} height={BUTTON_SIZE + 8} viewBox={`0 0 ${BUTTON_SIZE + 8} ${BUTTON_SIZE + 8}`}>
                            <Circle
                              ref={circleRef}
                              cx={(BUTTON_SIZE + 8) / 2}
                              cy={(BUTTON_SIZE + 8) / 2}
                              r={RADIUS}
                              stroke="#FFD35C"
                              strokeWidth="3"
                              fill="transparent"
                              strokeDasharray={CIRCUMFERENCE}
                              strokeDashoffset={CIRCUMFERENCE}
                              strokeLinecap="round"
                              transform={`rotate(-90 ${(BUTTON_SIZE + 8) / 2} ${(BUTTON_SIZE + 8) / 2})`}
                            />
                          </Svg>
                        </Animated.View>
                      )}

                      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[styles.roundSendButton, isRestricted && { opacity: 0.4 }]}
                          onPress={handleSend}
                          disabled={isRestricted}
                        >
                          <View style={styles.comboInnerContainer}>
                            {localComboCount > 0 ? (
                              <>
                                {localComboCount >= 2 && (
                                  <Text style={styles.comboFlame}>🔥</Text>
                                )}
                                <Text style={styles.comboNumber}>{localComboCount}X</Text>
                                <Text style={[styles.comboPromptText, { color: '#fff', marginBottom: 0 }]}>COMBO</Text>
                              </>
                            ) : selectedThumb.loading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : selectedThumb.uri ? (
                              <Image
                                source={{ uri: selectedThumb.uri }}
                                style={styles.sendButtonThumb}
                                resizeMode="cover"
                              />
                            ) : (
                              <Text style={styles.sendButtonIconText}>{selectedGift.icon}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                  )
                ) : (
                  <View style={[styles.roundSendButton, { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 }]}>
                    <Text style={[styles.sendButtonIconText, { opacity: 0.3 }]}>🎁</Text>
                  </View>
                )}
              </View>
            </ThemedView>
          </SafeAreaView>

          <TopUpModal
            visible={isTopUpVisible}
            onClose={() => setIsTopUpVisible(false)}
            onPaymentAttemptFinished={async () => {
              setIsTopUpVisible(false);
              // Force fresh balance fetch directly upon payment attempt finish
              await fetchBalance();
            }} 
          />
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '72%',
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictedBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  restrictedBannerText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  comboFlame: {
    fontSize: 14,
    marginBottom: 1,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 8,
  },
  tabText: {
    fontWeight: '600',
    fontSize: 13,
  },
  grid: {
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 100,
  },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  coinIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  balanceText: {
    color: '#FFD35C',
    fontWeight: '700',
    fontSize: 15,
  },
  giftPriceCost: {
    fontSize: 12,
    marginLeft: 6,
  },
  buttonActionArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboPromptText: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonWrapper: {
    width: BUTTON_SIZE + 8,
    height: BUTTON_SIZE + 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svgPositioner: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  roundSendButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#FE2C55',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FE2C55',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 1,
  },
  topUpButton: {
    borderRadius: 30, 
    width: 60,
    height: 60,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  topUpButtonText: {
    fontWeight: '800',
    fontSize: 13,
  },
  sendButtonIconText: {
    fontSize: 26,
  },
  sendButtonThumb: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  comboInnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
});