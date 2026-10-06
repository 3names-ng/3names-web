import * as Sentry from "@sentry/react-native";

/**
 * Crash and error reporting. Loaded first from index.js so errors during
 * startup are captured too.
 *
 * Off unless EXPO_PUBLIC_SENTRY_DSN is set, and never in development, so
 * local work doesn't flood the project.
 */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && !__DEV__,
  environment: process.env.EXPO_PUBLIC_APP_ENV || (__DEV__ ? "development" : "production"),
  // No IP addresses, cookies or request bodies. Users are identified by id only.
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
});

/** Tag reports with the signed-in user's id (never email or name). */
export function setSentryUser(userId: string | null) {
  Sentry.setUser(userId ? { id: userId } : null);
}

export { Sentry };
