/** @type {import('next').NextConfig} */
const path = require("path");

// Every native-only / Expo module the RN code imports is swapped for a web
// shim in ./shims. Keep this list in sync with tsconfig.json "paths".
const shim = (name) => path.join(__dirname, "shims", name);

const alias = {
  "react-native$": "react-native-web",
  "expo-router/react-navigation": shim("expo-router-navigation.tsx"),
  "expo-router$": shim("expo-router.tsx"),
  expo$: shim("expo.ts"),
  "expo-audio$": shim("expo-audio.ts"),
  "expo-camera$": shim("expo-camera.tsx"),
  "expo-constants$": shim("expo-constants.ts"),
  "expo-device$": shim("expo-device.ts"),
  "expo-document-picker$": shim("expo-document-picker.ts"),
  "expo-file-system$": shim("expo-file-system.ts"),
  "expo-font$": shim("expo-font.ts"),
  "expo-image$": shim("expo-image.tsx"),
  "expo-image-picker$": shim("expo-image-picker.ts"),
  "expo-linear-gradient$": shim("expo-linear-gradient.tsx"),
  "expo-notifications$": shim("expo-notifications.ts"),
  "expo-screen-capture$": shim("expo-screen-capture.ts"),
  "expo-secure-store$": shim("expo-secure-store.ts"),
  "expo-splash-screen$": shim("expo-splash-screen.ts"),
  "expo-status-bar$": shim("expo-status-bar.tsx"),
  "expo-task-manager$": shim("expo-task-manager.ts"),
  "expo-video$": shim("expo-video.tsx"),
  "expo-video-thumbnails$": shim("expo-video-thumbnails.ts"),
  "expo-web-browser$": shim("expo-web-browser.ts"),
  // Prefix alias: "@expo/vector-icons/Ionicons" -> shims/vector-icons/Ionicons
  "@expo/vector-icons": shim("vector-icons"),
  "lucide-react-native$": shim("lucide-react-native.ts"),
  "react-native-svg$": shim("react-native-svg.tsx"),
  "react-native-safe-area-context$": shim("react-native-safe-area-context.tsx"),
  "react-native-gesture-handler$": shim("react-native-gesture-handler.tsx"),
  "react-native-reanimated$": shim("react-native-reanimated.ts"),
  "react-native-webview$": shim("react-native-webview.tsx"),
  "react-native-purchases$": shim("react-native-purchases.ts"),
  "expo-media-library$": shim("expo-media-library.ts"),
  "@react-native-async-storage/async-storage$": shim("async-storage.ts"),
  "@react-native-community/datetimepicker$": shim("datetimepicker.tsx"),
  "@react-native-google-signin/google-signin$": shim("google-signin.ts"),
  "@sentry/react-native$": shim("sentry.ts"),
  // Native-only; only referenced from files that have a .web.* counterpart.
  "react-native-compressor$": shim("empty.ts"),
  "react-native-vision-camera$": shim("empty.ts"),
  "react-native-vision-camera-skia$": shim("empty.ts"),
  "@shopify/react-native-skia$": shim("empty.ts"),
};

// The RN code reads EXPO_PUBLIC_* at build time (Expo inlines them). Next only
// inlines NEXT_PUBLIC_*, so pass the EXPO_PUBLIC_* ones through explicitly.
const expoPublicEnv = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => k.startsWith("EXPO_PUBLIC_"))
);

// Static files `require()`d by RN code (images, fonts, sounds) must resolve to
// a URL string, which is what react-native-web's <Image source> and the
// audio/font shims expect. Next's own image loader returns an object instead.
const ASSET_RE = /\.(png|jpe?g|gif|webp|bmp|ttf|otf|woff2?|mp3|wav|m4a|aac|ogg|mp4|mov|webm)$/i;

function excludeAssetsFromNextImageLoader(rules) {
  for (const rule of rules) {
    if (!rule || typeof rule !== "object") continue;
    if (rule.oneOf) excludeAssetsFromNextImageLoader(rule.oneOf);
    if (rule.loader === "next-image-loader" || rule.loader?.includes?.("next-image-loader")) {
      rule.exclude = [].concat(rule.exclude || [], ASSET_RE);
    }
  }
}

const nextConfig = {
  reactStrictMode: false,
  env: expoPublicEnv,
  transpilePackages: [
    "nativewind",
    "react-native-css-interop",
    "react-native-web",
    "react-native-element-dropdown",
  ],
  webpack: (config, { webpack, dev }) => {
    config.resolve.alias = { ...config.resolve.alias, ...alias };
    // Prefer .web.* platform files (camera backends etc), like Metro does.
    config.resolve.extensions = [
      ".web.tsx",
      ".web.ts",
      ".web.js",
      ".web.jsx",
      ...config.resolve.extensions,
    ];

    excludeAssetsFromNextImageLoader(config.module.rules);
    config.module.rules.push({
      test: ASSET_RE,
      type: "asset/resource",
      generator: { filename: "static/media/[name].[hash:8][ext]" },
    });

    config.plugins.push(
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(dev),
        "process.env.EXPO_OS": JSON.stringify("web"),
      })
    );
    return config;
  },
};

module.exports = nextConfig;
