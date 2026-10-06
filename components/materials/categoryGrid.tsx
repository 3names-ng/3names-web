import React from "react";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Feather from "@expo/vector-icons/Feather";

import CategoryCard from "./categoryCard";
import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";

export default function CategoryGrid() {
  const { colors } = useTheme();
const router = useRouter();
const { t } = useTranslation();
  return (
    <ThemedView className="mt-4 bg-transparent">
      {/* Header */}
      <ThemedView className="mb-4 flex-row items-center justify-between bg-transparent px-5">
        <ThemedText
          color="primary"
         className="text-2xl font-bold">
          {t("materials.browseCategory")}
        </ThemedText>

      </ThemedView>

      {/* 3 Column Grid */}
      <ThemedView className="flex-row flex-wrap justify-between bg-transparent px-4">


          <ThemedView className="mb-4 w-[31%] bg-transparent">
          <CategoryCard
            title={t("materials.pastQuestions")}
            subtitle={t("materials.pastQuestionsCount")}
            backgroundColor={colors.successLight}
             onPress={() => router.push("/pastQuestionsScreen")}
            icon={
              <MaterialCommunityIcons
                name="file-question"
                size={30}
                color={colors.success}
              />
            }
          />
        </ThemedView>


        <ThemedView className="mb-4 w-[31%] bg-transparent">
          <CategoryCard
            title={t("materials.lectureNotes")}
            subtitle={t("materials.lectureNotesFormat")}
            backgroundColor={colors.primaryLight}
            onPress={() => router.push("/(features)/lectureNotesScreen")}
            icon={
              <Ionicons
                name="document-text"
                size={30}
                color={colors.primary}
              />
            }
          />
        </ThemedView>


      

        <ThemedView className="mb-4 w-[31%] bg-transparent">
          <CategoryCard
            title={t("materials.textbooks")}
            subtitle={t("materials.textbooksDesc")}
            backgroundColor={colors.warningLight}
            onPress={() => router.push("/(features)/textbooksScreen")}
            icon={
              <Ionicons
                name="book"
                size={30}
                color={colors.warning}
              />
            }
          />
        </ThemedView>


        <ThemedView className="mb-4 w-[31%] bg-transparent">
          <CategoryCard
            title={t("materials.projectTopics")}
            subtitle={t("materials.projectTopicsDesc")}
            backgroundColor={colors.dangerLight}
              onPress={() => router.push("/(features)/materials/projectTopics")}
            icon={
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={30}
                color={colors.danger}
              />
            }
          />
        </ThemedView>


        <ThemedView className="mb-4 w-[31%] bg-transparent">
          <CategoryCard
            title={t("materials.assignments")}
            subtitle={t("materials.assignmentsDesc")}
            backgroundColor={colors.infoLight}
            onPress={() => router.push("/(features)/assignmentsScreen")}
            icon={
              <Feather
                name="clipboard"
                size={28}
                color={colors.info}
              />
            }
          />
        </ThemedView>


        <ThemedView className="mb-4 w-[31%] bg-transparent">
          <CategoryCard
            title={t("materials.practicals")}
            subtitle={t("materials.practicalsDesc")}
            backgroundColor={colors.secondaryLight}
            onPress={() => router.push("/(features)/practicalsScreen")}
            icon={
              <FontAwesome5
                name="flask"
                size={26}
                color={colors.secondary}
              />
            }
          />
        </ThemedView>

        <ThemedView className="mb-4 w-[31%] bg-transparent">
          <CategoryCard
            title="Courses"
            subtitle="Browse courses"
            backgroundColor="#E0F7FA"
            onPress={() => router.push("/(features)/coursesScreen")}
            icon={
              <Ionicons
                name="school"
                size={30}
                color="#0891B2"
              />
            }
          />
        </ThemedView>

      </ThemedView>
    </ThemedView>
  );
}