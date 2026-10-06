// RevenueCat has no web SDK. utils/purchases.ts never configures it on web
// (coin top-ups go through Paystack there), so these stubs only satisfy imports.
export type PurchasesPackage = {
  identifier: string;
  product: { identifier: string; priceString: string };
};

export const PURCHASES_ERROR_CODE = { PURCHASE_CANCELLED_ERROR: "1" } as const;

const unavailable = async (..._args: unknown[]): Promise<never> => {
  throw new Error("In-app purchases are not available on web");
};

const Purchases = {
  configure: (_opts: { apiKey: string }) => {},
  logIn: unavailable,
  logOut: unavailable,
  getAppUserID: async () => "",
  getOfferings: async () => ({
    current: null as null | { availablePackages: PurchasesPackage[] },
  }),
  purchasePackage: unavailable,
};

export default Purchases;
