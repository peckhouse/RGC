import {useQuery} from '@tanstack/react-query';
import {supabase} from '../lib/supabase';
import type {Game} from '../types/database';

async function fetchGamesByConsole(consoleId: number): Promise<Game[]> {
  // Paginate in chunks of 1000 to work around PostgREST's max_rows cap.
  const PAGE_SIZE = 1000;
  const allGames: Game[] = [];
  let from = 0;

  while (true) {
    const {data, error} = await supabase
      .from('games')
      .select('*')
      .eq('platform_id', consoleId)
      .order('name')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    allGames.push(...(data ?? []));
    if ((data ?? []).length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allGames;
}

export function useGamesByConsole(consoleId: number) {
  return useQuery({
    queryKey: ['games', 'console', consoleId],
    queryFn: () => fetchGamesByConsole(consoleId),
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

async function fetchGameCountByConsole(consoleId: number): Promise<number> {
  const PAGE_SIZE = 1000;
  const allIds: number[] = [];
  let from = 0;

  while (true) {
    const {data, error} = await supabase
      .from('games')
      .select('igdb_id')
      .eq('platform_id', consoleId)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    allIds.push(...(data ?? []).map(g => (g as any).igdb_id));
    if ((data ?? []).length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  // Count distinct igdb_ids — each physical game is one, regardless of EU/NA/JP rows
  return new Set(allIds).size;
}

export function useGameCountByConsole(consoleId: number) {
  return useQuery({
    queryKey: ['games', 'count', 'console', consoleId],
    queryFn: () => fetchGameCountByConsole(consoleId),
    staleTime: 24 * 60 * 60 * 1000,
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
