'use client'

import Image from 'next/image'; // For team logos later
import { Game as GameType, TeamInfo } from '@/types/lobby'; // Import shared type
import Link from 'next/link'; // Import Link
import { User as FirebaseUser } from 'firebase/auth'; // Import User type
import React, { memo, useMemo } from 'react'; // Import React for event type, memo, useMemo
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

// Removed placeholder data - will come from props
// const gamesData: Game[] = [...];

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
    // Render placeholder if team data is missing
    return (
        <div className="flex flex-col items-center justify-center h-full px-1">
            <div className="w-10 h-10 bg-gray-600 rounded-full mb-1"></div>
            <span className="text-xs text-gray-500 font-bold">N/A</span>
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
    <div className="flex flex-col items-center justify-center h-full px-1">
      {team.logo ? (
        <Image 
          src={team.logo} 
          alt={`${team.initials || team.name} logo`} // Use initials or name
          width={40}
          height={40}
          className="object-contain mb-1"
          style={filterStyle} 
        />
      ) : (
        <div 
          className="w-10 h-10 bg-gray-600 rounded-full mb-1 flex items-center justify-center text-white font-semibold"
          style={filterStyle}
        >
          {team.initials?.substring(0, 3) || 'N/A'} {/* Show initials or fallback */}
        </div>
      )}
      <span 
        className="text-xs text-white font-bold"
        style={filterStyle} 
      >
        {team.initials || 'N/A'} {/* Use initials */} 
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

  // Format start_time into time and date strings
  const formatStartTime = (timestamp: Timestamp | undefined): { timeStr: string; dateStr: string } => {
      if (!timestamp) return { timeStr: '--:--', dateStr: '-- --' };
      const date = timestamp.toDate();
      const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute:'2-digit' });
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return { timeStr, dateStr };
  };
  
  const { timeStr, dateStr } = formatStartTime(game.start_time);

  return (
    <Link
      href={`/game/${game.id}`}
      onClick={handleClick}
      className={`relative flex flex-row items-center justify-between flex-shrink-0 w-[240px] h-[90px] rounded-lg text-white ${shadowStyle} overflow-hidden hover:ring-2 hover:ring-accent-1 transition-all duration-200 p-2`}
      legacyBehavior>
      {/* Background Layer */}
      <div 
        className={`absolute inset-0 ${gradientStyle} opacity-85 z-0 rounded-lg`}
      ></div>
      {/* Live Badge */}
      {game.is_live && (
        <div className="absolute top-1 right-1 bg-red-600 text-white text-[0.5rem] font-bold px-1.5 py-0.5 rounded-full uppercase z-20">
          Live
        </div>
      )}
      {/* Left Column: Team A */}
      <div className="relative w-1/4 flex items-center justify-center h-full z-10"> 
        <TeamDisplay team={game.teamA} />
      </div>
      {/* Center Column: Game Details */}
      <div className="relative flex flex-col items-center justify-center w-1/2 text-center px-1 z-10"> 
        {/* Score or VS */}
        <div className="text-sm font-bold mb-1" style={textShadowStyle}> 
          {game.is_live ? `${game.away_score ?? 0} - ${game.home_score ?? 0}` : 'VS'}
        </div>
        {/* Time/Date or Period */}
        <div className="text-xs text-text-secondary mb-0.5" style={textShadowStyle}> 
          {game.is_live ? (
            <span>{game.period || game.quarter || 'Live'}</span>
          ) : (
            <span>{timeStr} - {dateStr}</span>
          )}
        </div>
        {/* Broadcast Provider */}
        {game.broadcast_provider && (
          <span className="text-[0.65rem] text-gray-400 font-medium truncate w-full" style={textShadowStyle}>
            {game.broadcast_provider}
          </span>
        )}
      </div>
      {/* Right Column: Team B */}
      <div className="relative w-1/4 flex items-center justify-center h-full z-10"> 
        <TeamDisplay team={game.teamB} />
      </div>
    </Link>
  );
});
GameCard.displayName = 'GameCard'; // Optional: for better debugging

// Accept and pass down props in GamesList
const GamesList = memo(({ games, user, onProtectedAction }: GamesListProps) => {
  return (
    <div className="relative">
      {/* Remove horizontal padding from this container */}
      <div> 
        <div className="flex justify-start space-x-3 overflow-x-auto pb-4 scrollbar-hide w-full max-w-full">
          {/* Check if games array is empty */}
          {games.length === 0 ? (
            <div className="text-text-secondary text-sm italic px-2"> {/* Add padding to message if no games */} 
               No games available for this sport.
            </div>
          ) : (
            // Add index to map function
            (games.map((game, index) => (
              // Apply margin-left only to the first card (index === 0)
              (<div key={game.id} className={`${index === 0 ? 'ml-2' : ''}`}>
                <GameCard game={game} user={user} onProtectedAction={onProtectedAction} />
              </div>)
            )))
          )}
        </div>
      </div>
    </div>
  );
});
GamesList.displayName = 'GamesList'; // Optional: for better debugging

export default GamesList; 