import React from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import {
  useLanguageStore,
  LANGUAGES,
  LanguageCode,
} from "@/store/languageStore";
import { showSuccess } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/useTranslation";

function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <ThemedText style={[styles.sectionHeader, { color: colors.muted }]}>
      {title}
    </ThemedText>
  );
}

export default function LanguageSettingsScreen() {
  const { colors, isDark } = useTheme();
  const primaryAccent = colors.primary || "#7C3AED";
  const { t } = useTranslation();

  const { language, setLanguage } = useLanguageStore();

  const handleSelect = (code: LanguageCode) => {
    if (code === language) return;
    setLanguage(code);
    const selected = LANGUAGES.find((l) => l.code === code);
    showSuccess(
      t("language.setTo", { language: selected?.nativeName || code }),
      t("language.updated")
    );
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
      />

      {/* Header */}
      <ThemedView
        style={[
          styles.header,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card || "transparent" },
          ]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>

        <ThemedText style={styles.headerTitle}>{t("language.title")}</ThemedText>

        <View style={{ width: 35 }} />
      </ThemedView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title={t("language.select")} />

        <ThemedView
          style={[
            styles.card,
            { borderColor: colors.border, backgroundColor: colors.card || colors.background },
          ]}
        >
          {LANGUAGES.map((lang, index) => {
            const isSelected = language === lang.code;
            const isLast = index === LANGUAGES.length - 1;

            return (
              <Pressable
                key={lang.code}
                onPress={() => handleSelect(lang.code)}
                style={[
                  styles.languageRow,
                  !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.languageLeft}>
                  <ThemedText style={styles.flagEmoji}>{lang.flag}</ThemedText>
                  <View style={styles.languageText}>
                    <ThemedText style={styles.languageName}>
                      {lang.name}
                    </ThemedText>
                    <ThemedText
                      style={[styles.languageNative, { color: colors.muted }]}
                    >
                      {lang.nativeName}
                    </ThemedText>
                  </View>
                </View>

                {isSelected && (
                  <View
                    style={[
                      styles.checkCircle,
                      { backgroundColor: primaryAccent },
                    ]}
                  >
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </ThemedView>

        <ThemedText
          style={[styles.footerNote, { color: colors.muted }]}
        >
          {t("language.footer")}
        </ThemedText>
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
    paddingTop: 54,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  languageLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  flagEmoji: {
    fontSize: 28,
  },
  languageText: {
    gap: 2,
  },
  languageName: {
    fontSize: 15,
    fontWeight: "500",
  },
  languageNative: {
    fontSize: 13,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  footerNote: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 20,
    marginLeft: 4,
  },
});
