// @react-native-google-signin/google-signin uses the native Android/iOS SDKs.
// On web, GoogleSignin.signIn() uses Google Identity Services to get the same
// ID token. Requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, with this site's origin
// listed under "Authorized JavaScript origins" for that OAuth client.

export const statusCodes = {
  SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
  IN_PROGRESS: "IN_PROGRESS",
  PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  SIGN_IN_REQUIRED: "SIGN_IN_REQUIRED",
} as const;

type SuccessResponse = {
  type: "success";
  data: { idToken: string | null; user: Record<string, unknown> };
};
type CancelledResponse = { type: "cancelled"; data: null };
type SignInResponse = SuccessResponse | CancelledResponse;

type CodedError = Error & { code: string };

export const isErrorWithCode = (e: unknown): e is CodedError =>
  !!e && typeof e === "object" && "code" in e;
export const isSuccessResponse = (r: SignInResponse): r is SuccessResponse => r.type === "success";
export const isCancelledResponse = (r: SignInResponse): r is CancelledResponse =>
  r.type === "cancelled";

let clientId: string | undefined;
let inProgress = false;
let gisReady: Promise<any> | null = null;

function loadGis(): Promise<any> {
  if (gisReady) return gisReady;
  gisReady = new Promise((resolve, reject) => {
    const w = window as any;
    if (w.google?.accounts?.id) return resolve(w.google);
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve(w.google);
    s.onerror = () => {
      gisReady = null;
      reject(new Error("Could not load Google Sign-In"));
    };
    document.head.appendChild(s);
  });
  return gisReady;
}

const coded = (code: string, message: string): CodedError =>
  Object.assign(new Error(message), { code });

export const GoogleSignin = {
  configure(opts: { webClientId?: string; [k: string]: unknown }) {
    clientId = opts.webClientId;
  },
  async hasPlayServices(_opts?: unknown) {
    return true;
  },
  async signIn(): Promise<SignInResponse> {
    if (!clientId) throw coded(statusCodes.SIGN_IN_REQUIRED, "Google web client ID is not configured");
    if (inProgress) throw coded(statusCodes.IN_PROGRESS, "Sign-in already in progress");
    inProgress = true;
    try {
      const google = await loadGis();
      return await new Promise<SignInResponse>((resolve) => {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (res: { credential?: string }) =>
            resolve(
              res.credential
                ? { type: "success", data: { idToken: res.credential, user: {} } }
                : { type: "cancelled", data: null }
            ),
          cancel_on_tap_outside: true,
        });
        google.accounts.id.prompt((n: any) => {
          if (n.isNotDisplayed?.() || n.isSkippedMoment?.()) resolve({ type: "cancelled", data: null });
        });
      });
    } finally {
      inProgress = false;
    }
  },
  async signOut() {
    (window as any).google?.accounts?.id?.disableAutoSelect?.();
  },
  async revokeAccess() {},
  hasPreviousSignIn: () => false,
  getCurrentUser: () => null,
};
