import {useQuery} from '@tanstack/react-query';
import {supabase} from '../lib/supabase';
import type {Console} from '../types/database';

async function fetchConsoles(): Promise<Console[]> {
  const {data, error} = await supabase
    .from('consoles')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export function useConsoles() {
  return useQuery({
    queryKey: ['consoles'],
    queryFn: fetchConsoles,
  });
}

async function fetchConsoleCount(): Promise<number> {
  const {count, error} = await supabase
    .from('consoles')
    .select('*', {count: 'exact', head: true});
  if (error) throw error;
  return count ?? 0;
}

export function useConsoleCount() {
  return useQuery({
    queryKey: ['consoles', 'count'],
    queryFn: fetchConsoleCount,
  });
}
