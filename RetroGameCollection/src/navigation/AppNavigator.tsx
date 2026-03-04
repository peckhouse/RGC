import React, {useEffect} from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {NavigationContainer, StackActions, useNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Home, Gamepad2, Library, Star, User} from 'lucide-react-native';

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

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const ConsolesStack = createNativeStackNavigator<ConsolesStackParamList>();
const CollectionStack = createNativeStackNavigator<CollectionStackParamList>();
const WishlistStack = createNativeStackNavigator<WishlistStackParamList>();

const ICON_SIZE = 28;

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

const darkHeader = {
  headerShown: true,
  title: '',
  headerStyle: {backgroundColor: '#0f172a'},
  headerTintColor: '#6366f1',
  headerShadowVisible: false,
} as const;

function ConsolesNavigator() {
  return (
    <ConsolesStack.Navigator screenOptions={darkHeader}>
      <ConsolesStack.Screen name="ConsoleList" component={ConsoleListScreen} options={{headerShown: false}} />
      <ConsolesStack.Screen name="Manufacturer" component={ManufacturerScreen} />
      <ConsolesStack.Screen name="GameList" component={GameListScreen} />
      <ConsolesStack.Screen name="GameDetail" component={GameDetailScreen} />
    </ConsolesStack.Navigator>
  );
}

function CollectionNavigator() {
  return (
    <CollectionStack.Navigator screenOptions={darkHeader}>
      <CollectionStack.Screen name="CollectionHome" component={CollectionScreen} options={{headerShown: false}} />
      <CollectionStack.Screen name="CollectionConsole" component={CollectionConsoleScreen} />
      <CollectionStack.Screen name="GameDetail" component={GameDetailScreen} />
    </CollectionStack.Navigator>
  );
}

function WishlistNavigator() {
  return (
    <WishlistStack.Navigator screenOptions={darkHeader}>
      <WishlistStack.Screen name="WishlistHome" component={WishlistScreen} options={{headerShown: false}} />
      <WishlistStack.Screen name="WishlistConsole" component={WishlistConsoleScreen} />
      <WishlistStack.Screen name="GameDetail" component={GameDetailScreen} />
    </WishlistStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
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
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          height: 60,
          paddingLeft: 12,
          paddingRight: 12,
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 8,
          paddingBottom: 8,
        },
        headerShown: false,
        tabBarShowLabel: false,
      }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{tabBarIcon: HomeTabIcon}} />
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
      <Tab.Screen name="Account" component={AccountScreen} options={{tabBarIcon: AccountTabIcon}} />
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
      <RootStack.Navigator screenOptions={{headerShown: false}}>
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
    backgroundColor: '#0A0A0F',
  },
});
