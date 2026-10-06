import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export interface Amenity {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const AMENITIES: Amenity[] = [
  {
    id: "water",
    title: "Water",
    icon: "water",
  },
  {
    id: "electricity",
    title: "Electricity",
    icon: "lightning-bolt",
  },
  {
    id: "wifi",
    title: "WiFi",
    icon: "wifi",
  },
  {
    id: "security",
    title: "Security",
    icon: "shield-check",
  },
  {
    id: "cctv",
    title: "CCTV",
    icon: "cctv",
  },
  {
    id: "parking",
    title: "Parking",
    icon: "car",
  },
  {
    id: "kitchen",
    title: "Kitchen",
    icon: "silverware-fork-knife",
  },
  {
    id: "wardrobe",
    title: "Wardrobe",
    icon: "wardrobe",
  },
  {
    id: "generator",
    title: "Generator",
    icon: "engine",
  },
  {
    id: "air_condition",
    title: "Air Conditioner",
    icon: "air-conditioner",
  },
  {
    id: "fan",
    title: "Fan",
    icon: "fan",
  },
  {
    id: "balcony",
    title: "Balcony",
    icon: "balcony",
  },
  {
    id: "tiles",
    title: "Tiles",
    icon: "grid",
  },
  {
    id: "pop_ceiling",
    title: "POP Ceiling",
    icon: "home-roof",
  },
  {
    id: "study_table",
    title: "Study Table",
    icon: "desk",
  },
  {
    id: "chair",
    title: "Chair",
    icon: "chair-rolling",
  },
  {
    id: "laundry",
    title: "Laundry",
    icon: "washing-machine",
  },
  {
    id: "borehole",
    title: "Borehole",
    icon: "water-pump",
  },
  {
    id: "fence",
    title: "Fenced Compound",
    icon: "gate",
  },
  {
    id: "solar",
    title: "Solar Power",
    icon: "solar-power",
  },
];