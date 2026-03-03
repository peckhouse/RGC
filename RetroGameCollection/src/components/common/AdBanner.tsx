import React from 'react';
import {Platform, View, StyleSheet} from 'react-native';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';
import {ADMOB_BANNER_IOS, ADMOB_BANNER_ANDROID} from '../../config';
import {useProStatus} from '../../hooks/useProStatus';

const adUnitId = __DEV__
  ? TestIds.BANNER
  : Platform.OS === 'ios'
    ? ADMOB_BANNER_IOS
    : ADMOB_BANNER_ANDROID;

export default function AdBanner() {
  const {isPro, isLoading} = useProStatus();

  if (isLoading || isPro) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{requestNonPersonalizedAdsOnly: true}}
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
