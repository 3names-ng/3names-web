export interface Group {
  id: string;
  name: string;
  description: string;
  category:
    | "facultyId"
    | "departmentId"
    | "Study"
    | "Marketplace"
    | "Hostel"
    | "Social";

  cover: string;

  members: number;

  online: number;

  joined: boolean;

  verified: boolean;

  unread: number;

  lastMessage: string;

  lastActive: string;
}

export const groups: Group[] = [
  {
    id: "1",
    name: "CSC 400 Level",
    description: "Computer Science Final Year Students",
    category: "departmentId",
    cover:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
    members: 1245,
    online: 56,
    joined: true,
    verified: true,
    unread: 6,
    lastMessage: "John: Assignment solution uploaded",
    lastActive: "2 min ago",
  },

  {
    id: "2",
    name: "Hostel Connect",
    description: "Find roommates and hostel updates",
    category: "Hostel",
    cover:
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
    members: 892,
    online: 24,
    joined: true,
    verified: false,
    unread: 1,
    lastMessage: "New hostel available",
    lastActive: "10 min ago",
  },

  {
    id: "3",
    name: "Campus Marketplace",
    description: "Buy & Sell used items",
    category: "Marketplace",
    cover:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800",
    members: 4210,
    online: 188,
    joined: false,
    verified: true,
    unread: 0,
    lastMessage: "MacBook listed for sale",
    lastActive: "18 min ago",
  },

  {
    id: "4",
    name: "facultyId of Science",
    description: "facultyId announcements",
    category: "facultyId",
    cover:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=800",
    members: 3450,
    online: 142,
    joined: true,
    verified: true,
    unread: 0,
    lastMessage: "Exam timetable released",
    lastActive: "35 min ago",
  },

  {
    id: "5",
    name: "Final Year Project",
    description: "Project discussions",
    category: "Study",
    cover:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
    members: 610,
    online: 31,
    joined: true,
    verified: false,
    unread: 12,
    lastMessage: "Supervisor comments uploaded",
    lastActive: "1 hr ago",
  },

  {
    id: "6",
    name: "Scholarship Updates",
    description: "Scholarships & grants",
    category: "Study",
    cover:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
    members: 1580,
    online: 79,
    joined: false,
    verified: true,
    unread: 0,
    lastMessage: "NNPC Scholarship now open",
    lastActive: "2 hrs ago",
  },

  {
    id: "7",
    name: "Campus Football",
    description: "Football lovers community",
    category: "Social",
    cover:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
    members: 760,
    online: 40,
    joined: true,
    verified: false,
    unread: 3,
    lastMessage: "Friendly match tomorrow",
    lastActive: "3 hrs ago",
  },

  {
    id: "8",
    name: "UI Developers",
    description: "Programming discussions",
    category: "departmentId",
    cover:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800",
    members: 990,
    online: 63,
    joined: false,
    verified: true,
    unread: 0,
    lastMessage: "React Native workshop",
    lastActive: "Yesterday",
  },
];