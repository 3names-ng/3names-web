import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HostelForm } from "@/types/hostel";

interface HostelStore {
  hostel: HostelForm;

  updateField: <K extends keyof HostelForm>(
    key: K,
    value: HostelForm[K]
  ) => void;

  reset: () => void;
}

const initialState: HostelForm = {
  photos: [],

  hostelName: "",

  description: "",

  school: "",

  faculty: "",

  address: "",

  city: "",

  state: "",

  monthlyRent: "",

  serviceCharge: "",

  cautionFee: "",

  roomType: "",

  capacity: 0,

  availableRooms: 0,

  totalRooms: 0,

  gender: "mixed",

  availability: "available",

  amenities: [],

  nearby: [],

  phone: "",

  whatsapp: "",

  email: "",

  contactName: "",

  phoneNumber: "",

  contactHours: "",

  officeAddress: "",

  curfew: "",

  generatorAvailable: false,

  ownerType: "owner",

  lookingForRoommate: false,

  rules: [],
};

export const useHostelStore = create<HostelStore>()(
  persist(
    (set) => ({
      hostel: initialState,

      updateField: (key, value) =>
        set((state) => ({
          hostel: {
            ...state.hostel,
            [key]: value,
          },
        })),

      reset: () =>
        set({
          hostel: initialState,
        }),
    }),
    {
      name: "hostel-upload",

      storage: createJSONStorage(
        () => AsyncStorage
      ),
    }
  )
);