import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import mobileAds, {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentPrivacyOptionsRequirementStatus,
  TestIds,
} from 'react-native-google-mobile-ads';
import type {AdsConsentInfoOptions} from 'react-native-google-mobile-ads';
import {ADMOB_BANNER_IOS, ADMOB_BANNER_ANDROID} from '../config';
import {Analytics} from './analytics';

/**
 * Serve Google's demo ad units from a release build.
 *
 * Live ad units return no-fill on iOS until the app is listed on the App Store,
 * so while review is pending this is the only way to prove the banner works
 * end-to-end from a TestFlight install. Set back to `false` for the store
 * build — demo ads earn nothing.
 */
export const FORCE_TEST_ADS = false;

/**
 * Pretend the device sits inside (or outside) the EEA so the consent form can
 * be exercised from anywhere. Only test devices are affected: emulators and
 * simulators are whitelisted automatically, a physical device needs the hashed
 * ID that the UMP SDK prints to the native log added to
 * `CONSENT_TEST_DEVICE_IDS`. Leave as `null` for real geography.
 */
export const CONSENT_DEBUG_GEOGRAPHY: 'EEA' | 'OTHER' | null = null;
export const CONSENT_TEST_DEVICE_IDS: string[] = [];

const useDemoUnits = __DEV__ || FORCE_TEST_ADS;

export const BANNER_AD_UNIT_ID = useDemoUnits
  ? TestIds.BANNER
  : Platform.OS === 'ios'
    ? ADMOB_BANNER_IOS
    : ADMOB_BANNER_ANDROID;

export type AdsState = {
  /** UMP is satisfied: whatever consent our AdMob messages require is in hand. */
  canRequestAds: boolean;
  /** The SDK is initialized, so ad requests actually go out. */
  ready: boolean;
  /** Only true where GDPR does not apply, or the user opted into personalisation. */
  personalizedAds: boolean;
  /** EEA users must be able to reopen the form; drives the Account screen row. */
  privacyOptionsRequired: boolean;
};

let state: AdsState = {
  canRequestAds: false,
  ready: false,
  personalizedAds: false,
  privacyOptionsRequired: false,
};

const listeners = new Set<(next: AdsState) => void>();

function setState(patch: Partial<AdsState>) {
  state = {...state, ...patch};
  listeners.forEach(listener => listener(state));
}

function consentOptions(): AdsConsentInfoOptions | undefined {
  if (!CONSENT_DEBUG_GEOGRAPHY) {
    return undefined;
  }
  return {
    debugGeography:
      CONSENT_DEBUG_GEOGRAPHY === 'EEA'
        ? AdsConsentDebugGeography.EEA
        : AdsConsentDebugGeography.OTHER,
    testDeviceIdentifiers: CONSENT_TEST_DEVICE_IDS,
  };
}

/**
 * Personalised ads are allowed where GDPR does not apply, or where the user
 * granted TCF purpose 1 (storing information on the device) *and* personalised
 * ad selection. Anything we cannot read falls back to non-personalised, which
 * still serves — the safe direction to fail in.
 */
async function resolvePersonalizedAds(): Promise<boolean> {
  try {
    if (!(await AdsConsent.getGdprApplies())) {
      return true;
    }
    const purposeConsents = await AdsConsent.getPurposeConsents();
    if (!purposeConsents.startsWith('1')) {
      return false;
    }
    const {selectPersonalisedAds} = await AdsConsent.getUserChoices();
    return selectPersonalisedAds;
  } catch {
    return false;
  }
}

let sdkPromise: Promise<boolean> | null = null;

async function initializeSdk(): Promise<boolean> {
  try {
    const adapters = await mobileAds().initialize();
    Analytics.adsInitialized({
      adapters: adapters.map(a => `${a.name}:${a.state}`).join(','),
      testUnits: useDemoUnits,
    });
    setState({ready: true});
    return true;
  } catch (error) {
    // Cleared so a later mount retries instead of the SDK staying dead for the
    // rest of the session.
    sdkPromise = null;
    const message = error instanceof Error ? error.message : String(error);
    if (__DEV__) {
      console.warn(`[ads] initialize failed: ${message}`);
    }
    Analytics.adsInitFailed({message});
    return false;
  }
}

/**
 * Reads the current consent status into `state` and starts the SDK if ads are
 * allowed. Safe to call repeatedly — the SDK itself is only started once.
 */
async function startAdsIfAllowed(): Promise<boolean> {
  let info;
  try {
    info = await AdsConsent.getConsentInfo();
  } catch (error) {
    // Nobody awaits initializeAds() for a result, so a rejection here would
    // surface as an unhandled promise rejection rather than a missing banner.
    const message = error instanceof Error ? error.message : String(error);
    if (__DEV__) {
      console.warn(`[ads] reading consent info failed: ${message}`);
    }
    Analytics.consentFailed({message});
    return false;
  }
  setState({
    canRequestAds: info.canRequestAds,
    personalizedAds: await resolvePersonalizedAds(),
    privacyOptionsRequired:
      info.privacyOptionsRequirementStatus ===
      AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
  });
  if (!info.canRequestAds) {
    return false;
  }
  if (!sdkPromise) {
    sdkPromise = initializeSdk();
  }
  return sdkPromise;
}

async function gatherConsent(): Promise<void> {
  try {
    const info = await AdsConsent.gatherConsent(consentOptions());
    Analytics.consentGathered({
      status: info.status,
      canRequestAds: info.canRequestAds,
      formAvailable: info.isConsentFormAvailable,
    });
  } catch (error) {
    // Not fatal. The UMP SDK keeps the previous session's status, so we fall
    // through to startAdsIfAllowed and let canRequestAds decide.
    const message = error instanceof Error ? error.message : String(error);
    if (__DEV__) {
      console.warn(`[ads] consent gathering failed: ${message}`);
    }
    Analytics.consentFailed({message});
  }
}

let initPromise: Promise<boolean> | null = null;

/**
 * Gathers EU consent, then initializes the Google Mobile Ads SDK. Runs once per
 * app launch; nothing loads before it, and under GDPR nothing loads until the
 * user has answered the form.
 *
 * Consent gathering and the SDK start run in parallel on purpose: a returning
 * user already has a usable status from the previous session, so they get ads
 * without waiting on the form config to download.
 */
export function initializeAds(): Promise<boolean> {
  if (initPromise) {
    return initPromise;
  }
  initPromise = Promise.all([
    gatherConsent().then(startAdsIfAllowed),
    startAdsIfAllowed(),
  ]).then(([afterConsent, fromPreviousSession]) => afterConsent || fromPreviousSession);
  return initPromise;
}

/** Re-runs the consent check, e.g. after the user edits their choices. */
export function refreshAdsConsent(): Promise<boolean> {
  initPromise = null;
  return initializeAds();
}

/**
 * Presents the UMP privacy options form so a user can change or withdraw
 * consent. Google requires this entry point wherever
 * `privacyOptionsRequired` is true.
 */
export async function showAdsPrivacyOptions(): Promise<void> {
  Analytics.consentPrivacyOptionsOpened();
  await AdsConsent.showPrivacyOptionsForm();
  await refreshAdsConsent();
}

export function useAdsState(): AdsState {
  const [current, setCurrent] = useState(state);
  useEffect(() => {
    listeners.add(setCurrent);
    setCurrent(state);
    initializeAds();
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);
  return current;
}
