import ContributorList from "@/components/pastQuestions/contributorList";
import DocumentViewerModal from "@/components/pastQuestions/documentViewerModal";
import QuestionList, {
  PastQuestionListItem,
} from "@/components/pastQuestions/questionList";
import SectionHeader from "@/components/pastQuestions/sectionHeader";
import { QuestionListSkeleton } from "@/components/pastQuestions/pastQuestionSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthHeader from "@/components/auth/authHeader";
import { showError } from "@/components/ui/toast";
import { pastQuestionsService } from "@/service/pastQuestions.service";
import { useAuthStore } from "@/store/authStore";

function mapQuestion(item: any): PastQuestionListItem {
  return {
    id: item.id,
    courseCode: item.courseCode || item.course || "—",
    course: item.course || item.courseTitle || "Untitled",
    year: item.year || item.session || "—",
    semester: item.semester || item.examType || "—",
    downloads: item.downloads ?? item.downloadsCount ?? 0,
    hasAccess: Boolean(item.hasAccess),
    priceCoins: item.priceCoins ?? 0,
    uploaderId: item.uploaderId ?? item.uploader?.id,
  };
}

function EmptyQuestions({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <ThemedView style={styles.emptyCard}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="document-text-outline" size={32} color="#6C47FF" />
      </View>
      <ThemedText style={styles.emptyTitle}>{title}</ThemedText>
      {subtitle ? (
        <ThemedText style={styles.emptySubtitle}>{subtitle}</ThemedText>
      ) : null}
    </ThemedView>
  );
}

export default function PastQuestionsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currentUserId = useAuthStore((state) => state.user?.id);

  // Department past questions
  const [departmentQuestions, setDepartmentQuestions] = useState<
    PastQuestionListItem[]
  >([]);
  const [departmentLoading, setDepartmentLoading] = useState(true);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const showQuestionsSkeleton = useDelayedLoading(departmentLoading);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerFileUrl, setViewerFileUrl] = useState<string | null>(null);
  const [viewerFileName, setViewerFileName] = useState<string | undefined>(
    undefined,
  );
  // The open past question, if the viewer can report it (not their own upload).
  const [viewerReportId, setViewerReportId] = useState<string | null>(null);

  const fetchDepartmentQuestions = useCallback(async () => {
    try {
      setDepartmentLoading(true);
      setDepartmentError(null);

      const response = await pastQuestionsService.listDepartment({
        page: 1,
        limit: 5,
      });

      const items = Array.isArray(response) ? response : response?.items || [];
      const mapped = items.map(mapQuestion);

      setDepartmentQuestions(mapped);
    } catch (err: any) {
      console.error(
        "[PastQuestionsScreen] ❌ Error in fetchDepartmentQuestions:",
        {
          message: err?.message,
          status: err?.response?.status,
          responseData: err?.response?.data,
          error: err,
        },
      );

      setDepartmentError(err?.message || t("pastQ.failedToLoad"));
    } finally {
      setDepartmentLoading(false);
    }
  }, []);

  // Refetch whenever the screen regains focus
  useFocusEffect(
    useCallback(() => {
      fetchDepartmentQuestions();
    }, [fetchDepartmentQuestions]),
  );

  const handleViewOrPurchase = useCallback(
    async (id: string) => {
      try {
        setLoadingId(id);

        // Idempotent: free for the uploader, free items, and anything the
        // viewer already purchased — otherwise this charges coins first.
        const result = await pastQuestionsService.purchase(id);

        const firstFile =
          (Array.isArray(result?.files) && result.files[0]) || result?.file;
        const directUrl =
          firstFile?.uri ||
          firstFile?.url ||
          result?.url ||
          result?.downloadUrl;

        if (!directUrl) {
          showError(t("pastQ.noDownloadLink"));
          return;
        }

        setViewerFileUrl(directUrl);
        setViewerFileName(firstFile?.name);
        const uploaderId = departmentQuestions.find((q) => q.id === id)?.uploaderId;
        setViewerReportId(uploaderId && uploaderId === currentUserId ? null : id);
        setViewerVisible(true);
      } catch (err: any) {
        console.error(
          "[PastQuestionsScreen] ❌ Error opening past question:",
          {
            message: err?.message,
            responseData: err?.response?.data,
            error: err,
          },
        );

        const message =
          err?.response?.data?.message?.[0] ||
          err?.response?.data?.message ||
          err?.message ||
          t("pastQ.failedToLoad") + ".";
        showError(Array.isArray(message) ? message.join(", ") : message);
      } finally {
        setLoadingId(null);
      }
    },
    [t, currentUserId, departmentQuestions],
  );

  const handleCloseViewer = useCallback(() => {
    setViewerVisible(false);
    setViewerFileUrl(null);
    setViewerFileName(undefined);
    setViewerReportId(null);
  }, []);
  const handleRefresh = () => {
    fetchDepartmentQuestions();
  };

  return (
    <ThemedView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="default" />
        <AuthHeader
          title={t("materials.pastQuestions")}
          subtitle={t("materials.subtitle")}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6C47FF"
            />
          }
        >
          {/* Banner */}
          <ThemedView className="bg-transparent">
            <Image
              source={{
                uri: "https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946853/pas-question-hero_zj4gys.png",
              }}
              className="w-full h-44 rounded-3xl"
              resizeMode="cover"
            />
          </ThemedView>

          <SectionHeader title={t("searchResults.courses")} action="" />

          {departmentLoading ? (
            // Focus refetches keep the list on screen; only an empty list shows the skeleton
            departmentQuestions.length > 0 ? (
              <QuestionList
                questions={departmentQuestions}
                onPress={handleViewOrPurchase}
                loadingId={loadingId}
              />
            ) : showQuestionsSkeleton ? (
              <QuestionListSkeleton />
            ) : null
          ) : departmentError ? (
            <ThemedView
              style={[styles.errorCard, { backgroundColor: colors.card }]}
            >
              <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
              <ThemedText style={styles.errorText}>
                {t("pastQ.failedToLoad")}
              </ThemedText>
              <TouchableOpacity
                style={styles.retryButton}
                activeOpacity={0.85}
                onPress={fetchDepartmentQuestions}
              >
                <ThemedText style={styles.retryButtonText}>
                  {t("misc.tryAgain")}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : departmentQuestions.length === 0 ? (
            <EmptyQuestions
              title={t("pastQ.noDownloadLink")}
              subtitle="Be the first to upload one for your classmates!"
            />
          ) : (
            <QuestionList
              questions={departmentQuestions}
              onPress={handleViewOrPurchase}
              loadingId={loadingId}
            />
          )}

          <SectionHeader title="Top Contributors" action="" />

          <ContributorList />
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[
            styles.fab,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
          ]}
          onPress={() => router.push("/addPastQestion" as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <DocumentViewerModal
          visible={viewerVisible}
          fileUrl={viewerFileUrl}
          fileName={viewerFileName}
          onClose={handleCloseViewer}
          report={
            viewerReportId
              ? { targetType: "past_question", targetId: viewerReportId }
              : undefined
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 30,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 50,
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
  centerContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
  },
  emptyIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(108, 71, 255, 0.08)",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  errorCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    height: 40,
    paddingHorizontal: 20,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
