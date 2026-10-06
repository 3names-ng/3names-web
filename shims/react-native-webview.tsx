// Web stand-in for react-native-webview: an <iframe> for `source.uri` or
// `source.html`. Inline HTML gets a `window.ReactNativeWebView.postMessage`
// bridge so `onMessage` keeps working; cross-origin pages can't be observed,
// so onNavigationStateChange only reports the initial URL and
// injectedJavaScript only applies to inline HTML.
"use client";

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

export type WebViewMessageEvent = { nativeEvent: { data: string } };
export type WebViewNavigation = {
  url: string;
  title?: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
};

type Props = {
  source?: { uri?: string; html?: string };
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  startInLoadingState?: boolean;
  renderLoading?: () => ReactNode;
  onLoad?: () => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (e: unknown) => void;
  onMessage?: (event: WebViewMessageEvent) => void;
  onNavigationStateChange?: (nav: WebViewNavigation) => void;
  injectedJavaScript?: string;
  [key: string]: unknown;
};

const bridge = (id: string) =>
  `<script>window.ReactNativeWebView={postMessage:function(d){parent.postMessage({__rnwv:"${id}",data:String(d)},"*")}};</script>`;

let counter = 0;

export function WebView({
  source,
  style,
  containerStyle,
  startInLoadingState,
  renderLoading,
  onLoad,
  onLoadStart,
  onLoadEnd,
  onError,
  onMessage,
  onNavigationStateChange,
  injectedJavaScript,
}: Props) {
  const id = useMemo(() => `wv${++counter}`, []);
  const [loading, setLoading] = useState(true);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const srcDoc = useMemo(() => {
    if (source?.html == null) return undefined;
    const inject = injectedJavaScript ? `<script>${injectedJavaScript}</script>` : "";
    const html = source.html;
    return html.includes("<head>")
      ? html.replace("<head>", `<head>${bridge(id)}`) + inject
      : bridge(id) + html + inject;
  }, [source?.html, injectedJavaScript, id]);

  useEffect(() => {
    if (!onMessage) return;
    const handler = (e: MessageEvent) => {
      const d = e.data;
      if (d && d.__rnwv === id) onMessage({ nativeEvent: { data: d.data } });
      else if (frameRef.current && e.source === frameRef.current.contentWindow)
        onMessage({ nativeEvent: { data: typeof d === "string" ? d : JSON.stringify(d) } });
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [id, onMessage]);

  useEffect(() => {
    setLoading(true);
    onLoadStart?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.uri, srcDoc]);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
    onLoadEnd?.();
    if (source?.uri) {
      onNavigationStateChange?.({ url: source.uri, loading: false, canGoBack: false, canGoForward: false });
    }
  };

  return (
    <View style={[{ flex: 1, overflow: "hidden" }, containerStyle, style]}>
      <iframe
        ref={frameRef}
        src={srcDoc ? undefined : source?.uri}
        srcDoc={srcDoc}
        onLoad={handleLoad}
        onError={(e) => {
          setLoading(false);
          onError?.(e);
        }}
        allow="autoplay; fullscreen; clipboard-write"
        style={{ border: 0, width: "100%", height: "100%", flex: 1 }}
      />
      {startInLoadingState && loading && renderLoading ? (
        <View style={StyleSheet.absoluteFill}>{renderLoading()}</View>
      ) : null}
    </View>
  );
}

export default WebView;
