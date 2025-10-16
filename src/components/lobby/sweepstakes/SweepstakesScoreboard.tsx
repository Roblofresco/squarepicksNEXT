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
  timeRemaining?: string; // Add timeRemaining prop
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
  timeRemaining,
}: SweepstakesScoreboardProps) {
  const isLive = status === 'live' || status === 'in_progress';
  const isUpcoming = status === 'upcoming';
  const isFinal = status === 'final';

  // Define base styles for team sections to avoid repetition
  const teamSectionBaseStyle = "flex flex-col items-center text-center flex-1";

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

  // Helper function to format quarter display
  const formatQuarter = (quarter: number | string): string => {
    if (typeof quarter === 'number') {
      const quarters = ['1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr'];
      return quarters[quarter - 1] || `Q${quarter}`;
    }
    return quarter; // "Halftime", "OT", etc.
  };

  // Team logo rendering logic (handles undefined logo)
  const renderTeamLogo = (team: TeamInfo, score: number | undefined) => {
    const shadowColorHex = team.seccolor || team.color;
    const shadowColorRgba = shadowColorHex ? `${shadowColorHex}80` : 'rgba(255,255,255,0.4)';
    const logoFilterStyle = { filter: `drop-shadow(0 0 4px ${shadowColorRgba})` };

    return (
      <div className="relative w-16 h-16 mb-2">
        {team.logo ? (
          <Image 
            src={team.logo} 
            alt={`${team.fullName} logo`}
            fill
            className="object-contain"
            style={logoFilterStyle}
          />
        ) : (
          <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center text-white text-xs">?</div>
        )}
        
        {/* Score overlay for live games */}
        {isLive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="text-5xl sm:text-6xl font-mono font-bold"
              style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
            >
              {String(score ?? 0).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-b from-background-primary to-accent-2 p-4 sm:p-6 rounded-lg shadow-lg glow-border-blue w-full">
      <div className="flex items-stretch justify-between text-white font-bold min-h-[150px]">
        
        {/* Away Team Section */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="relative bg-black/10 rounded-lg p-2 shadow-inner w-full flex flex-col items-center flex-grow">
            {/* Logo with 30% opacity for live games */}
            <div className={cn(
              "relative w-16 h-16 mb-2",
              isLive && "opacity-30"  // 30% opacity for live games
            )}>
              {awayTeam.logo ? (
                <Image 
                  src={awayTeam.logo} 
                  alt={`${awayTeam.fullName} logo`}
                  fill
                  className="object-contain"
                  style={{
                    filter: awayTeam.seccolor 
                      ? `drop-shadow(0 0 4px ${awayTeam.seccolor}80)` 
                      : 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center text-white text-xs">?</div>
              )}
              
              {/* Score overlay for live games */}
              {isLive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span 
                    className="text-5xl sm:text-6xl font-mono font-bold"
                    style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
                  >
                    {String(awayScore ?? 0).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Divider for all states */}
            <div className="w-3/4 h-px bg-white/20 my-1"></div>

            {/* Team full name for all states */}
            <span className={cn(
              "text-sm sm:text-base font-semibold mt-1",
              isFinal && "text-gray-400"
            )}>
              {awayTeam.fullName}
            </span>
          </div>
        </div>

        {/* Center Section - Game Info */}
        <div className="flex flex-col items-center justify-center text-center w-auto px-4 h-full min-h-[150px]">
          {isLive ? (
            <div className="flex flex-col items-center space-y-2">
              {/* Quarter/Period */}
              <span className="text-base sm:text-lg text-gray-300 uppercase bg-black/30 px-3 py-1 rounded-md">
                {formatQuarter(quarter || '')}
              </span>
              
              {/* Time Remaining */}
              {timeRemaining && (
                <span className="text-sm text-gray-400 bg-black/20 px-2 py-0.5 rounded">
                  {timeRemaining}
                </span>
              )}
            </div>
          ) : isUpcoming ? (
            <span className="text-4xl sm:text-5xl font-sans" style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.5)' }}>
              @
            </span>
          ) : isFinal ? (
            <span className="text-4xl sm:text-5xl font-semibold text-gray-300 uppercase">
              F
            </span>
          ) : (
            <span className="text-4xl sm:text-5xl font-mono">-</span>
          )}
        </div>

        {/* Home Team Section */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="relative bg-black/10 rounded-lg p-2 shadow-inner w-full flex flex-col items-center flex-grow">
            {/* Logo with 30% opacity for live games */}
            <div className={cn(
              "relative w-16 h-16 mb-2",
              isLive && "opacity-30"  // 30% opacity for live games
            )}>
              {homeTeam.logo ? (
                <Image 
                  src={homeTeam.logo} 
                  alt={`${homeTeam.fullName} logo`}
                  fill
                  className="object-contain"
                  style={{
                    filter: homeTeam.seccolor 
                      ? `drop-shadow(0 0 4px ${homeTeam.seccolor}80)` 
                      : 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center text-white text-xs">?</div>
              )}
              
              {/* Score overlay for live games */}
              {isLive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span 
                    className="text-5xl sm:text-6xl font-mono font-bold"
                    style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
                  >
                    {String(homeScore ?? 0).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Divider for all states */}
            <div className="w-3/4 h-px bg-white/20 my-1"></div>

            {/* Team full name for all states */}
            <span className={cn(
              "text-sm sm:text-base font-semibold mt-1",
              isFinal && "text-gray-400"
            )}>
              {homeTeam.fullName}
            </span>
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