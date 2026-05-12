import React, {useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  Image,
  RefreshControl,
  StyleSheet,
  Animated,
} from 'react-native';
import {GameListSkeleton} from '../components/common/Skeleton';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ChevronRight, Search, Star} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useMyWishlist} from '../api/wishlist';
import {igdbImageUrl} from '../api/games';
import type {WishlistStackParamList, RootStackParamList} from '../navigation/AppNavigator';
import type {WishlistEntryWithDetails} from '../api/wishlist';
import type {UserWishlist} from '../types/database';
import {useProStatus} from '../hooks/useProStatus';
import ScreenLogo from '../components/common/ScreenLogo';
import AdBanner from '../components/common/AdBanner';
import {Fonts} from '../constants/fonts';

type Nav = NativeStackNavigationProp<WishlistStackParamList & RootStackParamList>;

type Priority = UserWishlist['priority'];

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#64748b',
};
const PRIORITY_ORDER: Record<Priority, number> = {high: 0, medium: 1, low: 2};

function Separator() {
  return <View style={styles.separator} />;
}

const GameRow = React.memo(function GameRow({
  entry,
  onPress,
}: {
  entry: WishlistEntryWithDetails;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const cover = igdbImageUrl(entry.games.cover_url);
  const priority = entry.priority;

  function handlePressIn() {
    Animated.parallel([
      Animated.spring(scale, {toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0}),
      Animated.spring(translateX, {toValue: -8, useNativeDriver: true, speed: 50, bounciness: 0}),
    ]).start();
  }
  function handlePressOut() {
    Animated.parallel([
      Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6}),
      Animated.spring(translateX, {toValue: 0, useNativeDriver: true, speed: 30, bounciness: 6}),
    ]).start();
  }

  return (
    <Animated.View style={{transform: [{scale}, {translateX}]}}>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        <LinearGradient
          colors={['#0d2525', '#0a1a35', '#06091e']}
          locations={[0, 0.60, 1]}
          start={{x: 1, y: 1}}
          end={{x: 0, y: 0}}
          style={styles.rowGradient}
        />
        <View>
          {cover ? (
            <Image source={{uri: cover}} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Image
                source={require('../../assets/rgc-logo.png')}
                style={styles.coverPlaceholderLogo}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.gameName} numberOfLines={2}>
            {entry.games.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.regionBadge}>
              <Text style={styles.regionText}>{entry.games.region}</Text>
            </View>
            <View style={styles.consoleBadge}>
              <Text style={styles.consoleText} numberOfLines={1}>
                {entry.consoles.name}
              </Text>
            </View>
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor: PRIORITY_COLORS[priority] + '22',
                  borderColor: PRIORITY_COLORS[priority],
                },
              ]}>
              <Text style={[styles.priorityText, {color: PRIORITY_COLORS[priority]}]}>
                {PRIORITY_LABELS[priority]}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={22} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function WishlistScreen() {
  const navigation = useNavigation<Nav>();
  const {isPro, isLoading: proLoading} = useProStatus();
  const {data: wishlist, isLoading, isRefetching, isError, refetch} = useMyWishlist();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const entries = useMemo(() => {
    if (!wishlist) return [];
    const sorted = [...wishlist].sort((a, b) => {
      const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (p !== 0) return p;
      return a.games.name.localeCompare(b.games.name);
    });
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(e => e.games.name.toLowerCase().includes(q));
  }, [wishlist, search]);

  if (!proLoading && !isPro) {
    return (
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <ScreenLogo />
          <Text style={styles.pageTitle}>Wishlist</Text>
        </View>
        <View style={styles.gateState}>
          <View style={styles.gateCard}>
            <LinearGradient
              colors={['#0d2525', '#0a1a35', '#06091e']}
              locations={[0, 0.60, 1]}
              start={{x: 1, y: 1}}
              end={{x: 0, y: 0}}
              style={styles.gateCardGradient}
            />
            <Star size={52} color="#FF1B8D" style={styles.gateIcon} />
            <Text style={styles.gateTitle}>Wishlist is a Pro feature</Text>
            <Text style={styles.gateSub}>
              Track games you want, set priority, and move them to your collection in one tap.
            </Text>
            <Pressable
              style={({pressed}) => [styles.gateBtn, pressed && styles.gateBtnPressed]}
              onPress={() => navigation.navigate('Paywall', {reason: 'wishlist'})}>
              <LinearGradient
                colors={['#FF1B8D', '#A855F7', '#5B45DC']}
                locations={[0, 0.65, 1]}
                start={{x: 0.3, y: 0}}
                end={{x: 0.4, y: 1}}
                style={styles.gateBtnGradient}
              />
              <Text style={styles.gateBtnText}>Upgrade to Pro →</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <GameListSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load wishlist.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <ScreenLogo />
        <Text style={styles.pageTitle}>Wishlist</Text>
      </View>
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Search size={16} color={searchFocused ? '#6366f1' : '#94a3b8'} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search games…"
            placeholderTextColor="#475569"
            autoCorrect={false}
            clearButtonMode="while-editing"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </View>
      </View>
      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
        renderItem={({item}) => (
          <GameRow
            entry={item}
            onPress={() =>
              navigation.navigate('GameDetail', {
                gameId: item.game_id,
                gameName: item.games.name,
                consoleId: item.console_id,
                consoleName: item.consoles.name,
              })
            }
          />
        )}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {search.trim() ? (
              <Text style={styles.emptyText}>No games match "{search.trim()}"</Text>
            ) : (
              <>
                <Text style={styles.emptyEmoji}>⭐</Text>
                <Text style={styles.emptyTitle}>Nothing on your list</Text>
                <Text style={styles.emptySubtitle}>
                  Browse a game and tap "Add to Wishlist" to save it for later.
                </Text>
              </>
            )}
          </View>
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={12}
        windowSize={8}
        initialNumToRender={20}
      />
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0A0A0F'},
  center: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  pageHeader: {
    paddingTop: 64,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  pageTitle: {
    fontSize: 21,
    lineHeight: 40,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#ffffff',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchBarFocused: {
    borderColor: '#6366f1',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#f1f5f9',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    overflow: 'hidden',
  },
  rowGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cover: {
    width: 56,
    height: 72,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  coverPlaceholderLogo: {
    width: 32,
    height: 32,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  gameName: {
    fontSize: 15,
    fontFamily: Fonts.display,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  regionBadge: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  regionText: {fontSize: 10, fontWeight: '700', color: '#94a3b8'},
  consoleBadge: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 140,
  },
  consoleText: {fontSize: 10, fontWeight: '700', color: '#94a3b8'},
  priorityBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {fontSize: 10, fontWeight: '800'},
  separator: {height: 12},
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 48,
  },
  emptyEmoji: {fontSize: 52, marginBottom: 16},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 8},
  emptySubtitle: {fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21},
  emptyText: {fontSize: 14, color: '#64748b', textAlign: 'center'},
  errorText: {color: '#fca5a5', fontSize: 15},
  retryBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {color: '#fff', fontWeight: '600'},
  gateState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  gateCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  gateCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gateIcon: {marginBottom: 16},
  gateTitle: {
    fontSize: 18,
    fontFamily: Fonts.display,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  gateSub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  gateBtn: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gateBtnGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gateBtnPressed: {
    opacity: 0.85,
  },
  gateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
