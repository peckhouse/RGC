import {useQuery, useQueryClient} from '@tanstack/react-query';
import {checkProStatus} from '../lib/purchases';

export function useProStatus() {
  const queryClient = useQueryClient();
  const {data: isPro = false, isLoading} = useQuery({
    queryKey: ['pro-status'],
    queryFn: checkProStatus,
    staleTime: 1000 * 60 * 5, // recheck every 5 min
  });
  const refresh = () =>
    queryClient.invalidateQueries({queryKey: ['pro-status']});
  return {isPro, isLoading, refresh};
}
