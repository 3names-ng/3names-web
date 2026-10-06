import React, {
  useEffect,
  useRef,
} from "react";

import {
  TextInput,
  View,
} from "react-native";

import { useTheme } from "@/hooks/useTheme";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function OTPInput({
  value,
  onChange,
}: Props) {
  const { colors } = useTheme();

  const refs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (value.length === 6) {
      refs.current[5]?.blur();
    }
  }, [value]);

  const handleChange = (
    text: string,
    index: number
  ) => {
    const otp = value.split("");

    otp[index] = text;

    const finalOtp = otp.join("");

    onChange(finalOtp);

    if (
      text &&
      index < 5
    ) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (
    text: string,
    index: number
  ) => {
    if (
      !text &&
      index > 0
    ) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View
      className="flex-row justify-between mt-10"
    >
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            if (ref)
              refs.current[index] = ref;
          }}
          value={value[index] || ""}
          onChangeText={(text) =>
            handleChange(text, index)
          }
          onKeyPress={({ nativeEvent }) => {
            if (
              nativeEvent.key ===
              "Backspace"
            ) {
              handleBackspace(
                value[index],
                index
              );
            }
          }}
          keyboardType="number-pad"
          maxLength={1}
          style={{
            width: 52,
            height: 60,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            textAlign: "center",
            fontSize: 24,
            color: colors.text,
            fontWeight: "700",
          }}
        />
      ))}
    </View>
  );
}