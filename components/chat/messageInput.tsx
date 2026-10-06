import React, { useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "@/hooks/useTheme";

interface Props {
  onSend?: (message: string) => void;
  onAttachment?: () => void;
  onCamera?: () => void;
  onVoice?: () => void;
}

export default function MessageInput({
  onSend,
  onAttachment,
  onCamera,
  onVoice,
}: Props) {
  const { colors } = useTheme();

  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;

    onSend?.(message);

    setMessage("");
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      {/* Attachment */}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onAttachment}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons
          name="add-circle-outline"
          size={28}
          color="#7C3AED"
        />
      </TouchableOpacity>

      {/* Input Box */}

      <View
        style={{
          flex: 1,
          marginHorizontal: 10,
          minHeight: 50,
          maxHeight: 120,
          borderRadius: 25,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 14,
          paddingVertical: 6,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            marginBottom: 8,
            marginRight: 8,
          }}
        >
          <Ionicons
            name="happy-outline"
            size={22}
            color={colors.secondary}
          />
        </TouchableOpacity>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor={colors.secondary}
          multiline
          style={{
            flex: 1,
            color: colors.text,
            fontSize: 16,
            maxHeight: 100,
            paddingVertical: 8,
          }}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onCamera}
          style={{
            marginBottom: 8,
            marginLeft: 8,
          }}
        >
          <Ionicons
            name="camera-outline"
            size={22}
            color={colors.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Right Button */}

      {message.trim().length > 0 ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSend}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "#7C3AED",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="send"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onVoice}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "#7C3AED",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name="microphone"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}