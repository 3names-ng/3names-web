import React, { useState } from 'react';
import {
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Rocket, ShieldCheck, Gift, Bell, ArrowLeft } from 'lucide-react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showSuccess } from '@/components/ui/toast';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { router } from 'expo-router';

export default function ComingSoonScreen({ navigation }: any) {
  const [notified, setNotified] = useState(false);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const handleNotifyMe = () => {
    setNotified(true);
    showSuccess(t('comingSoon.onTheList'), t('comingSoon.willNotify'));
  };

  // Primary brand accent color (fallbacks to preset purple if not specified in theme)
  const primaryAccent = colors.primary || '#6C5CE7';
  const mutedTextColor = colors.text || colors.text || (isDark ? '#9CA3AF' : '#64748B');
  const cardBgColor = colors.card || (isDark ? '#1E1E2D' : '#FFFFFF');
  const borderColor = colors.border || (isDark ? '#2D2D3F' : '#E9D5FF');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background || (isDark ? '#0F0F17' : '#FAF9FF') }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* TOP HEADER / BACK BUTTON */}
      <ThemedView style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={colors.text || (isDark ? '#FFFFFF' : '#1E1B4B')} />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BACKGROUND DECORATIVE ELEMENTS */}
        <ThemedView style={styles.bgDecorationContainer} pointerEvents="none">
          <ThemedText style={[styles.shapeCircle, { top: 60, left: 30, borderColor: primaryAccent + '80' }]} />
          <ThemedText style={[styles.shapeCross, { top: 110, left: 60, color: primaryAccent + '80' }]}>×</ThemedText>
          <ThemedText style={[styles.shapeCross, { top: 180, right: 70, color: primaryAccent + '80' }]}>×</ThemedText>
          <ThemedText style={[styles.shapeCross, { top: 300, left: 45, color: primaryAccent + '80' }]}>×</ThemedText>
          <ThemedText style={[styles.shapeTriangle, { top: 260, right: 35, color: primaryAccent + '80' }]}>△</ThemedText>
          <ThemedText style={[styles.shapeCircle, { bottom: 320, right: 45, borderColor: primaryAccent + '80' }]} />
        </ThemedView>

        {/* HERO ROCKET ILLUSTRATION & BADGE */}
        <ThemedView style={styles.heroSection}>
          <LinearGradient
            colors={
              isDark
                ? ['#2D1F47', '#1A132B', colors.background || '#0F0F17']
                : ['#F3E8FF', '#FAF5FF', '#FFFFFF']
            }
            style={styles.heroGlowCircle}
          >
            {/* 3D Rocket Icon */}
            <Rocket size={160} color={primaryAccent} />
          </LinearGradient>

          {/* Floating "COMING SOON" Badge */}
          <ThemedView
            style={[
              styles.badgeContainer,
              { backgroundColor: primaryAccent, shadowColor: primaryAccent },
            ]}
          >
            <ThemedText style={styles.badgeText}>{t('comingSoon.badge')}</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* MAIN HEADLINE & SUBTITLE */}
        <ThemedView style={styles.headerTextSection}>
          <ThemedText style={styles.mainTitle}>
            {t('comingSoon.title').split('\n')[0]}{'\n'}
            <ThemedText style={[styles.highlightTitle, { color: primaryAccent }]}>
              {t('comingSoon.title').split('\n')[1] || 'Amazing Is Coming!'}
            </ThemedText>
          </ThemedText>

          {/* CENTER DIVIDER WITH ROCKET ICON */}
          <ThemedView style={styles.dividerRow}>
            <ThemedView style={[styles.dividerLine, { backgroundColor: borderColor }]} />
            <ThemedView
              style={[
                styles.dividerIconBadge,
                { backgroundColor: cardBgColor, borderColor: borderColor },
              ]}
            >
              <Rocket size={14} color={primaryAccent} />
            </ThemedView>
            <ThemedView style={[styles.dividerLine, { backgroundColor: borderColor }]} />
          </ThemedView>

          <ThemedText style={[styles.subTitle, { color: mutedTextColor }]}>
            {t('comingSoon.subtitle').split('\n')[0]}{'\n'}{t('comingSoon.subtitle').split('\n')[1] || ''}
          </ThemedText>
          <ThemedText style={styles.stayTunedText}>{t('comingSoon.stayTuned')}</ThemedText>
        </ThemedView>

        {/* 3-COLUMN FEATURE CARDS CONTAINER */}
        <ThemedView
          style={[
            styles.featureCard,
            {
              backgroundColor: cardBgColor,
              borderColor: borderColor,
              borderWidth: isDark ? 1 : 0,
            },
          ]}
        >
          {/* Feature Item 1 */}
          <ThemedView style={styles.featureItem}>
            <ThemedView
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? '#2D1F47' : '#F3E8FF' },
              ]}
            >
              <Rocket size={22} color={primaryAccent} />
            </ThemedView>
            <ThemedText style={styles.featureTitle}>{t('comingSoon.newFeatures')}</ThemedText>
            <ThemedText style={[styles.featureDesc, { color: mutedTextColor }]}>
              {t('comingSoon.newFeaturesDesc')}
            </ThemedText>
          </ThemedView>

          {/* Feature Item 2 */}
          <ThemedView style={styles.featureItem}>
            <ThemedView
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? '#2D1F47' : '#F3E8FF' },
              ]}
            >
              <ShieldCheck size={22} color={primaryAccent} />
            </ThemedView>
            <ThemedText style={styles.featureTitle}>{t('comingSoon.betterExperience')}</ThemedText>
            <ThemedText style={[styles.featureDesc, { color: mutedTextColor }]}>
              {t('comingSoon.betterExperienceDesc')}
            </ThemedText>
          </ThemedView>

          {/* Feature Item 3 */}
          <ThemedView style={styles.featureItem}>
            <ThemedView
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? '#2D1F47' : '#F3E8FF' },
              ]}
            >
              <Gift size={22} color={primaryAccent} />
            </ThemedView>
            <ThemedText style={styles.featureTitle}>{t('comingSoon.excitingRewards')}</ThemedText>
            <ThemedText style={[styles.featureDesc, { color: mutedTextColor }]}>
              {t('comingSoon.excitingRewardsDesc')}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* BOTTOM CALL TO ACTION (CTA) SECTION */}
        <ThemedView style={styles.ctaSection}>
          <ThemedText style={styles.ctaTitle}>{t('comingSoon.ctaTitle')}</ThemedText>
          <ThemedText style={[styles.ctaSubtext, { color: mutedTextColor }]}>
            {t('comingSoon.ctaSubtitle')}
          </ThemedText>

          {/* Primary Notify Button */}
          <TouchableOpacity
            style={[
              styles.notifyButton,
              { backgroundColor: primaryAccent, shadowColor: primaryAccent },
              notified && styles.notifyButtonActive,
            ]}
            activeOpacity={0.8}
            onPress={handleNotifyMe}
          >
            <Bell size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <ThemedText style={styles.notifyButtonText}>
              {notified ? t('comingSoon.notified') : t('comingSoon.notifyMe')}
            </ThemedText>
          </TouchableOpacity>

          {/* Secondary Back Button */}
          <TouchableOpacity
            style={styles.backHomeButton}
            onPress={() => router?.back?.()}
          >
            <ThemedText style={[styles.backHomeText, { color: primaryAccent }]}>
              {t('comingSoon.goBack')}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'transparent',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },

  /* Background Decorations */
  bgDecorationContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  shapeCircle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    opacity: 0.7,
  },
  shapeCross: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.6,
  },
  shapeTriangle: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.6,
  },

  /* Hero Graphic Section */
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
    backgroundColor: 'transparent',
  },
  heroGlowCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ rotate: '-2deg' }],
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },

  /* Header Typography */
  headerTextSection: {
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: 'transparent',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
  },
  highlightTitle: {
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '65%',
    marginVertical: 16,
    backgroundColor: 'transparent',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  subTitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  stayTunedText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },

  /* Feature Grid Card */
  featureCard: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    justifyContent: 'space-between',
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },

  /* Bottom Action Section */
  ctaSection: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  ctaSubtext: {
    fontSize: 13,
    marginBottom: 18,
  },
  notifyButton: {
    flexDirection: 'row',
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  notifyButtonActive: {
    backgroundColor: '#059669',
  },
  notifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backHomeButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  backHomeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});