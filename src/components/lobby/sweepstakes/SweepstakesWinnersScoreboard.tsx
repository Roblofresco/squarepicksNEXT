import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface WinnerPill {
  label: string;
  number: string | null;
  period: 'q1' | 'q2' | 'q3' | 'final';
}

interface SweepstakesWinnersScoreboardProps {
  q1WinningSquare?: string;
  q2WinningSquare?: string;
  q3WinningSquare?: string;
  finalWinningSquare?: string;
  isLive?: boolean;
  currentQuarter?: number;
  user?: FirebaseUser | null;
  boardId?: string;
}

export default function SweepstakesWinnersScoreboard({
  q1WinningSquare,
  q2WinningSquare,
  q3WinningSquare,
  finalWinningSquare,
  isLive,
  currentQuarter,
  user,
  boardId
}: SweepstakesWinnersScoreboardProps) {
  const [userPurchasedSquares, setUserPurchasedSquares] = useState<Set<number>>(new Set());

  // Fetch user's purchased squares
  useEffect(() => {
    if (!boardId || !user?.uid) {
      setUserPurchasedSquares(new Set());
      return;
    }

    const fetchUserSquares = async () => {
      try {
        const functions = getFunctions(undefined, "us-east1");
        const getSelectionsFn = httpsCallable(functions, 'getBoardUserSelections');
        const result = await getSelectionsFn({ boardID: boardId });
        const data = result.data as { selectedIndexes?: number[] };
        if (data?.selectedIndexes && Array.isArray(data.selectedIndexes)) {
          setUserPurchasedSquares(new Set(data.selectedIndexes));
        } else {
          setUserPurchasedSquares(new Set());
        }
      } catch (error) {
        console.error("Failed to fetch user squares:", error);
        setUserPurchasedSquares(new Set());
      }
    };

    fetchUserSquares();
  }, [boardId, user?.uid]);

  // Helper to check if user owns the winning square for a period
  const doesUserOwnWinningSquare = (period: 'q1' | 'q2' | 'q3' | 'final'): boolean => {
    let winningSquareStr: string | undefined;
    
    switch (period) {
      case 'q1':
        winningSquareStr = q1WinningSquare;
        break;
      case 'q2':
        winningSquareStr = q2WinningSquare;
        break;
      case 'q3':
        winningSquareStr = q3WinningSquare;
        break;
      case 'final':
        winningSquareStr = finalWinningSquare;
        break;
    }

    if (!winningSquareStr) return false;
    
    const winningSquareNum = parseInt(winningSquareStr, 10);
    return !isNaN(winningSquareNum) && userPurchasedSquares.has(winningSquareNum);
  };

  const pills: WinnerPill[] = [
    { label: 'Q1', number: q1WinningSquare || null, period: 'q1' },
    { label: 'Q2', number: q2WinningSquare || null, period: 'q2' },
    { label: 'Q3', number: q3WinningSquare || null, period: 'q3' },
    { label: 'Final', number: finalWinningSquare || null, period: 'final' },
  ];

  const getPillColor = (period: string, isAssigned: boolean) => {
    if (!isAssigned) {
      return {
        bg: 'bg-black/30',
        border: '',
        text: 'text-gray-600'
      };
    }
    
    return {
      bg: 'bg-gradient-to-br from-[#B8860B] to-[#A0740A]',
      border: '',
      text: 'text-white'
    };
  };

  const accentGlowRgb = '184, 134, 11'; // Same as SweepstakesBoardCard

  return (
    <div 
      className="bg-gradient-to-b from-background-primary from-0% to-[#B8860B] to-10% p-4 rounded-xl shadow-lg glow-border-gold max-w-xs sm:max-w-sm md:max-w-md mx-auto mt-6 mb-20"
    >
      <h3 className="text-white text-lg font-bold mb-4 text-center">
        Winning Squares
      </h3>
      
      <div className="grid grid-cols-4 gap-3">
        {pills.map((pill, idx) => {
          const isAssigned = !!pill.number;
          const colors = getPillColor(pill.period, isAssigned);
          const isCurrent = isLive && !isAssigned && currentQuarter === idx + 1;

          return (
            <div
              key={pill.period}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 rounded-lg transition-all overflow-hidden",
                "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none",
                "shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
                colors.bg,
                colors.border && "border-2",
                colors.border,
                isCurrent && "ring-2 ring-[#B8860B] ring-offset-2 ring-offset-transparent"
              )}
            >
              {isAssigned ? (
                <>
                  {/* Assigned: Label container top, Number container bottom */}
                  <div className="w-full flex items-center justify-center">
                    <span className={cn(
                      "text-xs font-semibold uppercase",
                      doesUserOwnWinningSquare(pill.period)
                        ? "bg-gradient-to-r from-[#FFE08A] via-[#E7B844] to-[#E0B954] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(231,184,68,0.8)]"
                        : colors.text
                    )}>
                      {pill.label}
                    </span>
                  </div>
                  <Separator className={cn(
                    "my-1 w-full",
                    doesUserOwnWinningSquare(pill.period)
                      ? "bg-gradient-to-r from-[#FFE08A] via-[#E7B844] to-[#E0B954] shadow-[0_0_8px_rgba(231,184,68,0.6)]"
                      : "bg-white/20"
                  )} />
                  <div className="w-full flex items-center justify-center mb-2">
                    <span className={cn(
                      "text-2xl font-bold font-mono",
                      doesUserOwnWinningSquare(pill.period)
                        ? "bg-gradient-to-r from-[#FFE08A] via-[#E7B844] to-[#E0B954] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(231,184,68,0.8)]"
                        : colors.text
                    )}>
                      {pill.number}
                    </span>
                  </div>

                  {/* Winner badge - full-width bar at bottom */}
                  {doesUserOwnWinningSquare(pill.period) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-[#FFE08A] via-[#E7B844] to-[#E0B954] flex items-center justify-center py-1 text-[10px] font-bold text-white uppercase shadow-[0_0_12px_rgba(231,184,68,0.8)] z-10 rounded-b-lg">
                      Winner
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Unassigned: Dashes container top, Label container bottom */}
                  <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col">
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-500">
                        --
                      </span>
                    </div>
                    <Separator className="w-full bg-white/20" />
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#B8860B] to-[#A0740A] flex items-center justify-center py-3 rounded-b-lg before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none">
                          <span className="text-xs font-semibold uppercase text-gray-400">
                            {pill.label}
                          </span>
                        </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Glow effect CSS - exact match to SweepstakesBoardCard */}
      <style jsx>{`
        .glow-border-gold {
          box-shadow: 0 8px 20px 4px rgba(${accentGlowRgb}, 0.55);
        }
      `}</style>
    </div>
  );
}
