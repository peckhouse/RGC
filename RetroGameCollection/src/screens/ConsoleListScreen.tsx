import React, {useMemo, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {useConsoles} from '../api/consoles';
import {
  MANUFACTURER_ORDER,
  type ManufacturerKey,
} from '../constants/manufacturers';
import {getManufacturerKey} from '../utils/manufacturerUtils';
import type {ConsolesStackParamList} from '../navigation/AppNavigator';
import ScreenLogo from '../components/common/ScreenLogo';
import {Fonts} from '../constants/fonts';

type Nav = NativeStackNavigationProp<ConsolesStackParamList>;

type ManufacturerCardData = {
  key: ManufacturerKey;
  count: number;
};

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 10;
const CARD_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

// Static require map — Metro needs literal paths
const LOGO_MAP: Record<ManufacturerKey, ReturnType<typeof require>> = {
  Nintendo: require('../../assets/manufacturer-logos/nintendo-white.png'),
  Sony:     require('../../assets/manufacturer-logos/sony-white.png'),
  Sega:     require('../../assets/manufacturer-logos/sega-white.png'),
  Xbox:     require('../../assets/manufacturer-logos/xbox-white.png'),
  Atari:    require('../../assets/manufacturer-logos/atari-white.png'),
  NEC:      require('../../assets/manufacturer-logos/nec-white.png'),
  SNK:      require('../../assets/manufacturer-logos/snk-white.png'),
  Bandai:   require('../../assets/manufacturer-logos/bandai-white.png'),
};

function MfCard({item, onPress}: {item: ManufacturerCardData; onPress: () => void}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 0}).start();
  }
  function handlePressOut() {
    Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6}).start();
  }

  return (
    <Animated.View style={[styles.cardShadow, {transform: [{scale}]}]}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        <LinearGradient
          colors={['#0d2525', '#0a1a35', '#06091e']}
          locations={[0, 0.60, 1]}
          start={{x: 1, y: 1}}
          end={{x: 0, y: 0}}
          style={styles.cardGradient}
        />
        <Image
          source={LOGO_MAP[item.key]}
          style={styles.logo}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ConsoleListScreen() {
  const navigation = useNavigation<Nav>();
  const {data: consoles, isError, refetch} = useConsoles();

  const cards = useMemo((): ManufacturerCardData[] => {
    if (!consoles) return MANUFACTURER_ORDER.map(key => ({key, count: 0}));
    const counts = new Map<ManufacturerKey, number>(
      MANUFACTURER_ORDER.map(k => [k, 0]),
    );
    for (const c of consoles) {
      const key = getManufacturerKey(c);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return MANUFACTURER_ORDER.map(key => ({key, count: counts.get(key) ?? 0}));
  }, [consoles]);

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
      <FlatList
        data={cards}
        keyExtractor={item => item.key}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.pageHeader}>
            <ScreenLogo />
            <Text style={styles.pageTitle}>Consoles</Text>
          </View>
        }
        renderItem={({item}) => (
          <MfCard
            item={item}
            onPress={() => navigation.navigate('Manufacturer', {manufacturerKey: item.key})}
          />
        )}
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
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 40,
  },
  pageHeader: {
    paddingTop: 64,
    paddingBottom: 20,
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
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  cardShadow: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 16,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.5)',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logo: {
    width: CARD_SIZE - 40,
    height: CARD_SIZE - 40,
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
