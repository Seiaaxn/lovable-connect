import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { FavoriteButton } from '@/components/FavoriteButton';
import { getAnimeDetail } from '@/lib/api';
import type { AnimeDetail } from '@/lib/types';
import { Loader2, ArrowLeft, Play, Star } from 'lucide-react';

export default function AnimeDetailPage() {
  const { animeId } = useParams<{ animeId: string }>();
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllEps, setShowAllEps] = useState(false);

  useEffect(() => {
    if (!animeId) return;
    setLoading(true);
    getAnimeDetail(animeId).then(d => { setDetail(d); setLoading(false); }).catch(() => setLoading(false));
  }, [animeId]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!detail) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Anime tidak ditemukan</div>;

  const eps = showAllEps ? detail.episodeList : detail.episodeList.slice(0, 20);

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary"><ArrowLeft className="w-5 h-5" /><span className="text-sm font-medium">Kembali</span></Link>
          <FavoriteButton contentId={animeId!} type="anime" title={detail.title} poster={detail.poster} />
        </div>
      </header>

      <div className="relative">
        <img src={detail.poster} alt={detail.title} className="w-full h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="px-4 -mt-20 relative z-10 space-y-4">
        <div className="flex gap-4">
          <img src={detail.poster} alt={detail.title} className="w-28 h-40 rounded-lg object-cover shadow-lg flex-shrink-0" />
          <div className="flex-1 pt-8 space-y-2">
            <h1 className="text-lg font-display font-bold text-foreground line-clamp-2">{detail.title}</h1>
            {detail.score && (
              <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /><span className="text-sm font-medium text-yellow-400">{detail.score}</span></div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {detail.genreList?.map(g => (
                <Link key={g.genreId} to={`/genre/${g.genreId}`} className="text-[10px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{g.title}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {detail.type && <div><span className="font-medium text-foreground">Tipe:</span> {detail.type}</div>}
          {detail.status && <div><span className="font-medium text-foreground">Status:</span> {detail.status}</div>}
          {detail.episodes && <div><span className="font-medium text-foreground">Episode:</span> {detail.episodes}</div>}
          {detail.studios && <div><span className="font-medium text-foreground">Studio:</span> {detail.studios}</div>}
        </div>

        {detail.synopsis && (
          <div>
            <h3 className="font-display font-bold text-foreground mb-1">Sinopsis</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{detail.synopsis.paragraphs.join('\n')}</p>
          </div>
        )}

        <div>
          <h3 className="font-display font-bold text-foreground mb-2">Episode ({detail.episodeList.length})</h3>
          <div className="space-y-1.5">
            {eps.map(ep => (
              <Link key={ep.episodeId} to={`/watch/${ep.episodeId}`} className="flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-card/80 transition group">
                <Play className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition">{ep.title}</p>
                  <p className="text-[10px] text-muted-foreground">{ep.date}</p>
                </div>
              </Link>
            ))}
          </div>
          {detail.episodeList.length > 20 && !showAllEps && (
            <button onClick={() => setShowAllEps(true)} className="w-full mt-2 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg">Lihat Semua Episode</button>
          )}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
