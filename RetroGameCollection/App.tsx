import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {PostHogProvider} from 'posthog-react-native';
import AppNavigator from './src/navigation/AppNavigator';
import {AppToast} from './src/components/common/AppToast';
import {posthog} from './src/lib/analytics';

// Load vector icon fonts before first render (required on iOS with RN autolinking)
Ionicons.loadFont();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours — game data changes infrequently
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <PostHogProvider client={posthog} autocapture={false}>
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
        <AppToast />
      </QueryClientProvider>
    </PostHogProvider>
  );
}
