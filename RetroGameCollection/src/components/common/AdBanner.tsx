import React, {useEffect, useMemo, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import {BANNER_AD_UNIT_ID, useAdsState} from '../../lib/ads';
import {Analytics} from '../../lib/analytics';
import {useProStatus} from '../../hooks/useProStatus';

// Banners refresh on their own and this component is mounted on four screens,
// so the healthy-path events are reported once per launch to keep the PostHog
// event count sane. Failures are always reported.
let loadReported = false;
let proSuppressionReported = false;

export default function AdBanner() {
  const {isPro, isLoading} = useProStatus();
  const {ready, personalizedAds} = useAdsState();
  const [failed, setFailed] = useState(false);

  // Memoised because BaseAd re-validates (and the native view reloads) whenever
  // the requestOptions object identity changes.
  const requestOptions = useMemo(
    () => ({requestNonPersonalizedAdsOnly: !personalizedAds}),
    [personalizedAds],
  );

  useEffect(() => {
    if (isLoading || !isPro || proSuppressionReported) {
      return;
    }
    proSuppressionReported = true;
    Analytics.adsSuppressedForPro();
  }, [isLoading, isPro]);

  if (isLoading || isPro || !ready || failed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={requestOptions}
        onAdLoaded={() => {
          if (loadReported) {
            return;
          }
          loadReported = true;
          Analytics.adLoaded({unitId: BANNER_AD_UNIT_ID});
        }}
        onAdFailedToLoad={error => {
          // Collapses the strip for this mount so a failed request leaves no
          // empty band; the next screen that mounts a banner tries again.
          setFailed(true);
          const code = (error as {code?: string}).code;
          const message = error instanceof Error ? error.message : String(error);
          if (__DEV__) {
            console.warn(`[ads] banner failed (${code ?? 'no code'}): ${message}`);
          }
          Analytics.adFailed({unitId: BANNER_AD_UNIT_ID, code, message});
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});
