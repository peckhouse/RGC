import Purchases, {LOG_LEVEL} from 'react-native-purchases';
import type {PurchasesPackage} from 'react-native-purchases';
import {Platform} from 'react-native';
import {RC_API_KEY_IOS, RC_API_KEY_ANDROID} from '../config';

export const PRO_ENTITLEMENT = 'RGC Pro';

let _configured = false;

export function configurePurchases(userId: string) {
  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  Purchases.configure({apiKey, appUserID: userId});
  _configured = true;
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
}

export function logOutPurchases() {
  Purchases.logOut().catch(() => {});
  _configured = false;
}

export async function checkProStatus(): Promise<boolean> {
  try {
    if (!_configured) return false;
    const info = await Purchases.getCustomerInfo();
    return PRO_ENTITLEMENT in info.entitlements.active;
  } catch {
    return false;
  }
}

export async function getOfferings() {
  try {
    if (!_configured) return null;
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const {customerInfo} = await Purchases.purchasePackage(pkg);
  return PRO_ENTITLEMENT in customerInfo.entitlements.active;
}

export async function restorePurchases(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return PRO_ENTITLEMENT in info.entitlements.active;
}

export type SubscriptionDetails = {
  plan: 'monthly' | 'annual' | 'lifetime' | 'unknown';
  expiresAt: Date | null;
  willRenew: boolean;
};

export async function getSubscriptionDetails(): Promise<SubscriptionDetails | null> {
  try {
    if (!_configured) return null;
    const info = await Purchases.getCustomerInfo();
    const entitlement = info.entitlements.active[PRO_ENTITLEMENT];
    if (!entitlement) return null;
    const id = entitlement.productIdentifier.toLowerCase();
    const plan = id.includes('lifetime')
      ? 'lifetime'
      : id.includes('annual')
        ? 'annual'
        : id.includes('monthly')
          ? 'monthly'
          : 'unknown';
    return {
      plan,
      expiresAt: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
      willRenew: entitlement.willRenew,
    };
  } catch {
    return null;
  }
}
