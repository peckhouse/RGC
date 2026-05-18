import React, {useMemo, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  Animated,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useMyCollection} from '../api/collection';
import {usePullRefresh} from '../hooks/usePullRefresh';
import {useProStatus} from '../hooks/useProStatus';
import {useFreeConsoleLimit} from '../hooks/useFreeConsoleLimit';
import {Gamepad2, Joystick, ChevronRight, Library, Star} from 'lucide-react-native';
import type {RootStackParamList, MainTabParamList, HomeStackParamList} from '../navigation/AppNavigator';
import AdBanner from '../components/common/AdBanner';
import {StatsCardSkeleton} from '../components/common/Skeleton';
import GradientText from '../components/common/GradientText';
import {Fonts} from '../constants/fonts';
import LinearGradient from 'react-native-linear-gradient';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >
>;

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function NavCard({icon, label, onPress}: {icon: React.ReactNode; label: string; onPress: () => void}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  function handlePressIn() {
    Animated.parallel([
      Animated.spring(scale, {toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0}),
      Animated.spring(translateX, {toValue: -4, useNativeDriver: true, speed: 50, bounciness: 0}),
    ]).start();
  }
  function handlePressOut() {
    Animated.parallel([
      Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6}),
      Animated.spring(translateX, {toValue: 0, useNativeDriver: true, speed: 30, bounciness: 6}),
    ]).start();
  }

  return (
    <Animated.View style={[styles.navCardShadow, {transform: [{scale}, {translateX}]}]}>
      <TouchableOpacity
        style={styles.navCard}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        <LinearGradient
          colors={['#0d2525', '#0a1a35', '#06091e']}
          locations={[0, 0.60, 1]}
          start={{x: 1, y: 1}}
          end={{x: 0, y: 0}}
          style={styles.navCardGradient}
        />
        {icon}
        <Text style={styles.navCardLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const {data: collection, refetch, isLoading: collectionLoading} = useMyCollection();
  const {refreshing, onRefresh} = usePullRefresh(refetch);
  const {isPro, isLoading: proLoading} = useProStatus();
  const freeConsoleLimit = useFreeConsoleLimit();

  const ownedCount = useMemo(
    () => (collection ? new Set(collection.map(e => e.games.igdb_id)).size : 0),
    [collection],
  );

  const consolesTracked = useMemo(() => {
    if (!collection) return 0;
    return new Set(collection.map(e => e.console_id)).size;
  }, [collection]);

  // Sum collection value from prices (price_loose / price_complete based on condition)
  const collectionValue = useMemo(() => {
    if (!collection) return null;
    let sum = 0;
    let hasAnyPrice = false;
    for (const entry of collection) {
      const g = entry.games;
      const cond = entry.condition;
      const price =
        cond === 'complete' || cond === 'inbox' ? g.price_complete : g.price_loose;
      if (price != null) {
        sum += price;
        hasAnyPrice = true;
      }
    }
    return hasAnyPrice ? sum : null;
  }, [collection]);

  const atConsoleLimitWarning = !isPro && consolesTracked >= freeConsoleLimit - 1;


  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }>

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('../../assets/rgc-logo.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />
        </View>

        {/* Stats card */}
        <View style={styles.statsCardShadow}>
        <View style={styles.statsCard}>
          <LinearGradient
            colors={['#0d2525', '#0a1a35', '#06091e']}
            locations={[0, 0.4, 1]}
            start={{x: 0.8, y: 1}}
            end={{x: 0.2, y: 0}}
            style={styles.statsCardGradient}
          />

          {(proLoading || collectionLoading) ? <StatsCardSkeleton /> : (
            <>
              {/* Collection value row */}
              {isPro ? (
                <View style={styles.valueRow}>
                  <View style={styles.unlockContent}>
                    <Text style={styles.valueLabel}>COLLECTION VALUE</Text>
                    <GradientText style={styles.valueAmount}>
                      {collectionValue != null ? formatCents(collectionValue) : '—'}
                    </GradientText>
                    {collectionValue == null && (
                      <Text style={styles.valueNote}>Prices sync weekly</Text>
                    )}
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.valueRow}
                  onPress={() => navigation.navigate('Paywall', {reason: 'collection-value', plans: 'subscriptions-only'})}
                  activeOpacity={0.8}>
                  <View style={styles.unlockContent}>
                    <Text style={styles.unlockTitle}>Unlock Collection Value</Text>
                    <Text style={styles.unlockSub}>See what your games are worth on the market</Text>
                  </View>
                  <ChevronRight size={20} color="#6366f1" />
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={styles.cardDivider} />

              {/* Stats row */}
              <View style={styles.statsRow}>
                {/* Games owned */}
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Games</Text>
                  <View style={styles.statIconRow}>
                    <Gamepad2 size={18} color="#475569" />
                    <Text style={styles.statValue}>{ownedCount > 0 ? ownedCount.toLocaleString() : '—'}</Text>
                    <View style={styles.statIconSpacer} />
                  </View>
                  <Text style={styles.statSubLabel}>In your collection</Text>
                </View>
                <View style={styles.statDivider} />
                {/* Consoles */}
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Consoles</Text>
                  <View style={styles.statIconRow}>
                    <Joystick size={18} color="#475569" />
                    {isPro
                      ? <Text style={styles.statValue}>{consolesTracked > 0 ? String(consolesTracked) : '—'}</Text>
                      : <Text style={styles.statValue}>
                          {consolesTracked} <Text style={styles.statValueSep}>/</Text> {freeConsoleLimit}
                        </Text>
                    }
                    <View style={styles.statIconSpacer} />
                  </View>
                  {!isPro ? (
                    <>
                      <View style={styles.progressBarBg}>
                        <LinearGradient
                          colors={['#FF1B8D', '#A855F7', '#5B45DC']}
                          locations={[0, 0.65, 1]}
                          start={{x: 0, y: 0}}
                          end={{x: 1, y: 0}}
                          style={[
                            styles.progressBarFill,
                            {width: `${Math.min((consolesTracked / freeConsoleLimit) * 100, 100)}%`},
                          ]}
                        />
                      </View>
                      {atConsoleLimitWarning && (
                        <TouchableOpacity
                          onPress={() => navigation.navigate('Paywall', {reason: 'console-limit', plans: 'subscriptions-only'})}>
                          <Text style={styles.consoleLimitCtaText}>Upgrade ›</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <Text style={styles.statSubLabel}>Unlimited</Text>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
        </View>

        {/* Quick nav */}
        <View style={styles.navRow}>
          <NavCard
            icon={<Library size={28} color="rgba(99, 160, 255, 0.85)" />}
            label="My Collection"
            onPress={() => navigation.navigate('Collection' as any)}
          />
          <NavCard
            icon={<Star size={28} color="#FF1B8D" />}
            label="Wishlist"
            onPress={() => navigation.navigate('Wishlist' as any)}
          />
        </View>


      </ScrollView>
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 44,
  },
  heroLogo: {
    width: 160,
    height: 71,
    marginTop: 8,
    marginBottom: 20,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#ffffff',
    textAlign: 'center',
  },
  // Unified stats card
  statsCardShadow: {
    borderRadius: 16,
    marginBottom: 28,
    shadowColor: '#3B82F6',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    overflow: 'hidden',
  },
  statsCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  valueAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  valueNote: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  valueIcon: {
    fontSize: 24,
  },
  unlockContent: {
    flex: 1,
    paddingRight: 12,
  },
  unlockTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  unlockSub: {
    fontSize: 12,
    color: '#64748b',
  },
  chevron: {
    fontSize: 24,
    color: '#6366f1',
    fontWeight: '300',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    marginHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  statValueCentered: {
    textAlign: 'center',
  },
  statIconSpacer: {
    width: 18,
  },
  statValueSep: {
    fontSize: 16,
    fontWeight: '400',
    color: '#475569',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statSubLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  progressBarBg: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  consoleLimitCtaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 6,
  },
  // Section
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.display,
    color: '#ffffff',
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  // Quick nav row
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  navCardShadow: {
    flex: 1,
    borderRadius: 16,
  },
  navCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    overflow: 'hidden',
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  navCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navCardLabel: {
    fontSize: 15,
    fontFamily: Fonts.display,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#ffffff',
  },
  // CTA cards
  ctaCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 3,
  },
  ctaSub: {
    fontSize: 12,
    color: '#64748b',
    maxWidth: '90%',
  },
  ctaChevron: {
    fontSize: 24,
    color: '#334155',
    fontWeight: '300',
  },
});
