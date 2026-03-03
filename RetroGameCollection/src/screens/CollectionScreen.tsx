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
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useMyCollection} from '../api/collection';
import {igdbImageUrl} from '../api/games';
import {ConsoleListSkeleton} from '../components/common/Skeleton';
import type {CollectionStackParamList} from '../navigation/AppNavigator';
import type {CollectionEntryWithDetails} from '../api/collection';
import AdBanner from '../components/common/AdBanner';

type Nav = NativeStackNavigationProp<CollectionStackParamList>;

type ConsoleGroup = {
  consoleId: number;
  consoleName: string;
  entries: CollectionEntryWithDetails[];
};

function ConsoleCard({group, onPress}: {group: ConsoleGroup; onPress: () => void}) {
  const previews = group.entries.slice(0, 4);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.consoleName} numberOfLines={1}>
            {group.consoleName}
          </Text>
          <Text style={styles.gameCount}>
            {group.entries.length} game{group.entries.length !== 1 ? 's' : ''} owned
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.coverStrip}>
        {previews.map(entry => {
          const uri = igdbImageUrl(entry.games.cover_url);
          return uri ? (
            <Image
              key={entry.id}
              source={{uri}}
              style={styles.coverThumb}
              resizeMode="cover"
            />
          ) : (
            <View key={entry.id} style={[styles.coverThumb, styles.coverPlaceholder]}>
              <Text style={styles.coverPlaceholderText}>🎮</Text>
            </View>
          );
        })}
        {group.entries.length > 4 && (
          <View style={[styles.coverThumb, styles.coverMore]}>
            <Text style={styles.coverMoreText}>+{group.entries.length - 4}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function CollectionScreen() {
  const navigation = useNavigation<Nav>();
  const {data: collection, isLoading, isError, refetch, isRefetching} = useMyCollection();

  const groups = useMemo((): ConsoleGroup[] => {
    if (!collection) return [];
    const map = new Map<number, ConsoleGroup>();
    for (const entry of collection) {
      const cid = entry.console_id;
      if (!map.has(cid)) {
        map.set(cid, {consoleId: cid, consoleName: entry.consoles.name, entries: []});
      }
      map.get(cid)!.entries.push(entry);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.consoleName.localeCompare(b.consoleName),
    );
  }, [collection]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ConsoleListSkeleton accentColor="#6366f1" />
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

  if (groups.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Collection</Text>
          <Text style={styles.subtitle}>0 games owned</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptySubtitle}>
            Browse a console and tap a game to add it to your collection.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={g => String(g.consoleId)}
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
            <Text style={styles.title}>My Collection</Text>
          </View>
        }
        renderItem={({item}) => (
          <ConsoleCard
            group={item}
            onPress={() =>
              navigation.navigate('CollectionConsole', {
                consoleId: item.consoleId,
                consoleName: item.consoleName,
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingHorizontal: 0,
    paddingTop: 64,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  consoleName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  gameCount: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: '#334155',
  },
  coverStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  coverThumb: {
    width: 52,
    height: 68,
    borderRadius: 5,
    backgroundColor: '#0f172a',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    fontSize: 18,
  },
  coverMore: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  coverMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: -60,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 21,
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
});
