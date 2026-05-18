import {useQuery, useInfiniteQuery} from '@tanstack/react-query';
import {supabase} from '../lib/supabase';
import type {Game} from '../types/database';

const PAGE_SIZE = 1000;

type RegionCode = 'EU' | 'NA' | 'JP';

async function fetchGamesPage({
  consoleId,
  region,
  search,
  page,
}: {
  consoleId: number;
  region: RegionCode;
  search: string;
  page: number;
}): Promise<Game[]> {
  const from = page * PAGE_SIZE;
  let query = supabase
    .from('games')
    .select('*')
    .eq('platform_id', consoleId)
    .eq('region', region)
    .order('name')
    .range(from, from + PAGE_SIZE - 1);

  if (search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  const {data, error} = await query;
  if (error) throw error;
  return data ?? [];
}

export function useGamesByConsole(
  consoleId: number,
  region: RegionCode,
  search: string,
) {
  return useInfiniteQuery({
    queryKey: ['games', 'console', consoleId, region, search],
    queryFn: ({pageParam}) =>
      fetchGamesPage({consoleId, region, search, page: pageParam}),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined,
  });
}

async function fetchGameCount(): Promise<number> {
  const {count, error} = await supabase
    .from('games')
    .select('*', {count: 'exact', head: true});
  if (error) throw error;
  return count ?? 0;
}

export function useGameCount() {
  return useQuery({
    queryKey: ['games', 'count'],
    queryFn: fetchGameCount,
  });
}

async function fetchGame(gameId: number): Promise<Game> {
  const {data, error} = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();
  if (error) throw error;
  return data;
}

export function useGame(gameId: number) {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: () => fetchGame(gameId),
  });
}

async function fetchGameStatsForConsoleRegion(
  consoleId: number,
  region: RegionCode,
): Promise<{total: number; owned: number}> {
  // Total games for this console + region
  const {count: total, error: totalErr} = await supabase
    .from('games')
    .select('*', {count: 'exact', head: true})
    .eq('platform_id', consoleId)
    .eq('region', region);
  if (totalErr) throw totalErr;

  // Owned games: count collection entries for this console whose game_id
  // is in the set of game IDs for this region
  const {data: {user} = {user: null}} = await supabase.auth.getUser();
  let owned = 0;
  if (user) {
    // Get all game IDs for this console + region
    const {data: regionGameIds, error: gamesErr} = await supabase
      .from('games')
      .select('id')
      .eq('platform_id', consoleId)
      .eq('region', region);
    if (gamesErr) throw gamesErr;

    if (regionGameIds && regionGameIds.length > 0) {
      const ids = regionGameIds.map((g: any) => g.id as number);
      const {data: ownedRows, error: ownedErr} = await supabase
        .from('user_collections')
        .select('game_id')
        .eq('user_id', user.id)
        .eq('console_id', consoleId)
        .in('game_id', ids);
      if (ownedErr) throw ownedErr;
      owned = new Set((ownedRows ?? []).map((r: any) => r.game_id as number)).size;
    }
  }

  return {total: total ?? 0, owned};
}

export function useGameStatsForConsoleRegion(consoleId: number, region: RegionCode) {
  return useQuery({
    queryKey: ['games', 'stats', 'console', consoleId, region],
    queryFn: () => fetchGameStatsForConsoleRegion(consoleId, region),
    staleTime: 5 * 60 * 1000,
  });
}

async function fetchGameCountForConsole(consoleId: number): Promise<number> {
  const {count, error} = await supabase
    .from('games')
    .select('*', {count: 'exact', head: true})
    .eq('platform_id', consoleId);
  if (error) throw error;
  return count ?? 0;
}

export function useGameCountForConsole(consoleId: number) {
  return useQuery({
    queryKey: ['games', 'count', 'console', consoleId],
    queryFn: () => fetchGameCountForConsole(consoleId),
    staleTime: 5 * 60 * 1000,
  });
}

export type IGDBImageSize =
  | 't_thumb'        // 90×128
  | 't_cover_small'  // 90×128
  | 't_cover_big'    // 264×374
  | 't_logo_med'     // 284×160
  | 't_screenshot_med'   // 569×320
  | 't_screenshot_big'   // 889×500
  | 't_720p'         // 1280×720
  | 't_1080p';       // 1920×1080

/** Build an IGDB image URL from an image_id and optional size (defaults to cover_big). */
export function igdbImageUrl(
  imageId: string | null | undefined,
  size: IGDBImageSize = 't_cover_big',
): string | null {
  if (!imageId) return null;
  if (imageId.startsWith('http://') || imageId.startsWith('https://')) return imageId;
  return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
}
