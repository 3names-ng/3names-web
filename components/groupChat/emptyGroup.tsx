import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";

import {
  Users,
  Plus,
} from "lucide-react-native";

interface Props {
  onCreate?: () => void;
}

export default function EmptyGroups({
  onCreate,
}: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">

      {/* Illustration */}

      <View className="w-28 h-28 rounded-full bg-blue-600/15 items-center justify-center">

        <Users
          size={56}
          color="#3B82F6"
        />

      </View>

      {/* Title */}

      <Text className="text-white text-2xl font-bold mt-8">
        No Communities Yet
      </Text>

      {/* Description */}

      <Text className="text-zinc-400 text-center mt-3 leading-6">
        Join your school's communities to connect with classmates,
        share learning materials, discuss assignments, and stay updated
        with campus activities.
      </Text>

      {/* Features */}

      <View className="w-full mt-10">

        <View className="flex-row items-center mb-4">

          <Text className="text-2xl mr-3">
            📚
          </Text>

          <Text className="text-zinc-300 flex-1">
            Share lecture notes and study materials
          </Text>

        </View>

        <View className="flex-row items-center mb-4">

          <Text className="text-2xl mr-3">
            💬
          </Text>

          <Text className="text-zinc-300 flex-1">
            Chat with classmates in real time
          </Text>

        </View>

        <View className="flex-row items-center mb-4">

          <Text className="text-2xl mr-3">
            🎁
          </Text>

          <Text className="text-zinc-300 flex-1">
            Send gifts and earn community rewards
          </Text>

        </View>

        <View className="flex-row items-center">

          <Text className="text-2xl mr-3">
            🎓
          </Text>

          <Text className="text-zinc-300 flex-1">
            Meet students from your school and department
          </Text>

        </View>

      </View>

      {/* Create Button */}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onCreate}
        className="mt-12 bg-blue-600 rounded-2xl px-8 py-4 flex-row items-center"
      >
        <Plus
          size={20}
          color="#FFF"
        />

        <Text className="text-white text-base font-bold ml-2">
          Create Community
        </Text>

      </TouchableOpacity>

    </View>
  );
}