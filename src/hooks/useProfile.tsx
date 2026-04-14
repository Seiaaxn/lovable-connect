import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  exp: number;
  coins: number;
  is_premium: boolean;
  premium_expires_at: string | null;
  badge: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    setProfile(data as Profile | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const addExp = useCallback(async (amount: number, _source?: string, _contentId?: string, _contentTitle?: string) => {
    if (!user) return null;
    const { error } = await supabase.rpc('add_exp', {
      p_user_id: user.id,
      p_amount: amount,
    });
    if (!error) {
      await fetchProfile();
      return true;
    }
    return null;
  }, [user, fetchProfile]);

  const buyPremium = useCallback(async (days: number, cost: number) => {
    if (!user || !profile || profile.coins < cost) return false;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    const { error } = await supabase.from('profiles').update({
      is_premium: true,
      premium_expires_at: expiresAt.toISOString(),
      coins: profile.coins - cost,
    }).eq('user_id', user.id);
    if (!error) { await fetchProfile(); return true; }
    return false;
  }, [user, profile, fetchProfile]);

  const addCoins = useCallback(async (amount: number) => {
    if (!user || !profile) return false;
    const { error } = await supabase.from('profiles').update({
      coins: profile.coins + amount,
    }).eq('user_id', user.id);
    if (!error) { await fetchProfile(); return true; }
    return false;
  }, [user, profile, fetchProfile]);

  return { profile, loading, addExp, buyPremium, addCoins, fetchProfile };
}
