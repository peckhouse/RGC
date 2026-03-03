import React, {useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../hooks/useAuth';
import {useMyCollection} from '../api/collection';
import {useProfile} from '../api/profile';
import {useProStatus} from '../hooks/useProStatus';
import {igdbImageUrl} from '../api/games';
import type {RootStackParamList, MainTabParamList} from '../navigation/AppNavigator';
import AdBanner from '../components/common/AdBanner';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const FREE_CONSOLE_LIMIT = 5;

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const {session} = useAuth();
  const {data: collection, isRefetching, refetch} = useMyCollection();
  const {data: profile} = useProfile();
  const {isPro, isLoading: proLoading} = useProStatus();

  const email = session?.user?.email ?? '';
  const greeting = profile?.username || (email ? email.split('@')[0] : 'Collector');

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
          <View style={styles.heroRow}>
            <Text style={styles.heroApp}>RGC</Text>
            <Text style={styles.heroDot}>·</Text>
            <Text style={styles.heroGreeting}>Hi, {greeting}</Text>
          </View>
          <Text style={styles.heroTagline}>Your retro game collection</Text>
        </View>

        {/* Collection Value */}
        {!proLoading && (
          isPro ? (
            <View style={styles.valueCard}>
              <View>
                <Text style={styles.valueLabel}>COLLECTION VALUE</Text>
                <Text style={styles.valueAmount}>
                  {collectionValue != null ? formatCents(collectionValue) : '—'}
                </Text>
                {collectionValue == null && (
                  <Text style={styles.valueNote}>Prices sync weekly</Text>
                )}
              </View>
              <Text style={styles.valueIcon}>💰</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.valueCardFree}
              onPress={() =>
                navigation.navigate('Paywall', {
                  reason: 'collection-value',
                  plans: 'subscriptions-only',
                })
              }
              activeOpacity={0.8}>
              <View style={styles.valueCardFreeContent}>
                <Text style={styles.valueCardFreeTitle}>Unlock Collection Value</Text>
                <Text style={styles.valueCardFreeSub}>
                  See what your games are worth on the market
                </Text>
              </View>
              <Text style={styles.valueCardFreeChevron}>›</Text>
            </TouchableOpacity>
          )
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          {/* Games owned */}
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={[styles.statValue, styles.statValueAccent]}>
              {ownedCount > 0 ? ownedCount.toLocaleString() : '—'}
            </Text>
            <Text style={styles.statLabel}>Games owned</Text>
          </View>

          {/* Console counter */}
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {isPro
                ? consolesTracked > 0 ? String(consolesTracked) : '—'
                : `${consolesTracked} of ${FREE_CONSOLE_LIMIT}`}
            </Text>
            <Text style={styles.statLabel}>
              {isPro ? 'Consoles' : 'Consoles used'}
            </Text>
            {atConsoleLimitWarning && (
              <TouchableOpacity
                style={styles.consoleLimitCta}
                onPress={() =>
                  navigation.navigate('Paywall', {
                    reason: 'console-limit',
                    plans: 'subscriptions-only',
                  })
                }>
                <Text style={styles.consoleLimitCtaText}>Upgrade for unlimited ›</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Recently added */}
        {recentGames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently added</Text>
            <View style={styles.recentRow}>
              {recentGames.map(entry => {
                const uri = igdbImageUrl(entry.games.cover_url);
                const cond = entry.condition ?? 'loose';
                const condColor =
                  cond === 'complete' ? '#22c55e' : cond === 'inbox' ? '#3b82f6' : '#64748b';
                const condLabel =
                  cond === 'complete' ? 'CMP' : cond === 'inbox' ? 'INB' : 'LSE';
                return (
                  <View key={entry.id} style={styles.recentItem}>
                    {uri ? (
                      <Image source={{uri}} style={styles.recentCover} resizeMode="cover" />
                    ) : (
                      <View style={[styles.recentCover, styles.recentCoverPlaceholder]}>
                        <Text style={styles.recentCoverPlaceholderText}>🎮</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.condBadge,
                        {backgroundColor: condColor + '22', borderColor: condColor},
                      ]}>
                      <Text style={[styles.condBadgeText, {color: condColor}]}>
                        {condLabel}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick access</Text>

          <TouchableOpacity
            style={styles.ctaCard}
            onPress={() => navigation.navigate('Collection')}
            activeOpacity={0.8}>
            <View>
              <Text style={styles.ctaTitle}>My Collection</Text>
              <Text style={styles.ctaSub}>
                Track the games you own and your set completion
              </Text>
            </View>
            <Text style={styles.ctaChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ctaCard}
            onPress={() => navigation.navigate('Consoles')}
            activeOpacity={0.8}>
            <View>
              <Text style={styles.ctaTitle}>Browse Games</Text>
              <Text style={styles.ctaSub}>
                Pick a platform and explore its full game library
              </Text>
            </View>
            <Text style={styles.ctaChevron}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    marginBottom: 24,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroApp: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 1,
  },
  heroDot: {
    fontSize: 18,
    color: '#334155',
    fontWeight: '300',
  },
  heroGreeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  heroTagline: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  // Collection value — Pro
  valueCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#22c55e',
  },
  valueNote: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  valueIcon: {
    fontSize: 32,
  },
  // Collection value — Free CTA
  valueCardFree: {
    backgroundColor: '#1e1f3b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  valueCardFreeContent: {
    flex: 1,
    paddingRight: 12,
  },
  valueCardFreeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  valueCardFreeSub: {
    fontSize: 12,
    color: '#64748b',
  },
  valueCardFreeChevron: {
    fontSize: 24,
    color: '#6366f1',
    fontWeight: '300',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statCardAccent: {
    borderWidth: 1,
    borderColor: '#6366f133',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#475569',
  },
  statValueAccent: {
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  consoleLimitCta: {
    marginTop: 8,
  },
  consoleLimitCtaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
    textAlign: 'center',
  },
  // Section
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  // Recently added
  recentRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  recentItem: {
    alignItems: 'center',
    gap: 4,
  },
  recentCover: {
    width: 58,
    height: 74,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  recentCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentCoverPlaceholderText: {
    fontSize: 22,
  },
  condBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  condBadgeText: {
    fontSize: 9,
    fontWeight: '800',
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
