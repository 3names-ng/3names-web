import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  Platform,
  Modal,
  ActivityIndicator,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import AuthHeader from '@/components/auth/authHeader';

interface GameItem {
  id: string;
  title: string;
  category: string;
  tag: string;
  tagType: string;
  description: string;
  players: string;
  image: string;
  htmlContent?: string;
  route?: string;
}


const GAMES: GameItem[] = [
  {
    id: 'war-1',
    title: 'Battle Arena',
    category: 'War',
    tag: 'HOT',
    tagType: 'new',
    description: '1v1 real-time quiz battles! Challenge classmates and earn points for your department.',
    players: 'Live',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300',
    route: '/(features)/battle',
  },
  {
    id: 'coin-battle-1',
    title: 'Coin Battle',
    category: 'Challenge',
    tag: 'LIVE',
    tagType: 'hot',
    description: 'Challenge other players to a quiz for Stars. The winner takes the Stars.',
    players: 'Live',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=300',
    route: '/(features)/games/coinBattleStakeScreen',
  },
  {
    id: 'whot-1',
    title: 'Naija Whot',
    category: 'Challenge',
    tag: 'LIVE',
    tagType: 'hot',
    description: 'Classic Naija Whot. Play for Stars against 1–3 opponents. First to empty their hand wins!',
    players: 'Live',
    image: 'https://images.unsplash.com/photo-1541278107931-e006523892df?w=300',
    route: '/(features)/games/whotStakeScreen',
  },
  {
    id: 'treasure-1',
    title: 'Treasure Hunt',
    category: 'Adventure',
    tag: 'WEEKLY',
    tagType: 'new',
    description: 'Find the hidden Mystery Box in the app every week and claim your surprise reward!',
    players: 'Weekly',
    image: 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?w=300',
    route: '/(features)/games/treasureHuntScreen',
  },
  {
    id: '6',
    title: 'Campus Quiz',
    category: 'Trivia',
    tag: 'New',
    tagType: 'new',
    description: '1000+ questions from your department and general knowledge!',
    players: 'Solo',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=300',
    route: '/(features)/games/quizGame',
  },
  {
    id: 'puzzle-2048',
    title: '2048',
    category: 'Puzzle',
    tag: 'NEW',
    tagType: 'new',
    description: 'Swipe to merge tiles and hit 2048! Earn XP and Stars for new milestones and high scores.',
    players: 'Solo',
    image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=300',
    route: '/(features)/games/puzzle2048',
  },
  // {
  //   id: 'word-game-1',
  //   title: 'Word Puzzle',
  //   category: 'Word',
  //   tag: 'DAILY',
  //   tagType: 'new',
  //   description: 'One new word every day. 6 guesses, keep your streak alive, and share your result to the feed!',
  //   players: 'Solo',
  //   image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300',
  //   route: '/(features)/games/wordGame',
  // },
];

export default function GamesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);

  // Destructure colors and colorScheme from hook
  const { colors, isDark } = useTheme();


  const handlePlay = (item: GameItem) => {
    if (item.route) {
      router.push(item.route as any);
    } else {
      setActiveGame(item);
    }
  };

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const filteredGames = useMemo(() => {
    if (!trimmedQuery) return GAMES;
    return GAMES.filter((game) =>
      [game.title, game.category, game.tag, game.description].some((field) =>
        field?.toLowerCase().includes(trimmedQuery),
      ),
    );
  }, [trimmedQuery]);


  const renderGameCard = ({ item }: { item: GameItem }) => (
    <ThemedView
      style={[
        styles.gameCard,
        {
          backgroundColor: colors.card || (isDark ? '#1F2937' : '#FFFFFF'),
          borderColor: colors.border || (isDark ? '#374151' : '#F3F4F6'),
        },
      ]}
    >
      <Image source={{ uri: item.image }} style={styles.gameImage} resizeMode="cover" />

      <View style={styles.gameInfo}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.gameTitle} numberOfLines={1}>
            {item.title}
          </ThemedText>
          {/* {renderTag(item.tag, item.tagType)} */}
        </View>

        <ThemedView
          style={[
            styles.categoryBadge,
            { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' },
          ]}
        >
          <ThemedText style={[styles.categoryBadgeText, { color: colors.primary || '#4F46E5' }]}>
            {item.category}
          </ThemedText>
        </ThemedView>

        <ThemedText style={styles.gameDescription} numberOfLines={2}>
          {item.description}
        </ThemedText>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={13} color={colors.muted || '#666'} />
            <ThemedText style={styles.statText}>{item.players}</ThemedText>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.playButton, { borderColor: colors.primary || '#5B21B6' }]}
        activeOpacity={0.7}
        onPress={() => handlePlay(item)}
      >
        <ThemedText style={[styles.playButtonText, { color: colors.primary || '#5B21B6' }]}>
          Play
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
 <AuthHeader title='Games' subtitle='Play, compete and earn rewards' showBackButton={true}/>
      <FlatList
        data={filteredGames}
        keyExtractor={(item) => item.id}
        renderItem={renderGameCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <ThemedView style={styles.emptyState}>
            <Ionicons name="search-outline" size={36} color={colors.muted || '#8E8E93'} />
            <ThemedText style={styles.emptyStateText}>
              {`No games found for "${searchQuery.trim()}"`}
            </ThemedText>
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <ThemedText style={[styles.emptyStateAction, { color: colors.primary || '#5B21B6' }]}>
                Clear search
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        }
        ListHeaderComponent={
          <>
         
           <ThemedView style={styles.searchRow}>
              <ThemedView
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: colors.card || (isDark ? '#1F2937' : '#FFFFFF'),
                    borderColor: colors.border || (isDark ? '#374151' : '#E5E7EB'),
                  },
                ]}
              >
                <Ionicons name="search-outline" size={20} color={colors.muted || '#8E8E93'} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search games..."
                  placeholderTextColor={isDark ? '#9CA3AF' : '#8E8E93'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </ThemedView>
            </ThemedView>

            {/* Department War Featured Banner */}
            {/* <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/(features)/departmentWar')}
              style={[styles.featuredBanner, { backgroundColor: '#6C3EF4' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="flash" size={28} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <ThemedText style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
                    ⚔️ Department War
                  </ThemedText>
                  <ThemedText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
                    1v1 Quiz Battles · Earn Dept Points
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity> */}

            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                {trimmedQuery ? 'Search Results' : 'All Games'}
              </ThemedText>
              {trimmedQuery ? (
                <ThemedText style={styles.sectionCount}>
                  {`${filteredGames.length} found`}
                </ThemedText>
              ) : null}
            </ThemedView>
          </>
        }
      />

      {/* Play Game Screen Modal */}
      <Modal
        visible={activeGame !== null}
        animationType="slide"
        onRequestClose={() => setActiveGame(null)}
      >
        <SafeAreaView
          style={[
            styles.gameModalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <ThemedView
            style={[
              styles.gameModalHeader,
              {
                backgroundColor: colors.card || (isDark ? '#1F2937' : '#FFFFFF'),
                borderBottomColor: colors.border || (isDark ? '#374151' : '#E5E7EB'),
              },
            ]}
          >
            <ThemedText style={styles.gameModalTitle}>{activeGame?.title}</ThemedText>
            <TouchableOpacity onPress={() => setActiveGame(null)} style={styles.closeModalButton}>
              <Ionicons name="close-circle" size={30} color={colors.text} />
            </TouchableOpacity>
          </ThemedView>

          {activeGame?.htmlContent && Platform.OS === 'web' ? (
            // Browsers can't use react-native-webview — a sandboxed iframe runs the game instead
            <iframe
              srcDoc={activeGame.htmlContent}
              title={activeGame.title}
              sandbox="allow-scripts"
              style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
            />
          ) : activeGame?.htmlContent && (
            <WebView
              originWhitelist={['*']}
              source={{ html: activeGame.htmlContent }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <ThemedView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                  <ActivityIndicator size="large" color={colors.primary || '#5B21B6'} />
                </ThemedView>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.7,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  featuredBanner: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  emptyStateAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  gameCard: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  gameImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  gameInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 15,
    fontWeight: '700',
    maxWidth: '65%',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  gameDescription: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
  },
  playButton: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  gameModalContainer: {
    flex: 1,
  },
  gameModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  gameModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeModalButton: {
    padding: 2,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingBottom: 5,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
  },
  navLabel: {
    fontSize: 10,
    marginTop: 3,
    opacity: 0.7,
  },
  navLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});