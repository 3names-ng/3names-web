export type GenderType = "male" | "female" | "mixed";

export type AvailabilityType =
  | "available"
  | "limited"
  | "full";

export type OwnerType =
  | "owner"
  | "agent"
  | "caretaker";

export interface HostelForm {
  // Basic Information
  hostelName: string;
  description: string;

  // Images
  photos: string[];
  coverPhoto?: string;

  // School Information
  school: string;
  faculty: string;
  department?: string;

  // Location
  address: string;
  city: string;
  state: string;
  landmark?: string;

  latitude?: number;
  longitude?: number;

  // Pricing
  monthlyRent: string;
  yearlyRent?: string;
  serviceCharge: string;
  cautionFee: string;
  agreementFee?: string;
  agencyFee?: string;

  // Room Details
  roomType: string;
  capacity: number;
  availableRooms: number;
  totalRooms: number;
  gender: GenderType;
  availability: AvailabilityType;

  // Features
  amenities: string[];
  nearby: string[];
  rules: string[];

  // Contact
  phone: string;
  whatsapp: string;
  email?: string;
  contactName?: string;
  phoneNumber?: string;
  contactHours?: string;
  officeAddress?: string;

  // Rules
  additionalRules?: string;
  curfew?: string;
  generatorAvailable?: boolean;
  // Owner
  ownerName?: string;
  ownerType: OwnerType;

  // Extra
  lookingForRoommate: boolean;

  petsAllowed?: boolean;
  visitorsAllowed?: boolean;
  smokingAllowed?: boolean;

  // Statistics
  views?: number;
  saves?: number;
  rating?: number;
  reviews?: number;

  // Status
  status?:
    | "draft"
    | "pending"
    | "approved"
    | "rejected";

  rejectionReason?: string;

  isVerified?: boolean;

  createdAt?: string;
  updatedAt?: string;
}