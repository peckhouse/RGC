import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Toast} from '../components/common/AppToast';
import {supabase} from '../lib/supabase';
import {Analytics} from '../lib/analytics';
import type {UserWishlist} from '../types/database';

export type WishlistEntryWithDetails = UserWishlist & {
  games: {
    id: number;
    region: string;
    name: string;
    cover_url: string | null;
    release_date: string | null;
    rating: number | null;
  };
  consoles: {
    id: number;
    name: string;
  };
};

async function fetchMyWishlist(): Promise<WishlistEntryWithDetails[]> {
  const {data, error} = await supabase
    .from('user_wishlists')
    .select(`
      *,
      games (id, region, name, cover_url, release_date, rating),
      consoles (id, name)
    `)
    .order('created_at', {ascending: false});
  if (error) throw error;
  return data as WishlistEntryWithDetails[];
}

export function useMyWishlist() {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchMyWishlist,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gameId,
      consoleId,
      priority = 'medium',
    }: {
      gameId: number;
      consoleId: number;
      priority?: UserWishlist['priority'];
    }) => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const {error} = await supabase.from('user_wishlists').insert({
        user_id: user.id,
        game_id: gameId,
        console_id: consoleId,
        priority,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: ['wishlist']});
      Toast.show({type: 'success', text1: 'Added to wishlist', visibilityTime: 2500});
      Analytics.wishlistGameAdded({
        gameId: variables.gameId,
        consoleId: variables.consoleId,
        priority: variables.priority ?? 'medium',
      });
    },
    onError: () => {
      Toast.show({type: 'error', text1: 'Something went wrong', text2: 'Could not add to wishlist', visibilityTime: 3000});
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const {error} = await supabase
        .from('user_wishlists')
        .delete()
        .eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['wishlist']});
      Toast.show({type: 'success', text1: 'Removed from wishlist', visibilityTime: 2500});
      Analytics.wishlistGameRemoved();
    },
    onError: () => {
      Toast.show({type: 'error', text1: 'Something went wrong', text2: 'Could not remove from wishlist', visibilityTime: 3000});
    },
  });
}

export function useUpdateWishlistPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      priority,
    }: {
      entryId: string;
      priority: UserWishlist['priority'];
    }) => {
      const {error} = await supabase
        .from('user_wishlists')
        .update({priority})
        .eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['wishlist']});
    },
  });
}

/** Remove from wishlist and add to collection in one operation. */
export function useMoveToCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      gameId,
      consoleId,
    }: {
      entryId: string;
      gameId: number;
      consoleId: number;
    }) => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const [{error: delErr}, {error: insErr}] = await Promise.all([
        supabase.from('user_wishlists').delete().eq('id', entryId),
        supabase
          .from('user_collections')
          .insert({user_id: user.id, game_id: gameId, console_id: consoleId}),
      ]);
      if (delErr) throw delErr;
      if (insErr) throw insErr;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: ['wishlist']});
      queryClient.invalidateQueries({queryKey: ['collection']});
      Toast.show({type: 'success', text1: 'Moved to collection', text2: 'Removed from wishlist', visibilityTime: 3000});
      Analytics.wishlistMovedToCollection({
        gameId: variables.gameId,
        consoleId: variables.consoleId,
      });
    },
    onError: () => {
      Toast.show({type: 'error', text1: 'Something went wrong', text2: 'Could not move to collection', visibilityTime: 3000});
    },
  });
}
