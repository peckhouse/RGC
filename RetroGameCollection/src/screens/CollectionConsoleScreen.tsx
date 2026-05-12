import React, {useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  StyleSheet,
  Animated,
} from 'react-native';
import {GameListSkeleton} from '../components/common/Skeleton';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {ChevronRight, Search} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useMyCollection} from '../api/collection';
import {igdbImageUrl, useGameCountForConsole} from '../api/games';
import ProgressBar from '../components/common/ProgressBar';
import {ScreenHeader} from '../navigation/AppNavigator';
import {CONSOLE_LOGO_MAP} from './ManufacturerScreen';
import {Fonts} from '../constants/fonts';
import type {CollectionStackParamList} from '../navigation/AppNavigator';
import type {CollectionEntryWithDetails} from '../api/collection';
import type {UserCollection} from '../types/database';

type Nav = NativeStackNavigationProp<CollectionStackParamList>;
type RouteProps = NativeStackScreenProps<CollectionStackParamList, 'CollectionConsole'>['route'];

type Condition = NonNullable<UserCollection['condition']>;

const CONDITION_LABELS: Record<Condition, string> = {
  loose: 'Loose',
  inbox: 'Inbox',
  complete: 'Complete',
};
const CONDITION_COLORS: Record<Condition, string> = {
  loose: '#64748b',
  inbox: '#3b82f6',
  complete: '#22c55e',
};

function Separator() {
  return <View style={styles.separator} />;
}

const GameRow = React.memo(function GameRow({
  entry,
  onPress,
}: {
  entry: CollectionEntryWithDetails;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const cover = igdbImageUrl(entry.games.cover_url);
  const cond = (entry.condition ?? 'loose') as Condition;

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
            <View
              style={[
                styles.conditionBadge,
                {
                  backgroundColor: CONDITION_COLORS[cond] + '22',
                  borderColor: CONDITION_COLORS[cond],
                },
              ]}>
              <Text style={[styles.conditionText, {color: CONDITION_COLORS[cond]}]}>
                {CONDITION_LABELS[cond]}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={22} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function CollectionConsoleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const {consoleId, consoleName} = route.params;

  const {data: collection, isLoading, isRefetching, isError, refetch} = useMyCollection();
  const {data: totalGames = 0} = useGameCountForConsole(consoleId);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const allEntries = useMemo(() => {
    if (!collection) return [];
    return collection
      .filter(e => e.console_id === consoleId)
      .sort((a, b) => a.games.name.localeCompare(b.games.name));
  }, [collection, consoleId]);

  const entries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allEntries;
    return allEntries.filter(e => e.games.name.toLowerCase().includes(q));
  }, [allEntries, search]);

  const uniqueGamesOwned = useMemo(
    () => new Set(allEntries.map(e => e.games.igdb_id)).size,
    [allEntries],
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
        <Text style={styles.errorText}>Failed to load collection.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLogoArea}>
            {CONSOLE_LOGO_MAP[consoleName] ? (
              <Image
                source={CONSOLE_LOGO_MAP[consoleName]}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            ) : null}
          </View>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {consoleName}
          </Text>
          <ProgressBar owned={uniqueGamesOwned} total={totalGames} size={72} />
        </View>
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
                consoleName,
                collectionEntryId: item.id,
              })
            }
          />
        )}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {search.trim()
                ? `No games match "${search.trim()}"`
                : 'No games in collection for this console.'}
            </Text>
          </View>
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={12}
        windowSize={8}
        initialNumToRender={20}
      />
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
    paddingTop: 8,
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
  regionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  conditionBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '800',
  },
  separator: {height: 12},
  emptyState: {paddingTop: 48, alignItems: 'center'},
  emptyText: {fontSize: 14, color: '#64748b', textAlign: 'center'},
  errorText: {color: '#fca5a5', fontSize: 15},
  retryBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {color: '#fff', fontWeight: '600'},
});
