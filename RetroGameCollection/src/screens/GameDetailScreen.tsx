import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackScreenProps, NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useGame, igdbImageUrl} from '../api/games';
import {
  useMyCollection,
  useAddToCollection,
  useRemoveFromCollection,
} from '../api/collection';
import {
  useMyWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from '../api/wishlist';
import type {GameDetailParams, RootStackParamList} from '../navigation/AppNavigator';
import {useProStatus} from '../hooks/useProStatus';
import type {UserCollection} from '../types/database';

type Props = NativeStackScreenProps<{GameDetail: GameDetailParams}, 'GameDetail'>;

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

type Condition = NonNullable<UserCollection['condition']>;

const CONDITIONS: Condition[] = ['loose', 'inbox', 'complete'];
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

export default function GameDetailScreen({route}: Props) {
  const {gameId, consoleId, consoleName} = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {isPro} = useProStatus();

  const [selectedCondition, setSelectedCondition] = useState<Condition>('loose');

  const {data: game, isLoading, isError} = useGame(gameId);
  const {data: collection} = useMyCollection();
  const {data: wishlist} = useMyWishlist();

  const addToCollection = useAddToCollection();
  const removeFromCollection = useRemoveFromCollection();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const ownedConsoleIds = useMemo(
    () => new Set((collection ?? []).map(e => e.console_id)),
    [collection],
  );

  const ownedEntries = (collection ?? []).filter(
    e => e.game_id === gameId && e.console_id === consoleId,
  );
  const isOwned = ownedEntries.length > 0;

  const wishlistEntry = wishlist?.find(
    e => e.game_id === gameId && e.console_id === consoleId,
  );
  const isWishlisted = !!wishlistEntry;

  const isCollectionMutating =
    addToCollection.isPending || removeFromCollection.isPending;
  const isWishlistMutating =
    addToWishlist.isPending || removeFromWishlist.isPending;

  function handleAddCopy() {
    const isNewConsole = !ownedConsoleIds.has(consoleId);
    if (!isPro && isNewConsole && ownedConsoleIds.size >= 5) {
      navigation.navigate('Paywall', {reason: 'console-limit'});
      return;
    }
    addToCollection.mutate({gameId, consoleId, condition: selectedCondition});
    // Auto-remove from wishlist only when adding a complete copy
    if (selectedCondition === 'complete' && isWishlisted && wishlistEntry) {
      removeFromWishlist.mutate(wishlistEntry.id);
    }
  }

  function handleToggleWishlist() {
    if (isWishlisted && wishlistEntry) {
      removeFromWishlist.mutate(wishlistEntry.id);
    } else {
      addToWishlist.mutate({gameId, consoleId, priority: 'medium'});
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (isError || !game) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load game.</Text>
      </View>
    );
  }

  const cover = igdbImageUrl(game.cover_url);
  const year = game.release_date ? game.release_date.substring(0, 4) : null;
  const rating = game.rating ? game.rating.toFixed(1) : null;
  const screenshots = game.screenshots
    .map(s => igdbImageUrl(s, 't_screenshot_big'))
    .filter((s): s is string => s !== null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cover + title */}
      <View style={styles.hero}>
        {cover ? (
          <Image source={{uri: cover}} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderEmoji}>🎮</Text>
          </View>
        )}
        <View style={styles.heroInfo}>
          <Text style={styles.title}>{game.name}</Text>
          <Text style={styles.consoleName}>{consoleName}</Text>
          <View style={styles.metaRow}>
            {year ? <Text style={styles.metaText}>{year}</Text> : null}
            {rating ? (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>★ {rating}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Collection section */}
      <View style={styles.collectionSection}>
        <Text style={styles.sectionLabel}>My Copies</Text>

        {/* Owned copies list */}
        {ownedEntries.length > 0 && (
          <View style={styles.copiesRow}>
            {ownedEntries.map(entry => {
              const cond = (entry.condition ?? 'loose') as Condition;
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.copyChip,
                    {borderColor: CONDITION_COLORS[cond]},
                  ]}>
                  <View
                    style={[
                      styles.copyChipDot,
                      {backgroundColor: CONDITION_COLORS[cond]},
                    ]}
                  />
                  <Text style={[styles.copyChipLabel, {color: CONDITION_COLORS[cond]}]}>
                    {CONDITION_LABELS[cond]}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFromCollection.mutate(entry.id)}
                    disabled={isCollectionMutating}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Text style={styles.copyChipRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Condition picker + Add button */}
        <View style={styles.addRow}>
          <View style={styles.conditionPicker}>
            {CONDITIONS.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.conditionChip,
                  selectedCondition === c && styles.conditionChipActive,
                  selectedCondition === c && {borderColor: CONDITION_COLORS[c]},
                ]}
                onPress={() => setSelectedCondition(c)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.conditionChipText,
                    selectedCondition === c && {color: CONDITION_COLORS[c]},
                  ]}>
                  {CONDITION_LABELS[c]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.addCopyBtn}
            onPress={handleAddCopy}
            disabled={isCollectionMutating}
            activeOpacity={0.8}>
            {isCollectionMutating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.addCopyBtnText}>
                {isOwned ? '+ Copy' : '+ Add'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Wishlist button */}
      <View style={styles.wishlistRow}>
        <TouchableOpacity
          style={[
            styles.wishlistBtn,
            isWishlisted && styles.wishlistBtnActive,
          ]}
          onPress={handleToggleWishlist}
          disabled={isWishlistMutating}
          activeOpacity={0.8}>
          {isWishlistMutating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>
              {isWishlisted ? '★ Wishlisted' : '☆ Wishlist'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Genres */}
      {game.genres.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Genres</Text>
          <View style={styles.tagRow}>
            {game.genres.map(g => (
              <View key={g} style={styles.tag}>
                <Text style={styles.tagText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Summary */}
      {game.summary ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Summary</Text>
          <Text style={styles.summary}>{game.summary}</Text>
        </View>
      ) : null}

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Details</Text>
        <View style={styles.detailsCard}>
          {game.developer ? (
            <DetailRow label="Developer" value={game.developer} />
          ) : null}
          {game.publisher ? (
            <DetailRow label="Publisher" value={game.publisher} />
          ) : null}
          {year ? <DetailRow label="Release Year" value={year} /> : null}
          {game.max_players ? (
            <DetailRow label="Max Players" value={String(game.max_players)} />
          ) : null}
          {game.rating_count > 0 ? (
            <DetailRow
              label="Ratings"
              value={game.rating_count.toLocaleString()}
            />
          ) : null}
        </View>
      </View>

      {/* Region */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Region</Text>
        <View style={styles.tagRow}>
          <View style={styles.regionTag}>
            <Text style={styles.regionTagText}>{game.region}</Text>
          </View>
        </View>
      </View>

      {/* Market Value — Pro only */}
      {isPro && (game.price_loose || game.price_complete || game.price_new || game.price_box_only) ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Market Value</Text>
          <View style={styles.detailsCard}>
            {game.price_loose ? (
              <DetailRow label="Loose" value={formatCents(game.price_loose)} />
            ) : null}
            {game.price_complete ? (
              <DetailRow label="Complete" value={formatCents(game.price_complete)} />
            ) : null}
            {game.price_box_only ? (
              <DetailRow label="Box Only" value={formatCents(game.price_box_only)} />
            ) : null}
            {game.price_new ? (
              <DetailRow label="New / Sealed" value={formatCents(game.price_new)} />
            ) : null}
          </View>
          <Text style={styles.priceSource}>via eBay listings</Text>
        </View>
      ) : null}

      {/* Screenshots */}
      {screenshots.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Screenshots</Text>
          <FlatList
            data={screenshots}
            keyExtractor={(_, i) => String(i)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.screenshotList}
            ItemSeparatorComponent={() => <View style={{width: 10}} />}
            renderItem={({item}) => (
              <Image
                source={{uri: item}}
                style={styles.screenshot}
                resizeMode="cover"
              />
            )}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0A0A0F'},
  content: {paddingBottom: 48},
  center: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
    alignItems: 'flex-start',
  },
  cover: {
    width: 100,
    height: 130,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  coverPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  coverPlaceholderEmoji: {fontSize: 36},
  heroInfo: {flex: 1, paddingTop: 4},
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f1f5f9',
    lineHeight: 26,
  },
  consoleName: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  metaText: {fontSize: 13, color: '#64748b'},
  ratingBadge: {
    backgroundColor: '#1e293b',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingText: {fontSize: 12, color: '#fbbf24', fontWeight: '700'},
  // Collection section
  collectionSection: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
  },
  copiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  copyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0A0A0F',
  },
  copyChipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  copyChipLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  copyChipRemove: {
    fontSize: 11,
    color: '#475569',
    marginLeft: 2,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionPicker: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  conditionChip: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    alignItems: 'center',
  },
  conditionChipActive: {
    backgroundColor: '#0A0A0F',
  },
  conditionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  addCopyBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 72,
  },
  addCopyBtnText: {color: '#fff', fontSize: 13, fontWeight: '700'},
  // Wishlist
  wishlistRow: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  wishlistBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  wishlistBtnActive: {
    backgroundColor: '#78350f',
    borderColor: '#f59e0b',
  },
  btnText: {color: '#fff', fontSize: 14, fontWeight: '700'},
  // Sections
  section: {paddingHorizontal: 20, marginBottom: 24},
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  tagRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  tag: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {color: '#94a3b8', fontSize: 13},
  summary: {fontSize: 14, color: '#94a3b8', lineHeight: 22},
  detailsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  detailLabel: {fontSize: 13, color: '#64748b'},
  detailValue: {
    fontSize: 13,
    color: '#f1f5f9',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  // Screenshots
  screenshotList: {paddingVertical: 4},
  screenshot: {
    width: 240,
    height: 135,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  errorText: {color: '#fca5a5', fontSize: 15},
  regionTag: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  regionTagText: {color: '#94a3b8', fontSize: 13, fontWeight: '600'},
  priceSource: {
    fontSize: 10,
    color: '#334155',
    marginTop: 6,
    textAlign: 'right',
  },
});
