import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  InteractionManager,
  RefreshControl,
  StyleSheet,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {Search, ChevronRight} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useGamesByConsole, useGameStatsForConsoleRegion, igdbImageUrl} from '../api/games';
import {useMyCollection} from '../api/collection';
import ProgressBar from '../components/common/ProgressBar';
import {GameCardsSkeleton} from '../components/common/Skeleton';
import {CONSOLE_LOGO_MAP} from './ManufacturerScreen';
import type {ConsolesStackParamList} from '../navigation/AppNavigator';
import type {Game} from '../types/database';
import AdBanner from '../components/common/AdBanner';
import {Fonts} from '../constants/fonts';

type Props = NativeStackScreenProps<ConsolesStackParamList, 'GameList'>;
type Nav = NativeStackNavigationProp<ConsolesStackParamList>;

type RegionTab = 'EU' | 'NA' | 'JP';

function Separator() {
  return <View style={styles.separator} />;
}

const GameRow = React.memo(function GameRow({
  item,
  owned,
  onPress,
}: {
  item: Game;
  owned: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const cover = igdbImageUrl(item.cover_url);
  const year = item.release_date ? item.release_date.substring(0, 4) : null;
  const rating = item.rating ? item.rating.toFixed(1) : null;

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
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut}>
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
            <Image source={require('../../assets/rgc-logo.png')} style={styles.coverPlaceholderLogo} resizeMode="contain" />
          </View>
        )}
        {owned ? (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedBadgeText}>✓</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.gameName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          {year ? <Text style={styles.metaText}>{year}</Text> : null}
          {rating ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ {rating}</Text>
            </View>
          ) : null}
          {owned ? <Text style={styles.ownedText}>In collection</Text> : null}
        </View>
        {item.genres.length > 0 ? (
          <Text style={styles.genres} numberOfLines={1}>
            {item.genres.slice(0, 3).join(', ')}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={22} color="#ffffff" />
    </TouchableOpacity>
    </Animated.View>
  );
});

export default function GameListScreen({route}: Props) {
  const {consoleId, consoleName} = route.params;
  const navigation = useNavigation<Nav>();
  const {data: collection} = useMyCollection();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [regionTab, setRegionTab] = useState<RegionTab>('EU');
  const [listReady, setListReady] = useState(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input — 400ms delay before triggering a new query
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  const {
    data,
    isFetching,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGamesByConsole(consoleId, regionTab, debouncedSearch);

  const {data: stats} = useGameStatsForConsoleRegion(consoleId, regionTab);
  const totalGames = stats?.total ?? 0;
  const ownedCount = stats?.owned ?? 0;

  // Brief skeleton on region/search switch to unblock the UI before heavy FlatList render
  const handleRegionSwitch = useCallback((tab: RegionTab) => {
    setListReady(false);
    setRegionTab(tab);
    InteractionManager.runAfterInteractions(() => setListReady(true));
  }, []);

  useEffect(() => {
    setListReady(false);
    InteractionManager.runAfterInteractions(() => setListReady(true));
  }, [debouncedSearch]);

  const showSkeleton = !listReady || (isFetching && !isFetchingNextPage);

  const games = useMemo(
    () => data?.pages.flatMap(p => p) ?? [],
    [data],
  );

  const ownedGameIds = useMemo(() => {
    if (!collection) return new Set<number>();
    return new Set(
      collection
        .filter(e => e.console_id === consoleId)
        .map(e => e.game_id),
    );
  }, [collection, consoleId]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({item}: {item: Game}) => (
      <GameRow
        item={item}
        owned={ownedGameIds.has(item.id)}
        onPress={() =>
          navigation.navigate('GameDetail', {
            gameId: item.id,
            gameName: item.name,
            consoleId,
            consoleName,
          })
        }
      />
    ),
    [ownedGameIds, navigation, consoleId, consoleName],
  );


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLogoArea}>
            {CONSOLE_LOGO_MAP[consoleName] ? (
              <Image source={CONSOLE_LOGO_MAP[consoleName]} style={styles.headerLogo} resizeMode="contain" />
            ) : null}
          </View>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {consoleName}
          </Text>
          {showSkeleton ? (
            <View style={{width: 72, height: 72, borderRadius: 36, backgroundColor: '#1e293b'}} />
          ) : (
            <ProgressBar owned={ownedCount} total={totalGames} size={72} />
          )}
        </View>
      </View>

      {/* Region tabs */}
      <View style={styles.tabBar}>
        {(['EU', 'NA', 'JP'] as RegionTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => handleRegionSwitch(tab)}
            activeOpacity={0.7}>
            <Text style={[styles.tabText, regionTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
            {regionTab === tab && (
              <LinearGradient
                colors={['#FF1B8D', '#A855F7', '#5B45DC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.tabIndicator}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
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

      {/* List */}
      {showSkeleton ? (
        <GameCardsSkeleton />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load games.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#6366f1"
              colors={['#6366f1']}
            />
          }
          ItemSeparatorComponent={Separator}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {search
                ? `No games match "${search}"`
                : 'No games found for this console.'}
            </Text>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <Text style={styles.loadingMore}>Loading more…</Text>
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          maxToRenderPerBatch={12}
          windowSize={8}
          initialNumToRender={20}
        />
      )}
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  center: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoArea: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#ffffff',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  ownedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  ownedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
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
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  ratingBadge: {
    backgroundColor: '#1e293b',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '600',
  },
  ownedText: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
  },
  genres: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  separator: {
    height: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  loadingMore: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 15,
  },
  retryBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#0a1a35',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '60%',
    borderRadius: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#475569',
  },
  tabTextActive: {
    color: '#ffffff',
  },
});
