import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

export interface TaggableUser {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string | null;
  avatar?: string;
}

export interface TagPeopleListContentProps {
  onClose: () => void;
  tagListMode: "followers" | "following" | "everyone";
  onTagListModeChange: (mode: "followers" | "following") => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  debouncedSearchQuery: string;
  taggedUsers: TaggableUser[];
  isLoadingUsers: boolean;
  isLoadingMoreUsers: boolean;
  availableUsers: TaggableUser[];
  usersCursor: string | null;
  onLoadMore: () => void;
  onToggleUser: (user: TaggableUser) => void;
}

/**
 * The tag-picker UI with no Modal/SafeAreaView wrapper of its own, so it can
 * be dropped into whichever native Modal is already presented (avoids
 * stacking a second/third native Modal, which can fail to show or hang).
 */
export function TagPeopleListContent({
  onClose,
  tagListMode,
  onTagListModeChange,
  searchQuery,
  onSearchQueryChange,
  debouncedSearchQuery,
  taggedUsers,
  isLoadingUsers,
  isLoadingMoreUsers,
  availableUsers,
  usersCursor,
  onLoadMore,
  onToggleUser,
}: TagPeopleListContentProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.contentContainer}>
      <View style={[styles.modalHeaderBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.modalCloseButtonSmall}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { marginLeft: 8 }]}>
          {t("explore.tagPeople")}
        </ThemedText>
        <View style={styles.modalCloseButtonSmall} />
      </View>

      <View style={styles.tagModeRow}>
        {[
          { key: "followers", label: t("explore.followers") },
          { key: "following", label: t("explore.following") },
        ].map((option) => {
          const isActive = tagListMode === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.tagModeButton,
                isActive && { backgroundColor: colors.primary },
              ]}
              onPress={() =>
                onTagListModeChange(option.key as "followers" | "following")
              }
            >
              <Text
                style={[
                  styles.tagModeButtonText,
                  isActive && { color: "#fff" },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputWrapper,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.muted || "#9CA3AF"} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={
              tagListMode === "everyone"
                ? t("explore.searchTagUser")
                : t("explore.searchTagMode", { mode: tagListMode })
            }
            placeholderTextColor={colors.muted || "#9CA3AF"}
            value={searchQuery}
            onChangeText={onSearchQueryChange}
          />
        </View>
      </View>

      <View style={styles.modalSummary}>
        <ThemedText style={styles.modalSummaryText}>
          {t("explore.selected", { count: taggedUsers.length })}
        </ThemedText>
        {taggedUsers.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.taggedRow}
          >
            {taggedUsers.map((user) => (
              <View key={user.id} style={styles.taggedUserPill}>
                <Text style={styles.taggedUserPillText}>
                  @{user.username || user.firstName || "user"}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {isLoadingUsers ? (
        <View style={styles.tagModalLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={availableUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tagModalList}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (usersCursor && tagListMode !== "everyone") {
              onLoadMore();
            }
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <ThemedText style={{ color: colors.muted, fontSize: 14 }}>
                {tagListMode === "everyone" && !debouncedSearchQuery
                  ? t("explore.typeToSearch")
                  : t("explore.noUsersToTag", { mode: tagListMode })}
              </ThemedText>
            </View>
          }
          ListFooterComponent={
            isLoadingMoreUsers ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : null
          }
          renderItem={({ item }) => {
            const isSelected = taggedUsers.some((user) => user.id === item.id);
            const avatarUri = item.profilePictureUrl || item.avatar;

            return (
              <TouchableOpacity
                onPress={() => onToggleUser(item)}
                style={styles.tagUserRow}
              >
                <View style={styles.tagUserLeft}>
                  <Image
                    source={{ uri: avatarUri || "https://via.placeholder.com/100" }}
                    style={styles.tagUserAvatar}
                  />
                  <View>
                    <ThemedText style={styles.tagUserName}>
                      {item?.username || "unknown"}
                    </ThemedText>
                  </View>
                </View>
                <View
                  style={[
                    styles.tagSelectIndicator,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

interface TagPeopleModalProps extends TagPeopleListContentProps {
  visible: boolean;
}

/**
 * Fullscreen Modal wrapper around TagPeopleListContent, for use where the
 * tag picker is opened directly (not from inside another already-open
 * Modal, such as the media-post editing screen).
 */
export default function TagPeopleModal({ visible, ...contentProps }: TagPeopleModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      statusBarTranslucent={false}
      visible={visible}
      animationType="slide"
      onRequestClose={contentProps.onClose}
      presentationStyle="overFullScreen"
    >
      <SafeAreaView
        style={[
          styles.safeArea,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
        edges={["top", "bottom"]}
      >
        <TagPeopleListContent {...contentProps} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  modalCloseButtonSmall: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    minHeight: 40,
  },
  modalSummary: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalSummaryText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  tagModeRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
    columnGap: 10,
  },
  tagModeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  tagModeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  taggedRow: {
    flexDirection: "row",
  },
  taggedUserPill: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  taggedUserPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  tagModalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tagModalList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyStateContainer: {
    padding: 28,
    alignItems: "center",
  },
  tagUserRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tagUserLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagUserAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D1D5DB",
  },
  tagUserName: {
    fontSize: 15,
    fontWeight: "700",
  },
  tagSelectIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
