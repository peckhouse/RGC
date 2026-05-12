import React, {useMemo, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  StyleSheet,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ChevronRight, Package} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useMyCollection} from '../api/collection';
import {ConsoleListSkeleton} from '../components/common/Skeleton';
import type {CollectionStackParamList} from '../navigation/AppNavigator';
import type {CollectionEntryWithDetails} from '../api/collection';
import AdBanner from '../components/common/AdBanner';
import ScreenLogo from '../components/common/ScreenLogo';
import {CONSOLE_LOGO_MAP} from './ManufacturerScreen';
import {Fonts} from '../constants/fonts';

type Nav = NativeStackNavigationProp<CollectionStackParamList>;

type ConsoleGroup = {
  consoleId: number;
  consoleName: string;
  entries: CollectionEntryWithDetails[];
};

function ConsoleCard({group, onPress}: {group: ConsoleGroup; onPress: () => void}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const localLogo = CONSOLE_LOGO_MAP[group.consoleName];

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

  const count = group.entries.length;

  return (
    <Animated.View style={[styles.cardShadow, {transform: [{scale}, {translateX}]}]}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        <View style={styles.cardLogoArea}>
          {localLogo ? (
            <Image source={localLogo} style={styles.consoleLogo} resizeMode="contain" />
          ) : (
            <Text style={styles.logoFallbackText}>{group.consoleName[0]}</Text>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.consoleName} numberOfLines={2}>{group.consoleName}</Text>
          <Text style={styles.gameCount}>
            {count} game{count !== 1 ? 's' : ''} owned
          </Text>
        </View>
        <ChevronRight size={20} color="rgba(99, 160, 255, 0.5)" />
      </TouchableOpacity>
    </Animated.View>
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
        <View style={styles.pageHeader}>
          <ScreenLogo />
          <Text style={styles.pageTitle}>My Collection</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyCard}>
            <LinearGradient
              colors={['#0d2525', '#0a1a35', '#06091e']}
              locations={[0, 0.60, 1]}
              start={{x: 1, y: 1}}
              end={{x: 0, y: 0}}
              style={styles.emptyCardGradient}
            />
            <Package size={52} color="#FF1B8D" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              Browse a console and tap a game to add it to your collection.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <ScreenLogo />
        <Text style={styles.pageTitle}>My Collection</Text>
      </View>
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
      />
      <AdBanner />
    </View>
  );
}

const GRID_PADDING = 16;
const GRID_GAP = 10;

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
  listContent: {
    paddingBottom: 40,
    paddingTop: 8,
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
  cardShadow: {
    marginHorizontal: GRID_PADDING,
    marginBottom: GRID_GAP,
    borderRadius: 16,
    height: 64,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    paddingLeft: 4,
    paddingRight: 12,
    gap: 6,
  },
  cardLogoArea: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consoleLogo: {
    width: '100%',
    height: '100%',
  },
  logoFallbackText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366f1',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  consoleName: {
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#ffffff',
    textAlign: 'left',
  },
  gameCount: {
    fontSize: 12,
    color: 'rgba(99, 160, 255, 0.85)',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emptyIcon: {marginBottom: 16},
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.display,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
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
