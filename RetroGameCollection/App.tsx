import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {PostHogProvider} from 'posthog-react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import {AppToast} from './src/components/common/AppToast';
import {posthog} from './src/lib/analytics';

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
    <SafeAreaProvider>
      <PostHogProvider client={posthog} autocapture={false}>
        <QueryClientProvider client={queryClient}>
          <AppNavigator />
          <AppToast />
        </QueryClientProvider>
      </PostHogProvider>
    </SafeAreaProvider>
  );
}
