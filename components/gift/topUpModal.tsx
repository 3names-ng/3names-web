import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  DeviceEventEmitter
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { coinService } from '@/service/post.service';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import StoreTopUpModal from './storeTopUpModal';
import { isStoreBillingAvailable } from '@/utils/purchases';

interface TopUpModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentAttemptFinished: () => void;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * iOS / Android must sell coins through Apple and Google in-app purchase
 * (App Store 3.1.1, Google Play payments policy). Paystack stays for web, and
 * for native development builds without a RevenueCat key.
 */
export default function TopUpModal(props: TopUpModalProps) {
  const useStore = Platform.OS !== 'web' && (isStoreBillingAvailable || !__DEV__);
  return useStore ? <StoreTopUpModal {...props} /> : <PaystackTopUpModal {...props} />;
}

function PaystackTopUpModal({ visible, onClose, onPaymentAttemptFinished }: TopUpModalProps) {
  const [selectedCoins, setSelectedCoins] = useState<number | null>(null);
  const [customCoins, setCustomCoins] = useState<string>('');
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  // Web: Paystack checkout is open in another browser tab
  const [webCheckoutOpen, setWebCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { colors } = useTheme();
  const updateUser = useAuthStore((state) => state.updateUser);

  const coinPackages = [5, 15, 50, 100, 250, 500, 750, 1000, 2000];
  
  const finalCoinAmount = customCoins ? parseInt(customCoins, 10) : selectedCoins;
  const pricePerCoin = 10;

  const successObserverScript = `
    (function() {
      var checkExist = setInterval(function() {
        var successEl = document.querySelector('.success-text') || 
                        document.querySelector('.payment-success') || 
                        document.body.innerText.includes('Payment Successful');
                        
        if (successEl) {
          clearInterval(checkExist);
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'SUCCESS' }));
        }
      }, 500);
    })();
    true; 
  `;

  const fetchBalance = async () => {
  try {
    const response = await coinService.getBalance();
    const rawNum = typeof response?.balance === "number" ? response.balance : response;
    
    if (typeof rawNum === "number" && !isNaN(rawNum)) {
      const sanitizedBalance = Math.max(0, rawNum);
      updateUser({ coins: sanitizedBalance });
    }
  } catch (error) {
    console.error("Error fetching live coin balance:", error);
  }
};

  const handlePayNow = async () => {
    if (!finalCoinAmount || finalCoinAmount <= 0) return;
    setLoading(true);

    try {
      const data = await coinService.purchaseCoins({ coins: finalCoinAmount });
      if (data.authorizationUrl && Platform.OS === 'web') {
        // Browsers can't embed the checkout like the app's WebView: open
        // Paystack's own page in a new tab and wait here for the user
        window.open(data.authorizationUrl, '_blank', 'noopener');
        setWebCheckoutOpen(true);
      } else if (data.authorizationUrl) {
        setAuthUrl(data.authorizationUrl);
      } else {
        Alert.alert('Payment Error', 'Could not initialize payment window.');
      }
    } catch (error) {
      console.log("Payment initialization error:", error);
      Alert.alert('Network Error', 'Failed connecting to the payment gateway.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAmountChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    setCustomCoins(cleanText);
    if (cleanText) {
      setSelectedCoins(null);
    }
  };

  const handleSelectPackage = (item: number) => {
    setSelectedCoins(item);
    setCustomCoins('');
  };

  // FIX: Guard against premature closing when initial checkout loads
  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    if (!url) return;

    // Only close if it's explicitly navigating back to your app's callback/redirect endpoint
    // Adjust 'callback' or add your domain name if your redirect URL is unique
    const isRedirectCallback = url.includes('/callback') || url.includes('status=successful') || url.includes('status=success');

    if (isRedirectCallback && !url.includes('checkout.paystack.com')) {
      handleSuccessCleanup();
    }
  };

  const handleMessage = (event: any) => {
    try {
      const messageData = JSON.parse(event.nativeEvent.data);
      if (messageData.status === 'SUCCESS') {
        setTimeout(() => {
          handleSuccessCleanup();
        }, 1500);
      }
    } catch (e) {
      console.log("Error parsing WebView message:", e);
    }
  };

  const handleSuccessCleanup = async () => {
    setAuthUrl(null);
    setWebCheckoutOpen(false);
    setSelectedCoins(null);
    setCustomCoins('');
    
    // Give backend webhook time to execute DB balance update
    await delay(2000);

    // Refresh local state via API
    const newBalance = await fetchBalance();

    // Broadcast event so UserCard, GiftModal, and other listeners sync immediately
    DeviceEventEmitter.emit("GIFT_TRANSACTION_COMPLETE", { 
      newBalance: typeof newBalance === 'number' ? newBalance : undefined 
    });

    onClose();
    onPaymentAttemptFinished();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {webCheckoutOpen ? (
          // Web: checkout is in another tab — confirm here once paid
          <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Complete your payment</Text>
            <Text style={{ color: colors.muted, textAlign: 'center', marginBottom: 20, paddingHorizontal: 12 }}>
              Paystack opened in a new tab. Pay there, then come back and tap below to update your coins.
            </Text>
            <TouchableOpacity
              style={[styles.btnPay, { flex: 0, backgroundColor: colors.text }]}
              onPress={handleSuccessCleanup}
            >
              <Text style={[styles.txtPay, { color: colors.background }]}>I've completed payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 16, alignItems: 'center' }} onPress={() => setWebCheckoutOpen(false)}>
              <Text style={{ color: colors.muted, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </SafeAreaView>
        ) : !authUrl ? (
          <KeyboardAvoidingView
            behavior="padding"
            style={styles.keyboardView}
          >
            <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
              <Text style={[styles.title, { color: colors.text }]}>Select Package</Text>
              
              <FlatList
                data={coinPackages}
                keyExtractor={(item) => item.toString()}
                numColumns={3}
                columnWrapperStyle={styles.rowGrid}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.card, 
                      { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                      selectedCoins === item && { borderColor: colors.muted }
                    ]}
                    onPress={() => handleSelectPackage(item)}
                  >
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardText, { color: colors.text }]}>🪙 {item}</Text>
                      <Text style={{ color: colors.text, fontSize: 10 }}>Campus Coins</Text>
                      <Text style={[styles.priceText, { color: colors.muted }]}>
                        ₦{(item * pricePerCoin).toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />

              <View style={styles.customInputContainer}>
                <Text style={[styles.customInputLabel, { color: colors.muted }]}>Custom Amount</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter custom number of coins"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    value={customCoins}
                    onChangeText={handleCustomAmountChange}
                  />
                  {!!customCoins && (
                    <Text style={[styles.inputPricePreview, { color: colors.muted }]}>
                      = ₦{(parseInt(customCoins, 10) * pricePerCoin || 0).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.rowButtons}>
                <TouchableOpacity 
                  style={[styles.btnCancel, { backgroundColor: colors.card }]} 
                  onPress={onClose}
                >
                  <Text style={{ color: colors.muted, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.btnPay, 
                    { backgroundColor: colors.muted },
                    (!finalCoinAmount || finalCoinAmount <= 0) && styles.btnDisabled
                  ]} 
                  disabled={!finalCoinAmount || finalCoinAmount <= 0 || loading}
                  onPress={handlePayNow}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={[styles.txtPay, { color: colors.background }]}>
                      Buy {finalCoinAmount ? `(${finalCoinAmount})` : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        ) : (
          <SafeAreaView edges={['top', 'bottom']} style={[styles.fullscreenContainer, { backgroundColor: colors.background }]}>
            <View style={styles.webviewWrapper}>
              <WebView
                source={{ uri: authUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                onMessage={handleMessage}
                injectedJavaScript={successObserverScript}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                  <ActivityIndicator size="large" color={colors.muted} style={StyleSheet.absoluteFill} />
                )}
              />
              <TouchableOpacity style={styles.closeWebview} onPress={() => setAuthUrl(null)}>
                <Text style={styles.closeWebviewText}>Cancel Transaction</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  keyboardView: { width: '100%', justifyContent: 'flex-end' },
  container: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    minHeight: '62%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24 
  },
  fullscreenContainer: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  
  listContainer: { paddingBottom: 8 },
  rowGrid: { justifyContent: 'flex-start', gap: 8 },
  
  card: { 
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12, 
    marginBottom: 8, 
    borderWidth: 2, 
    borderColor: 'transparent',
    flex: 1 / 3,
  },
  cardContent: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  cardText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  priceText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  
  customInputContainer: { marginTop: 12, marginBottom: 16 },
  customInputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  inputPricePreview: { fontSize: 14, fontWeight: '700', marginLeft: 8 },

  rowButtons: { flexDirection: 'row', gap: 12, marginTop: 24, paddingTop: 16 },
  btnCancel: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnPay: { flex: 2, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  txtPay: { fontWeight: '700' },
  webviewWrapper: { flex: 1 },
  closeWebview: { padding: 16, backgroundColor: '#FE2C55', alignItems: 'center' },
  closeWebviewText: { color: '#fff', fontWeight: '700' },
});