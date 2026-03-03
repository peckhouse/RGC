import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {supabase} from '../lib/supabase';
import type {Profile} from '../types/database';

export function useProfile() {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const {data, error} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateUsername() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const {error} = await supabase
        .from('profiles')
        .update({username})
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['profile']}),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (uri: string) => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Read the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const path = `${user.id}/avatar.jpg`;
      const {error: uploadError} = await supabase.storage
        .from('avatars')
        .upload(path, uint8Array, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const {data: urlData} = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Append cache-bust so Image component re-renders
      const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;

      const {error: updateError} = await supabase
        .from('profiles')
        .update({avatar_url})
        .eq('id', user.id);
      if (updateError) throw updateError;

      return avatar_url;
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['profile']}),
  });
}

export async function linkReferralCode(userId: string, code: string): Promise<void> {
  const {error} = await supabase
    .from('profiles')
    .update({referred_by: code.toUpperCase()})
    .eq('id', userId);
  if (error) {
    console.warn('Failed to link referral code:', error.message);
  }
}

export function useReferralCount() {
  return useQuery<number>({
    queryKey: ['referral-count'],
    queryFn: async () => {
      const {data, error} = await supabase.rpc('get_referral_count');
      if (error) throw error;
      return data as number;
    },
  });
}
