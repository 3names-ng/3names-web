import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export interface NearbyPlace {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const NEARBY_PLACES: NearbyPlace[] = [
  {
    id: "school_gate",
    title: "School Gate",
    icon: "school",
  },
  {
    id: "market",
    title: "Market",
    icon: "store",
  },
  {
    id: "atm",
    title: "ATM",
    icon: "cash",
  },
  {
    id: "hospital",
    title: "Hospital",
    icon: "hospital-building",
  },
  {
    id: "pharmacy",
    title: "Pharmacy",
    icon: "pill",
  },
  {
    id: "bus_stop",
    title: "Bus Stop",
    icon: "bus",
  },
  {
    id: "church",
    title: "Church",
    icon: "church",
  },
  {
    id: "mosque",
    title: "Mosque",
    icon: "mosque",
  },
  {
    id: "gym",
    title: "Gym",
    icon: "dumbbell",
  },
  {
    id: "restaurant",
    title: "Restaurant",
    icon: "silverware-fork-knife",
  },
];