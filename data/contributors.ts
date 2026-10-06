import { appLevels } from "./mockFeedData";

export const contributors = [
  {
    id: "1",
    name: "John Doe",
    departmentId: "Computer Science",
    avatar: "https://i.pravatar.cc/150?img=11",
    uploads: 124,
    level: "Legend",
    xp: 18500,
    appLevel:appLevels.elite,
  },
  {
    id: "2",
    name: "Sarah Johnson",
    departmentId: "Accounting",
    avatar: "https://i.pravatar.cc/150?img=12",
    uploads: 98,
    level: "Grandmaster",
    xp: 16420,
    appLevel:appLevels.fresher,
  },
  {
    id: "3",
    name: "Michael Williams",
    departmentId: "Economics",
    avatar: "https://i.pravatar.cc/150?img=13",
    uploads: 82,
   appLevel:appLevels.ambassador,
    xp: 14350,
  },
  {
    id: "4",
    name: "Grace Adams",
    departmentId: "Business Administration",
    avatar: "https://i.pravatar.cc/150?img=14",
    uploads: 74,
    appLevel:appLevels.superstar,
    xp: 12980,
  },
];