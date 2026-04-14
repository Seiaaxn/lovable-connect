import { useState } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MiniPlayerProps {
  streamUrl: string;
  title: string;
  onClose: () => void;
}

export function MiniPlayer({ streamUrl, title, onClose }: MiniPlayerProps) {
  const [minimized, setMinimized] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.5 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.5 }}
        drag
        dragConstraints={{ top: -400, bottom: 100, left: -200, right: 200 }}
        className={`fixed z-50 bottom-20 right-4 rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-black ${minimized ? 'w-40 h-24' : 'w-72 h-44'}`}
        style={{ transition: 'width 0.3s, height 0.3s' }}
      >
        <iframe src={streamUrl} className="w-full h-full" allowFullScreen allow="autoplay; fullscreen" />
        <div className="absolute top-1 right-1 flex gap-1">
          <button onClick={() => setMinimized(!minimized)} className="p-1 bg-black/60 rounded-full text-white hover:bg-black/80">
            {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button onClick={onClose} className="p-1 bg-black/60 rounded-full text-white hover:bg-red-500">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
          <p className="text-[10px] text-white truncate">{title}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
