import React, { useState, ChangeEvent, memo, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils'; // Assuming you have this utility
import { User } from 'firebase/auth'; // Import User type
import { Board } from '@/types/lobby'; // Import Board type
import { Board as BoardType, TeamInfo, SquareEntry } from '@/types/lobby';
import { User as FirebaseUser } from 'firebase/auth'; // Import User from firebase/auth
import { Button } from '@/components/ui/button';
import { Loader2, Ticket, X as XIcon } from 'lucide-react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from 'react-hot-toast';

// Define EntryInteractionState locally based on expected shape from LobbyPage
interface EntryInteractionState {
  boardId: string | null;
  stage: 'idle' | 'selecting' | 'confirming';
  selectedNumber: number | null;
}

interface SweepstakesBoardCardProps {
  board: BoardType;
  user: FirebaseUser | null;
  onProtectedAction: () => void; 
  entryInteraction: EntryInteractionState;
  handleBoardAction: (action: string, boardId: string, value?: any) => void;
  openWalletDialog: (type: 'setup' | 'deposit' | 'sweepstakes', reqAmount?: number, boardIdToEnter?: string | null) => void;
  walletHasWallet: boolean | null;
  walletBalance: number;
  walletIsLoading: boolean;
}

interface SweepstakesMiniGridThemeProps {
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

interface SweepstakesMiniGridProps {
  highlightedNumber?: number | null;
  allTakenSet?: Set<number>;
  takenByUserSet?: Set<number>;
  theme?: SweepstakesMiniGridThemeProps;
  onSquareClick?: (squareNumber: number) => void;
}

const defaultMiniGridTheme: Required<SweepstakesMiniGridThemeProps> = {
  gridLineColor: 'bg-black/10',
  unselectedSquareBg: 'bg-gradient-to-br from-black/10 to-black/20',
  unselectedSquareTextColor: 'text-[#B8860B]',
  otherUserSelectedSquareBg: 'bg-gradient-to-br from-black/30 to-black/40',
  otherUserSelectedSquareTextColor: 'text-gray-500',
  takenByUserSquareBg: 'bg-gradient-to-br from-[#B8860B] to-[#A0740A]',
  takenByUserSquareTextColor: 'text-white',
  highlightedSquareBaseBg: 'bg-gradient-to-br from-black/10 to-yellow-700/20',
  highlightedSquareBaseTextColor: 'text-[#B8860B]',
  highlightedSquareGlowClass: 'shadow-[0_0_12px_2px_rgba(184,134,11,0.6)]',
  highlightedSquareTextSizeClass: 'text-sm sm:text-base',
  cellBorderRadius: 'rounded'
};

const SweepstakesMiniGrid = memo(({
  highlightedNumber,
  allTakenSet,
  takenByUserSet,
  theme = {},
  onSquareClick
}: SweepstakesMiniGridProps) => {
  const currentTheme = { ...defaultMiniGridTheme, ...theme };
  const {
    gridLineColor,
    unselectedSquareBg,
    unselectedSquareTextColor,
    otherUserSelectedSquareBg,
    otherUserSelectedSquareTextColor,
    takenByUserSquareBg,
    takenByUserSquareTextColor,
    highlightedSquareBaseBg,
    highlightedSquareBaseTextColor,
    highlightedSquareGlowClass,
    highlightedSquareTextSizeClass,
    cellBorderRadius
  } = currentTheme;

  const squares = Array.from({ length: 100 }, (_, i) => i);
  const highlightedSq =
    typeof highlightedNumber === 'number' && Number.isFinite(highlightedNumber)
      ? highlightedNumber
      : null;

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
        let currentTextSizeClass = 'text-[9px] sm:text-[10px]';
        let currentGlowClass = '';
        let squareContent = String(sq).padStart(2, '0');

        if (isTakenByUser) {
            currentSquareBg = takenByUserSquareBg;
            currentTextColor = takenByUserSquareTextColor;
            currentTextSizeClass = highlightedSquareTextSizeClass;
            if (isHighlightedByInput) {
                currentGlowClass = highlightedSquareGlowClass;
            }
        } else if (isTakenByOther) {
            currentSquareBg = otherUserSelectedSquareBg;
            currentTextColor = otherUserSelectedSquareTextColor;
            squareContent = 'X';
        } else if (isHighlightedByInput) {
            currentSquareBg = highlightedSquareBaseBg;
            currentTextColor = highlightedSquareBaseTextColor;
            currentTextSizeClass = highlightedSquareTextSizeClass;
            currentGlowClass = highlightedSquareGlowClass;
        }

        return (
        <div
          key={sq}
          onClick={() => onSquareClick && onSquareClick(sq)}
          className={cn(
            `aspect-square flex items-center justify-center font-mono transition-all duration-150 ease-in-out`,
            `border border-black/20`,
            onSquareClick ? 'cursor-pointer' : 'cursor-default',
            currentSquareBg,
            currentTextColor,
            currentTextSizeClass,
            currentGlowClass,
            cellBorderRadius
        )}
        >
            {squareContent}
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
  const [agreeToSweepstakes, setAgreeToSweepstakes] = useState<boolean | null>(null);

  const isActive = entryInteraction.boardId === board.id;
  const currentStage = isActive ? entryInteraction.stage : 'idle';
  
  const parsedNumberToHighlight = inputValue && inputValue.trim() !== '' ? parseInt(inputValue, 10) : undefined;
  const finalNumberToHighlight = isNaN(parsedNumberToHighlight as number) ? undefined : parsedNumberToHighlight;

  const allTakenSet = useMemo(() => new Set((board?.selected_indexes as number[] | undefined) || []), [board?.selected_indexes]);

  // Check if the authenticated user has already entered the sweepstakes linked to this board
  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      // If no user or no sweepstakes association, don't block UI
      const sweepId = typeof (board as any)?.sweepstakesID === 'string'
        ? (board as any).sweepstakesID
        : (typeof (board as any)?.sweepstakesID?.id === 'string' ? (board as any).sweepstakesID.id : null);

      if (!user?.uid || !sweepId) {
        if (!isCancelled) {
          setIsCurrentUserParticipant(false);
          setIsLoadingParticipantStatus(false);
        }
        return;
      }

      try {
        setIsLoadingParticipantStatus(true);
        const functions = getFunctions(undefined, "us-east1");
        const checkFn = httpsCallable(functions, 'checkSweepstakesParticipation');
        const result = await checkFn({ sweepstakesID: sweepId });
        const isParticipant = Boolean((result?.data as any)?.isParticipant);
        if (!isCancelled) {
          setIsCurrentUserParticipant(isParticipant);
        }
      } catch (_err) {
        // Fail-open: allow entering; just stop loading state
      } finally {
        if (!isCancelled) setIsLoadingParticipantStatus(false);
      }
    };

    run();
    return () => { isCancelled = true; };
  }, [board?.sweepstakesID, user?.uid]);

  useEffect(() => {
    if (!board?.id || !user?.uid) {
      setCurrentUserSquaresSet(new Set()); 
      setIsLoadingSelections(false);
      setSelectionError(null);
      return;
    }

    const fetchUserSelections = async () => {
      setIsLoadingSelections(true);
      setSelectionError(null);
      setCurrentUserSquaresSet(new Set()); 

      try {
        const functions = getFunctions(undefined, "us-east1"); 
        const getSelectionsFn = httpsCallable(functions, 'getBoardUserSelections');
        const result = await getSelectionsFn({ boardID: board.id });
        const data = result.data as { selectedIndexes?: number[] }; 
        if (data?.selectedIndexes && Array.isArray(data.selectedIndexes)) {
          setCurrentUserSquaresSet(new Set(data.selectedIndexes));
        } else {
          setCurrentUserSquaresSet(new Set()); 
        }
      } catch (error: any) {
        setSelectionError(error.message || "Failed to fetch your selections.");
        setCurrentUserSquaresSet(new Set()); 
        toast.error(error.message || "Failed to load your selections. Please refresh.");
      } finally {
        setIsLoadingSelections(false);
      }
    };

    fetchUserSelections();
  }, [board?.id, user?.uid]);

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

  const handleMiniGridSquareClick = useCallback((squareNumber: number) => {
    if (isLoadingParticipantStatus || isCurrentUserParticipant) return; // Don't allow selection if already entered or loading status
    if (!user) {
      onProtectedAction();
      return;
    }

    setInputValue(String(squareNumber).padStart(2, '0'));

    // If not already interacting with this board, or in idle state, start interaction
    if (!isActive || currentStage === 'idle') {
      handleBoardAction('START_ENTRY', board.id);
    }
    // Set the number in the central state
    handleBoardAction('SET_NUMBER', board.id, squareNumber);
  }, [user, isActive, currentStage, handleBoardAction, board.id, onProtectedAction, isLoadingParticipantStatus, isCurrentUserParticipant]);

  const processEnterOrConfirm = useCallback(async () => {
    if (isLoadingParticipantStatus || isCurrentUserParticipant) {
        return;
    }
    if (!user) {
      onProtectedAction(); 
      return;
    }

    if (!walletHasWallet) {
      openWalletDialog('sweepstakes', 0, board.id);
      return;
    }

    if (typeof user.getIdToken === 'function') {
      try {
        await user.getIdToken(true); 
      } catch (tokenError) {
        toast.error("Authentication error. Please sign in again.");
        onProtectedAction();
        return; 
      }
    }

    const numToSubmitString = isActive && entryInteraction.selectedNumber !== null 
                               ? String(entryInteraction.selectedNumber) 
                               : inputValue;

    if (numToSubmitString === null || numToSubmitString.trim() === '') {
        toast.error("Please select a number (0-99)."); return;
    }
    const selectedNumInt = parseInt(numToSubmitString, 10);
    if (isNaN(selectedNumInt) || selectedNumInt < 0 || selectedNumInt > 99) {
        toast.error("Invalid number. Must be 0-99."); return;
    }
    if (allTakenSet.has(selectedNumInt) && !currentUserSquaresSet.has(selectedNumInt)) {
        toast.error("This number is already taken."); return;
    }

    if (currentStage === 'idle' || currentStage === 'selecting') {
        handleBoardAction('REQUEST_CONFIRM', board.id);
    } else if (currentStage === 'confirming') {
        const toastId = toast.loading('Processing your entry...');
        const functions = getFunctions(undefined, "us-east1");
        const enterBoardFn = httpsCallable(functions, 'enterBoard');
        try {
            const payload: { boardId: string; selectedNumber: number; sweepstakesId?: string } = {
                boardId: board.id,
                selectedNumber: selectedNumInt,
            };

            if (board.sweepstakesID) {
                payload.sweepstakesId = board.sweepstakesID; 
            }

            const result = await enterBoardFn(payload);
            toast.dismiss(toastId);
            if ((result.data as any)?.success) {
                toast.success('Entry successful! Good luck!');
                handleBoardAction('ENTRY_COMPLETED_RESET', board.id);
                setInputValue(""); 
                setIsCurrentUserParticipant(true);
                setCurrentUserSquaresSet(prev => {
                    const newSet = new Set(prev);
                    newSet.add(selectedNumInt); 
                    return newSet;
                });
            } else { throw new Error((result.data as any)?.error || 'Cloud function reported failure.'); }
        } catch (err: any) {
            toast.dismiss(toastId);
            toast.error(err.message || "Entry failed. Please try again.");
            handleBoardAction('CANCEL_CONFIRM', board.id);
        }
    }
  }, [user, onProtectedAction, isActive, entryInteraction.selectedNumber, inputValue, allTakenSet, currentUserSquaresSet, currentStage, handleBoardAction, board.id, board.sweepstakesID, isLoadingParticipantStatus, isCurrentUserParticipant, walletHasWallet, openWalletDialog]);

  const handleCancelConfirm = useCallback(() => {
    handleBoardAction('CANCEL_CONFIRM', board.id);
  }, [handleBoardAction, board.id]);

  const accentGlowRgb = '184, 134, 11';

  const sweepstakesGridTheme: SweepstakesMiniGridThemeProps = {
    gridLineColor: 'bg-black/10',
    unselectedSquareBg: 'bg-gradient-to-br from-black/10 to-black/20',
    unselectedSquareTextColor: 'text-[#B8860B]',
    otherUserSelectedSquareBg: 'bg-gradient-to-br from-black/30 to-black/40',
    otherUserSelectedSquareTextColor: 'text-gray-500',
    takenByUserSquareBg: 'bg-gradient-to-br from-[#B8860B] to-[#A0740A]',
    takenByUserSquareTextColor: 'text-white',
    highlightedSquareBaseBg: 'bg-gradient-to-br from-black/10 to-yellow-700/20',
    highlightedSquareBaseTextColor: 'text-[#B8860B]',
    highlightedSquareGlowClass: 'shadow-[0_0_12px_2px_rgba(184,134,11,0.7)]',
    highlightedSquareTextSizeClass: 'text-sm sm:text-base',
    cellBorderRadius: 'rounded-sm'
  };


  return (
    <div 
      className={`bg-[#B8860B] p-4 rounded-xl shadow-lg glow-border-gold max-w-xs sm:max-w-sm md:max-w-md mx-auto mt-6 relative mb-20 ${isActive ? 'ring-2 ring-[#5855e0] z-40' : ''}`}
    >
      {/* Fade area above the "Choose Your Pick" container */}
      <div className="h-8 bg-gradient-to-b from-background-primary from-0% to-[#B8860B] to-100% rounded-t-xl -m-4 mb-0"></div>
      <div className="p-3 mb-3 rounded-md bg-black/10 backdrop-blur-sm flex items-center justify-between space-x-2 min-h-16">
        <span className="text-sm sm:text-base text-white font-semibold select-none min-w-0">
          {isLoadingParticipantStatus ? "Checking status..." :
           isCurrentUserParticipant ? "You're already entered!" :
           (isActive && currentStage === 'confirming' && entryInteraction.selectedNumber !== null) ?
            `Selected Pick: ${String(entryInteraction.selectedNumber).padStart(2, '0')}` :
            "Choose Your Pick 0-99:"}
        </span>

        {isLoadingParticipantStatus ? (
          <div className="flex-grow flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#B8860B]" />
          </div>
        ) : !isCurrentUserParticipant ? (
          // User is not a participant yet
          (isActive && currentStage === 'confirming') ? (
            // In confirming stage, input is replaced by confirm/cancel buttons (which are to the right and will expand)
            <div className="w-0 h-10 flex-shrink-0" /> // Empty, non-visible placeholder
          ) : (
            // Not confirming, show the input field
            <div className="relative w-20 h-10 flex-shrink-0">
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" value={inputValue} onChange={handleInputChange} placeholder="##" maxLength={2}
                disabled={(currentStage === 'confirming' && isActive) || walletIsLoading || isLoadingSelections}
                className="w-full h-full text-center bg-black/10 text-[#B8860B] font-mono text-2xl rounded-md border-none placeholder:text-[#B8860B]/70 focus:ring-2 focus:ring-[#B8860B] outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-inner"
              />
              {inputValue && !((currentStage === 'confirming' && isActive) || walletIsLoading || isLoadingSelections) && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    handleBoardAction('SET_NUMBER', board.id, null);
                    // Reset interaction to idle when input is cleared by user
                    if (isActive) {
                      handleBoardAction('ENTRY_COMPLETED_RESET', board.id);
                    }
                  }}
                  className="absolute top-[-6px] right-[-6px] p-0.5 bg-black/20 rounded-full text-[#B8860B]/70 hover:text-[#B8860B] hover:bg-black/40 transition-all z-10"
                  aria-label="Clear input"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        ) : (
          // User IS a participant
          <div className="flex-1 flex justify-center items-center">
            <Ticket className="h-7 w-7 text-green-400" /> 
            <span className="ml-2 text-green-400 font-semibold">Good Luck!</span>
        </div>
        )}

        <div className={cn(
            'flex items-center',
            (isActive && currentStage === 'confirming' && !isCurrentUserParticipant && !isLoadingParticipantStatus)
                ? 'flex-grow justify-evenly space-x-2' // Adjusted space-x-1 to space-x-2 for consistency
                : 'flex-shrink-0 justify-end'
        )}>
            {!isLoadingParticipantStatus && !isCurrentUserParticipant && (
                (currentStage === 'confirming' && isActive) ? (
                    <>
                        <Button
                            onClick={processEnterOrConfirm}
                            disabled={walletIsLoading || isLoadingSelections}
                            className="px-3 py-2 text-sm font-semibold rounded-md border h-auto bg-[#DAA520] hover:bg-[#B8860B] border-[#8B4513] text-white transition-colors flex-1 min-w-0"
                        >
                            {(walletIsLoading || isLoadingSelections) && <Loader2 className="h-4 w-4 animate-spin mr-1 inline-block" />}CONFIRM
                        </Button>
                        <Button
                            onClick={handleCancelConfirm}
                            disabled={walletIsLoading || isLoadingSelections}
                            variant="outline"
                            className="px-3 py-2 text-sm font-semibold rounded-md border h-auto border-[#B8860B]/70 text-[#B8860B] hover:bg-[#B8860B]/20 hover:text-yellow-300 transition-colors flex-1 min-w-0"
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
                            'text-white border-yellow-700 hover:border-yellow-600',
                            'bg-gradient-to-br from-yellow-600 via-yellow-700 to-yellow-800 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700',
                            'disabled:bg-gradient-to-br disabled:from-yellow-800/50 disabled:via-yellow-900/50 disabled:to-yellow-950/50 disabled:border-yellow-900/60 disabled:text-yellow-300/60 disabled:cursor-not-allowed'
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
              theme={sweepstakesGridTheme}
              onSquareClick={handleMiniGridSquareClick}
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