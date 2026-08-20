import {useCallback, useEffect} from 'react';
import {AppState} from 'react-native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {checkProStatus, isProCustomer, onCustomerInfoUpdate} from '../lib/purchases';

export function useProStatus() {
  const queryClient = useQueryClient();
  const {data: isPro = false, isLoading} = useQuery({
    queryKey: ['pro-status'],
    queryFn: checkProStatus,
    staleTime: 1000 * 60, // recheck at most once a minute
  });

  useEffect(
    () =>
      onCustomerInfoUpdate(info => {
        queryClient.setQueryData(['pro-status'], isProCustomer(info));
      }),
    [queryClient],
  );

  // A subscription can also change outside the app (App Store settings, family
  // sharing, an interrupted purchase finishing later), so re-check on return
  // to the foreground rather than waiting for a screen to remount.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        queryClient.invalidateQueries({queryKey: ['pro-status']});
      }
    });
    return () => sub.remove();
  }, [queryClient]);

  const refresh = useCallback(
    () => queryClient.invalidateQueries({queryKey: ['pro-status']}),
    [queryClient],
  );
  // Applied straight to the cache so every gate in the app sees Pro on the
  // same tick a purchase or restore succeeds, with no window where a paid
  // customer can be pushed back to the paywall.
  const setPro = useCallback(
    (value: boolean) => {
      queryClient.setQueryData(['pro-status'], value);
    },
    [queryClient],
  );
  return {isPro, isLoading, refresh, setPro};
}
