import { appLevels } from "./mockFeedData";

export const categories = [
  {
    id: "1",
    name: "All",
    icon: "apps",
  },
  {
    id: "2",
    name: "Electronics",
    icon: "desktop-outline",
  },
  {
    id: "3",
    name: "Books",
    icon: "book-outline",
  },
  {
    id: "4",
    name: "Furniture",
    icon: "bed-outline",
  },
  {
    id: "5",
    name: "Fashion",
    icon: "shirt-outline",
  },
  {
    id: "6",
    name: "Sports",
    icon: "basketball-outline",
  },
  {
    id: "7",
    name: "Accessories",
    icon: "watch-outline",
  },
  {
    id: "8",
    name: "Others",
    icon: "ellipsis-horizontal",
  },
];

export const featuredProducts = [
  {
    id: "1",
    title: "MacBook Air M1",
    price: "₦450,000",
    location: "Main Campus",
    seller: "Daniel Benson",
    sellerAvatar: "https://i.pravatar.cc/100?img=12",
    image:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=800",
    featured: true,
     appLevel: appLevels.legend,
  },

  {
    id: "2",
    title: "Engineering Books",
    price: "₦15,000",
    location: "Science Building",
    seller: "Sarah John",
    sellerAvatar: "https://i.pravatar.cc/100?img=32",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800",
    featured: true,
     appLevel: appLevels.superstar,
  },

  {
    id: "3",
    title: "Office Chair",
    price: "₦25,000",
    location: "Hostel 2",
    seller: "Michael",
    sellerAvatar: "https://i.pravatar.cc/100?img=15",
    image:
      "https://images.unsplash.com/photo-1505843490701-5be5d3d8e7aa?w=800",
    featured: true,
        appLevel: appLevels.master,
  },

  {
    id: "4",
    title: "Nike Air Force",
    price: "₦18,000",
    location: "Main Campus",
    seller: "Grace",
    sellerAvatar: "https://i.pravatar.cc/100?img=24",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    featured: true,
        appLevel: appLevels.ultimate,
  },
];

export const recentProducts = [
  {
    id: "11",
    title: "iPhone 12 (64GB)",
    price: "₦320,000",
    location: "Main Campus",
    time: "10m ago",
    image:
      "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800",
      appLevel: appLevels.legend,
  },

  {
    id: "12",
    title: "Sony WH-1000XM4",
    price: "₦85,000",
    location: "Science Building",
    time: "25m ago",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
        appLevel: appLevels.superstar,
  },

  {
    id: "13",
    title: "Study Desk",
    price: "₦20,000",
    location: "Hostel 1",
    time: "1h ago",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
        appLevel: appLevels.master,
  },

  {
    id: "14",
    title: "Backpack (Like New)",
    price: "₦8,000",
    location: "Main Campus",
    time: "1h ago",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
        appLevel: appLevels.ultimate,
  },
];

export const products = [
  {
    id: "1",
    title: "HP EliteBook 840 G8",
    price: "₦380,000",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900",
    seller: "John Doe",
    sellerAvatar: "https://i.pravatar.cc/150?img=12",
    location: "Computer Science",
    featured: true,
    appLevel: appLevels.legend,
  },
  {
    id: "2",
    title: "Office Study Chair",
    price: "₦45,000",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900",
    seller: "Sarah Johnson",
    sellerAvatar: "https://i.pravatar.cc/150?img=32",
    location: "Accounting",
    featured: true,
    appLevel: appLevels.superstar,
  },
  {
    id: "3",
    title: "iPhone 14 Pro Max",
    price: "₦820,000",
    image:
      "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=900",
    seller: "Michael",
    sellerAvatar: "https://i.pravatar.cc/150?img=41",
    location: "Economics",
    featured: true,
    appLevel: appLevels.master,
  },
  {
    id: "4",
    title: "Engineering Drawing Set",
    price: "₦12,500",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900",
    seller: "Grace Adams",
    sellerAvatar: "https://i.pravatar.cc/150?img=25",
    location: "Engineering",
    featured: false,
    appLevel: appLevels.ultimate,
  },
];