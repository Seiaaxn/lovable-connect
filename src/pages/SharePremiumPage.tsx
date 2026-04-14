import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Gift, Users, Loader2, Check, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Friend {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
}

export default function SharePremiumPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!profile?.is_premium) { navigate('/premium'); return; }
    fetchFriends();
  }, [user, profile]);

  const fetchFriends = async () => {
    if (!user) return;
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, is_premium')
        .in('user_id', friendIds);
      setFriends((profiles as Friend[]) || []);
    }
    setLoading(false);
  };

  const sharePremium = async (friendId: string) => {
    if (!profile || sharing) return;
    setSharing(friendId);

    const SHARE_COST = 30000; // coins
    const SHARE_DAYS = 30; // 30 days of premium

    if (profile.coins < SHARE_COST) {
      toast.error(`Koin tidak cukup! Butuh ${SHARE_COST} koin`);
      setSharing(null);
      return;
    }

    // Deduct coins from sharer
    await supabase.from('profiles').update({ coins: profile.coins - SHARE_COST }).eq('user_id', user!.id);

    // Give premium to friend
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SHARE_DAYS);
    await supabase.from('profiles').update({
      is_premium: true,
      premium_expires_at: expiresAt.toISOString(),
    }).eq('user_id', friendId);

    // Send notification
    const friendProfile = friends.find(f => f.user_id === friendId);
    await supabase.from('notifications').insert([{
      user_id: friendId,
      title: 'Premium Diterima!',
      message: `${profile.display_name || 'Seseorang'} berbagi premium ${SHARE_DAYS} hari denganmu!`,
      type: 'gift',
    }]);

    setFriends(prev => prev.map(f => f.user_id === friendId ? { ...f, is_premium: true } : f));
    toast.success(`Premium ${SHARE_DAYS} hari diberikan ke ${friendProfile?.display_name || 'teman'}! (-${SHARE_COST} koin)`);
    setSharing(null);
  };

  const filteredFriends = friends.filter(f =>
    !searchQuery || (f.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || !profile?.is_premium) return null;

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="px-4 py-6 space-y-5 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl gradient-bg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-6 h-6 text-primary-foreground" />
              <h1 className="text-lg font-display font-bold text-primary-foreground">Berbagi Premium</h1>
            </div>
            <p className="text-xs text-primary-foreground/80">Berikan 30 hari premium ke teman dengan 30000 koin</p>
            <p className="text-xs text-primary-foreground/60 mt-1">Koin kamu: {profile.coins.toLocaleString()}</p>
          </div>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary-foreground/10 rounded-full blur-xl" />
        </motion.div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari teman..."
            className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : friends.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Belum ada teman</p>
            <p className="text-xs text-muted-foreground mt-1">Tambah teman terlebih dahulu</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFriends.map((friend, i) => (
              <motion.div key={friend.user_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/30">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  {friend.avatar_url ? <img src={friend.avatar_url} className="w-full h-full object-cover" /> :
                    <span className="text-sm font-bold text-secondary-foreground">{(friend.display_name || '?').charAt(0).toUpperCase()}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{friend.display_name || 'User'}</span>
                    {friend.is_premium && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                  </div>
                  {friend.is_premium && <p className="text-[10px] text-yellow-500">Sudah Premium</p>}
                </div>
                <button
                  onClick={() => sharePremium(friend.user_id)}
                  disabled={!!sharing || friend.is_premium}
                  className="px-3 py-1.5 gradient-bg text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition disabled:opacity-40 flex items-center gap-1"
                >
                  {sharing === friend.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> :
                    friend.is_premium ? <Check className="w-3 h-3" /> : <Gift className="w-3 h-3" />}
                  {friend.is_premium ? 'Aktif' : 'Kirim'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
