'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, DocumentReference, Timestamp, limit } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Game, Board, TeamInfo, GameTeamInfo } from '@/types/lobby'; // Reuse lobby types
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ArrowLeft, AlertTriangle, Info, Loader2 } from 'lucide-react'; // Import icons
import { useWallet } from '@/hooks/useWallet'; // Import wallet hook
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog"; // Import Dialog components
import Link from 'next/link'; // Import Link for dialog buttons

// Define types for fetched data
interface GameDetails extends Omit<Game, 'teamA' | 'teamB'> {
  id: string;
  teamA: TeamInfo; // Use full TeamInfo for details
  teamB: TeamInfo;
  start_time: Timestamp; // Keep raw timestamp
  home_score?: number; // Add home score
  away_score?: number; // Add away score
}

interface GameBoard extends Omit<Board, 'teamA' | 'teamB'> {
  takenSquares?: number[]; // Add taken squares if available
  status?: 'open' | 'closed' | 'cancelled';
}

// --- Helper: Fetch Team Data (similar to lobby, maybe move to utils?) ---
const getTeamData = async (teamRef: DocumentReference | undefined): Promise<TeamInfo> => {
  const defaultTeam: TeamInfo = { name: 'N/A', fullName: 'N/A', record: 'N/A', abbreviation: 'N/A', logo: undefined, color: undefined, seccolor: undefined }; 
  if (!teamRef || !(teamRef instanceof DocumentReference)) return defaultTeam;
  try {
    const teamSnap = await getDoc(teamRef);
    if (teamSnap.exists()) {
      const teamData = teamSnap.data();
      return {
        name: teamData.name || 'N/A', 
        fullName: teamData.full_name || teamData.name || 'N/A', 
        record: teamData.record || '0-0',
        abbreviation: teamData.initials || 'N/A',
        logo: teamData.logo || undefined, 
        color: teamData.color || undefined, 
        seccolor: teamData.seccolor || undefined 
      };
    } else {
      return defaultTeam;
    }
  } catch (error) {
    console.error("Error fetching team data:", error);
    return defaultTeam;
  }
};

// --- Game Page Component --- 
function GamePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const gameId = params.gameId as string;
  const initialEntryAmount = parseInt(searchParams.get('entry') || '1', 10); // Default to 1 if param missing/invalid

  const { 
      hasWallet, 
      balance, 
      isLoading: isWalletLoading, 
      error: walletError, 
      userId 
  } = useWallet(); // Use wallet hook

  // Dialog state
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptType, setPromptType] = useState<'setup' | 'deposit' | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [currentBoard, setCurrentBoard] = useState<GameBoard | null>(null);
  const [selectedEntryAmount, setSelectedEntryAmount] = useState<number>(initialEntryAmount);
  const [selectedSquares, setSelectedSquares] = useState<Set<number>>(new Set());
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false); // State for confirmation loading

  const entryAmounts = [1, 5, 10, 20];

  // --- Auth Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      // No need to fetch wallet here, useWallet hook handles it
    });
    return () => unsubscribe();
  }, []);

  // --- Fetch Game Details Effect ---
  useEffect(() => {
    if (!gameId) return;
    setIsLoadingGame(true);
    setError(null);

    const fetchGame = async () => {
      try {
        const gameRef = doc(db, 'games', gameId);
        const gameSnap = await getDoc(gameRef);

        if (!gameSnap.exists()) {
          throw new Error('Game not found');
        }

        const gameData = gameSnap.data();
        const teamAData = await getTeamData(gameData.away_team_id as DocumentReference | undefined);
        const teamBData = await getTeamData(gameData.home_team_id as DocumentReference | undefined);

        setGameDetails({
          id: gameSnap.id,
          sport: gameData.sport,
          status: gameData.is_live ? 'live' : (gameData.is_over ? 'final' : 'upcoming'),
          teamA: teamAData,
          teamB: teamBData,
          time: !gameData.is_live && !gameData.is_over && gameData.start_time ? new Date(gameData.start_time.seconds * 1000).toLocaleTimeString([], { hour: 'numeric', minute:'2-digit' }) : undefined,
          date: !gameData.is_live && !gameData.is_over && gameData.start_time ? new Date(gameData.start_time.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }) : undefined,
          period: gameData.is_live ? (gameData.period || 'Live') : undefined,
          quarter: gameData.quarter,
          broadcastProvider: gameData.broadcast_provider || undefined,
          home_score: gameData.home_team_score ?? 0, // Store home score
          away_score: gameData.away_team_score ?? 0, // Store away score
          start_time: gameData.start_time as Timestamp // Keep raw timestamp
        });

      } catch (err: any) {
        console.error("Error fetching game details:", err);
        setError(err.message || 'Failed to load game details.');
      }
      finally {
        setIsLoadingGame(false);
      }
    };

    fetchGame();
  }, [gameId]);

  // --- Fetch Board Details Effect ---
  useEffect(() => {
    if (!gameId) return;

    const fetchBoard = async () => {
      setIsLoadingBoard(true);
      setCurrentBoard(null); // Clear previous board
      setSelectedSquares(new Set()); // Clear selections when amount changes
      try {
        const gameRef = doc(db, 'games', gameId);
        const boardsQuery = query(
          collection(db, 'boards'),
          where('gameID', '==', gameRef),
          where('amount', '==', selectedEntryAmount),
          where('status', '==', 'open'), // Look for open boards
          limit(1) // Get the most recent open board for this amount
        );

        const boardSnap = await getDocs(boardsQuery);

        if (!boardSnap.empty) {
          const boardDoc = boardSnap.docs[0];
          const boardData = boardDoc.data();
          setCurrentBoard({
            id: boardDoc.id,
            gameId: gameId,
            prize: boardData.prize || selectedEntryAmount * 100 * 0.8, // Calculate prize if missing
            entryFee: boardData.amount,
            isFreeEntry: boardData.amount === 0,
            takenSquares: boardData.takenSquares || [], // Assume takenSquares is an array of numbers
            status: boardData.status,
          });
        } else {
          // No open board found for this amount
          setCurrentBoard(null); 
          console.log(`No open board found for game ${gameId} with entry $${selectedEntryAmount}`);
        }
      } catch (err: any) {
        console.error("Error fetching board details:", err);
        // Don't set main error, maybe show specific board error?
      }
      finally {
        setIsLoadingBoard(false);
      }
    };

    fetchBoard();
  }, [gameId, selectedEntryAmount]);

  // --- Handlers ---
  const handleSquareClick = (squareNumber: number) => {
    if (!currentBoard || currentBoard.status !== 'open' || isWalletLoading || isConfirming) return;

    // Check if logged in
    if (!user || !userId) {
        router.push('/login?redirect=/game/' + gameId + '?entry=' + selectedEntryAmount); // Redirect to login
        return;
    }

    // Check if game started 
    if (gameDetails && gameDetails.start_time.toMillis() < Date.now()) {
        console.log("Game already started, selection closed.");
        setError("Game has already started. Selections are closed."); // Show error
        return;
    }
    setError(null); // Clear previous errors

    // Check if square is already taken
    if (currentBoard.takenSquares?.includes(squareNumber)) {
      console.log(`Square ${squareNumber} already taken.`);
      return; // Do nothing if square is taken
    }

    // --- Wallet Checks --- (Perform before adding to selection)
    // 1. Check if wallet exists
    if (hasWallet === false) { // Explicitly check for false, null means loading/error
        setPromptType('setup');
        setIsPromptOpen(true);
        return;
    }

    // 2. Check if balance is sufficient (only if not free entry)
    if (!currentBoard.isFreeEntry && balance < selectedEntryAmount) {
        setPromptType('deposit');
        setIsPromptOpen(true);
        return;
    }
    // --- End Wallet Checks ---

    // Toggle selection
    setSelectedSquares(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(squareNumber)) {
        newSelection.delete(squareNumber);
      } else {
        // TODO: Limit number of selections if needed
        newSelection.add(squareNumber);
      }
      return newSelection;
    });
  };

  const handleConfirmSelection = async () => {
    if (selectedSquares.size === 0 || !currentBoard || !user || !userId || isWalletLoading || isConfirming) return;

    // --- Re-run wallet checks before confirming --- 
    if (hasWallet === false) {
        setPromptType('setup');
        setIsPromptOpen(true);
        return;
    }
    const totalCost = selectedSquares.size * selectedEntryAmount;
    if (!currentBoard.isFreeEntry && balance < totalCost) {
        setPromptType('deposit');
        setIsPromptOpen(true);
        return;
    }
    // --- End Re-run --- 

    setIsConfirming(true);
    setError(null);
    try {
      console.log(`Confirming selection for user ${userId} on board ${currentBoard.id}:`, Array.from(selectedSquares));
      // TODO: Implement backend call (Firebase Function?) to:
      // 1. Atomically check if squares are still available.
      // 2. Atomically deduct balance if not free entry (totalCost).
      // 3. Atomically add user ID to the selected squares on the board document.
      // 4. Create user entry documents linking user, board, game, squares.
      
      // Placeholder: Simulate success after delay
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      console.log("Selection confirmed (simulated)");
      
      // Refresh board data potentially (or rely on listener if implemented)
      // Clear selection after successful confirmation
      setSelectedSquares(new Set());
      // Maybe show a success message/toast?

    } catch (err: any) {
      console.error("Error confirming selection:", err);
      setError(err.message || "Failed to confirm selection. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  // --- Render Logic ---
  const renderGrid = () => {
    if (isLoadingBoard || isLoadingGame) return (
      <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
    if (!currentBoard) return <p className="text-center text-muted-foreground">No open board found for ${selectedEntryAmount} entry.</p>;

    const grid = [];
    for (let i = 0; i < 100; i++) {
      const isSelected = selectedSquares.has(i);
      const isTaken = currentBoard.takenSquares?.includes(i);
      grid.push(
        <button
          key={i}
          onClick={() => handleSquareClick(i)}
          disabled={Boolean(!!isTaken || isConfirming || (gameDetails && gameDetails.start_time.toMillis() < Date.now()))}
          className={cn(
            "aspect-square border border-border rounded flex items-center justify-center text-xs font-mono",
            isTaken ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60" : "bg-background hover:bg-muted",
            isSelected && !isTaken ? "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/10" : "",
            isConfirming ? "cursor-wait" : ""
          )}
        >
          {isTaken ? 'X' : i + 1} 
        </button>
      );
    }
    return (
      <div
        className={cn(
          "grid grid-cols-10 gap-1 p-1 bg-background-secondary rounded-md shadow-inner",
          "md:max-w-md md:mx-auto" // Add these classes for medium screens and up
        )}
      >
        {grid}
      </div>
    );
  };

  if (authLoading || isLoadingGame) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!user) {
    // This part might not be reached if redirect happens in handler, but good fallback
    return <p className="text-center mt-10">Please <Link href="/login" className="underline">log in</Link> to view the game.</p>;
  }

  if (error) {
    return <p className="text-center text-destructive mt-10">Error: {error}</p>;
  }

  if (!gameDetails) {
    return <p className="text-center mt-10">Game not found.</p>;
  }

  // --- Render Component ---
  return (
    <Suspense fallback={<div>Loading game page...</div>}>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background-secondary">
        <main className="flex-grow container mx-auto px-4 py-6">
          {/* Back Button */}
          <button onClick={() => router.back()} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Lobby
          </button>

          {/* Game Header */}
          <div className="flex items-center justify-between mb-4 bg-background p-4 rounded-lg shadow">
             {/* Team A Info */}
             <div className="flex flex-col items-center text-center w-1/3">
                <Image src={gameDetails.teamA.logo || '/brandkit/logo-icon-only.svg'} alt={gameDetails.teamA.name} width={40} height={40} className="mb-1 h-10 w-10 object-contain"/>
                <span className="font-semibold text-sm sm:text-base">{gameDetails.teamA.name}</span>
                <span className="text-xs text-muted-foreground">({gameDetails.teamA.record})</span>
             </div>
             {/* Score/Time Info */}
             <div className="text-center">
                {gameDetails.status === 'live' && (
                    <>
                        <div className="text-2xl font-bold">{gameDetails.away_score} - {gameDetails.home_score}</div>
                        <div className="text-xs text-red-500 animate-pulse">{gameDetails.period}</div>
                    </>
                )}
                {gameDetails.status === 'upcoming' && (
                     <>
                        <div className="text-lg font-semibold">{gameDetails.time}</div>
                        <div className="text-xs text-muted-foreground">{gameDetails.date}</div>
                    </>
                )}
                 {gameDetails.status === 'final' && (
                     <>
                        <div className="text-2xl font-bold">{gameDetails.away_score} - {gameDetails.home_score}</div>
                        <div className="text-xs text-muted-foreground">Final</div>
                    </>
                )}
             </div>
              {/* Team B Info */}
             <div className="flex flex-col items-center text-center w-1/3">
                <Image src={gameDetails.teamB.logo || '/brandkit/logo-icon-only.svg'} alt={gameDetails.teamB.name} width={40} height={40} className="mb-1 h-10 w-10 object-contain"/>
                <span className="font-semibold text-sm sm:text-base">{gameDetails.teamB.name}</span>
                <span className="text-xs text-muted-foreground">({gameDetails.teamB.record})</span>
             </div>
          </div>

          {/* Entry Amount Selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground mb-1 text-center">Select Entry Amount:</p>
            <div className="flex justify-center space-x-2">
              {entryAmounts.map(amount => (
                <Button
                  key={amount}
                  variant={selectedEntryAmount === amount ? "default" : "outline"}
                  onClick={() => setSelectedEntryAmount(amount)}
                  className={cn("w-16", selectedEntryAmount === amount ? "bg-primary text-primary-foreground" : "")}
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Squares Grid */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-center">Select Your Squares</h2>
            {renderGrid()}
          </div>

          {/* Confirm Button */}
          {selectedSquares.size > 0 && currentBoard && currentBoard.status === 'open' && (
             <div className="text-center sticky bottom-4 z-10">
                 <Button 
                    size="lg" 
                    onClick={handleConfirmSelection} 
                    disabled={isConfirming || isLoadingBoard || (gameDetails && gameDetails.start_time.toMillis() < Date.now()) || isWalletLoading}
                    className="w-full max-w-xs shadow-lg bg-accent-2 hover:bg-accent-2/90 text-white"
                >
                    {isConfirming ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                        `Confirm ${selectedSquares.size} Square${selectedSquares.size > 1 ? 's' : ''} ($${(selectedSquares.size * selectedEntryAmount).toFixed(2)})`
                    )}
                </Button>
             </div>
          )}

        </main>

         {/* Wallet Prompt Dialog */}
         <Dialog open={isPromptOpen} onOpenChange={setIsPromptOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" /> 
                    {promptType === 'setup' ? 'Wallet Setup Required' : 'Insufficient Funds'}
                </DialogTitle>
                <DialogDescription>
                    {promptType === 'setup' 
                        ? 'You need to set up your wallet before you can enter paid contests.' 
                        : `You need at least $${(selectedSquares.size * selectedEntryAmount).toFixed(2)} in your wallet to confirm this selection. Your current balance is $${balance.toFixed(2)}.`}
                </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:justify-center">
                    <DialogClose asChild>
                         <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="button" asChild> 
                       <Link href={promptType === 'setup' ? '/wallet' : '/deposit'} legacyBehavior>
                           {promptType === 'setup' ? 'Go to Wallet' : 'Deposit Funds'}
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>

      </div>
    </Suspense>
  );
}

// --- Main Export --- 
export default function GamePage() {
   // Wrap with Suspense for searchParams usage
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <GamePageContent />
    </Suspense>
  );
} 