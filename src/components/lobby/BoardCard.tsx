import React, { memo, useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User as FirebaseUser } from 'firebase/auth';
import { Board as BoardType, Game as GameType, TeamInfo, SquareEntry } from '@/types/lobby';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, limit, DocumentData, DocumentReference, doc } from 'firebase/firestore';
import { BOARD_STATUS_OPEN } from '@/config/lobbyConfig';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

import BoardMiniGrid from './BoardMiniGrid';
import QuickEntrySelector from './QuickEntrySelector';

// Local EntryInteractionState definition (if not imported globally)
interface EntryInteractionState {
  boardId: string | null;
  stage: 'idle' | 'selecting' | 'confirming';
  selectedNumber: number | null;
}

interface BoardCardProps {
    game: GameType; // Receives the full game object (with resolved teams)
    // teamA: TeamInfo; // Redundant if game.teamA is guaranteed by LobbyPage - REMOVED
    // teamB: TeamInfo; // Redundant if game.teamB is guaranteed by LobbyPage - REMOVED
    user: FirebaseUser | null;
    currentUserId?: string | null;
    onProtectedAction: () => void;
    entryInteraction: EntryInteractionState;
    handleBoardAction: (action: string, boardId: string, value?: any) => void; // Keep for UI state changes
    walletHasWallet: boolean | null; // Needed for enabling entry flow
    walletBalance: number;
    walletIsLoading: boolean;
    openWalletDialog: (type: 'setup' | 'deposit', requiredAmount?: number, boardIdToEnter?: string | null) => void;
}

const BoardCard = memo((props: BoardCardProps) => {
  const {
    game,
    // teamA, // Use game.teamA directly - ALREADY COMMENTED
    // teamB, // Use game.teamB directly - ALREADY COMMENTED
    user,
    currentUserId,
    onProtectedAction,
    entryInteraction,
    handleBoardAction,
    walletHasWallet,
    walletBalance,
    walletIsLoading,
    openWalletDialog
  } = props;

  const router = useRouter();

  // State for the single active board associated with this game
  const [activeBoard, setActiveBoard] = useState<BoardType | null>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState<boolean>(true);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [boardCardCurrentUserSquaresSet, setBoardCardCurrentUserSquaresSet] = useState<Set<number>>(new Set()); // New state for user's squares
  const [purchaseTrigger, setPurchaseTrigger] = useState<number>(0); // Added for re-fetching
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState<boolean>(false);

  // Effect to listen for the active board for this game
  useEffect(() => {
    if (!game?.id) {
      setIsLoadingBoard(false);
      setActiveBoard(null);
      return () => {}; // Explicit no-op cleanup
    }

    setIsLoadingBoard(true);
    setBoardError(null);

    const boardsRef = collection(db, 'boards');
    // Query for the single open board linked to this specific game.id
    const q = query(
      boardsRef, 
      where("gameID", "==", doc(db, 'games', game.id)), // Query using DocumentReference
      where("status", "==", BOARD_STATUS_OPEN), 
      where("amount", "==", 1), // Only $1 boards
      limit(1)
    );

    const unsubscribeBoard = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const boardDoc = querySnapshot.docs[0];
        const boardData = boardDoc.data();
        // Map Firestore data to BoardType
        setActiveBoard({
          id: boardDoc.id,
          gameID: boardData.gameID as DocumentReference,
          entryFee: boardData.amount || 0,
          amount: boardData.amount,
          status: boardData.status,
          selected_indexes: boardData.selected_indexes,
          sweepstakes_select: boardData.sweepstakes_select,
          isFreeEntry: boardData.amount === 0 || boardData.sweepstakes_select === true,
          // teamA/teamB are resolved from the game prop
          teamA: game.teamA, 
          teamB: game.teamB,
          // prize, currentUserSelectedIndexes populated elsewhere/later
        } as BoardType);
      } else {
        setActiveBoard(null); // No open board found for this game
      }
      setIsLoadingBoard(false);
    }, (error) => {
      console.error(`Error fetching board for game ${game.id}:`, error);
      setBoardError("Failed to load board details.");
      setIsLoadingBoard(false);
      setActiveBoard(null);
    });

    return () => unsubscribeBoard(); // Cleanup listener on unmount or game change

  }, [game.id, game.teamA, game.teamB, purchaseTrigger]); // Added purchaseTrigger

  // New effect to fetch current user's squares for the activeBoard
  useEffect(() => {
    if (!activeBoard?.id || !currentUserId) {
      setBoardCardCurrentUserSquaresSet(new Set()); // Reset if no board or user
      return () => {}; // Explicit no-op cleanup for early exit
    }

    const squaresSubcollectionRef = collection(db, 'boards', activeBoard.id, 'squares');
    const userDocRef = doc(db, 'users', currentUserId);
    const userSquaresQuery = query(squaresSubcollectionRef, where("userID", "==", userDocRef)); 

    const unsubscribeUserSquares = onSnapshot(userSquaresQuery, (snapshot) => {
      const squares = new Set<number>();
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Partial<SquareEntry>; // Ensure SquareEntry is imported or defined
        if (typeof data.index === 'number') { 
          squares.add(data.index);
        }
      });
      setBoardCardCurrentUserSquaresSet(squares);
    }, (error) => {
      console.error(`Error fetching user squares for board ${activeBoard.id} in BoardCard:`, error);
      setBoardCardCurrentUserSquaresSet(new Set()); // Reset on error
    });

    return () => unsubscribeUserSquares(); // Cleanup listener

  }, [activeBoard?.id, currentUserId, purchaseTrigger]); // Added purchaseTrigger

  // Determine if the interaction state applies to *this* card's active board
  const isActiveInteraction = activeBoard ? entryInteraction.boardId === activeBoard.id : false;
  const currentStage = isActiveInteraction ? entryInteraction.stage : 'idle';
  const currentSelectedNumber = isActiveInteraction ? entryInteraction.selectedNumber : null;
  
  // Use the selected_indexes from the live activeBoard state
  const takenNumbersSet = useMemo(() => 
    new Set((activeBoard?.selected_indexes as number[] | undefined) || [])
  , [activeBoard?.selected_indexes]);

  const handleGridLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
        event.preventDefault();
        onProtectedAction();
    }
    // Optionally, could trigger START_ENTRY if grid click means intent to enter
    // if(activeBoard) handleBoardAction('START_ENTRY', activeBoard.id);
  };

  // Get resolved team data directly from the enriched game prop
  const teamA = game.teamA;
  const teamB = game.teamB;
  const isLiveGame = Boolean(game.isLive ?? game.is_live);

  // Calculate logo styles (can be memoized if needed)
  const shadowColorHexA = teamA?.seccolor || teamA?.color;
  const shadowColorRgbaA = shadowColorHexA ? `${shadowColorHexA}80` : 'rgba(255,255,255,0.4)';
  const logoFilterStyleA = { filter: `drop-shadow(0 0 4px ${shadowColorRgbaA})` };

  const shadowColorHexB = teamB?.seccolor || teamB?.color;
  const shadowColorRgbaB = shadowColorHexB ? `${shadowColorHexB}80` : 'rgba(255,255,255,0.4)';
  const logoFilterStyleB = { filter: `drop-shadow(0 0 4px ${shadowColorRgbaB})` };

  const containerRounding = 'rounded-3xl';
  const gradientBg = 'bg-gradient-to-b from-[#0a0e1b] to-[#1f2937] to-25%';
  const borderStyle = 'border-[1.5px] border-[#1bb0f2]'; // Consider making border conditional on activeBoard existence?
  const shadowStyle = 'shadow-[0px_0px_40px_-20px_#63c6ff]';

  const handlePurchaseSuccess = (boardId: string) => {
    if (activeBoard && boardId === activeBoard.id) {
      setPurchaseTrigger(prev => prev + 1); // Increment to trigger re-fetch
      setIsPurchaseDialogOpen(true);
    }
  };

  const handleBoardClick = (event: React.MouseEvent<HTMLDivElement>, boardId: string) => {
    if (!user) {
      event.preventDefault();
      onProtectedAction();
    } else {
      router.push(`/board/${boardId}`);
    }
  };

  // --- Render Logic --- 
  if (isLoadingBoard) {
    return (
      <div className={`w-full max-w-[390px] h-[200px] mx-auto p-4 text-white relative overflow-hidden flex flex-col items-center justify-center 
                       ${gradientBg} border border-transparent ${containerRounding} animate-pulse`}>
        <p>Loading Board for {teamA?.name || 'Team A'} vs {teamB?.name || 'Team B'}...</p>
      </div>
    );
  }

  if (!activeBoard) {
    return null; // If no active (open) board, don't render anything for this game
  }

  // --- Render Card with Active Board --- 
  return (
    <>
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`w-full max-w-[390px] h-auto mx-auto p-4 text-white relative overflow-hidden flex flex-col 
                 ${gradientBg} ${borderStyle} ${shadowStyle} ${containerRounding} ${isActiveInteraction ? 'border-[#5855e4] z-40' : 'border-transparent'}
                 transition-shadow duration-200 ease-out hover:shadow-xl hover:ring-2 hover:ring-accent-1/40 will-change-transform`}
    >
      {activeBoard.isFreeEntry && (
         <div className="absolute top-0 left-0 bg-gradient-accent1-accent4 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10">
          Free Entry!
        </div>
      )}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2 w-1/3 justify-start">
          {teamA?.logo ? (
            <Image src={teamA.logo} alt={`${teamA.name} logo`} width={45} height={45} className="rounded-full object-contain flex-shrink-0 transition-transform duration-200 will-change-transform hover:scale-105" style={logoFilterStyleA}/>
          ) : (
            <div className="w-[45px] h-[45px] rounded-full bg-gray-600 flex-shrink-0"></div>
          )}
          <div className="flex flex-col">
            <div className="font-semibold text-sm text-white truncate">{teamA?.name}</div>
            <div className="text-xs text-gray-400">{teamA?.record}</div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-start w-1/3 text-center gap-1 pt-1">
          {isLiveGame && (
            <span className="px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-white bg-red-600 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.45)] animate-pulse">
              Live
            </span>
          )}
          <div className="text-accent-1 font-bold text-xl">@</div>
        </div>
        <div className="flex items-center space-x-2 w-1/3 justify-end">
          <div className="flex flex-col items-end">
            <div className="font-semibold text-sm text-white truncate">{teamB?.name}</div>
            <div className="text-xs text-gray-400">{teamB?.record}</div>
          </div>
          {teamB?.logo ? (
            <Image src={teamB.logo} alt={`${teamB.name} logo`} width={45} height={45} className="rounded-full object-contain flex-shrink-0 transition-transform duration-200 will-change-transform hover:scale-105" style={logoFilterStyleB}/>
          ) : (
            <div className="w-[45px] h-[45px] rounded-full bg-gray-600 flex-shrink-0"></div>
          )}
        </div>
      </div>
      <div className="flex flex-row items-center space-x-4 flex-grow mt-4">
        <Link href={`/game/${game.id}?board=${activeBoard.id}`} legacyBehavior passHref>
          <a onClick={handleGridLinkClick} className="block w-[65%] relative bg-transparent rounded-lg overflow-hidden cursor-pointer border-[1.5px] border-slate-300 shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.25)] hover:ring-2 hover:ring-accent-1 transition-all duration-200">
            <div className="absolute inset-0 z-0">
              <Image src="/images/nfl-grid-background.png" alt="Grid background" fill priority sizes="100vw" style={{ objectFit: 'cover' }} className="rounded-lg"/>
            </div>
            <div className="relative z-10">
               <BoardMiniGrid 
                 boardData={activeBoard} 
                 currentUserSelectedSquares={boardCardCurrentUserSquaresSet} // Pass the fetched set
                 highlightedNumber={currentSelectedNumber !== null ? String(currentSelectedNumber) : undefined} 
               />
            </div>
          </a>
        </Link>
        <div className="w-[35%]">
            <QuickEntrySelector 
              entryFee={activeBoard.entryFee} // Use fee from the fetched board
              isActiveCard={isActiveInteraction}
              stage={currentStage}
              selectedNumber={currentSelectedNumber}
              handleBoardAction={handleBoardAction} // Pass the action handler
              boardId={activeBoard.id} // Use ID from the fetched board
              user={user}
              onProtectedAction={onProtectedAction}
              walletHasWallet={walletHasWallet}
              walletBalance={walletBalance}
              walletIsLoading={walletIsLoading}
              openWalletDialog={openWalletDialog}
              takenNumbers={takenNumbersSet} // Pass the taken set from the fetched board
              onPurchaseSuccess={handlePurchaseSuccess} // Pass the new handler
            />
        </div>
      </div>
    </motion.div>

    {/* Purchase Success Dialog */}
    <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-background-primary/80 via-background-primary/70 to-accent-2/10 border border-white/10 text-white backdrop-blur-xl shadow-[0_0_1px_1px_rgba(255,255,255,0.1)] backdrop-saturate-150">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            Entry Successful
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Your square has been locked in. Good luck!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => setIsPurchaseDialogOpen(false)} className="bg-gradient-to-r from-accent-2/60 via-accent-1/45 to-accent-2/60 hover:opacity-90">Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
});
BoardCard.displayName = 'BoardCard';

export default BoardCard;
