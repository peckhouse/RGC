import React, {useMemo, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  Animated,
  Dimensions,
} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * (4 / 3);
import {useNavigation} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../hooks/useAuth';
import {useMyCollection} from '../api/collection';
import {useProfile} from '../api/profile';
import {useProStatus} from '../hooks/useProStatus';
import {igdbImageUrl} from '../api/games';
import {Gamepad2, Joystick, ChevronRight} from 'lucide-react-native';
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

const FREE_CONSOLE_LIMIT = 5;

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function RecentCard({entry, onPress}: {entry: any; onPress: () => void}) {
  const scale = useRef(new Animated.Value(1)).current;
  const uri = igdbImageUrl(entry.games.cover_url);
  const cond = entry.condition ?? 'loose';
  const condColor = cond === 'complete' ? '#22c55e' : cond === 'inbox' ? '#3b82f6' : '#64748b';
  const condLabel = cond === 'complete' ? 'CMP' : cond === 'inbox' ? 'INB' : 'LSE';

  function handlePressIn() {
    Animated.spring(scale, {toValue: 0.93, useNativeDriver: true, speed: 50, bounciness: 0}).start();
  }
  function handlePressOut() {
    Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6}).start();
  }

  return (
    <Animated.View style={[styles.recentCardShadow, {transform: [{scale}]}]}>
      <TouchableOpacity
        style={styles.recentCard}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        {uri ? (
          <Image source={{uri}} style={styles.recentCardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.recentCardImage, styles.recentCardPlaceholder]}>
            <Text style={styles.recentCardPlaceholderText}>🎮</Text>
          </View>
        )}
        <View style={styles.recentCardOverlay} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.98)']}
          locations={[0.3, 1]}
          style={styles.recentCardBottomGradient}
        />
        <View style={[styles.condGlass, {borderColor: condColor}]}>
          <Text style={[styles.condGlassText, {color: condColor}]}>{condLabel}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const {session} = useAuth();
  const {data: collection, isRefetching, refetch, isLoading: collectionLoading} = useMyCollection();
  const {data: profile, isLoading: profileLoading} = useProfile();
  const {isPro, isLoading: proLoading} = useProStatus();

  const email = session?.user?.email ?? '';
  const greeting = profile?.username || (email ? email.split('@')[0] : 'Collector');

  const greetingOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!profileLoading) {
      Animated.timing(greetingOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [profileLoading, greetingOpacity]);

const ownedCount = collection?.length ?? 0;

  const consolesTracked = useMemo(() => {
    if (!collection) return 0;
    return new Set(collection.map(e => e.console_id)).size;
  }, [collection]);

  const recentGames = useMemo(() => {
    if (!collection) return [];
    return collection.slice(0, 6);
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

  const atConsoleLimitWarning = !isPro && consolesTracked >= FREE_CONSOLE_LIMIT - 1;


  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
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
          <Animated.Text style={[styles.heroGreeting, {opacity: greetingOpacity}]}>Welcome back, {greeting}</Animated.Text>
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
                          {consolesTracked} <Text style={styles.statValueSep}>/</Text> {FREE_CONSOLE_LIMIT}
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
                            {width: `${Math.min((consolesTracked / FREE_CONSOLE_LIMIT) * 100, 100)}%`},
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

        {/* Recently added */}
        {recentGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Added</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Collection' as any)}>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentGrid}>
              {recentGames.map(entry => (
                <RecentCard
                  key={entry.id}
                  entry={entry}
                  onPress={() => navigation.navigate('GameDetail', {
                    gameId: entry.games.id,
                    gameName: entry.games.name,
                    consoleId: entry.console_id,
                    consoleName: entry.consoles.name,
                  })}
                />
              ))}
            </View>
          </View>
        )}


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
  // Recently added grid
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  recentCardShadow: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 10,
    shadowColor: '#3B82F6',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  recentCard: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#A855F7',
  },
  recentCardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  recentCardPlaceholder: {
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentCardPlaceholderText: {
    fontSize: 28,
  },
  recentCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  recentCardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingBottom: 7,
  },
  recentCardBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  recentCardConsole: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  condGlass: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  condGlassText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
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
