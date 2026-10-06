import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface OnboardingData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;

  schoolId: string;
  programType: string;
  facultyId: string;
  departmentId: string;
  matricNumber: string;
  jambNumber: string;

  username: string;
  phoneNumber: string;

  profilePictureUrl: string;

  studentIdUrl: string;
  admissionLetterUrl: string;
  schoolFeesUrl: string;
  courseFormUrl: string;

  termsAccepted: boolean;

  schoolIdCard?: any; 
  administrationLetter?: any;
}

interface OnboardingState {
  step: number;
  data: OnboardingData;
  
  // Hydration tracking properties
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  updateData: (values: Partial<OnboardingData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  resetOnboarding: () => void;
}

const initialData: OnboardingData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",

  schoolId: "",
  programType: "",
  facultyId: "",
  departmentId: "",
  matricNumber: "",
  jambNumber: "",

  username: "",
  phoneNumber: "",

  profilePictureUrl: "",

  studentIdUrl: "",
  admissionLetterUrl: "",
  schoolFeesUrl: "",
  courseFormUrl: "",

  termsAccepted: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 1,
      data: initialData,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      updateData: (values) =>
        set((state) => ({
          data: {
            ...state.data,
            ...values,
          },
        })),

      nextStep: () =>
        set((state) => ({
          step: state.step + 1,
        })),

      previousStep: () =>
        set((state) => ({
          step: state.step > 1 ? state.step - 1 : 1,
        })),

      setStep: (step) =>
        set({
          step,
        }),

      resetOnboarding: () =>
        set({
          step: 1,
          data: initialData,
        }),
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
      
      // Fires immediately when the store initializes and starts loading from disk
      onRehydrateStorage: (state) => {
        // Returns a post-rehydration callback function
        return (rehydratedState, error) => {
          if (error) {
            console.error("Failed to hydrate onboarding storage", error);
          } else if (rehydratedState) {
            rehydratedState.setHasHydrated(true);
          }
        };
      },
    }
  )
);