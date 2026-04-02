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
import {ConsoleListSkeleton} from '../components/common/Skeleton';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useMyWishlist} from '../api/wishlist';
import {igdbImageUrl} from '../api/games';
import type {WishlistStackParamList, RootStackParamList} from '../navigation/AppNavigator';
import type {WishlistEntryWithDetails} from '../api/wishlist';
import {useProStatus} from '../hooks/useProStatus';
import ScreenLogo from '../components/common/ScreenLogo';

type Nav = NativeStackNavigationProp<WishlistStackParamList & RootStackParamList>;

type ConsoleGroup = {
  consoleId: number;
  consoleName: string;
  entries: WishlistEntryWithDetails[];
};

const PRIORITY_COLOR: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#64748b',
};

function ConsoleCard({group, onPress}: {group: ConsoleGroup; onPress: () => void}) {
  const previews = group.entries.slice(0, 4);
  const highCount = group.entries.filter(e => e.priority === 'high').length;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.consoleName} numberOfLines={1}>
            {group.consoleName}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={styles.gameCount}>
              {group.entries.length} game{group.entries.length !== 1 ? 's' : ''} wanted
            </Text>
            {highCount > 0 && (
              <View style={styles.highBadge}>
                <Text style={styles.highBadgeText}>{highCount} high priority</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.coverStrip}>
        {previews.map(entry => {
          const uri = igdbImageUrl(entry.games.cover_url);
          return (
            <View key={entry.id} style={styles.coverWrapper}>
              {uri ? (
                <Image source={{uri}} style={styles.coverThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.coverThumb, styles.coverPlaceholder]}>
                  <Text style={styles.coverPlaceholderText}>🎮</Text>
                </View>
              )}
              <View
                style={[
                  styles.priorityDot,
                  {backgroundColor: PRIORITY_COLOR[entry.priority]},
                ]}
              />
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

export default function WishlistScreen() {
  const navigation = useNavigation<Nav>();
  const {isPro, isLoading: proLoading} = useProStatus();
  const {data: wishlist, isLoading, isRefetching, isError, refetch} = useMyWishlist();

  const groups = useMemo((): ConsoleGroup[] => {
    if (!wishlist) return [];
    const map = new Map<number, ConsoleGroup>();
    for (const entry of wishlist) {
      const cid = entry.console_id;
      if (!map.has(cid)) {
        map.set(cid, {consoleId: cid, consoleName: entry.consoles.name, entries: []});
      }
      map.get(cid)!.entries.push(entry);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.consoleName.localeCompare(b.consoleName),
    );
  }, [wishlist]);

  if (!proLoading && !isPro) {
    return (
      <View style={styles.container}>
        <View style={styles.gateState}>
          <Text style={styles.gateEmoji}>⭐</Text>
          <Text style={styles.gateTitle}>Wishlist is a Pro feature</Text>
          <Text style={styles.gateSub}>
            Track games you want, set priority, and move them to your collection in one tap.
          </Text>
          <TouchableOpacity
            style={styles.gateBtn}
            onPress={() => navigation.navigate('Paywall', {reason: 'wishlist'})}
            activeOpacity={0.8}>
            <Text style={styles.gateBtnText}>Upgrade to Pro →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ConsoleListSkeleton accentColor="#f59e0b" />
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

  if (groups.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.title}>Wishlist</Text>
          <Text style={styles.subtitle}>0 games wanted</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⭐</Text>
          <Text style={styles.emptyTitle}>Nothing on your list</Text>
          <Text style={styles.emptySubtitle}>
            Browse a game and tap "Add to Wishlist" to save it for later.
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
          <View style={styles.pageHeader}>
            <ScreenLogo />
            <Text style={styles.title}>Wishlist</Text>
          </View>
        }
        renderItem={({item}) => (
          <ConsoleCard
            group={item}
            onPress={() =>
              navigation.navigate('WishlistConsole', {
                consoleId: item.consoleId,
                consoleName: item.consoleName,
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  pageHeader: {
    paddingHorizontal: 0,
    paddingTop: 64,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {fontSize: 28, fontWeight: '800', color: '#f1f5f9'},
  subtitle: {fontSize: 13, color: '#64748b', marginTop: 4},
  listContent: {paddingHorizontal: 16, paddingBottom: 40},
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  cardTop: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  cardInfo: {flex: 1},
  consoleName: {fontSize: 17, fontWeight: '700', color: '#f1f5f9'},
  cardMeta: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4},
  gameCount: {fontSize: 12, color: '#f59e0b', fontWeight: '600'},
  highBadge: {
    backgroundColor: '#7f1d1d',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  highBadgeText: {fontSize: 10, color: '#fca5a5', fontWeight: '700'},
  chevron: {fontSize: 22, color: '#334155'},
  coverStrip: {flexDirection: 'row', gap: 8},
  coverWrapper: {position: 'relative'},
  coverThumb: {
    width: 52,
    height: 68,
    borderRadius: 5,
    backgroundColor: '#0A0A0F',
  },
  coverPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  coverPlaceholderText: {fontSize: 18},
  coverMore: {alignItems: 'center', justifyContent: 'center'},
  coverMoreText: {fontSize: 13, fontWeight: '700', color: '#64748b'},
  priorityDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0f172a',
  },
  separator: {height: 12},
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: -60,
  },
  emptyEmoji: {fontSize: 52, marginBottom: 16},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 8},
  emptySubtitle: {fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21},
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
    paddingHorizontal: 40,
  },
  gateEmoji: {fontSize: 52, marginBottom: 16},
  gateTitle: {fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 8, textAlign: 'center'},
  gateSub: {fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21, marginBottom: 24},
  gateBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
  },
  gateBtnText: {color: '#fff', fontWeight: '700', fontSize: 15},
});
