import React, { useState } from "react";
import { openLegalPage } from "@/constants/legal";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";

const FAQ_ITEMS = [
  {
    question: "How do I change my password?",
    answer:
      "Go to Profile Menu → Privacy & Security → Change Password. You'll need your current password to set a new one.",
  },
  {
    question: "How do I verify my student status?",
    answer:
      "Go to Profile Menu → Student Verification and follow the steps to upload your school ID or verification letter.",
  },
  {
    question: "How do I report inappropriate content?",
    answer:
      "Open the post, tap the more options menu, and select Report. Our team reviews all reports.",
  },
  {
    question: "How do I earn coins?",
    answer:
      "You can earn coins by completing daily goals, participating in games, and staying active in the community.",
  },
  {
    question: "How do I get my past questions?",
    answer:
      "Head to the Past Questions tab, select your department and course, and download the past questions you need.",
  },
];

interface LinkRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  danger?: boolean;
  onPress: () => void;
}

function LinkRow({ icon, title, subtitle, danger, onPress }: LinkRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { borderColor: colors.border }]}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: danger ? "rgba(239, 68, 68, 0.12)" : colors.primaryLight },
        ]}
      >
        {icon}
      </View>

      <View style={styles.rowText}>
        <ThemedText style={[styles.rowTitle, danger && { color: "#EF4444" }]}>
          {title}
        </ThemedText>
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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <ThemedView style={[styles.row, styles.faqRow, { borderColor: colors.border }]}>
      <Pressable style={styles.faqHeader} onPress={() => setExpanded(!expanded)}>
        <View style={styles.faqText}>
          <ThemedText style={styles.rowTitle}>{question}</ThemedText>
          {expanded ? (
            <ThemedText style={[styles.rowSubtitle, { color: colors.muted }]}>
              {answer}
            </ThemedText>
          ) : null}
        </View>
        <ChevronDown
          size={18}
          color={colors.muted}
          style={[styles.faqChevron, expanded && styles.faqChevronRotated]}
        />
      </Pressable>
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

export default function HelpSupportScreen() {
  const { colors, isDark } = useTheme();
  const primaryAccent = colors.primary || "#7C3AED";

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
          Help & Support
        </ThemedText>
        <View style={styles.placeholderIconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="COMMON QUESTIONS" />
        {FAQ_ITEMS.map((item) => (
          <FaqItem key={item.question} question={item.question} answer={item.answer} />
        ))}

        <SectionHeader title="CONTACT US" />
        <LinkRow
          icon={<Ionicons name="flag" size={20} color="#EF4444" />}
          title="Report a Problem"
          subtitle="Tell us about an issue you're facing"
          onPress={() => router.push("/(features)/reportProblemScreen")}
        />
        <LinkRow
          icon={<Ionicons name="mail" size={20} color={primaryAccent} />}
          title="Email Support"
          subtitle="help@3names.ng"
          onPress={() =>
            Linking.openURL("mailto:help@3names.ng?subject=Help%20%26%20Support")
          }
        />

        <SectionHeader title="LEGAL" />
        <LinkRow
          icon={<Ionicons name="document-text" size={20} color={primaryAccent} />}
          title="Terms of Service"
          subtitle="The rules for using 3NAMES"
          onPress={() => openLegalPage("terms")}
        />
        <LinkRow
          icon={<Ionicons name="shield-checkmark" size={20} color={primaryAccent} />}
          title="Privacy Policy"
          subtitle="How we collect and use your data"
          onPress={() => openLegalPage("privacy")}
        />

        <SectionHeader title="ACCOUNT" />
        <LinkRow
          icon={<Ionicons name="pause-circle" size={20} color="#F59E0B" />}
          title="Deactivate Account"
          subtitle="Temporarily hide your account"
          onPress={() =>
            router.push("/(features)/accountActionScreen?mode=deactivate")
          }
        />
        <LinkRow
          icon={<Ionicons name="trash" size={20} color="#EF4444" />}
          title="Delete Account"
          subtitle="Permanently remove your account and data"
          danger
          onPress={() =>
            router.push("/(features)/accountActionScreen?mode=delete")
          }
        />

        <ThemedView style={styles.footerNote}>
          <ThemedText style={[styles.footerText, { color: colors.muted }]}>
            Need more help? Reach out to us anytime and we'll get back to you as
            soon as possible.
          </ThemedText>
        </ThemedView>
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
  faqRow: {
    padding: 0,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    flex: 1,
  },
  faqText: {
    flex: 1,
    marginRight: 8,
  },
  faqChevron: {
    transform: [{ rotate: "0deg" }],
  },
  faqChevronRotated: {
    transform: [{ rotate: "180deg" }],
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
  footerNote: {
    backgroundColor: "transparent",
    marginTop: 24,
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
