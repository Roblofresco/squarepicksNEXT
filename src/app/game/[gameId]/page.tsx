'use client'

export const runtime = 'edge';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection, query, where, getDocs, doc, getDoc, DocumentReference, Timestamp, limit, onSnapshot
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Game, Board, TeamInfo } from '@/types/lobby';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ArrowLeft, AlertTriangle, Loader2, Info, CircleDot, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { BiWallet } from 'react-icons/bi';
import WalletPill from '@/components/wallet/WalletPill';
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
  // normalized preferred fields + fallbacks retained in type
  startTime?: Timestamp;
  start_time?: Timestamp;
  homeScore?: number;
  awayScore?: number;
  home_score?: number;
  away_score?: number;
  time?: string;
  date?: string;
  period?: string;
  broadcastProvider?: string;
  broadcast_provider?: string;
  week?: number;
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
  const requestedView = (searchParams.get('view') || '').toLowerCase();
  
  // Read URL parameters for user context
  const boardId = searchParams.get('boardId');

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
  const [q1WinningSquare, setQ1WinningSquare] = useState<string | null>(null);
  const [q2WinningSquare, setQ2WinningSquare] = useState<string | null>(null);
  const [q3WinningSquare, setQ3WinningSquare] = useState<string | null>(null);
  const [finalWinningSquare, setFinalWinningSquare] = useState<string | null>(null);
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
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false);
  const [userPickedSquares, setUserPickedSquares] = useState<Array<{index: number, square?: string}>>([]);
  const [userWins, setUserWins] = useState<Set<string>>(new Set());
  const entryFeeRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevSelectedCountRef = useRef<number>(0);
  const scrollDownTimerRef = useRef<number | null>(null);
  const scrollUpTimerRef = useRef<number | null>(null);

  // Animation variants for light switch flip
  const switchVariants = {
    off: {
      rotateX: 0,
    },
    on: {
      rotateX: 180,
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      }
    }
  };

  // Compute optimistic displayed balance: subtract cost of currently selected squares
  const costCommitted = selectedSquares.size * selectedEntryAmount;
  const displayedBalance = Math.max(0, balance - costCommitted);

  // Helper function to check if user won a specific quarter
  const doesUserOwnWinningSquare = (period: 'q1' | 'q2' | 'q3' | 'final') => {
    return userWins.has(period);
  };

  // Helper function to check if a square index is a winning square that user owns
  const isUserWinningSquareIndex = (index: number): boolean => {
    if (!homeAxisNumbers.length || !awayAxisNumbers.length) return false;
    
    const row = Math.floor(index / 10);
    const col = index % 10;
    const squareString = `${awayAxisNumbers[row]}${homeAxisNumbers[col]}`;
    
    // Check if this square matches any winning square that user owns
    const winningSquares = [
      userWins.has('q1') ? q1WinningSquare : null,
      userWins.has('q2') ? q2WinningSquare : null,
      userWins.has('q3') ? q3WinningSquare : null,
      userWins.has('final') ? finalWinningSquare : null,
    ].filter(Boolean);
    
    return winningSquares.includes(squareString);
  };

  const handleWalletClick = useCallback(() => {
    if (!userId) {
      router.push('/login');
      return;
    }
    if (hasWallet === true) {
      router.push('/wallet');
    } else {
      router.push('/wallet-setup/location');
    }
  }, [userId, hasWallet, router]);

  // Axis numbers for numbers reveal
  const [homeAxisNumbers, setHomeAxisNumbers] = useState<string[]>([]);
  const [awayAxisNumbers, setAwayAxisNumbers] = useState<string[]>([]);

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
        const awayRef = gameData.awayTeam instanceof DocumentReference ? gameData.awayTeam : undefined;
        const homeRef = gameData.homeTeam instanceof DocumentReference ? gameData.homeTeam : undefined;
        const teamAData = await getTeamData(awayRef);
        const teamBData = await getTeamData(homeRef);
        setGameDetails({
          id: gameSnap.id,
          sport: gameData.sport,
          status: (gameData.isLive ?? gameData.is_live) ? 'live' : ((gameData.isOver ?? gameData.is_over) ? 'final' : 'scheduled'),
          teamA: teamAData, teamB: teamBData,
          away_team_id: gameData.away_team_id as DocumentReference,
          home_team_id: gameData.home_team_id as DocumentReference,
          time: !(gameData.isLive ?? gameData.is_live) && !(gameData.isOver ?? gameData.is_over) && (gameData.startTime || gameData.start_time) ? new Date(((gameData.startTime || gameData.start_time) as Timestamp).toMillis()).toLocaleTimeString([], { hour: 'numeric', minute:'2-digit' }) : undefined,
          date: !(gameData.isLive ?? gameData.is_live) && !(gameData.isOver ?? gameData.is_over) && (gameData.startTime || gameData.start_time) ? new Date(((gameData.startTime || gameData.start_time) as Timestamp).toMillis()).toLocaleDateString([], { month: 'short', day: 'numeric' }) : undefined,
          period: (gameData.isLive ?? gameData.is_live) ? (gameData.period?.toString() || 'Live') : undefined,
          quarter: gameData.quarter,
          broadcastProvider: gameData.broadcastProvider || gameData.broadcast_provider || undefined,
          broadcast_provider: gameData.broadcast_provider || undefined,
          week: gameData.week,
          homeScore: typeof gameData.homeScore === 'number' ? gameData.homeScore : (gameData.home_team_score ?? 0),
          awayScore: typeof gameData.awayScore === 'number' ? gameData.awayScore : (gameData.away_team_score ?? 0),
          home_score: typeof gameData.home_team_score === 'number' ? gameData.home_team_score : undefined,
          away_score: typeof gameData.away_team_score === 'number' ? gameData.away_team_score : undefined,
          startTime: (gameData.startTime as Timestamp) || (gameData.start_time as Timestamp),
          start_time: (gameData.start_time as Timestamp) || undefined,
        });
        setQ1WinningSquare(typeof gameData.q1WinningSquare === 'string' ? gameData.q1WinningSquare : null);
        setQ2WinningSquare(typeof gameData.q2WinningSquare === 'string' ? gameData.q2WinningSquare : null);
        setQ3WinningSquare(typeof gameData.q3WinningSquare === 'string' ? gameData.q3WinningSquare : null);
        setFinalWinningSquare(typeof gameData.finalWinningSquare === 'string' ? gameData.finalWinningSquare : null);
        console.log('Game data:', { away_team_id: gameData.away_team_id, awayTeam: gameData.awayTeam, home_team_id: gameData.home_team_id, homeTeam: gameData.homeTeam, awayRef, homeRef, teamAData, teamBData });
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
              // Capture axis numbers when assigned
              if (Array.isArray(boardData.home_numbers) && boardData.home_numbers.length === 10) {
                setHomeAxisNumbers(boardData.home_numbers.map(String));
              } else {
                setHomeAxisNumbers([]);
              }
              if (Array.isArray(boardData.away_numbers) && boardData.away_numbers.length === 10) {
                setAwayAxisNumbers(boardData.away_numbers.map(String));
              } else {
                setAwayAxisNumbers([]);
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

  // Effect: Fetch user's purchased squares using Cloud Function
  useEffect(() => {
    if (!currentBoard?.id || !userId) {
      setCurrentUserPurchasedSquaresSet(new Set());
      setIsLoadingUserSquares(false);
      return;
    }

    const fetchUserSquares = async () => {
      setIsLoadingUserSquares(true);
      try {
        const functions = getFunctions(undefined, "us-east1");
        const getSelectionsFn = httpsCallable(functions, 'getBoardUserSelections');
        const result = await getSelectionsFn({ boardID: currentBoard.id });
        const data = result.data as { selectedIndexes?: number[] };
        if (data?.selectedIndexes && Array.isArray(data.selectedIndexes)) {
          setCurrentUserPurchasedSquaresSet(new Set(data.selectedIndexes));
        } else {
          setCurrentUserPurchasedSquaresSet(new Set());
        }
      } catch (error) {
        console.error('Error fetching user squares:', error);
        setCurrentUserPurchasedSquaresSet(new Set());
      } finally {
        setIsLoadingUserSquares(false);
      }
    };

    fetchUserSquares();
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

  // Effect: Fetch user's wins from private wins collection when game is active
  useEffect(() => {
    // Only query wins if:
    // 1. User is authenticated
    // 2. We have a board to check
    // 3. Game status is NOT scheduled (i.e., live or final)
    if (!userId || !currentBoard?.id || gameDetails?.status === 'scheduled') {
      setUserWins(new Set());
      return;
    }
    
    const fetchUserWins = async () => {
      try {
        // Query for all wins for this board (q1, q2, q3, final)
        const periods = ['q1', 'q2', 'q3', 'final'];
        const winDocs = await Promise.all(
          periods.map(period => 
            getDoc(doc(db, `users/${userId}/wins/${currentBoard.id}_${period}`))
          )
        );
        
        const wonPeriods = new Set<string>();
        winDocs.forEach((docSnap, index) => {
          if (docSnap.exists()) {
            wonPeriods.add(periods[index]);
          }
        });
        
        setUserWins(wonPeriods);
      } catch (error) {
        console.error('Error fetching user wins:', error);
        setUserWins(new Set());
      }
    };
    
    fetchUserWins();
  }, [userId, currentBoard?.id, gameDetails?.status]);

  const handleSquareClick = (squareNumber: number) => {
    // === Pre-computation and State Checks ===
    const isBoardReady = currentBoard && currentBoard.status === 'open';
    const hasGameStarted = gameDetails && (gameDetails.startTime || gameDetails.start_time) && ((gameDetails.startTime || gameDetails.start_time) as Timestamp).toMillis() < Date.now();
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

  // Smoothly scroll only on transition from 0 -> >0 selections (avoids repeated jitter while adding more)
  useEffect(() => {
    const prev = prevSelectedCountRef.current;
    if (scrollDownTimerRef.current) {
      window.clearTimeout(scrollDownTimerRef.current);
      scrollDownTimerRef.current = null;
    }
    if (prev === 0 && selectedSquares.size > 0) {
      // Brief delay to let button render, then scroll and hero animation happen together
      scrollDownTimerRef.current = window.setTimeout(() => {
        // Scroll to absolute bottom of page to ensure everything is visible
        const scrollHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const maxScroll = scrollHeight - windowHeight;
        
        window.scrollTo({
          top: maxScroll,
          behavior: 'smooth'
        });
      }, 150); // 150ms: button renders, then scroll + hero animation start together
    }
  }, [selectedSquares.size]);

  // When selections clear (pill heroes back to header), scroll to top after slight delay
  useEffect(() => {
    const prev = prevSelectedCountRef.current;
    if (prev > 0 && selectedSquares.size === 0) {
      if (scrollUpTimerRef.current) {
        window.clearTimeout(scrollUpTimerRef.current);
        scrollUpTimerRef.current = null;
      }
      // immediately scroll to top when selections clear
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // update tracker after logic so both effects can see correct previous
    prevSelectedCountRef.current = selectedSquares.size;
  }, [selectedSquares.size]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (scrollDownTimerRef.current) window.clearTimeout(scrollDownTimerRef.current);
      if (scrollUpTimerRef.current) window.clearTimeout(scrollUpTimerRef.current);
    };
  }, []);

  // Trigger winner animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWinnerAnimation(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Clear selections when clicking outside the grid and confirm button
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (selectedSquares.size === 0) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (gridRef.current && gridRef.current.contains(target)) return;
      if (confirmRef.current && confirmRef.current.contains(target)) return;
      setSelectedSquares(new Set());
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [selectedSquares.size]);

  const handleConfirmSelection = async () => {
    if (selectedSquares.size === 0 || !currentBoard || currentBoard.status !== 'open' || !userId || walletIsLoading || isConfirming || isLoadingUserSquares) return;
    if (gameDetails && (gameDetails.startTime || gameDetails.start_time) && ((gameDetails.startTime || gameDetails.start_time) as Timestamp).toMillis() < Date.now()) {
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

  const handleEntryAmountClick = async (amount: number) => {
    // Changing entry fee resets current selections
    setSelectedSquares(new Set());
    setSelectedEntryAmount(amount);

    // If user not logged in, do not attempt server creation; UI will show no board until login
    if (!userId) return;

    // If insufficient balance for paid tiers, prompt deposit first
    if (amount > 0 && balance < amount) {
      setShakeEntryFee(true);
      setTimeout(() => setShakeEntryFee(false), 500);
      setRequiredDepositAmount(amount);
      setIsDepositDialogOpen(true);
      return;
    }

    // Proactively ensure an open board exists for this amount
    try {
      const functions = getFunctions(undefined, "us-east1");
      const callable = httpsCallable(functions, 'createBoardIfMissing');
      await callable({ gameId, amount });
      // Trigger re-fetch by toggling a counter
      setEntrySuccessCount((c) => c + 1);
    } catch (e: any) {
      console.error('ensure board failed', e);
      // Non-fatal; UI will continue to show empty state if creation failed
    }
  };

  const renderGrid = () => {
    // Don't show board selection for live or final games
    if (gameDetails && (gameDetails.status === 'live' || gameDetails.status === 'final')) {
      return (
        <div className={cn(
          "relative overflow-hidden p-6 md:p-8 rounded-lg shadow-xl",
          "md:max-w-lg md:mx-auto text-center",
          "min-h-[200px] flex flex-col items-center justify-center"
        )}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(20,28,48,0.98) 0%, rgba(20,28,48,0.9) 60%, rgba(20,28,48,0) 100%), #0a0e1b'
        }}>
          <p className="text-slate-400 text-sm">
            {gameDetails.status === 'live' ? 'Board closed - game is live' : 'Board closed - game finished'}
          </p>
        </div>
      );
    }

    const commonContainerClasses = cn(
      "relative overflow-hidden p-6 md:p-8 rounded-lg shadow-xl",
      "md:max-w-lg md:mx-auto",
      "min-h-[320px]"
    );
    const gridBgStyle: React.CSSProperties = {
      background: 'radial-gradient(ellipse at center, rgba(20,28,48,0.98) 0%, rgba(20,28,48,0.9) 60%, rgba(20,28,48,0) 100%), #0a0e1b'
    };

    let content;

    // Loader condition combines delayed loader for board switching and general loading states
    const showGenericLoaderCondition = (isLoadingBoard && !currentBoard && !isDisplayingDelayedLoader) || (isLoadingUserSquares && currentBoard);

    const hasAxisNumbers = homeAxisNumbers.length === 10 && awayAxisNumbers.length === 10;

    const renderAxesWrapper = (gridEl: React.ReactNode) => (
      <div className="flex flex-col items-center">
        {hasAxisNumbers && (
          <div className="grid grid-cols-11 gap-1 mb-1 w-full max-w-[480px]">
            <div />
            {homeAxisNumbers.map((n, i) => (
              <div key={`h-${i}`} className="text-center text-[11px] sm:text-xs text-slate-300 font-mono">{n}</div>
            ))}
          </div>
        )}
        <div className="flex items-start w-full max-w-[480px]">
          {hasAxisNumbers && (
            <div className="grid grid-rows-10 gap-1 mr-1">
              {awayAxisNumbers.map((n, i) => (
                <div key={`a-${i}`} className="h-8 sm:h-9 flex items-center justify-center text-[11px] sm:text-xs text-slate-300 font-mono">{n}</div>
              ))}
            </div>
          )}
          <div className="flex-1">{gridEl}</div>
        </div>
      </div>
    );

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
    } else {
      const gridItems = [];
      const gameHasStarted = gameDetails && (gameDetails.startTime || gameDetails.start_time) && ((gameDetails.startTime || gameDetails.start_time) as Timestamp).toMillis() < Date.now();
      const boardIsOpen = currentBoard.status === 'open';

      for (let i = 0; i < 100; i++) {
        const isPurchasedByCurrentUser = currentUserPurchasedSquaresSet.has(i);
        const isTakenByOtherUser = currentBoard.selected_indexes?.includes(i) && !isPurchasedByCurrentUser;
        const isSelectedByCurrentUserPreConfirmation = selectedSquares.has(i);

        const isDisabledForSelection = Boolean(
          isConfirming || 
          gameHasStarted || 
          !boardIsOpen || 
          isPurchasedByCurrentUser || 
          isTakenByOtherUser
        );

        let squareClasses = "";
        let squareContent = String(i).padStart(2, '0');

        // Check if this is a winning square owned by user (highest priority)
        const isWinningSquare = gameDetails?.status !== 'scheduled' && isUserWinningSquareIndex(i);

        if (isWinningSquare) {
          // Gold gradient for winning squares
          squareClasses = "bg-gradient-to-br from-[#FFE08A] via-[#E7B844] to-[#C9962E] text-white cursor-not-allowed font-bold shadow-[0_0_10px_rgba(231,184,68,0.35)]";
        } else if (isPurchasedByCurrentUser) {
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
      const gridEl = (
        <div className="grid grid-cols-10 gap-1.5">
          {gridItems}
        </div>
      );

      // When board not open, show read-only grid with axes instead of hiding it
      if (!boardIsOpen) {
        content = (
          <div className="space-y-2">
            {hasAxisNumbers && (
              <p className="text-center text-yellow-400 text-sm">Numbers revealed</p>
            )}
            {renderAxesWrapper(gridEl)}
          </div>
        );
      } else {
        content = renderAxesWrapper(gridEl);
      }
    }

    return (
      <div ref={gridRef} className={commonContainerClasses} style={gridBgStyle}>
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

  // Logo glow styles using team accent colors (matches lobby card aesthetic)
  const glowHexA = gameDetails.teamA.color;
  const glowHexB = gameDetails.teamB.color;
  const glowA = glowHexA ? `${glowHexA}cc` : 'rgba(27,176,242,0.8)';
  const glowB = glowHexB ? `${glowHexB}cc` : 'rgba(27,176,242,0.8)';

  const effectiveView = requestedView === 'final' || requestedView === 'live' || requestedView === 'scheduled'
    ? requestedView
    : (gameDetails.status === 'final' ? 'final' : (gameDetails.status === 'live' ? 'live' : 'scheduled'));

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-slate-900"><Loader2 className="h-16 w-16 animate-spin text-accent-1" /></div>}> 
      <div className="flex flex-col min-h-screen bg-background-primary text-slate-200">
        <Toaster position="top-center" />
        <div className="w-full bg-background-primary">
          {!(selectedSquares.size > 0 && currentBoard && currentBoard.status === 'open') && (
            <div className="flex justify-end px-4 pt-2 pb-1">
              <WalletPill balance={displayedBalance} onClick={handleWalletClick} variant="header" />
            </div>
          )}
        </div>
        <main className="flex-grow container mx-auto px-2 sm:px-4 pt-0 pb-4">
          <motion.button
            onClick={() => router.back()}
            aria-label="Back"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full glass bg-white/5 border-white/15 text-accent-1 hover:bg-white/10 mb-3"
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          {/* Billboard glow backdrop (replaces boxed game info container) */}
          <div className="relative mb-3">
            <div className="pointer-events-none absolute inset-x-0 -top-4 mx-auto h-32 sm:h-40 max-w-3xl rounded-[28px] bg-gradient-to-b from-accent-1/15 via-accent-2/10 to-transparent blur-2xl shadow-[0_40px_120px_-20px_rgba(27,176,242,0.35)]" />
          </div>

          {/* Enhanced Scoreboard Section */}
          <div className="relative z-10 mb-4">
            {/* Team matchup header */}
            <div className="max-w-3xl mx-auto px-2 flex items-center justify-between mb-2">
              <div className="flex flex-col items-center text-center w-1/3 px-1">
                <div className="relative mb-1.5">
                  <Image 
                    src={gameDetails.teamA.logo || '/brandkit/logo-icon-only.svg'} 
                    alt={gameDetails.teamA.name} 
                    width={48} 
                    height={48} 
                    className="h-10 w-10 sm:h-12 sm:w-12 object-contain relative z-10" 
                    style={{ filter: `drop-shadow(0 0 6px ${glowA})` }}
                  />
                  <div
                    className="pointer-events-none absolute -bottom-1 left-1/2 h-3 w-12 -translate-x-1/2 rounded-full opacity-100"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0) 100%)',
                      filter: 'blur(3px)'
                    }}
                  />
                </div>
                <span className="font-semibold text-xs sm:text-sm md:text-base leading-tight">
                  {gameDetails.teamA.name}
                </span>
              </div>

              {/* Center: Score and status */}
              <div className="text-center px-1 flex flex-col items-center">
                {effectiveView === 'live' && (
                  <>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tabular-nums mb-1">
                      {gameDetails.awayScore ?? gameDetails.away_score ?? 0} - {gameDetails.homeScore ?? gameDetails.home_score ?? 0}
                    </div>
                    
                    <div className="text-xs sm:text-sm text-red-400 animate-pulse font-semibold mb-0.5">
                      {(() => {
                        const period = gameDetails.period || gameDetails.quarter;
                        if (!period) return 'LIVE';
                        const periodStr = String(period).toLowerCase();
                        if (periodStr === '1' || periodStr.includes('1')) return '1st Qtr';
                        if (periodStr === '2' || periodStr.includes('2')) return '2nd Qtr';
                        if (periodStr === '3' || periodStr.includes('3')) return '3rd Qtr';
                        if (periodStr === '4' || periodStr.includes('4')) return '4th Qtr';
                        if (periodStr === 'ot' || periodStr.includes('ot')) return 'Overtime';
                        if (periodStr === 'halftime' || periodStr.includes('halftime')) return 'Halftime';
                        return period.toUpperCase();
                      })()}
                    </div>
                    
                    {/* Time Remaining - Enhanced Container */}
                    {((gameDetails as any).timeRemaining || (gameDetails as any).time_remaining) && (
                      <div className="mb-1 px-3 py-1 rounded-md border border-white/10 bg-slate-950/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                        <span className="text-[10px] sm:text-xs text-slate-300 font-mono tabular-nums">
                          {(gameDetails as any).timeRemaining || (gameDetails as any).time_remaining}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {effectiveView === 'scheduled' && (
                  <>
                    <div className="text-lg sm:text-xl md:text-2xl font-semibold text-accent-1 mb-1">
                      {gameDetails.time}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-400">{gameDetails.date}</div>
                  </>
                )}
                {effectiveView === 'final' && (
                  <>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-300 tabular-nums mb-1">
                      {gameDetails.awayScore ?? gameDetails.away_score ?? 0} - {gameDetails.homeScore ?? gameDetails.home_score ?? 0}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-400 font-semibold">FINAL</div>
                  </>
                )}
                {(gameDetails.broadcastProvider || gameDetails.broadcast_provider) && (
                  <div className="text-[10px] sm:text-xs text-slate-500 mt-1">
                    {gameDetails.broadcastProvider || gameDetails.broadcast_provider} • Week {gameDetails.week}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center text-center w-1/3 px-1">
                <div className="relative mb-1.5">
                  <Image 
                    src={gameDetails.teamB.logo || '/brandkit/logo-icon-only.svg'} 
                    alt={gameDetails.teamB.name} 
                    width={48} 
                    height={48} 
                    className="h-10 w-10 sm:h-12 sm:w-12 object-contain relative z-10" 
                    style={{ filter: `drop-shadow(0 0 6px ${glowB})` }}
                  />
                  <div
                    className="pointer-events-none absolute -bottom-1 left-1/2 h-3 w-12 -translate-x-1/2 rounded-full opacity-100"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0) 100%)',
                      filter: 'blur(3px)'
                    }}
                  />
                </div>
                <span className="font-semibold text-xs sm:text-sm md:text-base leading-tight">
                  {gameDetails.teamB.name}
                </span>
              </div>
            </div>

              </div>

          {error && <p className="text-center text-red-400 mb-3 bg-red-900/30 p-2 rounded-md">Error: {error}</p>} 

          <div className="h-px w-full bg-white/10 mb-3" />

          {gameDetails && gameDetails.status === 'scheduled' && (
            <div
              ref={entryFeeRef}
                  className={cn(
                "mb-4 p-2 rounded-lg max-w-md md:max-w-lg mx-auto",
                shakeEntryFee && "animate-shake"
              )}
                    style={{ 
                background: 'radial-gradient(ellipse at center, rgba(20,28,48,0.98) 0%, rgba(20,28,48,0.9) 60%, rgba(20,28,48,0.0) 100%), #0a0e1b'
              }}
            >
              <div className="text-center mb-2">
                <p className="text-sm font-medium text-slate-300">Entry Fee:</p>
              </div>
              <div className="flex justify-center space-x-1 sm:space-x-2 mb-2">
                {entryAmounts.map(amount => (
                  <Button
                    key={amount}
                    variant={selectedEntryAmount === amount ? "default" : "outline"}
                    onClick={() => handleEntryAmountClick(amount)}
                    className={cn(
                      "h-9 text-sm font-semibold border-slate-600 hover:border-slate-500 px-3",
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
          )}

          {gameDetails && gameDetails.status === 'scheduled' && (
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 text-center text-slate-100">Select Your Squares <span className="text-xs text-slate-400">(Max {MAX_SQUARE_SELECTION_LIMIT})</span></h2>
              {renderGrid()}
            </div>
          )}
          {gameDetails && gameDetails.status !== 'scheduled' && (
            <div className="mb-6">
              {/* Winners scoreboard */}
              <div 
                className="max-w-3xl mx-auto px-2 py-3 rounded-lg"
                        style={{ 
                  background: 'radial-gradient(ellipse at center, rgba(20,28,48,0.98) 0%, rgba(20,28,48,0.9) 60%, rgba(20,28,48,0.0) 100%), #0a0e1b'
                }}
              >
                <div className="text-[10px] sm:text-xs text-slate-400 mb-2 text-center font-medium">
                  Winners
                </div>
                <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
                  {/* Q1 */}
                  {(() => {
                    const isQ1Current = gameDetails?.status === 'live' && !q1WinningSquare && Number(gameDetails.quarter) === 1;
                    return (
                  <div 
                    className={cn(
                          "relative flex flex-col items-center justify-center p-3 rounded-lg transition-all overflow-hidden",
                          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none",
                          "shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
                      q1WinningSquare 
                            ? "bg-gradient-to-br from-[#1bb0f2] to-[#108bcc]" 
                            : "bg-black/30",
                          isQ1Current && "ring-2 ring-[#1bb0f2] ring-offset-2 ring-offset-transparent"
                        )}
                      >
                        {q1WinningSquare ? (
                      <>
                        {/* Assigned: Label container top, Number container middle */}
                        <div className="w-full flex items-center justify-center">
                          <span className="text-xs font-semibold uppercase text-white">
                            Q1
                          </span>
                </div>
                        <Separator className="my-1 w-full bg-white/20" />
                        <div className="w-full flex items-center justify-center">
                          <span className="text-2xl font-bold font-mono text-white">
                            {q1WinningSquare}
                          </span>
                        </div>
                        
                        {/* Winner container at bottom (if user owns this square) */}
                        {doesUserOwnWinningSquare('q1') && (
                          <>
                            <Separator className="my-1 w-full bg-white/20" />
                            <div className="relative overflow-hidden bg-gradient-to-r from-[#FFE08A] via-[#E7B844] to-[#C9962E] flex items-center justify-center py-2 rounded-b-lg shadow-[0_0_10px_rgba(231,184,68,0.35)] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none">
                              <span className="text-[10px] font-bold uppercase text-white tracking-wide">
                                WINNER
                              </span>
                            </div>
                          </>
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
                          <div className="relative overflow-hidden bg-gradient-to-br from-[#1bb0f2] to-[#108bcc] flex items-center justify-center py-3 rounded-b-lg before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none">
                            <span className="text-xs font-semibold uppercase text-gray-400">
                              Q1
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                    );
                  })()}
                
                {/* Q2 */}
                  {(() => {
                    const isQ2Current = gameDetails?.status === 'live' && !q2WinningSquare && Number(gameDetails.quarter) === 2;
                    return (
                <div 
                  className={cn(
                          "relative flex flex-col items-center justify-center p-3 rounded-lg transition-all overflow-hidden",
                          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none",
                          "shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
                    q2WinningSquare 
                            ? "bg-gradient-to-br from-[#1bb0f2] to-[#108bcc]" 
                            : "bg-black/30",
                          isQ2Current && "ring-2 ring-[#1bb0f2] ring-offset-2 ring-offset-transparent"
                        )}
                      >
                        {q2WinningSquare ? (
                      <>
                        {/* Assigned: Label container top, Number container middle */}
                        <div className="w-full flex items-center justify-center">
                          <span className="text-xs font-semibold uppercase text-white">
                            Q2
                          </span>
                        </div>
                        <Separator className="my-1 w-full bg-white/20" />
                        <div className="w-full flex items-center justify-center">
                          <span className="text-2xl font-bold font-mono text-white">
                            {q2WinningSquare}
                          </span>
                        </div>
                        
                        {/* Winner container at bottom (if user owns this square) */}
                        {doesUserOwnWinningSquare('q2') && (
                          <>
                            <Separator className="my-1 w-full bg-white/20" />
                            <div className="relative overflow-hidden bg-gradient-to-r from-[#FFE08A] via-[#E7B844] to-[#C9962E] flex items-center justify-center py-2 rounded-b-lg shadow-[0_0_10px_rgba(231,184,68,0.35)] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none">
                              <span className="text-[10px] font-bold uppercase text-white tracking-wide">
                                WINNER
                              </span>
                            </div>
                          </>
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
                          <div className="relative overflow-hidden bg-gradient-to-br from-[#1bb0f2] to-[#108bcc] flex items-center justify-center py-3 rounded-b-lg before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none">
                            <span className="text-xs font-semibold uppercase text-gray-400">
                              Q2
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                </div>
                    );
                  })()}
                
                {/* Q3 */}
                  {(() => {
                    const isQ3Current = gameDetails?.status === 'live' && !q3WinningSquare && Number(gameDetails.quarter) === 3;
                    return (
                <div 
                  className={cn(
                          "relative flex flex-col items-center justify-center p-3 rounded-lg transition-all overflow-hidden",
                          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none",
                          "shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
                    q3WinningSquare 
                            ? "bg-gradient-to-br from-[#1bb0f2] to-[#108bcc]" 
                            : "bg-black/30",
                          isQ3Current && "ring-2 ring-[#1bb0f2] ring-offset-2 ring-offset-transparent"
                        )}
                      >
                        {q3WinningSquare ? (
                      <>
                        {/* Assigned: Label container top, Number container middle */}
                        <div className="w-full flex items-center justify-center">
                          <span className="text-xs font-semibold uppercase text-white">
                            Q3
                          </span>
                        </div>
                        <Separator className="my-1 w-full bg-white/20" />
                        <div className="w-full flex items-center justify-center">
                          <span className="text-2xl font-bold font-mono text-white">
                            {q3WinningSquare}
                          </span>
                        </div>
                        
                        {/* Winner container at bottom (if user owns this square) */}
                        {doesUserOwnWinningSquare('q3') && (
                          <>
                            <Separator className="my-1 w-full bg-white/20" />
                            <div className="relative overflow-hidden bg-gradient-to-r from-[#FFE08A] via-[#E7B844] to-[#C9962E] flex items-center justify-center py-2 rounded-b-lg shadow-[0_0_10px_rgba(231,184,68,0.35)] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none">
                              <span className="text-[10px] font-bold uppercase text-white tracking-wide">
                                WINNER
                              </span>
                            </div>
                          </>
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
                          <div className="relative overflow-hidden bg-gradient-to-br from-[#1bb0f2] to-[#108bcc] flex items-center justify-center py-3 rounded-b-lg before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none">
                            <span className="text-xs font-semibold uppercase text-gray-400">
                              Q3
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                </div>
                    );
                  })()}
                
                {/* FINAL */}
                  {(() => {
                    const isFinalCurrent = gameDetails?.status === 'live' && !finalWinningSquare && Number(gameDetails.quarter) === 4;
                    return (
                <div 
                  className={cn(
                          "relative flex flex-col items-center justify-center p-3 rounded-lg transition-all overflow-hidden",
                          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none",
                          "shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
                    finalWinningSquare 
                            ? "bg-gradient-to-br from-[#1bb0f2] to-[#108bcc]" 
                            : "bg-black/30",
                          isFinalCurrent && "ring-2 ring-[#1bb0f2] ring-offset-2 ring-offset-transparent"
                        )}
                      >
                        {finalWinningSquare ? (
                      <>
                        {/* Assigned: Label container top, Number container middle */}
                        <div className="w-full flex items-center justify-center">
                          <span className="text-xs font-semibold uppercase text-white">
                            Final
                          </span>
                </div>
                        <Separator className="my-1 w-full bg-white/20" />
                        <div className="w-full flex items-center justify-center">
                          <span className="text-2xl font-bold font-mono text-white">
                            {finalWinningSquare}
                          </span>
                        </div>
                        
                        {/* Winner container at bottom (if user owns this square) */}
                        {doesUserOwnWinningSquare('final') && (
                          <>
                            <Separator className="my-1 w-full bg-white/20" />
                            <div className="relative overflow-hidden bg-gradient-to-r from-[#FFE08A] via-[#E7B844] to-[#C9962E] flex items-center justify-center py-2 rounded-b-lg shadow-[0_0_10px_rgba(231,184,68,0.35)] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none">
                              <span className="text-[10px] font-bold uppercase text-white tracking-wide">
                                WINNER
                              </span>
                            </div>
                          </>
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
                          <div className="relative overflow-hidden bg-gradient-to-br from-[#1bb0f2] to-[#108bcc] flex items-center justify-center py-3 rounded-b-lg before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none">
                            <span className="text-xs font-semibold uppercase text-gray-400">
                              Final
                            </span>
          </div>
              </div>
                      </>
                    )}
              </div>
                    );
                  })()}
            </div>
              </div>
            </div>
          )}

          {selectedSquares.size > 0 && currentBoard && currentBoard.status === 'open' && (
             <div className="text-center px-2 mt-8 mb-8" ref={confirmRef}>
                <div className="relative inline-block max-w-md mx-auto w-full group transform hover:scale-105 transition-transform duration-150 ease-out">
                  <button
                    type="button"
                      onClick={handleConfirmSelection} 
                      disabled={
                        isConfirming ||
                        isLoadingBoard ||
                        (((gameDetails?.start_time?.toMillis?.() ?? Number.POSITIVE_INFINITY) < Date.now())) ||
                        walletIsLoading ||
                        currentBoard.status !== 'open' ||
                        isLoadingUserSquares
                      }
                    className={cn(
                      "w-full rounded-xl px-4 py-3 font-bold text-base sm:text-lg tracking-wide",
                      "glass border text-white border-green-500/95 backdrop-blur-xl backdrop-saturate-200",
                      "bg-gradient-to-br from-green-400/40 via-green-500/35 to-green-600/40",
                      "hover:from-green-400/50 hover:via-green-500/45 hover:to-green-600/50",
                      "shadow-[0_18px_40px_rgba(34,197,94,0.55),inset_0_1px_2px_rgba(255,255,255,0.55)] ring-1 ring-green-400/70",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300/80",
                      "disabled:opacity-60 disabled:cursor-not-allowed"
                    )}
                    style={{ textShadow: '0 1px 0 rgba(0,0,0,0.25)' }}
                  >
                      {isConfirming ? (
                      <><Loader2 className="mr-2 h-5 w-5 inline-block animate-spin" /> Processing...</>
                      ) : (
                          `Confirm ${selectedSquares.size} Square${selectedSquares.size > 1 ? 's' : ''} ($${(selectedSquares.size * selectedEntryAmount).toFixed(2)})`
                      )}
                  </button>
                  {selectedSquares.size > 0 && (
                    <div className="absolute -top-3 right-3 z-40 pointer-events-auto">
                      <WalletPill balance={displayedBalance} onClick={handleWalletClick} variant="docked" />
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
  <DialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b]/95 to-[#B8860B]/95 to-15% border-accent-1/50 text-white py-8 backdrop-blur-md">
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