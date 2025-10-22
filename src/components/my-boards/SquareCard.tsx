import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, CheckSquare, Loader2, Clock, Trophy, XCircle, AlertTriangle } from 'lucide-react';
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

const statusLabel = (status: BoardStatus): string => {
  if (status === 'open') return 'OPEN';
  if (status === 'full') return 'FULL';
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
  const potDisplay = typeof stakeAmount === 'number' ? (stakeAmount * 80) : undefined;
  const isSweepstakes = boardAmount === 0;

  const bracketIdx = (val?: number) => typeof val === 'number' ? `[ ${String(val).padStart(2,'0')} ]` : `[ -- ]`;
  const bracketSquare = (sq?: string, idx?: number) => sq ? `[ ${sq} ]` : bracketIdx(idx);

  const renderSquaresGrid = () => {
    const idxs = (userPickedSquares || []).map(s => s.index);
    const xys = (userPickedSquares || []).map(s => s.square || '—');
    
    // If all 100 squares, show summary
    if (idxs.length === 100) {
      return (
        <div className="mt-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Squares:</span>
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
              100/100 Complete
            </Badge>
          </div>
        </div>
      );
    }
    
    // Original grid display for partial selections
    return (
      <div className="mt-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">Squares:</span>
          <div className="grid grid-cols-3 gap-1">
            {idxs.map((v,i) => (<span key={`sq-${i}`} className="chip text-white/90">{v}</span>))}
          </div>
        </div>
        <div className="my-1 border-t border-dashed border-white/15" />
        <div className="flex items-center gap-2">
          <span className="font-medium">Picks:</span>
          <div className="grid grid-cols-3 gap-1">
            {xys.map((v,i) => (<span key={`xy-${i}`} className="chip text-white/90">{v}</span>))}
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
        <span className="inline-flex rounded-md p-px bg-gradient-to-r from-[#FFE08A] via-[#E7B844] to-[#C9962E] shadow-[0_0_10px_rgba(231,184,68,0.35)]">
          <span className="px-2 py-0.5 rounded-[5px] bg-white/10 text-white/95 backdrop-blur-[2px] text-[11px] leading-4">
            {content}
          </span>
        </span>
      );
    }
    return <span className="chip text-white/90">{content}</span>;
  };

  return (
    <Card className={cn(
      "w-full max-w-sm overflow-visible glass transition-shadow duration-300 ease-in-out flex flex-col gap-0 text-slate-100 cursor-pointer h-full rounded-lg relative",
      status === 'full' && "ring-2 ring-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
    )} onClick={() => onClick(id)}>
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
          const statusBgClass = s === 'open' ? 'bg-blue-500/80' 
            : s === 'full' ? 'bg-orange-500/80' 
            : s === 'unfilled' ? 'bg-red-600/80'
            : s.startsWith('IN_PROGRESS') ? 'bg-yellow-500/80'
            : s.startsWith('FINAL') ? 'bg-green-600/80'
            : s === 'CANCELLED' ? 'bg-red-700/80'
            : 'bg-white/20';
          return (
            <div className={`px-2 py-0.5 rounded-full ${statusBgClass} border border-white/20 text-[10px] uppercase tracking-wide text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)]`}>
              {statusLabel(status)}
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
            {/* Show Amount row for non-sweepstakes boards */}
            {!isSweepstakes && typeof boardAmount === 'number' && (
              <span>Amount: ${boardAmount.toFixed(2)}</span>
            )}
            {typeof stakeAmount === 'number' && (
              <span>Entry: ${stakeAmount.toFixed(2)}</span>
            )}
            <span>Picks: {userPickedSquares ? userPickedSquares.length : 0}</span>
            {typeof potDisplay === 'number' && (
              <span>Pot: ${potDisplay.toFixed(2)}</span>
            )}
          </div>
          {(status === 'open' || status === 'full') && typeof stakeAmount === 'number' && (board.gameId) && (
            <Link href={`/game/${board.gameId}?amount=${stakeAmount}`}>
              <Button size="sm" variant="secondary" className="transition-transform duration-150 hover:scale-[1.03] active:scale-95 hover:shadow-[0_8px_20px_rgba(88,85,228,0.25)] focus-visible:ring-2 focus-visible:ring-accent-1/60 hover:underline underline-offset-2">View</Button>
            </Link>
          )}
          {(status !== 'open') && board.winnings && board.winnings > 0 && (
            <Link href={`/transactions`}>
              <Button size="sm" variant="secondary" className="transition-transform duration-150 hover:scale-[1.03] active:scale-95 hover:shadow-[0_8px_20px_rgba(88,85,228,0.25)] focus-visible:ring-2 focus-visible:ring-accent-1/60 hover:underline underline-offset-2">View</Button>
            </Link>
          )}
        </div>

        <div className="border-t border-white/10 pt-2 mt-3" />
        {/* Your Selections (Squares/Picks) */}
        <div className="mt-0">
          <div className="font-semibold mb-0">Your Selections</div>
          {(() => {
            const isFullBoard = status === 'full' && userPickedSquares && userPickedSquares.length === 100;
            
            if (status === 'open') {
              return (
                <div className="text-white/85">Squares: {userPickedSquares && userPickedSquares.length > 0 ? userPickedSquares.map(s => s.index).join(', ') : '--'}</div>
              );
            } else if (isFullBoard) {
              return (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                    All 100 squares selected
                  </Badge>
                </div>
              );
            } else {
              return renderSquaresGrid();
            }
          })()}
        </div>

        <div className="border-t border-white/10 pt-2 mt-3" />
        <div className="mt-1">
          <div className="font-semibold mb-1">Quarter Winners</div>
          {(() => {
            const show = isInProgressOrFinal();
            const q1 = show ? bracketSquare(board.q1_winning_square, board.q1_winning_index) : bracketIdx(undefined);
            const q2 = show ? bracketSquare(board.q2_winning_square, board.q2_winning_index) : bracketIdx(undefined);
            const q3 = show ? bracketSquare(board.q3_winning_square, board.q3_winning_index) : bracketIdx(undefined);
            const q4 = show ? bracketSquare(board.q4_winning_square, board.q4_winning_index) : bracketIdx(undefined);
            return (
              <>
                <div className="text-white/90 flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1">
                    <span className={show && board.userWon_q1 ? 'text-[#E7B844] font-semibold' : ''}>Q1:</span>
                    {renderWinnerChip(!!(show && board.userWon_q1), q1)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={show && board.userWon_q2 ? 'text-[#E7B844] font-semibold' : ''}>Q2:</span>
                    {renderWinnerChip(!!(show && board.userWon_q2), q2)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={show && board.userWon_q3 ? 'text-[#E7B844] font-semibold' : ''}>Q3:</span>
                    {renderWinnerChip(!!(show && board.userWon_q3), q3)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={show && board.userWon_final ? 'text-[#E7B844] font-semibold' : ''}>Final:</span>
                    {renderWinnerChip(!!(show && board.userWon_final), q4)}
                  </div>
                </div>
                {show && (board.userWon_q1 || board.userWon_q2 || board.userWon_q3 || board.userWon_final) && (
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