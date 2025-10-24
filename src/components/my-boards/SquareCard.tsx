import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, CheckSquare, Loader2, Clock, Trophy, XCircle, AlertTriangle, Crown } from 'lucide-react';
import { cn } from "@/lib/utils";

// Import shared types instead of defining local interfaces
import { TeamInfo, BoardSquare, BoardStatus, AppBoard } from '../../types/myBoards';

// BoardSquare and BoardStatus are now imported from shared types

// AppBoard is now imported from shared types

interface SquareCardProps {
  board: AppBoard;
  onClick: (boardId: string) => void;
}

const getStatusAppearance = (status: BoardStatus | string, isLive?: boolean, isBoardFull?: boolean) => {
  if (status === 'open') {
    if (isBoardFull && isLive) {
      return { text: 'LIVE', color: 'bg-red-600 hover:bg-red-700 animate-pulse', icon: <Clock className="h-3.5 w-3.5" /> };
    } else if (isBoardFull) {
      return { text: 'Full', color: 'bg-orange-500 hover:bg-orange-600', icon: <Info className="h-3.5 w-3.5" /> };
    }
    return { text: 'Picks Open', color: 'bg-blue-600 hover:bg-blue-700', icon: <CheckSquare className="h-3.5 w-3.5" /> };
  }
  
  switch (status) {
    case 'IN_PROGRESS_Q1':
    case 'IN_PROGRESS_Q2':
    case 'IN_PROGRESS_Q3':
    case 'IN_PROGRESS_HALFTIME':
    case 'IN_PROGRESS_Q4':
    case 'IN_PROGRESS_OT':
      return { text: 'In Progress', color: 'bg-yellow-500', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> };
    case 'FINAL_WON':
      return { text: 'Won', color: 'bg-green-600', icon: <Trophy className="h-3.5 w-3.5" /> };
    case 'FINAL_LOST':
      return { text: 'Lost', color: 'bg-slate-600', icon: <XCircle className="h-3.5 w-3.5" /> };
    case 'CANCELLED':
      return { text: 'Cancelled', color: 'bg-red-700', icon: <AlertTriangle className="h-3.5 w-3.5" /> };
    default:
      const statusString = typeof status === 'string' ? status : String(status);
      const defaultText = statusString.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()); 
      return { text: defaultText, color: 'bg-gray-500', icon: <Info className="h-3.5 w-3.5"/> };
  }
};

const statusLabel = (status: BoardStatus, isFull: boolean): string => {
  if (status === 'open' && isFull) return 'FULL';
  if (status === 'open') return 'OPEN';
  // Remove the 'full' check since it won't exist in database
  if (String(status).startsWith('FINAL')) return 'FINAL';
  if (String(status).startsWith('IN_PROGRESS')) return 'IN PROGRESS';
  return String(status).replace(/_/g, ' ').toUpperCase();
};

const TeamDisplay: React.FC<{ team?: TeamInfo; logoRight?: boolean }> = ({ team, logoRight = false }) => {
  const filterStyle = useMemo(() => {
    const hex = team?.seccolor || team?.color;
    const rgba = hex ? `${hex}80` : 'rgba(255,255,255,0.4)';
    return { filter: `drop-shadow(0 0 4px ${rgba})` } as React.CSSProperties;
  }, [team?.seccolor, team?.color]);

  if (!team) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-600 rounded-full" />
        <span className="text-sm font-medium">N/A</span>
      </div>
    );
  }
  const LogoEl = team.logo ? (
    <Image src={team.logo} alt={`${team.initials || team.name} logo`} width={32} height={32} className="object-contain rounded-sm" style={filterStyle} />
  ) : (
    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-[12px] font-semibold" style={filterStyle}>
      {(team.initials || team.name || 'NA').substring(0,3)}
    </div>
  );
  return (
    <div className="flex items-center gap-2 min-w-0">
      {!logoRight && LogoEl}
      <span className="text-sm font-medium truncate" title={team.name}>{team.name}</span>
      {logoRight && LogoEl}
    </div>
  );
};

const SquareCard: React.FC<SquareCardProps> = ({ board, onClick }) => {
  const router = useRouter();
  const [showSquares, setShowSquares] = useState(true); // Toggle between squares and picks
  const { 
    id, homeTeam, awayTeam, gameDateTime, status, 
    sport, userPickedSquares,
    is_live, selected_indexes_on_board, broadcast_provider,
    totalSquareCount,
    q1_winning_index, q2_winning_index, q3_winning_index, q4_winning_index
  } = board;

  const isBoardFull = totalSquareCount !== undefined && 
                      selected_indexes_on_board !== undefined && 
                      selected_indexes_on_board.length >= totalSquareCount;

  const gameDate = new Date(gameDateTime);

  const dateStr = gameDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = gameDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

  const boardAmount = typeof board.amount === 'number' ? board.amount : 0;
  const stakeAmount = typeof board.stake === 'number' ? board.stake : undefined;
  const potDisplay = typeof board.pot === 'number' ? board.pot : undefined;  // Use board.pot from Firestore
  const isSweepstakes = boardAmount === 0;

  const bracketIdx = (val?: number) => typeof val === 'number' ? String(val).padStart(2,'0') : '--';
  const bracketSquare = (sq?: string, idx?: number) => sq || '--';

  // Helper function to check if a square value is a winning square that the user owns
  const isUserWinningSquare = (squareValue: string): boolean => {
    // Check if this square matches any quarter the user won
    if (board.userWon_q1 && board.q1_winning_square === squareValue) return true;
    if (board.userWon_q2 && board.q2_winning_square === squareValue) return true;
    if (board.userWon_q3 && board.q3_winning_square === squareValue) return true;
    if (board.userWon_final && board.q4_winning_square === squareValue) return true;
    return false;
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const userIndexes = userPickedSquares?.map(s => s.index) || [];
    const params = new URLSearchParams({
      boardId: id,
      userSquares: userIndexes.join(',')
    });
    router.push(`/game/${board.gameId}?${params.toString()}`);
  };

  const renderSquaresGrid = () => {
    const idxs = (userPickedSquares || []).map(s => s.index);
    const xys = (userPickedSquares || []).map(s => s.square || '—');
    
    // If no squares, show placeholder
    if (idxs.length === 0) {
      return <div className="text-white/85">--</div>;
    }
    
    // If all 100 squares, show summary badge
    if (idxs.length === 100) {
      return (
        <div className="mt-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30 rounded-none">
              All 100 squares selected
            </Badge>
          </div>
        </div>
      );
    }
    
    // For all other cases: show toggle with flip animation (works for ALL statuses)
    return (
      <div className="mt-1">
        {/* Toggle buttons */}
        <div className="flex gap-2 mb-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowSquares(true); }}
            className={`px-3 py-1 text-xs font-medium transition-colors rounded-none ${
              showSquares ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60'
            }`}
          >
            Squares
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowSquares(false); }}
            className={`px-3 py-1 text-xs font-medium transition-colors rounded-none ${
              !showSquares ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60'
            }`}
          >
            Picks
          </button>
        </div>
        
        {/* Grid with individual flip animations */}
        <div 
          className="p-2 rounded-none max-h-[68px] overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.2) rgba(255,255,255,0.05)'
          }}
        >
          <div className="flex flex-wrap gap-0.5 w-fit">
              {idxs.map((v, i) => {
                const squareValue = xys[i];
                const isWinner = squareValue !== '—' && isUserWinningSquare(squareValue);
                
                // Base classes for both sides
                const baseClasses = "!rounded-none absolute inset-0 flex items-center justify-center transition-all duration-500";
                
                // Conditional styling for winner squares
                const winnerClasses = isWinner
                  ? "bg-gradient-to-br from-[#FFE08A] via-[#E7B844] to-[#C9962E] text-white font-bold shadow-[0_0_10px_rgba(231,184,68,0.35)]"
                  : "chip text-white/90";
              
              return (
                <div 
                  key={`flip-${i}`}
                  className="relative h-6 w-6"
                  style={{ perspective: '1000px' }}
                >
                  {/* Front side (Squares) */}
                  <span 
                    className={`${winnerClasses} ${baseClasses}`}
                    style={{ 
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                      transform: showSquares ? 'rotateY(0deg)' : 'rotateY(180deg)',
                      opacity: showSquares ? 1 : 0
                    }}
                  >
                    {v}
                  </span>
                  
                  {/* Back side (Picks) */}
                  <span 
                    className={`${winnerClasses} ${baseClasses}`}
                    style={{ 
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                      transform: !showSquares ? 'rotateY(0deg)' : 'rotateY(-180deg)',
                      opacity: !showSquares ? 1 : 0
                    }}
                  >
                    {xys[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const isInProgressOrFinal = () => {
    const s = String(status);
    return s.startsWith('IN_PROGRESS') || s.startsWith('FINAL');
  };

  const renderWinnerChip = (won: boolean, content: string) => {
    if (won) {
      return (
        <span className="relative inline-flex items-center justify-center">
          <Crown 
            className="h-6 w-6 fill-[#E7B844] text-[#FFE08A]" 
            style={{ 
              filter: 'drop-shadow(0 0 8px rgba(231,184,68,0.6))' 
            }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white leading-none" style={{ marginTop: '2px' }}>
            {content}
          </span>
        </span>
      );
    }
    // When no winning square assigned (content is "--")
    if (content === '--') {
      return <span className="chip text-white/40 !rounded-none">{content}</span>;
    }
    // When winning square exists but user didn't win
    return <span className="chip text-white/90 !rounded-none bg-white/5">{content}</span>;
  };

  return (
    <Card className={cn(
      "w-full max-w-sm overflow-visible glass transition-shadow duration-300 ease-in-out flex flex-col gap-0 text-slate-100 h-full rounded-lg relative",
      isBoardFull && "ring-2 ring-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
    )}>
      {/* Ribbons */}
        {sport && (
        <div className="absolute -top-3 left-3 z-20 pointer-events-none">
          <div className="px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-[10px] uppercase tracking-wide text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
            {sport.toUpperCase()}
          </div>
        </div>
      )}
      {isSweepstakes && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="p-px rounded-full bg-gradient-to-r from-indigo-500/70 via-fuchsia-500/70 to-violet-500/70">
            <div className="rounded-full bg-background-primary">
              <div className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase tracking-wide text-white backdrop-blur-sm">
                SWEEPSTAKES
          </div>
          </div>
        </div>
          </div>
        )}
      <div className="absolute -top-3 right-3 z-20 pointer-events-none">
        {(() => {
          const s = String(status);
          const statusBgClass = s === 'open' && isBoardFull ? 'bg-yellow-500/80'  // Yellow for full board
            : s === 'open' ? 'bg-blue-500/80'                                      // Blue for open (not full)
            : s === 'active' ? 'bg-green-600/80'                                   // Green for active
            : s === 'unfilled' ? 'bg-red-600/80'
            : s === 'closed' ? 'bg-gray-600/80'
            : s.startsWith('IN_PROGRESS') ? 'bg-yellow-500/80'
            : s.startsWith('FINAL') ? 'bg-green-600/80'
            : s === 'CANCELLED' ? 'bg-red-700/80'
            : 'bg-white/20';
          return (
            <div className={`px-2 py-0.5 rounded-full ${statusBgClass} border border-white/20 text-[10px] uppercase tracking-wide text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)]`}>
              {statusLabel(status, isBoardFull)}
            </div>
          );
        })()}
      </div>

      <CardHeader className="px-3 pt-3 pb-0 relative">
        <div className="radial-glow-top" />
        <div className="flex flex-col items-center text-center gap-1">
          <div className="flex items-center justify-center gap-3">
            <TeamDisplay team={homeTeam} />
            <span className="text-white/40">@</span>
            <TeamDisplay team={awayTeam} logoRight />
          </div>
          <CardDescription className="text-xs text-slate-300 mt-0.5">
            {is_live ? 'Live' : `${dateStr}, ${timeStr}`}
          </CardDescription>
          {!is_live && broadcast_provider && (
            <div className="text-xs text-slate-400 -mt-1">{broadcast_provider}</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pt-0 pb-3 flex-grow text-sm">
        {/* Divider between broadcast and summary */}
        <div className="mx-auto my-1 w-3/4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="mt-1 flex items-center justify-between text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {typeof stakeAmount === 'number' && (
              <span>Entry: ${stakeAmount.toFixed(2)}</span>
            )}
            <span>Picks: {userPickedSquares ? userPickedSquares.length : 0}</span>
            {typeof potDisplay === 'number' && (
              <span>Total Pot: ${potDisplay.toFixed(2)}</span>
            )}
          </div>
          {board.gameId && (
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleViewClick}
              className="transition-transform duration-150 hover:scale-[1.03] active:scale-95 hover:shadow-[0_8px_20px_rgba(88,85,228,0.25)] focus-visible:ring-2 focus-visible:ring-accent-1/60 hover:underline underline-offset-2"
            >
              View
            </Button>
          )}
        </div>

        <div className="border-t border-white/10 pt-2 mt-3" />
        {/* Your Selections (Squares/Picks) */}
        <div className="mt-0">
          <div className="font-semibold mb-0">Your Selections</div>
          {renderSquaresGrid()}
        </div>

        <div className="border-t border-white/10 pt-2 mt-3" />
        <div className="mt-1">
          <div className="font-semibold mb-1">Quarter Winners</div>
          {(() => {
            // Always show winning squares if they exist (from game document)
            // Don't restrict to IN_PROGRESS/FINAL status
            const q1 = bracketSquare(board.q1_winning_square, board.q1_winning_index);
            const q2 = bracketSquare(board.q2_winning_square, board.q2_winning_index);
            const q3 = bracketSquare(board.q3_winning_square, board.q3_winning_index);
            const q4 = bracketSquare(board.q4_winning_square, board.q4_winning_index);
            return (
              <>
                <div className="text-white/90 flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1">
                    <span className={board.userWon_q1 ? 'text-[#E7B844] font-semibold' : ''}>Q1:</span>
                    {renderWinnerChip(!!board.userWon_q1, q1)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={board.userWon_q2 ? 'text-[#E7B844] font-semibold' : ''}>Q2:</span>
                    {renderWinnerChip(!!board.userWon_q2, q2)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={board.userWon_q3 ? 'text-[#E7B844] font-semibold' : ''}>Q3:</span>
                    {renderWinnerChip(!!board.userWon_q3, q3)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={board.userWon_final ? 'text-[#E7B844] font-semibold' : ''}>Final:</span>
                    {renderWinnerChip(!!board.userWon_final, q4)}
                  </div>
                </div>
                {(board.userWon_q1 || board.userWon_q2 || board.userWon_q3 || board.userWon_final) && (
                  <div className="text-xs text-[#E7B844]/90 mt-1">* Winner</div>
                )}
              </>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
};

export default SquareCard; 