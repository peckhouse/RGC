import React, {useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useConsoles} from '../api/consoles';
import {
  MANUFACTURERS,
  MANUFACTURER_ORDER,
  type ManufacturerKey,
} from '../constants/manufacturers';
import {getManufacturerKey} from '../utils/manufacturerUtils';
import type {ConsolesStackParamList} from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<ConsolesStackParamList>;

type ManufacturerCard = {
  key: ManufacturerKey;
  count: number;
};

function ManufacturerCard({item, onPress}: {item: ManufacturerCard; onPress: () => void}) {
  const info = MANUFACTURERS[item.key];
  return (
    <TouchableOpacity
      style={[styles.card, {borderLeftColor: info.color}]}
      onPress={onPress}
      activeOpacity={0.75}>
      <View style={styles.cardLeft}>
        {info.logoUrl ? (
          <View style={styles.logoContainer}>
            <Image
              source={{uri: info.logoUrl}}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={[styles.logoContainer, styles.logoPlaceholder]}>
            <Text style={[styles.logoPlaceholderText, {color: info.color}]}>
              {info.name[0]}
            </Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, {color: info.color}]}>{info.name}</Text>
          <Text style={styles.cardCount}>{item.count} platforms</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ConsoleListScreen() {
  const navigation = useNavigation<Nav>();
  const {data: consoles, isLoading, isError, refetch} = useConsoles();

  const cards = useMemo((): ManufacturerCard[] => {
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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
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
      <FlatList
        data={cards}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Consoles</Text>
          </View>
        }
        renderItem={({item}) => (
          <ManufacturerCard
            item={item}
            onPress={() =>
              navigation.navigate('Manufacturer', {manufacturerKey: item.key})
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  },
  listContent: {
    paddingBottom: 40,
  },
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoContainer: {
    width: 76,
    height: 38,
    backgroundColor: '#fff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 66,
    height: 30,
  },
  logoPlaceholder: {
    backgroundColor: '#0f172a',
  },
  logoPlaceholderText: {
    fontSize: 22,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardCount: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: '#334155',
    marginLeft: 8,
  },
  separator: {
    height: 10,
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
