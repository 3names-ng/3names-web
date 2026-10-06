import { Platform } from "react-native";
import Purchases, { PURCHASES_ERROR_CODE, type PurchasesPackage } from "react-native-purchases";

/**
 * Coin purchases through Apple / Google in-app purchase, via RevenueCat.
 *
 * The app only starts the store purchase. Coins are credited by the backend
 * when RevenueCat's webhook reports the verified transaction
 * (POST /coins/webhook/revenuecat), never by the client.
 *
 * Product ids must match IAP_COIN_PRODUCTS on the backend: coins_50,
 * coins_100, coins_250, coins_500, coins_1000.
 */

const platformKey =
  Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : Platform.OS === "android"
      ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
      : undefined;

// RevenueCat's Test Store (test_… key) simulates purchases without Apple or
// Google. Development builds only: RevenueCat rejects it in release builds.
const testStoreKey = __DEV__ ? process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY : undefined;

const apiKey = Platform.OS === "web" ? undefined : testStoreKey || platformKey;

/** False on web (which keeps Paystack) or when no RevenueCat key is configured. */
export const isStoreBillingAvailable = Boolean(apiKey);

let configured = false;

function ensureConfigured() {
  if (!configured && apiKey) {
    Purchases.configure({ apiKey });
    configured = true;
  }
  return configured;
}

/** Ties store purchases to our user id, so the webhook knows who to credit. */
export async function identifyPurchaser(userId: string | null) {
  if (!ensureConfigured()) return;
  try {
    if (userId) {
      await Purchases.logIn(userId);
    } else {
      await Purchases.logOut();
    }
  } catch (err) {
    // logOut throws when already anonymous; nothing to do.
    console.warn("[purchases] identify failed:", err);
  }
}

export interface CoinPackage {
  coins: number;
  priceString: string;
  rcPackage: PurchasesPackage;
}

/** Coin packs from the current RevenueCat offering, smallest first, with store-localized prices. */
export async function getCoinPackages(): Promise<CoinPackage[]> {
  if (!ensureConfigured()) return [];
  const offerings = await Purchases.getOfferings();
  return (offerings.current?.availablePackages ?? [])
    .map((rcPackage) => {
      const match = rcPackage.product.identifier.match(/coins_(\d+)/);
      return match
        ? { coins: Number(match[1]), priceString: rcPackage.product.priceString, rcPackage }
        : null;
    })
    .filter((p): p is CoinPackage => p !== null)
    .sort((a, b) => a.coins - b.coins);
}

/**
 * Runs the store purchase sheet. Resolves "purchased" once the store has
 * charged the user (coins arrive via the webhook shortly after), or
 * "cancelled" if they backed out. Throws on real errors.
 */
export async function purchaseCoinPackage(
  pkg: CoinPackage,
  userId: string,
): Promise<"purchased" | "cancelled"> {
  if (!ensureConfigured()) throw new Error("In-app purchases are not available");
  // Make sure the purchase is attributed to the signed-in user.
  if ((await Purchases.getAppUserID()) !== userId) {
    await Purchases.logIn(userId);
  }
  try {
    await Purchases.purchasePackage(pkg.rcPackage);
    return "purchased";
  } catch (err: any) {
    if (err?.userCancelled || err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return "cancelled";
    }
    throw err;
  }
}
