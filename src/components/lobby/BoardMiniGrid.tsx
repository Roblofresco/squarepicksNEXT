import React, { memo, useMemo } from 'react';
// import { db } from '@/lib/firebase'; // No longer needed for direct DB access
// import { collection, query, where, onSnapshot, DocumentData, DocumentReference, doc } from 'firebase/firestore'; // No longer needed
import { Board as BoardType } from '@/types/lobby';

interface BoardMiniGridProps {
  boardData?: BoardType | null; // Simplified DocumentData away as BoardType should be used
  // currentUserId?: string | null; // No longer needed for internal fetching
  currentUserSelectedSquares?: Set<number>; // Squares purchased by current user
  highlightedNumber?: number | string; // Square pre-selected by current user for action
  showCurrentUserSquares?: boolean;
  showHighlightedSquare?: boolean;
  legendSquares?: number[];
  forcedCurrentUserSquares?: Set<number>;
}

const BoardMiniGrid = memo(({
  boardData,
  currentUserSelectedSquares,
  highlightedNumber,
  showCurrentUserSquares = true,
  showHighlightedSquare = true,
  legendSquares = [],
  forcedCurrentUserSquares
}: BoardMiniGridProps) => {
  // const [currentUserSquaresSet, setCurrentUserSquaresSet] = useState<Set<number>>(new Set()); // Removed
  // Internal useEffect for fetching user squares is REMOVED

  const squares = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);
  const preSelectedSq = showHighlightedSquare && highlightedNumber !== undefined && highlightedNumber !== '' ? parseInt(String(highlightedNumber), 10) : null;

  const allTakenSet = useMemo(() => {
    const base = new Set((boardData?.selected_indexes as number[] | undefined) || []);
    if (legendSquares.length > 0) {
      legendSquares.slice(1).forEach((sq) => base.add(sq));
    }
    return base;
  }, [boardData?.selected_indexes, legendSquares]);

  const currentUserSquaresSet = useMemo(() => {
    if (forcedCurrentUserSquares) {
      return forcedCurrentUserSquares;
    }
    if (!showCurrentUserSquares) {
      return new Set<number>();
    }

    if (currentUserSelectedSquares && currentUserSelectedSquares.size > 0) {
      return currentUserSelectedSquares;
    }
    const fallback = boardData?.currentUserSelectedIndexes as number[] | undefined;
    if (fallback && fallback.length > 0) {
      return new Set(fallback);
    }
    return new Set<number>();
  }, [showCurrentUserSquares, currentUserSelectedSquares, boardData?.currentUserSelectedIndexes, forcedCurrentUserSquares]);

  const baseSquareClasses = 'aspect-square flex items-center justify-center text-[9px] font-mono rounded-[1px] cursor-pointer border border-white/10 transition-all duration-150 ease-in-out bg-transparent';

  return (
    <div className="grid grid-cols-10 gap-[2px] p-1 bg-black/20 backdrop-blur-[1px] border border-white/10 rounded-md">
      {squares.map((sq) => {
        const isLegendAvailable = legendSquares[0] === sq;
        const isLegendTaken = legendSquares[1] === sq;
        const isLegendOwned = legendSquares[2] === sq;

        const isCurrentUserPurchased = isLegendOwned || currentUserSquaresSet.has(sq);
        const isPreSelectedByCurrentUser = !isLegendAvailable && !isLegendTaken && preSelectedSq !== null && sq === preSelectedSq;
        const isTakenByOther = (isLegendTaken || allTakenSet.has(sq)) && !isCurrentUserPurchased;
        let squareContent = String(sq).padStart(2, '0');
        const classes: string[] = [baseSquareClasses];

        if (isCurrentUserPurchased) {
          classes.push(
            'bg-gradient-to-br',
            'from-[#4fd1ff99]',
            'via-[#2bb4f588]',
            'to-[#1587d877]',
            'text-white',
            'font-semibold',
            'ring-2',
            'ring-[#8be2ff]/60',
            'shadow-[0_0_16px_rgba(79,209,255,0.55)]'
          );
        } else if (isPreSelectedByCurrentUser) {
          classes.push(
            'bg-gradient-to-br',
            'from-[#ec489999]',
            'via-[#c026d388]',
            'to-[#7c3aed77]',
            'text-white',
            'font-semibold',
            'ring-2',
            'ring-[#f472b6]/60',
            'shadow-[0_0_12px_rgba(236,72,153,0.35)]'
          );
        } else if (isTakenByOther) {
          classes.push(
            'bg-gradient-to-br',
            'from-[#0d341c99]',
            'via-[#08221488]',
            'to-[#04150c77]',
            'text-slate-400',
            'opacity-80'
          );
          squareContent = 'X';
        } else {
          classes.push(
            'bg-gradient-to-br',
            'from-[#2fa87499]',
            'via-[#1f7f5788]',
            'to-[#15604377]',
            'text-white'
          );
        }

        // Legend squares keep the same visual treatment but retain default text (number or X)

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