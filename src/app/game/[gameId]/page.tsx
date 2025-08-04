'use client'

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection, query, where, getDocs, doc, getDoc, DocumentReference, Timestamp, limit, onSnapshot
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Game, Board, TeamInfo } from '@/types/lobby';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ArrowLeft, AlertTriangle, Loader2, Info, CircleDot, Crown } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';

// Define types for fetched data
interface GameDetails extends Omit<Game, 'teamA' | 'teamB'> {
  id: string;
  teamA: TeamInfo;
  teamB: TeamInfo;
  start_time: Timestamp;
  home_score?: number;
  away_score?: number;
  time?: string;
  date?: string;
  period?: string;
  broadcast_provider?: string;
  away_team_id: DocumentReference;
  home_team_id: DocumentReference;
}

interface GameBoard extends Omit<Board, 'teamA' | 'teamB' | 'selected_indexes'> {
  selected_indexes?: number[];
  status?: 'open' | 'closed' | 'cancelled';
  gameID: DocumentReference;
}

const MAX_SQUARE_SELECTION_LIMIT = 20;

// --- Helper: Fetch Team Data --- (Assuming this is correct as per previous context)
const getTeamData = async (teamRef: DocumentReference | undefined): Promise<TeamInfo> => {
  const defaultTeam: TeamInfo = { id:'N/A', name: 'N/A', fullName: 'N/A', record: 'N/A', initials: 'N/A', logo: undefined, color: undefined, seccolor: undefined }; 
  if (!teamRef || !(teamRef instanceof DocumentReference)) return defaultTeam;
  try {
    const teamSnap = await getDoc(teamRef);
    if (teamSnap.exists()) {
      const teamData = teamSnap.data();
      return {
        id: teamSnap.id,
        name: teamData.name || 'N/A', 
        fullName: teamData.full_name || teamData.name || 'N/A', 
        record: teamData.record || '0-0',
        initials: teamData.initials || 'N/A',
        logo: teamData.logo || undefined, 
        color: teamData.color || undefined, 
        seccolor: teamData.seccolor || undefined 
      } as TeamInfo;
    } else {
      return defaultTeam;
    }
  } catch (error) {
    console.error("Error fetching team data:", error);
    return defaultTeam;
  }
};

function GamePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const gameId = params.gameId as string;
  const initialEntryAmount = parseInt(searchParams.get('entry') || '1', 10);

  const { 
    hasWallet, 
    balance, 
    isLoading: walletIsLoading,
    userId,
    emailVerified 
  } = useWallet();

  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptType, setPromptType] = useState<'setup' | 'deposit' | null>(null);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [requiredDepositAmount, setRequiredDepositAmount] = useState(0);

  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [currentBoard, setCurrentBoard] = useState<GameBoard | null>(null);
  const [selectedEntryAmount, setSelectedEntryAmount] = useState<number>(initialEntryAmount);
  const [selectedSquares, setSelectedSquares] = useState<Set<number>>(new Set());
  const [currentUserPurchasedSquaresSet, setCurrentUserPurchasedSquaresSet] = useState<Set<number>>(new Set());
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [isLoadingUserSquares, setIsLoadingUserSquares] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [entrySuccessCount, setEntrySuccessCount] = useState(0);
  const [isDisplayingDelayedLoader, setIsDisplayingDelayedLoader] = useState(false);
  const [shakeEntryFee, setShakeEntryFee] = useState(false);
  const entryFeeRef = useRef<HTMLDivElement>(null);

  const isLoadingBoardRef = useRef(isLoadingBoard);
  useEffect(() => {
    isLoadingBoardRef.current = isLoadingBoard;
  }, [isLoadingBoard]);
  const loaderTimerId = useRef<NodeJS.Timeout | null>(null);

  const entryAmounts = [1, 5, 10, 20];

  useEffect(() => {
    if (!gameId) return;
    setIsLoadingGame(true);
    setError(null);
    const fetchGame = async () => {
      try {
        const gameRef = doc(db, 'games', gameId);
        const gameSnap = await getDoc(gameRef);
        if (!gameSnap.exists()) throw new Error('Game not found');
        const gameData = gameSnap.data();
        const teamAData = await getTeamData(gameData.away_team_id as DocumentReference | undefined);
        const teamBData = await getTeamData(gameData.home_team_id as DocumentReference | undefined);
        setGameDetails({
          id: gameSnap.id,
          sport: gameData.sport,
          status: gameData.is_live ? 'live' : (gameData.is_over ? 'final' : 'upcoming'),
          teamA: teamAData, teamB: teamBData,
          away_team_id: gameData.away_team_id as DocumentReference,
          home_team_id: gameData.home_team_id as DocumentReference,
          time: !gameData.is_live && !gameData.is_over && gameData.start_time ? new Date(gameData.start_time.seconds * 1000).toLocaleTimeString([], { hour: 'numeric', minute:'2-digit' }) : undefined,
          date: !gameData.is_live && !gameData.is_over && gameData.start_time ? new Date(gameData.start_time.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }) : undefined,
          period: gameData.is_live ? (gameData.period?.toString() || 'Live') : undefined,
          quarter: gameData.quarter,
          broadcast_provider: gameData.broadcast_provider || undefined,
          home_score: gameData.home_team_score ?? 0,
          away_score: gameData.away_team_score ?? 0,
          start_time: gameData.start_time as Timestamp
        });
      } catch (err: any) { setError(err.message || 'Failed to load game details.'); }
      finally { setIsLoadingGame(false); }
    };
    fetchGame();
  }, [gameId]);

  // Fetch Board Details Effect (and re-fetch on entrySuccessCount change)
  useEffect(() => {
    if (!gameId) return;
    let unsubscribeBoardListener: (() => void) | null = null;

    // Clear previous timer and reset delayed loader when effect re-runs
    if (loaderTimerId.current) {
      clearTimeout(loaderTimerId.current);
      loaderTimerId.current = null;
    }
    setIsDisplayingDelayedLoader(false); 

    setIsLoadingBoard(true);
    // DO NOT setCurrentBoard(null) here immediately to allow old board to render during delay

    // Set a timer to show loader if fetching takes time
    loaderTimerId.current = setTimeout(() => {
      if (isLoadingBoardRef.current) { // Check if still loading board data
        setIsDisplayingDelayedLoader(true);
      }
    }, 400); // 400ms delay

    const fetchBoardLogic = async () => {
      try {
        const gameDocRef = doc(db, 'games', gameId) as DocumentReference;
        const boardsQuery = query(
          collection(db, 'boards'),
          where('gameID', '==', gameDocRef),
          where('amount', '==', selectedEntryAmount),
          where('status', '==', 'open'),
          limit(1)
        );
        const boardSnap = await getDocs(boardsQuery);

        if (!boardSnap.empty) {
          const boardDoc = boardSnap.docs[0];
          unsubscribeBoardListener = onSnapshot(doc(db, 'boards', boardDoc.id), (snapshot) => {
            if (loaderTimerId.current) { clearTimeout(loaderTimerId.current); loaderTimerId.current = null; }
            setIsDisplayingDelayedLoader(false);
            
            if (snapshot.exists()) {
              const boardData = snapshot.data();
              if (gameDocRef) { 
                setCurrentBoard({
                  id: snapshot.id,
                  gameID: gameDocRef,
                  prize: boardData.prize,
                  entryFee: boardData.amount,
                  isFreeEntry: boardData.amount === 0,
                  selected_indexes: boardData.selected_indexes || [],
                  status: boardData.status as 'open' | 'closed' | 'cancelled',
                });
              } else {
                 console.error("gameDocRef is undefined, cannot set current board with non-optional gameID");
                 setCurrentBoard(null); // Still set to null if gameDocRef is missing
              }
              if (boardData.status !== 'open') {
                toast.error("This board is now closed.", { id: `board-closed-${snapshot.id}` });
                setSelectedSquares(new Set());
              }
            } else {
              setCurrentBoard(null);
              toast.error("The selected board is no longer available.", { id: `board-not-found-${boardDoc.id}` });
            }
            setIsLoadingBoard(false); // Done loading board data
          }, (errorListener) => {
            if (loaderTimerId.current) { clearTimeout(loaderTimerId.current); loaderTimerId.current = null; }
            setIsDisplayingDelayedLoader(false);
            console.error("Error listening to board updates:", errorListener);
            toast.error("Error listening to board updates.");
            setCurrentBoard(null);
            setIsLoadingBoard(false);
          });
        } else {
          if (loaderTimerId.current) { clearTimeout(loaderTimerId.current); loaderTimerId.current = null; }
          setIsDisplayingDelayedLoader(false);
          setCurrentBoard(null); 
          setIsLoadingBoard(false);
        }
      } catch (err: any) {
        if (loaderTimerId.current) { clearTimeout(loaderTimerId.current); loaderTimerId.current = null; }
        setIsDisplayingDelayedLoader(false);
        console.error("Error fetching board details:", err);
        setError(err.message || 'Failed to fetch board details'); // Set error state
        setCurrentBoard(null); 
        setIsLoadingBoard(false);
      }
    };

    fetchBoardLogic();

    return () => {
      if (unsubscribeBoardListener) {
        unsubscribeBoardListener();
      }
      if (loaderTimerId.current) {
        clearTimeout(loaderTimerId.current);
        loaderTimerId.current = null;
      }
    };
  }, [gameId, selectedEntryAmount, entrySuccessCount]);

  // Effect to fetch current user's purchased squares for the current board
  useEffect(() => {
    if (currentBoard?.id && userId) {
      setIsLoadingUserSquares(true);
      const fetchUserSquares = async () => {
        try {
          const userSquaresQuery = query(
            collection(db, 'boards', currentBoard.id, 'squares'),
            where('userID', '==', doc(db, 'users', userId))
          );
          const querySnapshot = await getDocs(userSquaresQuery);
          const userSquares = new Set<number>();
          console.log(`[GamePage fetchUserSquares] Query for board ${currentBoard.id} found ${querySnapshot.size} docs for user ${userId}`);
          querySnapshot.forEach(doc => {
            const data = doc.data();
            console.log('[GamePage fetchUserSquares] Processing doc ID:', doc.id, 'Data:', data);
            const squareNum = data.index;
            if (typeof squareNum === 'number') {
              userSquares.add(squareNum);
            }
          });
          setCurrentUserPurchasedSquaresSet(userSquares);
          console.log('[GamePage fetchUserSquares] currentUserPurchasedSquaresSet updated to:', userSquares);
        } catch (error) {
          console.error("Error fetching user's purchased squares:", error);
          toast.error("Failed to load your selections. Please refresh.");
        }
        finally {
          setIsLoadingUserSquares(false);
        }
      };
      fetchUserSquares();
    } else {
      setCurrentUserPurchasedSquaresSet(new Set());
    }
  }, [currentBoard?.id, userId, entrySuccessCount]);

  // New useEffect for redirection based on email verification status
  useEffect(() => {
    if (!walletIsLoading) { // Only act once auth/wallet state is resolved
      if (userId && emailVerified === false) {
        router.push('/verify-email');
      } 
      // If !userId (user not logged in), other logic might redirect to login or show guest content
    }
  }, [userId, emailVerified, walletIsLoading, router]);

  const handleSquareClick = (squareNumber: number) => {
    // === Pre-computation and State Checks ===
    const isBoardReady = currentBoard && currentBoard.status === 'open';
    const hasGameStarted = gameDetails && gameDetails.start_time && gameDetails.start_time.toMillis() < Date.now();
    const isSquareTaken = currentBoard?.selected_indexes?.includes(squareNumber);

    // === Immediate Blockers (no interaction possible) ===
    if (!isBoardReady || hasGameStarted) {
      if(hasGameStarted) toast.error("Game has already started. Selections are closed.");
      return; 
    }
    
    if (isSquareTaken) {
      if(currentUserPurchasedSquaresSet.has(squareNumber)) {
        toast("You have already selected this square.");
      } else {
        toast.error("This square is already taken.");
      }
      return;
    }

    // === User/Authentication Flow ===
    if (!userId) {
      router.push(`/login?redirect=/game/${gameId}?entry=${selectedEntryAmount}`);
      return;
    }
    
    // === Wallet and Balance Checks (Crucial Flow for this task) ===
    if (walletIsLoading) {
      toast("Verifying your wallet, please wait...");
      return;
    }
    if (hasWallet === false) {
      setPromptType('setup');
      setIsPromptOpen(true);
      return;
    }
    // THIS IS THE FIX: Check for balance right after we know the wallet is loaded and exists.
    if (!currentBoard.isFreeEntry && balance < selectedEntryAmount) {
      setRequiredDepositAmount(selectedEntryAmount);
      setIsDepositDialogOpen(true);
      return; // Stop here if funds are insufficient.
    }

    // === UI State Blockers (prevent action while busy) ===
    if (isConfirming || isLoadingUserSquares) {
      toast("Please wait for the board to finish loading.");
      return;
    }
    
    // === All Checks Passed: Handle Square Selection ===
    setError(null);
    setSelectedSquares(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(squareNumber)) {
        newSelection.delete(squareNumber);
      } else {
        if (newSelection.size >= MAX_SQUARE_SELECTION_LIMIT) {
          toast.error(`Max ${MAX_SQUARE_SELECTION_LIMIT} squares allowed per entry.`);
          return prev; // Return previous state if limit is reached
        }
        newSelection.add(squareNumber);
      }
      return newSelection;
    });
  };

  const handleConfirmSelection = async () => {
    if (selectedSquares.size === 0 || !currentBoard || currentBoard.status !== 'open' || !userId || walletIsLoading || isConfirming || isLoadingUserSquares) return;
    if (gameDetails && gameDetails.start_time.toMillis() < Date.now()) {
        toast.error("Cannot enter, game has already started.");
        return;
    }

    if (hasWallet === false) {
      setPromptType('setup'); setIsPromptOpen(true); return;
    }
    const totalCost = selectedSquares.size * selectedEntryAmount;
    if (!currentBoard.isFreeEntry && balance < totalCost) {
      setPromptType('deposit'); setIsPromptOpen(true); return;
    }

    setIsConfirming(true);
    setError(null);
    const toastId = toast.loading('Processing your entry...');

    try {
      const functions = getFunctions(undefined, "us-east1"); 
      const enterBoardFn = httpsCallable(functions, 'enterBoard');
      const payload = {
        boardId: currentBoard.id,
        selectedSquareIndexes: Array.from(selectedSquares),
      };

      const result = await enterBoardFn(payload) as { data: { success: boolean; message?: string; error?: string } };

      if (result.data.success) {
        toast.success('Entry successful! Good luck!', { id: toastId });
        setSelectedSquares(new Set());
        setEntrySuccessCount(prev => prev + 1);
      } else {
        throw new Error(result.data.error || result.data.message || 'Failed to enter squares.');
      }
    } catch (err: any) {
      console.error("Error confirming selection:", err);
      toast.error(err.message || "Entry failed. Please try again.", { id: toastId });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleEntryAmountClick = (amount: number) => {
    if (!currentBoard?.isFreeEntry && balance < amount) {
      setShakeEntryFee(true);
      setTimeout(() => setShakeEntryFee(false), 500);
      return;
    }
    setSelectedEntryAmount(amount);
  };

  const renderGrid = () => {
    const commonContainerClasses = cn(
      "p-2 bg-slate-800/70 rounded-lg shadow-xl border border-slate-700",
      "md:max-w-lg md:mx-auto",
      "min-h-[320px]"
    );

    let content;

    // Loader condition combines delayed loader for board switching and general loading states
    const showGenericLoaderCondition = (isLoadingBoard && !currentBoard && !isDisplayingDelayedLoader) || (isLoadingUserSquares && currentBoard);

    if (isDisplayingDelayedLoader || showGenericLoaderCondition) {
      content = (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-10 w-10 animate-spin text-accent-1" />
        </div>
      );
    } else if (!currentBoard) {
      content = (
        <div className="flex justify-center items-center h-full">
          <p className="text-center text-slate-400">No open board found for ${selectedEntryAmount} entry.</p>
        </div>
      );
    } else if (currentBoard.status !== 'open' && currentBoard.status !== undefined) { 
      content = (
        <div className="flex justify-center items-center h-full">
          <p className="text-center text-yellow-400 py-8">This board is now {currentBoard.status}.</p>
        </div>
      );
    } else {
      const gridItems = [];
      const gameHasStarted = gameDetails && gameDetails.start_time && gameDetails.start_time.toMillis() < Date.now();
      const boardIsNotOpen = currentBoard.status !== 'open';
      
      for (let i = 0; i < 100; i++) {
        const isPurchasedByCurrentUser = currentUserPurchasedSquaresSet.has(i);
        const isTakenByOtherUser = currentBoard.selected_indexes?.includes(i) && !isPurchasedByCurrentUser;
        const isSelectedByCurrentUserPreConfirmation = selectedSquares.has(i);

        const isDisabledForSelection = Boolean(
          isConfirming || 
          gameHasStarted || 
          boardIsNotOpen || 
          isPurchasedByCurrentUser || 
          isTakenByOtherUser
        );

        let squareClasses = "";
        let squareContent = String(i).padStart(2, '0');

        if (isPurchasedByCurrentUser) {
          squareClasses = "bg-gradient-to-br from-[#1bb0f2] to-[#108bcc] text-white cursor-not-allowed opacity-90 font-semibold"; 
        } else if (isTakenByOtherUser) {
          squareClasses = "bg-gradient-to-br from-slate-600 to-slate-700 text-slate-400 cursor-not-allowed opacity-70";
          squareContent = "X";
        } else if (isSelectedByCurrentUserPreConfirmation) {
          squareClasses = "bg-gradient-to-br from-[#d43dae] to-[#c02090] text-white ring-2 ring-offset-2 ring-offset-slate-800 ring-[#d43dae]";
        } else {
          squareClasses = "bg-gradient-to-br from-slate-700/80 to-slate-800/80 hover:from-cyan-500/80 hover:to-cyan-700/80 text-cyan-200"; 
        }
        
        gridItems.push(
          <button
            key={i}
            onClick={() => handleSquareClick(i)} 
            disabled={isDisabledForSelection} 
            className={cn(
              "aspect-square border border-slate-600/70 rounded-md flex items-center justify-center text-sm font-mono transition-all duration-150 ease-in-out",
              squareClasses,
              isConfirming && !isDisabledForSelection ? "cursor-wait" : ""
            )}
          >
            {squareContent}
          </button>
        );
      }
      content = (
        <div className="grid grid-cols-10 gap-1.5">
          {gridItems}
        </div>
      );
    }

    return (
      <div className={commonContainerClasses}>
        {content}
      </div>
    );
  };

  if (walletIsLoading || (isLoadingGame && !gameDetails)) {
    return <div className="flex justify-center items-center min-h-screen bg-slate-900"><Loader2 className="h-16 w-16 animate-spin text-accent-1" /></div>;
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-300">
        <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
        <p className="text-xl mb-2">Authentication Required</p>
        <p className="mb-6">Please <Link href={`/login?redirect=/game/${gameId}?entry=${selectedEntryAmount}`} className="underline text-accent-1 hover:text-accent-1/80">log in</Link> to participate.</p>
      </div>
    );
  }

  if (error && !gameDetails) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-red-400"><AlertTriangle className="w-12 h-12 mb-4" /><p className="text-xl">Error: {error}</p></div>;
  }

  if (!gameDetails) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-400"><AlertTriangle className="w-12 h-12 mb-4" /><p className="text-xl">Game not found.</p></div>;
  }

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-slate-900"><Loader2 className="h-16 w-16 animate-spin text-accent-1" /></div>}> 
      <div className="flex flex-col min-h-screen bg-background-primary text-slate-200">
        <Toaster position="top-center" />
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-6">
          <button onClick={() => router.back()} className="flex items-center text-sm text-accent-1 hover:text-accent-1/80 mb-3 group">
            <ArrowLeft className="w-4 h-4 mr-1.5 transform transition-transform group-hover:-translate-x-1" /> Back to Lobby
          </button>

          <div className="bg-gradient-to-b from-[#0a0e1b] to-[#1f2937] to-25% backdrop-blur-md shadow-2xl rounded-xl p-3 sm:p-4 mb-5 border border-slate-700/80">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center text-center w-1/3 px-1">
                <Image src={gameDetails.teamA.logo || '/brandkit/logo-icon-only.svg'} alt={gameDetails.teamA.name} width={48} height={48} className="mb-1.5 h-10 w-10 sm:h-12 sm:w-12 object-contain"/>
                <span className="font-semibold text-xs sm:text-sm md:text-base leading-tight">{gameDetails.teamA.name}</span>
                <span className="text-[10px] sm:text-xs text-slate-400">({gameDetails.teamA.record})</span>
             </div>
              <div className="text-center px-1">
                {gameDetails.status === 'live' && (
                    <>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white tabular-nums">{gameDetails.away_score} - {gameDetails.home_score}</div>
                        <div className="text-[10px] sm:text-xs text-red-400 animate-pulse font-semibold">{gameDetails.period?.toUpperCase()}</div>
                    </>
                )}
                {gameDetails.status === 'upcoming' && (
                     <>
                        <div className="text-base sm:text-lg md:text-xl font-semibold text-accent-1">{gameDetails.time}</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">{gameDetails.date}</div>
                    </>
                )}
                 {gameDetails.status === 'final' && (
                     <>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-300 tabular-nums">{gameDetails.away_score} - {gameDetails.home_score}</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Final</div>
                    </>
                )}
             </div>
              <div className="flex flex-col items-center text-center w-1/3 px-1">
                <Image src={gameDetails.teamB.logo || '/brandkit/logo-icon-only.svg'} alt={gameDetails.teamB.name} width={48} height={48} className="mb-1.5 h-10 w-10 sm:h-12 sm:w-12 object-contain"/>
                <span className="font-semibold text-xs sm:text-sm md:text-base leading-tight">{gameDetails.teamB.name}</span>
                <span className="text-[10px] sm:text-xs text-slate-400">({gameDetails.teamB.record})</span>
              </div>
             </div>
          </div>

          {error && <p className="text-center text-red-400 mb-3 bg-red-900/30 p-2 rounded-md">Error: {error}</p>} 

          <div
            ref={entryFeeRef}
            className={cn(
              "mb-5 p-3 bg-gradient-to-b from-[#0a0e1b] to-[#1f2937] to-25% rounded-lg border border-slate-700/70 max-w-md md:max-w-lg mx-auto",
              shakeEntryFee && "animate-shake"
            )}
          >
            <div className="text-center mb-3">
              <p className="text-sm font-medium text-slate-300">Entry Fee:</p>
            </div>
            <div className="flex justify-center space-x-1 sm:space-x-2 mb-3">
              {entryAmounts.map(amount => (
                <Button
                  key={amount}
                  variant={selectedEntryAmount === amount ? "default" : "outline"}
                  onClick={() => handleEntryAmountClick(amount)}
                  className={cn(
                    "h-11 text-sm sm:text-base font-semibold border-slate-600 hover:border-slate-500 px-4",
                    selectedEntryAmount === amount ?
                      "bg-gradient-to-br from-[#1bb0f2] to-[#108bcc] hover:from-[#108bcc] hover:to-[#0c6ca3] text-white border-[#108bcc] ring-2 ring-[#1bb0f2] ring-offset-2 ring-offset-slate-800" :
                      "bg-gradient-to-br from-slate-700/70 to-slate-800/70 hover:from-slate-600/70 hover:to-slate-700/70 text-slate-300"
                  )}
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 text-center text-slate-100">Select Your Squares <span className="text-xs text-slate-400">(Max {MAX_SQUARE_SELECTION_LIMIT})</span></h2>
            {renderGrid()}
          </div>

          {selectedSquares.size > 0 && currentBoard && currentBoard.status === 'open' && (
             <div className="text-center px-2 mt-8 mb-8">
                <div className="relative inline-block max-w-md mx-auto w-full group transform hover:scale-105 transition-transform duration-150 ease-out">
                  <Button 
                      size="lg" 
                      onClick={handleConfirmSelection} 
                      disabled={isConfirming || isLoadingBoard || (gameDetails && gameDetails.start_time.toMillis() < Date.now()) || walletIsLoading || currentBoard.status !== 'open' || isLoadingUserSquares}
                      className="w-full shadow-2xl bg-gradient-to-br from-green-400 to-emerald-500 group-hover:from-green-300 group-hover:to-emerald-400 text-white font-bold text-base sm:text-lg tracking-wide transition-colors duration-150 ease-out disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-gradient-to-br disabled:from-gray-600 disabled:to-gray-700 rounded-md rounded-tr-none"
                  >
                      {isConfirming ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                      ) : (
                          `Confirm ${selectedSquares.size} Square${selectedSquares.size > 1 ? 's' : ''} ($${(selectedSquares.size * selectedEntryAmount).toFixed(2)})`
                      )}
                  </Button>
                  {balance !== null && (
                    <div 
                      className="absolute top-0 right-0 transform translate-y-[-100%] text-slate-100 px-3 py-1.5 text-xs font-semibold rounded-t-lg shadow-lg border border-b-0"
                      style={{
                        backgroundImage: 'linear-gradient(to bottom right, #5855e4, #4a47d0)',
                        borderColor: '#3e3cc0',
                        minWidth: '120px', 
                        textAlign: 'center' 
                      }}
                    >
                      Current Balance: ${balance.toFixed(2)}
                    </div>
                  )}
                </div>
             </div>
          )}
        </main>

         <Dialog open={isPromptOpen} onOpenChange={setIsPromptOpen}>
            <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-slate-200">
                <DialogHeader>
                <DialogTitle className="flex items-center text-lg text-slate-100">
                    <AlertTriangle className="w-5 h-5 mr-2.5 text-yellow-400" /> 
                    {promptType === 'setup' ? 'Wallet Setup Required' : 'Insufficient Funds'}
                </DialogTitle>
                <DialogDescription className="text-slate-400 pt-2">
                    {promptType === 'setup' 
                        ? 'You need to set up your wallet before you can enter paid contests.' 
                        : `You need $${(selectedSquares.size * selectedEntryAmount).toFixed(2)} (current balance: $${balance.toFixed(2)}) for this entry.`}
                </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-5 gap-2 sm:flex-row flex-col-reverse ">
                    <DialogClose asChild>
                         <Button type="button" variant="outline" className="border-slate-600 hover:bg-slate-700 hover:text-slate-100">Cancel</Button>
                    </DialogClose>
                    <Button type="button" asChild className="bg-accent-1 hover:bg-accent-1/80 text-white">
                       <Link href={promptType === 'setup' ? '/wallet' : '/deposit'} legacyBehavior={false}>
                           {promptType === 'setup' ? 'Go to Wallet' : 'Deposit Funds'}
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>

         <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
  <DialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b] to-[#B8860B] to-15% border-accent-1/50 text-white py-8">
    <DialogHeader>
      <DialogTitle className="flex items-center text-xl font-semibold">Insufficient Funds</DialogTitle>
      <DialogDescription className="text-gray-300 opacity-90 pt-2">
        You need at least ${requiredDepositAmount.toFixed(2)} more to enter this board.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="mt-4 gap-2 sm:justify-center">
      <Button type="button" variant="outline" onClick={() => setIsDepositDialogOpen(false)} className="border-gray-500 hover:bg-gray-500/20 text-gray-300 hover:text-gray-300">Cancel</Button>
      <Button type="button" onClick={() => { setIsDepositDialogOpen(false); router.push('/wallet'); }} className="bg-accent-1 hover:bg-accent-1/80 text-white font-semibold">Add Funds</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      </div>
    </Suspense>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-slate-900"><Loader2 className="h-16 w-16 animate-spin text-accent-1" /></div>}> 
      <GamePageContent />
    </Suspense>
  );
} 