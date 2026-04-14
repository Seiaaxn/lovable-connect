import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ScheduleDay } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Play } from 'lucide-react';

const dayNames: Record<string, string> = { Senin: 'Sen', Selasa: 'Sel', Rabu: 'Rab', Kamis: 'Kam', Jumat: 'Jum', Sabtu: 'Sab', Minggu: 'Min' };
const dayFull: Record<string, string> = { Senin: 'Senin', Selasa: 'Selasa', Rabu: 'Rabu', Kamis: 'Kamis', Jumat: 'Jumat', Sabtu: 'Sabtu', Minggu: 'Minggu' };

function getTodayDay(): string {
  return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];
}

export function ScheduleSection({ schedule }: { schedule: ScheduleDay[] }) {
  const today = getTodayDay();
  const [activeDay, setActiveDay] = useState(schedule.find(s => s.day === today)?.day || schedule[0]?.day || 'Senin');
  const active = schedule.find(s => s.day === activeDay);
  const animeList = active?.anime_list || [];

  return (
    <div className="space-y-4">
      {/* Day Pills */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {schedule.map(day => {
          const isToday = day.day === today;
          const isActive = activeDay === day.day;
          return (
            <button key={day.day} onClick={() => setActiveDay(day.day)} className={cn(
              'flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all min-w-[52px]',
              isActive ? 'gradient-bg text-primary-foreground shadow-lg scale-105' : 'bg-card text-muted-foreground hover:bg-muted border border-border/30',
            )}>
              <span className="text-[10px] opacity-70">{dayNames[day.day]}</span>
              <span className="font-bold text-base mt-0.5">{day.anime_list?.length || 0}</span>
              {isToday && !isActive && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1" />}
              {isToday && isActive && <span className="w-1.5 h-1.5 bg-primary-foreground rounded-full mt-1" />}
            </button>
          );
        })}
      </div>

      {/* Active Day Label */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">{dayFull[activeDay] || activeDay}</span>
        <span className="text-[10px] text-muted-foreground">({animeList.length} anime)</span>
        {activeDay === today && <span className="text-[9px] px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full font-medium">Hari ini</span>}
      </div>

      {/* Anime Grid */}
      <AnimatePresence mode="wait">
        <motion.div key={activeDay} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {animeList.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5">
              {animeList.map((anime, i) => (
                <Link key={`${anime.slug}-${i}`} to={`/anime/${anime.slug}`} className="group">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                    <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="mt-1.5 text-[11px] font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">{anime.title}</h4>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Tidak ada anime untuk hari ini</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
