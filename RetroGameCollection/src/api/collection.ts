import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Toast} from '../components/common/AppToast';
import {supabase} from '../lib/supabase';
import {Analytics} from '../lib/analytics';
import type {UserCollection} from '../types/database';

export type CollectionEntryWithDetails = UserCollection & {
  games: {
    id: number;
    igdb_id: number;
    region: string;
    name: string;
    cover_url: string | null;
    release_date: string | null;
    rating: number | null;
    price_loose: number | null;
    price_complete: number | null;
    price_new: number | null;
    price_box_only: number | null;
  };
  consoles: {
    id: number;
    name: string;
  };
};

async function fetchMyCollection(): Promise<CollectionEntryWithDetails[]> {
  const {data, error} = await supabase
    .from('user_collections')
    .select(`
      *,
      games (id, igdb_id, region, name, cover_url, release_date, rating, price_loose, price_complete, price_new, price_box_only),
      consoles (id, name)
    `)
    .order('created_at', {ascending: false});
  if (error) throw error;
  return data as CollectionEntryWithDetails[];
}

export function useMyCollection() {
  return useQuery({
    queryKey: ['collection'],
    queryFn: fetchMyCollection,
  });
}

export function useAddToCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gameId,
      consoleId,
      condition = 'loose',
    }: {
      gameId: number;
      consoleId: number;
      condition?: UserCollection['condition'];
    }) => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const {error} = await supabase.from('user_collections').insert({
        user_id: user.id,
        game_id: gameId,
        console_id: consoleId,
        condition,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: ['collection']});
      Toast.show({type: 'success', text1: 'Added to collection', visibilityTime: 2500});
      Analytics.collectionGameAdded({
        gameId: variables.gameId,
        consoleId: variables.consoleId,
        condition: variables.condition ?? 'loose',
      });
    },
    onError: () => {
      Toast.show({type: 'error', text1: 'Something went wrong', text2: 'Could not add to collection', visibilityTime: 3000});
    },
  });
}

export function useRemoveFromCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const {error} = await supabase
        .from('user_collections')
        .delete()
        .eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['collection']});
      Toast.show({type: 'success', text1: 'Removed from collection', visibilityTime: 2500});
      Analytics.collectionGameRemoved();
    },
    onError: () => {
      Toast.show({type: 'error', text1: 'Something went wrong', text2: 'Could not remove copy', visibilityTime: 3000});
    },
  });
}
