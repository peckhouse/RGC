import React, {useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {GameListSkeleton} from '../components/common/Skeleton';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMyCollection} from '../api/collection';
import {igdbImageUrl, useGameCountByConsole} from '../api/games';
import ProgressBar from '../components/common/ProgressBar';
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

function GameRow({
  entry,
  onPress,
}: {
  entry: CollectionEntryWithDetails;
  onPress: () => void;
}) {
  const cover = igdbImageUrl(entry.games.cover_url);
  const year = entry.games.release_date
    ? entry.games.release_date.substring(0, 4)
    : null;
  const cond = (entry.condition ?? 'loose') as Condition;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {cover ? (
        <Image source={{uri: cover}} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.coverPlaceholderText}>🎮</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.gameName} numberOfLines={2}>
          {entry.games.name}
        </Text>
        <View style={styles.metaRow}>
          {year ? <Text style={styles.metaText}>{year}</Text> : null}
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
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function CollectionConsoleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const {consoleId, consoleName} = route.params;

  const {data: collection, isLoading, isRefetching, isError, refetch} = useMyCollection();
  const {data: totalGames = 0} = useGameCountByConsole(consoleId);

  const entries = useMemo(() => {
    if (!collection) return [];
    return collection
      .filter(e => e.console_id === consoleId)
      .sort((a, b) => a.games.name.localeCompare(b.games.name));
  }, [collection, consoleId]);

  // Unique games owned (for progress — multiple copies + multiple regions count as 1)
  const uniqueGamesOwned = useMemo(
    () => new Set(entries.map(e => e.games.igdb_id)).size,
    [entries],
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
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{consoleName}</Text>
                <Text style={styles.subtitle}>
                  {uniqueGamesOwned} game{uniqueGamesOwned !== 1 ? 's' : ''} owned
                  {entries.length > uniqueGamesOwned
                    ? ` · ${entries.length} copies total`
                    : ''}
                </Text>
              </View>
              <ProgressBar owned={uniqueGamesOwned} total={totalGames} size={72} />
            </View>
          </View>
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
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No games in collection for this console.</Text>
          </View>
        }
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
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {flex: 1, paddingRight: 12},
  title: {fontSize: 24, fontWeight: '800', color: '#f1f5f9'},
  subtitle: {fontSize: 13, color: '#64748b', marginTop: 2},
  listContent: {paddingBottom: 40},
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  cover: {
    width: 48,
    height: 62,
    borderRadius: 5,
    backgroundColor: '#1e293b',
  },
  coverPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  coverPlaceholderText: {fontSize: 20},
  info: {flex: 1},
  gameName: {fontSize: 14, fontWeight: '600', color: '#f1f5f9', lineHeight: 20},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3},
  metaText: {fontSize: 12, color: '#64748b'},
  conditionBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  conditionText: {fontSize: 10, fontWeight: '800'},
  regionBadge: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  regionText: {fontSize: 10, fontWeight: '700', color: '#94a3b8'},
  chevron: {fontSize: 20, color: '#334155'},
  separator: {height: 1, backgroundColor: '#1e293b', marginLeft: 76},
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
