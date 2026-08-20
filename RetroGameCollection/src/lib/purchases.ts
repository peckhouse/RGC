import Purchases, {LOG_LEVEL} from 'react-native-purchases';
import type {PurchasesPackage, CustomerInfo} from 'react-native-purchases';
import {Platform} from 'react-native';
import {RC_API_KEY_IOS, RC_API_KEY_ANDROID} from '../config';
import {Analytics} from './analytics';

export const PRO_ENTITLEMENT = 'RGC Pro';

let _configured = false;
let _configuredUserId: string | null = null;
let _configuredWaiters: Array<() => void> = [];
const _customerInfoListeners = new Set<(info: CustomerInfo) => void>();
let _listenerInstalled = false;

/**
 * Resolves true once `configurePurchases` has run, or false after `timeoutMs`.
 * Without this a pro check that fires before the auth session lands resolves
 * to false and gets cached, so a paying customer is treated as free until the
 * cache goes stale.
 */
function waitForConfigured(timeoutMs = 10000): Promise<boolean> {
  if (_configured) return Promise.resolve(true);
  return new Promise(resolve => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(false);
    }, timeoutMs);
    _configuredWaiters.push(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(true);
    });
  });
}

export function configurePurchases(userId: string) {
  if (_configured && _configuredUserId === userId) return;
  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  Purchases.configure({apiKey, appUserID: userId});
  _configured = true;
  _configuredUserId = userId;
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  if (!_listenerInstalled) {
    Purchases.addCustomerInfoUpdateListener(info => {
      _customerInfoListeners.forEach(fn => fn(info));
    });
    _listenerInstalled = true;
  }
  const waiters = _configuredWaiters;
  _configuredWaiters = [];
  waiters.forEach(fn => fn());
}

export function onCustomerInfoUpdate(fn: (info: CustomerInfo) => void) {
  _customerInfoListeners.add(fn);
  return () => {
    _customerInfoListeners.delete(fn);
  };
}

export function logOutPurchases() {
  Purchases.logOut().catch(() => {});
  _configured = false;
  _configuredUserId = null;
}

function reportFallback(detail: string) {
  if (__DEV__) {
    console.warn(
      `[purchases] Pro granted via fallback: ${detail}. Check the RevenueCat entitlement configuration.`,
    );
  }
  Analytics.entitlementFallbackUsed({detail});
}

/**
 * True when the customer has paid for Pro.
 *
 * Checks the configured entitlement first, then falls back to any other active
 * entitlement, then to the raw purchases on the account. The fallbacks matter
 * because a dashboard mismatch (entitlement renamed, or a product not attached
 * to it) otherwise leaves a paying customer stuck on the paywall with no error
 * — the bug App Review hit in 1.0.2 (24). RGC Pro is the only thing the app
 * sells, so any paid product on the account means Pro.
 */
export function isProCustomer(info: CustomerInfo): boolean {
  if (PRO_ENTITLEMENT in info.entitlements.active) return true;

  const active = Object.keys(info.entitlements.active);
  if (active.length > 0) {
    reportFallback(`active entitlement "${active.join(', ')}" is not named "${PRO_ENTITLEMENT}"`);
    return true;
  }
  if (info.activeSubscriptions.length > 0) {
    reportFallback(`active subscription "${info.activeSubscriptions.join(', ')}" grants no entitlement`);
    return true;
  }
  if (info.nonSubscriptionTransactions.length > 0) {
    reportFallback('non-subscription purchase (lifetime) grants no entitlement');
    return true;
  }
  return false;
}

export async function checkProStatus(): Promise<boolean> {
  try {
    if (!(await waitForConfigured())) return false;
    const info = await Purchases.getCustomerInfo();
    return isProCustomer(info);
  } catch {
    return false;
  }
}

/**
 * Re-reads entitlements with the SDK cache bypassed. Used when a purchase
 * resolves before the entitlement has propagated to the customer info.
 */
export async function verifyProStatus(): Promise<boolean> {
  try {
    if (!_configured) return false;
    await Purchases.invalidateCustomerInfoCache();
    const info = await Purchases.getCustomerInfo();
    return isProCustomer(info);
  } catch {
    return false;
  }
}

export async function getOfferings() {
  try {
    if (!(await waitForConfigured())) return null;
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const {customerInfo} = await Purchases.purchasePackage(pkg);
  return isProCustomer(customerInfo);
}

export async function restorePurchases(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return isProCustomer(info);
}

export type SubscriptionDetails = {
  plan: 'monthly' | 'annual' | 'lifetime' | 'unknown';
  expiresAt: Date | null;
  willRenew: boolean;
};

function planFromProductId(productId: string): SubscriptionDetails['plan'] {
  const id = productId.toLowerCase();
  if (id.includes('lifetime')) return 'lifetime';
  if (id.includes('annual')) return 'annual';
  if (id.includes('monthly')) return 'monthly';
  return 'unknown';
}

export async function getSubscriptionDetails(): Promise<SubscriptionDetails | null> {
  try {
    if (!(await waitForConfigured())) return null;
    const info = await Purchases.getCustomerInfo();
    if (!isProCustomer(info)) return null;

    const entitlement =
      info.entitlements.active[PRO_ENTITLEMENT] ??
      Object.values(info.entitlements.active)[0];
    const transactions = info.nonSubscriptionTransactions;
    const productId =
      entitlement?.productIdentifier ??
      info.activeSubscriptions[0] ??
      transactions[transactions.length - 1]?.productIdentifier ??
      '';
    const plan = planFromProductId(productId);
    const expiresAt =
      entitlement?.expirationDate ?? (plan === 'lifetime' ? null : info.allExpirationDates[productId] ?? null);

    return {
      plan,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      willRenew: entitlement?.willRenew ?? info.activeSubscriptions.includes(productId),
    };
  } catch {
    return null;
  }
}
