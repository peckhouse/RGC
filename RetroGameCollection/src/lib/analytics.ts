import PostHog from 'posthog-react-native';
import {POSTHOG_API_KEY, POSTHOG_HOST} from '../config';

export const posthog = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST,
  disabled: __DEV__,
});

export const Analytics = {
  identify: (userId: string, props?: Record<string, unknown>) =>
    posthog.identify(userId, props),

  reset: () => posthog.reset(),

  screen: (name: string) => posthog.screen(name),

  collectionGameAdded: (p: {gameId: number; consoleId: number; condition: string}) =>
    posthog.capture('collection_game_added', p),

  collectionGameRemoved: () =>
    posthog.capture('collection_game_removed'),

  wishlistGameAdded: (p: {gameId: number; consoleId: number; priority: string}) =>
    posthog.capture('wishlist_game_added', p),

  wishlistGameRemoved: () =>
    posthog.capture('wishlist_game_removed'),

  wishlistMovedToCollection: (p: {gameId: number; consoleId: number}) =>
    posthog.capture('wishlist_moved_to_collection', p),

  paywallViewed: (p: {reason: string}) =>
    posthog.capture('paywall_viewed', p),

  purchaseCompleted: (p: {plan: string}) =>
    posthog.capture('purchase_completed', p),

  purchaseCancelled: (p: {plan: string}) =>
    posthog.capture('purchase_cancelled', p),
};
