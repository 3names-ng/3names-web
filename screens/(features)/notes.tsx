import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useColorScheme } from "nativewind";
import {
  Image,
  Modal,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CategoryTabs from "@/components/notes/categoryTabs";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft } from "lucide-react-native";
import { notesService } from "@/service/notes.service";
import { showError } from "@/components/ui/toast";
import { createOptimisticId, useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import getRelativeTime from "@/service/helper";
import AuthHeader from "@/components/auth/authHeader";
import { useNoteCacheStore } from "@/store/noteCacheStore";
import NoteSkeleton from "@/components/notes/noteSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";

export type NoteCategory = "Classes" | "Personal" | "General";

export interface Note {
  id: string;
  title: string;
  content: string;
  department?: string;
  category: NoteCategory;
  isPinned: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

const CATEGORY_TABS: string[] = [
  "All Notes",
  "Classes",
  "Personal",
  "Bookmarks",
];

export default function NotesScreen() {
  const [selectedTab, setSelectedTab] = useState<string>("All Notes");
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
const insets = useSafeAreaInsets();
  const placeholderColor = isDark ? "#9CA3AF" : "#6B7280";

  // Start from the persisted cache when it's already loaded (e.g. returning to
  // the screen), so notes appear instantly instead of behind a loader.
  const [notes, setNotes] = useState<Note[]>(() => {
    const cache = useNoteCacheStore.getState();
    return cache.rehydrated ? cache.notes : [];
  });
  // const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Offline cache (persisted to AsyncStorage) — lets notes display without network
  const cachedNotes = useNoteCacheStore((state) => state.notes);
  const notesCacheRehydrated = useNoteCacheStore((state) => state.rehydrated);
  const mergeCachedNotes = useNoteCacheStore((state) => state.mergeCachedNotes);
  const setCachedNotes = useNoteCacheStore((state) => state.setCachedNotes);
  const upsertCachedNote = useNoteCacheStore((state) => state.upsertCachedNote);
  const removeCachedNote = useNoteCacheStore((state) => state.removeCachedNote);

  // Modals & Form States
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [isReaderVisible, setIsReaderVisible] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const [titleInput, setTitleInput] = useState("");
  const [departmentInput, setDepartmentInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<NoteCategory>("General");


  


// 1. Component State
const [searchQuery, setSearchQuery] = useState("");
const [selectedCategory, setSelectedCategory] = useState<NoteCategory | "All">("All");


// 1. Debounce state for search query
const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

// Debounce effect: Updates debouncedSearchQuery 300ms after user stops typing
useEffect(() => {
  const handler = setTimeout(() => {
    setDebouncedSearchQuery(searchQuery);
  }, 600);

  return () => {
    clearTimeout(handler);
  };
}, [searchQuery]);

// 2. Fetch notes using debounced search value and selected category
const loadNotes = useCallback(async () => {
  try {
    setIsLoading(true);

    // Ensure state variable matches (selectedCategory instead of selectedTab)
    const categoryFilter =
      selectedCategory === "All" ? undefined : selectedCategory;
    const searchFilter = debouncedSearchQuery.trim() || undefined;

    const fetchedNotes = await notesService.getNotes(searchFilter, categoryFilter);
    setNotes(fetchedNotes);
    // Keep a local snapshot so notes still show when offline. An unfiltered
    // fetch is the full list, so it replaces the cache; filtered ones merge.
    if (!searchFilter && !categoryFilter) {
      setCachedNotes(fetchedNotes);
    } else {
      mergeCachedNotes(fetchedNotes);
    }
  } catch (error) {
    // Offline / network error — cached notes stay on screen, so only tell the
    // user when there's nothing to show.
    if (useNoteCacheStore.getState().notes.length === 0) {
      showError(t("notes.title"), t("notes.failedToFetch"));
    }
  } finally {
    setIsLoading(false);
  }
}, [debouncedSearchQuery, selectedCategory, mergeCachedNotes, setCachedNotes]);

// 3. Refetch in the background when the debounced query or category changes.
// Waits for the cache to rehydrate so the stale disk copy can't overwrite the
// fresh server list afterwards.
useEffect(() => {
  if (!notesCacheRehydrated) return;
  loadNotes();
}, [loadNotes, notesCacheRehydrated]);

// 3b. Show persisted notes immediately (works offline) while the network fetch runs
useEffect(() => {
  if (!notesCacheRehydrated || notes.length > 0) return;
  if (cachedNotes.length > 0) {
    setNotes(cachedNotes);
  }
}, [notesCacheRehydrated, cachedNotes, notes.length]);

// 4. Refresh handler
const handleRefresh = async () => {
  try {
    setIsRefreshing(true);
    const categoryFilter = selectedCategory === "All" ? undefined : selectedCategory;
    const searchFilter = searchQuery.trim() || undefined;

    const fetchedNotes = await notesService.getNotes(searchFilter, categoryFilter);
    setNotes(fetchedNotes);
    if (!searchFilter && !categoryFilter) {
      setCachedNotes(fetchedNotes);
    } else {
      mergeCachedNotes(fetchedNotes);
    }
  } catch (error) {
    showError(t("notes.title"), t("notes.failedToRefresh"));
  } finally {
    setIsRefreshing(false);
  }
};

const handleTogglePin = async (id: string) => {
  const targetNote = notes.find((n) => n.id === id);
  if (!targetNote) return;

  const updatedPinState = !targetNote.isPinned;

  // Optimistic Update
  setNotes((prevNotes) =>
    prevNotes.map((item) =>
      item?.id === id ? { ...item, isPinned: updatedPinState } : item
    )
  );
  if (activeNote && activeNote.id === id) {
    setActiveNote({ ...activeNote, isPinned: updatedPinState });
  }

  try {
    // Call the dedicated endpoint on the backend
    const updatedNote = await notesService.togglePin(id);
    
    // Ensure state matches backend response
    setNotes((prevNotes) =>
      prevNotes.map((item) => (item?.id === id ? updatedNote : item))
    );
    upsertCachedNote(updatedNote);
  } catch (error) {
    // Rollback on error
    setNotes((prevNotes) =>
      prevNotes.map((item) =>
        item?.id === id ? { ...item, isPinned: !updatedPinState } : item
      )
    );
    if (activeNote && activeNote.id === id) {
      setActiveNote({ ...activeNote, isPinned: !updatedPinState });
    }
    showError(t("notes.title"), t("notes.failedToPin"));
  }
};

const handleToggleBookmark = async (id: string) => {
  const targetNote = notes.find((n) => n.id === id);
  if (!targetNote) return;

  const updatedBookmarkState = !targetNote.isBookmarked;

  // Optimistic Update
  setNotes((prevNotes) =>
    prevNotes.map((item) =>
      item?.id === id ? { ...item, isBookmarked: updatedBookmarkState } : item
    )
  );
  if (activeNote && activeNote.id === id) {
    setActiveNote({ ...activeNote, isBookmarked: updatedBookmarkState });
  }

  try {
    // Call the dedicated endpoint on the backend
    const updatedNote = await notesService.toggleBookmark(id);
    
    // Ensure state matches backend response
    setNotes((prevNotes) =>
      prevNotes.map((item) => (item?.id === id ? updatedNote : item))
    );
    upsertCachedNote(updatedNote);
  } catch (error) {
    // Rollback on error
    setNotes((prevNotes) =>
      prevNotes.map((item) =>
        item?.id === id ? { ...item, isBookmarked: !updatedBookmarkState } : item
      )
    );
    if (activeNote && activeNote.id === id) {
      setActiveNote({ ...activeNote, isBookmarked: !updatedBookmarkState });
    }
    showError(t("notes.title"), t("notes.failedToBookmark"));
  }
};

// Optimistic save: write the note into local state (and the offline cache)
// immediately, close the editor, and let the request reconcile in the
// background — rolling back if the server rejects it.
const saveNoteMutation = useOptimisticMutation<
  Note,
  { note: Note; previous: Note | null }
>({
  apply: ({ note, previous }) => {
    if (previous) {
      setNotes((prevNotes) =>
        prevNotes.map((item) => (item?.id === previous.id ? note : item))
      );
      setActiveNote((current) => (current?.id === previous.id ? note : current));
    } else {
      setNotes((prevNotes) => [note, ...prevNotes]);
    }
    upsertCachedNote(note);
  },
  rollback: ({ note, previous }) => {
    if (previous) {
      setNotes((prevNotes) =>
        prevNotes.map((item) => (item?.id === previous.id ? previous : item))
      );
      setActiveNote((current) =>
        current?.id === previous.id ? previous : current
      );
      upsertCachedNote(previous);
    } else {
      setNotes((prevNotes) => prevNotes.filter((item) => item?.id !== note.id));
      removeCachedNote(note.id);
    }
  },
  request: ({ note, previous }) =>
    previous
      ? notesService.updateNote(previous.id, {
          title: note.title,
          department: note.department || "General",
          content: note.content,
          category: note.category,
        })
      : notesService.createNote({
          title: note.title,
          department: note.department || "General",
          content: note.content,
          category: note.category,
        }),
  onSuccess: (serverNote, { note }) => {
    // Swap the optimistic entry for the server's copy. For a new note the id
    // changes, so drop the temp one first. The editor is already closed, so
    // only the list/cache need reconciling.
    if (serverNote?.id && serverNote.id !== note.id) {
      removeCachedNote(note.id);
    }
    if (serverNote?.id) {
      upsertCachedNote(serverNote);
      setNotes((prevNotes) =>
        prevNotes.map((item) => (item?.id === note.id ? serverNote : item))
      );
    }
  },
  onError: () => showError(t("notes.title"), t("notes.failedToSave")),
});

const handleSaveNote = () => {
  const title = titleInput.trim();
  const content = contentInput.trim();

  if (!title || !content) {
    showError(t("notes.title"), t("notes.missingFields"));
    return;
  }

  const department = departmentInput.trim() || "General";
  const previous = activeNote;

  const optimisticNote: Note = previous
    ? { ...previous, title, department, content, category: categoryInput }
    : {
        id: createOptimisticId("note"),
        title,
        department,
        content,
        category: categoryInput,
        isPinned: false,
        isBookmarked: false,
        createdAt: new Date().toISOString(),
      };

  setIsSaving(true);
  saveNoteMutation.run({ note: optimisticNote, previous }).finally(() =>
    setIsSaving(false)
  );

  // Editor closes right away — the request continues in the background.
  closeEditor();
};

const handleDeleteNote = (id: string) => {
  Alert.alert(t("notes.deleteNote"), t("notes.deleteConfirm"), [
    { text: t("action.cancel"), style: "cancel" },
    {
      text: t("action.delete"),
      style: "destructive",
      onPress: async () => {
        try {
          await notesService.deleteNote(id);
          setNotes((prevNotes) => prevNotes.filter((item) => item?.id !== id));
          removeCachedNote(id);
          setIsReaderVisible(false);
        } catch (error) {
          showError(t("notes.title"), t("notes.failedToDelete"));
        }
      },
    },
  ]);
};

  const openNewNoteModal = () => {
    setActiveNote(null);
    setTitleInput("");
    setDepartmentInput("");
    setContentInput("");
    setCategoryInput("General");
    setIsEditorVisible(true);
  };

  const openEditNoteModal = (note: Note) => {
    setActiveNote(note);
    setTitleInput(note.title);
    setDepartmentInput(note.department || "");
    setContentInput(note.content);
    setCategoryInput(note.category || "General");
    setIsReaderVisible(false);
    setIsEditorVisible(true);
  };

  const openReaderModal = (note: Note) => {
    setActiveNote(note);
    setIsReaderVisible(true);
  };

  const closeEditor = () => {
    setIsEditorVisible(false);
    setActiveNote(null);
    setTitleInput("");
    setDepartmentInput("");
    setContentInput("");
    setCategoryInput("General");
  };

  const pinnedNotes = useMemo(() => {
    return notes.filter((n) => n.isPinned);
  }, [notes]);

  const unpinnedFilteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (n.isPinned) return false;

      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.department &&
          n.department.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedTab === "Bookmarks") return n.isBookmarked;
      if (selectedTab === "Classes") return n.category === "Classes";
      if (selectedTab === "Personal") return n.category === "Personal";

      return true;
    });
  }, [notes, searchQuery, selectedTab]);

  // Only a first visit with nothing cached waits on the network; otherwise the
  // cached notes show while the fetch runs in the background.
  const hasNothingToShow = notes.length === 0 && cachedNotes.length === 0;
  const showSkeleton = useDelayedLoading(
    hasNothingToShow && (isLoading || !notesCacheRehydrated),
  );

  return (
    <ThemedView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
       <AuthHeader 
            title={t("notes.title")} 
            subtitle={t("notes.subtitle")} 
          />
        {hasNothingToShow && (isLoading || !notesCacheRehydrated) ? (
          // Empty for the first moment so fast responses don't flash a skeleton.
          showSkeleton ? <NoteSkeleton /> : null
        ) : (
          <FlatList
            data={unpinnedFilteredNotes}
            keyExtractor={(item) => item?.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListHeaderComponent={
              <ThemedView style={{ backgroundColor: "transparent" }}>
                {/* Banner */}
                <ThemedView
                  style={[
                    styles.bannerContainer,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <Image
                    source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946843/note-hero_ygz8vr.png"}}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                </ThemedView>

                {/* Search Bar */}
                <ThemedView
                  style={[
                    styles.searchContainer,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.searchInput,
                      {
                        borderWidth: 1,
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: isDark ? "#111827" : "#F9FAFB",
                      },
                    ]}
                    placeholder={t("notes.searchPlaceholder")}
                    placeholderTextColor={placeholderColor}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </ThemedView>

                {/* Category Filter Tabs */}
                <CategoryTabs
                  tabs={CATEGORY_TABS}
                  selected={selectedTab}
                  onSelect={setSelectedTab}
                />

                {/* Pinned Section */}
                {pinnedNotes.length > 0 && (
                  <ThemedView
                    style={[
                      styles.sectionContainer,
                      { backgroundColor: "transparent" },
                    ]}
                  >
                    <ThemedText style={styles.sectionHeader}>
                      Pinned ({pinnedNotes.length})
                    </ThemedText>
                    <FlatList
                      horizontal
                      data={pinnedNotes}
                      keyExtractor={(item) => item?.id}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 12 }}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.pinnedCard,
                            {
                              borderWidth: 1,
                              borderColor: colors.border,
                              backgroundColor: isDark ? "#111827" : "#FFFFFF",
                            },
                          ]}
                          onPress={() => openReaderModal(item)}
                          activeOpacity={0.8}
                        >
                          <ThemedView
                            style={[
                              styles.cardHeaderRow,
                              { backgroundColor: "transparent" },
                            ]}
                          >
                            <ThemedText
                              style={[styles.noteTag, { color: colors.primary }]}
                            >
                              { item?.category}
                            </ThemedText>
                            <TouchableOpacity
                              onPress={() => handleTogglePin(item?.id)}
                            >
                              <ThemedView
                                className="flex-row items-center rounded-full px-3 py-2"
                                style={{
                                  backgroundColor: isDark ? "#312E81" : "#F3EEFF",
                                }}
                              >
                                <MaterialCommunityIcons
                                  name="pin"
                                  size={18}
                                  color={colors.primary}
                                />
                                <ThemedText
                                  className="ml-1.5 text-sm font-bold"
                                  style={{
                                    color: colors.primary,
                                  }}
                                >
                                  Pinned
                                </ThemedText>
                              </ThemedView>
                            </TouchableOpacity>
                          </ThemedView>
                          <ThemedText
                            style={[styles.pinnedTitle, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {item?.title}
                          </ThemedText>
                          <ThemedText
                            style={[
                              styles.pinnedPreview,
                              { color: colors.text, opacity: 0.7 },
                            ]}
                            numberOfLines={2}
                          >
                            {item?.content}
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    />
                  </ThemedView>
                )}

                <ThemedText style={[styles.sectionHeader, { marginTop: 16 }]}>
                  {selectedTab === "All Notes" ? "Recent Notes" : selectedTab}
                </ThemedText>
              </ThemedView>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.noteCard,
                  {
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: isDark ? "#111827" : "#FFFFFF",
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => openReaderModal(item)}
              >
                <ThemedView
                  style={[
                    styles.noteCardHeader,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <ThemedText style={[styles.noteTag, { color: colors.primary }]}>
                    {item?.category}
                  </ThemedText>
                  <ThemedView
                    style={[
                      styles.cardActionsRow,
                      { backgroundColor: "transparent" },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleToggleBookmark(item?.id)}
                    >
                      <Ionicons
                        name={item?.isBookmarked ? "bookmark" : "bookmark-outline"}
                        size={18}
                        color={item?.isBookmarked ? "#F59E0B" : colors.border}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleTogglePin(item?.id)}>
                      <MaterialCommunityIcons
                        name={item?.isPinned ? "pin" : "pin-outline"}
                        size={18}
                        color={item?.isPinned ? colors.primary : colors.border}
                      />
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>

                <ThemedText
                  style={[styles.noteTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item?.title}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.notePreview,
                    { color: colors.text, opacity: 0.7 },
                  ]}
                  numberOfLines={2}
                >
                  {item?.content}
                </ThemedText>
                <ThemedText
                  style={[styles.noteDate, { color: colors.text, opacity: 0.5 }]}
                >
                  {getRelativeTime(item?.createdAt)}
                </ThemedText>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <ThemedView
                style={[
                  styles.emptyContainer,
                  { backgroundColor: "transparent" },
                ]}
              >
                <ThemedText style={[styles.emptyText, { color: colors.text }]}>
                  {t("notes.noNotes")}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.emptySubtext,
                    { color: colors.text, opacity: 0.6 },
                  ]}
                >
                  {t("notes.noNotesHint")}
                </ThemedText>
              </ThemedView>
            }
          />
        )}

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[
            styles.fab,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
          ]}
          onPress={openNewNoteModal}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* EDITOR MODAL */}
        <Modal
          visible={isEditorVisible}
          animationType="slide"
          onRequestClose={closeEditor}
        >
        <ThemedView
      style={[
        styles.modalContainer,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top, 
          paddingBottom: insets.bottom,
        },
      ]}
    >
            <KeyboardAvoidingView
              behavior="padding"
              style={{ flex: 1 }}
            >
              <ThemedView
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <TouchableOpacity onPress={closeEditor} disabled={isSaving}>
                  <ThemedText
                    style={[
                      styles.cancelButton,
                      { color: colors.text, opacity: 0.7 },
                    ]}
                  >
                    {t("action.cancel")}
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                  {activeNote ? t("notes.editNote") : t("notes.newNote")}
                </ThemedText>
                <TouchableOpacity onPress={handleSaveNote} disabled={isSaving}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <ThemedText
                      style={[styles.saveButton, { color: colors.primary }]}
                    >
                      {t("action.save")}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </ThemedView>

              <ScrollView
                contentContainerStyle={styles.editorBody}
                keyboardShouldPersistTaps="handled"
              >
                {/* Category Picker */}
                <ThemedText
                  style={[
                    styles.fieldLabel,
                    { color: colors.text, opacity: 0.7 },
                  ]}
                >
                  {t("notes.category")}
                </ThemedText>
                <ThemedView style={styles.categoryPickerRow}>
                  {(["General", "Classes", "Personal"] as NoteCategory[]).map(
                    (cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          {
                            borderColor: colors.border,
                            backgroundColor: isDark ? "#111827" : "#F9FAFB",
                          },
                          categoryInput === cat && {
                            borderColor: colors.primary,
                            backgroundColor: colors.primary,
                          },
                        ]}
                        onPress={() => setCategoryInput(cat)}
                      >
                        <ThemedText
                          style={[
                            styles.categoryChipText,
                            { color: colors.text },
                            categoryInput === cat && { color: "#FFFFFF" },
                          ]}
                        >
                          {cat}
                        </ThemedText>
                      </TouchableOpacity>
                    )
                  )}
                </ThemedView>

                <TextInput
                  style={[
                    styles.titleInput,
                    {
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: isDark ? "#111827" : "#F9FAFB",
                    },
                  ]}
                  placeholder={t("notes.noteTitle")}
                  placeholderTextColor={placeholderColor}
                  value={titleInput}
                  onChangeText={setTitleInput}
                />

                <TextInput
                  style={[
                    styles.contentInput,
                    {
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: isDark ? "#111827" : "#F9FAFB",
                    },
                  ]}
                  placeholder={t("notes.noteContent")}
                  placeholderTextColor={placeholderColor}
                  multiline
                  scrollEnabled={true}
                  textAlignVertical="top"
                  value={contentInput}
                  onChangeText={setContentInput}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </ThemedView>
        </Modal>

        {/* READER MODAL */}
        <Modal
          visible={isReaderVisible}
          animationType="slide"
          onRequestClose={() => setIsReaderVisible(false)}
        >
          <ThemedView
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background,
                paddingTop: insets.top, 
                paddingBottom: insets.bottom,
               },
            ]}
          >
            {activeNote && (
              <ThemedView
                style={{ flex: 1, backgroundColor: colors.background }}
              >
                <ThemedView
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={() => setIsReaderVisible(false)}
                  >
                    <ThemedText
                      style={[
                        styles.cancelButton,
                        { color: colors.text, opacity: 0.7 },
                      ]}
                    >
                      <ArrowLeft size={20} color={colors.text} />
                    </ThemedText>
                  </TouchableOpacity>

                  <ThemedView
                    style={[
                      styles.readerActions,
                      { backgroundColor: "transparent" },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleToggleBookmark(activeNote.id)}
                    >
                      <Ionicons
                        name={
                          activeNote.isBookmarked
                            ? "bookmark"
                            : "bookmark-outline"
                        }
                        size={22}
                        color={
                          activeNote.isBookmarked ? "#F59E0B" : colors.border
                        }
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleTogglePin(activeNote.id)}
                    >
                      <MaterialCommunityIcons
                        name={activeNote.isPinned ? "pin" : "pin-outline"}
                        size={22}
                        color={
                          activeNote.isPinned ? colors.primary : colors.border
                        }
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openEditNoteModal(activeNote)}
                    >
                      <ThemedText
                        style={[styles.editButton, { color: colors.primary }]}
                      >
                        {t("action.edit")}
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteNote(activeNote.id)}
                    >
                      <ThemedText style={styles.deleteButton}>
                        {t("action.delete")}
                      </ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>

                <ScrollView
                  style={[
                    styles.readerBody,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <ThemedView
                    style={[
                      styles.readerMeta,
                      { backgroundColor: "transparent" },
                    ]}
                  >
                    <ThemedText
                      style={[styles.noteTag, { color: colors.primary }]}
                    >
                      {activeNote.category}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.noteDate,
                        { color: colors.text, opacity: 0.5 },
                      ]}
                    >
                      {getRelativeTime(activeNote.createdAt)}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText
                    style={[styles.readerTitle, { color: colors.text }]}
                  >
                    {activeNote.title}
                  </ThemedText>
                  <ThemedView
                    style={[styles.divider, { backgroundColor: colors.border }]}
                  />
                  <ThemedText
                    style={[
                      styles.readerContent,
                      { color: colors.text, opacity: 0.85 },
                    ]}
                  >
                    {activeNote.content}
                  </ThemedText>
                </ScrollView>
              </ThemedView>
            )}
          </ThemedView>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  heroImage: {
    width: "100%",
    height: 140,
    borderRadius: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchInput: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginVertical: 12,
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  pinnedCard: {
    borderRadius: 16,
    padding: 14,
    width: 220,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pinnedTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  pinnedPreview: {
    fontSize: 13,
    lineHeight: 18,
  },
  listContainer: {
    paddingBottom: 100,
    gap: 12,
  },
  noteCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
  },
  noteCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  noteTag: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
    textTransform: "uppercase",
  },
  noteDate: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  notePreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 40,
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "700",
  },
  readerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  editButton: {
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
  editorBody: {
    padding: 20,
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryPickerRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  titleInput: {
    fontSize: 17,
    fontWeight: "700",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deptInput: {
    fontSize: 14,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contentInput: {
    minHeight: 160,
    maxHeight: 350,
    fontSize: 16,
    borderRadius: 12,
    padding: 16,
  },
  readerBody: {
    padding: 20,
  },
  readerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  readerTitle: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 32,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  readerContent: {
    fontSize: 16,
    lineHeight: 26,
  },
});