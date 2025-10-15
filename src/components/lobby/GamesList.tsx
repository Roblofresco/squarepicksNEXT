'use client'

import Image from 'next/image'; // For team logos later
import { Game as GameType, TeamInfo } from '@/types/lobby'; // Import shared type
import Link from 'next/link'; // Import Link
import { User as FirebaseUser } from 'firebase/auth'; // Import User type
import React, { memo, useMemo, useEffect, useRef } from 'react'; // Import React for event type, memo, useMemo
import { Timestamp } from 'firebase/firestore'; // Import Timestamp
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// --- Define Props --- 
interface GameCardProps {
  game: GameType;
  user: FirebaseUser | null;
  onProtectedAction: () => void;
}

interface GamesListProps {
  games: GameType[];
  teams: Record<string, TeamInfo>;
  user: FirebaseUser | null;
  onProtectedAction: () => void;
}

// Helper component for Team Display (Logo + Initials)
const TeamDisplay = memo(({ team }: { team?: TeamInfo }) => {
  if (!team) {
    return (
        <div className="flex flex-col items-center justify-center h-full px-0.5 sm:px-1">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gray-600 rounded-full mb-0.5 sm:mb-1"></div>
            <span className="text-[10px] sm:text-xs text-gray-500 font-bold">N/A</span>
        </div>
    );
  }

  const shadowColorHex = team.seccolor || team.color;
  const filterStyle = useMemo(() => {
    const shadowColorRgba = shadowColorHex 
      ? `${shadowColorHex}99` 
      : 'rgba(255,255,255,0.5)';
    return { filter: `drop-shadow(0 0 5px ${shadowColorRgba})` }; 
  }, [shadowColorHex]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-0.5 sm:px-1">
      {team.logo ? (
        <Image 
          src={team.logo} 
          alt={`${team.initials || team.name} logo`}
          width={28}
          height={28}
          className="object-contain mb-0.5 sm:mb-1 sm:w-10 sm:h-10"
          style={filterStyle}
        />
      ) : (
        <div 
          className="w-7 h-7 sm:w-10 sm:h-10 bg-gray-600 rounded-full mb-0.5 sm:mb-1 flex items-center justify-center text-white text-xs sm:text-sm font-semibold"
          style={filterStyle}
        >
          {team.initials?.substring(0, 3) || 'N/A'}
        </div>
      )}
      <span 
        className="text-[10px] sm:text-xs text-white font-bold"
        style={filterStyle} 
      >
        {team.initials || 'N/A'}
      </span>
    </div>
  );
});
TeamDisplay.displayName = 'TeamDisplay';

// Use props in GameCard
const GameCard = memo(({ game, user, onProtectedAction }: GameCardProps) => {
  const gradientStyle = 'bg-gradient-to-b from-background-primary from-0% to-background-secondary to-50%';
  const shadowStyle = 'shadow-md shadow-slate-700';
  const textShadowStyle = { textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }; 

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
        event.preventDefault();
        onProtectedAction();
    }
  };

  // Format startTime (camelCase preferred, fallback to start_time)
  const formatStartTime = (g: GameType): { timeStr: string; dateStr: string } => {
      const ts: Timestamp | undefined = (g as any).startTime || (g as any).start_time;
      if (!ts) return { timeStr: '--:--', dateStr: '-- --' };
      const date = ts.toDate();
      const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute:'2-digit' });
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return { timeStr, dateStr };
  };
  
  const { timeStr, dateStr } = formatStartTime(game);
  const isLive = (game as any).isLive ?? (game as any).is_live;
  const isOver = (game as any).isOver ?? (game as any).is_over;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <motion.div 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          transition={{ 
            type: "tween", 
            duration: 0.15,
            ease: "easeOut"
          }}
        >
          <Card className="relative w-[150px] sm:w-[240px] bg-gradient-to-b from-background-primary to-background-secondary border-accent-1/20">
            <Link
              href={{
                pathname: `/game/${game.id}`,
                query: { view: isOver ? 'final' : isLive ? 'live' : 'upcoming' }
              }}
              onClick={handleClick}
            >
              <CardContent className="flex items-center justify-between p-0.5 sm:p-2 h-[50px] sm:h-[90px]">
                {/* Left Column: Team A */}
                <div className="w-1/4 flex items-center justify-center h-full"> 
                  <TeamDisplay team={game.teamA} />
                </div>
                {/* Center Column: Game Details */}
                <div className="flex flex-col items-center justify-center w-1/2 text-center px-0.5 sm:px-1"> 
                  {isLive && (
                    <span className="mb-0.5 sm:mb-1 px-2 py-0.5 text-[0.55rem] sm:text-[0.6rem] font-semibold uppercase tracking-wide text-white bg-red-600 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.45)] animate-pulse">
                      Live
                    </span>
                  )}
                  {!isLive && isOver && (
                    <span className="mb-0.5 sm:mb-1 px-2 py-0.5 text-[0.55rem] sm:text-[0.6rem] font-semibold uppercase tracking-wide text-white bg-gray-600 rounded-full">
                      Final
                    </span>
                  )}
                  <div className="text-xs sm:text-sm font-bold mb-0.5 sm:mb-1 text-white"> 
                    {(isLive || isOver) ? `${(game.awayScore ?? game.away_score) ?? 0} - ${(game.homeScore ?? game.home_score) ?? 0}` : 'VS'}
                  </div>
                  {!isOver && (
                    <div className="text-[10px] sm:text-xs text-text-secondary mb-0.5 leading-tight"> 
                      {isLive ? (
                        <div className="flex flex-col items-center gap-1">
                          <span>{(() => {
                            const period = game.period || (game.quarter as any);
                            if (!period) return 'Live';
                            const periodStr = String(period).toLowerCase();
                            if (periodStr === '1' || periodStr.includes('1')) return '1st Qtr';
                            if (periodStr === '2' || periodStr.includes('2')) return '2nd Qtr';
                            if (periodStr === '3' || periodStr.includes('3')) return '3rd Qtr';
                            if (periodStr === '4' || periodStr.includes('4')) return '4th Qtr';
                            return period;
                          })()}</span>
                          
                          {/* Time Remaining - Indented Container */}
                          {((game as any).timeRemaining || (game as any).time_remaining) && (
                            <div className="px-2 py-0.5 rounded-md border border-white/10 bg-slate-950/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                              <span className="text-[9px] sm:text-[10px] text-slate-300 font-mono tabular-nums">
                                {(game as any).timeRemaining || (game as any).time_remaining}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0">
                          <span className="whitespace-nowrap">{timeStr}</span>
                          <span className="whitespace-nowrap text-[9px] sm:text-[10px]">{dateStr}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {(game.broadcastProvider || game.broadcast_provider) && (
                    <div 
                      className="text-[0.55rem] sm:text-[0.65rem] text-gray-400 hover:text-accent-1 font-medium truncate w-full transition-colors cursor-pointer group"
                      title="Watch this game"
                    >
                      Watch on <span className="group-hover:underline">{game.broadcastProvider || game.broadcast_provider}</span>
                    </div>
                  )}
                </div>
                {/* Right Column: Team B */}
                <div className="w-1/4 flex items-center justify-center h-full"> 
                  <TeamDisplay team={game.teamB} />
                </div>
              </CardContent>
            </Link>
          </Card>
        </motion.div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-background-primary/95 backdrop-blur-sm border-accent-1/20">
        <div className="flex justify-between space-x-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">{game.teamA?.fullName} vs {game.teamB?.fullName}</h4>
            <div className="text-sm text-white/70">
              {isLive ? (
                <span>Currently Live • {game.period || (game.quarter as any)}</span>
              ) : isOver ? (
                <span>Final</span>
              ) : (
                <span>Starts {timeStr} on {dateStr}</span>
              )}
            </div>
            {(game.broadcastProvider || game.broadcast_provider) && (
              <div className="text-xs text-white/50">
                Watch on {game.broadcastProvider || game.broadcast_provider}
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});
GameCard.displayName = 'GameCard'; // Optional: for better debugging

// Accept and pass down props in GamesList
const GamesList = memo(({ games, user, onProtectedAction }: GamesListProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Reset scroll position to start when games change
    container.scrollLeft = 0;

    // Add wheel event listener to convert vertical scroll to horizontal with smooth scrolling
    const handleWheel = (e: WheelEvent) => {
      // Only intercept if scrolling vertically and container can scroll horizontally
      if (e.deltaY !== 0 && container.scrollWidth > container.clientWidth) {
        e.preventDefault();
        // Use scrollBy with smooth behavior for smoother scrolling
        container.scrollBy({
          left: e.deltaY,
          behavior: 'auto' // 'auto' is instant but feels natural, 'smooth' adds animation
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [games]);

  return (
    <div className="w-full px-0.5 sm:px-[50px]">
      {games.length === 0 ? (
        <Alert variant="default" className="bg-background-secondary/50 border-accent-1/20 w-[300px]">
          <InfoIcon className="h-4 w-4 text-accent-1" />
          <AlertDescription className="text-white/70">
            No games available for this sport.
          </AlertDescription>
        </Alert>
      ) : (
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-2 pr-2 pb-4 custom-scrollbar-hover"
        >
            {games
              .slice()
              .sort((a, b) => {
                const aLive = (a as any).isLive ?? (a as any).is_live;
                const bLive = (b as any).isLive ?? (b as any).is_live;
                const aOver = (a as any).isOver ?? (a as any).is_over;
                const bOver = (b as any).isOver ?? (b as any).is_over;

                // Group order: Upcoming (0) < Live (1) < Final (2)
                const groupRank = (g: any) => (!g.isLive && !g.isOver ? 0 : g.isLive ? 1 : 2);
                const aRank = groupRank({ isLive: aLive, isOver: aOver });
                const bRank = groupRank({ isLive: bLive, isOver: bOver });
                if (aRank !== bRank) return aRank - bRank;

                // Within group: sort by start time ascending
                const aTs: Timestamp | undefined = (a as any).startTime || (a as any).start_time;
                const bTs: Timestamp | undefined = (b as any).startTime || (b as any).start_time;
                const aMs = aTs ? aTs.toMillis() : 0;
                const bMs = bTs ? bTs.toMillis() : 0;
                return aMs - bMs;
              })
              .map((game) => (
              <div key={game.id} className="flex-none">
                <GameCard game={game} user={user} onProtectedAction={onProtectedAction} />
              </div>
            ))}
          </div>
      )}
    </div>
  );
});
GamesList.displayName = 'GamesList'; // Optional: for better debugging

export default GamesList; 