import axios from "axios";
import { router } from "expo-router";
import { ENV } from "@/config/env";
import { useAuthStore } from "@/store/authStore";
import { syncServerClock } from "@/service/helper";
import { showError } from "@/components/ui/toast";

export const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});


// Several requests can 403 with ACCOUNT_SUSPENDED in quick succession (e.g.
// screens that fire off a few calls on mount) — this avoids stacking up a
// redundant router.replace() for each one.
let suspendedRedirectPending = false;

// A 401 from these means bad credentials, not an expired session.
const NO_REFRESH_PATHS = ["/auth/login", "/auth/google", "/auth/signup", "/auth/verify-otp", "/auth/refresh", "/auth/logout"];

let refreshPromise: Promise<string | null> | null = null;

/**
 * Exchanges the stored refresh token for a new access token. Concurrent 401s
 * share one in-flight refresh. Resolves null if the session can't be renewed.
 */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken, setTokens } = useAuthStore.getState();
      if (!refreshToken) return null;
      try {
        // Plain axios, so this call can't recurse through the interceptors.
        const res = await axios.post(
          `${ENV.API_URL}/auth/refresh`,
          { refreshToken },
          { timeout: 15000 }
        );
        const data = res.data?.data ?? res.data;
        const accessToken: string | undefined = data?.accessToken ?? data?.token;
        // Signed out while the refresh was in flight — don't resurrect the session.
        if (!accessToken || !useAuthStore.getState().isAuthenticated) return null;
        setTokens(accessToken, data?.refreshToken);
        return accessToken;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ─── DYNAMIC TIMEOUT OVERRIDE FOR MULTIPART UPLOADS ───────────────
    // If the data payload is FormData, Axios will drop the default 15s 
    // limit and allow up to 90 seconds for large media binaries to cross.
    if (config.data instanceof FormData) {
      config.timeout = 100000; 
      console.log("✈️ Media upload detected: Extended request timeout to 90 seconds.");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Track the server clock so relative timestamps ("2 min ago") stay
    // accurate even when the device clock is skewed.
    syncServerClock(response.headers);
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      const original = error.config;
      const canRefresh =
        original &&
        !original._retry &&
        !NO_REFRESH_PATHS.some((path) => original.url?.includes(path));

      if (canRefresh) {
        original._retry = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          // The request interceptor attaches the new token.
          return api(original);
        }
      }

      useAuthStore.getState().logout();
    }

    // The account was suspended after the app was already open (e.g. an
    // admin action mid-session). Keep the session — this is a soft lock,
    // not a logout — and steer the user to the suspended screen instead of
    // surfacing a raw error on whatever they were doing.
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === "ACCOUNT_SUSPENDED"
    ) {
      const { user, updateUser } = useAuthStore.getState();
      if (user && user.status !== "suspended") {
        updateUser({ status: "suspended" });
      }
      if (!suspendedRedirectPending) {
        suspendedRedirectPending = true;
        router.replace("/auth/suspendedScreen" as any);
        setTimeout(() => {
          suspendedRedirectPending = false;
        }, 1000);
      }
    }

    // Restricted is a probation tier, not a lock — the user stays on
    // whatever screen they were on. Just surface why the specific action
    // (new post/listing/gift) was blocked, and keep the stored status fresh.
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === "ACCOUNT_RESTRICTED"
    ) {
      const { user, updateUser } = useAuthStore.getState();
      if (user && user.status !== "restricted") {
        updateUser({ status: "restricted" });
      }
      showError(
        error.response?.data?.message ||
          "This action is disabled while your account is restricted."
      );
    }

    return Promise.reject(error);
  }
);