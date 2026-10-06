import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface WaveformSettings {
  /** Number of bars in the waveform */
  barCount: number;
  /** Width of each bar in px */
  barWidth: number;
  /** Gap between bars in px */
  barGap: number;
  /** Tallest possible bar height in px */
  maxHeight: number;
  /** Opacity of the unplayed (track) bars — lower is fainter */
  trackOpacity: number;
  /** Played-bar tint color — null matches the bubble's text color (auto) */
  tintColor: string | null;
  /** Duration in ms of one bar pulse (down or up) */
  pulseDuration: number;
  /** Stagger delay in ms between bars — smaller sweeps faster */
  waveStagger: number;
  /** How far bars shrink while playing (0.2–1) */
  pulseDip: number;
}

interface WaveformSettingsState extends WaveformSettings {
  update: (partial: Partial<WaveformSettings>) => void;
  resetDefaults: () => void;
}

export const WAVEFORM_DEFAULTS: WaveformSettings = {
  barCount: 28,
  barWidth: 3,
  barGap: 2,
  maxHeight: 24,
  trackOpacity: 0.6,
  tintColor: null,
  pulseDuration: 260,
  waveStagger: 35,
  pulseDip: 0.45,
};

type NumericWaveformKey = Exclude<keyof WaveformSettings, "tintColor">;

/** Default tint shown in the color picker when the played-bar color is set to auto */
export const WAVEFORM_DEFAULT_TINT = "#3b82f6";

/** Quick-select preset colors for the played-bar tint */
export const WAVEFORM_TINT_OPTIONS: string[] = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#6366f1",
  "#0f172a",
];

/** Bounds used by the tuning UI steppers */
export const WAVEFORM_LIMITS: Record<
  NumericWaveformKey,
  { min: number; max: number; step: number }
> = {
  barCount: { min: 10, max: 40, step: 1 },
  barWidth: { min: 2, max: 5, step: 1 },
  barGap: { min: 1, max: 4, step: 1 },
  maxHeight: { min: 10, max: 40, step: 2 },
  trackOpacity: { min: 0.2, max: 1, step: 0.05 },
  pulseDuration: { min: 120, max: 500, step: 20 },
  waveStagger: { min: 10, max: 80, step: 5 },
  pulseDip: { min: 0.2, max: 1, step: 0.05 },
};

export const useWaveformStore = create<WaveformSettingsState>()(
  persist(
    (set) => ({
      ...WAVEFORM_DEFAULTS,

      update: (partial) => set(partial),

      resetDefaults: () => set(WAVEFORM_DEFAULTS),
    }),
    {
      name: "waveform-settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Deterministic pseudo-random bar heights so each voice note keeps a stable waveform
export const getWaveformBars = (uri: string, count: number) => {
  let hash = 0;
  for (let i = 0; i < uri.length; i++) {
    hash = (hash * 31 + uri.charCodeAt(i)) >>> 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    bars.push(0.25 + ((hash % 100) / 100) * 0.75);
  }
  return bars;
};
