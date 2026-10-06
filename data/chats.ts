export interface Chat {
  id: string;
  name: string;

  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  typing?: boolean;
  verified?: boolean;
  username?:string
  profilePictureUrl?:string
}

export const chats: Chat[] = [
  {
    id: "1",
    name: "David Moses",
    avatar: "https://i.pravatar.cc/300?img=12",
    lastMessage: "Are you coming for today's lecture?",
    time: "2m",
    unread: 3,
    online: true,
    verified: true,
  },
  {
    id: "2",
    name: "Mercy Johnson",
    avatar: "https://i.pravatar.cc/300?img=32",
    lastMessage: "Typing...",
    time: "5m",
    unread: 1,
    online: true,
    typing: true,
  },
  {
    id: "3",
    name: "Campus Marketplace",
    avatar: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png",
    lastMessage: "Your item has received a new offer.",
    time: "18m",
    unread: 2,
    online: false,
  },
  {
    id: "4",
    name: "Samuel Adeyemi",
    avatar: "https://i.pravatar.cc/300?img=15",
    lastMessage: "Thanks bro 🙌",
    time: "Yesterday",
    unread: 0,
    online: false,
  },
  {
    id: "5",
    name: "Grace Daniel",
    avatar: "https://i.pravatar.cc/300?img=25",
    lastMessage: "Can you send me CSC401 past questions?",
    time: "Yesterday",
    unread: 0,
    online: true,
  },
  {
    id: "6",
    name: "Hostel Admin",
    avatar: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    lastMessage: "Room inspection starts tomorrow.",
    time: "Mon",
    unread: 0,
    online: false,
  },
  {
    id: "7",
    name: "Daniel Benson",
    avatar: "https://i.pravatar.cc/300?img=11",
    lastMessage: "I uploaded the materials.",
    time: "Sun",
    unread: 0,
    online: true,
    verified: true,
  },
  {
    id: "8",
    name: "Software Engineering Group",
    avatar: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png",
    lastMessage: "Emeka: Assignment deadline changed.",
    time: "Sun",
    unread: 8,
    online: false,
  },
];