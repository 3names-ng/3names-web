import React from "react";
import { FlatList } from "react-native";

import CourseCard from "./courseCard";
import { courses } from "@/data/course";

import { ThemedView } from "../ui/ThemedView";
import { ThemedText } from "../ui/ThemedText";
import EmptyState from "../ui/emptyState";

interface Props {
  searchText: string;
}

export default function PopularCourses({ searchText }: Props) {

  const filteredMaterials = courses.filter((item) =>
    item.title
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  return (
    <ThemedView className="mt-7 px-5 pb-32 bg-transparent">

      <ThemedView className="mb-5 flex-row items-center justify-between bg-transparent">

        <ThemedText
          color="primary"
          className="text-2xl font-bold"
        >
          Popular Materials
        </ThemedText>

        <ThemedText
          color="primary"
          className="text-[15px] font-bold"
        >
          View All
        </ThemedText>

      </ThemedView>


    {filteredMaterials.length === 0 ? (
  <EmptyState
    icon="search-outline"
    title="No materials found"
    message={`We couldn't find anything matching "${searchText}"`}
  />
) : (
  <FlatList
    data={filteredMaterials}
    keyExtractor={(item) => item.id}
    scrollEnabled={false}
    renderItem={({ item }) => (
      <CourseCard
        code={item.code}
        title={item.title}
        downloads={item.downloads}
        color={item.color}
        background={item.background}
      />
    )}
  />
)}
    </ThemedView>
  );
}