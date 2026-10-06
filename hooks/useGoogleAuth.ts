import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useCallback, useState } from "react";
import { authService } from "@/service/auth.service";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { showError } from "@/components/ui/toast";

/**
 * Native Google Sign-In.
 *
 * Requires a development build (does not work in Expo Go) since it relies on
 * native Android/iOS Google Sign-In SDKs matched by package name/SHA-1 (Android)
 * and bundle ID (iOS) rather than a redirect URI.
 *
 * Set these in your .env:
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
 *
 * The web client ID is used as the `serverClientId` so the ID token can be
 * verified by our backend; it must come from an OAuth client of type
 * "Web application" in Google Cloud Console. The iOS client ID must come
 * from a separate client of type "iOS", registered with the app's bundle ID
 * (com.eehimuebru.school). Android is matched automatically via the app's
 * package name + signing certificate SHA-1, registered as an "Android" client
 * (no client ID needed in code for that one).
 */
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  offlineAccess: false,
  scopes: ["email", "profile"],
});

export function useGoogleAuth() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);

  const handleGoogleToken = useCallback(
    async (idToken: string) => {
      try {
        setLoading(true);
        const data = await authService.googleLogin(idToken);

        // Same response shape as normal login
        if (data.twoFactorRequired) {
          router.replace({
            pathname: "/(features)/twoFactorVerifyScreen",
            params: { email: data.email, userId: data?.user?.id },
          });
          return;
        }

        if (data.accountDeactivated) {
          showError(
            "Your account has been deactivated. Please contact support.",
            "Account Deactivated"
          );
          return;
        }

        // Store auth data
        login(data.user, data.accessToken, data.refreshToken);

        // Navigate based on suspension / restriction / onboarding status
        if (data.user?.status === "suspended") {
          router.replace("/auth/suspendedScreen" as any);
        } else if (data.user?.status === "restricted") {
          router.replace("/auth/restrictedScreen" as any);
        } else if (data.onboardingRequired) {
          router.replace("/");
        } else {
          router.replace("/(tabs)");
        }
      } catch (error: any) {
        console.error("Google login error:", error);
        showError(
          error?.response?.data?.message ||
            error?.message ||
            "Google sign-in failed. Please try again.",
          "Authentication Failed"
        );
      } finally {
        setLoading(false);
      }
    },
    [login, router]
  );

  const signInWithGoogle = useCallback(async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      showError(
        "Google Sign-In is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.",
        "Configuration Error"
      );
      return;
    }

    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken } = response.data;
        if (!idToken) {
          showError("No ID token received from Google.", "Authentication Failed");
          return;
        }
        await handleGoogleToken(idToken);
      }
      // response.type === "cancelled" -> user dismissed the sign-in sheet, do nothing
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // Sign-in already in progress, ignore
            return;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            showError(
              "Google Play Services is not available or outdated.",
              "Authentication Failed"
            );
            return;
        }
      }
      console.error("Google sign-in error:", error);
      showError(
        error?.message || "Google sign-in was cancelled or failed.",
        "Authentication Failed"
      );
    } finally {
      setLoading(false);
    }
  }, [handleGoogleToken]);

  return {
    signInWithGoogle,
    loading,
  };
}
