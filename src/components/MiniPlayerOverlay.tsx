import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMiniPlayer } from './MiniPlayerContext';

export function MiniPlayerOverlay() {
  const navigate = useNavigate();
  const { miniPlayer, closeMiniPlayer } = useMiniPlayer();
  const [minimized, setMinimized] = useState(false);

  if (!miniPlayer) return null;

  const handleClick = () => {
    closeMiniPlayer();
    navigate(miniPlayer.watchPath);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.5 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.5 }}
        drag
        dragConstraints={{ top: -400, bottom: 100, left: -200, right: 200 }}
        className={`fixed z-50 bottom-20 right-4 rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-background ${minimized ? 'w-40 h-24' : 'w-72 h-44'}`}
        style={{ transition: 'width 0.3s, height 0.3s' }}
      >
        <div onClick={handleClick} className="w-full h-full cursor-pointer">
          <iframe src={miniPlayer.streamUrl} className="w-full h-full pointer-events-none" allowFullScreen allow="autoplay; fullscreen" />
        </div>
        <div className="absolute top-1 right-1 flex gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => setMinimized(!minimized)} className="p-1 bg-background/60 rounded-full text-foreground hover:bg-background/80">
            {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button onClick={closeMiniPlayer} className="p-1 bg-background/60 rounded-full text-foreground hover:bg-destructive hover:text-destructive-foreground">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-1.5 pointer-events-none">
          <p className="text-[10px] text-foreground truncate">{miniPlayer.title}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
