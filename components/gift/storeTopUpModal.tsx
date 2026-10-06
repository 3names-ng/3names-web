import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { coinService } from "@/service/post.service";
import { showError, showInfo, showSuccess } from "@/components/ui/toast";
import {
  getCoinPackages,
  isStoreBillingAvailable,
  purchaseCoinPackage,
  type CoinPackage,
} from "@/utils/purchases";

interface StoreTopUpModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentAttemptFinished: () => void;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPurchasedCoins(): Promise<number | null> {
  try {
    const response = await coinService.getBalance();
    const value = Number(response?.balance);
    return Number.isFinite(value) ? Math.max(0, value) : null;
  } catch {
    return null;
  }
}

/**
 * Coin top-up for iOS / Android through Apple and Google in-app purchase
 * (required by App Store 3.1.1 and Google Play's payments policy for digital
 * currency). Web keeps the Paystack flow in topUpModal.tsx.
 */
export default function StoreTopUpModal({ visible, onClose, onPaymentAttemptFinished }: StoreTopUpModalProps) {
  const { colors } = useTheme();
  const userId = useAuthStore((state) => state.user?.id);
  const updateUser = useAuthStore((state) => state.updateUser);

  // null until the first load finishes; packs are fetched once per mount.
  const [packages, setPackages] = useState<CoinPackage[] | null>(null);
  const loadingPackages = packages === null;
  const [selected, setSelected] = useState<CoinPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!visible || !isStoreBillingAvailable || packages !== null) return;
    let cancelled = false;
    getCoinPackages()
      .then((list) => {
        if (!cancelled) setPackages(list);
      })
      .catch(() => {
        if (!cancelled) {
          setPackages([]);
          showError("Couldn't load coin packs. Please try again.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [visible, packages]);

  const handleBuy = async () => {
    if (!selected || !userId || purchasing) return;
    setPurchasing(true);
    try {
      const before = await fetchPurchasedCoins();
      const result = await purchaseCoinPackage(selected, userId);
      if (result === "cancelled") return;

      // The store has charged the user. Coins are credited by RevenueCat's
      // webhook or, if that's slow or missing, by asking the backend to look
      // the purchase up in RevenueCat directly. Either path credits once.
      let after = before;
      for (let attempt = 0; attempt < 10; attempt++) {
        await delay(1500);
        await coinService.syncStorePurchases().catch(() => {});
        after = await fetchPurchasedCoins();
        if (after !== null && before !== null && after >= before + selected.coins) break;
      }

      if (after !== null) updateUser({ coins: after });
      DeviceEventEmitter.emit("GIFT_TRANSACTION_COMPLETE", { newBalance: after ?? undefined });

      if (after !== null && before !== null && after >= before + selected.coins) {
        showSuccess(`${selected.coins} Campus Coins added.`, "Purchase complete");
      } else {
        showInfo("Your coins will appear in a moment.", "Purchase complete");
      }
      setSelected(null);
      onClose();
      onPaymentAttemptFinished();
    } catch (err: any) {
      showError(err?.message || "The purchase couldn't be completed.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView edges={["bottom"]} style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>Buy Campus Coins</Text>

          {!isStoreBillingAvailable ? (
            <Text style={[styles.message, { color: colors.muted }]}>
              Coin purchases aren&apos;t available right now.
            </Text>
          ) : loadingPackages ? (
            <ActivityIndicator style={styles.loader} color={colors.muted} />
          ) : !packages?.length ? (
            <Text style={[styles.message, { color: colors.muted }]}>
              No coin packs are available right now. Please try again later.
            </Text>
          ) : (
            <View style={styles.grid}>
              {packages.map((pkg) => {
                const isSelected = selected?.rcPackage.identifier === pkg.rcPackage.identifier;
                return (
                  <TouchableOpacity
                    key={pkg.rcPackage.identifier}
                    style={[
                      styles.card,
                      { backgroundColor: colors.card, borderColor: isSelected ? colors.muted : colors.border },
                    ]}
                    onPress={() => setSelected(pkg)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.cardText, { color: colors.text }]}>🪙 {pkg.coins}</Text>
                    <Text style={{ color: colors.text, fontSize: 10 }}>Campus Coins</Text>
                    <Text style={[styles.priceText, { color: colors.muted }]}>{pkg.priceString}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={[styles.note, { color: colors.muted }]}>
            Coins won in games can be used in games but can&apos;t be sent as gifts.
          </Text>

          <View style={styles.rowButtons}>
            <TouchableOpacity style={[styles.btnCancel, { backgroundColor: colors.card }]} onPress={onClose}>
              <Text style={{ color: colors.muted, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPay, { backgroundColor: colors.muted }, (!selected || purchasing) && styles.btnDisabled]}
              disabled={!selected || purchasing}
              onPress={handleBuy}
            >
              {purchasing ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={[styles.txtPay, { color: colors.background }]}>
                  {selected ? `Buy ${selected.coins} for ${selected.priceString}` : "Select a pack"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: "50%",
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  loader: { marginVertical: 40 },
  message: { textAlign: "center", marginVertical: 32, fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: {
    width: "31.5%",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  cardText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  priceText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  note: { fontSize: 12, textAlign: "center", marginTop: 16 },
  rowButtons: { flexDirection: "row", gap: 12, marginTop: 20, paddingTop: 12 },
  btnCancel: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" },
  btnPay: { flex: 2, padding: 16, borderRadius: 12, alignItems: "center" },
  btnDisabled: { opacity: 0.4 },
  txtPay: { fontWeight: "700" },
});
