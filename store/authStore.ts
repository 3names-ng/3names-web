import { authService } from "@/service/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { clearTokens, loadTokens, saveTokens } from "@/utils/tokenStorage";

export interface AppLevel {
  id: string;
  level: number;
  title: string;
  badge: string;
  emoji: string;
  color: string;
  minXp: number;
  maxXp: number;
  rewardCoins: number;
  perks: string[];
}

export interface User {
  id: string;
  email: string;
  coins?: number;
  bio?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  schoolName?: string | null;
  facultyName?: string | null;
  departmentName?: string | null;
  username?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  profilePictureUrl?: string | null;

  schoolId?: string | null;
  facultyId?: string | null;
  departmentId?: string | null;

  matricNumber?: string | null;
  jambNumber?: string | null;

  status?: string | null;
  statusReason?: string | null;

  verificationStatus?: string | null;
  /** Deadline to resubmit after a verification rejection before auto-restriction kicks in. */
  verificationGraceExpiresAt?: string | null;

  schoolIdCardUrl?: string | null;
  administrationLetterUrl?: string | null;

  onboardingStep?: string | null;
  isOnboardingComplete?: boolean;

  appLevel?: AppLevel | null;
  balance?: number | null;

  bubbleColor?: string | null;
  bubbleStyle?: string | null;

  profileFrame?: string | null;

  twoFactorEnabled?: boolean;
  studentUnion?: boolean;
  studentUnionStatus?: "none" | "pending" | "verified" | "rejected" | null;
  studentUnionDocUrl?: string | null;
  /** When an admin last verified the Student Union account; the committee term lasts a year from here */
  studentUnionVerifiedAt?: string | null;

  rejectionReason?: string | null;
  isStudentIdRejected?: boolean;
  isAdmissionLetterRejected?: boolean;
}

interface AuthState {
  user: User | null;

  token: string | null;
  refreshToken: string | null;

  isAuthenticated: boolean;
  hasLoggedInBefore: boolean;
  isHydrated: boolean;

  login: (user: User, token: string, refreshToken: string) => void;
  setTokens: (token: string, refreshToken?: string | null) => void;
  logout: () => void;
  clearAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  setHydrated: (value: boolean) => void;
  setHasLoggedInBefore: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      token: null,
      refreshToken: null,

      isAuthenticated: false,
      hasLoggedInBefore: false,
      isHydrated: false,

      login: (user, token, refreshToken) => {
        saveTokens(token, refreshToken || null);
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          hasLoggedInBefore: true,
        });
      },

      setTokens: (token, refreshToken) =>
        set((state) => {
          const nextRefresh = refreshToken ?? state.refreshToken;
          saveTokens(token, nextRefresh);
          return { token, refreshToken: nextRefresh };
        }),

      logout: () => {
        clearTokens();
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          hasLoggedInBefore: true,
        });
      },

      clearAuth: async () => {
        useAuthStore.persist.clearStorage();
        await clearTokens();

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          hasLoggedInBefore: true,
        });
      },

      updateUser: (user) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                ...user,
              }
            : null,
        })),

      refreshUser: async () => {
        try {
          const res = await authService.getMe();
          const freshUser = res?.user || res?.data?.user || res?.data || res;
          if (freshUser && typeof freshUser === "object" && freshUser.id) {
            set((state) => ({
              user: state.user ? { ...state.user, ...freshUser } : freshUser,
            }));
          }
        } catch (err) {
          console.warn("[authStore] refreshUser failed:", err);
        }
      },

      setHydrated: (value) =>
        set({
          isHydrated: value,
        }),

      setHasLoggedInBefore: (value) =>
        set({
          hasLoggedInBefore: value,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Tokens are kept in secure storage (utils/tokenStorage), never in AsyncStorage.
      partialize: ({ token, refreshToken, isHydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        restoreTokens(state?.token ?? null, state?.refreshToken ?? null);
      },
    }
  )
);

/**
 * Loads tokens from secure storage after the persisted state rehydrates.
 * Older installs kept tokens inside "auth-storage"; if they're present they
 * are moved to secure storage (the next persist write drops them from
 * AsyncStorage via partialize).
 */
async function restoreTokens(legacyToken: string | null, legacyRefreshToken: string | null) {
  try {
    if (legacyToken) {
      await saveTokens(legacyToken, legacyRefreshToken);
    } else {
      const { token, refreshToken } = await loadTokens();
      useAuthStore.setState({ token, refreshToken });
    }
  } catch (err) {
    console.warn("[authStore] failed to restore tokens:", err);
  }

  const { isAuthenticated, token } = useAuthStore.getState();
  if (isAuthenticated && !token) {
    // Session flag survived but the token didn't — treat as signed out.
    useAuthStore.setState({ user: null, isAuthenticated: false });
  }
  useAuthStore.getState().setHydrated(true);
}