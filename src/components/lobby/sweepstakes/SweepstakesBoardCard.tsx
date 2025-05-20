import React, { useState, ChangeEvent, memo, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils'; // Assuming you have this utility
import { User } from 'firebase/auth'; // Import User type
import { Board } from '@/types/lobby'; // Import Board type
import { Board as BoardType, TeamInfo, SquareEntry } from '@/types/lobby';
import { User as FirebaseUser } from 'firebase/auth'; // Import User from firebase/auth
import { Button } from '@/components/ui/button';
import { Loader2, Ticket } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, DocumentData, DocumentReference, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from 'react-hot-toast';

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
  openWalletDialog: (type: 'setup' | 'deposit', reqAmount?: number, boardIdToEnter?: string | null) => void;
  walletHasWallet: boolean | null;
  walletBalance: number;
  walletIsLoading: boolean;
}

// Define SweepstakesMiniGrid props
interface SweepstakesMiniGridProps {
  highlightedNumber?: number | string;
  allTakenSet?: Set<number>;
  takenByUserSet?: Set<number>;
  gridLineColor?: string;
  unselectedSquareBg?: string;
  unselectedSquareTextColor?: string;
  otherUserSelectedSquareBg?: string;
  otherUserSelectedSquareTextColor?: string;
  takenByUserSquareBg?: string;
  takenByUserSquareTextColor?: string;
  highlightedSquareBaseBg?: string;
  highlightedSquareBaseTextColor?: string;
  highlightedSquareGlowClass?: string;
  highlightedSquareTextSizeClass?: string;
  cellBorderRadius?: string;
}

// --- Sweepstakes Mini Grid Component (Internal or separate file) ---
// Renders the visual grid, similar to BoardMiniGrid
const SweepstakesMiniGrid = memo(({
  highlightedNumber,
  allTakenSet,
  takenByUserSet,
  gridLineColor = 'bg-black/10',
  unselectedSquareBg = 'bg-black/10',
  unselectedSquareTextColor = 'text-[#B8860B]',
  otherUserSelectedSquareBg = 'bg-black/30',
  otherUserSelectedSquareTextColor = 'text-gray-500',
  takenByUserSquareBg = 'bg-[#B8860B]',
  takenByUserSquareTextColor = 'text-[#eeeeee]',
  highlightedSquareBaseBg = 'bg-black/10',
  highlightedSquareBaseTextColor = 'text-[#B8860B]',
  highlightedSquareGlowClass = 'shadow-[0_0_12px_2px_rgba(184,134,11,0.6)]',
  highlightedSquareTextSizeClass = 'text-xs sm:text-sm',
  cellBorderRadius = 'rounded'
}: SweepstakesMiniGridProps) => {
  const squares = Array.from({ length: 100 }, (_, i) => i);
  const highlightedSq = highlightedNumber !== undefined && highlightedNumber !== '' ? parseInt(String(highlightedNumber), 10) : null;

  const lineThicknessPadding = 'p-[6px]';
  const lineThicknessGap = 'gap-[6px]';

  return (
    <div className={cn(
        `grid grid-cols-10 aspect-square w-full rounded-md`,
        lineThicknessPadding,
        lineThicknessGap,
        gridLineColor
      )}>
      {squares.map((sq) => {
        const isHighlightedByInput = highlightedSq !== null && sq === highlightedSq;
        const isTakenByUser = takenByUserSet?.has(sq);
        const isTakenByOther = allTakenSet?.has(sq) && !isTakenByUser;

        let currentSquareBg = unselectedSquareBg;
        let currentTextColor = unselectedSquareTextColor;
        let currentTextSizeClass = 'text-[7px] sm:text-[8px]';
        let currentGlowClass = '';

        if (isTakenByUser) {
            currentSquareBg = takenByUserSquareBg;
            currentTextColor = takenByUserSquareTextColor;
            if (isHighlightedByInput) {
                currentTextSizeClass = highlightedSquareTextSizeClass;
                currentGlowClass = highlightedSquareGlowClass;
            }
        } else if (isTakenByOther) {
            currentSquareBg = otherUserSelectedSquareBg;
            currentTextColor = otherUserSelectedSquareTextColor;
        } else if (isHighlightedByInput) {
            currentSquareBg = highlightedSquareBaseBg;
            currentTextColor = highlightedSquareBaseTextColor;
            currentTextSizeClass = highlightedSquareTextSizeClass;
            currentGlowClass = highlightedSquareGlowClass;
        }

        return (
        <div
          key={sq}
          className={cn(
            `aspect-square flex items-center justify-center font-mono cursor-pointer transition-all duration-150 ease-in-out`,
            `border border-black/20`,
            currentSquareBg,
            currentTextColor,
            currentTextSizeClass,
            currentGlowClass,
            cellBorderRadius
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
    openWalletDialog,
  walletHasWallet,
  walletBalance,
    walletIsLoading
  } = props;

  const [currentUserSquaresSet, setCurrentUserSquaresSet] = useState<Set<number>>(new Set());
  const [isLoadingSelections, setIsLoadingSelections] = useState<boolean>(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [isCurrentUserParticipant, setIsCurrentUserParticipant] = useState<boolean>(false);
  const [isLoadingParticipantStatus, setIsLoadingParticipantStatus] = useState<boolean>(true);

  const isActive = entryInteraction.boardId === board.id;
  const currentStage = isActive ? entryInteraction.stage : 'idle';
  
  const parsedNumberToHighlight = inputValue && inputValue.trim() !== '' ? parseInt(inputValue, 10) : undefined;
  const finalNumberToHighlight = isNaN(parsedNumberToHighlight as number) ? undefined : parsedNumberToHighlight;

  const allTakenSet = useMemo(() => new Set((board?.selected_indexes as number[] | undefined) || []), [board?.selected_indexes]);

  // Add these logs to see prop and state changes
  console.log('[SweepstakesBoardCard] Rendering. Board Prop Selected Indexes:', board?.selected_indexes);
  console.log('[SweepstakesBoardCard] Current currentUserSquaresSet state:', currentUserSquaresSet);

  useEffect(() => {
    // Ensure we have the necessary IDs
    if (!board?.id || !currentUserId) {
      console.log("[SweepstakesBoardCardComponent Fetch Selections] Missing boardId or currentUserId.");
      setCurrentUserSquaresSet(new Set()); // Clear squares if IDs are missing
      setIsLoadingSelections(false);
      setSelectionError(null);
      return;
    }

    // Function to fetch selections
    const fetchUserSelections = async () => {
      console.log(`[SweepstakesBoardCardComponent Fetch Selections] Fetching for board ${board.id}, user ${currentUserId}`);
      setIsLoadingSelections(true);
      setSelectionError(null);
      setCurrentUserSquaresSet(new Set()); // Clear previous selections during fetch

      try {
        const functions = getFunctions(undefined, "us-east1"); // Ensure region is correct
        const getSelectionsFn = httpsCallable(functions, 'getBoardUserSelections');

        // Call the function with the boardID
        const result = await getSelectionsFn({ boardID: board.id });

        // Process the result
        const data = result.data as { selectedIndexes?: number[] }; // Type assertion
        if (data?.selectedIndexes && Array.isArray(data.selectedIndexes)) {
          setCurrentUserSquaresSet(new Set(data.selectedIndexes));
          console.log(`[SweepstakesBoardCardComponent Fetch Selections] Success for board ${board.id}:`, data.selectedIndexes);
        } else {
          console.warn(`[SweepstakesBoardCardComponent Fetch Selections] Unexpected data format for board ${board.id}:`, data);
          setCurrentUserSquaresSet(new Set()); // Set empty on unexpected format
        }
      } catch (error: any) {
        console.error(`[SweepstakesBoardCardComponent Fetch Selections] Error calling getBoardUserSelections for board ${board.id}:`, error);
        setSelectionError(error.message || "Failed to fetch your selections.");
        setCurrentUserSquaresSet(new Set()); // Clear squares on error
        // Optionally show a toast for the error
        // toast.error(error.message || "Failed to fetch your selections.");
      } finally {
        setIsLoadingSelections(false);
      }
    };

    fetchUserSelections();

    // No cleanup function needed as it's a one-time call per dependency change

  }, [board?.id, currentUserId]); // Dependencies: re-fetch if board or user changes

  // ADDED: useEffect to check if user is already a participant
  useEffect(() => {
    const checkParticipation = async () => {
      // Use user?.uid directly from the prop for current authenticated user
      if (!board?.sweepstakesID || !user?.uid) {
        setIsLoadingParticipantStatus(false);
        // Ensure isCurrentUserParticipant is also reset if critical IDs are missing
        if (isCurrentUserParticipant) { // Only log and set if it's changing
            console.log("[SweepstakesBoardCardComponent CheckParticipation] Resetting isCurrentUserParticipant to false due to missing sweepstakesID or user UID.");
            setIsCurrentUserParticipant(false);
        } else {
            // If already false, and IDs missing, it's expected, perhaps less verbose logging or none
            console.log("[SweepstakesBoardCardComponent CheckParticipation] Missing sweepstakesID or user UID; isCurrentUserParticipant already false or will be set by isLoadingParticipantStatus.");
        }
        return;
      }

      setIsLoadingParticipantStatus(true);
      console.log(`[SweepstakesBoardCardComponent CheckParticipation] Checking for sweepstakes: ${board.sweepstakesID}, user: ${user.uid}`);

      try {
        const functions = getFunctions(undefined, "us-east1"); // Ensure region matches
        const checkParticipantFn = httpsCallable(functions, 'checkSweepstakesParticipation');
        
        const result = await checkParticipantFn({ sweepstakesID: board.sweepstakesID });
        const data = result.data as { isParticipant?: boolean };

        console.log(`[SweepstakesBoardCardComponent CheckParticipation] Raw data from checkParticipantFn:`, JSON.stringify(data)); // Log raw data

        if (typeof data?.isParticipant === 'boolean') {
          console.log(`[SweepstakesBoardCardComponent CheckParticipation] About to set isCurrentUserParticipant to: ${data.isParticipant} (from cloud function)`);
          setIsCurrentUserParticipant(data.isParticipant);
          // Log the state *after* React processes the update (can be tricky due to async nature of setState, but this gives intent)
          console.log(`[SweepstakesBoardCardComponent CheckParticipation] Intended isCurrentUserParticipant state now: ${data.isParticipant} for sweepstakes ${board.sweepstakesID}`);
        } else {
          console.warn("[SweepstakesBoardCardComponent CheckParticipation] Unexpected data format from checkSweepstakesParticipation:", data);
          console.log(`[SweepstakesBoardCardComponent CheckParticipation] About to set isCurrentUserParticipant to: false (due to unexpected format)`);
          setIsCurrentUserParticipant(false);
        }
      } catch (error: any) {
        console.error("[SweepstakesBoardCardComponent CheckParticipation] Error calling checkSweepstakesParticipation:", error);
        console.log(`[SweepstakesBoardCardComponent CheckParticipation] About to set isCurrentUserParticipant to: false (due to error)`);
        setIsCurrentUserParticipant(false);
      } finally {
        setIsLoadingParticipantStatus(false);
        console.log(`[SweepstakesBoardCardComponent CheckParticipation] Finished participation check. isLoadingParticipantStatus: false.`);
      }
    };

    checkParticipation();

  }, [board?.sweepstakesID, user?.uid, isCurrentUserParticipant]); // Added isCurrentUserParticipant to deps to re-evaluate if it externally changes, though typically it's internally managed by this effect.

  useEffect(() => {
    const centralSelectedStr = entryInteraction.selectedNumber !== null ? String(entryInteraction.selectedNumber) : null;

    if (isActive) {
      if (centralSelectedStr !== inputValue) {
        setInputValue(centralSelectedStr === null ? "" : centralSelectedStr);
      }
    } else {
      if (inputValue !== "") {
        setInputValue("");
      }
    }
  }, [isActive, entryInteraction.selectedNumber, board.id, inputValue]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    let valStr = e.target.value.replace(/\D/g, '');
    if (valStr.length > 2) valStr = valStr.slice(0, 2);
    
    setInputValue(valStr);

    const numToSend = valStr === '' ? null : parseInt(valStr, 10);

    if (!isActive || currentStage === 'idle' || currentStage === 'confirming') {
      if (valStr !== '' || (currentStage === 'idle' && valStr === '')) {
          handleBoardAction('START_ENTRY', board.id);
      }
    }
    handleBoardAction('SET_NUMBER', board.id, numToSend);
  }, [isActive, currentStage, handleBoardAction, board.id]);

  const processEnterOrConfirm = useCallback(async () => {
    console.log("processEnterOrConfirm called");
    if (isLoadingParticipantStatus || isCurrentUserParticipant) {
        console.log("processEnterOrConfirm: Aborted due to loading participation status or already participated.");
        return;
    }
    if (!user) {
      onProtectedAction(); 
      return;
    }
    console.log("User object UID in processEnterOrConfirm:", user?.uid);
    console.log("Current stage in processEnterOrConfirm:", currentStage);

    // ADDED: Attempt to get a fresh token to ensure auth state is current
    if (typeof user.getIdToken === 'function') {
      try {
        const token = await user.getIdToken(true); // true forces a refresh
        console.log("Auth token refreshed successfully. Token for debugging:", token);
      } catch (tokenError) {
        console.error("Failed to refresh auth token:", tokenError);
        toast.error("Authentication session issue. Please try signing in again.");
      onProtectedAction();
        return; // Stop execution if token refresh fails
      }
    }
    // END ADDED SECTION

    const numToSubmitString = isActive && entryInteraction.selectedNumber !== null 
                               ? String(entryInteraction.selectedNumber) 
                               : inputValue;

    if (numToSubmitString === null || numToSubmitString.trim() === '') {
        toast.error("Please enter a number."); return;
    }
    const selectedNumInt = parseInt(numToSubmitString, 10);
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
        const functions = getFunctions(undefined, "us-east1");
        const enterBoardFn = httpsCallable(functions, 'enterBoard');
        try {
            // --- ADD DETAILED LOGGING HERE ---
            if (user) {
                console.log('[SweepstakesBoardCard] Current User UID:', user.uid);
                try {
                    const currentIdToken = await user.getIdToken(false); // Get current token without forcing refresh initially
                    console.log('[SweepstakesBoardCard] Current ID Token (no force refresh):', currentIdToken);
                    // Optionally, decode and log parts of it if you have a client-side JWT decoder, or just log the first few chars
                    const freshIdToken = await user.getIdToken(true); // Force refresh
                    console.log('[SweepstakesBoardCard] Fresh ID Token (forced refresh):', freshIdToken);
                } catch (tokenError) {
                    console.error('[SweepstakesBoardCard] Error getting ID token:', tokenError);
                }
    } else {
                console.log('[SweepstakesBoardCard] User object is null before calling enterBoardFn.');
            }
            console.log(`[SweepstakesBoardCard] Calling enterBoardFn with: boardId: ${board.id}, selectedNumber: ${selectedNumInt}, sweepstakesId: ${board.sweepstakesID}`);
            // --- END DETAILED LOGGING ---

            const payload: { boardId: string; selectedNumber: number; sweepstakesId?: string } = {
                boardId: board.id,
                selectedNumber: selectedNumInt,
            };

            if (board.sweepstakesID) {
                payload.sweepstakesId = board.sweepstakesID; // Ensure key is 'sweepstakesId'
            }

            const result = await enterBoardFn(payload);
            toast.dismiss(toastId);
            if ((result.data as any)?.success) {
                toast.success('Sweepstakes entry successful! Good luck!');
                handleBoardAction('ENTRY_COMPLETED_RESET', board.id);
                setInputValue(""); // Also reset inputValue locally
                setIsCurrentUserParticipant(true);
                // Optimistically update current user's squares
                setCurrentUserSquaresSet(prev => {
                    const newSet = new Set(prev);
                    newSet.add(selectedNumInt); // selectedNumInt is available in this scope
                    console.log('[SweepstakesBoardCard] Optimistically updated currentUserSquaresSet:', newSet); // Log the change
                    return newSet;
                });
            } else { throw new Error((result.data as any)?.error || 'Cloud function reported failure.'); }
        } catch (err: any) {
            toast.dismiss(toastId);
            console.error("SWEEPSTAKES_ENTRY_ERR:", err);
            toast.error(err.message || "Failed to process entry.");
            handleBoardAction('CANCEL_CONFIRM', board.id);
        }
    }
  }, [user, onProtectedAction, isActive, entryInteraction.selectedNumber, inputValue, allTakenSet, currentUserSquaresSet, currentStage, handleBoardAction, board.id, isLoadingParticipantStatus, isCurrentUserParticipant]);

  const handleCancelConfirm = useCallback(() => {
    handleBoardAction('CANCEL_CONFIRM', board.id);
  }, [handleBoardAction, board.id]);

  const accentGlowRgb = '184, 134, 11';
  const gradientStyle = { background: `linear-gradient(to bottom, rgb(var(--color-background-primary)) 0%, #B8860B 15%, #B8860B 100%)` };

  return (
    <div 
      className={`p-4 rounded-xl shadow-lg glow-border-gold max-w-xs sm:max-w-sm md:max-w-md mx-auto mt-6 relative mb-20`}
      style={gradientStyle}
    >
      <div className="p-3 mb-3 rounded-md bg-black/10 backdrop-blur-sm flex items-center space-x-4 h-16">
        <span className="text-base text-white font-semibold flex-shrink-0 select-none">
          {isLoadingParticipantStatus ? "Checking status..." :
           isCurrentUserParticipant ? "You're already entered!" :
           "Choose Your Number 0-99:"}
        </span>

        {isLoadingParticipantStatus ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#B8860B]" />
          </div>
        ) : !isCurrentUserParticipant ? (
          <input
            type="text" inputMode="numeric" pattern="[0-9]*" value={inputValue} onChange={handleInputChange} placeholder="##" maxLength={2}
            disabled={(currentStage === 'confirming' && isActive) || walletIsLoading || isLoadingSelections}
            className="w-16 h-10 text-center bg-black/10 text-[#B8860B] font-mono text-2xl rounded-md border-none placeholder:text-[#B8860B]/70 focus:ring-2 focus:ring-[#B8860B] outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-inner"
          />
        ) : (
          <div className="flex-1 flex justify-center items-center">
            <Ticket className="h-7 w-7 text-green-400" /> 
            <span className="ml-2 text-green-400 font-semibold">Good Luck!</span>
        </div>
        )}

        <div className={cn(
            'flex-1 min-w-0 flex',
            currentStage === 'confirming' && isActive && !isCurrentUserParticipant && !isLoadingParticipantStatus
                ? 'flex-col items-end space-y-1' 
                : 'items-center justify-end'
        )}>
            {!isLoadingParticipantStatus && !isCurrentUserParticipant && (
                (currentStage === 'confirming' && isActive) ? (
                    <>
                        <Button
                            onClick={processEnterOrConfirm}
                            disabled={walletIsLoading || isLoadingSelections}
                            className="px-4 py-1 text-xs font-semibold rounded-md border h-6 bg-[#DAA520] hover:bg-[#B8860B] border-[#8B4513] text-white transition-colors w-full"
                        >
                            {(walletIsLoading || isLoadingSelections) && <Loader2 className="h-3 w-3 animate-spin mr-1 inline-block" />}CONFIRM
                        </Button>
                        <Button
                            onClick={handleCancelConfirm}
                            disabled={walletIsLoading || isLoadingSelections}
                            variant="outline"
                            className="px-4 py-1 text-xs font-semibold rounded-md border h-6 border-[#B8860B]/70 text-[#B8860B] hover:bg-[#B8860B]/20 hover:text-yellow-300 transition-colors w-full"
                        >
                            CANCEL
                        </Button>
                    </>
                ) : (
                    <Button
                        onClick={processEnterOrConfirm}
                        disabled={
                            walletIsLoading || isLoadingSelections ||
                            inputValue.trim() === '' || 
                            (inputValue.trim() !== '' && isNaN(parseInt(inputValue,10))) || 
                            (allTakenSet.has(parseInt(inputValue,10)) && !currentUserSquaresSet.has(parseInt(inputValue,10)))
                        }
                 className={cn(
                            `px-4 py-2 text-sm font-semibold rounded-md border transition-colors h-10`,
                            'bg-yellow-700/80 hover:bg-yellow-600/80 border-yellow-800/90 text-yellow-200/90 disabled:bg-yellow-800/50 disabled:border-yellow-900/50 disabled:text-yellow-300/50 disabled:cursor-not-allowed'
                        )}
                    >
                        {(walletIsLoading || isLoadingSelections) && <Loader2 className="h-4 w-4 animate-spin mr-1 inline-block" />}ENTER
                    </Button>
                )
            )}
        </div>
      </div>

      <div className="rounded-md bg-black/30 backdrop-blur-xs shadow-inner border-none mt-2">
           <SweepstakesMiniGrid
              highlightedNumber={finalNumberToHighlight}
              allTakenSet={allTakenSet}
              takenByUserSet={currentUserSquaresSet}
           />
      </div>
      <style jsx>{`
        .glow-border-gold { box-shadow: 0 8px 20px 4px rgba(${accentGlowRgb}, 0.55); }
      `}</style>
    </div>
  );
} 

SweepstakesBoardCardComponent.displayName = 'SweepstakesBoardCard';
export default memo(SweepstakesBoardCardComponent); 