import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/integrations/firebase/config';
import { ref, get, push, remove, update, onValue, off } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user) return;
    // Request push notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const fetchNotifs = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.uid).order('created_at', { ascending: false }).limit(20);
      setNotifications((data as Notification[]) || []);
    };
    fetchNotifs();

    const channel = supabase
      .channel('notif-' + user.uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.uid}` }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        if ('Notification' in window && Notification.permission === 'granted') {
          new window.Notification((payload.new as Notification).title, { body: (payload.new as Notification).message || '' });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); if (!open) markAllRead(); }} className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground transition">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-50"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Notifikasi</span>
              {unreadCount > 0 && <button onClick={markAllRead} className="text-[10px] text-primary font-medium">Tandai dibaca</button>}
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada notifikasi</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`p-3 border-b border-border/50 last:border-0 ${!n.is_read ? 'bg-primary/5' : ''}`}>
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString('id-ID')}</p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
