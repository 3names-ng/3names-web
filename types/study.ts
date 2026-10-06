export interface Category {
  id: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  icon: React.ReactNode;
}

export interface Course {
  id: string;
  code: string;
  title: string;
 departmentId: string;
  facultyId: string;
  level: string;
  semester: string;
 lecturer: string;
 downloads: number;
 rating: number;
 pages: number;
 type: string;
 premium: boolean;
 thumbnail: string;
 uploadedBy: string;
 uploadDate: string;
}