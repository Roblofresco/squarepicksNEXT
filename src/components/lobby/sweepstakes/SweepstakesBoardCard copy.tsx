import React, { useState, ChangeEvent, memo, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils'; // Assuming you have this utility
import { User } from 'firebase/auth'; // Import User type
import { Board } from '@/types/lobby'; // Import Board type
import { Board as BoardType, TeamInfo, SquareEntry } from '@/types/lobby';
import { User as FirebaseUser } from 'firebase/auth'; // Import User from firebase/auth
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, DocumentData, DocumentReference, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from 'react-hot-toast';
// import { useHandleSweepstakesInteraction } from '@/hooks/useHandleSweepstakesInteraction'; // Commented out due to import error

// Define EntryInteractionState locally based on expected shape from LobbyPage
interface EntryInteractionState {
  boardId: string | null;
  stage: 'idle' | 'selecting' | 'confirming';
  selectedNumber: number | string | null;
}

interface SweepstakesBoardCardProps {
  board: BoardType;
  user: FirebaseUser | null;
  currentUserId?: string | null;
  onProtectedAction: () => void; 
  entryInteraction: EntryInteractionState;
  handleBoardAction: (action: string, boardId: string, value?: any) => void;
  walletIsLoading: boolean;
}

// Define SweepstakesMiniGrid props
interface SweepstakesMiniGridProps {
  highlightedNumber?: number | string;
  allTakenSet?: Set<number>; // All taken squares from board.selected_indexes
  currentUserSet?: Set<number>; // Live squares taken by the current user from subcollection
  gridLineColor?: string; // New: For the color of the grid lines and outer border
  unselectedSquareBg?: string;
  unselectedSquareTextColor?: string;
  otherUserSelectedSquareBg?: string;
  otherUserSelectedSquareTextColor?: string;
  currentUserSelectedSquareBg?: string;
  currentUserSelectedSquareTextColor?: string;
  highlightedSquareBg?: string;      // Highlight for selection process
  highlightedSquareTextColor?: string;
  cellBorderRadius?: string;
}

// --- Sweepstakes Mini Grid Component (Internal or separate file) ---
// Renders the visual grid, similar to BoardMiniGrid
const SweepstakesMiniGrid = memo(({
  highlightedNumber,
  allTakenSet,
  currentUserSet,
  gridLineColor = 'bg-black/10', // CHANGED: Lighter grid lines
  unselectedSquareBg = 'bg-black/30', // CHANGED
  unselectedSquareTextColor = 'text-[#B8860B]', // CHANGED
  otherUserSelectedSquareBg = 'bg-black/30', // CHANGED: Same as unselected
  otherUserSelectedSquareTextColor = 'text-yellow-600', // CHANGED: Dull gold
  currentUserSelectedSquareBg = 'bg-[#B8860B]', // CHANGED: Gold fill
  currentUserSelectedSquareTextColor = 'text-[#eeeeee]', // REMAINS SAME
  highlightedSquareBg = 'bg-yellow-400',    
  highlightedSquareTextColor = 'text-black',
  cellBorderRadius = 'rounded'
}: SweepstakesMiniGridProps) => {
  const squares = Array.from({ length: 100 }, (_, i) => i);
  const highlightedSq = highlightedNumber !== undefined && highlightedNumber !== '' ? parseInt(String(highlightedNumber), 10) : null;

  // Increased line thickness
  const lineThicknessPadding = 'p-[6px]'; // Outer border thickness (e.g., 6px)
  const lineThicknessGap = 'gap-[6px]';     // Inner grid line thickness (e.g., 6px)

  return (
    // Grid container: BG is gridLineColor, padding creates outer border, gap creates inner lines.
    <div className={cn(
        `grid grid-cols-10 aspect-square w-full rounded-md`, // Increased border radius
        lineThicknessPadding, 
        lineThicknessGap,     
        gridLineColor         // Background of this container IS the grid line color
      )}>
      {squares.map((sq) => {
        const isHighlighted = highlightedSq !== null && sq === highlightedSq;
        const isCurrentUserSelected = currentUserSet?.has(sq);
        const isTakenByOther = allTakenSet?.has(sq) && !isCurrentUserSelected;
        
        let currentSquareBg = unselectedSquareBg;
        let currentTextColor = unselectedSquareTextColor;
        // NO individual border on cells anymore

        if (isCurrentUserSelected) { 
            currentSquareBg = currentUserSelectedSquareBg; 
            currentTextColor = currentUserSelectedSquareTextColor; 
        }
        else if (isTakenByOther) { 
            currentSquareBg = otherUserSelectedSquareBg; 
            currentTextColor = otherUserSelectedSquareTextColor; 
        }
        else if (isHighlighted) { 
            currentSquareBg = highlightedSquareBg; 
            currentTextColor = highlightedSquareTextColor; 
        }

        return (
          // Cells have no border of their own; lines are formed by the parent grid's background visible through gaps.
          <div key={sq} className={cn(
              `aspect-square flex items-center justify-center text-[7px] sm:text-[8px] font-mono cursor-pointer transition-colors`,
              currentSquareBg, 
              currentTextColor,
              cellBorderRadius // Apply dynamic cell rounding
          )}>
            {String(sq).padStart(2, '0')}
          </div>
        );
      })}
    </div>
  );
});
SweepstakesMiniGrid.displayName = 'SweepstakesMiniGrid';

const SweepstakesBoardCardComponent = (props: SweepstakesBoardCardProps) => {
  const {
  board,
  user, 
    currentUserId,
  onProtectedAction, 
  entryInteraction,
  handleBoardAction,
    walletIsLoading
  } = props;

  console.log('[SweepstakesBoardCard] Received board prop:', JSON.parse(JSON.stringify(board || {}))); // Log the board prop

  const [currentUserSquaresSet, setCurrentUserSquaresSet] = useState<Set<number>>(new Set());
  // Use local state for the input field value directly
  const [inputValue, setInputValue] = useState<string>("");
  const [allTakenSet, setAllTakenSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (board?.selected_indexes && Array.isArray(board.selected_indexes)) {
      console.log('[SweepstakesBoardCard] Raw board.selected_indexes:', board.selected_indexes);
      const newAllTakenSet = new Set(board.selected_indexes.map(idx => Number(idx)));
      setAllTakenSet(newAllTakenSet);
      console.log('[SweepstakesBoardCard] Generated allTakenSet:', newAllTakenSet);
    } else {
      console.log('[SweepstakesBoardCard] board.selected_indexes is missing or not an array');
      setAllTakenSet(new Set());
    }
  }, [board?.selected_indexes]);

  useEffect(() => {
    if (!board?.id || !user || !currentUserId) {
      setCurrentUserSquaresSet(new Set());
      console.log('[SweepstakesBoardCard] Missing board.id, user, or currentUserId for fetching user squares.');
      return;
    }

    const userDocRef = doc(db, "users", currentUserId);
    console.log('[SweepstakesBoardCard] userDocRef path for query:', userDocRef.path);

    const q = query(
      collection(db, "boards", board.id, "squares"),
      where("userID", "==", userDocRef)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const squares = new Set<number>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Assuming squareIndex is the field name storing the number of the square
        if (typeof data.squareIndex === 'number') {
          squares.add(data.squareIndex);
        } else if (typeof data.squareIndex === 'string') {
          squares.add(Number(data.squareIndex));
        }
      });
      setCurrentUserSquaresSet(squares);
      console.log('[SweepstakesBoardCard] Fetched currentUserSquaresSet:', squares);
    }, (error) => {
      console.error("[SweepstakesBoardCard] Error fetching user squares:", error);
      setCurrentUserSquaresSet(new Set());
    });
    return () => unsubscribe();
  }, [board?.id, user, currentUserId]);

  const isActive = entryInteraction.boardId === board.id;
  const currentStage = isActive ? entryInteraction.stage : 'idle';
  
  // Corrected type for numberToHighlight
  const numberToHighlight = inputValue && inputValue.trim() !== '' ? parseInt(inputValue, 10) : undefined;
  // We also need to ensure that if parseInt results in NaN, it becomes undefined.
  const parsedNumberToHighlight = inputValue && inputValue.trim() !== '' ? parseInt(inputValue, 10) : undefined;
  const finalNumberToHighlight = isNaN(parsedNumberToHighlight as number) ? undefined : parsedNumberToHighlight;

  // const allTakenSet = useMemo(() => new Set((board?.selected_indexes as number[] | undefined) || []), [board?.selected_indexes]); // Removed: Redundant with useState version
  
  // Update inputValue if the central interaction state changes for this board
  useEffect(() => {
    if (isActive && entryInteraction.selectedNumber !== null && String(entryInteraction.selectedNumber) !== inputValue) {
        setInputValue(String(entryInteraction.selectedNumber).padStart(2,'0'));
    } else if (isActive && entryInteraction.selectedNumber === null && inputValue !== "") {
        // If central state cleared for this active board, clear input
        // setInputValue(""); // Or let user clear it manually
    }
  }, [isActive, entryInteraction.selectedNumber, inputValue]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    let valStr = e.target.value.replace(/\D/g, '');
    if (valStr.length > 2) valStr = valStr.slice(0, 2);
    setInputValue(valStr);
    if (!isActive || currentStage === 'idle' || currentStage === 'confirming') { // If confirming, any input change reverts to selecting
        handleBoardAction('START_ENTRY', board.id);
    }
    handleBoardAction('SET_NUMBER', board.id, valStr === '' ? null : parseInt(valStr, 10));
  };

  const processEnterOrConfirm = async () => {
    if (!user) { onProtectedAction(); return; }
    const numToSubmit = isActive && entryInteraction.selectedNumber !== null ? entryInteraction.selectedNumber : inputValue;
    if (numToSubmit === null || String(numToSubmit).trim() === '') {
        toast.error("Please enter a number."); return;
    }
    const selectedNumInt = parseInt(String(numToSubmit), 10);
    if (isNaN(selectedNumInt) || selectedNumInt < 0 || selectedNumInt > 99) {
        toast.error("Invalid number selected."); return;
    }
    if (allTakenSet.has(selectedNumInt) && !currentUserSquaresSet.has(selectedNumInt)) {
        toast.error("This number is already taken."); return;
    }
    if (currentStage === 'idle' || currentStage === 'selecting') {
        handleBoardAction('REQUEST_CONFIRM', board.id);
    } else if (currentStage === 'confirming') {
        const toastId = toast.loading('Entering Sweepstakes...');
        const functions = getFunctions();
        const enterBoardFn = httpsCallable(functions, 'enterBoard');
        try {
            const result = await enterBoardFn({ boardId: board.id, selectedNumber: selectedNumInt });
            toast.dismiss(toastId);
            if ((result.data as any)?.success) {
                toast.success('Sweepstakes entry successful! Good luck!');
                handleBoardAction('ENTRY_COMPLETED_RESET', board.id);
                setInputValue("");
            } else { throw new Error((result.data as any)?.error || 'Cloud function reported failure.'); }
        } catch (err: any) {
            toast.dismiss(toastId);
            console.error("SWEEPSTAKES_ENTRY_ERR:", err);
            toast.error(err.message || "Failed to process entry.");
            handleBoardAction('CANCEL_CONFIRM', board.id);
        }
    }
  };

  const handleCancelConfirm = () => {
    handleBoardAction('CANCEL_CONFIRM', board.id);
    // Optionally revert input to confirmed number, or clear it
    // setInputValue(String(entryInteraction.selectedNumber).padStart(2,'0')); 
  }

  return (
    <div className={cn(
        `w-full max-w-md mx-auto mt-4 p-3 rounded-lg shadow-[0_0_15px_0px_rgba(184,134,11,0.5)]`, // Shadow, removed border
        `bg-gradient-to-b from-background-primary to-[#B8860B] to-10%` 
    )}>
      {/* Input Bar: More transparent, larger elements */}
      <div className="p-3 mb-3 rounded-md bg-black/10 backdrop-blur-sm flex items-center space-x-4 h-16"> {/* Increased height, adjusted background, removed shadow-inner */} 
        <span className="text-base text-white font-semibold flex-shrink-0 select-none">Choose Your Number 0-99:</span> {/* Increased text size */}
        {/* Number Input: Larger size */}
          <input
            type="text" inputMode="numeric" pattern="[0-9]*" value={inputValue} onChange={handleInputChange} placeholder="##" maxLength={2}
            disabled={(currentStage === 'confirming' && isActive) || walletIsLoading}
            className="w-16 h-10 text-center bg-yellow-800/50 text-yellow-100 font-mono text-2xl rounded-md border-none placeholder:text-yellow-300/70 focus:ring-2 focus:ring-yellow-400 outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-inner" // Increased size, text size, adjusted bg/border
        />
        {/* Conditional Buttons */} 
        {!(currentStage === 'confirming' && isActive) && (
            // ENTER Button: Larger size
            (<Button
                onClick={processEnterOrConfirm}
                disabled={walletIsLoading || inputValue.trim() === '' || (allTakenSet.has(parseInt(inputValue,10)) && !currentUserSquaresSet.has(parseInt(inputValue,10)))}
          className={cn(
                    `px-4 py-2 text-sm font-semibold rounded-md border transition-colors h-10`, // Increased size, text size, padding
                    'bg-yellow-700/80 hover:bg-yellow-600/80 border-yellow-800/90 text-yellow-200/90 disabled:bg-yellow-800/50 disabled:border-yellow-900/50 disabled:text-yellow-300/50 disabled:cursor-not-allowed' 
                )}
            >
              {walletIsLoading && <Loader2 className="h-4 w-4 animate-spin mr-1 inline-block" />}ENTER {/* Adjusted loader size */}
            </Button>)
        )}
        {currentStage === 'confirming' && isActive && (
            // Confirm/Cancel Buttons: Adjusted height to match input
            (<div className="flex space-x-2">
              <Button
                onClick={processEnterOrConfirm}
                disabled={walletIsLoading}
                 className="px-4 py-2 text-sm font-semibold rounded-md border bg-green-600 hover:bg-green-700 border-green-700/80 text-white h-10" // Increased size
             >
                 {walletIsLoading && <Loader2 className="h-4 w-4 animate-spin mr-1 inline-block" />}CONFIRM
             </Button>
              <Button
                  onClick={handleCancelConfirm}
                 disabled={walletIsLoading}
                  variant="outline"
                  className="px-4 py-2 text-sm font-semibold rounded-md border bg-red-600 hover:bg-red-700 border-red-700/80 text-white h-10" // Increased size
              >
                  CANCEL
              </Button>
            </div>)
        )}
      </div>
      {/* Grid Indentation Wrapper - Adjusted for potentially larger input bar */}
      <div className="rounded-md bg-black/30 backdrop-blur-xs shadow-inner border-none mt-2"> {/* Removed border from here, padding applied by grid now */}
        <SweepstakesMiniGrid 
            highlightedNumber={finalNumberToHighlight}
            allTakenSet={allTakenSet}
            currentUserSet={currentUserSquaresSet}
            gridLineColor="bg-black/10" // Pass updated default
            unselectedSquareBg="bg-black/30" // Pass updated default
            unselectedSquareTextColor="text-[#B8860B]" // Pass updated default
            otherUserSelectedSquareBg="bg-black/30" // Pass updated default
            otherUserSelectedSquareTextColor="text-yellow-600" // Pass updated default
            currentUserSelectedSquareBg="bg-[#B8860B]" // Pass updated default
            currentUserSelectedSquareTextColor="text-[#eeeeee]" // Pass updated default
            highlightedSquareBg="bg-yellow-400"    
            highlightedSquareTextColor="text-black"
            cellBorderRadius="rounded"
        />
      </div>
    </div>
  );
} 

SweepstakesBoardCardComponent.displayName = 'SweepstakesBoardCard';
export default memo(SweepstakesBoardCardComponent); 