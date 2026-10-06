# 3names-web

The 3names Expo app, running as a Next.js (App Router) web app through
react-native-web.

```sh
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## How it's put together

- `screens/` — the app's expo-router screens and `_layout.tsx` files, unchanged
  in structure. Edit screens here.
- `app/` — **generated** Next.js routes (`npm run generate`, which also runs
  before `dev` and `build`). Each `page.tsx`/`layout.tsx` loads the matching
  screen client-side. Don't edit it by hand.
- `shims/` — web implementations of the native/Expo modules the screens import
  (expo-router on `next/navigation`, expo-audio/expo-video/expo-camera on
  browser media APIs, icons, gestures, reanimated, etc.). They're wired in via
  `next.config.js` (webpack aliases) and `tsconfig.json` (`paths`) — keep the
  two lists in sync.

URLs: route groups disappear, so `/(features)/chatScreen` is `/chatScreen`,
`/auth/loginScreen` stays as is, and the `(tabs)` home screen is `/home`.

`EXPO_PUBLIC_*` variables in `.env` are passed to the browser bundle as before.

## Not available on web

- Expo push notifications (no push token in a browser), in-app purchases
  (RevenueCat — web keeps the Paystack flow), saving to the photo library.
- Live camera filters (filters are applied after capture, as in Expo Go).
- Google Sign-In uses Google Identity Services: add the site's origin to the
  web OAuth client's "Authorized JavaScript origins".
