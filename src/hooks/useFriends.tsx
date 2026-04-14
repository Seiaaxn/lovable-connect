import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Profile } from './useProfile';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<(Friendship & { friend_profile?: Profile })[]>([]);
  const [pendingRequests, setPendingRequests] = useState<(Friendship & { requester_profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Accepted friends
    const { data: accepted } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (accepted) {
      const friendIds = accepted.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', friendIds);
      const enriched = accepted.map(f => {
        const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        return { ...f, friend_profile: (profiles as Profile[])?.find(p => p.user_id === friendId) };
      });
      setFriends(enriched);
    }

    // Pending requests (where I am the addressee)
    const { data: pending } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'pending')
      .eq('addressee_id', user.id);

    if (pending) {
      const requesterIds = pending.map(p => p.requester_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', requesterIds);
      const enriched = pending.map(p => ({
        ...p,
        requester_profile: (profiles as Profile[])?.find(pr => pr.user_id === p.requester_id),
      }));
      setPendingRequests(enriched);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const sendRequest = useCallback(async (addresseeId: string) => {
    if (!user) return false;
    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: addresseeId,
    });
    if (!error) { await fetchFriends(); return true; }
    return false;
  }, [user, fetchFriends]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    if (!error) { await fetchFriends(); return true; }
    return false;
  }, [fetchFriends]);

  const rejectRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    if (!error) { await fetchFriends(); return true; }
    return false;
  }, [fetchFriends]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    if (!error) { await fetchFriends(); return true; }
    return false;
  }, [fetchFriends]);

  return { friends, pendingRequests, loading, sendRequest, acceptRequest, rejectRequest, removeFriend, fetchFriends };
}
