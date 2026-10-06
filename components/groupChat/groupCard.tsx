import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";

import {
  ShieldCheck,
  Users,
  ChevronRight,
} from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Group } from "@/service/groupChat.service";

interface Props {
  group: Group;
  onPress: () => void;
}

export default function GroupCard({
  group,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="mb-4"
    >
      <LinearGradient
        colors={["#18181B", "#111113"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl border border-zinc-800 p-4"
      >
        <View className="flex-row">

          {/* Avatar */}

          {group.iconUrl ? (
            <Image
              source={{ uri: group.iconUrl }}
              className="w-20 h-20 rounded-3xl"
            />
          ) : (
            <View className="w-20 h-20 rounded-3xl bg-blue-600 justify-center items-center">
              <Text className="text-white text-3xl font-bold">
                {group.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Details */}

          <View className="flex-1 ml-4 justify-between">

            <View>

              <View className="flex-row items-center">

                <Text
                  numberOfLines={1}
                  className="text-white text-lg font-bold flex-1"
                >
                  {group.name}
                </Text>

                {group.isOfficial && (
                  <View className="flex-row items-center bg-blue-600/20 px-2 py-1 rounded-full">

                    <ShieldCheck
                      size={14}
                      color="#3B82F6"
                    />

                    <Text className="text-blue-400 text-[11px] font-bold ml-1">
                      Official
                    </Text>

                  </View>
                )}

              </View>

              {!!group.description && (
                <Text
                  numberOfLines={2}
                  className="text-zinc-400 mt-2 leading-5"
                >
                  {group.description}
                </Text>
              )}

            </View>

            {/* Footer */}

            <View className="flex-row items-center justify-between mt-4">

              <View className="flex-row items-center">

                <Users
                  size={15}
                  color="#71717A"
                />

                <Text className="text-zinc-500 text-xs ml-2">
                  {group?.membersCount ?? 0} Members
                </Text>

              </View>

              <View className="flex-row items-center">

                <View className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />

                <Text className="text-green-400 text-xs font-semibold">
                  Active
                </Text>

              </View>

            </View>

          </View>

          <ChevronRight
            size={22}
            color="#52525B"
          />

        </View>

        {/* Unread Badge */}

        {(group?.unreadCount ?? 0) > 0 && (
          <View className="absolute top-4 right-4 bg-red-500 min-w-[24px] h-6 rounded-full justify-center items-center px-2">

            <Text className="text-white text-xs font-bold">
              {group?.unreadCount}
            </Text>

          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}