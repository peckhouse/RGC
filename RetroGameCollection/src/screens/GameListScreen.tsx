import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {useGamesByConsole, igdbImageUrl} from '../api/games';
import {useMyCollection} from '../api/collection';
import ProgressBar from '../components/common/ProgressBar';
import {GameListSkeleton} from '../components/common/Skeleton';
import type {ConsolesStackParamList} from '../navigation/AppNavigator';
import type {Game} from '../types/database';
import AdBanner from '../components/common/AdBanner';

type Props = NativeStackScreenProps<ConsolesStackParamList, 'GameList'>;
type Nav = NativeStackNavigationProp<ConsolesStackParamList>;

type RegionTab = 'EU' | 'NA' | 'JP';

const GameRow = React.memo(function GameRow({
  item,
  owned,
  onPress,
}: {
  item: Game;
  owned: boolean;
  onPress: () => void;
}) {
  const cover = igdbImageUrl(item.cover_url);
  const year = item.release_date ? item.release_date.substring(0, 4) : null;
  const rating = item.rating ? item.rating.toFixed(1) : null;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View>
        {cover ? (
          <Image source={{uri: cover}} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderText}>🎮</Text>
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
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
});

export default function GameListScreen({route}: Props) {
  const {consoleId, consoleName} = route.params;
  const navigation = useNavigation<Nav>();
  const {data: games, isLoading, isError, refetch, isRefetching} = useGamesByConsole(consoleId);
  const {data: collection} = useMyCollection();
  const [search, setSearch] = useState('');
  const [regionTab, setRegionTab] = useState<RegionTab>('EU');

  const ownedGameIds = useMemo(() => {
    if (!collection) return new Set<number>();
    return new Set(
      collection
        .filter(e => e.console_id === consoleId)
        .map(e => e.game_id),
    );
  }, [collection, consoleId]);

  // Pre-split by region once on load — tab switch is now an O(1) lookup
  const gamesByRegion = useMemo(() => {
    const map: Record<RegionTab, Game[]> = {EU: [], NA: [], JP: []};
    games?.forEach(g => {
      const r = g.region as RegionTab;
      if (map[r]) map[r].push(g);
    });
    return map;
  }, [games]);

  const regionGames = gamesByRegion[regionTab];

  const filtered = useMemo(() => {
    if (!search.trim()) return regionGames;
    const q = search.toLowerCase();
    return regionGames.filter(g => g.name.toLowerCase().includes(q));
  }, [regionGames, search]);

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
        <Text style={styles.errorText}>Failed to load games.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ownedCount = regionGames.filter(g => ownedGameIds.has(g.id)).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {consoleName}
            </Text>
            <Text style={styles.subtitle}>
              {filtered.length} games in library
            </Text>
          </View>
          <ProgressBar owned={ownedCount} total={regionGames.length} size={72} />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search games…"
          placeholderTextColor="#64748b"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Region tabs */}
      <View style={styles.tabBar}>
        {(['EU', 'NA', 'JP'] as RegionTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, regionTab === tab && styles.tabActive]}
            onPress={() => setRegionTab(tab)}
            activeOpacity={0.7}>
            <Text style={[styles.tabText, regionTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {search
              ? `No games match "${search}"`
              : 'No games found for this console.'}
          </Text>
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
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  center: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#f1f5f9',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    gap: 12,
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
  },
  coverPlaceholderText: {
    fontSize: 22,
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
    fontWeight: '600',
    color: '#f1f5f9',
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
  chevron: {
    fontSize: 22,
    color: '#334155',
  },
  separator: {
    height: 1,
    backgroundColor: '#1e293b',
    marginLeft: 68,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },
});
