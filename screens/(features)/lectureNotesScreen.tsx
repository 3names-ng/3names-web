import MaterialListScreen from "@/components/materials/MaterialListScreen";

export default function LectureNotesScreen() {
  return (
    <MaterialListScreen
      category="lecture_notes"
      title="Lecture Notes"
      subtitle="Notes shared by students in your department"
      icon="document-text"
      color="#6C47FF"
    />
  );
}
