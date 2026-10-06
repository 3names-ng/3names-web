// Web stand-in for @react-native-community/datetimepicker, which renders
// nothing in a browser. metro.config.js swaps it in for web builds only, so
// screens keep importing the package as usual. Uses the browser's own
// date/time inputs and calls onChange the same way the native picker does.

import React, { useEffect, useRef } from "react";
import { View } from "react-native";

export type DateTimePickerEvent = {
  type: "set" | "dismissed" | "neutralButtonPressed";
  nativeEvent: { timestamp?: number; utcOffset?: number };
};

type Props = {
  value: Date;
  mode?: "date" | "time" | "datetime" | "countdown";
  minimumDate?: Date;
  maximumDate?: Date;
  onChange?: (event: DateTimePickerEvent, date?: Date) => void;
  // Native-only props are accepted and ignored
  [key: string]: unknown;
};

const pad = (n: number) => String(n).padStart(2, "0");
const toDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function format(d: Date, type: string): string {
  if (type === "time") return toTime(d);
  if (type === "datetime-local") return `${toDate(d)}T${toTime(d)}`;
  return toDate(d);
}

function parse(text: string, type: string, base: Date): Date | undefined {
  if (!text) return undefined;
  if (type === "time") {
    const [h, m] = text.split(":").map(Number);
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
  }
  if (type === "datetime-local") return new Date(text);
  const [y, mo, day] = text.split("-").map(Number);
  // Keep the time of day already chosen (the native date picker does too)
  const d = new Date(base);
  d.setFullYear(y, mo - 1, day);
  return d;
}

export default function DateTimePicker({ value, mode = "date", minimumDate, maximumDate, onChange }: Props) {
  const type = mode === "time" ? "time" : mode === "datetime" ? "datetime-local" : "date";
  const inputRef = useRef<HTMLInputElement>(null);

  // Like the native picker, open as soon as it's shown (Chrome, Edge, Safari 16+)
  useEffect(() => {
    const input = inputRef.current;
    try {
      input?.focus();
      input?.showPicker?.();
    } catch {
      // showPicker needs a user gesture in some browsers — the input stays tappable
    }
  }, []);

  const emit = (text: string) => {
    const date = parse(text, type, value);
    onChange?.(
      { type: date ? "set" : "dismissed", nativeEvent: { timestamp: date?.getTime() } },
      date,
    );
  };

  return (
    <View style={{ paddingVertical: 8 }}>
      <input
        ref={inputRef}
        type={type}
        defaultValue={format(value, type)}
        min={minimumDate ? format(minimumDate, type) : undefined}
        max={maximumDate ? format(maximumDate, type) : undefined}
        onChange={(e) => emit(e.currentTarget.value)}
        style={{ fontSize: 16, padding: 10, borderRadius: 8, border: "1px solid #ccc", width: "100%", boxSizing: "border-box" }}
      />
    </View>
  );
}
