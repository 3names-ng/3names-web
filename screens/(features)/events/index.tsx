import { AlertBanner } from "@/components/alertBanner";
import AuthHeader from "@/components/auth/authHeader";
import EventListSkeleton from "@/components/events/eventCardSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useSyncSignal } from "@/hooks/useSyncSignal";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { authService } from "@/service/auth.service";
import { Event, EventCategory, EventsApi } from "@/service/events.service";
import { useAuthStore } from "@/store/authStore";
import { syncKeys } from "@/store/syncStore";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import {
  AlertCircle,
  Balloon,
  Briefcase,
  Calendar,
  CalendarX2,
  Check,
  Clock,
  FileText,
  GraduationCap,
  Grid,
  MapPin,
  MoreVertical,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function EventsScreen() {
  const [activeSegment, setActiveSegment] = useState<string>("Upcoming");
  const [selectedCategory, setSelectedCategory] =
    useState<EventCategory>("All");
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const studentUnion = useAuthStore((state) => state?.user?.studentUnion);

  const [showPerkBanner, setShowPerkBanner] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const showSkeleton = useDelayedLoading(loading);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Student Union Verification Modal & Document Pick State
  const [isVerificationModalVisible, setIsVerificationModalVisible] =
    useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState<boolean>(false);

  // Student Union verification status from the logged-in user
  const studentUnionStatus = user?.studentUnionStatus ?? "none";
  const isSUVerified = Boolean(studentUnion);
  const isSUPending = !isSUVerified && studentUnionStatus === "pending";
  const isSURejected = !isSUVerified && studentUnionStatus === "rejected";

  // Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  // Options Menu Sheet State (3 Dots)
  const [selectedOptionEvent, setSelectedOptionEvent] = useState<Event | null>(
    null,
  );

  // Dynamic palette variables based on theme
  const primaryColor = colors.primary || "#6F3FF5";
  const primaryLightBg = isDark ? "rgba(111, 63, 245, 0.2)" : "#F3E8FF";
  const cardBg = colors.card || (isDark ? "#1F2937" : "#FFFFFF");
  const pillBg = isDark ? "#374151" : "#F3F4F6";
  const subtextColor = colors.text || (isDark ? "#9CA3AF" : "#6B7280");
  const borderColor = colors.border || (isDark ? "#374151" : "#F3F4F6");

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      let rawResponse: any = [];

      if (activeSegment === "Upcoming") {
        rawResponse = await EventsApi.findUpcoming();
      } else if (activeSegment === "Past") {
        rawResponse = await EventsApi.findPast();
      } else {
        rawResponse = await EventsApi.findAll();
      }

      const normalized: Event[] = Array.isArray(rawResponse)
        ? rawResponse
        : (rawResponse?.data ??
          rawResponse?.items ??
          rawResponse?.results ??
          []);

      setEvents(normalized);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSegment]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  // A create/update can still be syncing when this screen mounts, so refetch
  // once the background write settles.
  useSyncSignal(syncKeys.events, fetchEvents);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // --- Handle Action for "Create Event" ---
  const handleCreateEventPress = () => {
    if (studentUnion) {
      router.push("/(features)/events/add" as any);
    } else {
      setIsVerificationModalVisible(true);
    }
  };

  // --- Allow pending/rejected users to review or change their submission ---
  const handleReviewVerification = () => {
    setIsVerificationModalVisible(true);
  };

  // --- Document Picker & Verification Handlers ---
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedDocument(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to select document.");
    }
  };

  const handleSubmitVerification = async () => {
    if (!selectedDocument) {
      Alert.alert(
        "Document Required",
        "Please select a document proving your Student Union status.",
      );
      return;
    }

    try {
      setIsSubmittingDoc(true);

      const response = await authService.submitStudentUnionVerification({
        uri: selectedDocument.uri,
        name: selectedDocument.name || "student-union-proof",
        type: selectedDocument.mimeType || "application/pdf",
      });

      // Sync fresh user (studentUnionStatus = pending) into the auth store
      if (response?.user) {
        updateUser(response.user);
      }

      setIsSubmittingDoc(false);
      setIsVerificationModalVisible(false);
      setSelectedDocument(null);

      Alert.alert(
        "Verification Submitted",
        response?.message ||
          "Your document has been submitted for review. You will be notified once verified.",
      );
    } catch (err: any) {
      setIsSubmittingDoc(false);
      const backendMessage =
        err?.response?.data?.message || err?.response?.data?.data?.message;
      Alert.alert(
        "Submission Failed",
        backendMessage || err.message || "Could not submit document.",
      );
    }
  };

  const openEventDetails = (event: Event) => {
    setSelectedEvent(event);
    setIsModalVisible(true);
  };

  const closeEventDetails = () => {
    setIsModalVisible(false);
    setSelectedEvent(null);
  };

  // --- Handlers for Options / Edit / Delete ---
  const handleOpenOptions = (event: Event) => {
    setSelectedOptionEvent(event);
  };

  const handleCloseOptions = () => {
    setSelectedOptionEvent(null);
  };

  const handleEditEvent = (event: Event) => {
    handleCloseOptions();
    router.push({
      pathname: "/(features)/events/add",
      params: { id: event.id },
    } as any);
  };

  const handleDeleteEvent = (event: Event) => {
    handleCloseOptions();
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (EventsApi.deleteEvent) {
                await EventsApi.deleteEvent(event.id);
              } else if ((EventsApi as any).remove) {
                await (EventsApi as any).remove(event.id);
              }
              setEvents((prev) => prev.filter((item) => item.id !== event.id));
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete event.");
            }
          },
        },
      ],
    );
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (
        selectedCategory !== "All" &&
        event.category?.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [events, selectedCategory]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <AlertBanner
        visible={showPerkBanner}
        onClose={() => setShowPerkBanner(false)}
        message="Only student Union members can create events."
        themeColors={{
          cardBg: colors.warningLight,
          border: colors.warning,
          textSecondary: colors.muted || "#6B7280",
          accent: colors.primary,
        }}
      />
      <AuthHeader title={t("events.title")} subtitle={t("events.subtitle")} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {/* Header Section */}
        <ThemedView style={styles.headerRow}>
          <ThemedView>
            <ThemedText style={styles.title}>Events</ThemedText>
            <ThemedText style={[styles.subtitle, { color: subtextColor }]}>
              Discover what's happening around campus
            </ThemedText>
          </ThemedView>

          {/* Student Union Status Badge - visible on main screen */}
          {/* {user?.studentUnionStatus && (
          <Pressable
            style={styles.suStatusBadge}
            onPress={handleReviewVerification}
          >
            <ShieldCheck size={14} color={studentUnion ? "#10B981" : isSURejected ? "#DC2626" : "#F59E0B"} />
            <ThemedText style={[styles.suStatusText, { color: studentUnion ? "#10B981" : isSURejected ? "#DC2626" : "#F59E0B" }]}>
              {studentUnion ? "SU Verified" : isSUPending ? "SU Pending" : isSURejected ? "SU Rejected" : "SU Verification"}
            </ThemedText>
            {studentUnion && <Check size={12} color="#10B981" />}
          </Pressable>
        )} */}

          <Pressable
            style={[
              styles.createBtn,
              {
                backgroundColor: studentUnion
                  ? primaryLightBg
                  : isSURejected
                    ? "#FEF2F2"
                    : "#F3F4F6",
              },
            ]}
            onPress={
              studentUnion ? handleCreateEventPress : handleReviewVerification
            }
          >
            {studentUnion ? (
              <>
                <Plus size={18} color={primaryColor} />
                <ThemedText
                  style={[styles.createBtnText, { color: primaryColor }]}
                >
                  Create Event
                </ThemedText>
              </>
            ) : (
              <ThemedText
                style={[
                  styles.createBtnText,
                  { color: isSURejected ? "#DC2626" : primaryColor },
                ]}
              >
                {isSURejected ? "Resubmit" : "Create Event"}
              </ThemedText>
            )}
          </Pressable>
        </ThemedView>

        {/* Top Segment Controller */}
        <ThemedView
          style={[
            styles.segmentContainer,
            {
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}
        >
          {[
            { label: "Upcoming", Icon: Calendar },
            { label: "All Events", Icon: Grid },
            { label: "Past", Icon: Clock },
          ].map((item) => {
            const isActive = activeSegment === item.label;
            return (
              <Pressable
                key={item.label}
                style={[
                  styles.segmentItem,
                  isActive && { backgroundColor: primaryLightBg },
                ]}
                onPress={() => setActiveSegment(item.label)}
              >
                <item.Icon
                  size={16}
                  color={isActive ? primaryColor : subtextColor}
                />
                <ThemedText
                  style={[
                    styles.segmentText,
                    { color: subtextColor },
                    isActive && { color: primaryColor },
                  ]}
                >
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {[
            { label: "All", Icon: Grid },
            { label: "Academic", Icon: GraduationCap },
            { label: "Social", Icon: Users },
            { label: "Sports", Icon: Balloon },
            { label: "Arts", Icon: Palette },
            { label: "Professional", Icon: Briefcase },
          ].map((cat) => {
            const isActive = selectedCategory === cat.label;
            return (
              <Pressable
                key={cat.label}
                style={[
                  styles.categoryPill,
                  { backgroundColor: pillBg },
                  isActive && { backgroundColor: primaryLightBg },
                ]}
                onPress={() => setSelectedCategory(cat.label as EventCategory)}
              >
                <cat.Icon
                  size={14}
                  color={isActive ? primaryColor : subtextColor}
                />
                <ThemedText
                  style={[
                    styles.categoryText,
                    { color: subtextColor },
                    isActive && { color: primaryColor },
                  ]}
                >
                  {cat.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Section Header */}
        <ThemedView style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{activeSegment}</ThemedText>
          <ThemedText style={[styles.resultsCount, { color: subtextColor }]}>
            {filteredEvents.length}{" "}
            {filteredEvents.length === 1 ? "event" : "events"}
          </ThemedText>
        </ThemedView>

        {/* Loading State */}
        {loading && showSkeleton && <EventListSkeleton />}

        {/* Error State */}
        {error && !loading && (
          <ThemedView
            style={[
              styles.stateCard,
              { backgroundColor: cardBg, borderColor: borderColor },
            ]}
          >
            <ThemedView style={styles.errorIconWrapper}>
              <AlertCircle size={32} color="#EF4444" />
            </ThemedView>
            <ThemedText style={styles.stateTitle}>
              Failed to load events
            </ThemedText>
            {/* <ThemedText style={[styles.stateSubtext, { color: subtextColor }]}>
              {error}
            </ThemedText> */}
            <Pressable style={styles.retryBtn} onPress={fetchEvents}>
              <RotateCcw size={16} color="#FFFFFF" />
              <ThemedText style={styles.retryText}>Try Again</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEvents.length === 0 && (
          <ThemedView
            style={[
              styles.stateCard,
              { backgroundColor: cardBg, borderColor: borderColor },
            ]}
          >
            <ThemedView
              style={[
                styles.emptyIconWrapper,
                { backgroundColor: primaryLightBg },
              ]}
            >
              <CalendarX2 size={36} color={primaryColor} />
            </ThemedView>
            <ThemedText style={styles.stateTitle}>No events found</ThemedText>
            <ThemedText style={[styles.stateSubtext, { color: subtextColor }]}>
              {selectedCategory !== "All"
                ? `There are no ${selectedCategory.toLowerCase()} events listed right now.`
                : `No ${activeSegment.toLowerCase()} events scheduled at the moment.`}
            </ThemedText>
            {selectedCategory !== "All" && (
              <Pressable
                style={[styles.resetBtn, { backgroundColor: primaryLightBg }]}
                onPress={() => setSelectedCategory("All")}
              >
                <ThemedText
                  style={[styles.resetBtnText, { color: primaryColor }]}
                >
                  Clear Category Filter
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>
        )}

        {/* Dynamic Event List */}
        {!loading &&
          !error &&
          filteredEvents.map((item) => (
            <Pressable key={item.id} onPress={() => openEventDetails(item)}>
              <ThemedView
                style={[styles.eventCard, { borderColor: borderColor }]}
              >
                <Image
                  source={{
                    uri:
                      item.coverImage ||
                      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
                  }}
                  style={styles.cardImage}
                />
                <ThemedView style={styles.cardContent}>
                  <ThemedView style={styles.cardHeaderRow}>
                    <ThemedText style={styles.cardTitle}>
                      {item.title}
                    </ThemedText>
                    {user?.id === item.creatorId && (
                      <Pressable
                        hitSlop={8}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenOptions(item);
                        }}
                        style={styles.moreBtn}
                      >
                        <MoreVertical size={18} color={subtextColor} />
                      </Pressable>
                    )}
                  </ThemedView>

                  <ThemedText
                    style={[styles.cardDesc, { color: subtextColor }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </ThemedText>

                  <ThemedView style={styles.metaRow}>
                    <Calendar size={14} color={subtextColor} />
                    <ThemedText
                      style={[styles.metaText, { color: subtextColor }]}
                    >
                      {item.date} {item.time ? `• ${item.time}` : ""}
                    </ThemedText>
                  </ThemedView>

                  <ThemedView style={styles.metaRow}>
                    <MapPin size={14} color={subtextColor} />
                    <ThemedText
                      style={[styles.metaText, { color: subtextColor }]}
                    >
                      {item.location}
                    </ThemedText>
                  </ThemedView>

                  {item.isPast ? (
                    <ThemedView style={styles.completedRow}>
                      <ThemedView
                        style={[
                          styles.completedBadge,
                          {
                            backgroundColor: isDark
                              ? "rgba(16, 185, 129, 0.2)"
                              : "#D1FAE5",
                          },
                        ]}
                      >
                        <Check size={14} color="#10B981" />
                        <ThemedText style={styles.completedText}>
                          Completed
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  ) : null}
                </ThemedView>
              </ThemedView>
            </Pressable>
          ))}
      </ScrollView>

      {/* Student Union Verification Upload Modal */}
      <Modal
        visible={isVerificationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVerificationModalVisible(false)}
      >
        <Pressable
          style={styles.verificationOverlay}
          onPress={() => setIsVerificationModalVisible(false)}
        >
          <Pressable
            style={[
              styles.verificationCard,
              { backgroundColor: cardBg, borderColor },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.verificationHeader}>
              <View
                style={[
                  styles.shieldBadge,
                  { backgroundColor: primaryLightBg },
                ]}
              >
                <ShieldCheck size={28} color={primaryColor} />
              </View>
              <Pressable
                onPress={() => setIsVerificationModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={subtextColor} />
              </Pressable>
            </View>

            <ThemedText style={styles.verificationTitle}>
              {isSUVerified
                ? "Student Union Verified"
                : isSUPending
                  ? "Verification Under Review"
                  : isSURejected
                    ? "Verification Declined"
                    : "Student Union Verification Required"}
            </ThemedText>
            <ThemedText
              style={[styles.verificationDesc, { color: subtextColor }]}
            >
              {isSUVerified
                ? "Your Student Union status is confirmed. You can create campus events."
                : isSUPending
                  ? "Your document is currently under review. You can select a different document to replace the one under review."
                  : isSURejected
                    ? "Your document was not approved. Please select a different, clearer document and resubmit for review."
                    : "To create campus events, you need to upload proof of your Student Union membership (ID card or official document)."}
            </ThemedText>

            {/* Show current document info when pending or rejected */}
            {isSUPending || isSURejected ? (
              <View
                style={[
                  styles.statusBadge,
                  isSURejected
                    ? { backgroundColor: "#FEE2E2" }
                    : { backgroundColor: "#FEF3C7" },
                ]}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    { color: isSURejected ? "#DC2626" : "#B45309" },
                  ]}
                >
                  {isSURejected ? "❌ Declined" : "⏳ Under Review"}
                </ThemedText>
                {user?.studentUnionDocUrl && (
                  <>
                    <ThemedText
                      style={[styles.currentDocText, { color: subtextColor }]}
                    >
                      Current: {user.studentUnionDocUrl.split("/").pop()}
                    </ThemedText>
                    <Pressable onPress={() => setSelectedDocument(null)}>
                      <ThemedText
                        style={[styles.reviewLinkText, { color: primaryColor }]}
                      >
                        Choose different document
                      </ThemedText>
                    </Pressable>
                  </>
                )}
              </View>
            ) : null}

            <Pressable
              style={[
                styles.uploadBox,
                { borderColor: primaryColor, backgroundColor: primaryLightBg },
              ]}
              onPress={handlePickDocument}
            >
              <Upload size={24} color={primaryColor} />
              <ThemedText
                style={[styles.uploadBoxText, { color: primaryColor }]}
              >
                {selectedDocument
                  ? selectedDocument.name
                  : isSUPending || isSURejected
                    ? "Select Different Document"
                    : "Choose File / Document"}
              </ThemedText>
              <ThemedText
                style={[styles.uploadBoxSubtext, { color: subtextColor }]}
              >
                {isSUPending || isSURejected
                  ? "Tap to choose a different document"
                  : "PNG, JPG, WebP or PDF up to 5MB"}
              </ThemedText>
            </Pressable>

            {/* Show selected document with option to remove */}
            {selectedDocument && (
              <View style={[styles.fileBadge, { borderColor }]}>
                <FileText size={16} color={primaryColor} />
                <ThemedText style={styles.fileName} numberOfLines={1}>
                  {selectedDocument.name}
                </ThemedText>
                <Pressable onPress={() => setSelectedDocument(null)}>
                  <X size={14} color={subtextColor} />
                </Pressable>
              </View>
            )}

            <Pressable
              style={[
                styles.submitBtn,
                { backgroundColor: primaryColor },
                isSubmittingDoc && { opacity: 0.7 },
              ]}
              disabled={isSubmittingDoc}
              onPress={handleSubmitVerification}
            >
              {isSubmittingDoc ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.submitBtnText}>
                  {isSUPending || isSURejected
                    ? "Submit New Document"
                    : "Submit Document"}
                </ThemedText>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Options Menu Bottom Sheet / Modal */}
      <Modal
        visible={!!selectedOptionEvent}
        transparent
        animationType="fade"
        onRequestClose={handleCloseOptions}
      >
        <Pressable style={styles.optionsOverlay} onPress={handleCloseOptions}>
          <ThemedView
            style={[
              styles.optionsContainer,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            <ThemedText style={styles.optionsTitle}>
              {selectedOptionEvent?.title}
            </ThemedText>

            <Pressable
              style={styles.optionItem}
              onPress={() =>
                selectedOptionEvent && handleEditEvent(selectedOptionEvent)
              }
            >
              <Pencil size={18} color={colors.text} />
              <ThemedText style={styles.optionText}>Edit Event</ThemedText>
            </Pressable>

            <Pressable
              style={styles.optionItem}
              onPress={() =>
                selectedOptionEvent && handleDeleteEvent(selectedOptionEvent)
              }
            >
              <Trash2 size={18} color="#EF4444" />
              <ThemedText style={[styles.optionText, { color: "#EF4444" }]}>
                Delete Event
              </ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Modal>

      {/* Event Details Full Screen Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeEventDetails}
      >
        <SafeAreaView
          style={[styles.modalSafeArea, { backgroundColor: colors.background }]}
        >
          {selectedEvent && (
            <ThemedView style={styles.modalContainer}>
              <ThemedView
                style={[
                  styles.floatingHeader,
                  { top: Math.max(insets.top, 16) + 8 },
                ]}
              >
                <Pressable
                  style={[
                    styles.modalIconBtn,
                    { backgroundColor: "rgba(0, 0, 0, 0.4)" },
                  ]}
                  onPress={closeEventDetails}
                >
                  <X size={20} color="#FFFFFF" />
                </Pressable>
              </ThemedView>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <Image
                  source={{
                    uri:
                      selectedEvent.coverImage ||
                      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
                  }}
                  style={styles.modalImage}
                />

                <ThemedView style={styles.modalBody}>
                  {selectedEvent.category && (
                    <ThemedView
                      style={[
                        styles.modalCategoryBadge,
                        { backgroundColor: primaryLightBg },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.modalCategoryText,
                          { color: primaryColor },
                        ]}
                      >
                        {selectedEvent.category}
                      </ThemedText>
                    </ThemedView>
                  )}

                  <ThemedText style={styles.modalTitle}>
                    {selectedEvent.title}
                  </ThemedText>

                  <ThemedView
                    style={[
                      styles.modalMetaCard,
                      { backgroundColor: cardBg, borderColor: borderColor },
                    ]}
                  >
                    <View style={styles.modalMetaRow}>
                      <Calendar size={18} color={primaryColor} />
                      <View style={styles.modalMetaTextWrapper}>
                        <ThemedText style={styles.modalMetaLabel}>
                          Date & Time
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.modalMetaValue,
                            { color: subtextColor },
                          ]}
                        >
                          {selectedEvent.date}{" "}
                          {selectedEvent.time ? `at ${selectedEvent.time}` : ""}
                        </ThemedText>
                      </View>
                    </View>

                    <ThemedView
                      style={[
                        styles.modalDivider,
                        { backgroundColor: borderColor },
                      ]}
                    />

                    <View style={styles.modalMetaRow}>
                      <MapPin size={18} color={primaryColor} />
                      <View style={styles.modalMetaTextWrapper}>
                        <ThemedText style={styles.modalMetaLabel}>
                          Location
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.modalMetaValue,
                            { color: subtextColor },
                          ]}
                        >
                          {selectedEvent.location}
                        </ThemedText>
                      </View>
                    </View>
                  </ThemedView>

                  <ThemedText style={styles.modalSectionHeading}>
                    About Event
                  </ThemedText>
                  <ThemedText
                    style={[styles.modalDescription, { color: subtextColor }]}
                  >
                    {selectedEvent.description ||
                      "No description provided for this event."}
                  </ThemedText>
                </ThemedView>
              </ScrollView>
            </ThemedView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  suStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  suStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  createBtnText: {
    fontWeight: "600",
    fontSize: 13,
  },
  segmentContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    elevation: 2,
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  resultsCount: {
    fontSize: 12,
  },
  centerContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  stateCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  errorIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  stateSubtext: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  resetBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resetBtnText: {
    fontWeight: "600",
    fontSize: 13,
  },

  /* Event Cards */
  eventCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    alignSelf: "center",
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginRight: 4,
  },
  moreBtn: {
    padding: 4,
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 6,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
  },
  completedRow: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  completedText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "600",
  },

  /* Verification Modal Styles */
  verificationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
    // paddingHorizontal: 20,
  },
  verificationCard: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  verificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  shieldBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    padding: 4,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  verificationDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadBoxText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  uploadBoxSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  fileBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  fileName: {
    fontSize: 12,
    flex: 1,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  statusBadge: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  currentDocText: {
    fontSize: 11,
    marginTop: 4,
  },
  reviewLink: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  reviewLinkText: {
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  /* Options Modal Styles */
  optionsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  optionsContainer: {
    width: "100%",
    minHeight: 280,
    paddingVertical: 54,
    paddingHorizontal: 20,
    borderRadius: 16,
    justifyContent: "space-between",
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
  },

  /* Full Screen Modal Styles */
  modalSafeArea: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalImage: {
    width: "100%",
    height: 240,
  },
  modalBody: {
    padding: 20,
  },
  modalCategoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  modalMetaCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  modalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalMetaTextWrapper: {
    flex: 1,
  },
  modalMetaLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  modalMetaValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  modalDivider: {
    height: 1,
    marginVertical: 12,
  },
  modalSectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  floatingHeader: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  modalIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
