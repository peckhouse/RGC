import React, {useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  SectionList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {Search, ChevronRight} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useConsoles} from '../api/consoles';
import {igdbImageUrl} from '../api/games';
import {MANUFACTURERS} from '../constants/manufacturers';
import {getManufacturerKey} from '../utils/manufacturerUtils';
import type {ConsolesStackParamList} from '../navigation/AppNavigator';
import type {ManufacturerKey} from '../constants/manufacturers';
import type {Console} from '../types/database';
import {GameListSkeleton} from '../components/common/Skeleton';
import {Fonts} from '../constants/fonts';

const LOGO_MAP: Record<ManufacturerKey, ReturnType<typeof require>> = {
  Nintendo: require('../../assets/manufacturer-logos/nintendo-white-small.png'),
  Sony:     require('../../assets/manufacturer-logos/sony-white-small.png'),
  Sega:     require('../../assets/manufacturer-logos/sega-white-small.png'),
  Xbox:     require('../../assets/manufacturer-logos/xbox-white-small.png'),
  Atari:    require('../../assets/manufacturer-logos/atari-white-small.png'),
  NEC:      require('../../assets/manufacturer-logos/nec-white-small.png'),
  SNK:      require('../../assets/manufacturer-logos/snk-white-small.png'),
  Bandai:   require('../../assets/manufacturer-logos/bandai-white-small.png'),
};

type Nav = NativeStackNavigationProp<ConsolesStackParamList>;
type RouteProps = NativeStackScreenProps<ConsolesStackParamList, 'Manufacturer'>['route'];

const GRID_PADDING = 16;
const GRID_GAP = 10;

// Static local logos keyed by the display name stored in the DB
const CONSOLE_LOGO_MAP: Record<string, ReturnType<typeof require>> = {
  // ── Nintendo ──────────────────────────────────────────────────────
  'Famicom / NES':              require('../../assets/console-logo/nintendo/nes.jpg'),
  'Super Famicom / SNES':       require('../../assets/console-logo/nintendo/snes.jpg'),
  'N64':                        require('../../assets/console-logo/nintendo/n64.jpg'),
  'GameCube':                   require('../../assets/console-logo/nintendo/gamecube.jpg'),
  'Wii':                        require('../../assets/console-logo/nintendo/wii.jpg'),
  'Wii U':                      require('../../assets/console-logo/nintendo/wii-u.jpg'),
  'GB Color':                   require('../../assets/console-logo/nintendo/gb.jpg'),
  'Game Boy Advance':           require('../../assets/console-logo/nintendo/gb-advance.jpg'),
  'Virtual Boy':                require('../../assets/console-logo/nintendo/virtual-boy.jpg'),
  'DS':                         require('../../assets/console-logo/nintendo/ds.jpg'),
  '3DS':                        require('../../assets/console-logo/nintendo/3ds.jpg'),
  // ── Sony ──────────────────────────────────────────────────────────
  'PlayStation':                require('../../assets/console-logo/sony/playstation-1.jpg'),
  'PlayStation 2':              require('../../assets/console-logo/sony/playstation-2.jpg'),
  'PlayStation 3':              require('../../assets/console-logo/sony/playstation-3.jpg'),
  'PSP':                        require('../../assets/console-logo/sony/psp.jpg'),
  'PS Vita':                    require('../../assets/console-logo/sony/ps-vita.jpg'),
  // ── Sega ──────────────────────────────────────────────────────────
  'Mark III / Master System':   require('../../assets/console-logo/sega/master-system.jpg'),
  'Mega Drive / Genesis':       require('../../assets/console-logo/sega/mega-drive.jpg'),
  'Saturn':                     require('../../assets/console-logo/sega/saturn.jpg'),
  'Dreamcast':                  require('../../assets/console-logo/sega/dreamcast.jpg'),
  'Game Gear':                  require('../../assets/console-logo/sega/game-gear.jpg'),
  // ── Xbox ──────────────────────────────────────────────────────────
  'Xbox':                       require('../../assets/console-logo/xbox/xbox.jpg'),
  'Xbox 360':                   require('../../assets/console-logo/xbox/xbox-360.jpg'),
  'Xbox One':                    require('../../assets/console-logo/xbox/xbox-one.jpg'),
  // ── Atari ─────────────────────────────────────────────────────────
  'Atari 2600 / 7800':          require('../../assets/console-logo/atari/atari-2600.jpg'),
  'Jaguar':                     require('../../assets/console-logo/atari/jaguar.jpg'),
  'Atari Lynx':                 require('../../assets/console-logo/atari/lynx.jpg'),
  // ── NEC ───────────────────────────────────────────────────────────
  'PC Engine / TurboGrafx-16':  require('../../assets/console-logo/nec/pc-engine.jpg'),
  'PC Engine CD / TurboGrafx-CD': require('../../assets/console-logo/nec/pc-engine-cd.jpg'),
  // ── SNK ───────────────────────────────────────────────────────────
  'Neo Geo':                    require('../../assets/console-logo/snk/neo-geo.jpg'),
  'Neo Geo CD':                 require('../../assets/console-logo/snk/neo-geo-cd.jpg'),
  'Neo Geo Pocket / Pocket Color': require('../../assets/console-logo/snk/neo-geo-pocket.jpg'),
  // ── Bandai ────────────────────────────────────────────────────────
  'WonderSwan / WonderSwan Color': require('../../assets/console-logo/bandai/wonderswan.jpg'),
};

function ConsoleCard({item, accentColor, onPress}: {item: Console; accentColor: string; onPress: () => void}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const localLogo = CONSOLE_LOGO_MAP[item.name];
  const logoUri = localLogo ? null : igdbImageUrl(item.logo_url, 't_logo_med');

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
          ) : logoUri ? (
            <Image source={{uri: logoUri}} style={styles.consoleLogo} resizeMode="contain" />
          ) : (
            <Text style={[styles.logoFallbackText, {color: accentColor}]}>{item.name[0]}</Text>
          )}
        </View>
        <Text style={styles.consoleName} numberOfLines={2}>{item.name}</Text>
        <ChevronRight size={20} color="rgba(99, 160, 255, 0.5)" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ManufacturerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const {manufacturerKey} = route.params;
  const info = MANUFACTURERS[manufacturerKey];

  const {data: allConsoles, isLoading, isError, refetch} = useConsoles();
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  const sections = useMemo(() => {
    if (!allConsoles) return [];
    const byManufacturer = allConsoles
      .filter(c => getManufacturerKey(c) === manufacturerKey);

    const q = search.toLowerCase().trim();
    const filtered = q
      ? byManufacturer.filter(c =>
          c.name.toLowerCase().includes(q) || c.summary?.toLowerCase().includes(q))
      : byManufacturer;

    const sortByYear = (a: Console, b: Console) => {
      if (a.release_year && b.release_year) return a.release_year - b.release_year;
      if (a.release_year) return -1;
      if (b.release_year) return 1;
      return a.name.localeCompare(b.name);
    };

    const home = filtered.filter(c => c.platform_type === 'home').sort(sortByYear);
    const handheld = filtered.filter(c => c.platform_type === 'handheld').sort(sortByYear);

    const result: {title: string; data: Console[]}[] = [];
    if (home.length > 0) result.push({title: 'Home Systems', data: home});
    if (handheld.length > 0) result.push({title: 'Handhelds', data: handheld});
    return result;
  }, [allConsoles, manufacturerKey, search]);


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
        <Text style={styles.errorText}>Failed to load consoles.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Manufacturer hero card */}
            <View style={styles.heroShadow}>
              <View style={styles.heroCard}>
                <LinearGradient
                  colors={['#0d2525', '#0a1a35', '#06091e']}
                  locations={[0, 0.60, 1]}
                  start={{x: 1, y: 1}}
                  end={{x: 0, y: 0}}
                  style={styles.heroGradient}
                />
                <Image source={LOGO_MAP[manufacturerKey]} style={styles.heroLogoImage} resizeMode="contain" />
                <Text style={styles.heroHistory}>{info.history}</Text>
              </View>
            </View>

            {/* Search bar */}
            <View style={styles.searchWrapper}>
              <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
                <Search size={16} color={focused ? '#6366f1' : '#94a3b8'} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search platforms…"
                  placeholderTextColor="#475569"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>
            </View>
          </>
        }
        renderSectionHeader={({section: {title}}) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({item}) => (
          <ConsoleCard
            item={item}
            accentColor={info.color}
            onPress={() => navigation.navigate('GameList', {consoleId: item.id, consoleName: item.name})}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {search ? `No platforms match "${search}"` : 'No platforms found.'}
          </Text>
        }
      />
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
  },
  listContent: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  // Hero card
  heroShadow: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 16,
    shadowColor: 'rgba(99, 160, 255, 0.5)',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    overflow: 'hidden',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroLogoImage: {
    width: 160,
    height: 80,
  },
  heroHistory: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 20,
    textAlign: 'center',
  },
  // Section headers
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.display,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: GRID_PADDING,
    paddingTop: 18,
    paddingBottom: 8,
  },
  // Search
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#f1f5f9',
    padding: 0,
  },
  // Console cards
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
    paddingHorizontal: GRID_PADDING,
  },
  cardShadow: {
    marginHorizontal: GRID_PADDING,
    marginBottom: GRID_GAP,
    borderRadius: 16,
    height: 56,
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
    gap: 2,
  },
  cardLogoArea: {
    width: 48,
    height: 48,
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
  },
  consoleName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: Fonts.display,
    color: '#ffffff',
    textAlign: 'left',
  },
  emptyText: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 48,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 15,
    marginBottom: 16,
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
