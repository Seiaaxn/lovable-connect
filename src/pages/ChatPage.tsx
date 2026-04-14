import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { db } from '@/integrations/firebase/config';
import { ref, get } from 'firebase/database';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Profile } from '@/hooks/useProfile';

export default function ChatPage() {
  const { friendId } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useChat(friendId || null);
  const [input, setInput] = useState('');
  const [friendProfile, setFriendProfile] = useState<Profile | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (friendId) {
      get(ref(db, `profiles/${friendId}`))
        .then((snap) => { if (snap.exists()) setFriendProfile({ ...snap.val(), user_id: friendId } as Profile); });
    }
  }, [friendId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  if (!user) return null;

  return (
    <main className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-3 h-14 px-4">
          <Link to="/friends" className="p-1"><ArrowLeft className="w-5 h-5 text-foreground" /></Link>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {friendProfile?.avatar_url ? <img src={friendProfile.avatar_url} className="w-full h-full object-cover" /> :
              <span className="text-xs font-bold text-primary">{(friendProfile?.display_name || '?').charAt(0).toUpperCase()}</span>}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{friendProfile?.display_name || 'Loading...'}</p>
            <p className="text-[10px] text-muted-foreground">Lv.{friendProfile?.level || 1}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> :
          messages.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">Mulai percakapan!</p> :
          messages.map((msg, i) => {
            const isMe = msg.sender_id === user.uid;
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${isMe ? 'gradient-bg text-primary-foreground rounded-br-md' : 'bg-card text-foreground rounded-bl-md'}`}>
                  <p>{msg.content}</p>
                  <p className={`text-[9px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-3 bg-background/95 backdrop-blur-lg">
        <div className="flex gap-2 items-end">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ketik pesan..."
            className="flex-1 px-4 py-2.5 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={handleSend} disabled={!input.trim()} className="p-2.5 gradient-bg rounded-2xl text-primary-foreground disabled:opacity-50 transition">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}
