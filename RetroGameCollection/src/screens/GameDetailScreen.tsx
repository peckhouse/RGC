import React, {useState, useMemo, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Pressable,
  Animated,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackScreenProps, NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Star, X, Plus, Users, ChevronLeft} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useGame, igdbImageUrl} from '../api/games';
import {Fonts} from '../constants/fonts';
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
import {useFreeConsoleLimit} from '../hooks/useFreeConsoleLimit';
import type {UserCollection} from '../types/database';

type Props = NativeStackScreenProps<{GameDetail: GameDetailParams}, 'GameDetail'>;

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

type Condition = NonNullable<UserCollection['condition']>;

const CONDITIONS: Condition[] = ['loose', 'inbox', 'complete'];
const CONDITION_LABELS: Record<Condition, string> = {
  loose: 'Loose',
  inbox: 'Game + Box',
  complete: 'CIB',
};
const CONDITION_COLORS: Record<Condition, string> = {
  loose: '#64748b',
  inbox: '#3b82f6',
  complete: '#22c55e',
};


function AnimatedHeaderBtn({
  style,
  onPress,
  disabled,
  children,
}: {
  style?: any;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{transform: [{scale}]}}>
      <Pressable
        style={style}
        onPress={onPress}
        disabled={disabled}
        onPressIn={() =>
          Animated.spring(scale, {toValue: 0.82, useNativeDriver: true, speed: 50, bounciness: 0}).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8}).start()
        }>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function GameDetailScreen({route}: Props) {
  const {gameId, consoleId, collectionEntryId} = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {isPro} = useProStatus();
  const freeConsoleLimit = useFreeConsoleLimit();

  const [selectedCondition, setSelectedCondition] = useState<Condition>('loose');
  const [gameCondition, setGameCondition] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initializedFromCollection, setInitializedFromCollection] = useState(false);

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
  // Initialize condition + stars from the specific collection entry (if navigated from collection)
  // or from the first owned entry otherwise
  useEffect(() => {
    if (initializedFromCollection || ownedEntries.length === 0) return;
    const entry = collectionEntryId
      ? ownedEntries.find(e => e.id === collectionEntryId) ?? ownedEntries[0]
      : ownedEntries[0];
    if (entry.condition) setSelectedCondition(entry.condition as Condition);
    if (entry.game_condition) setGameCondition(entry.game_condition as 1|2|3|4|5);
    setInitializedFromCollection(true);
  }, [ownedEntries, initializedFromCollection, collectionEntryId]);

  const wishlistEntry = wishlist?.find(
    e => e.game_id === gameId && e.console_id === consoleId,
  );
  const isWishlisted = !!wishlistEntry;

  const isCollectionMutating =
    addToCollection.isPending || removeFromCollection.isPending;

  const handleToggleWishlist = useCallback(() => {
    if (isWishlisted && wishlistEntry) {
      removeFromWishlist.mutate(wishlistEntry.id);
      return;
    }
    if (!isPro) {
      navigation.navigate('Paywall', {reason: 'wishlist', plans: 'subscriptions-only'});
      return;
    }
    addToWishlist.mutate({gameId, consoleId, priority: 'medium'});
  }, [isWishlisted, wishlistEntry, removeFromWishlist, addToWishlist, gameId, consoleId, isPro, navigation]);

  const handleOpenAddModal = useCallback(() => setShowAddModal(true), []);

  function handleAddCopy() {
    const isNewConsole = !ownedConsoleIds.has(consoleId);
    if (!isPro && isNewConsole && ownedConsoleIds.size >= freeConsoleLimit) {
      setShowAddModal(false);
      navigation.navigate('Paywall', {reason: 'console-limit'});
      return;
    }
    addToCollection.mutate({gameId, consoleId, condition: selectedCondition, game_condition: gameCondition});
    setShowAddModal(false);
    setSelectedCondition('loose');
    setGameCondition(3);
    if (selectedCondition === 'complete' && isWishlisted && wishlistEntry) {
      removeFromWishlist.mutate(wishlistEntry.id);
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
    <View style={styles.container}>
      {/* Custom header */}
      <View style={[styles.customHeader, {paddingTop: insets.top}]}>
        <AnimatedHeaderBtn
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color="#ffffff" />
        </AnimatedHeaderBtn>
        <View style={styles.headerSpacer} />
        <AnimatedHeaderBtn
          style={styles.headerBtn}
          onPress={handleOpenAddModal}>
          <Plus size={20} color="#3b82f6" />
        </AnimatedHeaderBtn>
        <AnimatedHeaderBtn
          style={[styles.headerBtn, isWishlisted && styles.headerBtnWishlisted]}
          onPress={handleToggleWishlist}>
          <Star
            size={20}
            color={isWishlisted ? '#FF1B8D' : '#3b82f6'}
            fill="transparent"
          />
        </AnimatedHeaderBtn>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
      {/* Cover — centered */}
      <View style={styles.heroCover}>
        {cover ? (
          <Image source={{uri: cover}} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderEmoji}>🎮</Text>
          </View>
        )}
      </View>

      {/* Title — centered */}
      <Text style={styles.title}>{game.name}</Text>

      {/* Region badge */}
      <View style={styles.badgeRow}>
        <View style={styles.regionBadge}>
          <Text style={styles.regionBadgeText}>
            {game.region} / {game.region === 'EU' ? 'PAL' : game.region === 'NA' ? 'NTSC' : 'NTSC-J'}
          </Text>
        </View>
      </View>

      {/* Meta line */}
      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          {year ? <Text style={styles.metaText}>{year}</Text> : null}
          {year && game.genres[0] ? <Text style={styles.metaDot}>·</Text> : null}
          {game.genres[0] ? <Text style={styles.metaText}>{game.genres[0]}</Text> : null}
          {(year || game.genres[0]) && rating ? <Text style={styles.metaDot}>·</Text> : null}
          {rating ? (
            <View style={styles.metaItem}>
              <Star size={12} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.metaText}>{rating}</Text>
            </View>
          ) : null}
          {game.max_players ? <Text style={styles.metaDot}>·</Text> : null}
          {game.max_players ? (
            <View style={styles.metaItem}>
              <Users size={12} color="#94a3b8" />
              <Text style={styles.metaText}>1-{game.max_players} Players</Text>
            </View>
          ) : null}
        </View>
      </View>



      {/* My Collection */}
      {ownedEntries.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            My Collection ({game.region} / {game.region === 'EU' ? 'PAL' : game.region === 'NA' ? 'NTSC' : 'NTSC-J'})
          </Text>
          <View style={styles.copiesList}>
            <LinearGradient
              colors={['#122a2a', '#0e2040', '#0a1530']}
              locations={[0, 0.60, 1]}
              start={{x: 1, y: 1}}
              end={{x: 0, y: 0}}
              style={styles.copiesGradient}
            />
            {ownedEntries.map(entry => {
              const cond = (entry.condition ?? 'loose') as Condition;
              const stars = entry.game_condition ?? 0;
              return (
                <View key={entry.id} style={styles.copyRow}>
                  <View style={[styles.copyConditionBadge, {borderColor: CONDITION_COLORS[cond], backgroundColor: CONDITION_COLORS[cond] + '22'}]}>
                    <Text style={[styles.copyConditionText, {color: CONDITION_COLORS[cond]}]}>
                      {CONDITION_LABELS[cond]}
                    </Text>
                  </View>
                  <Text style={styles.copyStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Text key={s} style={{color: s <= stars ? '#fbbf24' : '#334155'}}>★</Text>
                    ))}
                  </Text>
                  <View style={{flex: 1}} />
                  <TouchableOpacity
                    onPress={() => removeFromCollection.mutate(entry.id)}
                    disabled={isCollectionMutating}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <X size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Add to collection modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <LinearGradient
              colors={['#0d2525', '#0a1a35', '#06091e']}
              locations={[0, 0.60, 1]}
              start={{x: 1, y: 1}}
              end={{x: 0, y: 0}}
              style={styles.modalGradient}
            />
            <Text style={styles.modalTitle}>Add to Collection</Text>
            <Text style={styles.modalLabel}>Type</Text>
            <View style={styles.conditionPicker}>
              {CONDITIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.conditionChip,
                    selectedCondition === c && {
                      borderColor: CONDITION_COLORS[c],
                      backgroundColor: CONDITION_COLORS[c] + '22',
                    },
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
            <Text style={styles.modalLabel}>Condition</Text>
            <View style={styles.starPicker}>
              {([1, 2, 3, 4, 5] as const).map(star => {
                const active = star <= gameCondition;
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setGameCondition(star)}
                    activeOpacity={0.7}
                    hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}>
                    <Star
                      size={28}
                      color={active ? '#FF1B8D' : '#334155'}
                      fill={active ? '#FF1B8D' : 'transparent'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <Pressable
              style={({pressed}) => [
                styles.modalConfirmBtn,
                isCollectionMutating && styles.modalConfirmBtnDisabled,
                pressed && !isCollectionMutating && styles.modalConfirmBtnPressed,
              ]}
              onPress={handleAddCopy}
              disabled={isCollectionMutating}>
              <LinearGradient
                colors={['#FF1B8D', '#A855F7', '#5B45DC']}
                locations={[0, 0.65, 1]}
                start={{x: 0.3, y: 0}}
                end={{x: 0.4, y: 1}}
                style={styles.modalConfirmGradient}
              />
              {isCollectionMutating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalConfirmText}>Add</Text>
              )}
            </Pressable>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Details</Text>
        <View style={styles.detailsGrid}>
          {game.developer ? (
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Developer:</Text>
              <Text style={styles.detailValue}>{game.developer}</Text>
            </View>
          ) : null}
          {game.publisher ? (
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Publisher:</Text>
              <Text style={styles.detailValue}>{game.publisher}</Text>
            </View>
          ) : null}
          {year ? (
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Release Date:</Text>
              <Text style={styles.detailValue}>{game.release_date ?? year}</Text>
            </View>
          ) : null}
          {game.genres.length > 0 ? (
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Genre:</Text>
              <Text style={styles.detailValue}>{game.genres.join(', ')}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Summary */}
      {game.summary ? (
        <View style={styles.section}>
          <Text style={styles.summary}>{game.summary}</Text>
        </View>
      ) : null}

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
    </View>
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
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  headerSpacer: {
    flex: 1,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnWishlisted: {
    borderColor: '#FF1B8D',
    shadowColor: '#FF1B8D',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  center: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hero
  heroCover: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
  },
  cover: {
    width: 160,
    height: 210,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  coverPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  coverPlaceholderEmoji: {fontSize: 48},
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  regionBadge: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    backgroundColor: '#0a1a35',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  regionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  metaContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  metaDot: {
    fontSize: 13,
    color: '#475569',
  },
  // Add button
  addBtnWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  addCopyBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addCopyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  addCopyBtnContent: {flexDirection: 'row', alignItems: 'center', gap: 6},
  addCopyBtnText: {color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5},
  // Collection copies
  copiesList: {
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    padding: 12,
    overflow: 'hidden',
  },
  copiesGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  copyConditionBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  copyConditionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  copyLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  copyStars: {
    fontSize: 14,
  },
  conditionPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  conditionChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  conditionChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  // Sections
  section: {paddingHorizontal: 20, marginBottom: 24},
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#ffffff',
    marginBottom: 10,
  },
  summary: {fontSize: 14, color: '#94a3b8', lineHeight: 22},
  detailsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailsGrid: {
    gap: 6,
  },
  detailCell: {
    flexDirection: 'row',
    gap: 8,
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
  priceSource: {
    fontSize: 10,
    color: '#334155',
    marginTop: 6,
    textAlign: 'right',
  },
  starPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  star: {
    fontSize: 28,
    color: '#334155',
  },
  starActive: {
    color: '#fbbf24',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    overflow: 'hidden',
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.display,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 15,
    fontFamily: Fonts.display,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  modalConfirmBtn: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 12,
  },
  modalConfirmGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalConfirmBtnDisabled: {
    opacity: 0.6,
  },
  modalConfirmBtnPressed: {
    opacity: 0.85,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
