import React, { memo, useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase'; // Firebase instance
import { collection, query, where, onSnapshot, DocumentData, DocumentReference, doc } from 'firebase/firestore';
import { Board as BoardType, SquareEntry } from '@/types/lobby'; // Import BoardType if needed, and SquareEntry

// Assuming Board type might be needed if boardData prop is more structured
// import { Board } from '@/types/lobby'; 

interface BoardMiniGridProps {
  // Receive the full BoardType object (or relevant parts)
  boardData?: BoardType | DocumentData | null; 
  currentUserId?: string | null;
  highlightedNumber?: number | string; // For temporary UI highlight during selection process
}

const BoardMiniGrid = memo(({ boardData, currentUserId, highlightedNumber }: BoardMiniGridProps) => {
  const [currentUserSquaresSet, setCurrentUserSquaresSet] = useState<Set<number>>(new Set());
  // const [isLoadingUserSquares, setIsLoadingUserSquares] = useState<boolean>(true);
  // const [userSquaresError, setUserSquaresError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardData?.id || !currentUserId) {
      setCurrentUserSquaresSet(new Set()); // Reset if no board or user
      // setIsLoadingUserSquares(false);
      return () => {}; // Return empty cleanup
    }

    // setIsLoadingUserSquares(true);
    // setUserSquaresError(null);

    const squaresSubcollectionRef = collection(db, 'boards', boardData.id, 'squares');
    // Create a DocumentReference to the user document
    const userDocRef = doc(db, 'users', currentUserId);
    // Query by DocumentReference equality on the 'userID' field
    const userSquaresQuery = query(squaresSubcollectionRef, where("userID", "==", userDocRef)); 
    // Make sure the field name in your squares documents is exactly "userID" and stores a DocumentReference.

    const unsubscribe = onSnapshot(userSquaresQuery, (snapshot) => {
      const squares = new Set<number>();
      snapshot.forEach(docSnap => { // Renamed doc to docSnap to avoid conflict with imported doc
        const data = docSnap.data() as Partial<SquareEntry>;
        if (typeof data.squareIndex === 'number') { 
          squares.add(data.squareIndex);
        }
      });
      setCurrentUserSquaresSet(squares);
      // setIsLoadingUserSquares(false);
    }, (error) => {
      console.error(`Error fetching user squares for board ${boardData.id}:`, error);
      // setUserSquaresError("Failed to load your squares.");
      // setIsLoadingUserSquares(false);
      setCurrentUserSquaresSet(new Set()); // Reset on error
    });

    return () => unsubscribe(); // Cleanup listener

  }, [boardData?.id, currentUserId]); // Re-run if board or user changes

  const squares = Array.from({ length: 100 }, (_, i) => i);
  const highlightedSq = highlightedNumber !== undefined && highlightedNumber !== '' ? parseInt(String(highlightedNumber), 10) : null;
  
  // Get all taken squares from the main board document prop
  const allTakenSet = useMemo(() => 
    new Set((boardData?.selected_indexes as number[] | undefined) || [])
  , [boardData?.selected_indexes]);

  return (
    <div className="grid grid-cols-10 gap-px p-1 bg-black/20 border border-white rounded-sm">
      {squares.map((sq) => {
        const isHighlighted = highlightedSq !== null && sq === highlightedSq;
        // Use the live state for current user's squares
        const isCurrentUserSelected = currentUserSquaresSet.has(sq); 
        // Derive others' selections from the main board data prop
        const isTakenByOther = allTakenSet.has(sq) && !isCurrentUserSelected;
        
        let squareStyle = 'bg-green-700/60 hover:bg-green-600/80';
        let textColor = 'text-white';

        if (isCurrentUserSelected) {
          squareStyle = 'bg-[#d43dae]'; 
          textColor = 'text-white';
        } else if (isTakenByOther) {
          squareStyle = 'bg-[#1bb0f2]'; 
          textColor = 'text-white';
        } else if (isHighlighted) {
          squareStyle = 'bg-yellow-400 hover:bg-yellow-500';
          textColor = 'text-black font-bold';
        }

        return (
        <div 
          key={sq} 
            className={`aspect-square flex items-center justify-center ${textColor} text-[7px] font-mono rounded-[1px] cursor-pointer transition-colors border border-white/10 
                        ${squareStyle}`}
          >
            {String(sq).padStart(2, '0')}
        </div>
        );
      })}
    </div>
  );
});
BoardMiniGrid.displayName = 'BoardMiniGrid';

export default BoardMiniGrid; 