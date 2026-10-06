import Header from "@/components/header";
import FeedCard from "@/components/home/feedCard";
import FeedCardSkeleton from "@/components/home/feedCardSkeleton";
import FeedTabs, { TABS } from "@/components/home/feedTabs";
import QuickActions from "@/components/home/quickActions";
import EmptyState from "@/components/ui/emptyState";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { postService } from "@/service/post.service";
import { usePostsSocket } from "@/service/usePostsSocket";
import { useFeedCacheStore } from "@/store/feedCacheStore";
import { useAuthStore } from "@/store/authStore";
import { useSyncSignal } from "@/hooks/useSyncSignal";
import { syncKeys } from "@/store/syncStore";
import { useFocusEffect, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// How often to quietly check for posts published by other users while the
// screen is focused (own posts arrive instantly via NEW_POST_PUBLISHED).
const NEW_POSTS_POLL_INTERVAL = 30000;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const TAB_SLUGS = {
  "For You": "for-you",
  Following: "following",
  Campus: "campus",
} as const;

type TabName = keyof typeof TAB_SLUGS;

export default function HomeScreen() {

  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  const [activeTab, setActiveTab] = useState<TabName>("For You");
  const [posts, setPosts] = useState<any[]>([]);
  // Posts that exist (ours just-published, or someone else's picked up by
  // the background poll) but haven't been revealed yet — shown as a
  // "New posts" banner, like X, instead of silently jumping the feed.
  const [pendingNewPosts, setPendingNewPosts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const showFeedSkeleton = useDelayedLoading(loading);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [gridHeight, setGridHeight] = useState<number>(0);
  const [showFloatingQuickActions, setShowFloatingQuickActions] = useState<boolean>(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState<boolean>(false);

  // Locally cached feed
  const feedCachePosts = useFeedCacheStore((state) => state.postsByTab);
  const feedCacheRehydrated = useFeedCacheStore((state) => state.rehydrated);
  const setFeedCachePosts = useFeedCacheStore((state) => state.setCachedPosts);

  const postsTabRef = useRef<TabName | null>(null);

  const headerAnim = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const isHiddenRef = useRef(false);

  const hideBars = () => {
    if (!isHiddenRef.current) {
      isHiddenRef.current = true;
      setIsHeaderSticky(true);
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();

      navigation.setOptions({
        tabBarStyle: { display: "none" },
      });
    }
  };

  const showBars = () => {
    if (isHiddenRef.current) {
      isHiddenRef.current = false;
      setIsHeaderSticky(false);
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      navigation.setOptions({
        tabBarStyle: { display: "flex" },
      });
    }
  };

  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    setHeaderHeight(event.nativeEvent.layout.height);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const currentOffsetY = contentOffset.y;
    const maxOffsetY = Math.max(0, contentSize.height - layoutMeasurement.height);

    if (currentOffsetY <= 10) {
      setShowFloatingQuickActions(false);
      showBars();
      lastScrollY.current = currentOffsetY;
      return;
    }

    if (currentOffsetY >= maxOffsetY - 1) {
      lastScrollY.current = maxOffsetY;
      return;
    }

    const diff = currentOffsetY - lastScrollY.current;

    if (diff > 10) {
      setShowFloatingQuickActions(true);
      hideBars();
    } else if (diff < -10) {
      showBars();
    }

    lastScrollY.current = currentOffsetY;
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        showBars();
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => backHandler.remove();
    }, [])
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Dedupe impression views within this session — never re-fire for a post
  // the user has already scrolled past once.
  const viewedPostIds = useRef<Set<string>>(new Set());

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].item) {
        setActivePostId(viewableItems[0].item.id);
      }

      for (const token of viewableItems) {
        const postId = token.item?.id;
        if (!postId || viewedPostIds.current.has(postId)) continue;
        viewedPostIds.current.add(postId);
        postService.recordPostView(postId).catch(() => {});
      }
    }
  ).current;


  const fetchFeed = useCallback(
    async (selectedTab: TabName, isRefreshing = false) => {
      try {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        const tabSlug = TAB_SLUGS[selectedTab] || "for-you";
        const response = await postService.getFeed({ tab: tabSlug, limit: 10 });

        if (response && response.items) {
          postsTabRef.current = selectedTab;
          setPosts(response.items);
          setNextCursor(response.nextCursor || response.meta?.nextCursor || null);
          setHasMore(
            Boolean(
              response.nextCursor || response.meta?.nextCursor || response.hasMore
            )
          );

          if (response.items.length > 0) setActivePostId(response.items[0].id);
          else setActivePostId(null);

          // The fresh fetch may already include posts that were only sitting
          // in the "New posts" banner — drop those so tapping the banner
          // later can't re-insert a duplicate, and clear it entirely once
          // nothing pending is left to reveal.
          setPendingNewPosts((prev) => {
            if (!prev) return prev;
            const freshIds = new Set(response.items.map((p: any) => p.id));
            const stillPending = prev.filter((p) => !freshIds.has(p.id));
            return stillPending.length > 0 ? stillPending : null;
          });
        } else {
          setPosts([]);
          setNextCursor(null);
          setHasMore(false);
        }
      } catch (error) {
        console.error(`Error fetching feed for ${selectedTab}:`, error);
        if (postsTabRef.current !== selectedTab) {
          setPosts([]);
        }
        setNextCursor(null);
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  const fetchMorePosts = async () => {
    if (loadingMore || loading || refreshing || !hasMore || !nextCursor) return;

    try {
      setLoadingMore(true);
      const tabSlug = TAB_SLUGS[activeTab] || "for-you";
      const response = await postService.getFeed({
        tab: tabSlug,
        limit: 10,
        cursor: nextCursor,
      });

      if (response && response.items && response.items.length > 0) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNewItems = response.items.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...uniqueNewItems];
        });

        const newCursor = response.nextCursor || response.meta?.nextCursor || null;
        setNextCursor(newCursor);
        setHasMore(Boolean(newCursor));
      } else {
        setHasMore(false);
        setNextCursor(null);
      }
    } catch (error) {
      console.error("Error fetching more posts:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed(activeTab);
  }, [activeTab, fetchFeed]);

  useEffect(() => {
    if (!feedCacheRehydrated || posts.length > 0) return;
    const cached = feedCachePosts[TAB_SLUGS[activeTab]] || [];
    if (cached.length > 0) {
      postsTabRef.current = activeTab;
      setPosts(cached);
      setActivePostId(cached[0].id);
    }
  }, [feedCacheRehydrated, feedCachePosts, activeTab, posts.length]);

  useEffect(() => {
    if (posts.length === 0 || postsTabRef.current !== activeTab) return;
    const timer = setTimeout(() => {
      setFeedCachePosts(TAB_SLUGS[activeTab], posts);
    }, 600);
    return () => clearTimeout(timer);
  }, [posts, activeTab, setFeedCachePosts]);

  // Queues a post into the "New posts" banner instead of writing straight
  // into the visible feed — shared by our own just-published post and by
  // posts broadcast in real time from other users.
  const queuePendingPost = useCallback((newPost: any) => {
    setPendingNewPosts((prev) => {
      if (prev?.some((p) => p.id === newPost.id)) return prev;
      return prev ? [newPost, ...prev] : [newPost];
    });
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "NEW_POST_PUBLISHED",
      queuePendingPost,
    );
    return () => subscription.remove();
  }, [queuePendingPost]);

  // A published post is queued with a temporary id while it uploads. Swap it
  // for the real server post once the background upload settles, or drop it if
  // the server rejected it — so the feed never keeps a phantom entry.
  useEffect(() => {
    const confirmed = DeviceEventEmitter.addListener(
      "NEW_POST_CONFIRMED",
      ({ tempId, post: confirmedPost }: { tempId: string; post: any }) => {
        if (!tempId || !confirmedPost) return;
        setPosts((prev) =>
          prev.map((p) => (p.id === tempId ? confirmedPost : p)),
        );
        setPendingNewPosts((prev) =>
          prev ? prev.map((p) => (p.id === tempId ? confirmedPost : p)) : prev,
        );
      },
    );
    const removed = DeviceEventEmitter.addListener(
      "NEW_POST_REMOVED",
      ({ tempId }: { tempId: string }) => {
        if (!tempId) return;
        setPosts((prev) => prev.filter((p) => p.id !== tempId));
        setPendingNewPosts((prev) =>
          prev ? prev.filter((p) => p.id !== tempId) : prev,
        );
      },
    );
    return () => {
      confirmed.remove();
      removed.remove();
    };
  }, []);

  // Real-time: broadcast from the backend the instant ANY user publishes a
  // post, so "New posts" shows up for everyone online instead of waiting on
  // the background poll below.
  usePostsSocket({
    onPostCreated: (post) => {
      const currentUserId = useAuthStore.getState().user?.id;
      const authorId = post?.user?.id || post?.userId;
      // Our own post already arrives via NEW_POST_PUBLISHED right after we
      // publish — skip it here to avoid double-queuing the same post.
      if (authorId && currentUserId && authorId === currentUserId) return;
      if (posts.some((p) => p.id === post.id)) return;
      queuePendingPost(post);
    },
  });

  // Real-time: when any user updates their profile (frame, picture, name),
  // patch every post in the feed that belongs to that user so the UI
  // reflects the change without a manual refresh.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "PROFILE_FRAME_UPDATED",
      (data: { userId: string; profileFrame?: string | null; profilePictureUrl?: string | null; username?: string | null; firstName?: string | null; lastName?: string | null }) => {
        if (!data?.userId) return;
        setPosts((prev) =>
          prev.map((post) => {
            if (post?.user?.id !== data.userId) return post;
            return {
              ...post,
              user: {
                ...post.user,
                ...(data.profileFrame !== undefined && { profileFrame: data.profileFrame }),
                ...(data.profilePictureUrl !== undefined && { profilePictureUrl: data.profilePictureUrl }),
                ...(data.username !== undefined && { username: data.username }),
                ...(data.firstName !== undefined && { firstName: data.firstName }),
                ...(data.lastName !== undefined && { lastName: data.lastName }),
              },
            };
          })
        );
      },
    );
    return () => sub.remove();
  }, []);

  // Background check for posts other users published while we're already
  // looking at the feed — surfaced the same way as our own just-published
  // post: a "New posts" banner instead of silently rewriting what's on screen.
  const checkForNewPosts = useCallback(async () => {
    if (pendingNewPosts) return;
    try {
      const tabSlug = TAB_SLUGS[activeTab] || "for-you";
      const response = await postService.getFeed({ tab: tabSlug, limit: 10 });
      const items = response?.items || [];
      if (items.length === 0) return;

      const existingIds = new Set(posts.map((p) => p.id));
      const freshItems = items.filter((p: any) => !existingIds.has(p.id));
      if (freshItems.length > 0) {
        setPendingNewPosts(freshItems);
      }
    } catch {
      // Best-effort background check — ignore failures, next poll will retry.
    }
  }, [activeTab, posts, pendingNewPosts]);

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(checkForNewPosts, NEW_POSTS_POLL_INTERVAL);
      return () => clearInterval(interval);
    }, [checkForNewPosts]),
  );

  // Reveals whatever's pending: prepends it to the feed and scrolls up so
  // the new post(s) are actually visible, whether triggered by tapping the
  // banner or by re-tapping the already-active Home tab icon.
  const handleShowNewPosts = useCallback(() => {
    if (!pendingNewPosts || pendingNewPosts.length === 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      return;
    }
    setPosts((prev) => [...pendingNewPosts, ...prev]);
    setPendingNewPosts(null);
    flatListRef.current?.scrollToOffset({
      offset: headerHeight + gridHeight,
      animated: true,
    });
  }, [pendingNewPosts, headerHeight, gridHeight]);

  // Re-tapping the Home tab icon while already on Home jumps to the new
  // post(s) if any are pending, otherwise just scrolls to the top.
  useEffect(() => {
    const unsubscribe = (navigation as any).addListener?.(
      "tabPress",
      (e: any) => {
        if (!navigation.isFocused?.()) return;
        e.preventDefault?.();
        handleShowNewPosts();
      },
    );
    return unsubscribe;
  }, [navigation, handleShowNewPosts]);

  const handlePostUpdated = useCallback((postId: string, updatedFields: any) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === postId ? { ...post, ...updatedFields } : post))
    );
  }, []);

  const handleTabChange = (newTab: TabName) => {
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  const handlePostHidden = useCallback((postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  }, []);

  const handlePostDeleted = useCallback((postId: string) => {
    // 1. Remove from the visible screen immediately.
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

    // 2. Drop it from the persisted cache so a later rehydrate / re-fetch cannot
    //    bring the deleted post back into the home feed.
    useFeedCacheStore.getState().markPostDeleted(postId);

    // 3. Don't refetch yet — the delete is still syncing. The sync signal below
    //    refetches once it settles, which also restores the post if it failed.
  }, []);

  // Stable renderItem identity + stable FeedCard callbacks so React.memo on
  // FeedCard can skip re-renders. `isParentActive` is a boolean, so only the
  // previously- and newly-active cards re-render when the active post changes.
  const renderFeedItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <FeedCard
        post={item}
        isFirst={index === 0}
        onPostUpdated={handlePostUpdated}
        onPostHidden={handlePostHidden}
        onPostDeleted={handlePostDeleted}
        isParentActive={item.id === activePostId}
      />
    ),
    [activePostId, handlePostUpdated, handlePostHidden, handlePostDeleted]
  );

  // Refetch when a background post write (edit/delete) settles, so cursors and
  // counts stay consistent without the card waiting on the network.
  useSyncSignal(syncKeys.posts, () => fetchFeed(activeTab, true));

  const feedStartOffset = headerHeight + gridHeight;

  const snapOffsets = useMemo(() => {
    if (posts.length === 0) return [0];
    return [0, ...posts.map((_, i) => feedStartOffset + i * SCREEN_HEIGHT)];
  }, [posts.length, feedStartOffset]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: feedStartOffset + index * SCREEN_HEIGHT,
      index,
    }),
    [feedStartOffset]
  );

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 60,
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-headerHeight, 0],
                }),
              },
            ],
          }}
          onLayout={handleHeaderLayout}
          pointerEvents="box-none"
        >
          <Header
            transparent={true}
            showProfile={false}
            showBrandTitle={false}
            feedTabs={
              <FeedTabs
                activeTab={activeTab}
                onSelectTab={handleTabChange}
                isSticky={isHeaderSticky}
              />
            }
          />
        </Animated.View>

        {pendingNewPosts && pendingNewPosts.length > 0 && (
          <TouchableOpacity
            style={[styles.newPostsBanner, { top: headerHeight + 10 }]}
            onPress={handleShowNewPosts}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-up" size={14} color="#fff" />
            <Text style={styles.newPostsBannerText}>
              {pendingNewPosts.length === 1
                ? "New post"
                : `${pendingNewPosts.length} new posts`}
            </Text>
          </TouchableOpacity>
        )}

        <FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: headerHeight,
          }}
          ListHeaderComponent={
            <View onLayout={(e) => setGridHeight(e.nativeEvent.layout.height)}>
              <QuickActions />
            </View>
          }
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToOffsets={snapOffsets}
          snapToAlignment="start"
          decelerationRate={0.85}
          disableIntervalMomentum={true}
          // `bounces` must stay enabled on iOS — RefreshControl relies on the
          // scroll view's rubber-band overscroll at the top to reveal the
          // pull-to-refresh spinner. `bounces={false}` (previously set here,
          // presumably to keep the snapped card feed from wobbling) silently
          // disabled pull-to-refresh entirely on iOS.
          overScrollMode="never"
          getItemLayout={getItemLayout}
          renderItem={renderFeedItem}
          onEndReached={fetchMorePosts}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color="#7c3aed"
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              showFeedSkeleton ? <FeedCardSkeleton /> : null
            ) : (
              <View className="py-6">
                <EmptyState
                  title={`No posts in ${activeTab}`}
                  message="Be the first to create a post or check back later for updates."
                  buttonText="Refresh Feed"
                  onPress={() => fetchFeed(activeTab, true)}
                />
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchFeed(activeTab, true)}
              tintColor="#7c3aed"
            />
          }
          showsVerticalScrollIndicator={false}
        />

        {showFloatingQuickActions && <QuickActions isFloating={true} />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  newPostsBanner: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#7c3aed",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  newPostsBannerText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});