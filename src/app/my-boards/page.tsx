"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Info, Trophy, ListChecks } from 'lucide-react'; // Added Trophy and ListChecks for potential use
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SquareCard from '@/components/my-boards/SquareCard'; // Updated import
import BottomNav from '@/components/lobby/BottomNav'; // Corrected Import BottomNavBar
import { auth, db } from '@/lib/firebase'; // Import auth and db
import { User as FirebaseUser } from 'firebase/auth'; // Firebase user type
import { 
  collection, query, where, getDocs, doc, getDoc, DocumentData, Timestamp 
} from 'firebase/firestore'; // Firestore imports
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog"; // Import Dialog components
import { AppBoard, TeamInfo, BoardSquare, BoardStatus } from '../../types/myBoards';

// Remove interface/type definitions from this file (move to types/myBoards.ts)

export default function MyBoardsPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeBoardsData, setActiveBoardsData] = useState<AppBoard[]>([]);
  const [historicalBoardsData, setHistoricalBoardsData] = useState<AppBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false); // Added state for login modal
  const router = useRouter();
  const [historyFilter, setHistoryFilter] = useState<'all' | 'won' | 'lost'>('all');
  const [historySort, setHistorySort] = useState<'date' | 'winnings'>('date');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
        setAuthLoading(false);
      if (!user) {
        setActiveBoardsData([]);
        setHistoricalBoardsData([]);
        setIsLoading(false); 
        setError(null); 
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchBoardData = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    console.log("[MyBoardsPage] Fetching 'open' boards and checking participation for user:", userId);

    try {
      const openBoardsQuery = query(collection(db, "boards"), where("status", "==", "open"));
      const openBoardSnapshots = await getDocs(openBoardsQuery);
      console.log(`[MyBoardsPage] Found ${openBoardSnapshots.docs.length} total 'open' board documents.`);

      if (openBoardSnapshots.empty) {
        console.log("[MyBoardsPage] No 'open' boards found in the database.");
        setActiveBoardsData([]);
        setIsLoading(false);
        return;
      }

      const userRelevantBoardsPromises = openBoardSnapshots.docs.map(async (boardDoc) => {
        const boardData = boardDoc.data();
        console.log(`[MyBoardsPage] Checking board ID: ${boardDoc.id}, Status: ${boardData.status}`);

        const userRef = doc(db, "users", userId);
        const squaresQuery = query(collection(db, "boards", boardDoc.id, "squares"), where("userID", "==", userRef)); 
        const userSquaresSnap = await getDocs(squaresQuery);

        if (userSquaresSnap.empty) {
          console.log(`[MyBoardsPage] User ${userId} has NO SQUARES in board ${boardDoc.id}. Skipping this board.`);
          return null; 
        } else {
          console.log(`[MyBoardsPage] User ${userId} HAS ${userSquaresSnap.docs.length} SQUARES in board ${boardDoc.id}. Processing...`);
        }
        
        const userPickedSquaresData: BoardSquare[] = userSquaresSnap.docs.map(sqDoc => {
            const data = sqDoc.data();
            const squareIndex = typeof data.index === 'number' ? data.index : -1; 
            const squareValue = typeof data.square === 'string' ? data.square : undefined; // Get the .square field
            return { 
                index: squareIndex,
                isUserSquare: true, 
                square: squareValue // Populate it here
            };
        });

        let gameData: DocumentData | null = null;
        let homeTeamData: TeamInfo | undefined = undefined;
        let awayTeamData: TeamInfo | undefined = undefined;

        if (boardData.gameID && typeof boardData.gameID.path === 'string') { 
          const gameDocSnap = await getDoc(doc(db, boardData.gameID.path));
          if (gameDocSnap.exists()) {
            gameData = gameDocSnap.data();
            // Populate team data as before...
            if (gameData.home_team_id && typeof gameData.home_team_id.path === 'string') {
              const homeTeamSnap = await getDoc(doc(db, gameData.home_team_id.path));
              if (homeTeamSnap.exists()) {
                const htData = homeTeamSnap.data(); 
                homeTeamData = { name: htData.name || "N/A", logo: htData.logo ? `/team-logos/${htData.logo}` : undefined, initials: htData.initials || "N/A" };
              }
            }
            if (gameData.away_team_id && typeof gameData.away_team_id.path === 'string') {
              const awayTeamSnap = await getDoc(doc(db, gameData.away_team_id.path));
              if (awayTeamSnap.exists()) {
                 const atData = awayTeamSnap.data(); 
                awayTeamData = { name: atData.name || "N/A", logo: atData.logo ? `/team-logos/${atData.logo}` : undefined, initials: atData.initials || "N/A" };
              }
            }
          } else {
            console.warn(`[MyBoardsPage] Game document not found for gameID: ${boardData.gameID.path} (Board: ${boardDoc.id})`);
          }
        } else {
          console.warn(`[MyBoardsPage] Board ${boardDoc.id} is missing gameID or gameID.path is not a string. gameID: ${boardData.gameID}`);
        }
        
        let gameDateTimeStr = new Date().toISOString(); 
        if (gameData && gameData.start_time && gameData.start_time.toDate) {
             gameDateTimeStr = gameData.start_time.toDate().toISOString();
        } else if (boardData.created_time && boardData.created_time.toDate) { 
             gameDateTimeStr = boardData.created_time.toDate().toISOString();
        }

        const appBoardEntry: AppBoard = {
          id: boardDoc.id,
          gameId: gameData && boardData.gameID ? boardData.gameID.id : 'N/A',
          homeTeam: homeTeamData || { name: "Team A", initials: "TA", logo: undefined },
          awayTeam: awayTeamData || { name: "Team B", initials: "TB", logo: undefined },
          gameDateTime: gameDateTimeStr,
          status: boardData.status as BoardStatus || 'open' as BoardStatus,
          is_live: gameData?.is_live || false, 
          broadcast_provider: gameData?.broadcast_provider || undefined, // Populate broadcast_provider
          sport: gameData?.sport || "N/A", 
          league: gameData?.leagueName || "N/A", // leagueName might not be on game doc based on memory
          userSquareSelectionCount: userPickedSquaresData.length,
          // totalSquareCount from boardData if it exists, else default.
          totalSquareCount: typeof boardData.totalSquareCount === 'number' ? boardData.totalSquareCount : 100, 
          userPickedSquares: userPickedSquaresData,
          selected_indexes_on_board: Array.isArray(boardData.selected_indexes) ? boardData.selected_indexes : [], // Populate selected_indexes_on_board
          home_axis_numbers: Array.isArray(boardData.home_numbers) ? boardData.home_numbers : [], // Populate home_axis_numbers
          away_axis_numbers: Array.isArray(boardData.away_numbers) ? boardData.away_numbers : [], // Populate away_axis_numbers
          winnings: typeof boardData.winnings === 'number' ? boardData.winnings : 0, 
          stake: typeof boardData.amount === 'number' ? boardData.amount : undefined, 
          // Add winning indexes from boardData (e.g., boardData.q1_winning_number)
          q1_winning_index: typeof boardData.q1_winning_number === 'number' ? boardData.q1_winning_number : undefined,
          q2_winning_index: typeof boardData.q2_winning_number === 'number' ? boardData.q2_winning_number : undefined,
          q3_winning_index: typeof boardData.q3_winning_number === 'number' ? boardData.q3_winning_number : undefined,
          q4_winning_index: typeof boardData.q4_winning_number === 'number' ? boardData.q4_winning_number : undefined, // Adjust if final field name differs
        };
        console.log(`[MyBoardsPage] Successfully processed board ${boardDoc.id}. AppBoard entry:`, appBoardEntry);
        return appBoardEntry;
      });

      const populatedUserBoards = (await Promise.all(userRelevantBoardsPromises)).filter((b: AppBoard | null): b is AppBoard => b !== null);
      // Ensure it's AppBoard[] for safety, though filter should ensure non-null
      console.log("[MyBoardsPage] Final populatedUserBoards before setting state:", populatedUserBoards);

      setActiveBoardsData(populatedUserBoards);
      setHistoricalBoardsData([]); 

    } catch (err) {
      console.error("[MyBoardsPage] Error in fetchBoardData:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred while fetching user boards.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistoricalBoards = useCallback(async (userId: string) => {
    // Fetch boards where user has squares and board status is final (won/lost/cancelled)
    setIsLoading(true);
    setError(null);
    try {
      const finalStatuses: BoardStatus[] = ['FINAL_WON', 'FINAL_LOST', 'CANCELLED'];
      const boardsQuery = query(collection(db, 'boards'), where('status', 'in', finalStatuses));
      const boardSnapshots = await getDocs(boardsQuery);
      const userBoards: AppBoard[] = [];
      for (const boardDoc of boardSnapshots.docs) {
        const boardData = boardDoc.data();
        const userRef = doc(db, 'users', userId);
        const squaresQuery = query(collection(db, 'boards', boardDoc.id, 'squares'), where('userID', '==', userRef));
        const userSquaresSnap = await getDocs(squaresQuery);
        if (!userSquaresSnap.empty) {
          const userPickedSquaresData: BoardSquare[] = userSquaresSnap.docs.map(sqDoc => {
              const data = sqDoc.data();
              const squareIndex = typeof data.index === 'number' ? data.index : -1; 
              const squareValue = typeof data.square === 'string' ? data.square : undefined; // Get the .square field
              return { 
                  index: squareIndex,
                  isUserSquare: true, 
                  square: squareValue // Populate it here
              };
          });

          let gameData: DocumentData | null = null;
          let homeTeamData: TeamInfo | undefined = undefined;
          let awayTeamData: TeamInfo | undefined = undefined;

          if (boardData.gameID && typeof boardData.gameID.path === 'string') { 
            const gameDocSnap = await getDoc(doc(db, boardData.gameID.path));
            if (gameDocSnap.exists()) {
              gameData = gameDocSnap.data();
              // Populate team data as before...
              if (gameData.home_team_id && typeof gameData.home_team_id.path === 'string') {
                const homeTeamSnap = await getDoc(doc(db, gameData.home_team_id.path));
                if (homeTeamSnap.exists()) {
                  const htData = homeTeamSnap.data(); 
                  homeTeamData = { name: htData.name || "N/A", logo: htData.logo ? `/team-logos/${htData.logo}` : undefined, initials: htData.initials || "N/A" };
                }
              }
              if (gameData.away_team_id && typeof gameData.away_team_id.path === 'string') {
                const awayTeamSnap = await getDoc(doc(db, gameData.away_team_id.path));
                if (awayTeamSnap.exists()) {
                   const atData = awayTeamSnap.data(); 
                  awayTeamData = { name: atData.name || "N/A", logo: atData.logo ? `/team-logos/${atData.logo}` : undefined, initials: atData.initials || "N/A" };
                }
              }
            } else {
              console.warn(`[MyBoardsPage] Game document not found for gameID: ${boardData.gameID.path} (Board: ${boardDoc.id})`);
            }
          } else {
            console.warn(`[MyBoardsPage] Board ${boardDoc.id} is missing gameID or gameID.path is not a string. gameID: ${boardData.gameID}`);
          }
          
          let gameDateTimeStr = new Date().toISOString(); 
          if (gameData && gameData.start_time && gameData.start_time.toDate) {
               gameDateTimeStr = gameData.start_time.toDate().toISOString();
          } else if (boardData.created_time && boardData.created_time.toDate) { 
               gameDateTimeStr = boardData.created_time.toDate().toISOString();
          }

          const appBoardEntry: AppBoard = {
            id: boardDoc.id,
            gameId: gameData && boardData.gameID ? boardData.gameID.id : 'N/A',
            homeTeam: homeTeamData || { name: "Team A", initials: "TA", logo: undefined },
            awayTeam: awayTeamData || { name: "Team B", initials: "TB", logo: undefined },
            gameDateTime: gameDateTimeStr,
            status: boardData.status as BoardStatus || 'open' as BoardStatus,
            is_live: gameData?.is_live || false, 
            broadcast_provider: gameData?.broadcast_provider || undefined, // Populate broadcast_provider
            sport: gameData?.sport || "N/A", 
            league: gameData?.leagueName || "N/A", // leagueName might not be on game doc based on memory
            userSquareSelectionCount: userPickedSquaresData.length,
            // totalSquareCount from boardData if it exists, else default.
            totalSquareCount: typeof boardData.totalSquareCount === 'number' ? boardData.totalSquareCount : 100, 
            userPickedSquares: userPickedSquaresData,
            selected_indexes_on_board: Array.isArray(boardData.selected_indexes) ? boardData.selected_indexes : [], // Populate selected_indexes_on_board
            home_axis_numbers: Array.isArray(boardData.home_numbers) ? boardData.home_numbers : [], // Populate home_axis_numbers
            away_axis_numbers: Array.isArray(boardData.away_numbers) ? boardData.away_numbers : [], // Populate away_axis_numbers
            winnings: typeof boardData.winnings === 'number' ? boardData.winnings : 0, 
            stake: typeof boardData.amount === 'number' ? boardData.amount : undefined, 
            // Add winning indexes from boardData (e.g., boardData.q1_winning_number)
            q1_winning_index: typeof boardData.q1_winning_number === 'number' ? boardData.q1_winning_number : undefined,
            q2_winning_index: typeof boardData.q2_winning_number === 'number' ? boardData.q2_winning_number : undefined,
            q3_winning_index: typeof boardData.q3_winning_number === 'number' ? boardData.q3_winning_number : undefined,
            q4_winning_index: typeof boardData.q4_winning_number === 'number' ? boardData.q4_winning_number : undefined, // Adjust if final field name differs
          };
          userBoards.push(appBoardEntry);
        }
      }
      setHistoricalBoardsData(userBoards);
    } catch (err) {
      setError('Failed to fetch historical boards.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchBoardData(currentUser.uid);
      fetchHistoricalBoards(currentUser.uid);
    } else if (!authLoading && !currentUser) {
      setIsLoading(false); 
      setActiveBoardsData([]); 
      setHistoricalBoardsData([]);
      setError("Please log in to view your boards.");
    }
  }, [currentUser, authLoading, fetchBoardData, fetchHistoricalBoards]);

  const handleBoardCardClick = useCallback((boardId: string) => {
    console.log("Board card clicked:", boardId);
    // router.push(`/my-boards/${boardId}`); 
  }, [router]);

  // Added handleProtectedAction for BottomNav
  const handleProtectedAction = useCallback(() => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
    }
    // If user is logged in, BottomNav actions should navigate directly
    // or this function could be expanded if other protected actions are needed from this page
  }, [currentUser]);

  const renderBoardGrid = (boards: AppBoard[], type: 'active' | 'history') => {
    if (authLoading) { 
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
          <p className="ml-4 text-slate-500">Authenticating...</p>
        </div>
      );
    }

    if (isLoading && !authLoading && currentUser) { 
    return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
          <p className="ml-4 text-slate-500">Loading your boards...</p>
        </div>
      );
    }
    
    if (error && !authLoading && currentUser) { // Only show board fetching error if user is logged in
        return (
            <div className="text-center py-10 px-4 text-red-500">
                <Info size={56} className="mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-3">Error Loading Boards</h3>
                <p>{error}</p>
            </div>
        );
    }
    
    if (!currentUser && !authLoading) { // Show login prompt if not logged in
                  return (
            <div className="text-center py-10 px-4">
                <Info size={56} className="mx-auto mb-4 text-slate-500" />
                <h3 className="text-2xl font-semibold mb-3 text-text-primary">Login Required</h3>
                <p className="text-text-secondary mb-6">Please log in to view your game boards.</p>
                <Link href="/login">
                    <Button className="mt-4">Login</Button>
                </Link>
              </div>
                  );
    }

    if (boards.length === 0 && !isLoading && !authLoading && currentUser) { 
      return (
        <div className="text-center py-10 px-4">
          <div className="flex justify-center mb-4">
            {type === 'active' ? 
              <ListChecks size={56} className="text-slate-500" /> : 
              <Trophy size={56} className="text-slate-500" />
            }
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-text-primary">
            {type === 'active' ? "No Active Boards" : "No Board History"}
          </h3>
          <p className="text-text-secondary mb-6">
            {type === 'active' ? 
              "You don\'t have any boards currently in play or open for picks." : 
              "You haven\'t completed any boards yet. Your past games will appear here."
            }
          </p>
          {type === 'active' && (
            <Link href="/lobby">
              <Button>
                Find a Game
              </Button>
            </Link>
          )}
        </div>
      );
    }

    if (type === 'history' && boards.length > 0) {
      // Filtering and sorting controls
      return (
        <>
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <label className="text-sm text-gray-400">Filter:</label>
            <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value as any)} className="bg-gray-800 text-white rounded px-2 py-1">
              <option value="all">All</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <label className="text-sm text-gray-400 ml-4">Sort by:</label>
            <select value={historySort} onChange={e => setHistorySort(e.target.value as any)} className="bg-gray-800 text-white rounded px-2 py-1">
              <option value="date">Date</option>
              <option value="winnings">Winnings</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-1 justify-center">
            {boards
              .filter(b => historyFilter === 'all' || (historyFilter === 'won' ? b.status === 'FINAL_WON' : b.status === 'FINAL_LOST'))
              .sort((a, b) => {
                if (historySort === 'date') {
                  return new Date(b.gameDateTime).getTime() - new Date(a.gameDateTime).getTime();
                } else {
                  return (b.winnings || 0) - (a.winnings || 0);
                }
              })
              .map(board => (
                <SquareCard key={board.id} board={board} onClick={handleBoardCardClick} />
              ))}
          </div>
        </>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-1 justify-center">
        {boards.map((board) => (
          <SquareCard key={board.id} board={board} onClick={handleBoardCardClick} />
        ))}
        </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-primary pb-16"> {/* Added pb-16 for BottomNav clearance */}
      <main className="flex-grow container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary">Your Game Boards</h1>
          <p className="text-lg text-text-secondary mt-2">
            Track your active boards, review past games, and see your winnings.
          </p>
        </header>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mx-auto">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-6">
            {renderBoardGrid(activeBoardsData, 'active')}
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            {renderBoardGrid(historicalBoardsData, 'history')}
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav user={currentUser} onProtectedAction={handleProtectedAction} /> {/* Passed props */}
      
      {/* Login Dialog Copied & Adapted from LobbyPage */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
         <DialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b] to-[#5855e4] to-15% border-accent-1/50 text-white py-8">
            <DialogHeader className="text-center items-center">
               <DialogTitle className="text-2xl font-bold mb-2">Login Required</DialogTitle>
               <DialogDescription className="text-gray-300 opacity-90">
                  You need to be logged in or create an account to perform this action.
               </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 mb-2">
            <Button 
              onClick={() => { setIsLoginModalOpen(false); router.push('/login'); }} 
              className="flex-1 bg-accent-1 hover:bg-accent-1/80 text-white font-semibold"
            >
              Login
            </Button>
            <Button 
              onClick={() => { setIsLoginModalOpen(false); router.push('/signup'); }} 
              variant="outline" 
              className="flex-1 bg-transparent border-gray-500 hover:bg-gray-500/20 text-gray-300 font-semibold hover:text-gray-300"
            >
              Sign Up
            </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
} 