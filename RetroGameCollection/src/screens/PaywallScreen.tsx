import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {PurchasesPackage} from 'react-native-purchases';
import {PURCHASES_ERROR_CODE} from 'react-native-purchases';
import {Infinity as InfinityIcon, Star, Ban, X} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {getOfferings, purchasePackage} from '../lib/purchases';
import {useProStatus} from '../hooks/useProStatus';
import {Toast} from '../components/common/AppToast';
import {Analytics} from '../lib/analytics';
import {Fonts} from '../constants/fonts';
import {PRIVACY_POLICY_URL, TERMS_URL} from '../constants/legal';
import type {RootStackParamList} from '../navigation/AppNavigator';

const BENEFITS: {icon: React.ReactNode; text: string}[] = [
  {icon: <InfinityIcon size={20} color="rgba(99, 160, 255, 0.85)" />, text: 'Unlimited consoles tracked'},
  {icon: <Star size={20} color="rgba(99, 160, 255, 0.85)" />, text: 'Wishlist with priority levels'},
  {icon: <Ban size={20} color="rgba(99, 160, 255, 0.85)" />, text: 'No ads'},
];

type OfferingPackages = {
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
  lifetime: PurchasesPackage | null;
};

function GradientCard({children, highlight}: {children: React.ReactNode; highlight?: boolean}) {
  return (
    <View style={[styles.card, highlight && styles.cardHighlight]}>
      <LinearGradient
        colors={['#0d2525', '#0a1a35', '#06091e']}
        locations={[0, 0.60, 1]}
        start={{x: 1, y: 1}}
        end={{x: 0, y: 0}}
        style={styles.cardGradient}
      />
      {children}
    </View>
  );
}

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
        Toast.show({type: 'success', text1: 'Welcome to RGC Pro!'});
      }
    } catch (e: any) {
      if (e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        Analytics.purchaseCancelled({plan: pkg.identifier});
        Toast.show({type: 'info', text1: 'Purchase cancelled'});
      } else {
        Toast.show({
          type: 'error',
          text1: 'Purchase failed',
          text2: e?.message ?? 'Please try again',
        });
      }
    } finally {
      setPurchasing(null);
    }
  }

  const isBusy = purchasing !== null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
        <X size={18} color="rgba(99, 160, 255, 0.85)" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Upgrade to RGC Pro</Text>
        <Text style={styles.subheadline}>
          The complete retro game collection toolkit
        </Text>

        <GradientCard>
          <View style={styles.benefitsInner}>
            {BENEFITS.map(b => (
              <View key={b.text} style={styles.benefitRow}>
                <View style={styles.benefitIconWrap}>{b.icon}</View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>
        </GradientCard>

        {loadingOfferings ? (
          <ActivityIndicator color="#6366f1" style={styles.loader} />
        ) : !packages.monthly && !packages.annual && !packages.lifetime ? (
          <GradientCard>
            <Text style={styles.unavailableText}>
              Plans unavailable right now. Please try again later.
            </Text>
          </GradientCard>
        ) : (
          <View style={styles.pricingCards}>
            {packages.annual && (
              <GradientCard highlight>
                <View style={styles.bestValueBadge}>
                  <LinearGradient
                    colors={['#FF1B8D', '#A855F7', '#5B45DC']}
                    locations={[0, 0.65, 1]}
                    start={{x: 0.3, y: 0}}
                    end={{x: 0.4, y: 1}}
                    style={styles.bestValueGradient}
                  />
                  <Text style={styles.bestValueText}>Best Value</Text>
                </View>
                <Text style={styles.pricingTitle}>Yearly</Text>
                <Text style={styles.pricingPriceHighlight}>
                  {packages.annual.product.priceString}
                </Text>
                <Text style={styles.pricingPer}>/ year</Text>
                <Pressable
                  style={({pressed}) => [
                    styles.buyBtn,
                    isBusy && styles.buyBtnDisabled,
                    pressed && !isBusy && styles.buyBtnPressed,
                  ]}
                  onPress={() => handlePurchase(packages.annual!)}
                  disabled={isBusy}>
                  <LinearGradient
                    colors={['#FF1B8D', '#A855F7', '#5B45DC']}
                    locations={[0, 0.65, 1]}
                    start={{x: 0.3, y: 0}}
                    end={{x: 0.4, y: 1}}
                    style={styles.buyBtnGradient}
                  />
                  {purchasing === packages.annual.identifier ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buyBtnText}>Choose Plan</Text>
                  )}
                </Pressable>
              </GradientCard>
            )}

            {packages.monthly && (
              <GradientCard>
                <Text style={styles.pricingTitle}>Monthly</Text>
                <Text style={styles.pricingPrice}>
                  {packages.monthly.product.priceString}
                </Text>
                <Text style={styles.pricingPer}>/ month</Text>
                <Pressable
                  style={({pressed}) => [
                    styles.buyBtnSecondary,
                    isBusy && styles.buyBtnDisabled,
                    pressed && !isBusy && styles.buyBtnPressed,
                  ]}
                  onPress={() => handlePurchase(packages.monthly!)}
                  disabled={isBusy}>
                  {purchasing === packages.monthly.identifier ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buyBtnSecondaryText}>Choose Plan</Text>
                  )}
                </Pressable>
              </GradientCard>
            )}

            {plans === 'all' && packages.lifetime && (
              <GradientCard>
                <Text style={styles.pricingTitle}>Lifetime</Text>
                <Text style={styles.pricingPrice}>
                  {packages.lifetime.product.priceString}
                </Text>
                <Text style={styles.pricingPer}>one-time</Text>
                <Pressable
                  style={({pressed}) => [
                    styles.buyBtnSecondary,
                    isBusy && styles.buyBtnDisabled,
                    pressed && !isBusy && styles.buyBtnPressed,
                  ]}
                  onPress={() => handlePurchase(packages.lifetime!)}
                  disabled={isBusy}>
                  {purchasing === packages.lifetime.identifier ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buyBtnSecondaryText}>Choose Plan</Text>
                  )}
                </Pressable>
              </GradientCard>
            )}
          </View>
        )}

        <Text style={styles.legal}>
          {'Subscriptions auto-renew unless cancelled.\nManage or cancel anytime in your device\'s subscription settings.'}
        </Text>

        <View style={styles.legalLinksRow}>
          <Pressable
            onPress={() => Linking.openURL(TERMS_URL)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            {({pressed}) => (
              <Text style={[styles.legalLink, pressed && styles.legalLinkPressed]}>
                Terms of Use (EULA)
              </Text>
            )}
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            {({pressed}) => (
              <Text style={[styles.legalLink, pressed && styles.legalLinkPressed]}>
                Privacy Policy
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  closeBtn: {
    position: 'absolute',
    top: 24,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
  },
  headline: {
    fontSize: 26,
    fontFamily: Fonts.display,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 28,
  },

  // Shared card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    overflow: 'hidden',
    padding: 18,
    marginBottom: 12,
    position: 'relative',
  },
  cardHighlight: {
    borderColor: '#FF1B8D',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Benefits
  benefitsInner: {
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIconWrap: {
    width: 28,
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 15,
    color: '#e2e8f0',
    fontWeight: '500',
    flex: 1,
  },

  // Loader + unavailable
  loader: {
    marginVertical: 32,
  },
  unavailableText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },

  // Pricing
  pricingCards: {
    marginTop: 12,
    marginBottom: 24,
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bestValueGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    fontFamily: Fonts.display,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  pricingPriceHighlight: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  pricingPer: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 14,
  },

  // Primary CTA
  buyBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buyBtnGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buyBtnPressed: {
    opacity: 0.85,
  },
  buyBtnDisabled: {
    opacity: 0.6,
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Secondary CTA (Monthly / Lifetime)
  buyBtnSecondary: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  buyBtnSecondaryText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  legal: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 17,
  },
  legalLinksRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  legalLink: {
    fontSize: 12,
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  legalLinkPressed: {
    opacity: 0.7,
  },
  legalDot: {
    fontSize: 12,
    color: '#475569',
  },
});
