import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import {
  getWaveformBars,
  useWaveformStore,
  WAVEFORM_DEFAULT_TINT,
  WAVEFORM_LIMITS,
  WAVEFORM_TINT_OPTIONS,
} from "@/store/waveformStore";
import { showSuccess } from "@/components/ui/toast";

// ---------- HSV color helpers ----------
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const hsvToRgb = (
  h: number,
  s: number,
  v: number
): [number, number, number] => {
  const hue = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - c;
  let rgb: [number, number, number];
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return [
    Math.round((rgb[0] + m) * 255),
    Math.round((rgb[1] + m) * 255),
    Math.round((rgb[2] + m) * 255),
  ];
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

const hexToHsv = (hex: string) => {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0");
  const num = parseInt(full, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
};

// Full HSV picker — saturation/value square + hue bar, drag to pick any color
interface HsvPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

function HsvPicker({ value, onChange }: HsvPickerProps) {
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const hsvRef = useRef(hsv);
  useEffect(() => {
    hsvRef.current = hsv;
  }, [hsv]);

  // Keep the picker in sync when the color is changed elsewhere (Auto / reset)
  useEffect(() => {
    const currentHex = rgbToHex(
      ...hsvToRgb(hsvRef.current.h, hsvRef.current.s, hsvRef.current.v)
    );
    if (currentHex.toLowerCase() !== value.toLowerCase()) {
      const next = hexToHsv(value);
      hsvRef.current = next;
      setHsv(next);
    }
  }, [value]);

  const svSize = useRef({ width: 0, height: 0 });
  const hueWidth = useRef(0);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const updateFromSv = (x: number, y: number) => {
    if (svSize.current.width === 0 || svSize.current.height === 0) return;
    const s = clamp01(x / svSize.current.width);
    const v = clamp01(1 - y / svSize.current.height);
    const { h } = hsvRef.current;
    const next = { h, s, v };
    hsvRef.current = next;
    setHsv(next);
    onChangeRef.current(rgbToHex(...hsvToRgb(h, s, v)));
  };

  const updateFromHue = (x: number) => {
    if (hueWidth.current === 0) return;
    const h = clamp01(x / hueWidth.current) * 360;
    const { s, v } = hsvRef.current;
    const next = { h, s, v };
    hsvRef.current = next;
    setHsv(next);
    onChangeRef.current(rgbToHex(...hsvToRgb(h, s, v)));
  };

  const svResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) =>
        updateFromSv(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
      onPanResponderMove: (evt) =>
        updateFromSv(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
    })
  ).current;

  const hueResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => updateFromHue(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => updateFromHue(evt.nativeEvent.locationX),
    })
  ).current;

  return (
    <View style={styles.pickerBody}>
      {/* Saturation / value square */}
      <View
        style={[styles.svArea, { backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }]}
        onLayout={(e) => {
          svSize.current = e.nativeEvent.layout;
        }}
        {...svResponder.panHandlers}
      >
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,1)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,1)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[
            styles.svMarker,
            { left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` },
          ]}
        />
      </View>

      {/* Hue bar */}
      <View
        style={styles.hueBar}
        onLayout={(e) => {
          hueWidth.current = e.nativeEvent.layout.width;
        }}
        {...hueResponder.panHandlers}
      >
        <LinearGradient
          pointerEvents="none"
          colors={[
            "#ff0000",
            "#ffff00",
            "#00ff00",
            "#00ffff",
            "#0000ff",
            "#ff00ff",
            "#ff0000",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[styles.hueMarker, { left: `${(hsv.h / 360) * 100}%` }]}
        />
      </View>
    </View>
  );
}

// Live animated preview of the waveform using the current settings
function WaveformPreview() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const settings = useWaveformStore();

  const barAnims = useRef<Animated.Value[]>([]);
  if (barAnims.current.length !== settings.barCount) {
    barAnims.current = Array.from(
      { length: settings.barCount },
      () => new Animated.Value(1),
    );
  }

  const bars = useMemo(
    () => getWaveformBars("waveform-preview", settings.barCount),
    [settings.barCount],
  );

  // Loop the traveling wave so the preview matches the real bubble
  useEffect(() => {
    const perBar = barAnims.current.map((anim) =>
      Animated.sequence([
        Animated.timing(anim, {
          toValue: settings.pulseDip,
          duration: settings.pulseDuration,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: settings.pulseDuration,
          useNativeDriver: true,
        }),
      ]),
    );
    const waveLoop = Animated.loop(
      Animated.stagger(settings.waveStagger, perBar),
    );
    waveLoop.start();
    return () => {
      waveLoop.stop();
      barAnims.current.forEach((anim) => anim.setValue(1));
    };
  }, [
    settings.barCount,
    settings.pulseDip,
    settings.pulseDuration,
    settings.waveStagger,
  ]);

  const trackColor = isDark
    ? "rgba(255, 255, 255, 0.25)"
    : "rgba(0, 0, 0, 0.15)";
  const tintColor = settings.tintColor || colors.primary || "#3b82f6";
  const containerHeight = settings.maxHeight + 4;

  return (
    <ThemedView style={[styles.previewCard, { borderColor: colors.border }]}>
      <ThemedText style={[styles.previewLabel, { color: colors.muted }]}>
        {t("waveform.preview")}
      </ThemedText>

      <View style={{ height: containerHeight, justifyContent: "center" }}>
        {/* Unplayed (track) bars */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: settings.barGap,
          }}
        >
          {bars.map((h, i) => (
            <Animated.View
              key={i}
              style={{
                width: settings.barWidth,
                height: Math.max(3, settings.maxHeight * h),
                borderRadius: 1.5,
                backgroundColor: trackColor,
                opacity: settings.trackOpacity,
                transform: [{ scaleY: barAnims.current[i] }],
              }}
            />
          ))}
        </View>

        {/* Tinted played portion (~30%) */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "30%",
            overflow: "hidden",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: settings.barGap,
            }}
          >
            {bars.map((h, i) => (
              <Animated.View
                key={i}
                style={{
                  width: settings.barWidth,
                  height: Math.max(3, settings.maxHeight * h),
                  borderRadius: 1.5,
                  backgroundColor: tintColor,
                  transform: [{ scaleY: barAnims.current[i] }],
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

interface StepperRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

function StepperRow({
  icon,
  title,
  subtitle,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: StepperRowProps) {
  const { colors } = useTheme();
  const primaryAccent = colors.primary || "#7C3AED";

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  // Snap to the step to avoid floating-point drift
  const snap = (v: number) => Math.round(v / step) * step;

  return (
    <ThemedView style={[styles.row, { borderColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
        {icon}
      </View>

      <View style={styles.rowText}>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
        <ThemedText style={[styles.rowSubtitle, { color: colors.muted }]}>
          {subtitle}
        </ThemedText>
      </View>

      <View style={styles.stepper}>
        <Pressable
          onPress={() => onChange(clamp(snap(value - step)))}
          disabled={value <= min}
          style={[styles.stepperBtn, { borderColor: colors.border }]}
        >
          <Ionicons
            name="remove"
            size={16}
            color={value <= min ? colors.border : primaryAccent}
          />
        </Pressable>
        <ThemedText style={[styles.stepperValue, { color: colors.text }]}>
          {format(value)}
        </ThemedText>
        <Pressable
          onPress={() => onChange(clamp(snap(value + step)))}
          disabled={value >= max}
          style={[styles.stepperBtn, { borderColor: colors.border }]}
        >
          <Ionicons
            name="add"
            size={16}
            color={value >= max ? colors.border : primaryAccent}
          />
        </Pressable>
      </View>
    </ThemedView>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <ThemedText style={[styles.sectionHeader, { color: colors.muted }]}>
      {title}
    </ThemedText>
  );
}

export default function WaveformSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const primaryAccent = colors.primary || "#7C3AED";

  const settings = useWaveformStore();
  const { update } = settings;

  const handleReset = () => {
    settings.resetDefaults();
    showSuccess(t("waveform.settingsRestored"));
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.iconButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
          {t("waveform.headerTitle")}
        </ThemedText>
        <View style={styles.placeholderIconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WaveformPreview />

        <SectionHeader title={t("waveform.shape")} />
        <StepperRow
          icon={<Ionicons name="reorder-four" size={20} color={primaryAccent} />}
          title={t("waveform.barCount")}
          subtitle={t("waveform.barCountDesc")}
          value={settings.barCount}
          {...WAVEFORM_LIMITS.barCount}
          format={(v) => t("waveform.barCountFormat", { count: String(v) })}
          onChange={(v) => update({ barCount: v })}
        />
        <StepperRow
          icon={<Ionicons name="resize" size={20} color={primaryAccent} />}
          title={t("waveform.barWidth")}
          subtitle={t("waveform.barWidthDesc")}
          value={settings.barWidth}
          {...WAVEFORM_LIMITS.barWidth}
          format={(v) => t("waveform.barWidthFormat", { count: String(v) })}
          onChange={(v) => update({ barWidth: v })}
        />
        <StepperRow
          icon={<Ionicons name="options-outline" size={20} color={primaryAccent} />}
          title={t("waveform.barGap")}
          subtitle={t("waveform.barGapDesc")}
          value={settings.barGap}
          {...WAVEFORM_LIMITS.barGap}
          format={(v) => t("waveform.barGapFormat", { count: String(v) })}
          onChange={(v) => update({ barGap: v })}
        />
        <StepperRow
          icon={<Ionicons name="trending-up" size={20} color={primaryAccent} />}
          title={t("waveform.maxHeight")}
          subtitle={t("waveform.maxHeightDesc")}
          value={settings.maxHeight}
          {...WAVEFORM_LIMITS.maxHeight}
          format={(v) => t("waveform.maxHeightFormat", { count: String(v) })}
          onChange={(v) => update({ maxHeight: v })}
        />

        <SectionHeader title={t("waveform.color")} />
        <StepperRow
          icon={<Ionicons name="contrast" size={20} color={primaryAccent} />}
          title={t("waveform.trackOpacity")}
          subtitle={t("waveform.trackOpacityDesc")}
          value={settings.trackOpacity}
          {...WAVEFORM_LIMITS.trackOpacity}
          format={(v) => t("waveform.trackOpacityFormat", { count: String(Math.round(v * 100)) })}
          onChange={(v) => update({ trackOpacity: v })}
        />

        {/* Played-bar tint color picker */}
        <ThemedView style={[styles.colorCard, { borderColor: colors.border }]}>
          <View style={styles.colorCardHeader}>
            <View
              style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}
            >
              <Ionicons
                name="color-palette"
                size={20}
                color={primaryAccent}
              />
            </View>
            <View style={styles.rowText}>
              <ThemedText style={styles.rowTitle}>{t("waveform.playedBarColor")}</ThemedText>
              <ThemedText style={[styles.rowSubtitle, { color: colors.muted }]}>
                {t("waveform.playedBarColorDesc")}
              </ThemedText>
            </View>
          </View>

          {/* Quick-select presets */}
          <View style={styles.swatchRow}>
            {WAVEFORM_TINT_OPTIONS.map((color) => {
              const isSelected = settings.tintColor === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => update({ tintColor: color })}
                  style={[
                    styles.swatch,
                    { borderColor: colors.border },
                    isSelected && {
                      borderColor: primaryAccent,
                      borderWidth: 3,
                    },
                  ]}
                >
                  <View
                    style={[styles.swatchColor, { backgroundColor: color }]}
                  />
                </Pressable>
              );
            })}
          </View>

          <HsvPicker
            value={settings.tintColor || WAVEFORM_DEFAULT_TINT}
            onChange={(hex) => update({ tintColor: hex })}
          />

          <View style={styles.pickerFooter}>
            <ThemedText style={[styles.hexLabel, { color: colors.muted }]}>
                {settings.tintColor
                  ? settings.tintColor.toUpperCase()
                  : t("waveform.autoMatchesBubble")}
              </ThemedText>
              <Pressable
                onPress={() => update({ tintColor: null })}
                style={[styles.autoBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="color-wand" size={14} color={primaryAccent} />
                <ThemedText style={[styles.autoBtnText, { color: primaryAccent }]}>
                  {t("waveform.auto")}
                </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        <SectionHeader title={t("waveform.animation")} />
        <StepperRow
          icon={<Ionicons name="speedometer" size={20} color={primaryAccent} />}
          title={t("waveform.pulseSpeed")}
          subtitle={t("waveform.pulseSpeedDesc")}
          value={settings.pulseDuration}
          {...WAVEFORM_LIMITS.pulseDuration}
          format={(v) => t("waveform.pulseSpeedFormat", { count: String(v) })}
          onChange={(v) => update({ pulseDuration: v })}
        />
        <StepperRow
          icon={<Ionicons name="swap-horizontal" size={20} color={primaryAccent} />}
          title={t("waveform.waveSpeed")}
          subtitle={t("waveform.waveSpeedDesc")}
          value={settings.waveStagger}
          {...WAVEFORM_LIMITS.waveStagger}
          format={(v) => t("waveform.waveSpeedFormat", { count: String(v) })}
          onChange={(v) => update({ waveStagger: v })}
        />
        <StepperRow
          icon={<Ionicons name="pulse" size={20} color={primaryAccent} />}
          title={t("waveform.pulseDepth")}
          subtitle={t("waveform.pulseDepthDesc")}
          value={settings.pulseDip}
          {...WAVEFORM_LIMITS.pulseDip}
          format={(v) => t("waveform.pulseDepthFormat", { count: String(Math.round(v * 100)) })}
          onChange={(v) => update({ pulseDip: v })}
        />

        <Pressable
          onPress={handleReset}
          style={[
            styles.resetButton,
            { backgroundColor: colors.primaryLight },
          ]}
        >
          <RotateCcw size={18} color={primaryAccent} />
          <ThemedText style={[styles.resetButtonText, { color: primaryAccent }]}>
            {t("waveform.resetDefaults")}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 44,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIconButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  previewCard: {
    marginTop: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowText: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  colorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  colorCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  swatchColor: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  pickerBody: {
    marginTop: 14,
  },
  svArea: {
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
  },
  svMarker: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    marginTop: -9,
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  hueBar: {
    height: 16,
    borderRadius: 8,
    marginTop: 12,
    overflow: "hidden",
  },
  hueMarker: {
    position: "absolute",
    top: -3,
    width: 14,
    height: 22,
    marginLeft: -7,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  pickerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  hexLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  autoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
  },
  autoBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperValue: {
    fontSize: 13,
    fontWeight: "700",
    minWidth: 64,
    textAlign: "center",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    marginTop: 20,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
