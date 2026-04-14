import { createContext, useContext, useState, ReactNode } from 'react';

interface MiniPlayerState {
  streamUrl: string;
  title: string;
  watchPath: string; // path to navigate to when clicking mini player
}

interface MiniPlayerContextType {
  miniPlayer: MiniPlayerState | null;
  showMiniPlayer: (state: MiniPlayerState) => void;
  closeMiniPlayer: () => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextType>({
  miniPlayer: null,
  showMiniPlayer: () => {},
  closeMiniPlayer: () => {},
});

export function MiniPlayerProvider({ children }: { children: ReactNode }) {
  const [miniPlayer, setMiniPlayer] = useState<MiniPlayerState | null>(null);

  return (
    <MiniPlayerContext.Provider value={{
      miniPlayer,
      showMiniPlayer: setMiniPlayer,
      closeMiniPlayer: () => setMiniPlayer(null),
    }}>
      {children}
    </MiniPlayerContext.Provider>
  );
}

export const useMiniPlayer = () => useContext(MiniPlayerContext);
