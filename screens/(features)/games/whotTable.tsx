import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BackHandler, View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Path, Circle, Rect } from 'react-native-svg';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useWhotStore } from '@/store/whotStore';
import { whotService, type WhotShape, type WhotSeat } from '@/service/whot.service';
import { useWhotSocket } from '@/service/useWhotSocket';
import { showError, showInfo } from '@/components/ui/toast';

// ── Card visuals ──
// Styled after a classic Waddingtons Whot deck: a single maroon ink on warm
// ivory stock for every card face (no per-suit rainbow), deep maroon backs
// with a cursive-style "Whot" wordmark. The shape picker below keeps its own
// distinct per-shape colors since that's a UI control, not a card render.
const CARD_ACCENT = '#8E1F2E';
const CARD_ACCENT_DARK = '#5C1420';
const CARD_FACE_BG = '#FBF6EC';

const SHAPE_CONFIG: Record<string, { icon: string; color: string }> = {
  circle: { icon: 'circle', color: '#3B82F6' },
  triangle: { icon: 'triangle', color: '#10B981' },
  cross: { icon: 'plus-thick', color: '#EF4444' },
  square: { icon: 'square', color: '#F59E0B' },
  star: { icon: 'star', color: '#8B5CF6' },
};
const SHAPE_ORDER: WhotShape[] = ['circle', 'triangle', 'cross', 'square', 'star'];

function parseCard(card: string): { shape: string; number: string } {
  const idx = card.indexOf('-');
  return { shape: card.slice(0, idx), number: card.slice(idx + 1) };
}

/**
 * Client-side legality hint only, purely for dimming cards the player
 * probably can't play — the server is the sole authority and re-validates
 * every play, so this never blocks a tap outright, just visually hints it.
 */
function isLikelyPlayable(card: string, topCard: string | null, requestedShape: string | null): boolean {
  if (!topCard) return true;
  const { shape, number } = parseCard(card);
  if (shape === 'whot') return true; // Whot-20 wild is always playable
  if (requestedShape) return shape === requestedShape;
  const top = parseCard(topCard);
  if (top.shape === 'whot') return true; // defensive: unresolved wild, don't block
  return shape === top.shape || number === top.number;
}

function CardFace({
  card,
  size = 62,
  faceDown = false,
  dimmed = false,
  onPress,
  style,
}: {
  card?: string;
  size?: number;
  faceDown?: boolean;
  dimmed?: boolean;
  onPress?: () => void;
  style?: any;
}) {
  const width = size;
  const height = size * 1.4;

  if (faceDown || !card) {
    return (
      <View style={[cardStyles.base, { width, height, backgroundColor: CARD_ACCENT, borderColor: CARD_ACCENT_DARK }, style]}>
        <ThemedText style={[cardStyles.backWordmark, { fontSize: size * 0.24 }]}>Whot</ThemedText>
      </View>
    );
  }

  const { shape, number } = parseCard(card);
  const isWild = shape === 'whot';
  const config = SHAPE_CONFIG[shape];

  const Inner = (
    <View
      style={[
        cardStyles.base,
        { width, height, backgroundColor: CARD_FACE_BG, borderColor: CARD_ACCENT, opacity: dimmed ? 0.4 : 1 },
        style,
      ]}
    >
      <ThemedText style={[cardStyles.number, { color: CARD_ACCENT }]}>{number}</ThemedText>
      {isWild ? (
        <Ionicons name="sparkles" size={size * 0.34} color={CARD_ACCENT} />
      ) : (
        <MaterialCommunityIcons name={config?.icon as any} size={size * 0.32} color={CARD_ACCENT} />
      )}
      {isWild && <ThemedText style={[cardStyles.wildLabel, { color: CARD_ACCENT }]}>WHOT</ThemedText>}
    </View>
  );

  if (!onPress) return Inner;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {Inner}
    </TouchableOpacity>
  );
}

// ── Table background ──
// A warm sunset gradient with a subtle Adinkra-style diamond lattice woven
// over it, evoking the look of an African game table rather than a flat
// theme color. Purely decorative — sits behind everything, at low opacity.
const BG_GOLD = '#F4C97A';

function TableBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#241208', '#5C2E1A', '#9C5023', '#D98A3D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="whotTablePattern" width={56} height={56} patternUnits="userSpaceOnUse">
            <Path d="M28 4 L52 28 L28 52 L4 28 Z" stroke={BG_GOLD} strokeWidth={1.2} fill="none" opacity={0.22} />
            <Circle cx={28} cy={28} r={2.5} fill={BG_GOLD} opacity={0.26} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#whotTablePattern)" />
      </Svg>
    </View>
  );
}

export default function WhotTable() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const currentUser = useAuthStore((state) => state.user);

  const {
    tableId,
    stake,
    pot,
    seats,
    myHand,
    topCard,
    deckCount,
    currentTurnPlayerId,
    pendingPickCount,
    requestedShape,
    status,
    lastResult,
    applyTableStart,
    applyCardPlayed,
    applyCardDrawn,
    applyTurnChanged,
    applyTableEnded,
    disconnectedPlayers,
    setPlayerConnected,
    applyPlayerForfeited,
    applyLastCardCalled,
    resetTable,
    applyTableSnapshot,
  } = useWhotStore();

  const [pendingWildCard, setPendingWildCard] = useState<string | null>(null);
  const [busyCard, setBusyCard] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const initializedRef = useRef(false);

  const isMyTurn = !!currentUser?.id && currentTurnPlayerId === currentUser.id;

  const { joinTableRoom, leaveTableRoom } = useWhotSocket({
    onTableStart: (data) => {
      applyTableStart(data);
      initializedRef.current = true;
    },
    onCardPlayed: (data) => {
      applyCardPlayed(data, currentUser?.id ?? null);
      if (data.winnerId) setShowResults(false); // wait for table_ended for the coin breakdown
    },
    onCardDrawn: (data) => {
      applyCardDrawn(data);
      // Each draw arrives twice for the drawer (private hand + public count):
      // react to your own private one and to others' public ones only.
      if (data.reason === 'last_card_penalty') {
        if (data.userId === currentUser?.id && data.yourHand) {
          showError("You didn't call Last Card — you drew penalty cards.");
        } else if (data.userId !== currentUser?.id) {
          showInfo('A player forgot to call Last Card and drew penalty cards.');
        }
      }
    },
    onLastCardCalled: (data) => {
      applyLastCardCalled(data);
      if (data.userId !== currentUser?.id) showInfo('A player called Last Card!');
    },
    onTurnChanged: (data) => {
      applyTurnChanged(data);
    },
    onTableEnded: (data) => {
      applyTableEnded(data);
      setShowResults(true);
    },
    onPlayerDisconnected: (data) => {
      setPlayerConnected(data.userId, false, data.forfeitAt ?? null);
      showError("A player disconnected. If they don't return in time, they forfeit.");
    },
    onPlayerReconnected: (data) => {
      setPlayerConnected(data.userId, true);
      showInfo('A player reconnected to the table.');
    },
    onPlayerForfeited: (data) => {
      applyPlayerForfeited(data);
      showInfo("A player didn't reconnect in time and forfeited.");
    },
  });

  // Join the table's realtime room; if this screen was opened without state
  // (e.g. deep link / resumed session) pull the active table from REST first.
  useEffect(() => {
    let activeTableId = tableId;
    const start = async () => {
      if (!activeTableId) {
        try {
          const table = await whotService.getActiveTable();
          if (table) {
            activeTableId = table.id;
            // Full hydration, not just the id — otherwise a resumed session
            // (app relaunch, reconnect mid-game) sits on "Waiting for the
            // table to start..." until some other player's action happens
            // to re-sync it.
            applyTableSnapshot(table);
          }
        } catch {
          // fall through — the socket table_start event will still populate state
        }
      }
      if (activeTableId) joinTableRoom(activeTableId);
    };
    start();

    return () => {
      if (activeTableId) leaveTableRoom(activeTableId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  const handlePlayCard = useCallback(
    async (card: string) => {
      if (!isMyTurn || busyCard || !tableId) return;
      const { shape } = parseCard(card);
      if (shape === 'whot') {
        setPendingWildCard(card);
        return;
      }
      setBusyCard(card);
      try {
        await whotService.playCard(tableId, card);
      } catch (err: any) {
        showError(err?.response?.data?.message || 'Could not play that card');
      } finally {
        setBusyCard(null);
      }
    },
    [isMyTurn, busyCard, tableId],
  );

  const handleChooseShape = useCallback(
    async (shape: WhotShape) => {
      if (!pendingWildCard || !tableId) return;
      const card = pendingWildCard;
      setPendingWildCard(null);
      setBusyCard(card);
      try {
        await whotService.playCard(tableId, card, shape);
      } catch (err: any) {
        showError(err?.response?.data?.message || 'Could not play that card');
      } finally {
        setBusyCard(null);
      }
    },
    [pendingWildCard, tableId],
  );

  const [callingLastCard, setCallingLastCard] = useState(false);
  const handleCallLastCard = useCallback(async () => {
    if (callingLastCard || !tableId) return;
    setCallingLastCard(true);
    try {
      await whotService.callLastCard(tableId);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Could not call Last Card');
    } finally {
      setCallingLastCard(false);
    }
  }, [callingLastCard, tableId]);

  const handleDraw = useCallback(async () => {
    if (!isMyTurn || drawing || !tableId) return;
    setDrawing(true);
    try {
      await whotService.drawCard(tableId);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Could not draw a card');
    } finally {
      setDrawing(false);
    }
  }, [isMyTurn, drawing, tableId]);

  const handleCloseResults = () => {
    setShowResults(false);
    resetTable();
    router.dismissAll();
    setTimeout(() => router.replace('/(features)/games'), 50);
  };

  const otherSeats = seats.filter((s) => s.userId !== currentUser?.id);
  const mySeat = seats.find((s) => s.userId === currentUser?.id);

  if (!topCard || status === null) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <TableBackground />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ThemedText style={{ color: BG_GOLD }}>Waiting for the table to start...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TableBackground />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: 'rgba(244,201,122,0.25)' }]}>
        <ThemedText style={[styles.headerTitle, { color: BG_GOLD }]}>Naija Whot</ThemedText>
        <View style={[styles.potBadge, { backgroundColor: '#FFD70020' }]}>
          <ThemedText style={{ color: '#FFD700', fontWeight: '800', fontSize: 13 }}>⭐ {pot || stake}</ThemedText>
        </View>
      </View>

      {/* Came back after the reconnect window closed — out of this game */}
      {mySeat && !mySeat.isActive && !lastResult && (
        <View style={styles.forfeitedBanner}>
          <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center' }}>
            You were disconnected too long and forfeited this game.
          </ThemedText>
        </View>
      )}

      {/* Opponent seats */}
      <View style={styles.seatsRow}>
        {otherSeats.map((seat) => (
          <SeatBadge
            key={seat.userId}
            seat={seat}
            isTurn={seat.userId === currentTurnPlayerId}
            isReconnecting={seat.userId in disconnectedPlayers}
            forfeitAt={disconnectedPlayers[seat.userId] ?? null}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </View>

      {/* Turn indicator */}
      <TurnIndicator isMyTurn={isMyTurn} pendingPickCount={pendingPickCount} requestedShape={requestedShape} colors={colors} />

      {/* Center: discard + draw pile */}
      <View style={styles.centerArea}>
        <View style={styles.pileGroup}>
          <TouchableOpacity onPress={handleDraw} disabled={!isMyTurn || drawing} activeOpacity={0.75}>
            <View style={{ opacity: isMyTurn ? 1 : 0.55 }}>
              <CardFace faceDown size={72} />
              <View style={styles.deckCountBadge}>
                <ThemedText style={styles.deckCountText}>{deckCount}</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
          <ThemedText style={[styles.pileLabel, { color: BG_GOLD, opacity: 0.85 }]}>Draw ({deckCount} left)</ThemedText>
        </View>

        <View style={styles.pileGroup}>
          <CardFace card={topCard} size={72} />
          <ThemedText style={[styles.pileLabel, { color: BG_GOLD, opacity: 0.85 }]}>Top Card</ThemedText>
        </View>
      </View>

      {/* My hand */}
      <View style={[styles.handWrap, { borderTopColor: 'rgba(244,201,122,0.25)' }]}>
        <View style={styles.handHeaderRow}>
          <ThemedText style={{ fontWeight: '700', fontSize: 13, color: BG_GOLD, opacity: 0.85 }}>
            Your Hand{mySeat ? ` (${mySeat.cardCount})` : ''}
          </ThemedText>
          {/* Must be called before playing your final card, or you draw a penalty */}
          {myHand.length === 1 && mySeat?.isActive && !lastResult && (
            mySeat.hasCalledLastCard ? (
              <View style={[styles.lastCardBtn, { backgroundColor: 'rgba(16,185,129,0.85)' }]}>
                <ThemedText style={styles.lastCardText}>LAST CARD CALLED</ThemedText>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleCallLastCard}
                disabled={callingLastCard}
                activeOpacity={0.8}
                style={[styles.lastCardBtn, { backgroundColor: '#DC2626', opacity: callingLastCard ? 0.6 : 1 }]}
              >
                <ThemedText style={styles.lastCardText}>LAST CARD!</ThemedText>
              </TouchableOpacity>
            )
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handScroll}>
          {(myHand ?? []).map((card, idx) => {
            const playable = isLikelyPlayable(card, topCard, requestedShape);
            return (
              <Animated.View key={`${card}-${idx}`} entering={FadeInDown.delay(idx * 40)} style={{ marginRight: 10 }}>
                <CardFace
                  card={card}
                  size={64}
                  dimmed={!isMyTurn || !playable}
                  onPress={isMyTurn ? () => handlePlayCard(card) : undefined}
                />
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>

      {/* Shape picker modal (after playing a Whot-20) */}
      {pendingWildCard && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1a1f3a' : '#fff' }]}>
            <ThemedText style={{ fontSize: 17, fontWeight: '800', marginBottom: 4 }}>Call the Market</ThemedText>
            <ThemedText style={{ color: colors.muted, fontSize: 13, marginBottom: 16 }}>
              Pick the shape the next player must match
            </ThemedText>
            <View style={styles.shapeGrid}>
              {SHAPE_ORDER.map((shape) => {
                const config = SHAPE_CONFIG[shape];
                return (
                  <TouchableOpacity
                    key={shape}
                    onPress={() => handleChooseShape(shape)}
                    style={[styles.shapeBtn, { borderColor: config.color, backgroundColor: config.color + '15' }]}
                  >
                    <MaterialCommunityIcons name={config.icon as any} size={28} color={config.color} />
                    <ThemedText style={{ fontSize: 11, fontWeight: '700', marginTop: 6, color: config.color, textTransform: 'capitalize' }}>
                      {shape}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* End-of-table overlay */}
      {showResults && lastResult && (() => {
        if (lastResult.cancelled) {
          return (
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(28,14,6,0.88)' }]}>
              <Animated.View entering={FadeInDown.duration(350)} style={styles.resultCard}>
                <LinearGradient colors={['#8A8A8A', '#4A4A4A']} style={styles.resultBadge} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}>
                  <Text style={{ fontSize: 44 }}>↩️</Text>
                </LinearGradient>
                <ThemedText style={styles.resultTitle}>Table Cancelled</ThemedText>
                <ThemedText style={styles.resultSubtitle}>The table was abandoned — your entry Stars were fully refunded</ThemedText>

                <View style={styles.coinBreakdown}>
                  <View style={[styles.resultTotalPill, { backgroundColor: 'rgba(142,31,46,0.08)' }]}>
                    <ThemedText style={[styles.coinLabel, { fontWeight: '700', color: CARD_ACCENT }]}>Refunded</ThemedText>
                    <ThemedText style={[styles.coinValue, { color: CARD_ACCENT, fontWeight: '800', fontSize: 17 }]}>
                      +{lastResult.stake} ⭐
                    </ThemedText>
                  </View>
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={handleCloseResults} activeOpacity={0.85}>
                  <LinearGradient colors={[CARD_ACCENT, CARD_ACCENT_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.closeBtnGradient}>
                    <Text style={styles.closeBtnText}>Done</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          );
        }

        const isTie = !!lastResult.winnerIds && lastResult.winnerIds.length > 1;
        const tiedShare = isTie ? Math.floor(lastResult.winnerPrize / lastResult.winnerIds!.length) : 0;
        const iWon = isTie ? lastResult.winnerIds!.includes(currentUser?.id ?? '') : lastResult.winnerId === currentUser?.id;
        const badgeColors: [string, string] = iWon
          ? (isTie ? ['#C9A24B', '#8E6B1F'] : ['#F4C97A', '#C9861F'])
          : ['#6B4A3A', '#3B241A'];

        return (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(28,14,6,0.88)' }]}>
          <Animated.View entering={FadeInDown.duration(350)} style={styles.resultCard}>
            <LinearGradient colors={badgeColors} style={styles.resultBadge} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}>
              <Text style={{ fontSize: 44 }}>{iWon ? (isTie ? '🤝' : '🏆') : '😔'}</Text>
            </LinearGradient>
            {iWon && !isTie && (
              <>
                <Ionicons name="sparkles" size={18} color="#F4C97A" style={{ position: 'absolute', top: 8, left: 28 }} />
                <Ionicons name="sparkles" size={13} color="#F4C97A" style={{ position: 'absolute', top: 30, right: 24 }} />
              </>
            )}

            <ThemedText style={styles.resultTitle}>
              {isTie ? 'Market Ran Out — Tie!' : iWon ? 'You Won!' : 'Table Over'}
            </ThemedText>
            <ThemedText style={styles.resultSubtitle}>
              {isTie
                ? `Split with ${lastResult.winnerIds!.length - 1} other player${lastResult.winnerIds!.length > 2 ? 's' : ''} on fewest cards`
                : iWon
                ? 'Every card down — victory is yours'
                : 'Better luck at the next table'}
            </ThemedText>

            <View style={styles.coinBreakdown}>
              <View style={styles.coinRow}>
                <ThemedText style={styles.coinLabel}>Your entry</ThemedText>
                <ThemedText style={styles.coinValue}>-{lastResult.stake} ⭐</ThemedText>
              </View>
              <View style={styles.coinRow}>
                <ThemedText style={styles.coinLabel}>Total prize</ThemedText>
                <ThemedText style={styles.coinValue}>{lastResult.pot} ⭐</ThemedText>
              </View>
              <View style={styles.coinRow}>
                <ThemedText style={styles.coinLabel}>Platform fee</ThemedText>
                <ThemedText style={[styles.coinValue, { color: '#b0402f' }]}>-{lastResult.platformFee} ⭐</ThemedText>
              </View>
              {isTie && (
                <View style={styles.coinRow}>
                  <ThemedText style={styles.coinLabel}>Split between {lastResult.winnerIds!.length} tied players</ThemedText>
                  <ThemedText style={styles.coinValue}>{tiedShare} ⭐ each</ThemedText>
                </View>
              )}
              <View style={[styles.resultTotalPill, { backgroundColor: iWon ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.12)' }]}>
                <ThemedText style={[styles.coinLabel, { fontWeight: '700', color: CARD_ACCENT }]}>
                  {iWon ? 'You won' : 'You lost'}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.coinValue,
                    { color: iWon ? '#1a9e4f' : '#c23b3b', fontWeight: '800', fontSize: 17 },
                  ]}
                >
                  {iWon
                    ? `+${isTie ? tiedShare : lastResult.winnerPrize}`
                    : `-${lastResult.stake}`} ⭐
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={handleCloseResults} activeOpacity={0.85}>
              <LinearGradient
                colors={[CARD_ACCENT, CARD_ACCENT_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeBtnGradient}
              >
                <Text style={styles.closeBtnText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
        );
      })()}
    </SafeAreaView>
  );
}

// ── Sub-components ──

function SeatBadge({
  seat,
  isTurn,
  isReconnecting,
  forfeitAt,
  colors,
  isDark,
}: {
  seat: WhotSeat;
  isTurn: boolean;
  isReconnecting: boolean;
  /** ISO time this player forfeits if they haven't reconnected */
  forfeitAt: string | null;
  colors: any;
  isDark: boolean;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isTurn) {
      scale.value = withRepeat(withSequence(withTiming(1.08, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true);
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isTurn]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const displayName = seat.firstName || seat.username || 'Player';

  // Seconds left for a disconnected player to come back before they forfeit
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!isReconnecting || !forfeitAt) {
      setSecondsLeft(null);
      return;
    }
    const deadline = new Date(forfeitAt).getTime();
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isReconnecting, forfeitAt]);

  return (
    <Animated.View
      style={[
        styles.seatBadge,
        animatedStyle,
        { backgroundColor: 'rgba(43,24,8,0.4)', borderColor: 'rgba(244,201,122,0.3)', borderWidth: 1 },
        isTurn && { borderColor: '#F59E0B', borderWidth: 2 },
      ]}
    >
      {seat.profilePictureUrl ? (
        <Image source={{ uri: seat.profilePictureUrl }} style={styles.seatAvatar} />
      ) : (
        <View style={[styles.seatAvatar, { backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' }]}>
          <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{displayName.charAt(0).toUpperCase()}</ThemedText>
        </View>
      )}
      <ThemedText numberOfLines={1} style={[styles.seatName, { color: BG_GOLD }]}>
        {displayName}
      </ThemedText>
      <View style={styles.seatCardCount}>
        <MaterialCommunityIcons name="cards" size={11} color={BG_GOLD} />
        <ThemedText style={{ fontSize: 11, color: BG_GOLD, opacity: 0.85, marginLeft: 2 }}>{seat.cardCount}</ThemedText>
      </View>
      {!seat.isActive && (
        <View style={styles.seatOutBadge}>
          <ThemedText style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>OUT</ThemedText>
        </View>
      )}
      {seat.isActive && seat.hasCalledLastCard && (
        <View style={styles.seatLastCardBadge}>
          <ThemedText style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>LAST CARD</ThemedText>
        </View>
      )}
      {seat.isActive && isReconnecting && (
        <View style={styles.seatReconnectingBadge}>
          <ThemedText style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>
            {secondsLeft !== null ? `RECONNECTING ${secondsLeft}s` : 'RECONNECTING…'}
          </ThemedText>
        </View>
      )}
    </Animated.View>
  );
}

function TurnIndicator({
  isMyTurn,
  pendingPickCount,
  requestedShape,
  colors,
}: {
  isMyTurn: boolean;
  pendingPickCount: number;
  requestedShape: string | null;
  colors: any;
}) {
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 550 }), withTiming(0.6, { duration: 550 })), -1, true);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.turnRow}>
      <Animated.View style={[styles.turnDot, { backgroundColor: isMyTurn ? '#22c55e' : '#F59E0B' }, dotStyle]} />
      <ThemedText style={{ fontWeight: '700', fontSize: 13, color: BG_GOLD }}>{isMyTurn ? 'Your turn' : "Opponent's turn"}</ThemedText>
      {pendingPickCount > 0 && (
        <View style={[styles.miniBadge, { backgroundColor: '#EF444420' }]}>
          <ThemedText style={{ color: '#EF4444', fontWeight: '800', fontSize: 11 }}>Pick {pendingPickCount}</ThemedText>
        </View>
      )}
      {requestedShape && (
        <View style={[styles.miniBadge, { backgroundColor: '#8B5CF620' }]}>
          <ThemedText style={{ color: '#8B5CF6', fontWeight: '800', fontSize: 11, textTransform: 'capitalize' }}>
            Market: {requestedShape}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

// ── Styles ──
const cardStyles = StyleSheet.create({
  base: {
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  number: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  wildLabel: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  backWordmark: {
    color: '#FBF6EC',
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  potBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  seatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  seatBadge: {
    width: 84,
    borderRadius: 14,
    alignItems: 'center',
    padding: 8,
    position: 'relative',
  },
  seatAvatar: { width: 44, height: 44, borderRadius: 22, marginBottom: 4 },
  seatName: { fontSize: 11, fontWeight: '700', maxWidth: 76 },
  seatCardCount: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  seatOutBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  forfeitedBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.85)',
  },
  seatLastCardBadge: {
    marginTop: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  seatReconnectingBadge: {
    marginTop: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  turnDot: { width: 9, height: 9, borderRadius: 4.5 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginLeft: 4 },
  centerArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  pileGroup: { alignItems: 'center' },
  pileLabel: { fontSize: 11, opacity: 0.6, marginTop: 6, fontWeight: '600' },
  deckCountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E1F2E',
    borderWidth: 2,
    borderColor: '#FBF6EC',
  },
  deckCountText: { color: '#FBF6EC', fontSize: 11, fontWeight: '800' },
  handWrap: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 18,
  },
  handHeaderRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastCardBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  lastCardText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  handScroll: { paddingHorizontal: 16, alignItems: 'flex-end' },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
  shapeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  shapeBtn: {
    width: 76,
    height: 76,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinBreakdown: {
    width: '100%',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    backgroundColor: 'rgba(142,31,46,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(142,31,46,0.12)',
  },
  coinRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  coinLabel: { fontSize: 13, opacity: 0.7, color: '#5C1420' },
  coinValue: { fontSize: 13, fontWeight: '600', color: '#5C1420' },
  closeBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  closeBtnGradient: { width: '100%', paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#FBF6EC', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  resultCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FBF6EC',
    borderWidth: 1.5,
    borderColor: 'rgba(142,31,46,0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  resultBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'rgba(251,246,236,0.6)',
  },
  resultTitle: { fontSize: 23, fontWeight: '900', marginBottom: 4, color: '#5C1420', textAlign: 'center' },
  resultSubtitle: { fontSize: 13, opacity: 0.65, color: '#5C1420', marginBottom: 18, textAlign: 'center' },
  resultTotalPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
});
