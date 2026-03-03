import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {useConsoles} from '../api/consoles';
import {igdbImageUrl} from '../api/games';
import {MANUFACTURERS} from '../constants/manufacturers';
import {getManufacturerKey} from '../utils/manufacturerUtils';
import type {ConsolesStackParamList} from '../navigation/AppNavigator';
import type {Console} from '../types/database';

type Nav = NativeStackNavigationProp<ConsolesStackParamList>;
type RouteProps = NativeStackScreenProps<ConsolesStackParamList, 'Manufacturer'>['route'];

function ConsoleRow({item, onPress}: {item: Console; onPress: () => void}) {
  const logoUri = igdbImageUrl(item.logo_url, 't_logo_med');
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowLogo}>
        {logoUri ? (
          <Image source={{uri: logoUri}} style={styles.consoleLogo} resizeMode="contain" />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoFallbackText}>{item.name[0]}</Text>
          </View>
        )}
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.consoleName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.release_year ? (
          <Text style={styles.consoleMeta}>{item.release_year}</Text>
        ) : null}
        {item.summary ? (
          <Text style={styles.consoleSummary} numberOfLines={2}>
            {item.summary}
          </Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ManufacturerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const {manufacturerKey} = route.params;
  const info = MANUFACTURERS[manufacturerKey];

  const {data: allConsoles, isLoading, isError, refetch} = useConsoles();
  const [search, setSearch] = useState('');

  const consoles = useMemo(() => {
    if (!allConsoles) return [];
    const filtered = allConsoles
      .filter(c => getManufacturerKey(c) === manufacturerKey)
      .sort((a, b) => {
        if (a.release_year && b.release_year) return a.release_year - b.release_year;
        if (a.release_year) return -1;
        if (b.release_year) return 1;
        return a.name.localeCompare(b.name);
      });

    const q = search.toLowerCase().trim();
    if (!q) return filtered;
    return filtered.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.summary?.toLowerCase().includes(q),
    );
  }, [allConsoles, manufacturerKey, search]);

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
        data={consoles}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Manufacturer header card */}
            <View style={[styles.mfHeader, {borderLeftColor: info.color}]}>
              <View style={styles.mfTitleRow}>
                {info.logoUrl ? (
                  <View style={styles.mfLogoContainer}>
                    <Image
                      source={{uri: info.logoUrl}}
                      style={styles.mfLogo}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={[styles.mfLogoContainer, styles.mfLogoPlaceholder]}>
                    <Text style={[styles.mfLogoPlaceholderText, {color: info.color}]}>
                      {info.name[0]}
                    </Text>
                  </View>
                )}
                <View style={styles.mfTitleInfo}>
                  <Text style={[styles.mfName, {color: info.color}]}>{info.name}</Text>
                  <Text style={styles.mfCount}>{consoles.length} platforms</Text>
                </View>
              </View>
              <Text style={styles.mfHistory}>{info.history}</Text>
            </View>

            {/* Search bar */}
            <View style={styles.searchWrapper}>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search platforms…"
                placeholderTextColor="#64748b"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>
          </>
        }
        renderItem={({item}) => (
          <ConsoleRow
            item={item}
            onPress={() =>
              navigation.navigate('GameList', {
                consoleId: item.id,
                consoleName: item.name,
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          search ? (
            <Text style={styles.emptyText}>No platforms match "{search}"</Text>
          ) : (
            <Text style={styles.emptyText}>No platforms found.</Text>
          )
        }
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
  // Manufacturer header
  mfHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
  },
  mfTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  mfLogoContainer: {
    width: 88,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mfLogo: {
    width: 76,
    height: 36,
  },
  mfLogoPlaceholder: {
    backgroundColor: '#0f172a',
  },
  mfLogoPlaceholderText: {
    fontSize: 24,
    fontWeight: '800',
  },
  mfTitleInfo: {
    flex: 1,
  },
  mfName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  mfCount: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  mfHistory: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  // Search
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#f1f5f9',
  },
  // Console rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
  },
  rowLogo: {
    width: 56,
    height: 48,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consoleLogo: {
    width: 56,
    height: 48,
  },
  logoFallback: {
    width: 48,
    height: 48,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
  },
  rowInfo: {
    flex: 1,
    paddingRight: 8,
  },
  consoleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  consoleMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  consoleSummary: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginTop: 4,
  },
  chevron: {
    fontSize: 22,
    color: '#334155',
  },
  separator: {
    height: 1,
    backgroundColor: '#1e293b',
    marginLeft: 86,
  },
  emptyText: {
    color: '#64748b',
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
