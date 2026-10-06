import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/ui/ThemedView";

import CategoryGrid from "@/components/materials/categoryGrid";
import PopularCourses from "@/components/materials/popularCourses";
import Header from "@/components/header";
import { useTheme } from "@/hooks/useTheme";
import AuthHeader from "@/components/auth/authHeader";
import { useTranslation } from "@/hooks/useTranslation";

export default function StudyMaterialsScreen() {
  const [searchText, setSearchText] = useState("");
    const {colors} = useTheme()
    const { t } = useTranslation()
  return (
    <ThemedView className="flex-1" style={{backgroundColor:colors.background}}>

      <SafeAreaView className="flex-1">

        <StatusBar
          barStyle="default"
        />

      <AuthHeader 
        title={t("materials.title")} 
        subtitle={t("materials.subtitle")} 
      />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-32"
        >

          <ThemedView className="mt-6 mb-4 px-4 bg-transparent">
            <Image
              source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946840/material-hero_dpncis.png"}}
              className="h-44 w-full rounded-3xl"
              resizeMode="cover"
            />
          </ThemedView>

          <CategoryGrid />

          {/* <PopularCourses searchText={searchText} /> */}

        </ScrollView>

      </SafeAreaView>

    </ThemedView>
  );
}