import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  ActivityIndicator,
  Alert,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown';
import { coinService } from '@/service/coin.service';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { NIGERIAN_BANKS } from '@/constants/banks';
import { usePerks } from '@/hooks/usePerks';
import { AlertBanner } from '@/components/alertBanner';
import { GAME_COINS_EXPLAINER } from '@/components/games/gameCoins';
import { Skeleton, SkeletonCircle, SkeletonGroup } from '@/components/ui/skeleton';

const CONVERSION_RATE = 10;

export default function EarningsScreen() {
  const [earnedBalance, setEarnedBalance] = useState<number>(0);
  // Purchased Campus Coins (`balance`) and earned game Stars (`bonusBalance`)
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [starBalance, setStarBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { colors, isDark } = useTheme();
  const { isLevelAtLeast } = usePerks();
  const [showPerkBanner, setShowPerkBanner] = useState(false);

  // Cash withdrawals are a level 5 (Hero) and above perk
  const canWithdrawCash = isLevelAtLeast(5);

  // Convert Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'full' | 'custom'>('full');
  const [customAmount, setCustomAmount] = useState('');

  // Withdraw Modal State
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Saved accounts — the user's managed list of withdrawal destinations
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [isLoadingSavedAccounts, setIsLoadingSavedAccounts] = useState(false);
  const [selectedSavedAccountId, setSelectedSavedAccountId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // "Add new account" form State (used to add a saved account, verified via Paystack)
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Info Modal State
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; description: string }>({
    title: '',
    description: '',
  });

  const fetchEarningsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [balanceData, txData] = await Promise.all([
        coinService.getBalance(),
        coinService.listTransactions({ limit: 10 }),
      ]);
      setEarnedBalance(Number(balanceData.earnedBalance || 0));
      setCoinBalance(Number(balanceData.balance || 0));
      setStarBalance(coinService.stakeableCoins(balanceData));
      setTransactions(txData.items || []);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load earnings data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  // Account Verification Effect
  useEffect(() => {
    const verifyAccount = async () => {
      const cleanAccount = accountNumber.trim();

      if (cleanAccount.length === 10 && bankCode) {
        try {
          setIsVerifyingAccount(true);
          setAccountError(null);
          setAccountName('');

          const res = await coinService.resolveAccountName({
            accountNumber: cleanAccount,
            bankCode,
          });

          if (res && res.accountName) {
            setAccountName(res.accountName);
          } else {
            setAccountError('Account resolution failed. Check bank and account number.');
          }
        } catch (error: any) {
          setAccountError(error.response?.data?.message || 'Could not verify account holder name.');
          setAccountName('');
        } finally {
          setIsVerifyingAccount(false);
        }
      } else {
        setAccountName('');
        setAccountError(null);
      }
    };

    verifyAccount();
  }, [accountNumber, bankCode]);

  const resetNewAccountForm = () => {
    setAccountNumber('');
    setBankName('');
    setBankCode('');
    setAccountName('');
    setAccountError(null);
  };

  const fetchSavedAccounts = useCallback(async () => {
    try {
      setIsLoadingSavedAccounts(true);
      const res: any = await coinService.getWithdrawalAccounts();
      const accounts = Array.isArray(res) ? res : res?.items || [];
      setSavedAccounts(accounts);
      setSelectedSavedAccountId((prev) => {
        if (prev && accounts.some((a: any) => a.id === prev)) return prev;
        return accounts[0]?.id ?? null;
      });
      setShowAddAccountForm(accounts.length === 0);
    } catch {
      setSavedAccounts([]);
    } finally {
      setIsLoadingSavedAccounts(false);
    }
  }, []);

  // Fetch saved accounts fresh each time the withdraw modal opens
  useEffect(() => {
    if (!withdrawModalVisible) return;
    fetchSavedAccounts();
  }, [withdrawModalVisible, fetchSavedAccounts]);

  const handleAddAccount = async () => {
    if (!accountName) {
      Alert.alert('Unverified Account', 'Please ensure the account name is verified before saving.');
      return;
    }
    try {
      setIsAddingAccount(true);
      const saved: any = await coinService.addWithdrawalAccount({ bankCode, bankName, accountNumber });
      resetNewAccountForm();
      setShowAddAccountForm(false);
      await fetchSavedAccounts();
      if (saved?.id) setSelectedSavedAccountId(saved.id);
    } catch (error: any) {
      Alert.alert('Could Not Save Account', error.response?.data?.message || 'Please try again.');
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleDeleteAccount = (account: any) => {
    if (savedAccounts.length <= 1) {
      Alert.alert('Cannot Remove', 'You must keep at least one saved bank account.');
      return;
    }
    Alert.alert(
      'Remove Account',
      `Remove ${account.bankName || account.bankCode} •••${account.accountNumber.slice(-4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingAccountId(account.id);
              await coinService.deleteWithdrawalAccount(account.id);
              await fetchSavedAccounts();
            } catch (error: any) {
              Alert.alert('Could Not Remove Account', error.response?.data?.message || 'Please try again.');
            } finally {
              setDeletingAccountId(null);
            }
          },
        },
      ],
    );
  };

  const totalCoins = Math.floor(earnedBalance / CONVERSION_RATE).toLocaleString();
  const numericCustom = parseFloat(customAmount.replace(/,/g, '')) || 0;
  const customCoins = Math.floor(numericCustom / CONVERSION_RATE).toLocaleString();

  const numericWithdraw = parseFloat(withdrawAmount.replace(/,/g, '')) || 0;

  const handleQuickSelect = (amount: number) => {
    setCustomAmount(amount.toString());
  };

  const handleWithdrawQuickSelect = (amount: number) => {
    setWithdrawAmount(amount.toString());
  };

  const handleOpenHelpInfo = () => {
    setInfoModalContent({
      title: 'Help & Support',
      description:
        'This screen allows you to manage your accumulated gift earnings.\n\n' +
        '• Convert to Coin: Convert your monetary balance directly into platform coins at a rate of ₦10 = 1 Coin.\n\n' +
        '• Withdraw as Cash: Transfer your earnings directly to your verified local bank account.\n\n' +
        '• Recent Earnings: View the breakdown and status of your most recent earnings and transactions.',
    });
    setInfoModalVisible(true);
  };

  const handleOpenGiftEarningsInfo = () => {
    setInfoModalContent({
      title: 'Total Gift Earnings',
      description:
        'This represents the total monetary value (₦) of virtual gifts received from supporters across your streams, posts, and interactions.\n\n' +
        'These funds accumulate here until you choose to convert them to platform coins or request a direct bank cash withdrawal.',
    });
    setInfoModalVisible(true);
  };

  const handleConfirmConversion = async () => {
    const amountToConvert = selectedOption === 'full' ? earnedBalance : numericCustom;

    if (amountToConvert <= 0) {
      Alert.alert('Invalid Amount', 'Please select or enter a valid amount to convert.');
      return;
    }

    if (amountToConvert > earnedBalance) {
      Alert.alert('Insufficient Balance', 'Specified amount exceeds your total earned balance.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await coinService.convertEarnedToCoins({ amountNgn: amountToConvert });
      Alert.alert(
        'Success',
        `Successfully converted ₦${amountToConvert.toLocaleString()} into ${result.coinsAdded} Campus Coins!`,
      );
      setModalVisible(false);
      setCustomAmount('');
      await fetchEarningsData();
    } catch (error: any) {
      Alert.alert('Conversion Failed', error.response?.data?.message || 'Could not process conversion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSavedAccount = savedAccounts.find((a) => a.id === selectedSavedAccountId) || null;

  const handleConfirmWithdrawal = async () => {
    if (numericWithdraw <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }

    if (numericWithdraw > earnedBalance) {
      Alert.alert('Insufficient Balance', 'Withdrawal amount exceeds your total earned balance.');
      return;
    }

    if (!selectedSavedAccount) {
      Alert.alert('No Account Selected', 'Please select or add a bank account to withdraw to.');
      return;
    }

    try {
      setIsSubmitting(true);
      await coinService.withdrawEarnings({
        amountNgn: numericWithdraw,
        savedAccountId: selectedSavedAccount.id,
      });

      Alert.alert(
        'Withdrawal Requested',
        `Your request to withdraw ₦${numericWithdraw.toLocaleString()} to ${selectedSavedAccount.accountName} (${selectedSavedAccount.bankName || selectedSavedAccount.bankCode}) has been submitted successfully!`,
      );

      setWithdrawModalVisible(false);
      setWithdrawAmount('');
      await fetchEarningsData();
    } catch (error: any) {
      Alert.alert('Withdrawal Failed', error.response?.data?.message || 'Could not process withdrawal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AlertBanner
        visible={showPerkBanner}
        onClose={() => setShowPerkBanner(false)}
        message="Reach Level 5 (Hero) to withdraw earnings as cash"
        themeColors={{
          cardBg: colors.warningLight,
          border: colors.warning,
          textSecondary: colors.muted || '#6B7280',
          accent: colors.primary,
        }}
      />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Top Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Earnings</ThemedText>
        
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleOpenHelpInfo}
        >
          <Ionicons name="help-circle-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.subHeaderDescription}>
          Track your earnings and choose how{'\n'}you want to receive them.
        </ThemedText>

        {/* Main Card */}
        <LinearGradient
          colors={isDark ? ['#1E1238', '#120D24'] : ['#6D28D9', '#4C1D95']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mainCard}
        >
          <View style={styles.cardHeaderRow}>
            <View style={{ backgroundColor: 'transparent' }}>
              <ThemedView style={[styles.labelRow, { backgroundColor: 'transparent' }]}>
                <ThemedText style={styles.cardLabel}>Total Gift Earnings</ThemedText>
                
                <TouchableOpacity onPress={handleOpenGiftEarningsInfo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="information-circle-outline" size={18} color="#A099BE" style={styles.infoIcon} />
                </TouchableOpacity>
              </ThemedView>

              {isLoading ? (
                <Skeleton width={170} height={30} radius={10} tone="onDark" style={{ marginVertical: 8 }} />
              ) : (
                <ThemedText style={styles.balanceText}>
                  ₦{earnedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </ThemedText>
              )}
            </View>

            <ThemedView style={[styles.walletGraphicContainer, { backgroundColor: 'transparent' }]}>
              <ThemedView style={styles.walletGraphic}>
                <Ionicons name="wallet" size={48} color="#8A52F3" />
                <ThemedView style={styles.coinBadge}>
                  <ThemedText style={styles.coinBadgeText}>₦</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </View>

          {/* Stats Sub-cards */}
          <ThemedView style={[styles.statsContainer, { backgroundColor: 'transparent' }]}>
            <ThemedView style={[styles.statBox, { backgroundColor: isDark ? '#120D23' : 'rgba(255, 255, 255, 0.1)', borderColor: isDark ? '#20183A' : 'rgba(255, 255, 255, 0.2)' }]}>
              <ThemedView style={[styles.statIconContainer, { backgroundColor: isDark ? '#2B1A4A' : 'rgba(255, 255, 255, 0.2)' }]}>
                <MaterialCommunityIcons name="wallet-outline" size={20} color={isDark ? '#8A52F3' : '#FFFFFF'} />
              </ThemedView>
              <ThemedView style={{ backgroundColor: 'transparent' }}>
                <ThemedText style={styles.statLabel}>Total Transactions</ThemedText>
                <ThemedText style={styles.statValue}>{transactions.length}</ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={[styles.statBox, { backgroundColor: isDark ? '#120D23' : 'rgba(255, 255, 255, 0.1)', borderColor: isDark ? '#20183A' : 'rgba(255, 255, 255, 0.2)' }]}>
              <ThemedView style={[styles.statIconContainer, { backgroundColor: isDark ? '#133527' : 'rgba(52, 199, 89, 0.2)' }]}>
                <Ionicons name="time" size={18} color="#34C759" />
              </ThemedView>
              <ThemedView style={{ backgroundColor: 'transparent' }}>
                <ThemedText style={styles.statLabel}>Last Received</ThemedText>
                <ThemedText style={styles.statValue}>
                  {transactions[0]
                    ? new Date(transactions[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'None'}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </LinearGradient>

        {/* Wallet balances: purchased Campus Coins and earned game Stars */}
        <ThemedText style={styles.sectionTitle}>Your Balances</ThemedText>
        <ThemedView style={[styles.actionGrid, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setInfoModalContent({
                title: 'Campus Coins',
                description:
                  'Campus Coins are bought with a top-up or converted from your gift earnings.\n\n' +
                  'Use them to send gifts and buy items in the app. They can\'t be staked in games or withdrawn.',
              });
              setInfoModalVisible(true);
            }}
            style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <ThemedText style={styles.balanceCardEmoji}>🪙</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.balanceCardLabel}>Campus Coins</ThemedText>
              {isLoading ? (
                <Skeleton width={64} height={20} radius={8} style={{ marginVertical: 3 }} />
              ) : (
                <ThemedText style={[styles.balanceCardValue, { color: '#F59E0B' }]}>
                  {coinBalance.toLocaleString()}
                </ThemedText>
              )}
              <ThemedText style={styles.balanceCardSub}>For gifts & the store</ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setInfoModalContent({ title: 'Stars', description: GAME_COINS_EXPLAINER });
              setInfoModalVisible(true);
            }}
            style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <ThemedText style={styles.balanceCardEmoji}>⭐</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.balanceCardLabel}>Stars</ThemedText>
              {isLoading ? (
                <Skeleton width={64} height={20} radius={8} style={{ marginVertical: 3 }} />
              ) : (
                <ThemedText style={[styles.balanceCardValue, { color: '#8B5CF6' }]}>
                  {starBalance.toLocaleString()}
                </ThemedText>
              )}
              <ThemedText style={styles.balanceCardSub}>Earned in games</ThemedText>
            </View>
          </TouchableOpacity>
        </ThemedView>

        {/* Section Title */}
        <ThemedText style={styles.sectionTitle}>Choose how to receive</ThemedText>

        {/* Action Cards Grid */}
        <ThemedView style={[styles.actionGrid, { backgroundColor: 'transparent' }]}>
          {/* Card 1: Convert to Coin */}
          <LinearGradient 
            colors={isDark ? ['#1D133B', '#120C24'] : ['#F3E8FF', '#E9D5FF']} 
            style={[styles.actionCard, { borderColor: isDark ? '#21183C' : '#DDD6FE' }]}
          >
            <ThemedView style={[styles.actionIconBg, { backgroundColor: isDark ? '#31215A' : '#D8B4FE' }]}>
              <FontAwesome5 name="coins" size={24} color="#FFD700" />
            </ThemedView>
            <ThemedText style={[styles.actionCardTitle, { color: isDark ? '#FFFFFF' : '#4C1D95' }]}>Convert to Coin</ThemedText>
            <ThemedText style={[styles.actionCardSub, { color: isDark ? '#7B779A' : '#6B21A8' }]}>Convert your earnings to 🪙 Campus Coins</ThemedText>
            <TouchableOpacity
              style={styles.convertButton}
              onPress={() => setModalVisible(true)}
            >
              <ThemedText style={styles.buttonText}>Convert Now</ThemedText>
              <Ionicons name="arrow-forward" size={14} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Card 2: Withdraw as Cash */}
          <LinearGradient 
            colors={isDark ? ['#102220', '#0B1716'] : ['#DCFCE7', '#BBF7D0']} 
            style={[styles.actionCard, { borderColor: isDark ? '#183D2F' : '#86EFAC' }]}
          >
            <ThemedView style={[styles.actionIconBg, { backgroundColor: isDark ? '#183D2F' : '#86EFAC' }]}>
              <FontAwesome5 name="money-bill-wave" size={20} color="#15803D" />
            </ThemedView>
            <ThemedText style={[styles.actionCardTitle, { color: isDark ? '#FFFFFF' : '#14532D' }]}>Withdraw as Cash</ThemedText>
            <ThemedText style={[styles.actionCardSub, { color: isDark ? '#7B779A' : '#166534' }]}>Withdraw your earnings to your bank account</ThemedText>
            {canWithdrawCash ? (
              <TouchableOpacity 
                style={styles.withdrawButton}
                onPress={() => setWithdrawModalVisible(true)}
              >
                <ThemedText style={styles.buttonText}>Withdraw Now</ThemedText>
                <Ionicons name="arrow-forward" size={14} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.withdrawButton, { backgroundColor: '#6B7280' }]}
                onPress={() => setShowPerkBanner(true)}
              >
                <Ionicons name="lock-closed" size={14} color="#FFF" />
                <ThemedText style={[styles.buttonText, { marginLeft: 6 }]}>Locked</ThemedText>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </ThemedView>

        {/* Section: Recent Earnings Header */}
        <ThemedView style={[styles.recentHeader, { backgroundColor: 'transparent' }]}>
          <ThemedText style={styles.sectionTitle}>Recent Earnings</ThemedText>
        </ThemedView>

        {/* List Card */}
        <ThemedView style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isLoading ? (
            <SkeletonGroup label="Loading transactions">
              {[0, 1, 2].map((i) => (
                <TransactionItemSkeleton key={i} isLast={i === 2} borderColor={colors.border} />
              ))}
            </SkeletonGroup>
          ) : transactions.length === 0 ? (
            <ThemedText style={styles.emptyText}>No recent transactions found.</ThemedText>
          ) : (
            transactions.map((item, index) => (
              <TransactionItem
                key={item.id || index}
                icon={<Ionicons name="gift" size={20} color="#A855F7" />}
                bgColor={isDark ? '#2D174D' : '#F3E8FF'}
                title={item.type.replace(/_/g, ' ').toUpperCase()}
                subtitle={`Ref ID: ${item.referenceId ? item.referenceId.slice(0, 8) : 'N/A'}`}
                amount={`${Number(item.amount) >= 0 ? '+' : ''}${Number(item.amount).toLocaleString()}`}
                date={new Date(item.createdAt).toLocaleDateString()}
                isLast={index === transactions.length - 1}
                borderColor={colors.border}
              />
            ))
          )}
        </ThemedView>
      </ScrollView>

      {/* Info Dialog Modal */}
      <Modal
        visible={infoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={[styles.infoModalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedView style={[styles.modalHeader, { backgroundColor: 'transparent' }]}>
              <ThemedText style={styles.modalTitle}>{infoModalContent.title}</ThemedText>
              <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </ThemedView>

            <ThemedText style={[styles.infoModalText, { color: colors.text }]}>
              {infoModalContent.description}
            </ThemedText>

            <TouchableOpacity
              style={styles.infoModalButton}
              onPress={() => setInfoModalVisible(false)}
            >
              <ThemedText style={styles.confirmButtonText}>Got It</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Convert Coin Modal Option */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedView style={[styles.modalHeader, { backgroundColor: 'transparent' }]}>
              <ThemedText style={styles.modalTitle}>Convert Earnings</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </ThemedView>

            {/* Total Balance Card Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                { backgroundColor: isDark ? '#1C1538' : '#F9FAFB', borderColor: isDark ? '#2C2250' : '#E5E7EB' },
                selectedOption === 'full' && { borderColor: '#8A52F3', backgroundColor: isDark ? '#221946' : '#F3E8FF' },
              ]}
              onPress={() => setSelectedOption('full')}
            >
              <ThemedView style={[styles.radioRow, { backgroundColor: 'transparent' }]}>
                <Ionicons
                  name={selectedOption === 'full' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedOption === 'full' ? '#8A52F3' : '#6E6A8A'}
                />
                <ThemedText style={styles.optionTitle}>Use Total Balance</ThemedText>
              </ThemedView>

              <ThemedView style={[styles.conversionDetails, { borderTopColor: isDark ? '#2C2250' : '#E5E7EB', backgroundColor: 'transparent' }]}>
                <ThemedView style={[styles.detailRow, { backgroundColor: 'transparent' }]}>
                  <ThemedText style={styles.detailLabel}>Balance Amount:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    ₦{earnedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={[styles.detailRow, { backgroundColor: 'transparent' }]}>
                  <ThemedText style={styles.detailLabel}>You Get Equivalent:</ThemedText>
                  <ThemedView style={[styles.coinResultRow, { backgroundColor: 'transparent' }]}>
                    <FontAwesome5 name="coins" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                    <ThemedText style={styles.coinResultText}>{totalCoins} Coins</ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </TouchableOpacity>

            {/* Custom Amount Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                { backgroundColor: isDark ? '#1C1538' : '#F9FAFB', borderColor: isDark ? '#2C2250' : '#E5E7EB' },
                selectedOption === 'custom' && { borderColor: '#8A52F3', backgroundColor: isDark ? '#221946' : '#F3E8FF' },
              ]}
              onPress={() => setSelectedOption('custom')}
            >
              <ThemedView style={[styles.radioRow, { backgroundColor: 'transparent' }]}>
                <Ionicons
                  name={selectedOption === 'custom' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedOption === 'custom' ? '#8A52F3' : '#6E6A8A'}
                />
                <ThemedText style={styles.optionTitle}>Custom Amount</ThemedText>
              </ThemedView>

              {selectedOption === 'custom' && (
                <ThemedView style={[styles.customSection, { borderTopColor: isDark ? '#2C2250' : '#E5E7EB', backgroundColor: 'transparent' }]}>
                  <ThemedText style={styles.chipLabel}>Select Quick Amount</ThemedText>
                  <ThemedView style={[styles.chipRow, { backgroundColor: 'transparent' }]}>
                    {[10, 50, 100, 200, 500, 1000, 5000, 10000, 25000, 50000].map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        style={[
                          styles.chip,
                          { backgroundColor: isDark ? '#140E2A' : '#E5E7EB', borderColor: isDark ? '#2C2250' : '#D1D5DB' },
                          customAmount === amount.toString() && styles.chipActive,
                        ]}
                        onPress={() => handleQuickSelect(amount)}
                      >
                        <ThemedText
                          style={[
                            styles.chipText,
                            customAmount === amount.toString() && styles.chipTextActive,
                          ]}
                        >
                          ₦{amount.toLocaleString()}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>

                  {numericCustom > 0 && (
                    <ThemedView style={[styles.customResultRow, { backgroundColor: 'transparent' }]}>
                      <ThemedText style={styles.detailLabel}>Equivalent Coins:</ThemedText>
                      <ThemedView style={[styles.coinResultRow, { backgroundColor: 'transparent' }]}>
                        <FontAwesome5 name="coins" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                        <ThemedText style={styles.coinResultText}>{customCoins} Coins</ThemedText>
                      </ThemedView>
                    </ThemedView>
                  )}
                </ThemedView>
              )}
            </TouchableOpacity>

            {/* Confirm Conversion Button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                ((selectedOption === 'custom' && numericCustom <= 0) || isSubmitting) && styles.disabledButton,
              ]}
              disabled={(selectedOption === 'custom' && numericCustom <= 0) || isSubmitting}
              onPress={handleConfirmConversion}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <ThemedText style={styles.confirmButtonText}>
                  {selectedOption === 'full'
                    ? `Convert All to ${totalCoins} Coins`
                    : numericCustom > 0
                    ? `Convert ₦${numericCustom.toLocaleString()} to ${customCoins} Coins`
                    : 'Select Amount to Convert'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Withdraw Cash Modal */}
      <Modal
        visible={withdrawModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalOverlay}
        >
          <ThemedView style={[styles.modalContainer, styles.withdrawModalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedView style={[styles.modalHeader, { backgroundColor: 'transparent' }]}>
              <ThemedText style={styles.modalTitle}>Withdraw to Bank</ThemedText>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </ThemedView>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 4 }}
            >

            {/* Available Balance Notice */}
            <ThemedView style={[styles.availableBalanceBox, { backgroundColor: isDark ? '#16231C' : '#DCFCE7', borderColor: isDark ? '#1E3A2B' : '#86EFAC' }]}>
              <ThemedText style={[styles.availableBalanceLabel, { color: isDark ? '#A7F3D0' : '#166534' }]}>Available for Withdrawal:</ThemedText>
              <ThemedText style={[styles.availableBalanceValue, { color: isDark ? '#34D399' : '#15803D' }]}>
                ₦{earnedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </ThemedText>
            </ThemedView>

            {/* Saved Accounts — select which one to withdraw to */}
            <ThemedView style={[styles.inputGroup, { backgroundColor: 'transparent' }]}>
              <ThemedView style={[styles.savedAccountsHeaderRow, { backgroundColor: 'transparent' }]}>
                <ThemedText style={styles.inputLabel}>Withdraw to</ThemedText>
                {isLoadingSavedAccounts && <ActivityIndicator size="small" color="#8A52F3" />}
              </ThemedView>

              {savedAccounts.map((account) => {
                const isSelected = account.id === selectedSavedAccountId;
                const masked = `•••${account.accountNumber.slice(-4)}`;
                const canDelete = savedAccounts.length > 1;
                return (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.savedAccountRow,
                      { backgroundColor: isDark ? '#1A1433' : '#F3F4F6', borderColor: colors.border },
                      isSelected && { borderColor: '#22C55E', backgroundColor: isDark ? '#132A1C' : '#DCFCE7' },
                    ]}
                    onPress={() => setSelectedSavedAccountId(account.id)}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? '#22C55E' : '#6E6A8A'}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.savedAccountBankName} numberOfLines={1}>
                        {account.bankName || account.bankCode} · {masked}
                      </ThemedText>
                      {account.accountName ? (
                        <ThemedText style={styles.savedAccountSubtext} numberOfLines={1}>
                          {account.accountName}
                        </ThemedText>
                      ) : null}
                    </View>
                    {deletingAccountId === account.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => handleDeleteAccount(account)}
                        disabled={!canDelete}
                        style={{ opacity: canDelete ? 1 : 0.3 }}
                      >
                        <Feather name="trash-2" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}

              {!showAddAccountForm && (
                <TouchableOpacity
                  style={[styles.addAccountButton, { borderColor: isDark ? '#2C2250' : '#D1D5DB' }]}
                  onPress={() => setShowAddAccountForm(true)}
                >
                  <Ionicons name="add-circle-outline" size={16} color={isDark ? '#8A52F3' : '#6B21A8'} style={{ marginRight: 6 }} />
                  <ThemedText style={[styles.addAccountButtonText, { color: isDark ? '#8A52F3' : '#6B21A8' }]}>
                    Add new account
                  </ThemedText>
                </TouchableOpacity>
              )}
            </ThemedView>

            {/* Add New Account form */}
            {showAddAccountForm && (
              <ThemedView style={[styles.inputGroup, { backgroundColor: 'transparent' }]}>
                {/* Bank Dropdown */}
                <ThemedView style={[styles.inputGroup, { backgroundColor: 'transparent' }]}>
                  <ThemedText style={styles.inputLabel}>Bank Name</ThemedText>
                  <Dropdown
                    style={[styles.inputContainer, { backgroundColor: isDark ? '#1A1433' : '#F3F4F6', borderColor: colors.border }]}
                    containerStyle={{ backgroundColor: colors.card, borderColor: colors.border, borderRadius: 12 }}
                    itemTextStyle={{ color: colors.text, fontSize: 14 }}
                    activeColor={isDark ? '#2C2250' : '#F3E8FF'}
                    placeholderStyle={{ color: isDark ? '#6E6A8A' : '#9CA3AF', fontSize: 14 }}
                    selectedTextStyle={{ color: colors.text, fontSize: 14 }}
                    inputSearchStyle={{ color: colors.text, borderRadius: 10 }}
                    iconStyle={{ width: 18, height: 18 }}
                    data={NIGERIAN_BANKS.map((bank) => ({ label: bank.name, value: bank.code }))}
                    search
                    searchPlaceholder="Search bank..."
                    labelField="label"
                    valueField="value"
                    placeholder="Select your bank"
                    value={bankCode}
                    renderLeftIcon={() => (
                      <Ionicons name="business-outline" size={18} color={isDark ? '#8A52F3' : '#6B21A8'} style={{ marginRight: 8 }} />
                    )}
                    onChange={(item) => {
                      setBankCode(item.value);
                      setBankName(item.label);
                    }}
                  />
                </ThemedView>

                {/* Account Number Input */}
                <ThemedView style={[styles.inputGroup, { backgroundColor: 'transparent' }]}>
                  <ThemedText style={styles.inputLabel}>Naira Bank Account Number</ThemedText>
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1A1433' : '#F3F4F6', borderColor: colors.border }]}>
                    <Ionicons name="card-outline" size={18} color={isDark ? '#8A52F3' : '#6B21A8'} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder="10-digit Account Number"
                      placeholderTextColor={isDark ? '#6E6A8A' : '#9CA3AF'}
                      keyboardType="number-pad"
                      maxLength={10}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                    />
                  </View>
                </ThemedView>

                {/* Account Name Verification Status UI */}
                {isVerifyingAccount && (
                  <ThemedView style={[styles.verificationStatusBox, { backgroundColor: isDark ? '#1F1A3A' : '#F3F4F6' }]}>
                    <ActivityIndicator size="small" color="#8A52F3" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.verifyingText}>Verifying account details...</ThemedText>
                  </ThemedView>
                )}

                {accountName ? (
                  <ThemedView style={[styles.verificationStatusBox, { backgroundColor: isDark ? '#132A1C' : '#DCFCE7', borderColor: isDark ? '#1D4ED8' : '#86EFAC' }]}>
                    <Ionicons name="checkmark-circle" size={18} color="#22C55E" style={{ marginRight: 6 }} />
                    <ThemedText style={[styles.accountVerifiedName, { color: isDark ? '#4ADE80' : '#15803D' }]}>
                      {accountName}
                    </ThemedText>
                  </ThemedView>
                ) : null}

                {accountError ? (
                  <ThemedView style={[styles.verificationStatusBox, { backgroundColor: isDark ? '#2A1315' : '#FEE2E2' }]}>
                    <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                    <ThemedText style={[styles.accountErrorText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
                      {accountError}
                    </ThemedText>
                  </ThemedView>
                ) : null}

                <ThemedView style={[styles.addAccountFormActions, { backgroundColor: 'transparent' }]}>
                  {savedAccounts.length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.accountFormActionButton,
                        styles.accountFormCancelButton,
                        isAddingAccount && styles.accountFormButtonDisabled,
                      ]}
                      onPress={() => {
                        resetNewAccountForm();
                        setShowAddAccountForm(false);
                      }}
                      disabled={isAddingAccount}
                    >
                      <ThemedText style={styles.secondaryButtonText}>Cancel</ThemedText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.accountFormActionButton,
                      styles.accountFormSaveButton,
                      (!accountName || isAddingAccount) && styles.disabledButton,
                    ]}
                    disabled={!accountName || isAddingAccount}
                    onPress={handleAddAccount}
                  >
                    {isAddingAccount ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <ThemedText style={styles.confirmButtonText}>Save Account</ThemedText>
                    )}
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            )}

            {selectedSavedAccount ? (
              <ThemedView style={[styles.inputGroup, { backgroundColor: 'transparent' }]}>
                <ThemedText style={styles.inputLabel}>Withdrawal Amount (₦)</ThemedText>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1A1433' : '#F3F4F6', borderColor: colors.border }]}>
                <ThemedText style={styles.currencyPrefix}>₦</ThemedText>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Enter amount"
                  placeholderTextColor={isDark ? '#6E6A8A' : '#9CA3AF'}
                  keyboardType="numeric"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                />
              </View>

              {/* Quick Select Chips */}
              <ThemedView style={[styles.chipRow, { backgroundColor: 'transparent', marginTop: 10 }]}>
                {[1000, 5000, 10000, 20000, 50000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.chip,
                      { backgroundColor: isDark ? '#140E2A' : '#E5E7EB', borderColor: isDark ? '#2C2250' : '#D1D5DB' },
                      withdrawAmount === amount.toString() && styles.withdrawChipActive,
                    ]}
                    onPress={() => handleWithdrawQuickSelect(amount)}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        withdrawAmount === amount.toString() && styles.chipTextActive,
                      ]}
                    >
                      ₦{amount.toLocaleString()}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { backgroundColor: isDark ? '#140E2A' : '#E5E7EB', borderColor: isDark ? '#2C2250' : '#D1D5DB' },
                    withdrawAmount === earnedBalance.toString() && styles.withdrawChipActive,
                  ]}
                  onPress={() => setWithdrawAmount(earnedBalance.toString())}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      withdrawAmount === earnedBalance.toString() && styles.chipTextActive,
                    ]}
                  >
                    Withdraw All
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
              </ThemedView>
            ) : (
              <ThemedView
                style={[
                  styles.noAccountHint,
                  { backgroundColor: isDark ? '#1A1433' : '#F3F4F6', borderColor: colors.border },
                ]}
              >
                <Ionicons name="information-circle-outline" size={18} color="#8A52F3" style={{ marginRight: 8 }} />
                <ThemedText style={styles.noAccountHintText}>
                  Add a bank account above to withdraw your earnings.
                </ThemedText>
              </ThemedView>
            )}

            </ScrollView>

            {/* Confirm Withdrawal Button */}
            {selectedSavedAccount && (
              <TouchableOpacity
                style={[
                  styles.withdrawConfirmButton,
                  (numericWithdraw <= 0 || numericWithdraw > earnedBalance || isSubmitting) && styles.disabledButton,
                ]}
                disabled={numericWithdraw <= 0 || numericWithdraw > earnedBalance || isSubmitting}
                onPress={handleConfirmWithdrawal}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <ThemedText style={styles.confirmButtonText}>
                    {numericWithdraw > 0 ? `Withdraw ₦${numericWithdraw.toLocaleString()}` : 'Enter Amount to Withdraw'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            )}
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

function TransactionItem({ icon, bgColor, title, subtitle, amount, date, isLast, borderColor }: any) {
  return (
    <ThemedView style={[styles.itemContainer, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
      <ThemedView style={[styles.itemIcon, { backgroundColor: bgColor }]}>{icon}</ThemedView>
      <ThemedView style={styles.itemDetails}>
        <ThemedText style={styles.itemTitle}>{title}</ThemedText>
        <ThemedText style={styles.itemSubtitle}>{subtitle}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.itemRight}>
        <ThemedText style={styles.itemAmount}>{amount}</ThemedText>
        <ThemedText style={styles.itemDate}>{date}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

// Placeholder with the same shape as TransactionItem
function TransactionItemSkeleton({ isLast, borderColor }: { isLast: boolean; borderColor: string }) {
  return (
    <ThemedView style={[styles.itemContainer, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
      <SkeletonCircle size={40} style={{ marginRight: 12 }} />
      <ThemedView style={[styles.itemDetails, { gap: 6 }]}>
        <Skeleton width="55%" height={14} radius={7} />
        <Skeleton width="35%" height={11} radius={5} />
      </ThemedView>
      <ThemedView style={[styles.itemRight, { gap: 6 }]}>
        <Skeleton width={56} height={14} radius={7} />
        <Skeleton width={64} height={11} radius={5} />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  subHeaderDescription: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
    opacity: 0.7,
  },
  mainCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A1F4C',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLabel: {
    color: '#A099BE',
    fontSize: 13,
  },
  infoIcon: {
    marginLeft: 6,
  },
  balanceText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 6,
  },
  walletGraphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletGraphic: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#261545',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinBadgeText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statLabel: {
    color: '#A099BE',
    fontSize: 10,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  balanceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  balanceCardEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  balanceCardLabel: {
    fontSize: 11,
    opacity: 0.7,
  },
  balanceCardValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  balanceCardSub: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 2,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 6,
  },
  actionCardSub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    height: 32,
    marginBottom: 14,
  },
  convertButton: {
    backgroundColor: '#6D28D9',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  withdrawButton: {
    backgroundColor: '#22C55E',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 13,
    opacity: 0.6,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  itemTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.6,
  },
  itemRight: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  itemAmount: {
    color: '#22C55E',
    fontWeight: '700',
    fontSize: 14,
  },
  itemDate: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  withdrawModalContainer: {
    maxHeight: '90%',
  },
  infoModalContainer: {
    marginHorizontal: 20,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  infoModalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  infoModalButton: {
    backgroundColor: '#6D28D9',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  optionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  conversionDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    marginLeft: 30,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  coinResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinResultText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 14,
  },
  customSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    marginLeft: 30,
  },
  chipLabel: {
    fontSize: 11,
    marginBottom: 8,
    opacity: 0.7,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#8A52F3',
    borderColor: '#8A52F3',
  },
  withdrawChipActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  savedAccountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
    maxWidth: 200,
  },
  savedAccountChipActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  savedAccountSubtext: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 1,
  },
  savedAccountsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  savedAccountBankName: {
    fontSize: 13,
    fontWeight: '600',
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addAccountButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addAccountFormActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  // Shared sizing so the Cancel / Save pair always line up, regardless of
  // the margins carried by withdrawConfirmButton.
  accountFormActionButton: {
    flex: 1,
    height: 48,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountFormCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#8A52F3',
  },
  accountFormSaveButton: {
    backgroundColor: '#22C55E',
  },
  accountFormButtonDisabled: {
    opacity: 0.5,
  },
  noAccountHint: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  noAccountHintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8A52F3',
  },
  secondaryButtonText: {
    color: '#8A52F3',
    fontWeight: '700',
    fontSize: 14,
  },
  customResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: '#6D28D9',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  withdrawConfirmButton: {
    backgroundColor: '#22C55E',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#38285C',
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  availableBalanceBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableBalanceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  availableBalanceValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 46,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
    opacity: 0.7,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  verificationStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  verifyingText: {
    fontSize: 12,
    opacity: 0.8,
  },
  accountVerifiedName: {
    fontSize: 13,
    fontWeight: '700',
  },
  accountErrorText: {
    fontSize: 12,
    fontWeight: '600',
  },
});