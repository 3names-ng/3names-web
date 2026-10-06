import React from "react";
import { FlatList } from "react-native";

import QuestionCard from "./questionCard";

export interface PastQuestionListItem {
  id: string;
  courseCode: string;
  course: string;
  year: string;
  semester: string;
  downloads: number;
  hasAccess: boolean;
  priceCoins: number;
  uploaderId?: string;
}

interface Props {
  questions: PastQuestionListItem[];
  onPress?: (id: string) => void;
  loadingId?: string | null;
}

export default function QuestionList({
  questions,
  onPress,
  loadingId,
}: Props) {
  return (
    <FlatList
      data={questions}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <QuestionCard
          courseCode={item.courseCode}
          course={item.course}
          year={item.year}
          semester={item.semester}
          downloads={item.downloads}
          hasAccess={item.hasAccess}
          priceCoins={item.priceCoins}
          loading={loadingId === item.id}
          onPress={onPress ? () => onPress(item.id) : undefined}
        />
      )}
    />
  );
}
