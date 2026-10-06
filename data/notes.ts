import { Note, NoteItem } from "../types/note";

export const pinnedNote: Note = {
  id: "1",
  title: "Math Revision",
  category: "Classes",
  description:
    "Revise calculus, integration techniques, differentiation and solve at least twenty past examination questions before Friday's test.",
  date: "Today • 10:30 AM",
};

export const recentNotes: NoteItem[] = [
  {
    id: "1",
    title: "Chemistry Assignment",
    category: "Classes",
    date: "Today",
    color: "#6F3FF5",
    icon: "school",
  },
  {
    id: "2",
    title: "Shopping List",
    category: "Personal",
    date: "Yesterday",
    color: "#FF8A00",
    icon: "clipboard-text",
  },
  {
    id: "3",
    title: "Project Ideas",
    category: "Bookmarks",
    date: "2 days ago",
    color: "#00B894",
    icon: "bookmark",
  },
  {
    id: "4",
    title: "Physics Notes",
    category: "Classes",
    date: "May 24",
    color: "#3B82F6",
    icon: "book-open-page-variant",
  },
  {
    id: "5",
    title: "English Essay",
    category: "Classes",
    date: "May 20",
    color: "#EF4444",
    icon: "notebook",
  },
  {
    id: "6",
    title: "Weekend Goals",
    category: "Personal",
    date: "May 18",
    color: "#14B8A6",
    icon: "account",
  },
];