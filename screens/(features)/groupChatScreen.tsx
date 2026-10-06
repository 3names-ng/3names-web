import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { showError, showSuccess } from "@/components/ui/toast";
import { Ionicons } from "@expo/vector-icons";
import { AlertBanner } from "@/components/alertBanner";
import * as ImagePicker from "expo-image-picker";

import { Group, GroupsApi } from "@/service/groupChat.service";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { usePerks } from "@/hooks/usePerks";
import { Gesture, GestureDetector, Directions } from "react-native-gesture-handler";
import AuthHeader from "@/components/auth/authHeader";
import { GroupListSkeleton } from "@/components/chat/messageSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { useMessageCacheStore } from "@/store/messageCacheStore";

type CategoryType =
  | "official"
  | "school"
  | "faculty"
  | "department"
  | "default";

type TabType = "default" | "mine";

export default function GroupsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { hasPerk } = usePerks();
  const [showPerkBanner, setShowPerkBanner] = useState(false);

  // Active Top Tab State
  const [activeTab, setActiveTab] = useState<TabType>("mine");

  // Screen Data State
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [defaultGroups, setDefaultGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const showGroupsSkeleton = useDelayedLoading(loading);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Offline cache for the group list (shows saved groups instantly)
  const cacheRehydrated = useMessageCacheStore((state) => state.rehydrated);
  const loadCachedGroupList = useMessageCacheStore(
    (state) => state.loadCachedGroupList,
  );
  const setCachedGroupList = useMessageCacheStore(
    (state) => state.setCachedGroupList,
  );

  // Show the saved group list immediately (works offline), then refresh
  useEffect(() => {
    if (!cacheRehydrated) return;
    const cached = loadCachedGroupList();
    if (cached.mine?.length || cached.default?.length) {
      setMyGroups((cached.mine as Group[]) || []);
      setDefaultGroups((cached.default as Group[]) || []);
      setLoading(false);
    }
  }, [cacheRehydrated, loadCachedGroupList]);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [newGroupDesc, setNewGroupDesc] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Fetch groups function — never show a full-screen spinner if we already
  // have data (cached or otherwise); just refresh silently in the background.
  const fetchGroups = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else if (myGroups.length === 0 && defaultGroups.length === 0) setLoading(true);

    try {
      const [mineData, defaultData] = await Promise.all([
        GroupsApi.listMine(),
        GroupsApi.getDefaultGroups ? GroupsApi.getDefaultGroups() : Promise.resolve([]),
      ]);
      setMyGroups(mineData || []);
      setDefaultGroups(defaultData || []);
      setCachedGroupList({ mine: mineData || [], default: defaultData || [] });

    } catch (error: any) {
      showError(error.response?.data?.message || "Offline — showing your saved groups.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }    }, [setCachedGroupList, myGroups.length, defaultGroups.length]);

  // Refresh groups when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

 

  // Navigate directly to the chat screen (Lazy Auto-Join handled on backend/chat screen)
  const navigateToGroup = (group: Group) => {
    router.push({
      pathname: "/(features)/groupDetailScreen",
      params: { id: group?.id, groupName: group?.name },
    });
  };

  // Image Picker Handler
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showError("Permission to access gallery is required to pick an icon.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
    }
  };

  // Reset Modal Form
  const resetForm = () => {
    setNewGroupName("");
    setNewGroupDesc("");
    setSelectedImage(null);
    setIsCreateModalOpen(false);
  };

  // Handle Group Creation
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      showError("Please enter a group name.");
      return;
    }

    setIsCreating(true);

    try {
      const iconPayload = selectedImage
        ? {
            uri: selectedImage.uri,
            name: selectedImage.fileName || "group-icon.jpg",
            type: selectedImage.mimeType || "image/jpeg",
          }
        : undefined;

      const createdGroup = await GroupsApi.createGroup(
        newGroupName.trim(),
        newGroupDesc.trim() || undefined,
        iconPayload
      );

      showSuccess("Group created successfully!");

      resetForm();
      await fetchGroups(true);

      // Optionally auto-navigate to the newly created group chat directly
      if (createdGroup?.id) {
        navigateToGroup(createdGroup);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || "Could not create group. Try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Filtered List based on Active Tab & Search Query
  const displayedGroups = useMemo(() => {
  
    const source =
      activeTab === "default"
        ? defaultGroups
        : myGroups.filter((g) => g.type !== "default");
    if (!searchQuery.trim()) return source;
    const query = searchQuery.toLowerCase();
    return source.filter(
      (g) =>
        g.name.toLowerCase().includes(query) ||
        g.description?.toLowerCase().includes(query)
    );
  }, [activeTab, myGroups, defaultGroups, searchQuery]);

  const getGroupCategory = (group: Group): CategoryType => {
    if (group.isOfficial) return "official";
    const typeLower = (group.name || "").toLowerCase();

    if (
      typeLower.includes("school") ||
      typeLower.includes("university") ||
      typeLower.includes("campus")
    ) {
      return "school";
    }
    if (typeLower.includes("faculty")) return "faculty";
    if (typeLower.includes("department") || typeLower.includes("dept")) {
      return "department";
    }

    return "default";
  };

 const renderGroupAvatar = (group: Group) => {
  if (group.iconUrl) {
    return (
      <Image
        source={{ uri: group.iconUrl }}
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        resizeMode="cover"
      />
    );
  }

  const category = getGroupCategory(group);

  switch (category) {
    case "official":
      return (
        <View
          style={{ borderWidth: 1, borderColor: colors.border }}
          className="w-12 h-12 rounded-full bg-blue-500/10 justify-center items-center"
        >
          <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
        </View>
      );
    case "school":
      return (
        <View
          style={{ borderWidth: 1, borderColor: colors.border }}
          className="w-12 h-12 rounded-full bg-emerald-500/10 justify-center items-center"
        >
          <Ionicons name="school" size={24} color="#10b981" />
        </View>
      );
    case "faculty":
      return (
        <View
          style={{ borderWidth: 1, borderColor: colors.border }}
          className="w-12 h-12 rounded-full bg-purple-500/10 justify-center items-center"
        >
          <Ionicons name="business" size={24} color="#a855f7" />
        </View>
      );
    case "department":
      return (
        <View
          style={{ borderWidth: 1, borderColor: colors.border }}
          className="w-12 h-12 rounded-full bg-amber-500/10 justify-center items-center"
        >
          <Ionicons name="library" size={24} color="#f59e0b" />
        </View>
      );
    default:
      return (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card || "#27272a",
          }}
          className="w-12 h-12 rounded-full justify-center items-center"
        >
          <ThemedText className="font-bold text-base">
            {group.name?.charAt(0).toUpperCase() || "G"}
          </ThemedText>
        </View>
      );
  }
};

  const renderGroupItem = ({ item }: { item: Group }) => {
    const unreadCount = item.unreadCount ?? 0;

    return (
      <TouchableOpacity
        style={{
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
        className="flex-row items-center p-3.5 mb-2.5 mt-1 rounded-2xl active:opacity-70"
        activeOpacity={0.7}
        onPress={() => navigateToGroup(item)}
      >
        <View className="mr-3.5 relative">{renderGroupAvatar(item)}</View>

        <View className="flex-1 justify-center">
          <View className="flex-row items-center justify-between mb-0.5">
            <ThemedText
              className={`text-base flex-1 mr-2 ${
                unreadCount > 0 ? "font-extrabold" : "font-semibold"
              }`}
              numberOfLines={1}
            >
              {item.name}
            </ThemedText>
          </View>

          {item.description ? (
            <ThemedText
              style={{
                color: unreadCount > 0 ? colors.text : colors.muted || "#a1a1aa",
              }}
              className={`text-xs ${unreadCount > 0 ? "font-medium" : "font-normal"}`}
              numberOfLines={1}
            >
              {item.description}
            </ThemedText>
          ) : (
            <ThemedText
              style={{ color: colors.muted || "#71717a" }}
              className="text-xs italic"
            >
              No description
            </ThemedText>
          )}
        </View>

        {/* Unread Badge / Navigation Indicator */}
        <View className="ml-3 items-end justify-center min-w-[24px]">
          {unreadCount > 0 ? (
            <View className="bg-blue-600 rounded-full h-5 px-1.5 min-w-[20px] justify-center items-center shadow-sm">
              <ThemedText className="text-white text-[11px] font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </ThemedText>
            </View>
          ) : (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.muted || "#71717a"}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AlertBanner
        visible={showPerkBanner}
        onClose={() => setShowPerkBanner(false)}
        message="Reach Level 7 (Leader) to create groups"
        themeColors={{
          cardBg: colors.warningLight,
          border: colors.warning,
          textSecondary: colors.muted || '#6B7280',
          accent: colors.primary,
        }}
      />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* Header */}
    <AuthHeader
  title="Group Chat"
  subtitle="Connect, chat, and engage with your communities"
/>

      {/* Main List Body */}
      <ThemedView className="flex-1 px-4 py-6 pt-3">
        {/* Top Segmented Tab Switcher with Swipe */}
      <GestureDetector
        gesture={Gesture.Fling()
          .direction(Directions.LEFT | Directions.RIGHT)
          .onEnd((e) => {
            const tx = (e as any).translationX ?? (e as any).changeX ?? 0;
            if (tx < -30) {
              setActiveTab("default");
            } else if (tx > 30) {
              setActiveTab("mine");
            }
          })}
      >
<View
  style={{
    borderColor: colors.border,
    backgroundColor: colors.card || "transparent",
    borderWidth: 1,
  }}
  className="flex-row rounded-xl p-1 mb-3"
>
  <TouchableOpacity
    style={{
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: activeTab === "mine" ? "#2563EB" : "transparent",
    }}
    onPress={() => setActiveTab("mine")}
    activeOpacity={0.8}
  >
    <ThemedText
      style={{
        fontSize: 12,
        fontWeight: "700",
        color: activeTab === "mine" ? "#FFFFFF" : colors.text,
        textShadowColor: "rgba(0,0,0,0.1)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
      }}
    >
      My Groups
    </ThemedText>
  </TouchableOpacity>

  <TouchableOpacity
    style={{
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: activeTab === "default" ? "#2563EB" : "transparent",
    }}
    onPress={() => setActiveTab("default")}
    activeOpacity={0.8}
  >
    <ThemedText
      style={{
        fontSize: 12,
        fontWeight: "700",
        color: activeTab === "default" ? "#FFFFFF" : colors.text,
        textShadowColor: "rgba(0,0,0,0.1)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
      }}
    >
      Explore Communities
    </ThemedText>
  </TouchableOpacity>
</View>
      </GestureDetector>

        {/* Search Input */}
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card || "transparent",
          }}
          className="rounded-xl h-11 px-3.5 flex-row items-center mb-3"
        >
          <Ionicons
            name="search"
            size={16}
            color={colors.muted || "#71717a"}
            className="mr-2"
          />
          <TextInput
            className="flex-1 text-sm py-1.5 px-2"
            style={{ color: colors.text }}
            placeholder={
              activeTab === "default"
                ? t("group.searchDefault")
                : t("group.searchMy")
            }
            placeholderTextColor={colors.muted || "#71717a"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {loading && myGroups.length === 0 && defaultGroups.length === 0 ? (
          showGroupsSkeleton ? <GroupListSkeleton /> : null
        ) : (
          <FlatList
            data={displayedGroups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroupItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchGroups(true)}
                tintColor="#3b82f6"
              />
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-16 px-6">
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card || "transparent",
                  }}
                  className="w-16 h-16 rounded-full justify-center items-center mb-4"
                >
                  <Ionicons
                    name="people"
                    size={28}
                    color={colors.muted || "#71717a"}
                  />
                </View>
                <ThemedText className="font-bold text-base text-center mb-1">
                  {searchQuery
                    ? "No matching groups"
                    : activeTab === "mine"
                    ? "No Groups Joined Yet"
                    : "No default groups available"}
                </ThemedText>
                <ThemedText
                  style={{ color: colors.muted || "#a1a1aa" }}
                  className="text-xs text-center leading-5"
                >
                  {searchQuery
                    ? `We couldn't find any group matching "${searchQuery}".`
                    : activeTab === "mine"
                    ? "Default groups appear under the Default tab and are joined automatically when you open them. You can also create your own group."
                    : "Default groups will appear here once they're available."}
                </ThemedText>
              </View>
            }
          />
        )}
      </ThemedView>

      {/* Group Creation Modal */}
      <Modal
        visible={isCreateModalOpen}
        animationType="slide"
        transparent
        onRequestClose={resetForm}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-end bg-black/60">
            <KeyboardAvoidingView
              behavior="padding"
              style={{
                backgroundColor: colors.card || "#18181b",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderWidth: 1,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              }}
              className="p-6"
            >
              <View className="flex-row justify-between items-center mb-4">
                <ThemedText className="text-xl font-bold">
                  Create New Group
                </ThemedText>
                <TouchableOpacity onPress={resetForm} className="p-1">
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Group Icon Selector */}
              <View className="items-center mb-5">
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  }}
                  className="w-20 h-20 rounded-full justify-center items-center overflow-hidden relative"
                >
                  {selectedImage ? (
                    <Image
                      source={{ uri: selectedImage.uri }}
                      className="w-full h-full"
                    />
                  ) : (
                    <Ionicons
                      name="camera"
                      size={28}
                      color={colors.muted || "#71717a"}
                    />
                  )}
                </TouchableOpacity>
                <ThemedText
                  style={{ color: colors.muted || "#a1a1aa" }}
                  className="text-xs mt-1.5"
                >
                  {selectedImage
                    ? "Tap to change icon"
                    : "Add group icon (optional)"}
                </ThemedText>
              </View>

              {/* Group Name Input */}
              <View className="mb-4">
                <ThemedText className="text-xs font-semibold mb-1.5">
                  Group Name *
                </ThemedText>
                <TextInput
                  style={{
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  }}
                  className="p-3 rounded-xl text-sm"
                  placeholder="e.g. Computer Science 2026"
                  placeholderTextColor={colors.muted || "#71717a"}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                />
              </View>

              {/* Group Description Input */}
              <View className="mb-6">
                <ThemedText className="text-xs font-semibold mb-1.5">
                  Description
                </ThemedText>
                <TextInput
                  style={{
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  className="p-3 rounded-xl text-sm"
                  placeholder="Describe the purpose of this group..."
                  placeholderTextColor={colors.muted || "#71717a"}
                  multiline
                  numberOfLines={3}
                  value={newGroupDesc}
                  onChangeText={setNewGroupDesc}
                />
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 pt-2 mb-14">
                <TouchableOpacity
                  className={`flex-1 py-3.5 rounded-2xl justify-center items-center flex-row active:scale-[0.98] ${
                    isCreating ? "bg-blue-400 opacity-80" : "bg-blue-600"
                  }`}
                  onPress={handleCreateGroup}
                  disabled={isCreating}
                  activeOpacity={0.85}
                >
                  {isCreating ? (
                    <View className="flex-row items-center justify-center">
                      <ActivityIndicator
                        size="small"
                        color="#ffffff"
                        className="mr-2"
                      />
                      <ThemedText className="font-bold text-sm text-white">
                        Creating...
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText className="font-bold text-sm text-white tracking-wide">
                      Create Group
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Floating Action Button */}
            {/* Floating Action Button — locked if user lacks "Create Groups" perk */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: hasPerk("Create Groups") ? colors.primary : "#6B7280",
            shadowColor: hasPerk("Create Groups") ? colors.primary : "#6B7280",
            opacity: hasPerk("Create Groups") ? 1 : 0.6,
          },
        ]}
        onPress={() => {
          if (!hasPerk("Create Groups")) {
            setShowPerkBanner(true);
            return;
          }
          setIsCreateModalOpen(true);
        }}
        activeOpacity={0.85}
      >
        <Ionicons
          name={hasPerk("Create Groups") ? "add" : "lock-closed"}
          size={28}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 25,
    bottom: 120,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});