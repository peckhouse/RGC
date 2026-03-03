import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';

function useShimmer() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {toValue: 1, duration: 700, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 0.4, duration: 700, useNativeDriver: true}),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return opacity;
}

function Bone({
  width,
  height,
  borderRadius = 4,
  color = '#1e293b',
  style,
  opacity,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  color?: string;
  style?: object;
  opacity: Animated.Value;
}) {
  return (
    <Animated.View
      style={[{width, height, borderRadius, backgroundColor: color, opacity}, style]}
    />
  );
}

// ─── Game row skeleton (used in GameList, CollectionConsole, WishlistConsole) ─

function GameRowItem({opacity}: {opacity: Animated.Value}) {
  return (
    <View style={rowStyles.row}>
      <Bone width={48} height={62} borderRadius={5} opacity={opacity} />
      <View style={rowStyles.info}>
        <Bone width="58%" height={14} borderRadius={3} opacity={opacity} />
        <Bone width="34%" height={10} borderRadius={3} opacity={opacity} />
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  info: {
    flex: 1,
    gap: 8,
  },
});

export function GameListSkeleton() {
  const opacity = useShimmer();
  return (
    <View>
      {/* Header: title + subtitle + progress ring */}
      <View style={gameListStyles.header}>
        <View style={gameListStyles.headerText}>
          <Bone width="55%" height={22} borderRadius={4} opacity={opacity} />
          <Bone width="38%" height={11} borderRadius={3} opacity={opacity} />
        </View>
        <Bone width={72} height={72} borderRadius={36} opacity={opacity} />
      </View>

      {/* Search bar */}
      <View style={gameListStyles.searchRow}>
        <Bone width="100%" height={40} borderRadius={10} opacity={opacity} />
      </View>

      {/* Region tabs */}
      <View style={gameListStyles.tabBar}>
        <View style={gameListStyles.tab}>
          <Bone width="100%" height={36} borderRadius={8} opacity={opacity} />
        </View>
        <View style={gameListStyles.tab}>
          <Bone width="100%" height={36} borderRadius={8} opacity={opacity} />
        </View>
        <View style={gameListStyles.tab}>
          <Bone width="100%" height={36} borderRadius={8} opacity={opacity} />
        </View>
      </View>

      {/* Game rows */}
      {Array.from({length: 5}).map((_, i) => (
        <React.Fragment key={i}>
          <GameRowItem opacity={opacity} />
          {i < 4 && <View style={sharedStyles.sep} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const gameListStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
    gap: 8,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
  },
});

// ─── Console card skeleton (used in Collection, Wishlist) ─────────────────────

function ConsoleCardItem({
  opacity,
  accentColor,
}: {
  opacity: Animated.Value;
  accentColor: string;
}) {
  return (
    <View style={[cardStyles.card, {borderLeftColor: accentColor}]}>
      <View style={cardStyles.top}>
        <Bone width={130} height={15} borderRadius={3} color="#334155" opacity={opacity} />
        <Bone width={28} height={11} borderRadius={3} color="#334155" opacity={opacity} />
      </View>
      <View style={cardStyles.covers}>
        {Array.from({length: 4}).map((_, i) => (
          <Bone
            key={i}
            width={52}
            height={68}
            borderRadius={5}
            color="#334155"
            opacity={opacity}
          />
        ))}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  covers: {
    flexDirection: 'row',
    gap: 8,
  },
});

export function ConsoleListSkeleton({accentColor = '#6366f1'}: {accentColor?: string}) {
  const opacity = useShimmer();
  return (
    <View style={sharedStyles.consoleList}>
      <Bone
        width="48%"
        height={26}
        borderRadius={4}
        opacity={opacity}
        style={sharedStyles.titleBone}
      />
      {Array.from({length: 4}).map((_, i) => (
        <ConsoleCardItem key={i} opacity={opacity} accentColor={accentColor} />
      ))}
    </View>
  );
}

const sharedStyles = StyleSheet.create({
  sep: {
    height: 1,
    backgroundColor: '#1e293b',
    marginLeft: 76,
  },
  consoleList: {
    paddingHorizontal: 16,
    paddingTop: 64,
  },
  titleBone: {
    marginBottom: 20,
  },
});
