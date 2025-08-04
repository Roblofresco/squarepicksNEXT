import React from 'react';

// Assuming TeamInfo and QuarterScore interfaces are defined similarly or passed/imported
// For now, defining them here for clarity if this file is standalone.
// In a real app, these would likely be in a shared types file.
interface TeamInfo {
  name: string;
  color: string; // Can be used for theming the logo circle background
  textColor?: string;
  logo?: string; // Added for logo display
  initials?: string; // Added for fallback if logo is missing
}

interface QuarterScore {
  period: string; // 'Q1', 'Q2', 'Q3', 'F' (Final, will be displayed as Q4)
  homeScore: number | null; // Updated to allow null
  awayScore: number | null; // Updated to allow null
  isWinner?: boolean; // Did the user win this period?
  winAmountForPeriod?: number; // New: The amount won for this period
}

// Minimal Board data needed by this component
interface BoardForScoreboard {
  quarters: QuarterScore[];
  homeTeam: TeamInfo; // Changed from Pick to full TeamInfo
  awayTeam: TeamInfo; // Changed from Pick to full TeamInfo
  status: string; // To know if it's completed for "W" display logic potentially
}

interface QuarterScoreboardProps {
  board: BoardForScoreboard;
}

// Placeholder font classes - ensure these are defined in your Tailwind config
const fontSairaStencilOne = "font-saira-stencil-one"; // For Q1, scores
const fontMarkoOne = "font-marko-one"; // For initials in circles (fallback)

const QuarterScoreboard: React.FC<QuarterScoreboardProps> = ({ board }) => {
  // The screenshot shows Q1, Q2, Q3, Q4. The data might have 'F' for final.
  // We need to map 'F' to 'Q4' for display if that's the case.
  const displayQuarters = board.quarters.map(q => ({
    ...q,
    period: q.period === 'F' ? 'Q4' : q.period
  }));

  return (
    // Main scoreboard container: Matches screenshot's dark blue/gray bg, full border, rounded top.
    // Removed mb-0 as parent FeaturedBoardDisplay will handle positioning.
    // Removed border-b-0 to give it a full border, making it a distinct block.
    <div className={`grid grid-cols-4 gap-0 p-0 rounded-t-lg border border-slate-600 bg-slate-800 shadow-md max-w-full mx-auto`}>
      {displayQuarters.map((q, index) => (
        // Individual Quarter Box: inherits parent bg, right border for separation.
        <div key={q.period} 
             className={`p-3 text-center relative flex flex-col justify-start min-h-[110px] 
                        ${index < displayQuarters.length - 1 ? 'border-r border-slate-600' : ''}`}>
          
          {/* Quarter Label: Saira Stencil One, ~20-22px (visual guess), white, boldish */}
          <div className={`text-xl ${fontSairaStencilOne} text-white font-semibold mb-2`}>{q.period}</div>
          
          {/* Scores and Logos Area - Ensure scores are above logos */}
          <div className="flex justify-around items-start mt-1 flex-grow">
            {/* Away Team Score & Logo Column */}
            <div className="flex flex-col items-center space-y-1">
              <div className={`text-lg ${fontSairaStencilOne} text-white`}>
                {q.awayScore === null ? '-' : q.awayScore}
              </div>
              {board.awayTeam.logo ? (
                <img src={board.awayTeam.logo} alt={board.awayTeam.initials || 'Away'} className="h-7 w-7 rounded-full object-cover border border-slate-500" />
              ) : (
                <div className={`h-7 w-7 rounded-full flex items-center justify-center border border-slate-400 bg-slate-700`}>
                  <span className={`${fontMarkoOne} text-xs font-medium text-white`}>
                    {board.awayTeam.initials || board.awayTeam.name.substring(0,2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Home Team Score & Logo Column */}
            <div className="flex flex-col items-center space-y-1">
              <div className={`text-lg ${fontSairaStencilOne} text-white`}>
                {q.homeScore === null ? '-' : q.homeScore}
              </div>
              {board.homeTeam.logo ? (
                <img src={board.homeTeam.logo} alt={board.homeTeam.initials || 'Home'} className="h-7 w-7 rounded-full object-cover border border-slate-500" />
              ) : (
                <div className={`h-7 w-7 rounded-full flex items-center justify-center border border-slate-400 bg-slate-700`}>
                  <span className={`${fontMarkoOne} text-xs font-medium text-white`}>
                    {board.homeTeam.initials || board.homeTeam.name.substring(0,2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Win Indication (optional, styling from previous iterations kept for now) */}
          {q.isWinner && (
            <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-10 pointer-events-none">
              <span className={`text-6xl ${fontSairaStencilOne} text-green-400 filter drop-shadow-lg`}>W</span>
            </div>
          )}
          {q.isWinner && q.winAmountForPeriod && q.winAmountForPeriod > 0 && (
            <div className={`text-[9px] ${fontSairaStencilOne} text-green-300 font-semibold mt-auto leading-tight pt-0.5`}>
              +${q.winAmountForPeriod.toFixed(2)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuarterScoreboard; 