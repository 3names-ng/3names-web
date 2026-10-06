export interface RoomType {
  id: string;
  title: string;
}

export const ROOM_TYPES: RoomType[] = [
  {
    id: "single_room",
    title: "Single Room",
  },
  {
    id: "self_contain",
    title: "Self Contain",
  },
  {
    id: "room_parlour",
    title: "Room & Parlour",
  },
  {
    id: "one_bedroom",
    title: "1 Bedroom",
  },
  {
    id: "two_bedroom",
    title: "2 Bedroom",
  },
  {
    id: "three_bedroom",
    title: "3 Bedroom",
  },
  {
    id: "shared_apartment",
    title: "Shared Apartment",
  },
  {
    id: "hostel_bunk",
    title: "Hostel Bunk",
  },
];