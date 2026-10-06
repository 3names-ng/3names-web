import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import type * as ScreenCaptureType from "expo-screen-capture";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "../ui/ThemedText";
import ReportContentSheet from "../ui/reportContentSheet";
import type { ReportableContentType } from "@/service/report.service";
import { useTheme } from "@/hooks/useTheme";

const SCREEN_CAPTURE_KEY = "past-question-viewer";

// Loaded defensively: the native module only exists once a dev-client/
// production build has been rebuilt after adding this package — an older
// installed build (or Expo Go) will throw "Cannot find native module" the
// instant the package is imported, so we swallow that here and simply skip
// screenshot prevention rather than crashing the screen.
let ScreenCapture: typeof ScreenCaptureType | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ScreenCapture = require("expo-screen-capture");
} catch (err) {
  console.warn(
    "[DocumentViewerModal] expo-screen-capture native module unavailable (rebuild the dev client to enable screenshot prevention):",
    err,
  );
}

interface Props {
  visible: boolean;
  fileUrl: string | null;
  fileName?: string;
  onClose: () => void;
  /** When set, shows a Report button for this document (hide it for the uploader). */
  report?: { targetType: ReportableContentType; targetId: string };
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|heic)(\?|$)/i;
const MIN_SCALE = 1;
const MAX_SCALE = 5;

/** Pinch-to-zoom (two fingers) with pan-while-zoomed; snaps back to fit when released at 1x. */
function ZoomableImage({
  uri,
  onLoadEnd,
  onError,
}: {
  uri: string;
  onLoadEnd: () => void;
  onError: () => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value <= MIN_SCALE) return;
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={styles.contentWrapper}>
        <Animated.Image
          source={{ uri }}
          style={[styles.image, animatedStyle]}
          resizeMode="contain"
          onLoadEnd={onLoadEnd}
          onError={onError}
        />
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * Renders a past-question file in-app, so users never need to download it
 * to their device to view it. Images render natively (Google Docs Viewer
 * doesn't handle plain images well and errors with "could not preview the
 * file"); PDFs/DOCX go through Google Docs Viewer for cross-platform support.
 */
export default function DocumentViewerModal({
  visible,
  fileUrl,
  fileName,
  onClose,
  report,
}: Props) {
  const { colors, isDark } = useTheme();
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const isImage = useMemo(
    () => IMAGE_EXT_RE.test(fileName || "") || IMAGE_EXT_RE.test(fileUrl || ""),
    [fileName, fileUrl],
  );

  // Block screenshots/screen recording while a paid past question is on screen,
  // so buyers can't bypass the purchase by capturing the content. Guarded
  // because the native module is only present in a dev-client/production
  // build that was compiled after this package was added — Expo Go or an
  // older dev-client binary won't have it yet.
  useEffect(() => {
    const screenCapture = ScreenCapture;
    if (!visible || !screenCapture) return;
    screenCapture.preventScreenCaptureAsync(SCREEN_CAPTURE_KEY).catch((err) => {
      console.warn("[DocumentViewerModal] Screen capture prevention unavailable:", err);
    });
    return () => {
      screenCapture.allowScreenCaptureAsync(SCREEN_CAPTURE_KEY).catch(() => {});
    };
  }, [visible]);

  const viewerUrl =
    fileUrl && !isImage
      ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
      : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        setLoading(true);
        setFailed(false);
      }}
    >
      <SafeAreaView
        edges={["top", "bottom"]}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <ThemedText numberOfLines={1} style={styles.headerTitle}>
            {fileName || "Document"}
          </ThemedText>
          {report && (
            <TouchableOpacity
              onPress={() => setShowReport(true)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ marginRight: 16 }}
              accessibilityLabel="Report document"
            >
              <Ionicons name="flag-outline" size={22} color={isDark ? "#F4F4F5" : "#18181B"} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name="close"
              size={26}
              color={isDark ? "#F4F4F5" : "#18181B"}
            />
          </TouchableOpacity>
        </View>

        {report && (
          <ReportContentSheet
            visible={showReport}
            targetType={report.targetType}
            targetId={report.targetId}
            subject="document"
            onClose={() => setShowReport(false)}
          />
        )}

        <View style={styles.contentWrapper}>
          {failed ? (
            <View style={styles.centered}>
              <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
              <ThemedText style={styles.errorText}>
                Unable to preview this file.
              </ThemedText>
            </View>
          ) : isImage && fileUrl ? (
            <ZoomableImage
              key={fileUrl}
              uri={fileUrl}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
            />
          ) : viewerUrl && Platform.OS === "web" ? (
            // Browsers can't use react-native-webview — an iframe does the same job
            <iframe
              src={viewerUrl}
              title="Document"
              style={{ flex: 1, width: "100%", height: "100%", border: "none" }}
              onLoad={() => setLoading(false)}
            />
          ) : viewerUrl ? (
            <WebView
              source={{ uri: viewerUrl }}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
              renderLoading={() => (
                <ActivityIndicator
                  size="large"
                  color="#6C47FF"
                  style={StyleSheet.absoluteFill}
                />
              )}
            />
          ) : null}

          {loading && !failed && (viewerUrl || isImage) ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.loadingOverlay,
                { backgroundColor: colors.background },
              ]}
            >
              <ActivityIndicator size="large" color="#6C47FF" />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "700", marginRight: 12 },
  contentWrapper: { flex: 1, overflow: "hidden" },
  webview: { flex: 1 },
  image: { flex: 1, width: "100%", height: "100%" },
  loadingOverlay: { alignItems: "center", justifyContent: "center" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  errorText: { fontSize: 14, textAlign: "center" },
});
