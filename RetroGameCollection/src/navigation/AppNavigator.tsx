import React, {useEffect, useRef} from 'react';
import {View, Image, StyleSheet, Animated, Pressable} from 'react-native';
import {NavigationContainer, StackActions, useNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Home, Gamepad2, Library, Star, User, ChevronLeft} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../hooks/useAuth';
import {Analytics} from '../lib/analytics';
import {configurePurchases, logOutPurchases} from '../lib/purchases';
import {useProfile} from '../api/profile';
import type {ManufacturerKey} from '../constants/manufacturers';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ConsoleListScreen from '../screens/ConsoleListScreen';
import ManufacturerScreen from '../screens/ManufacturerScreen';
import GameListScreen from '../screens/GameListScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import CollectionScreen from '../screens/CollectionScreen';
import CollectionConsoleScreen from '../screens/CollectionConsoleScreen';
import WishlistScreen from '../screens/WishlistScreen';
import WishlistConsoleScreen from '../screens/WishlistConsoleScreen';
import AccountScreen from '../screens/AccountScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PaywallScreen from '../screens/PaywallScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Paywall: {reason: 'console-limit' | 'wishlist' | 'upgrade' | 'collection-value'; plans?: 'all' | 'subscriptions-only'};
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Consoles: undefined;
  Collection: undefined;
  Wishlist: undefined;
  Account: undefined;
};

export type GameDetailParams = {
  gameId: number;
  gameName: string;
  consoleId: number;
  consoleName: string;
  collectionEntryId?: string;
};

export type ConsolesStackParamList = {
  ConsoleList: undefined;
  Manufacturer: {manufacturerKey: ManufacturerKey};
  GameList: {consoleId: number; consoleName: string};
  GameDetail: GameDetailParams;
};

export type CollectionStackParamList = {
  CollectionHome: undefined;
  CollectionConsole: {consoleId: number; consoleName: string};
  GameDetail: GameDetailParams;
};

export type WishlistStackParamList = {
  WishlistHome: undefined;
  WishlistConsole: {consoleId: number; consoleName: string};
  GameDetail: GameDetailParams;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  GameDetail: GameDetailParams;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ConsolesStack = createNativeStackNavigator<ConsolesStackParamList>();
const CollectionStack = createNativeStackNavigator<CollectionStackParamList>();
const WishlistStack = createNativeStackNavigator<WishlistStackParamList>();

const ICON_SIZE = 22;
const BG = '#0A0A0F';

type TabIconProps = {color: string; size: number; focused: boolean};

function HomeTabIcon({color}: TabIconProps) {
  return <Home size={ICON_SIZE} color={color} />;
}

function ConsolesTabIcon({color}: TabIconProps) {
  return <Gamepad2 size={ICON_SIZE} color={color} />;
}

function CollectionTabIcon({color}: TabIconProps) {
  return <Library size={ICON_SIZE} color={color} />;
}

function WishlistTabIcon({color}: TabIconProps) {
  return <Star size={ICON_SIZE} color={color} />;
}

function AnimatedTabButton({children, onPress, onLongPress, style}: any) {
  const scale = useRef(new Animated.Value(1)).current;
  function handlePressIn() {
    Animated.spring(scale, {toValue: 0.82, useNativeDriver: true, speed: 50, bounciness: 0}).start();
  }
  function handlePressOut() {
    Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8}).start();
  }
  return (
    <Animated.View style={[style, {transform: [{scale}]}]}>
      <Pressable onPress={onPress} onLongPress={onLongPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.tabButtonInner}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function AccountTabIcon({color, focused}: TabIconProps) {
  const {data: profile} = useProfile();
  const imageStyles = {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    borderWidth: focused ? 2 : 0,
    borderColor: '#6366f1',
  };

  if (profile?.avatar_url) {
    return (
      <Image
        source={{uri: profile.avatar_url}}
        style={imageStyles}
      />
    );
  }
  return <User size={ICON_SIZE} color={color} />;
}

export function ScreenHeader({children}: {children?: React.ReactNode}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <View style={[styles.screenHeader, {paddingTop: insets.top}]}>
      <Animated.View style={{transform: [{scale}]}}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          onPressIn={() =>
            Animated.spring(scale, {toValue: 0.82, useNativeDriver: true, speed: 50, bounciness: 0}).start()
          }
          onPressOut={() =>
            Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8}).start()
          }>
          <ChevronLeft size={22} color="#ffffff" />
        </Pressable>
      </Animated.View>
      <View style={styles.headerSpacer} />
      {children}
    </View>
  );
}

const darkHeader = {
  headerShown: false,
  contentStyle: {backgroundColor: BG},
} as const;

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={darkHeader}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{headerShown: false}} />
      <HomeStack.Screen name="GameDetail" component={GameDetailScreen} options={{headerShown: false}} />
    </HomeStack.Navigator>
  );
}

function ConsolesNavigator() {
  return (
    <ConsolesStack.Navigator screenOptions={darkHeader}>
      <ConsolesStack.Screen name="ConsoleList" component={ConsoleListScreen} options={{headerShown: false}} />
      <ConsolesStack.Screen name="Manufacturer" component={ManufacturerScreen} />
      <ConsolesStack.Screen name="GameList" component={GameListScreen} />
      <ConsolesStack.Screen name="GameDetail" component={GameDetailScreen} options={{headerShown: false}} />
    </ConsolesStack.Navigator>
  );
}

function CollectionNavigator() {
  return (
    <CollectionStack.Navigator screenOptions={darkHeader}>
      <CollectionStack.Screen name="CollectionHome" component={CollectionScreen} options={{headerShown: false}} />
      <CollectionStack.Screen name="CollectionConsole" component={CollectionConsoleScreen} />
      <CollectionStack.Screen name="GameDetail" component={GameDetailScreen} options={{headerShown: false}} />
    </CollectionStack.Navigator>
  );
}

function WishlistNavigator() {
  return (
    <WishlistStack.Navigator screenOptions={darkHeader}>
      <WishlistStack.Screen name="WishlistHome" component={WishlistScreen} options={{headerShown: false}} />
      <WishlistStack.Screen name="WishlistConsole" component={WishlistConsoleScreen} />
      <WishlistStack.Screen name="GameDetail" component={GameDetailScreen} options={{headerShown: false}} />
    </WishlistStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: BG}}}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#0a1a35',
          borderTopWidth: 1,
          borderTopColor: 'rgba(59, 130, 246, 0.3)',
          paddingTop: 10,
          paddingBottom: 10,
          height: 68,
          paddingLeft: 12,
          paddingRight: 12,
          shadowColor: '#3B82F6',
          shadowOffset: {width: 0, height: -4},
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        headerShown: false,
        sceneStyle: {backgroundColor: BG},
        tabBarButton: AnimatedTabButton,
      }}>
      <Tab.Screen name="Home" component={HomeNavigator} options={{tabBarIcon: HomeTabIcon}} />
      <Tab.Screen
        name="Consoles"
        component={ConsolesNavigator}
        options={{tabBarIcon: ConsolesTabIcon}}
        listeners={({navigation, route}) => ({
          tabPress: () => {
            const state = navigation.getState();
            const nested = state.routes.find((r: any) => r.name === route.name)?.state;
            if (nested && (nested.index ?? 0) > 0) {
              navigation.dispatch({...StackActions.popToTop(), target: nested.key});
            }
          },
        })}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionNavigator}
        options={{tabBarIcon: CollectionTabIcon}}
        listeners={({navigation, route}) => ({
          tabPress: () => {
            const state = navigation.getState();
            const nested = state.routes.find((r: any) => r.name === route.name)?.state;
            if (nested && (nested.index ?? 0) > 0) {
              navigation.dispatch({...StackActions.popToTop(), target: nested.key});
            }
          },
        })}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistNavigator}
        options={{tabBarIcon: WishlistTabIcon}}
        listeners={({navigation, route}) => ({
          tabPress: () => {
            const state = navigation.getState();
            const nested = state.routes.find((r: any) => r.name === route.name)?.state;
            if (nested && (nested.index ?? 0) > 0) {
              navigation.dispatch({...StackActions.popToTop(), target: nested.key});
            }
          },
        })}
      />
      <Tab.Screen name="Account" component={AccountScreen} options={{tabBarIcon: AccountTabIcon, tabBarLabel: 'Profile', headerShown: false}} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const {session, loading} = useAuth();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (session?.user?.id) {
      configurePurchases(session.user.id);
      Analytics.identify(session.user.id, {email: session.user.email ?? undefined});
    } else {
      logOutPurchases();
      Analytics.reset();
    }
  }, [session?.user?.id, session?.user?.email]);

  if (loading) {
    return <View style={styles.splash} />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => {
        const route = navigationRef.getCurrentRoute();
        if (route) Analytics.screen(route.name);
      }}>
      <RootStack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: BG}}}>
        {session ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
        <RootStack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{presentation: 'modal', headerShown: false, contentStyle: {backgroundColor: '#0f172a'}}}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: BG,
  },
  tabButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  headerSpacer: {
    flex: 1,
  },
});
