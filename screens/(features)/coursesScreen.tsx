import React from "react";
import MaterialListScreen from "@/components/materials/MaterialListScreen";

export default function CoursesScreen() {
  return (
    <MaterialListScreen
      category="courses"
      title="Courses"
      subtitle="Browse courses offered in your department"
      icon="school"
      color="#0891B2"
    />
  );
}
