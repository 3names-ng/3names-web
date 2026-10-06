// Dev fallback only. Production builds are blocked from using it by app.config.js.
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://undertook-helpful-rentable.ngrok-free.dev/v1";

/**
 * Derive the socket origin (protocol + host) from the API URL.
 * e.g. "https://api.example.com/v1" -> "https://api.example.com"
 */
function getSocketOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    // Fallback: strip trailing /v1 or any path
    return url.replace(/\/v1\/?$/, "").replace(/\/$/, "");
  }
}

export const ENV = {
  API_URL,
  SOCKET_ORIGIN: process.env.EXPO_PUBLIC_SOCKET_ORIGIN || getSocketOrigin(API_URL),
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
};
