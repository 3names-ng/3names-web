export interface Message {
  id: string;
  chatId: string;
  sender: "me" | "other";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
  image?: string;
}

export const messages: Message[] = [
  {
    id: "1",
    chatId: "1",
    sender: "other",
    text: "Hey 👋",
    time: "9:00 AM",
  },
  {
    id: "2",
    chatId: "1",
    sender: "other",
    text: "Are you coming for today's lecture?",
    time: "9:01 AM",
  },
  {
    id: "3",
    chatId: "1",
    sender: "me",
    text: "Yes, I'm on my way.",
    time: "9:02 AM",
    status: "read",
  },
  {
    id: "4",
    chatId: "1",
    sender: "other",
    text: "Great 👍",
    time: "9:03 AM",
  },
  {
    id: "5",
    chatId: "1",
    sender: "me",
    text: "Let's meet at the facultyId entrance.",
    time: "9:05 AM",
    status: "delivered",
  },

  {
    id: "6",
    chatId: "2",
    sender: "other",
    text: "Good morning ☀️",
    time: "8:10 AM",
  },
  {
    id: "7",
    chatId: "2",
    sender: "me",
    text: "Morning 😊",
    time: "8:11 AM",
    status: "read",
  },
  {
    id: "8",
    chatId: "2",
    sender: "other",
    text: "Can you send the assignment PDF?",
    time: "8:12 AM",
  },
  {
    id: "9",
    chatId: "2",
    sender: "me",
    text: "Sure, give me 2 mins.",
    time: "8:13 AM",
    status: "read",
  },

  {
    id: "10",
    chatId: "3",
    sender: "other",
    text: "Your MacBook has received a new offer.",
    time: "Yesterday",
  },
  {
    id: "11",
    chatId: "3",
    sender: "me",
    text: "How much did the buyer offer?",
    time: "Yesterday",
    status: "read",
  },
  {
    id: "12",
    chatId: "3",
    sender: "other",
    text: "₦420,000",
    time: "Yesterday",
  },

  {
    id: "13",
    chatId: "4",
    sender: "other",
    text: "Thanks bro 🙌",
    time: "Yesterday",
  },

  {
    id: "14",
    chatId: "5",
    sender: "other",
    text: "Can you send CSC401 past questions?",
    time: "Yesterday",
  },
  {
    id: "15",
    chatId: "5",
    sender: "me",
    text: "I'll send them after class.",
    time: "Yesterday",
    status: "read",
  },

  {
    id: "16",
    chatId: "6",
    sender: "other",
    text: "Room inspection starts tomorrow morning.",
    time: "Monday",
  },
  {
    id: "17",
    chatId: "6",
    sender: "me",
    text: "Thanks for the update.",
    time: "Monday",
    status: "read",
  },

  {
    id: "18",
    chatId: "7",
    sender: "other",
    text: "I uploaded the study materials.",
    time: "Sunday",
  },
  {
    id: "19",
    chatId: "7",
    sender: "me",
    text: "Awesome! I'll check them out.",
    time: "Sunday",
    status: "delivered",
  },

  {
    id: "20",
    chatId: "8",
    sender: "other",
    text: "Assignment deadline has been moved.",
    time: "Sunday",
  },
  {
    id: "21",
    chatId: "8",
    sender: "other",
    text: "Please submit before Friday.",
    time: "Sunday",
  },
];