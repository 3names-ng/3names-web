import { Stack } from "expo-router";

export default function FeaturesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Allows iOS swipe-to-go-back gesture by default across this group
        gestureEnabled: true,
        // Smooth slide animation on transitions
        animation: "slide_from_right",
      }}
    >
      {/* ---------------- Screens with NO BACK GESTURE ---------------- */}
      
      {/* Past Questions / Exam Mode: Disable swipe-back to prevent accidental test exits */}
      <Stack.Screen
        name="pastQuestionsScreen"
        options={{
          gestureEnabled: false,
        }}
      />

      {/* Camera: Disable back swipe so swiping across camera controls doesn't close the screen */}
      <Stack.Screen
        name="cameraScreen"
        options={{
          gestureEnabled: false,
        }}
      />

      {/* ---------------- Standard Feature Screens ---------------- */}

      <Stack.Screen name="leaderboaderScreen" />
      <Stack.Screen name="groupChatScreen" />
      <Stack.Screen name="chatScreen" />
      <Stack.Screen name="notificationScreen" />
      <Stack.Screen name="followersFollowingScreen" />
      <Stack.Screen name="blockedUsersScreen" />
      <Stack.Screen name="notificationSettingsScreen" />
      <Stack.Screen name="waveformSettingsScreen" />
      <Stack.Screen name="privacySecurityScreen" />
      <Stack.Screen name="twoFactorSettingsScreen" />
      <Stack.Screen name="twoFactorVerifyScreen" />
      <Stack.Screen name="changePasswordScreen" />
      <Stack.Screen name="helpSupportScreen" />
      <Stack.Screen name="reportProblemScreen" />
      <Stack.Screen name="accountActionScreen" />
      <Stack.Screen name="storageCacheScreen" />
      <Stack.Screen name="languageSettingsScreen" />
      <Stack.Screen name="studentVerificationScreen" />
      <Stack.Screen name="searchScreen" />
      <Stack.Screen name="searchResultscreen" />
      <Stack.Screen name="aIAssistantScreen" />
      <Stack.Screen name="levelsScreen" />
      <Stack.Screen name="notes" />
      <Stack.Screen name="addPastQestion" />
      <Stack.Screen name="comingSoonScreen" />
      <Stack.Screen name="games/quizGame" />
      <Stack.Screen name="games/treasureHuntScreen" />
      <Stack.Screen name="games/coinBattleStakeScreen" />
      <Stack.Screen name="games/coinBattleArena" />
      <Stack.Screen name="userProfile/[id]" />
      <Stack.Screen name="departmentWar/index" />
      <Stack.Screen name="departmentWar/quickMatchUsers" />
      <Stack.Screen name="departmentWar/matchmaking" />
      <Stack.Screen name="departmentWar/battleArena" />
      <Stack.Screen name="departmentWar/searchOpponent" />
      <Stack.Screen name="departmentWar/battleHistory" />
      <Stack.Screen name="postDetailScreen" />
      <Stack.Screen name="jobsScreen" />
      <Stack.Screen name="jobDetailScreen" />
      <Stack.Screen name="postJobScreen" />
      <Stack.Screen name="1v1" />
      <Stack.Screen name="callHistoryScreen" />
      <Stack.Screen name="ringtoneSettingsScreen" />
      
    </Stack>
  );
}