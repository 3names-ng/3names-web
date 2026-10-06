import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";

import {
  Search,
  X,
} from "lucide-react-native";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

export default function SearchBar({
  value,
  onChangeText,
}: Props) {
  return (
    <View className="px-5 mb-5">
      <View className="h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex-row items-center px-4">

        <Search
          size={20}
          color="#71717A"
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search communities..."
          placeholderTextColor="#71717A"
          className="flex-1 text-white text-base ml-3"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor="#3B82F6"
        />

        {value.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onChangeText("")}
            className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center"
          >
            <X
              size={16}
              color="#A1A1AA"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}