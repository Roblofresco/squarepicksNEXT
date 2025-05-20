import Image from 'next/image';
import { cn } from '@/lib/utils';
import React, { memo } from 'react'; // Import React for CSSProperties, memo
import { TeamInfo } from '@/types/lobby'; // Assuming TeamInfo is imported

interface SweepstakesScoreboardProps {
  awayTeam: TeamInfo; // Use TeamInfo
  homeTeam: TeamInfo; // Use TeamInfo
  status: string; // Changed to string for flexibility
  gameTime?: string;
  quarter?: number | string; // Accept both types maybe?
  awayScore?: number;
  homeScore?: number;
}

// Define the component as a named function first
function SweepstakesScoreboardComponent({
  awayTeam,
  homeTeam,
  status,
  gameTime,
  quarter,
  awayScore,
  homeScore,
}: SweepstakesScoreboardProps) {
  const isLive = status === 'live';
  const isUpcoming = status === 'upcoming';
  const isFinal = status === 'final';

  // Define base styles for team sections to avoid repetition
  const teamSectionBaseStyle = "flex flex-col items-center text-center w-1/3";

  // Define text shadow style for scores and the '@' symbol
  const textShadowStyle = {
      textShadow: '1px 1px 3px rgba(0, 0, 0, 0.5)' 
  };

  // Function to generate logo shadow style
  const getLogoShadowStyle = (color: string | undefined): React.CSSProperties => {
    const shadowColor = color || '#555'; // Default shadow if seccolor is missing
    return {
      filter: `drop-shadow(0px 4px 6px ${shadowColor}aa)` // Adjust alpha (aa) and offsets as needed
    };
  };

  // Helper to format the quarter/period
  const formatGameTime = () => {
    if (status !== 'live') return status; // Or perhaps show nothing/start time?
    if (quarter) {
        if (typeof quarter === 'number' && quarter > 0 && quarter <= 4) return `Q${quarter}`;
        if (typeof quarter === 'string') return quarter; // E.g., "HALFTIME", "OT"
    }
    if (gameTime) return gameTime; // Fallback to gameTime prop if quarter isn't specific
    return 'Live'; // Default live status
  };

  // Team logo rendering logic (handles undefined logo)
  const renderTeamLogo = (team: TeamInfo, align: 'left' | 'right') => {
    const shadowColorHex = team.seccolor || team.color;
    const shadowColorRgba = shadowColorHex ? `${shadowColorHex}80` : 'rgba(255,255,255,0.4)';
    const logoFilterStyle = { filter: `drop-shadow(0 0 4px ${shadowColorRgba})` };

    return (
      <div className={`flex flex-col items-center ${align === 'left' ? 'items-start' : 'items-end'}`}>
        {team.logo ? (
          <Image 
            src={team.logo} 
            alt={`${team.fullName} logo`} 
            width={40} 
            height={40} 
            className="object-contain mb-1" 
            style={logoFilterStyle}
          />
        ) : (
          (<div className="w-10 h-10 bg-gray-700 rounded-full mb-1 flex items-center justify-center text-white text-xs italic">?</div>) // Placeholder
        )}
        <span className="text-xs text-gray-300 font-medium mt-1 truncate max-w-[100px]">{team.fullName}</span>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-b from-background-primary to-accent-2 p-4 sm:p-6 rounded-lg shadow-lg glow-border-blue max-w-md mx-auto">
      <div className="flex items-stretch justify-between text-white font-bold min-h-[150px]"> {/* Use items-stretch and min-height */} 
        
        {/* Away Team Section */}
        <div className={teamSectionBaseStyle}>
          {/* Indented Container - Make relative for score overlay */}
          <div className="relative bg-black/10 rounded-lg p-2 shadow-inner w-full flex flex-col items-center flex-grow"> {/* Add relative and flex-grow */} 
              {renderTeamLogo(awayTeam, 'left')}
              
              {/* Divider (only shown when not live) */}
              {!isLive && (
                <div className="w-3/4 h-px bg-white/20 my-1"></div> 
              )}
              
              {/* Conditional Display: Score (Live Overlay) vs Name (Upcoming/Final) */}
              {isLive ? (
                <span 
                    className="absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl font-mono mt-1" // Absolute positioning
                    style={textShadowStyle} 
                >
                    {String(awayScore ?? 0).padStart(2, '0')}
                </span>
              ) : isUpcoming ? (
                <span className="text-sm sm:text-base font-semibold mt-1">{awayTeam.name}</span>
              ) : (
                <span className="text-sm sm:text-base font-semibold mt-1 text-gray-400">{awayTeam.name}</span>
              )}
          </div>
        </div>

        {/* Center Section (Time/Status) */}
        <div className="flex flex-col items-center justify-center text-center w-1/3 px-2 h-full min-h-[150px]">
          {isLive ? (
            <div className="flex flex-col items-center"> {/* Container for column layout */} 
               <span className="text-4xl sm:text-5xl font-mono mb-1" style={textShadowStyle}>-</span>
               <span className="text-base sm:text-lg text-gray-300 uppercase bg-black/20 px-2 py-1 rounded">
                   {formatGameTime()}
               </span>
            </div>
          ) : isUpcoming ? (
            <span className="text-4xl sm:text-5xl font-sans" style={textShadowStyle}>
               @
            </span>
          ) : isFinal ? (
            <span className="text-base sm:text-lg font-semibold text-gray-300 uppercase mt-1">FINAL</span>
          ) : (
            <span className="text-4xl sm:text-5xl font-mono">-</span> 
          )}
        </div>

        {/* Home Team Section */}
        <div className={teamSectionBaseStyle}>
           {/* Indented Container - Make relative */}
           <div className="relative bg-black/10 rounded-lg p-2 shadow-inner w-full flex flex-col items-center flex-grow"> {/* Add relative and flex-grow */} 
               {renderTeamLogo(homeTeam, 'right')}
              
              {/* Divider (only shown when not live) */}
              {!isLive && (
                <div className="w-3/4 h-px bg-white/20 my-1"></div> 
              )}
              
              {/* Conditional Display: Score (Live Overlay) vs Name (Upcoming/Final) */}
              {isLive ? (
                <span 
                    className="absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl font-mono mt-1" // Absolute positioning
                    style={textShadowStyle} 
                >
                    {String(homeScore ?? 0).padStart(2, '0')}
                </span>
              ) : isUpcoming ? (
                <span className="text-sm sm:text-base font-semibold mt-1">{homeTeam.name}</span>
              ) : (
                <span className="text-sm sm:text-base font-semibold mt-1 text-gray-400">{homeTeam.name}</span>
              )}
           </div>
        </div>
      </div>

      {/* Glow effect CSS */}
      <style jsx>{`
        .glow-border-blue {
          /* Remove the centered glow, keep only the downward offset one */
          box-shadow: 0 6px 15px 0px rgba(96, 165, 250, 0.5); /* Stronger bottom glow */
        }
      `}</style>
    </div>
  );
} 

// Set displayName on the named function
SweepstakesScoreboardComponent.displayName = 'SweepstakesScoreboard';

// Export the memoized version as the default
export default memo(SweepstakesScoreboardComponent); 