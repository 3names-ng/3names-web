import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { useDelayedLoading } from "@/components/ui/skeleton";
import HostelCard from "./hostelCard";
import HostelListSkeleton from "./hostelCardSkeleton";

interface HostelListProps {
  hostels: any[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRetry: () => void;
  onRefresh: () => void;
}

export default function HostelList({
  hostels,
  loading,
  refreshing,
  error,
  onRetry,
  onRefresh,
}: HostelListProps) {
  const showSkeleton = useDelayedLoading(loading && !refreshing);

  // Initial Loading State
  if (loading && !refreshing) {
    return showSkeleton ? <HostelListSkeleton /> : null;
  }

  // Error State
  if (error && !refreshing) {
    return (
      <View className="py-10 px-6 items-center justify-center bg-red-500/10 rounded-2xl border border-red-500/20 my-4 mx-4">
        <View className="w-12 h-12 rounded-full bg-red-500/20 items-center justify-center mb-3">
          <Feather name="alert-circle" size={24} color="#EF4444" />
        </View>
        <Text className="text-red-400 text-base font-bold text-center mb-1">
          Failed to Load Hostels
        </Text>
        {/* <Text className="text-gray-400 text-xs text-center mb-4 leading-5">
          {error}
        </Text> */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onRetry}
          className="flex-row items-center bg-red-500 px-4 py-2.5 rounded-xl space-x-2"
        >
          <Feather name="refresh-cw" size={14} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold ml-1.5">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty State
  if (hostels.length === 0 && !refreshing) {
    return (
      <View className="py-12 px-6 items-center justify-center">
        <View className="w-14 h-14 rounded-full bg-gray-800/80 items-center justify-center mb-3">
          <Feather name="home" size={26} color="#9CA3AF" />
        </View>
        <Text className="text-white text-base font-bold text-center mb-1">
          No Hostels Found
        </Text>
        <Text className="text-gray-400 text-xs text-center mb-5 max-w-[240px]">
          There are no hostel listings available in your area right now.
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onRefresh}
          className="flex-row items-center bg-gray-800 px-4 py-2.5 rounded-xl border border-gray-700"
        >
          <Feather name="refresh-cw" size={14} color="#D1D5DB" />
          <Text className="text-gray-200 text-xs font-semibold ml-1.5">Refresh List</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="space-y-3">
      {hostels.map((item) => {
        const id = item.id || item._id;
        const name = item.title || item.hostelName || item.name || "Hostel";
        const image = item.photos?.[0] || item.imageUrls?.[0] || item.image || "";
        const location = item.address || item.city || item.location || "Location not provided";
        const price = item.price || item.monthlyRent || 0;
        const rooms = item.availableRooms ?? item.rooms ?? 0;
        const beds = item.capacity ?? item.beds ?? 0;

        return (
          <HostelCard
            key={id}
            name={name}
            image={image}
            location={location}
            price={price}
            rating={item.rating ?? 0}
            rooms={rooms}
            beds={beds}
            onPress={() => {
              if (id) {
                router.push(`/(features)/hostel/${id}` as any);
              }
            }}
          />
        );
      })}
    </View>
  );
}