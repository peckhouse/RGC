import {useEffect} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {PRO_ENTITLEMENT, checkProStatus, onCustomerInfoUpdate} from '../lib/purchases';

export function useProStatus() {
  const queryClient = useQueryClient();
  const {data: isPro = false, isLoading} = useQuery({
    queryKey: ['pro-status'],
    queryFn: checkProStatus,
    staleTime: 1000 * 60 * 5, // recheck every 5 min
  });
  useEffect(
    () =>
      onCustomerInfoUpdate(info => {
        const nextIsPro = PRO_ENTITLEMENT in info.entitlements.active;
        queryClient.setQueryData(['pro-status'], nextIsPro);
      }),
    [queryClient],
  );
  const refresh = () =>
    queryClient.invalidateQueries({queryKey: ['pro-status']});
  return {isPro, isLoading, refresh};
}
