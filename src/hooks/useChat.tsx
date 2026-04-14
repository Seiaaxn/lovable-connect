import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function useChat(friendId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!user || !friendId) return;
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages((data as Message[]) || []);
    setLoading(false);

    // Mark as read
    if (data?.length) {
      await supabase.from('messages').update({ is_read: true })
        .eq('receiver_id', user.id).eq('sender_id', friendId).eq('is_read', false);
    }
  }, [user, friendId]);

  useEffect(() => {
    fetchMessages();

    if (user && friendId) {
      channelRef.current = supabase
        .channel(`chat-${[user.id, friendId].sort().join('-')}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === user.id && msg.receiver_id === friendId) ||
            (msg.sender_id === friendId && msg.receiver_id === user.id)
          ) {
            setMessages(prev => [...prev, msg]);
            if (msg.sender_id === friendId) {
              supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
            }
          }
        })
        .subscribe();
    }

    return () => { channelRef.current?.unsubscribe(); };
  }, [user, friendId, fetchMessages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !friendId || !content.trim()) return false;
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: friendId,
      content: content.trim(),
    });
    return !error;
  }, [user, friendId]);

  return { messages, loading, sendMessage };
}
