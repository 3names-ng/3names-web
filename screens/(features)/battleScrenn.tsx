import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';


interface ModeCardProps {
  title: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  icon: string;
  prizeOrInfo: string;
  onSelect: () => void;
}

export const Theme = {
  colors: {
    background: '#0a0d1d',
    cardBg: '#131836',
    border: '#232a52',
    accentBlue: '#6366f1',
    accentPurple: '#a855f7',
    primaryButton: '#4f46e5',
    gold: '#f59e0b',
    textMain: '#ffffff',
    textMuted: '#94a3b8',
    green: '#22c55e',
    red: '#ef4444',
  },
};

const ModeCard = ({
  title,
  badge,
  badgeColor = Theme.colors.gold,
  description,
  icon,
  prizeOrInfo,
  onSelect,
}: ModeCardProps) => (
  <TouchableOpacity style={styles.card} onPress={onSelect} activeOpacity={0.85}>
    <View style={styles.cardHeader}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: badgeColor + '22', borderColor: badgeColor }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
    </View>

    <View style={styles.cardFooter}>
      <Text style={styles.infoText}>{prizeOrInfo}</Text>
      <View style={styles.enterBtn}>
        <Text style={styles.enterBtnText}>Enter Mode →</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export const BattleSelectorScreen = ({
  onSelectMode,
}: {
  onSelectMode: (mode: '1v1' | 'league' | 'tournament' | 'dept') => void;
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Battle Mode</Text>
        <Text style={styles.headerSubtitle}>Choose your arena and test your knowledge</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1v1 Battle */}
        <ModeCard
          title="1v1 Battle"
          badge="Instant Match"
          badgeColor={Theme.colors.green}
          description="Challenge active players in fast-paced 10-question duels."
          icon="⚔️"
          prizeOrInfo="🪙 Entry: 50 Coins • Instant XP & Rewards"
          onSelect={() => onSelectMode('1v1')}
        />

        {/* League */}
        <ModeCard
          title="Unilag League"
          badge="Season 1"
          badgeColor={Theme.colors.accentPurple}
          description="Compete across the season, climb tiers from Gold II to Legend."
          icon="🛡️"
          prizeOrInfo="🏆 Tier Rewards & Seasonal Chests"
          onSelect={() => onSelectMode('league')}
        />

        {/* Individual Tournament */}
        <ModeCard
          title="Individual Tournament"
          badge="Weekend Championship"
          badgeColor={Theme.colors.gold}
          description="Knockout bracket tournament. 128 to 256 solo players."
          icon="🏆"
          prizeOrInfo="💰 Prize Pool: 5,000 Coins"
          onSelect={() => onSelectMode('tournament')}
        />

        {/* Department Tournament */}
        <ModeCard
          title="Department Tournament"
          badge="Faculty Cup"
          badgeColor={Theme.colors.accentBlue}
          description="Represent your department in group stages and knockouts."
          icon="🏛️"
          prizeOrInfo="🥇 Prize Pool: 20,000 Coins"
          onSelect={() => onSelectMode('dept')}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: Theme.colors.textMain,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: Theme.colors.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  iconText: {
    fontSize: 22,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: Theme.colors.textMain,
    fontSize: 17,
    fontWeight: 'bold',
  },
  cardDesc: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    color: Theme.colors.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  enterBtn: {
    backgroundColor: Theme.colors.primaryButton,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  enterBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});