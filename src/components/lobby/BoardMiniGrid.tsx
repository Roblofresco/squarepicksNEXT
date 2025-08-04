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

  const squares = Array.from({ length: 100 }, (_, i) => i);
  const preSelectedSq = highlightedNumber !== undefined && highlightedNumber !== '' ? parseInt(String(highlightedNumber), 10) : null;
  
  const allTakenSet = useMemo(() => 
    new Set((boardData?.selected_indexes as number[] | undefined) || [])
  , [boardData?.selected_indexes]);

  return (
    <div className="grid grid-cols-10 gap-px p-1 bg-black/20 border border-white rounded-sm">
      {squares.map((sq) => {
        const isCurrentUserPurchased = currentUserSelectedSquares ? currentUserSelectedSquares.has(sq) : false; 
        const isPreSelectedByCurrentUser = preSelectedSq !== null && sq === preSelectedSq;
        const isTakenByOther = allTakenSet.has(sq) && !isCurrentUserPurchased;
        
        let squareStyle = '';
        let textColor = '';
        let textStyle: CSSProperties = {};
        let squareContent = String(sq).padStart(2, '0');
        let additionalClasses = '';

        if (isCurrentUserPurchased) {
          // Game Page `isPurchasedByCurrentUser` style
          squareStyle = 'bg-gradient-to-br from-[#1bb0f2] to-[#108bcc]'; 
          textColor = 'text-white';
          additionalClasses = 'font-semibold opacity-90';
          textStyle = {}; 
        } else if (isTakenByOther) {
          // Darker/duller green with X style, further increased opacity
          squareStyle = 'bg-gradient-to-br from-green-900/60 to-green-950/60'; 
          textColor = 'text-slate-400'; 
          squareContent = 'X';
          textStyle = {};
          additionalClasses = ''; // Reset any unintended carry-over
        } else if (isPreSelectedByCurrentUser) {
          // Game Page `isSelectedByCurrentUserPreConfirmation` style
          squareStyle = 'bg-gradient-to-br from-[#d43dae] to-[#c02090]'; 
          textColor = 'text-white';
          additionalClasses = 'ring-2 ring-[#d43dae]'; 
          textStyle = { textShadow: '0px 0px 5px rgba(255, 255, 255, 0.7)' }; 
        } else {
          // Reverted to original BoardMiniGrid available square style - hover effects removed
          squareStyle = 'bg-gradient-to-br from-green-700/70 to-green-900/70';
          textColor = 'text-white';
          textStyle = {};
          additionalClasses = '';
        }

        return (
        <div 
          key={sq} 
            className={`aspect-square flex items-center justify-center text-[9px] font-mono rounded-[1px] cursor-pointer transition-all duration-150 ease-in-out border border-white/10 
                        ${squareStyle} ${textColor} ${additionalClasses}`}
          style={textStyle}
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