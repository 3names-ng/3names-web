export type NotificationType =
  | "message"
  | "marketplace"
  | "hostel"
  | "leaderboard"
  | "reward"
  | "community"
  | "system"
  | "follow";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string;
  image?: string;
  time: string;
  read: boolean;
  section: "Today" | "Yesterday" | "This Week";
}

export const notifications: Notification[] = [
  {
    id: "1",
    type: "message",
    title: "David Moses",
    message: "Sent you a new message.",
    avatar: "https://i.pravatar.cc/300?img=12",
    time: "2 min ago",
    read: false,
    section: "Today",
  },

  {
    id: "2",
    type: "marketplace",
    title: "New Offer",
    message: "Sarah offered ₦180,000 for your MacBook Pro.",
    image:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=800",
    time: "15 min ago",
    read: false,
    section: "Today",
  },

  {
    id: "3",
    type: "reward",
    title: "Daily Reward",
    message: "You earned 50 XP for today's login.",
    time: "1 hour ago",
    read: false,
    section: "Today",
  },

  {
    id: "4",
    type: "leaderboard",
    title: "Leaderboard Updated",
    message: "Congratulations! You moved up to #12.",
    time: "3 hours ago",
    read: true,
    section: "Today",
  },

  {
    id: "5",
    type: "hostel",
    title: "New Hostel",
    message: "Sunrise Hostel has a new room available.",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    time: "Yesterday",
    read: true,
    section: "Yesterday",
  },

  {
    id: "6",
    type: "community",
    title: "Computer Science Community",
    message: "John uploaded CSC401 Past Questions.",
    avatar: "https://i.pravatar.cc/300?img=18",
    time: "Yesterday",
    read: false,
    section: "Yesterday",
  },

  {
    id: "7",
    type: "follow",
    title: "Grace Johnson",
    message: "Started following you.",
    avatar: "https://i.pravatar.cc/300?img=45",
    time: "Yesterday",
    read: true,
    section: "Yesterday",
  },

  {
    id: "8",
    type: "system",
    title: "3NAMES",
    message: "Version 2.1 is now available with exciting new features.",
    time: "2 days ago",
    read: true,
    section: "This Week",
  },

  {
    id: "9",
    type: "marketplace",
    title: "Item Sold",
    message: "Congratulations! Your iPhone 13 has been sold.",
    image:
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800",
    time: "3 days ago",
    read: true,
    section: "This Week",
  },

  {
    id: "10",
    type: "leaderboard",
    title: "Achievement Unlocked",
    message: "You reached the Elite level.",
    time: "5 days ago",
    read: true,
    section: "This Week",
  },
];