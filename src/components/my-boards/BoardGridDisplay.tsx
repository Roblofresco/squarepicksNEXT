import React from 'react';
import { Star } from 'lucide-react';

// Assuming TeamInfo, BoardSquare, QuarterScore are defined/imported
// For now, defining them here for clarity if this file is standalone.
interface TeamInfo {
  name: string;
  color: string;
  textColor?: string;
  logo?: string;
  initials?: string;
}

interface BoardSquare {
  number?: string | null;
  x: number;
  y: number;
  isUserSquare: boolean;
  // Potentially add isWinningForPeriod flags or pass winningQuarters data directly
}

interface QuarterScore {
  period: string;
  homeScore: number | null;
  awayScore: number | null;
  isWinner?: boolean;
  winAmountForPeriod?: number;
}

// Minimal Board data needed by this component
interface BoardForGridDisplay {
  squares: BoardSquare[][];
  rowNumbers?: string[];
  colNumbers?: string[];
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status: string; // e.g., "completed", "active"
  quarters: QuarterScore[];
  numbersAssigned?: boolean; // New: To indicate if numbers are finalized
}

interface BoardGridDisplayProps {
  board: BoardForGridDisplay;
  // This component will now expect its parent to handle the dark overall background for the grid area.
}

// Fonts from screenshot/Figma (ensure these are in tailwind.config.js)
const fontAxisTeamName = "font-allerta-stencil"; // For WARRIORS, CELTICS
const fontAxisNumber = "font-big-shoulders-stencil-display"; // For 2 0 5 7 etc.

const BoardGridDisplay: React.FC<BoardGridDisplayProps> = ({ board }) => {
  if (!board.numbersAssigned && !board.status.startsWith('open')) {
    return (
      <div className="flex flex-col items-center justify-center w-full p-4 min-h-[200px]">
        <p className="text-slate-400 text-center">
          Grid numbers will appear once assigned.
        </p>
      </div>
    );
  }

  const homeTeamName = board.homeTeam.name.toUpperCase();
  const awayTeamName = board.awayTeam.name.toUpperCase();
  
  const cellSizeClasses = "h-7 w-7"; // For all cells in the 11x11 grid
  const teamBarHeight = "h-7";
  const teamBarWidth = "w-7";
  // Calculate width/height for 10 cells + 9 1px gaps for team bars
  // theme('spacing.7') is 1.75rem (28px). 10 * 28px + 9 * 1px = 280px + 9px = 289px.
  const tenCellDimension = "289px"; 
  // Margin to offset for one cell + one gap: 28px + 1px = 29px.
  // Tailwind JIT can handle arbitrary values like ml-[29px]
  const oneCellPlusGapMarginTop = "mt-[29px]"; // For Away team bar top margin

  const teamNameSharedStyles = `flex justify-center items-center ${fontAxisTeamName} text-white text-base`;
  const numberCellSharedStyles = `${cellSizeClasses} flex items-center justify-center ${fontAxisNumber} text-white text-sm font-bold`;

  return (
    <div className="inline-flex flex-col">
      {/* Wrapper for Home Team Bar to achieve right alignment */}
      <div className="flex justify-end w-full">
        <div className={`${teamNameSharedStyles} ${teamBarHeight} bg-blue-600 rounded-t-md px-2`}
             style={{ width: tenCellDimension }}>
          {homeTeamName}
        </div>
      </div>

      {/* Lower Section: Away Team Bar + 11x11 Grid */}
      <div className="inline-flex flex-row">
        {/* Away Team Bar (Vertical) - now rounded-l-md */}
        <div className={`${teamNameSharedStyles} ${teamBarWidth} bg-green-600 rounded-l-md ${oneCellPlusGapMarginTop}`}
             style={{ writingMode: 'vertical-rl', height: tenCellDimension }}>
          <span className="transform rotate-180 whitespace-nowrap p-1 tracking-wider">
            {awayTeamName}
          </span>
        </div>

        {/* 11x11 Grid (Numbers + Data Squares) */}
        <div className="grid grid-cols-11 grid-rows-11 gap-px bg-slate-800 rounded-br-md">
          {Array.from({ length: 11 }).map((_, rowIndex) => 
            Array.from({ length: 11 }).map((_, colIndex) => {
              const key = `cell-${rowIndex}-${colIndex}`;

              // Top-Left Corner (0,0) of 11x11 grid - styled to match the X-axis background (blue)
              if (rowIndex === 0 && colIndex === 0) {
                return <div key={key} className={`${cellSizeClasses} bg-slate-900 border-slate-900`}></div>; 
              }

              // X-Axis Numbers (Row 0, Cols 1-10 of 11x11 grid)
              if (rowIndex === 0 && colIndex > 0) {
                return (
                  <div key={key} className={`${numberCellSharedStyles} bg-blue-600`}>
                    {board.numbersAssigned && board.colNumbers?.[colIndex - 1] !== undefined 
                      ? board.colNumbers[colIndex - 1] : '-'}
                  </div>
                );
              }

              // Y-Axis Numbers (Col 0, Rows 1-10 of 11x11 grid)
              if (colIndex === 0 && rowIndex > 0) {
                return (
                  <div key={key} className={`${numberCellSharedStyles} bg-green-600`}>
                    {board.numbersAssigned && board.rowNumbers?.[rowIndex - 1] !== undefined 
                      ? board.rowNumbers[rowIndex - 1] : '-'}
                  </div>
                );
              }

              // Data Squares (Rows 1-10, Cols 1-10 of 11x11 grid)
              if (rowIndex > 0 && colIndex > 0) {
                const dataRowIndex = rowIndex - 1;
                const dataColIndex = colIndex - 1;
                const cellData = board.squares?.[dataRowIndex]?.[dataColIndex] || 
                               { x: dataColIndex, y: dataRowIndex, isUserSquare: false };
                
                let cellBgColor = 'bg-slate-700'; // Default for data cells
                let cellContent: React.ReactNode = null;
                const borderClass = 'border border-slate-500'; // From screenshot, cells have borders

                if (cellData.isUserSquare) {
                  cellBgColor = 'bg-blue-700'; 
                  cellContent = <Star className={`h-3 w-3 text-yellow-400`} fill="currentColor" />;
                }

                return (
                  <div
                    key={key}
                    className={`${cellSizeClasses} ${cellBgColor} ${borderClass} flex items-center justify-center`}
                  >
                    {cellContent}
                  </div>
                );
              }
              return null; // Should not happen with current logic
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardGridDisplay; 