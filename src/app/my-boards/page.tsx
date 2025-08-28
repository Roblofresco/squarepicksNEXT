"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Info, Trophy, ListChecks, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SquareCard from '@/components/my-boards/SquareCard'; // Updated import
import BottomNav from '@/components/lobby/BottomNav'; // Corrected Import BottomNavBar
import { auth, db } from '@/lib/firebase'; // Import auth and db
import { User as FirebaseUser } from 'firebase/auth'; // Firebase user type
import { 
  collection, query, where, getDocs, doc, getDoc, DocumentData, Timestamp, onSnapshot 
} from 'firebase/firestore'; // Firestore imports
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog"; // Import Dialog components
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { AppBoard, TeamInfo, BoardSquare, BoardStatus } from '../../types/myBoards';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
 

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
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [historySort, setHistorySort] = useState<'date' | 'winnings' | 'entry_fee'>('date');
  const [activeSort, setActiveSort] = useState<'purchased' | 'game_date' | 'entry_fee'>('game_date');
  const [sortDirActive, setSortDirActive] = useState<'asc' | 'desc'>('asc');
  const [sortDirHistory, setSortDirHistory] = useState<'asc' | 'desc'>('asc');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [amountFilter, setAmountFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  
  const [activePage, setActivePage] = useState<number>(1);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const pageSize = 9;
  const boardListenersRef = React.useRef<Map<string, { board: () => void; squares: () => void; winners?: () => void; wins?: (() => void)[] }>>(new Map());
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: FirebaseUser | null) => {
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
    console.log("[MyBoardsPage] Fetching boards (open + in-progress/full) and checking participation for user:", userId);

    try {
      const ACTIVE_STATUSES: BoardStatus[] = [
        'open',
        'full',
        'IN_PROGRESS_Q1',
        'IN_PROGRESS_Q2',
        'IN_PROGRESS_Q3',
        'IN_PROGRESS_HALFTIME',
        'IN_PROGRESS_Q4',
        'IN_PROGRESS_OT',
      ];

      // Fetch open boards
      const openBoardsQuery = query(collection(db, "boards"), where("status", "==", "open"));
      // Fetch other active statuses via 'in' (limit 10 values supported)
      const nonOpenStatuses = ACTIVE_STATUSES.filter(s => s !== 'open');
      const otherActiveQuery = query(collection(db, 'boards'), where('status', 'in', nonOpenStatuses as string[]));

      const [openBoardSnapshots, otherActiveSnapshots] = await Promise.all([
        getDocs(openBoardsQuery),
        getDocs(otherActiveQuery),
      ]);

      const combinedDocs = new Map<string, any>();
      openBoardSnapshots.docs.forEach(d => combinedDocs.set(d.id, d));
      otherActiveSnapshots.docs.forEach(d => combinedDocs.set(d.id, d));

      console.log(`[MyBoardsPage] Found ${combinedDocs.size} total active/ongoing board documents.`);

      if (combinedDocs.size === 0) {
        console.log("[MyBoardsPage] No active or in-progress boards found in the database.");
        setActiveBoardsData([]);
        setIsLoading(false);
        return;
      }

      const userRelevantBoardsPromises = Array.from(combinedDocs.values()).map(async (boardDoc: any) => {
        const boardData = boardDoc.data();
        console.log(`[MyBoardsPage] Checking board ID: ${boardDoc.id}, Status: ${boardData.status}`);

        const userRef = doc(db, "users", userId);
        const squaresQueryRef = query(collection(db, "boards", boardDoc.id, "squares"), where("userID", "==", userRef)); 
        const userSquaresSnap = await getDocs(squaresQueryRef);

        if (userSquaresSnap.empty) {
          // Not a user board; ensure listeners are cleaned if any existed
          const existing = boardListenersRef.current.get(boardDoc.id);
          if (existing) {
            existing.board();
            existing.squares();
            boardListenersRef.current.delete(boardDoc.id);
          }
          return null; 
        }
        
        const userPickedSquaresData: BoardSquare[] = userSquaresSnap.docs.map((sqDoc: any) => {
            const data = sqDoc.data();
            const squareIndex = typeof data.index === 'number' ? data.index : -1; 
          const squareValue = typeof data.square === 'string' ? data.square : undefined;
            return { 
                index: squareIndex,
                isUserSquare: true, 
            square: squareValue,
            };
        });

        let gameData: DocumentData | null = null;
        let homeTeamData: TeamInfo | undefined = undefined;
        let awayTeamData: TeamInfo | undefined = undefined;

        if (boardData.gameID && typeof boardData.gameID.path === 'string') { 
          const gameDocSnap = await getDoc(doc(db, boardData.gameID.path));
          if (gameDocSnap.exists()) {
            gameData = gameDocSnap.data();
            if (gameData.home_team_id && typeof gameData.home_team_id.path === 'string') {
              const homeTeamSnap = await getDoc(doc(db, gameData.home_team_id.path));
              if (homeTeamSnap.exists()) {
                const htData = homeTeamSnap.data(); 
                homeTeamData = { name: htData.name || "N/A", logo: htData.logo || undefined, initials: htData.initials || "N/A" };
              }
            }
            if (gameData.away_team_id && typeof gameData.away_team_id.path === 'string') {
              const awayTeamSnap = await getDoc(doc(db, gameData.away_team_id.path));
              if (awayTeamSnap.exists()) {
                 const atData = awayTeamSnap.data(); 
                awayTeamData = { name: atData.name || "N/A", logo: atData.logo || undefined, initials: atData.initials || "N/A" };
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
          broadcast_provider: gameData?.broadcast_provider || undefined,
          sport: gameData?.sport || "N/A", 
          league: gameData?.leagueName || "N/A",
          userSquareSelectionCount: userPickedSquaresData.length,
          totalSquareCount: typeof boardData.totalSquareCount === 'number' ? boardData.totalSquareCount : 100, 
          userPickedSquares: userPickedSquaresData,
          selected_indexes_on_board: Array.isArray(boardData.selected_indexes) ? boardData.selected_indexes : [],
          home_axis_numbers: Array.isArray(boardData.home_numbers) ? boardData.home_numbers : [],
          away_axis_numbers: Array.isArray(boardData.away_numbers) ? boardData.away_numbers : [],
          winnings: typeof boardData.winnings === 'number' ? boardData.winnings : 0, 
          stake: typeof boardData.amount === 'number' ? boardData.amount : undefined, 
          q1_winning_index: typeof boardData.q1_winning_number === 'number' ? boardData.q1_winning_number : undefined,
          q2_winning_index: typeof boardData.q2_winning_number === 'number' ? boardData.q2_winning_number : undefined,
          q3_winning_index: typeof boardData.q3_winning_number === 'number' ? boardData.q3_winning_number : undefined,
          q4_winning_index: typeof boardData.q4_winning_number === 'number' ? boardData.q4_winning_number : undefined,
        };

        // Setup realtime listeners for this board if not already
        if (!boardListenersRef.current.has(boardDoc.id)) {
          const boardRef = doc(db, 'boards', boardDoc.id);
          const userRefForSquares = doc(db, 'users', userId);
          const squaresRef = query(collection(db, 'boards', boardDoc.id, 'squares'), where('userID', '==', userRefForSquares));

          const unsubBoard = onSnapshot(boardRef, (snap) => {
            if (!snap.exists()) return;
            const b = snap.data();
            setActiveBoardsData(prev => prev.map(ab => ab.id === boardDoc.id ? {
              ...ab,
              status: (b.status as BoardStatus) || ab.status,
              selected_indexes_on_board: Array.isArray(b.selected_indexes) ? b.selected_indexes : ab.selected_indexes_on_board,
              home_axis_numbers: Array.isArray(b.home_numbers) ? b.home_numbers : ab.home_axis_numbers,
              away_axis_numbers: Array.isArray(b.away_numbers) ? b.away_numbers : ab.away_axis_numbers,
              winnings: typeof b.winnings === 'number' ? b.winnings : ab.winnings,
            } : ab));
          });

          const unsubSquares = onSnapshot(squaresRef, (sqSnap) => {
            const picks: BoardSquare[] = [];
            let latestTs: number = 0;
            sqSnap.forEach((d) => {
              const data = d.data();
              picks.push({
                index: typeof data.index === 'number' ? data.index : -1,
                isUserSquare: true,
                square: typeof data.square === 'string' ? data.square : undefined,
              });
              const ts = data.created_time?.toDate ? data.created_time.toDate().getTime() : (data.updated_time?.toDate ? data.updated_time.toDate().getTime() : 0);
              if (ts > latestTs) latestTs = ts;
            });
            setActiveBoardsData(prev => prev.map(ab => ab.id === boardDoc.id ? { ...ab, userPickedSquares: picks, userSquareSelectionCount: picks.length, purchasedAt: latestTs ? new Date(latestTs).toISOString() : ab.purchasedAt } : ab));
          });

          // Winners subcollection listener (public summary of winning indexes)
          const winnersCollRef = collection(db, 'boards', boardDoc.id, 'winners');
          const unsubWinners = onSnapshot(winnersCollRef, (winSnap) => {
            const periodToIndex: Record<string, number | undefined> = {};
            const periodToSquare: Record<string, string | undefined> = {};
            winSnap.forEach((d) => {
              const pdata = d.data();
              const periodId = (d.id || '').toLowerCase();
              const wIdx = typeof pdata.winningIndex === 'number' ? pdata.winningIndex : undefined;
              const wSq = typeof pdata.winningSquare === 'string' ? pdata.winningSquare : undefined;
              if (wIdx !== undefined) {
                periodToIndex[periodId] = wIdx;
              }
              if (wSq) {
                periodToSquare[periodId] = wSq;
              }
            });
            setActiveBoardsData(prev => prev.map(ab => ab.id === boardDoc.id ? {
              ...ab,
              q1_winning_index: periodToIndex['q1'] !== undefined ? periodToIndex['q1'] : ab.q1_winning_index,
              q2_winning_index: periodToIndex['q2'] !== undefined ? periodToIndex['q2'] : ab.q2_winning_index,
              q3_winning_index: periodToIndex['q3'] !== undefined ? periodToIndex['q3'] : ab.q3_winning_index,
              // map final into q4/f slot for display
              q4_winning_index: periodToIndex['final'] !== undefined ? periodToIndex['final'] : ab.q4_winning_index,
              // also store squares if present
              // @ts-ignore augment
              q1_winning_square: periodToSquare['q1'] || (ab as any).q1_winning_square,
              // @ts-ignore
              q2_winning_square: periodToSquare['q2'] || (ab as any).q2_winning_square,
              // @ts-ignore
              q3_winning_square: periodToSquare['q3'] || (ab as any).q3_winning_square,
              // @ts-ignore final maps to q4
              q4_winning_square: periodToSquare['final'] || (ab as any).q4_winning_square,
            } : ab));
          });

          // User private wins (optional badge): listen to up to 4 docs
          const winsUnsubs: (() => void)[] = [];
          ['q1','q2','q3','final'].forEach((p) => {
            const winRef = doc(db, 'users', userId, 'wins', `${boardDoc.id}_${p}`);
            const unsub = onSnapshot(winRef, (snap) => {
              if (!snap.exists()) return;
              const labelMap: Record<string, 'q1_winning_index' | 'q2_winning_index' | 'q3_winning_index' | 'q4_winning_index'> = {
                q1: 'q1_winning_index',
                q2: 'q2_winning_index',
                q3: 'q3_winning_index',
                final: 'q4_winning_index',
              };
              // mark an auxiliary flag userWonX on the board object
              setActiveBoardsData(prev => prev.map(ab => ab.id === boardDoc.id ? {
                ...ab,
                // @ts-ignore add dynamic flag
                [`userWon_${p}`]: true,
              } : ab));
            });
            winsUnsubs.push(unsub);
          });

          boardListenersRef.current.set(boardDoc.id, { board: unsubBoard, squares: unsubSquares, winners: unsubWinners, wins: winsUnsubs });
        }

        return appBoardEntry;
      });

      const populatedUserBoards = (await Promise.all(userRelevantBoardsPromises)).filter((b: AppBoard | null): b is AppBoard => b !== null);
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
                  homeTeamData = { name: htData.name || "N/A", logo: htData.logo || undefined, initials: htData.initials || "N/A" };
                }
              }
              if (gameData.away_team_id && typeof gameData.away_team_id.path === 'string') {
                const awayTeamSnap = await getDoc(doc(db, gameData.away_team_id.path));
                if (awayTeamSnap.exists()) {
                   const atData = awayTeamSnap.data(); 
                  awayTeamData = { name: atData.name || "N/A", logo: atData.logo || undefined, initials: atData.initials || "N/A" };
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

  useEffect(() => {
    // Cleanup listeners on unmount
    return () => {
      boardListenersRef.current.forEach(({ board, squares, winners, wins }) => {
        try { board(); } catch {}
        try { squares(); } catch {}
        try { if (winners) winners(); } catch {}
        try { if (wins && wins.length) wins.forEach(u => u()); } catch {}
      });
      boardListenersRef.current.clear();
    };
  }, []);

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

  const statusBucket = (status: BoardStatus | string): 'open' | 'full' | 'in_progress' | 'final' | 'cancelled' | 'other' => {
    const s = String(status);
    if (s === 'open') return 'open';
    if (s === 'full') return 'full';
    if (s.startsWith('IN_PROGRESS')) return 'in_progress';
    if (s === 'CANCELLED') return 'cancelled';
    if (s.startsWith('FINAL')) return 'final';
    return 'other';
  };

  const filteredActiveBoards = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = activeBoardsData.filter((b) => {
      const sportOk = sportFilter === 'all' || (b.sport || '').toLowerCase() === sportFilter.toLowerCase();
      const statusOk = statusFilter === 'all' || statusBucket(b.status) === statusFilter;
      const amountOk = amountFilter === 'all' || (typeof b.stake === 'number' && b.stake === Number(amountFilter));
      // Active has no search; ignore term
      return sportOk && statusOk && amountOk;
    });
    const multiplier = sortDirActive === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      if (activeSort === 'purchased') {
        const ta = a.purchasedAt ? new Date(a.purchasedAt).getTime() : 0;
        const tb = b.purchasedAt ? new Date(b.purchasedAt).getTime() : 0;
        return (ta - tb) * multiplier;
      }
      if (activeSort === 'entry_fee') {
        const ta = typeof a.stake === 'number' ? a.stake : Number.MAX_SAFE_INTEGER;
        const tb = typeof b.stake === 'number' ? b.stake : Number.MAX_SAFE_INTEGER;
        return (ta - tb) * multiplier;
      }
      const ta = new Date(a.gameDateTime).getTime();
      const tb = new Date(b.gameDateTime).getTime();
      return (ta - tb) * multiplier;
    });
    return sorted;
  }, [activeBoardsData, sportFilter, statusFilter, amountFilter, activeSort, sortDirActive]);

  const filteredHistoricalBoards = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const base = historicalBoardsData.filter((b) => {
      const sportOk = sportFilter === 'all' || (b.sport || '').toLowerCase() === sportFilter.toLowerCase();
      const statusOk = statusFilter === 'all' || statusBucket(b.status) === statusFilter;
      const amountOk = amountFilter === 'all' || (typeof b.stake === 'number' && b.stake === Number(amountFilter));
      const teamText = `${b.homeTeam?.name || ''} ${b.awayTeam?.name || ''}`.toLowerCase();
      const searchOk = term === '' || teamText.includes(term);
      return sportOk && statusOk && amountOk && searchOk;
    });
    const multiplier = sortDirHistory === 'asc' ? 1 : -1;
    return [...base].sort((a, b) => {
      if (historySort === 'date') {
        const ta = new Date(a.gameDateTime).getTime();
        const tb = new Date(b.gameDateTime).getTime();
        return (ta - tb) * multiplier;
      }
      if (historySort === 'entry_fee') {
        const ta = typeof a.stake === 'number' ? a.stake : Number.MAX_SAFE_INTEGER;
        const tb = typeof b.stake === 'number' ? b.stake : Number.MAX_SAFE_INTEGER;
        return (ta - tb) * multiplier;
      }
      const ta = a.winnings || 0;
      const tb = b.winnings || 0;
      return (ta - tb) * multiplier;
    });
  }, [historicalBoardsData, sportFilter, statusFilter, amountFilter, debouncedSearch, historySort, sortDirHistory]);

  // Debounce History search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Reset pagination on filter/sort/search changes
  useEffect(() => { setActivePage(1); }, [sportFilter, statusFilter, amountFilter, activeSort]);
  useEffect(() => { setHistoryPage(1); }, [sportFilter, statusFilter, amountFilter, historySort, debouncedSearch]);

  const FiltersRow: React.FC<{ kind: 'active' | 'history' }> = ({ kind }) => (
    <div className="mb-4 hidden md:flex flex-wrap gap-3 items-center">
      <Select value={sportFilter} onValueChange={(v) => setSportFilter(v)}>
        <SelectTrigger className="w-[180px] h-8 glass bg-white/5 border-white/15 text-slate-100 hover:bg-white/10">
          <SelectValue placeholder="Sport" />
        </SelectTrigger>
        <SelectContent className="glass bg-white/8 backdrop-blur-md border-white/15 text-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <SelectItem value="all">All Sports</SelectItem>
          <SelectItem value="NFL">NFL</SelectItem>
          <SelectItem value="NBA">NBA</SelectItem>
          <SelectItem value="WNBA">WNBA</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
        <SelectTrigger className="w-[200px] h-8 glass bg-white/5 border-white/15 text-slate-100 hover:bg-white/10">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="glass bg-white/8 backdrop-blur-md border-white/15 text-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <SelectItem value="all">All Statuses</SelectItem>
          {kind === 'active' ? (
            <>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </>
          ) : (
            <>
              <SelectItem value="final">Processed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
      <Select value={amountFilter} onValueChange={(v) => setAmountFilter(v)}>
        <SelectTrigger className="w-[140px] h-8 glass bg-white/5 border-white/15 text-slate-100 hover:bg-white/10">
          <SelectValue placeholder="Entries" />
        </SelectTrigger>
        <SelectContent className="glass bg-white/8 backdrop-blur-md border-white/15 text-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <SelectItem value="all">All Entries</SelectItem>
          <SelectItem value="0">Sweepstakes ($0)</SelectItem>
          <SelectItem value="1">$1</SelectItem>
          <SelectItem value="5">$5</SelectItem>
          <SelectItem value="10">$10</SelectItem>
          <SelectItem value="20">$20</SelectItem>
        </SelectContent>
      </Select>
      {kind === 'active' ? (
        <div className="flex items-center gap-2">
        <Select value={activeSort} onValueChange={(v: any) => setActiveSort(v)}>
          <SelectTrigger className="w-[220px] h-8 glass bg-white/5 border-white/15 text-slate-100 hover:bg-white/10">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="glass bg-white/8 backdrop-blur-md border-white/15 text-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <SelectItem value="game_date">Sort: Game Date</SelectItem>
            <SelectItem value="purchased">Sort: Purchased</SelectItem>
            <SelectItem value="entry_fee">Sort: Entry Fee</SelectItem>
          </SelectContent>
        </Select>
        <Button size="icon" variant="outline" className="h-8 w-8 glass bg-white/5 border-white/15 text-slate-100"
          onClick={() => setSortDirActive(d => d === 'asc' ? 'desc' : 'asc')}
          aria-label="Toggle sort direction">
          {sortDirActive === 'asc' ? '↑' : '↓'}
        </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
        <Select value={historySort} onValueChange={(v: any) => setHistorySort(v)}>
          <SelectTrigger className="w-[180px] h-8 glass bg-white/5 border-white/15 text-slate-100 hover:bg-white/10">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="glass bg-white/8 backdrop-blur-md border-white/15 text-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <SelectItem value="date">Sort: Date</SelectItem>
            <SelectItem value="entry_fee">Sort: Entry Fee</SelectItem>
            <SelectItem value="winnings">Sort: Winnings</SelectItem>
          </SelectContent>
        </Select>
        <Button size="icon" variant="outline" className="h-8 w-8 glass bg-white/5 border-white/15 text-slate-100"
          onClick={() => setSortDirHistory(d => d === 'asc' ? 'desc' : 'asc')}
          aria-label="Toggle sort direction">
          {sortDirHistory === 'asc' ? '↑' : '↓'}
        </Button>
        </div>
      )}
      {kind === 'history' && (
        <div className="ml-auto w-56">
          <Input placeholder="Search teams" className="h-8 glass bg-white/5 border-white/15 text-slate-100 placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      )}
      <Button variant="outline" size="sm" className="ml-auto md:ml-0 glass bg-white/5 border-white/15 text-slate-100 hover:bg-white/10" onClick={() => { setSportFilter('all'); setStatusFilter('all'); setAmountFilter('all'); setHistorySort('date'); setSortDirHistory('asc'); setActiveSort('game_date'); setSortDirActive('asc'); setSearchTerm(''); }}>Reset</Button>
    </div>
  );

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
      const totalPages = Math.max(1, Math.ceil(boards.length / pageSize));
      const page = Math.min(historyPage, totalPages);
      const start = (page - 1) * pageSize;
      const slice = boards.slice(start, start + pageSize);
      return (
        <>
          <FiltersRow kind="history" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-1 justify-center">
            {slice.map(board => (
                <SquareCard key={board.id} board={board} onClick={handleBoardCardClick} />
              ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page===1} onClick={() => setHistoryPage(Math.max(1, page-1))}>Prev</Button>
            <span className="text-sm text-slate-400">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page===totalPages} onClick={() => setHistoryPage(Math.min(totalPages, page+1))}>Next</Button>
          </div>
        </>
      );
    }

    const totalPages = Math.max(1, Math.ceil(boards.length / pageSize));
    const page = Math.min(activePage, totalPages);
    const start = (page - 1) * pageSize;
    const slice = boards.slice(start, start + pageSize);
    return (
      <>
        <FiltersRow kind="active" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-1 justify-center">
          {slice.map((board) => (
          <SquareCard key={board.id} board={board} onClick={handleBoardCardClick} />
        ))}
          </div>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page===1} onClick={() => setActivePage(Math.max(1, page-1))}>Prev</Button>
          <span className="text-sm text-slate-400">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page===totalPages} onClick={() => setActivePage(Math.min(totalPages, page+1))}>Next</Button>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-primary pb-16"> {/* Added pb-16 for BottomNav clearance */}
      <main className="flex-grow container mx-auto py-2 px-4">
        <header className="mb-8 flex items-center gap-3">
          <Image src="/brandkit/logos/sp-logo-app-icon.png" alt="SquarePicks" width={28} height={28} className="rounded" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">My Boards</h1>
        </header>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="inline-flex gap-2">
            <TabsTrigger 
              value="active"
              className="relative overflow-hidden px-3 py-1.5 rounded-md text-text-secondary transition-colors hover:text-text-primary hover:bg-black/10 data-[state=active]:text-text-primary data-[state=active]:bg-transparent data-[state=active]:before:content-[''] data-[state=active]:before:absolute data-[state=active]:before:inset-0 data-[state=active]:before:rounded-md data-[state=active]:before:pointer-events-none data-[state=active]:before:-z-10 data-[state=active]:before:bg-[radial-gradient(ellipse_at_center,rgba(20,28,48,0.6)_0%,rgba(20,28,48,0.35)_65%,rgba(20,28,48,0)_100%)]"
            >
              Active
            </TabsTrigger>
            <span aria-hidden className="mx-0.5 h-5 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <TabsTrigger 
              value="history"
              className="relative overflow-hidden px-3 py-1.5 rounded-md text-text-secondary transition-colors hover:text-text-primary hover:bg-black/10 data-[state=active]:text-text-primary data-[state=active]:bg-transparent data-[state=active]:before:content-[''] data-[state=active]:before:absolute data-[state=active]:before:inset-0 data-[state=active]:before:rounded-md data-[state=active]:before:pointer-events-none data-[state=active]:before:-z-10 data-[state=active]:before:bg-[radial-gradient(ellipse_at_center,rgba(20,28,48,0.6)_0%,rgba(20,28,48,0.35)_65%,rgba(20,28,48,0)_100%)]"
            >
              History
            </TabsTrigger>
          </TabsList>
            {/* Mobile Filter Button */}
            <div className="md:hidden ml-auto">
              <Button variant="outline" size="sm" className="glass bg-white/5 border-white/15 text-slate-100 hover:bg-white/10"
                onClick={() => setIsFilterOpen(true)} aria-label="Open filters">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
          <div className="mt-1 mb-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <TabsContent value="active" className="mt-0">
            {renderBoardGrid(filteredActiveBoards, 'active')}
          </TabsContent>
          <TabsContent value="history" className="mt-0">
            {renderBoardGrid(filteredHistoricalBoards, 'history')}
          </TabsContent>
        </Tabs>
        {/* Mobile Filters Drawer */}
        <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen} direction="bottom">
          <DrawerContent className="md:hidden bg-background/80 backdrop-blur-md border-white/15 text-text-primary">
            <div className="mx-auto mt-1 h-1.5 w-14 rounded-full bg-white/30" aria-hidden="true" />
            <DrawerHeader className="pt-3 pb-1">
              <DrawerTitle className="text-text-primary">Filters</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <div className="text-sm text-text-secondary">Sport</div>
                  <Select value={sportFilter} onValueChange={(v) => setSportFilter(v)}>
                    <SelectTrigger className="h-10 glass bg-white/5 border-white/15 text-text-primary hover:bg-white/10">
                      <SelectValue placeholder="Sport" />
                    </SelectTrigger>
                    <SelectContent className="glass bg-white/8 backdrop-blur-md border-white/15 text-text-primary z-[80]">
                      <SelectItem value="all">All Sports</SelectItem>
                      <SelectItem value="NFL">NFL</SelectItem>
                      <SelectItem value="NBA">NBA</SelectItem>
                      <SelectItem value="WNBA">WNBA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-text-secondary">Status</div>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                    <SelectTrigger className="h-10 glass bg-white/5 border-white/15 text-text-primary hover:bg-white/10">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="glass bg-white/8 backdrop-blur-md border-white/15 text-text-primary z-[80]">
                      <SelectItem value="all">All Statuses</SelectItem>
                      {activeTab === 'active' ? (
                        <>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="final">Processed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-text-secondary">Entries</div>
                  <Select value={amountFilter} onValueChange={(v) => setAmountFilter(v)}>
                    <SelectTrigger className="h-10 glass bg-white/5 border-white/15 text-text-primary hover:bg-white/10">
                      <SelectValue placeholder="Entries" />
                    </SelectTrigger>
                    <SelectContent className="glass bg-white/8 backdrop-blur-md border-white/15 text-text-primary z-[80]">
                      <SelectItem value="all">All Entries</SelectItem>
                      <SelectItem value="0">Sweepstakes ($0)</SelectItem>
                      <SelectItem value="1">$1</SelectItem>
                      <SelectItem value="5">$5</SelectItem>
                      <SelectItem value="10">$10</SelectItem>
                      <SelectItem value="20">$20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {activeTab === 'active' ? (
                  <div className="space-y-2">
                    <div className="text-sm text-text-secondary">Sort</div>
                    <div className="flex items-center gap-2">
                      <Select value={activeSort} onValueChange={(v: any) => setActiveSort(v)}>
                        <SelectTrigger className="flex-1 h-10 glass bg-white/5 border-white/15 text-text-primary hover:bg-white/10">
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent className="glass bg-white/8 backdrop-blur-md border-white/15 text-text-primary z-[80]">
                          <SelectItem value="game_date">Sort: Game Date</SelectItem>
                          <SelectItem value="purchased">Sort: Purchased</SelectItem>
                          <SelectItem value="entry_fee">Sort: Entry Fee</SelectItem>
                        </SelectContent>
                      </Select>
                      <ToggleGroup type="single" value={sortDirActive} onValueChange={(v) => v && setSortDirActive(v as 'asc' | 'desc')}>
                        <ToggleGroupItem value="asc" aria-label="Ascending" className="h-10">↑</ToggleGroupItem>
                        <ToggleGroupItem value="desc" aria-label="Descending" className="h-10">↓</ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="text-sm text-text-secondary">Sort</div>
                      <div className="flex items-center gap-2">
                        <Select value={historySort} onValueChange={(v: any) => setHistorySort(v)}>
                          <SelectTrigger className="flex-1 h-10 glass bg-white/5 border-white/15 text-text-primary hover:bg-white/10">
                            <SelectValue placeholder="Sort" />
                          </SelectTrigger>
                          <SelectContent className="glass bg-white/8 backdrop-blur-md border-white/15 text-text-primary z-[80]">
                            <SelectItem value="date">Sort: Date</SelectItem>
                            <SelectItem value="entry_fee">Sort: Entry Fee</SelectItem>
                            <SelectItem value="winnings">Sort: Winnings</SelectItem>
                          </SelectContent>
                        </Select>
                        <ToggleGroup type="single" value={sortDirHistory} onValueChange={(v) => v && setSortDirHistory(v as 'asc' | 'desc')}>
                          <ToggleGroupItem value="asc" aria-label="Ascending" className="h-10">↑</ToggleGroupItem>
                          <ToggleGroupItem value="desc" aria-label="Descending" className="h-10">↓</ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-text-secondary">Search teams</div>
                      <Input placeholder="Search teams" className="h-10 glass bg-white/5 border-white/15 text-text-primary placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            </div>
            <DrawerFooter className="border-t border-white/10">
              <div className="flex items-center gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setSportFilter('all'); setStatusFilter('all'); setAmountFilter('all'); setHistorySort('date'); setSortDirHistory('asc'); setActiveSort('game_date'); setSortDirActive('asc'); setSearchTerm(''); }}>Reset</Button>
                <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>Apply</Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
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