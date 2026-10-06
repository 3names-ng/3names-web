/**
 * BubbleCustomizerModal — lets users pick bubble color and shape.
 * Extracted from both chat screens (identical in both).
 */
import React from "react";
import { View, TouchableOpacity, Modal, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Check, X } from "lucide-react-native";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import {
  BUBBLE_COLOR_OPTIONS,
  BUBBLE_STYLE_OPTIONS,
  getBubbleCornerStyle,
  getContrastTextColor,
} from "@/components/chat/shared/chatTypes";

interface BubbleCustomizerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  draftColor: string;
  draftStyle: string;
  setColor: (c: string) => void;
  setStyle: (s: string) => void;
  saving: boolean;
  colors: {
    card?: string;
    background: string;
    text: string;
    border: string;
    muted?: string;
  };
}

export default function BubbleCustomizerModal({
  visible,
  onClose,
  onSave,
  draftColor,
  draftStyle,
  setColor,
  setStyle,
  saving,
  colors,
}: BubbleCustomizerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.card || colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 36,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <ThemedText className="text-lg font-bold">
              Customize My Chat Bubble
            </ThemedText>
            <TouchableOpacity onPress={onClose} className="p-1 rounded-full">
              <X size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Live Preview */}
          <View className="items-end mb-6">
            <View
              style={{
                backgroundColor: draftColor,
                ...getBubbleCornerStyle(draftStyle, true),
                maxWidth: "80%",
              }}
              className="px-3.5 py-2.5"
            >
              <ThemedText
                style={{ color: getContrastTextColor(draftColor), fontSize: 13 }}
              >
                Hey! This is how your messages will look ✨
              </ThemedText>
            </View>
          </View>

          {/* Color Options */}
          <ThemedText className="text-xs font-semibold mb-2.5">
            Bubble Color
          </ThemedText>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {BUBBLE_COLOR_OPTIONS.map((color) => {
              const isSelected = draftColor === color;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => setColor(color)}
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: color,
                    borderWidth: isSelected ? 3 : 0,
                    borderColor: colors.text,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  {isSelected && <Check size={16} color={getContrastTextColor(color)} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Style Options */}
          <ThemedText className="text-xs font-semibold mb-2.5">
            Bubble Style
          </ThemedText>
          <View className="flex-row gap-3 mb-6">
            {BUBBLE_STYLE_OPTIONS.map((styleOption) => {
              const isSelected = draftStyle === styleOption.key;
              return (
                <TouchableOpacity
                  key={styleOption.key}
                  onPress={() => setStyle(styleOption.key)}
                  style={{
                    flex: 1, borderWidth: 1.5,
                    borderColor: isSelected ? draftColor : colors.border,
                    backgroundColor: colors.background,
                  }}
                  className="items-center py-3 rounded-2xl"
                >
                  <View
                    style={{
                      width: 40, height: 24,
                      backgroundColor: draftColor,
                      ...getBubbleCornerStyle(styleOption.key, true),
                    }}
                  />
                  <ThemedText
                    style={{ marginTop: 8, fontSize: 12, fontWeight: isSelected ? "700" : "500" }}
                  >
                    {styleOption.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={{ backgroundColor: draftColor, opacity: saving ? 0.7 : 1 }}
            className="py-3.5 rounded-2xl items-center justify-center flex-row"
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color={getContrastTextColor(draftColor)} />
            ) : (
              <ThemedText
                style={{ color: getContrastTextColor(draftColor), fontWeight: "700", fontSize: 14 }}
              >
                Save Bubble Style
              </ThemedText>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
