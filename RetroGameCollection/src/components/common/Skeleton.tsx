import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {Gamepad2, Joystick} from 'lucide-react-native';

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

// ─── Game card skeleton (used in GameList, CollectionConsole, WishlistConsole) ─

function GameCardItem({opacity}: {opacity: Animated.Value}) {
  return (
    <View style={gameListStyles.card}>
      <Bone width={56} height={72} borderRadius={6} opacity={opacity} />
      <View style={gameListStyles.cardInfo}>
        <Bone width="65%" height={15} borderRadius={3} opacity={opacity} />
        <Bone width="40%" height={10} borderRadius={3} opacity={opacity} />
        <Bone width="30%" height={10} borderRadius={3} opacity={opacity} />
      </View>
    </View>
  );
}

export function GameCardsSkeleton() {
  const opacity = useShimmer();
  return (
    <View>
      {Array.from({length: 5}).map((_, i) => (
        <GameCardItem key={i} opacity={opacity} />
      ))}
    </View>
  );
}

export function GameListSkeleton() {
  const opacity = useShimmer();
  return (
    <View>
      {/* Header: logo + title + progress ring */}
      <View style={gameListStyles.header}>
        <Bone width={48} height={48} borderRadius={8} opacity={opacity} />
        <Bone width="40%" height={18} borderRadius={4} opacity={opacity} />
        <View style={{flex: 1}} />
        <Bone width={72} height={72} borderRadius={36} opacity={opacity} />
      </View>

      {/* Region tabs */}
      <View style={gameListStyles.tabBar}>
        <Bone width="100%" height={34} borderRadius={12} opacity={opacity} />
      </View>

      {/* Search bar */}
      <View style={gameListStyles.searchRow}>
        <Bone width="100%" height={38} borderRadius={12} opacity={opacity} />
      </View>

      {/* Game cards */}
      {Array.from({length: 5}).map((_, i) => (
        <GameCardItem key={i} opacity={opacity} />
      ))}
    </View>
  );
}

const gameListStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tabBar: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 160, 255, 0.2)',
    backgroundColor: '#0a1a35',
  },
  cardInfo: {
    flex: 1,
    gap: 8,
  },
});

// ─── Home stats card skeleton ──────────────────────────────────────────────────

export function StatsCardSkeleton() {
  const opacity = useShimmer();
  return (
    <>
      {/* Collection value row — mirrors free-user CTA: unlockTitle(fs15,mb2) + unlockSub(fs12), chevron(fs24) */}
      <View style={statsStyles.valueRow}>
        <View style={statsStyles.valueLeft}>
          <Bone width={170} height={19} borderRadius={3} opacity={opacity} />
          <Bone width={220} height={15} borderRadius={3} style={statsStyles.subBone} opacity={opacity} />
        </View>
        <Bone width={12} height={28} borderRadius={3} opacity={opacity} />
      </View>

      {/* Divider */}
      <View style={statsStyles.divider} />

      {/* Stats row — paddingVertical:16 each side */}
      <View style={statsStyles.statsRow}>
        {/* Games */}
        <View style={statsStyles.statItem}>
          <Text style={statsStyles.staticLabel}>Games</Text>
          <View style={statsStyles.iconRow}>
            <Gamepad2 size={18} color="#475569" />
            <Bone width={36} height={30} borderRadius={4} opacity={opacity} />
          </View>
          <Text style={statsStyles.staticSubLabel}>In your collection</Text>
        </View>
        <View style={statsStyles.statDivider} />
        {/* Consoles */}
        <View style={statsStyles.statItem}>
          <Text style={statsStyles.staticLabel}>Consoles</Text>
          <View style={statsStyles.iconRow}>
            <Joystick size={18} color="#475569" />
            <Bone width={36} height={30} borderRadius={4} opacity={opacity} />
          </View>
          <Bone width="80%" height={4} borderRadius={2} style={statsStyles.progressBone} opacity={opacity} />
        </View>
      </View>
    </>
  );
}

const statsStyles = StyleSheet.create({
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  valueLeft: {
    flex: 1,
    paddingRight: 12,
  },
  subBone: {
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    marginHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  staticLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  staticSubLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  progressBone: {
    marginTop: 8,
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
