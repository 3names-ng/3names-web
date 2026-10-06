import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import AuthHeader from "@/components/auth/authHeader";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

// Leagues and tournaments aren't built yet. Store review rejects "coming
// soon" placeholders, so they stay hidden until they ship.
const SHOW_UNRELEASED_MODES = false;

interface BattleArenaScreenProps {
  onSelectMode?: (mode: string) => void;
}

export default function BattleArenaScreen({ onSelectMode }: BattleArenaScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Modal State for Creating Mini Tournament
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  const [tournamentTitle, setTournamentTitle] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("8");
  const [entryFee, setEntryFee] = useState("50");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTournament = () => {
    if (!tournamentTitle.trim()) return;
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      setIsCreateTournamentOpen(false);
      setTournamentTitle("");
    }, 1000);
  };

  // const handleNavigation = (mode: string) => {
  //   if (onSelectMode) {
  //     onSelectMode(mode);
  //   }
  // };

  // Dynamic Theme Colors
  const borderColor = isDark ? "#1e2338" : "#e5e7eb";
  const innerCardBg = isDark ? "#0b0d18" : "#f3f4f6";
  const inputBg = isDark ? "#090a10" : "#f9fafb";
  const modalBg = isDark ? "#121626" : "#ffffff";
  const modalBorder = isDark ? "#232a42" : "#e5e7eb";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";
  const inputTextColor = isDark ? "#ffffff" : "#111827";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <AuthHeader
        title="BATTLE ARENA"
        subtitle="Choose how you want to fight and earn rewards ⚡"
        showBackButton={true}
      />

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* SECTION DIVIDER */}
        <View className="flex-row items-center justify-center mb-4 gap-2">
          <View className="h-[1px] flex-1" style={{ backgroundColor: borderColor }} />
          <ThemedText className="text-purple-500 text-xs font-bold tracking-widest uppercase">
            ◇ Choose Your Battle ◇
          </ThemedText>
          <View className="h-[1px] flex-1" style={{ backgroundColor: borderColor }} />
        </View>

        {/* GRID 1: 1v1 BATTLE & MINI LEAGUE */}
        <ThemedView className="flex-row gap-3 mb-3">
          {/* 1. ⚔️ 1v1 BATTLE */}
          <ThemedView
            className="flex-1 p-3 rounded-2xl justify-between border"
            style={{
              backgroundColor: isDark ? "#101323" : "#f5f3ff",
              borderColor: isDark ? "#282054" : "#ddd6fe",
            }}
          >
            <ThemedView style={{ backgroundColor: "transparent" }}>
              <ThemedView className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 items-center justify-center self-center mb-2">
                <MaterialCommunityIcons name="sword-cross" size={20} color="#a855f7" />
              </ThemedView>
              <ThemedText className="font-bold text-center text-sm mb-1">
                ⚔️ 1v1 BATTLE
              </ThemedText>

              {/* Rules Specs */}
              <ThemedView className="p-2 rounded-xl mb-3 gap-1" style={{ backgroundColor: innerCardBg }}>
                <ThemedText className="text-purple-600 dark:text-purple-300 text-[10px] font-medium">
                  🔑 Join: Anytime
                </ThemedText>
                <ThemedText className="text-purple-600 dark:text-purple-300 text-[10px] font-medium">
                  🚀 Start: Immediately
                </ThemedText>
                <ThemedText className="text-purple-600 dark:text-purple-300 text-[10px] font-medium">
                  🎮 Format: Matchmaking
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <TouchableOpacity
              onPress={() => router.push("/(features)/1v1")}
              className="bg-purple-600 py-2 rounded-xl items-center"
            >
              <ThemedText className="text-white font-bold text-xs">JOIN BATTLE</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* 2. ⚡ MINI LEAGUE */}
          {SHOW_UNRELEASED_MODES && (
          <ThemedView
            className="flex-1 p-3 rounded-2xl justify-between border"
            style={{
              backgroundColor: isDark ? "#0f231c" : "#ecfdf5",
              borderColor: isDark ? "rgba(16, 185, 129, 0.4)" : "#a7f3d0",
            }}
          >
            <ThemedView style={{ backgroundColor: "transparent" }}>
              <ThemedView className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center self-center mb-2">
                <Ionicons name="flash" size={20} color="#10b981" />
              </ThemedView>
              <ThemedText className="font-bold text-center text-sm mb-1">
                ⚡ MINI LEAGUE
              </ThemedText>

              {/* Rules Specs */}
              <ThemedView className="p-2 rounded-xl mb-3 gap-1" style={{ backgroundColor: innerCardBg }}>
                <ThemedText className="text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                  🔑 Join: Registration
                </ThemedText>
                <ThemedText className="text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                  🚀 Start: Scheduled
                </ThemedText>
                <ThemedText className="text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                  🎮 Format: Limited matches
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView className="gap-1.5" style={{ backgroundColor: "transparent" }}>
              <TouchableOpacity
              onPress={()=>router.push("/comingSoonScreen")}
                // onPress={() => setIsCreateTournamentOpen(true)}
                className="bg-emerald-600 py-2 rounded-xl items-center"
              >
                <ThemedText className="text-white font-bold text-xs">+ CREATE MINI</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity onPress={()=>router.push("/comingSoonScreen")} className="bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-600/40 py-1.5 rounded-xl items-center">
                <ThemedText className="text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]">
                  BROWSE ROOMS
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
          )}
        </ThemedView>

        {SHOW_UNRELEASED_MODES && (
        <>
        {/* GRID 2: INDIVIDUAL TOURNAMENT & DEPARTMENT TOURNAMENT */}
        <ThemedView className="flex-row gap-3 mb-3">
          {/* 3. 🏅 INDIVIDUAL TOURNAMENT */}
          <TouchableOpacity
          onPress={()=>router.push("/comingSoonScreen")}
            // onPress={() => handleNavigation("Tournament_Lobby")}
            activeOpacity={0.85}
            className="flex-1 p-3 rounded-2xl justify-between border"
            style={{
              backgroundColor: isDark ? "#1c180e" : "#fffbeb",
              borderColor: isDark ? "rgba(245, 158, 11, 0.4)" : "#fde68a",
            }}
          >
            <ThemedView style={{ backgroundColor: "transparent" }}>
              <ThemedView className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 items-center justify-center self-center mb-2">
                <FontAwesome5 name="award" size={18} color="#f59e0b" />
              </ThemedView>
              <ThemedText className="font-bold text-center text-sm mb-1">
                🏅 TOURNAMENT
              </ThemedText>

              {/* Rules Specs */}
              <ThemedView className="p-2 rounded-xl mb-3 gap-1" style={{ backgroundColor: innerCardBg }}>
                <ThemedText className="text-amber-700 dark:text-amber-300 text-[10px] font-medium">
                  🔑 Join: Registration
                </ThemedText>
                <ThemedText className="text-amber-700 dark:text-amber-300 text-[10px] font-medium">
                  🚀 Start: Fixed time
                </ThemedText>
                <ThemedText className="text-amber-700 dark:text-amber-300 text-[10px] font-medium">
                  🎮 Format: Scheduled matches
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView className="bg-amber-600 py-2 rounded-xl items-center">
              <ThemedText className="text-white font-bold text-xs">ENTER LOBBY</ThemedText>
            </ThemedView>
          </TouchableOpacity>

          {/* 4. 🏆 DEPARTMENT TOURNAMENT */}
          <TouchableOpacity
          onPress={()=>router.push("/comingSoonScreen")}
            // onPress={() => handleNavigation("Dept_Lobby")}
            activeOpacity={0.85}
            className="flex-1 p-3 rounded-2xl justify-between border"
            style={{
              backgroundColor: isDark ? "#0f172a" : "#f0f9ff",
              borderColor: isDark ? "rgba(56, 189, 248, 0.4)" : "#bae6fd",
            }}
          >
            <ThemedView style={{ backgroundColor: "transparent" }}>
              <ThemedView className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/40 items-center justify-center self-center mb-2">
                <FontAwesome5 name="trophy" size={18} color="#38bdf8" />
              </ThemedView>
              <ThemedText className="font-bold text-center text-sm mb-1">
                🏆 DEPT TOURNAMENT
              </ThemedText>

              {/* Rules Specs */}
              <ThemedView className="p-2 rounded-xl mb-3 gap-1" style={{ backgroundColor: innerCardBg }}>
                <ThemedText className="text-sky-700 dark:text-sky-300 text-[10px] font-medium">
                  🔑 Join: Dept Register
                </ThemedText>
                <ThemedText className="text-sky-700 dark:text-sky-300 text-[10px] font-medium">
                  🚀 Start: Fixed time
                </ThemedText>
                <ThemedText className="text-sky-700 dark:text-sky-300 text-[10px] font-medium">
                  🎮 Format: Team matches
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView className="bg-sky-600 py-2 rounded-xl items-center">
              <ThemedText className="text-white font-bold text-xs">FACULTY CUP</ThemedText>
            </ThemedView>
          </TouchableOpacity>
        </ThemedView>

        {/* BANNER 1: 🏆 LEAGUE */}
        <TouchableOpacity
        onPress={()=>router.push("/comingSoonScreen")}
          // onPress={() => handleNavigation("League_Overview")}
          activeOpacity={0.85}
          className="p-4 rounded-2xl mb-3 flex-row items-center justify-between border"
          style={{
            backgroundColor: isDark ? "#121026" : "#eeefee",
            borderColor: isDark ? "rgba(99, 102, 241, 0.5)" : "#c7d2fe",
          }}
        >
          <ThemedView className="flex-1 pr-2" style={{ backgroundColor: "transparent" }}>
            <ThemedView className="flex-row items-center gap-2 mb-1" style={{ backgroundColor: "transparent" }}>
              <FontAwesome5 name="shield-alt" size={16} color="#818cf8" />
              <ThemedText className="font-extrabold text-sm tracking-wide">
                🏆 SEASON LEAGUE
              </ThemedText>
            </ThemedView>
            <ThemedText className={`${subtextColor} text-[11px] mb-2`}>
              Registration open • Starts at season kickoff. Play whenever available to climb tiers.
            </ThemedText>
            <ThemedView className="flex-row gap-3" style={{ backgroundColor: "transparent" }}>
              <ThemedText className="text-indigo-600 dark:text-indigo-300 text-[10px] font-semibold">
                🔑 Registration
              </ThemedText>
              <ThemedText className="text-indigo-600 dark:text-indigo-300 text-[10px] font-semibold">
                🚀 Season start
              </ThemedText>
              <ThemedText className="text-indigo-600 dark:text-indigo-300 text-[10px] font-semibold">
                🎮 Play anytime
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView className="bg-indigo-600 px-3 py-2 rounded-xl">
            <ThemedText className="text-white font-bold text-xs">VIEW LEAGUE</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        {/* BANNER 2: 🏫 DEPARTMENT WAR */}
        <TouchableOpacity
        onPress={()=>router.push("/comingSoonScreen")}
          // onPress={() => handleNavigation("Dept_Standings")}
          activeOpacity={0.85}
          className="p-4 rounded-2xl mb-4 flex-row items-center justify-between border"
          style={{
            backgroundColor: isDark ? "#1e1026" : "#fdf2f8",
            borderColor: isDark ? "rgba(236, 72, 153, 0.5)" : "#fbcfe8",
          }}
        >
          <ThemedView className="flex-1 pr-2" style={{ backgroundColor: "transparent" }}>
            <ThemedView className="flex-row items-center gap-2 mb-1" style={{ backgroundColor: "transparent" }}>
              <FontAwesome5 name="university" size={16} color="#f472b6" />
              <ThemedText className="font-extrabold text-sm tracking-wide">
               ⚔️ Brain Battle
              </ThemedText>
            </ThemedView>
            <ThemedText className={`${subtextColor} text-[11px] mb-2`}>
              Automatic entry for all enrolled students. Active throughout the season.
            </ThemedText>
            <ThemedView className="flex-row gap-3" style={{ backgroundColor: "transparent" }}>
              <ThemedText className="text-pink-600 dark:text-pink-300 text-[10px] font-semibold">
                🔑 Automatic
              </ThemedText>
              <ThemedText className="text-pink-600 dark:text-pink-300 text-[10px] font-semibold">
                🚀 Season start
              </ThemedText>
              <ThemedText className="text-pink-600 dark:text-pink-300 text-[10px] font-semibold">
                🎮 Play games anytime
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView className="bg-pink-600 px-3 py-2 rounded-xl">
            <ThemedText className="text-white font-bold text-xs">WAR MAP</ThemedText>
          </ThemedView>
        </TouchableOpacity>
        </>
        )}
      </ScrollView>

      {/* MODAL: CREATE STUDENT TOURNAMENT */}
      <Modal
        visible={isCreateTournamentOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCreateTournamentOpen(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-end bg-black/50">
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{
                paddingBottom: Math.max(insets.bottom, 16),
                backgroundColor: modalBg,
                borderColor: modalBorder,
              }}
              className="border-t rounded-t-3xl p-5"
            >
              <ThemedView className="flex-row justify-between items-center mb-4" style={{ backgroundColor: "transparent" }}>
                <ThemedText className="text-lg font-bold">Create Mini Tournament</ThemedText>
                <TouchableOpacity onPress={() => setIsCreateTournamentOpen(false)}>
                  <Ionicons name="close" size={24} color={isDark ? "#9ca3af" : "#4b5563"} />
                </TouchableOpacity>
              </ThemedView>

              {/* Title Input */}
              <ThemedView className="mb-3" style={{ backgroundColor: "transparent" }}>
                <ThemedText className="text-xs font-medium mb-1">Tournament Title</ThemedText>
                <TextInput
                  value={tournamentTitle}
                  onChangeText={setTournamentTitle}
                  placeholder="e.g. CS Hostel Smash Cup"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  style={{
                    backgroundColor: inputBg,
                    borderColor: modalBorder,
                    color: inputTextColor,
                  }}
                  className="border p-3 rounded-xl text-sm"
                />
              </ThemedView>

              {/* Players & Entry Fee Row */}
              <ThemedView className="flex-row gap-3 mb-5" style={{ backgroundColor: "transparent" }}>
                <ThemedView className="flex-1" style={{ backgroundColor: "transparent" }}>
                  <ThemedText className="text-xs font-medium mb-1">Max Players</ThemedText>
                  <TextInput
                    value={maxPlayers}
                    onChangeText={setMaxPlayers}
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                    style={{
                      backgroundColor: inputBg,
                      borderColor: modalBorder,
                      color: inputTextColor,
                    }}
                    className="border p-3 rounded-xl text-sm"
                  />
                </ThemedView>

                <ThemedView className="flex-1" style={{ backgroundColor: "transparent" }}>
                  <ThemedText className="text-xs font-medium mb-1">Entry Fee (Coins)</ThemedText>
                  <TextInput
                    value={entryFee}
                    onChangeText={setEntryFee}
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                    style={{
                      backgroundColor: inputBg,
                      borderColor: modalBorder,
                      color: inputTextColor,
                    }}
                    className="border p-3 rounded-xl text-sm"
                  />
                </ThemedView>
              </ThemedView>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleCreateTournament}
                disabled={isCreating}
                className="bg-emerald-600 py-3.5 rounded-xl items-center"
              >
                <ThemedText className="text-white font-bold text-sm">
                  {isCreating ? "Creating Room..." : "Launch Tournament"}
                </ThemedText>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}