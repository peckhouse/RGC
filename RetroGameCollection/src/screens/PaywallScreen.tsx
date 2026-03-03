import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {PurchasesPackage} from 'react-native-purchases';
import {PURCHASES_ERROR_CODE} from 'react-native-purchases';
import {getOfferings, purchasePackage} from '../lib/purchases';
import {useProStatus} from '../hooks/useProStatus';
import {Toast} from '../components/common/AppToast';
import {Analytics} from '../lib/analytics';
import type {RootStackParamList} from '../navigation/AppNavigator';

const BENEFITS = [
  {icon: '♾️', text: 'Unlimited consoles tracked'},
  {icon: '⭐', text: 'Wishlist with priority levels'},
  {icon: '🚫', text: 'No ads'},
];

type OfferingPackages = {
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
  lifetime: PurchasesPackage | null;
};

export default function PaywallScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Paywall'>>();
  const plans = route.params?.plans ?? 'all';
  const {refresh} = useProStatus();
  const [packages, setPackages] = useState<OfferingPackages>({
    monthly: null,
    annual: null,
    lifetime: null,
  });
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    Analytics.paywallViewed({reason: route.params?.reason ?? 'unknown'});
  }, [route.params?.reason]);

  useEffect(() => {
    getOfferings().then(offering => {
      if (offering) {
        setPackages({
          monthly: offering.monthly ?? null,
          annual: offering.annual ?? null,
          lifetime:
            offering.lifetime ??
            offering.availablePackages.find(p =>
              p.identifier.toLowerCase().includes('lifetime'),
            ) ??
            null,
        });
      }
      setLoadingOfferings(false);
    });
  }, []);

  async function handlePurchase(pkg: PurchasesPackage) {
    setPurchasing(pkg.identifier);
    try {
      const isPro = await purchasePackage(pkg);
      if (isPro) {
        Analytics.purchaseCompleted({plan: pkg.identifier});
        refresh();
        navigation.goBack();
        Toast.show({type: 'success', text1: 'Welcome to RGC Pro!', visibilityTime: 3000});
      }
    } catch (e: any) {
      if (e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED) {
        Analytics.purchaseCancelled({plan: pkg.identifier});
        Toast.show({type: 'info', text1: 'Purchase cancelled', visibilityTime: 2500});
      } else {
        Toast.show({
          type: 'error',
          text1: 'Purchase failed',
          text2: e?.message ?? 'Please try again',
          visibilityTime: 3500,
        });
      }
    } finally {
      setPurchasing(null);
    }
  }

  const isBusy = purchasing !== null;

  return (
    <View style={styles.container}>
      {/* Close button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headline}>Upgrade to RGC Pro</Text>
        <Text style={styles.subheadline}>
          The complete retro game collection toolkit
        </Text>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          {BENEFITS.map(b => (
            <View key={b.text} style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        {loadingOfferings ? (
          <ActivityIndicator color="#6366f1" style={styles.loader} />
        ) : !packages.monthly && !packages.annual && !packages.lifetime ? (
          <View style={styles.unavailable}>
            <Text style={styles.unavailableText}>
              Plans unavailable right now. Please try again later.
            </Text>
          </View>
        ) : (
          <View style={styles.pricingCards}>
            {packages.annual && (
              <View style={[styles.pricingCard, styles.pricingCardHighlight]}>
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Best Value</Text>
                </View>
                <Text style={styles.pricingTitle}>Yearly</Text>
                <Text style={styles.pricingPrice}>
                  {packages.annual.product.localizedPriceString}
                </Text>
                <Text style={styles.pricingPer}>/ year</Text>
                <Pressable
                  style={({pressed}) => [styles.buyBtn, styles.buyBtnHighlight, pressed && !isBusy && {backgroundColor: '#818cf8'}]}
                  onPress={() => handlePurchase(packages.annual!)}
                  disabled={isBusy}>
                  {purchasing === packages.annual.identifier ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buyBtnText}>Choose Plan</Text>
                  )}
                </Pressable>
              </View>
            )}

            {packages.monthly && (
              <View style={styles.pricingCard}>
                <Text style={styles.pricingTitle}>Monthly</Text>
                <Text style={styles.pricingPrice}>
                  {packages.monthly.product.localizedPriceString}
                </Text>
                <Text style={styles.pricingPer}>/ month</Text>
                <Pressable
                  style={({pressed}) => [styles.buyBtn, pressed && !isBusy && {backgroundColor: '#475569'}]}
                  onPress={() => handlePurchase(packages.monthly!)}
                  disabled={isBusy}>
                  {purchasing === packages.monthly.identifier ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buyBtnText}>Choose Plan</Text>
                  )}
                </Pressable>
              </View>
            )}

            {plans === 'all' && packages.lifetime && (
              <View style={styles.pricingCard}>
                <Text style={styles.pricingTitle}>Lifetime</Text>
                <Text style={styles.pricingPrice}>
                  {packages.lifetime.product.localizedPriceString}
                </Text>
                <Text style={styles.pricingPer}>one-time</Text>
                <Pressable
                  style={({pressed}) => [styles.buyBtn, pressed && !isBusy && {backgroundColor: '#475569'}]}
                  onPress={() => handlePurchase(packages.lifetime!)}
                  disabled={isBusy}>
                  {purchasing === packages.lifetime.identifier ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buyBtnText}>Choose Plan</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        )}

        <Text style={styles.legal}>
          {'Subscriptions auto-renew unless cancelled.\nManage or cancel anytime in your device\'s subscription settings.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  closeBtn: {
    position: 'absolute',
    top: 24,
    right: 20,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 28,
  },
  benefitsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: 15,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  loader: {
    marginVertical: 32,
  },
  unavailable: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  unavailableText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  pricingCards: {
    gap: 12,
    marginBottom: 24,
  },
  pricingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  pricingCardHighlight: {
    borderColor: '#6366f1',
    backgroundColor: '#1e1f3b',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    backgroundColor: '#6366f1',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bestValueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pricingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6366f1',
  },
  pricingPer: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
  },
  buyBtn: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buyBtnHighlight: {
    backgroundColor: '#6366f1',
  },
  buyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  legal: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 17,
  },
});
