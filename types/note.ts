export interface Note {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
}

export interface NoteItem {
  id: string;
  title: string;
  category: string;
  date: string;
  color: string;
  icon:
    | "school"
    | "bookmark"
    | "clipboard-text"
    | "book-open-page-variant"
    | "account"
    | "notebook";
}