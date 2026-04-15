import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { db } from '@/integrations/firebase/config';
import { ref, get, push, remove, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Link } from 'react-router-dom';
import { getLevelBadge } from '@/lib/levelUtils';
import { Send, MessageSquare, Trash2, Crown, Loader2, Users, Reply, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiscussionMessage {
  id: string;
  user_id: string;
  room: string;
  message: string;
  created_at: string;
  reply_to?: { id: string; user_name: string; text: string } | null;
  image_url?: string | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    level: number;
    badge: string | null;
    is_premium: boolean;
    user_id: string;
  };
}

const ROOMS = [
  { id: 'general', label: 'Umum', desc: 'Diskusi bebas', emoji: '💬' },
  { id: 'anime', label: 'Anime', desc: 'Bahas anime favorit', emoji: '🎬' },
  { id: 'donghua', label: 'Donghua', desc: 'Diskusi donghua', emoji: '🐉' },
  { id: 'comic', label: 'Komik', desc: 'Diskusi komik', emoji: '📚' },
  { id: 'offtopic', label: 'Off-Topic', desc: 'Topik bebas', emoji: '🎲' },
];

export default function DiscussionPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activeRoom, setActiveRoom] = useState('general');
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<{ user_id: string; display_name: string; avatar_url: string | null }[]>([]);
  const [replyTo, setReplyTo] = useState<{ id: string; user_name: string; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Online presence tracking
  useEffect(() => {
    if (!user || !profile) return;
    const presenceRef = ref(db, `presence/${user.uid}`);
    const connectedRef = ref(db, '.info/connected');

    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(presenceRef, {
          user_id: user.uid,
          display_name: profile.display_name || user.displayName || 'User',
          avatar_url: profile.avatar_url || user.photoURL,
          online: true,
          last_seen: new Date().toISOString(),
        });
        onDisconnect(presenceRef).remove();
      }
    });

    return () => {
      unsub();
      remove(presenceRef);
    };
  }, [user, profile]);

  // Listen to online users
  useEffect(() => {
    const presenceRef = ref(db, 'presence');
    const unsub = onValue(presenceRef, (snap) => {
      const users: typeof onlineUsers = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          const val = child.val();
          if (val.online) users.push({ user_id: val.user_id, display_name: val.display_name, avatar_url: val.avatar_url });
        });
      }
      setOnlineUsers(users);
    });
    return () => unsub();
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const roomRef = ref(db, `discussions/${activeRoom}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      const data: any[] = [];
      snapshot.forEach((child) => { data.push({ ...child.val(), id: child.key! }); });
      data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const userIds = [...new Set(data.map(d => d.user_id))];
      const profiles: Record<string, any> = {};
      for (const uid of userIds) {
        const pSnap = await get(ref(db, `profiles/${uid}`));
        if (pSnap.exists()) profiles[uid] = { ...pSnap.val(), user_id: uid };
      }
      setMessages(data.map(d => ({ ...d, profile: profiles[d.user_id] })).slice(-100));
    } else {
      setMessages([]);
    }
    setLoading(false);
  }, [activeRoom]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const roomRef = ref(db, `discussions/${activeRoom}`);
    const unsub = onValue(roomRef, () => { fetchMessages(); });
    return () => unsub();
  }, [activeRoom, fetchMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;
    const msgData: any = {
      user_id: user.uid,
      room: activeRoom,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
    };
    if (replyTo) {
      msgData.reply_to = replyTo;
    }
    await push(ref(db, `discussions/${activeRoom}`), msgData);
    setNewMessage('');
    setReplyTo(null);
  };

  const handleDelete = async (id: string) => {
    await remove(ref(db, `discussions/${activeRoom}/${id}`));
  };

  const handleReply = (msg: DiscussionMessage) => {
    setReplyTo({
      id: msg.id,
      user_name: msg.profile?.display_name || 'User',
      text: msg.message.slice(0, 80),
    });
    inputRef.current?.focus();
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const currentRoom = ROOMS.find(r => r.id === activeRoom)!;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col pb-16">
        {/* Room Tabs */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-display font-bold text-foreground">Diskusi Publik</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 5).map((u) => (
                  <div key={u.user_id} className="w-6 h-6 rounded-full border-2 border-background overflow-hidden bg-secondary">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-[9px] font-bold text-secondary-foreground">
                        {(u.display_name || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground">{onlineUsers.length} online</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {ROOMS.map(room => (
              <button
                key={room.id}
                onClick={() => { setActiveRoom(room.id); setReplyTo(null); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1 ${
                  activeRoom === room.id
                    ? 'gradient-bg text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{room.emoji}</span>
                {room.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{currentRoom.desc} • {messages.length} pesan</p>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 space-y-3 py-2"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada pesan di room ini</p>
              <p className="text-xs text-muted-foreground mt-1">Jadilah yang pertama berkomentar!</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isMe = user?.uid === msg.user_id;
                const badge = msg.profile ? getLevelBadge(msg.profile.level) : null;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <Link to={`/user/${msg.user_id}`} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {msg.profile?.avatar_url ? (
                        <img src={msg.profile.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-xs font-bold text-secondary-foreground">
                          {(msg.profile?.display_name || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </Link>
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        {!isMe && (
                          <>
                            <Link to={`/user/${msg.user_id}`} className="text-xs font-medium text-foreground hover:text-primary transition">
                              {msg.profile?.display_name || 'User'}
                            </Link>
                            {badge && <span className="text-[10px]">{badge.emoji}</span>}
                            <span className="text-[9px] text-primary bg-primary/10 px-1 py-0.5 rounded">Lv.{msg.profile?.level || 1}</span>
                            {msg.profile?.is_premium && <Crown className="w-3 h-3 text-yellow-500" />}
                          </>
                        )}
                      </div>
                      {/* Reply preview */}
                      {msg.reply_to && (
                        <div className={`px-2 py-1 mb-1 rounded-lg border-l-2 border-primary/50 bg-muted/50 text-[10px] ${isMe ? 'text-right' : ''}`}>
                          <span className="font-medium text-primary">{msg.reply_to.user_name}</span>
                          <p className="text-muted-foreground truncate">{msg.reply_to.text}</p>
                        </div>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'gradient-bg text-primary-foreground rounded-tr-sm'
                          : 'bg-card text-foreground rounded-tl-sm'
                      }`}>
                        <p className="break-words">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                        {user && (
                          <button onClick={() => handleReply(msg)} className="text-muted-foreground hover:text-primary">
                            <Reply className="w-3 h-3" />
                          </button>
                        )}
                        {isMe && (
                          <button onClick={() => handleDelete(msg.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Input */}
        {user && profile ? (
          <div className="px-4 py-3 bg-card/80 backdrop-blur-lg border-t border-border/50">
            {/* Reply indicator */}
            {replyTo && (
              <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-muted rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <Reply className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium text-primary">{replyTo.user_name}</span>
                    <p className="text-[10px] text-muted-foreground truncate">{replyTo.text}</p>
                  </div>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground text-xs ml-2">✕</button>
              </div>
            )}
            <form onSubmit={handleSend} className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={`Tulis pesan di ${currentRoom.label}...`}
                rows={1}
                maxLength={500}
                className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 rounded-xl gradient-bg text-primary-foreground disabled:opacity-30"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="px-4 py-3 bg-card/80 backdrop-blur-lg border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              <Link to="/login" className="text-primary font-medium">Masuk</Link> untuk bergabung diskusi
            </p>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
