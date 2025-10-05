import React, { memo, useState, useEffect, useMemo, CSSProperties } from 'react';
// import { db } from '@/lib/firebase'; // No longer needed for direct DB access
// import { collection, query, where, onSnapshot, DocumentData, DocumentReference, doc } from 'firebase/firestore'; // No longer needed
import { Board as BoardType, SquareEntry } from '@/types/lobby'; // DocumentData no longer needed from here

interface BoardMiniGridProps {
  boardData?: BoardType | null; // Simplified DocumentData away as BoardType should be used
  // currentUserId?: string | null; // No longer needed for internal fetching
  currentUserSelectedSquares?: Set<number>; // Squares purchased by current user
  highlightedNumber?: number | string; // Square pre-selected by current user for action
}

const BoardMiniGrid = memo(({ boardData, currentUserSelectedSquares, highlightedNumber }: BoardMiniGridProps) => {
  // const [currentUserSquaresSet, setCurrentUserSquaresSet] = useState<Set<number>>(new Set()); // Removed
  // Internal useEffect for fetching user squares is REMOVED

  const squares = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);
  const preSelectedSq = highlightedNumber !== undefined && highlightedNumber !== '' ? parseInt(String(highlightedNumber), 10) : null;

  const allTakenSet = useMemo(() =>
    new Set((boardData?.selected_indexes as number[] | undefined) || [])
  , [boardData?.selected_indexes]);

  const currentUserSquaresSet = useMemo(() => {
    if (currentUserSelectedSquares && currentUserSelectedSquares.size > 0) {
      return currentUserSelectedSquares;
    }
    const fallback = boardData?.currentUserSelectedIndexes as number[] | undefined;
    if (fallback && fallback.length > 0) {
      return new Set(fallback);
    }
    return new Set<number>();
  }, [currentUserSelectedSquares, boardData?.currentUserSelectedIndexes]);

  const baseSquareClasses = 'aspect-square flex items-center justify-center text-[9px] font-mono rounded-[1px] cursor-pointer border border-white/10 transition-all duration-150 ease-in-out';

  return (
    <div className="grid grid-cols-10 gap-[2px] p-1 bg-black/20 backdrop-blur-[1px] border border-white/10 rounded-md">
      {squares.map((sq) => {
        const isCurrentUserPurchased = currentUserSquaresSet.has(sq);
        const isPreSelectedByCurrentUser = preSelectedSq !== null && sq === preSelectedSq;
        const isTakenByOther = allTakenSet.has(sq) && !isCurrentUserPurchased;
        let squareContent = String(sq).padStart(2, '0');
        const classes: string[] = [baseSquareClasses];

        if (isCurrentUserPurchased) {
          classes.push(
            'bg-gradient-to-br',
            'from-[#4fd1ff]',
            'via-[#2bb4f5]',
            'to-[#1587d8]',
            'text-white',
            'font-semibold',
            'ring-2',
            'ring-[#8be2ff]/60',
            'shadow-[0_0_16px_rgba(79,209,255,0.55)]'
          );
        } else if (isPreSelectedByCurrentUser) {
          classes.push(
            'bg-gradient-to-br',
            'from-[#ec4899]',
            'via-[#c026d3]',
            'to-[#7c3aed]',
            'text-white',
            'font-semibold',
            'ring-2',
            'ring-[#f472b6]/60',
            'shadow-[0_0_12px_rgba(236,72,153,0.35)]'
          );
        } else if (isTakenByOther) {
          classes.push(
            'bg-gradient-to-br',
            'from-[#0d341c]',
            'via-[#082214]',
            'to-[#04150c]',
            'text-slate-400',
            'opacity-80'
          );
          squareContent = 'X';
        } else {
          classes.push(
            'bg-gradient-to-br',
            'from-[#2fa874]',
            'via-[#1f7f57]',
            'to-[#156043]',
            'text-white'
          );
        }

        return (
          <div
            key={sq}
            className={classes.join(' ')}
          >
            {squareContent}
          </div>
        );
      })}
    </div>
  );
});
BoardMiniGrid.displayName = 'BoardMiniGrid';

export default BoardMiniGrid; 