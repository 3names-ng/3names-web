import React from "react";
import {
  View,
  Switch,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import {
  usePrivacySettingsStore,
  PrivacyPreferenceKey,
} from "@/store/privacySettingsStore";
import { showInfo, showSuccess } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/useTranslation";

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onToggle,
}: ToggleRowProps) {
  const { colors } = useTheme();
  const primaryAccent = colors.primary || "#7C3AED";

  return (
    <ThemedView style={[styles.row, { borderColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
        {icon}
      </View>

      <View style={styles.rowText}>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
        <ThemedText style={[styles.rowSubtitle, { color: colors.muted }]}>
          {subtitle}
        </ThemedText>
      </View>

      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: primaryAccent }}
        thumbColor={value ? "#FFFFFF" : "#F4F4F5"}
        ios_backgroundColor={colors.border}
      />
    </ThemedView>
  );
}

interface LinkRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

function LinkRow({ icon, title, subtitle, onPress }: LinkRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        { borderColor: colors.border }
     ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
        {icon}
      </View>

      <View style={styles.rowText}>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText style={[styles.rowSubtitle, { color: colors.muted }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <ThemedText style={[styles.sectionHeader, { color: colors.muted }]}>
      {title}
    </ThemedText>
  );
}

export default function PrivacySecurityScreen() {
  const { colors, isDark } = useTheme();
  const primaryAccent = colors.primary || "#7C3AED";
  const { t } = useTranslation();

  const {
    privateProfile,
    onlineStatus,
    readReceipts,
    activityStatus,
    dataSharing,
    setPreference,
    resetDefaults,
    syncFromServer,
    pushToServer,
  } = usePrivacySettingsStore();

  // Pull the latest settings from the backend when this screen opens,
  // so the switches reflect what's stored server-side (all devices).
  React.useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  const handleToggle = (key: PrivacyPreferenceKey, value: boolean) => {
    // Apply locally first (instant UI), then persist to the backend
    setPreference(key, value);
    pushToServer(key, value);
  };

  const handleReset = () => {
    resetDefaults();
    showSuccess("Privacy settings restored to defaults");
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.iconButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
          Privacy & Security
        </ThemedText>
        <View style={styles.placeholderIconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="PRIVACY" />
        <ToggleRow
          icon={<Ionicons name="lock-closed" size={20} color={primaryAccent} />}
          title="Private Profile"
          subtitle="Only your followers can see your posts and profile"
          value={privateProfile}
          onToggle={(value) => handleToggle("privateProfile", value)}
        />
        <ToggleRow
          icon={<Ionicons name="radio" size={20} color={primaryAccent} />}
          title={t("settings.onlineStatus")}
          subtitle="Show when you're active to other users"
          value={onlineStatus}
          onToggle={(value) => handleToggle("onlineStatus", value)}
        />
        <ToggleRow
          icon={<Ionicons name="checkmark-done" size={20} color={primaryAccent} />}
          title={t("settings.readReceipts")}
          subtitle="Let others see when you've read their messages"
          value={readReceipts}
          onToggle={(value) => handleToggle("readReceipts", value)}
        />
        <ToggleRow
          icon={<Ionicons name="trophy" size={20} color={primaryAccent} />}
          title={t("settings.activityStatus")}
          subtitle="Share your activity and leaderboard participation"
          value={activityStatus}
          onToggle={(value) => handleToggle("activityStatus", value)}
        />
        <ToggleRow
          icon={<Ionicons name="bar-chart" size={20} color={primaryAccent} />}
          title="Personalized Content"
          subtitle="Allow us to personalize content using your activity"
          value={dataSharing}
          onToggle={(value) => handleToggle("dataSharing", value)}
        />

        <SectionHeader title="SECURITY" />
        <LinkRow
          icon={<Ionicons name="key" size={20} color={primaryAccent} />}
          title="Change Password"
          subtitle="Update your account password"
          onPress={() => router.push("/(features)/changePasswordScreen")}
        />
        <LinkRow
          icon={<Ionicons name="shield-checkmark" size={20} color={primaryAccent} />}
          title="Two-Factor Authentication"
          subtitle="Add an extra layer of security"
          onPress={() => router.push("/(features)/twoFactorSettingsScreen")}
        />
        <LinkRow
          icon={<Ionicons name="ban" size={20} color={primaryAccent} />}
          title="Manage Blocked Users"
          subtitle="View and unblock accounts"
          onPress={() => router.push("/(features)/blockedUsersScreen")}
        />

        <Pressable
          onPress={handleReset}
          style={[
            styles.resetButton,
            { backgroundColor: colors.primaryLight },
          ]}
        >
          <Ionicons name="refresh" size={18} color={primaryAccent} />
          <ThemedText style={[styles.resetButtonText, { color: primaryAccent }]}>
            Reset to Defaults
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 44,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIconButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowText: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    marginTop: 20,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
