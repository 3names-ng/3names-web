import React, { useEffect } from "react";
import {
  View,
  Switch,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import {
  useNotificationSettingsStore,
  NotificationPreferenceKey,
} from "@/store/notificationSettingsStore";
import { showSuccess } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/useTranslation";

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  disabled?: boolean;
  onToggle: (value: boolean) => void;
}

function SettingRow({
  icon,
  title,
  subtitle,
  value,
  disabled,
  onToggle,
}: SettingRowProps) {
  const { colors } = useTheme();
  const primaryAccent = colors.primary || "#7C3AED";

  return (
    <ThemedView
      style={[
        styles.row,
        { borderColor: colors.border },
        disabled && styles.rowDisabled,
      ]}
    >
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
        disabled={disabled}
        trackColor={{ false: colors.border, true: primaryAccent }}
        thumbColor={value ? "#FFFFFF" : "#F4F4F5"}
        ios_backgroundColor={colors.border}
      />
    </ThemedView>
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

export default function NotificationSettingsScreen() {
  const { colors, isDark } = useTheme();
  const primaryAccent = colors.primary || "#7C3AED";
  const { t } = useTranslation();

  const {
    pushEnabled,
    messages,
    marketplace,
    hostel,
    leaderboard,
    general,
    war,
    soundEnabled,
    setPreference,
    resetDefaults,
    syncFromServer,
  } = useNotificationSettingsStore();

  // Sync from server on mount
  useEffect(() => {
    syncFromServer();
  }, []);

  const handleToggle = (
    key: NotificationPreferenceKey,
    value: boolean
  ) => {
    setPreference(key, value);
  };

  const handleReset = () => {
    resetDefaults();
    showSuccess("Notification settings restored to defaults");
  };

  const categoryDisabled = !pushEnabled;

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
          Notification Settings
        </ThemedText>
        <View style={styles.placeholderIconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="PUSH NOTIFICATIONS" />
        <SettingRow
          icon={<Ionicons name="notifications" size={20} color={primaryAccent} />}
          title={t("settings.notifications")}
          subtitle="Receive push notifications on this device"
          value={pushEnabled}
          onToggle={(value) => handleToggle("pushEnabled", value)}
        />

        <SectionHeader title="NOTIFICATION TYPES" />
        <SettingRow
          icon={<Ionicons name="chatbubble-ellipses" size={20} color={primaryAccent} />}
          title="Social"
          subtitle="Likes, comments, follows, shares and mentions"
          value={messages}
          disabled={categoryDisabled}
          onToggle={(value) => handleToggle("messages", value)}
        />
        <SettingRow
          icon={<Ionicons name="pricetag" size={20} color={primaryAccent} />}
          title={t("settings.marketplace")}
          subtitle="New listings, offers and marketplace updates"
          value={marketplace}
          disabled={categoryDisabled}
          onToggle={(value) => handleToggle("marketplace", value)}
        />
        <SettingRow
          icon={<Ionicons name="business" size={20} color={primaryAccent} />}
          title={t("settings.hostel")}
          subtitle="Hostel listings and booking updates"
          value={hostel}
          disabled={categoryDisabled}
          onToggle={(value) => handleToggle("hostel", value)}
        />
        <SettingRow
          icon={<Ionicons name="trophy" size={20} color={primaryAccent} />}
          title={t("settings.leaderboard")}
          subtitle="Level ups, leaderboard changes and achievements"
          value={leaderboard}
          disabled={categoryDisabled}
          onToggle={(value) => handleToggle("leaderboard", value)}
        />
        <SettingRow
          icon={<Ionicons name="megaphone" size={20} color={primaryAccent} />}
          title={t("settings.general")}
          subtitle="Announcements and product updates"
          value={general}
          disabled={categoryDisabled}
          onToggle={(value) => handleToggle("general", value)}
        />
        <SettingRow
          icon={<Ionicons name="flash" size={20} color={primaryAccent} />}
          title="Brain Battle"
          subtitle="Battle challenges, results, and scheduled reminders"
          value={war}
          disabled={categoryDisabled}
          onToggle={(value) => handleToggle("war", value)}
        />

        <SectionHeader title="PREFERENCES" />
        <SettingRow
          icon={<Ionicons name="volume-high" size={20} color={primaryAccent} />}
          title={t("settings.soundEnabled")}
          subtitle="Play a sound when a notification arrives"
          value={soundEnabled}
          onToggle={(value) => handleToggle("soundEnabled", value)}
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
  rowDisabled: {
    opacity: 0.5,
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
