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
import {
  useMyWishlist,
  useRemoveFromWishlist,
  useMoveToCollection,
} from '../api/wishlist';
import {igdbImageUrl} from '../api/games';
import type {WishlistStackParamList} from '../navigation/AppNavigator';
import type {WishlistEntryWithDetails} from '../api/wishlist';

type Nav = NativeStackNavigationProp<WishlistStackParamList>;
type RouteProps = NativeStackScreenProps<WishlistStackParamList, 'WishlistConsole'>['route'];

function GameRow({
  entry,
  onPress,
  onMoveToCollection,
  onRemove,
  isMutating,
}: {
  entry: WishlistEntryWithDetails;
  onPress: () => void;
  onMoveToCollection: () => void;
  onRemove: () => void;
  isMutating: boolean;
}) {
  const cover = igdbImageUrl(entry.games.cover_url);
  const year = entry.games.release_date
    ? entry.games.release_date.substring(0, 4)
    : null;

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} onPress={onPress} activeOpacity={0.75}>
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
          </View>
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.gotItBtn}
          onPress={onMoveToCollection}
          disabled={isMutating}
          activeOpacity={0.8}>
          <Text style={styles.gotItText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={onRemove}
          disabled={isMutating}
          activeOpacity={0.8}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function WishlistConsoleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const {consoleId, consoleName} = route.params;

  const {data: wishlist, isLoading, isRefetching, isError, refetch} = useMyWishlist();
  const removeMutation = useRemoveFromWishlist();
  const moveMutation = useMoveToCollection();

  const isMutating =
    removeMutation.isPending ||
    moveMutation.isPending;

  const entries = useMemo(() => {
    if (!wishlist) return [];
    const PRIORITY_ORDER = {high: 0, medium: 1, low: 2};
    return wishlist
      .filter(e => e.console_id === consoleId)
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }, [wishlist, consoleId]);

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
            <Text style={styles.title}>{consoleName}</Text>
            <Text style={styles.subtitle}>
              {entries.length} game{entries.length !== 1 ? 's' : ''} on wishlist
            </Text>
            <Text style={styles.hint}>Tap ✓ to move to collection · ✕ to remove</Text>
          </View>
        }
        renderItem={({item}) => (
          <GameRow
            entry={item}
            isMutating={isMutating}
            onPress={() =>
              navigation.navigate('GameDetail', {
                gameId: item.game_id,
                gameName: item.games.name,
                consoleId: item.console_id,
                consoleName,
              })
            }
            onMoveToCollection={() =>
              moveMutation.mutate({
                entryId: item.id,
                gameId: item.game_id,
                consoleId: item.console_id,
              })
            }
            onRemove={() => removeMutation.mutate(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No games on wishlist for this console.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0f172a'},
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
    paddingBottom: 12,
  },
  title: {fontSize: 24, fontWeight: '800', color: '#f1f5f9'},
  subtitle: {fontSize: 13, color: '#64748b', marginTop: 2},
  hint: {fontSize: 11, color: '#475569', marginTop: 6},
  listContent: {paddingBottom: 40},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
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
  gameName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    lineHeight: 20,
  },
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4},
  metaText: {fontSize: 12, color: '#64748b'},
  regionBadge: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  regionText: {fontSize: 10, fontWeight: '700', color: '#94a3b8'},
  actions: {flexDirection: 'row', gap: 6, marginLeft: 8},
  gotItBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gotItText: {fontSize: 14, color: '#4ade80', fontWeight: '700'},
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {fontSize: 12, color: '#64748b', fontWeight: '700'},
  separator: {height: 1, backgroundColor: '#1e293b', marginLeft: 76},
  emptyState: {paddingTop: 48, alignItems: 'center'},
  emptyText: {fontSize: 14, color: '#64748b'},
  errorText: {color: '#fca5a5', fontSize: 15},
  retryBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {color: '#fff', fontWeight: '600'},
});
