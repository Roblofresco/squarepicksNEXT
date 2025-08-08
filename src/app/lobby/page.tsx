'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { db, auth } from '@/lib/firebase'; // Import auth here
import { User as FirebaseUser } from 'firebase/auth'; // Renamed to avoid conflict
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SportSelector from '@/components/lobby/SportSelector';
import GamesList from '@/components/lobby/GamesList';
import BoardsList from '@/components/lobby/BoardsList';
import BottomNav from '@/components/lobby/BottomNav';
import InAppHeader from '@/components/InAppHeader';
import { Sport, Game as GameType, Board as BoardType, TeamInfo, SquareEntry } from '@/types/lobby';
import { initialSportsData, SWEEPSTAKES_SPORT_ID, FREE_BOARD_ENTRY_FEE, BOARD_STATUS_OPEN, DEFAULT_BOARD_ENTRY_FEE } from '@/config/lobbyConfig';
import SweepstakesScoreboard from '@/components/lobby/sweepstakes/SweepstakesScoreboard';
import StarfieldBackground from '@/components/effects/StarfieldBackground';
import SweepstakesBoardCard from '@/components/lobby/sweepstakes/SweepstakesBoardCard';
import {
  collection, query, where, onSnapshot, doc, getDoc, getDocs,
  Timestamp, DocumentReference, DocumentData, documentId, orderBy, limit,
  // FieldPath // Not used in this version
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { useWallet } from '@/hooks/useWallet';
import { motion, AnimatePresence } from 'framer-motion';

// Define EntryInteractionState locally
interface EntryInteractionState {
  boardId: string | null;
  stage: 'idle' | 'selecting' | 'confirming'; // Removed 'completed' stage
  selectedNumber: number | string | null;
}

// Helper to fetch multiple team documents by their DocumentReferences
// Adjusted to take DocumentReferences and return a map with TeamInfo
const fetchMultipleTeams = async (teamRefs: DocumentReference[]): Promise<Record<string, TeamInfo>> => {
  const uniqueTeamRefs = teamRefs.filter((ref, index, self) => 
    ref && self.findIndex(r => r && r.id === ref.id) === index
  );
  if (uniqueTeamRefs.length === 0) return {};
  
  const teamsMap: Record<string, TeamInfo> = {};
  // Firestore getDocs can take up to 30 DocumentReferences in a single call via `in` query on documentId()
  // However, for simplicity with references, we'll fetch them one by one or in smaller batches if performance becomes an issue.
  // For now, getDoc in a loop (can be parallelized with Promise.all)
  const teamPromises = uniqueTeamRefs.map(async (teamRef) => {
    try {
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists()) {
        const data = teamSnap.data();
        teamsMap[teamSnap.id] = {
          id: teamSnap.id,
          name: data.name || 'N/A',
          fullName: data.full_name || data.name || 'N/A',
          initials: data.initials || 'N/A',
          record: data.record || '0-0',
          logo: data.logo || undefined,
          color: data.color || undefined,
          seccolor: data.seccolor || undefined,
        };
      }
    } catch (error) {
      console.error(`Failed to fetch team ${teamRef.id}`, error);
    }
  });
  await Promise.all(teamPromises);
  return teamsMap;
};

export default function LobbyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-background-primary text-white">Loading…</div>}>
      <LobbyContent />
    </Suspense>
  );
}

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const currentUserId = user?.uid;

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isWalletSetupDialogOpen, setIsWalletSetupDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [requiredDepositAmount, setRequiredDepositAmount] = useState(0);
  const [targetBoardId, setTargetBoardId] = useState<string | null>(null); 
  const [setupDialogContent, setSetupDialogContent] = useState({
    title: 'Wallet Setup Required',
    description: 'You need to set up your wallet before you can deposit funds or enter contests.',
    buttonText: 'Go to Wallet Setup',
  });

  const [selectedSport, setSelectedSport] = useState<string>(() => {
    const sportFromQuery = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('sport') : null;
    const isValidSport = initialSportsData.some(s => s.id === sportFromQuery);
    return isValidSport && typeof sportFromQuery === 'string' ? sportFromQuery : (initialSportsData[0]?.id || SWEEPSTAKES_SPORT_ID);
  });

  const [games, setGames] = useState<GameType[]>([]);
  const [teams, setTeams] = useState<Record<string, TeamInfo>>({}); // Stores all fetched teams by ID
  const [isLoadingGamesAndTeams, setIsLoadingGamesAndTeams] = useState<boolean>(true);
  const [gamesAndTeamsError, setGamesAndTeamsError] = useState<string | null>(null);

  const [sportSelectorView, setSportSelectorView] = useState<'sweepstakes' | 'allRegularSports'>('sweepstakes'); // New state

  const [sweepstakesBoard, setSweepstakesBoard] = useState<BoardType | null>(null);
  const [sweepstakesGame, setSweepstakesGame] = useState<GameType | null>(null);
  const [sweepstakesTeams, setSweepstakesTeams] = useState<Record<string, TeamInfo>>({});
  const [isLoadingSweepstakesData, setIsLoadingSweepstakesData] = useState<boolean>(true);
  const [sweepstakesDataError, setSweepstakesDataError] = useState<string | null>(null);
  const [sweepstakesStartTime, setSweepstakesStartTime] = useState<Date | null>(null);
  
  const [entryInteraction, setEntryInteraction] = useState<EntryInteractionState>({ 
    boardId: null, stage: 'idle', selectedNumber: null
  });

  // Use useWallet for auth and wallet status
  const { userId, emailVerified, isLoading: isWalletLoading, balance, hasWallet } = useWallet();

  // Active Firestore listeners cleanup refs
  const unsubscribeGamesListenerRef = useRef<(() => void) | null>(null);
  const unsubscribeSweepstakesListenerRef = useRef<(() => void) | null>(null); // Single listener for combined sweepstakes board/game

  // Effect to synchronize LobbyPage's local user state with Firebase auth state
  useEffect(() => {
    if (userId) {
      setUser(auth.currentUser); // auth should be imported from '@/lib/firebase'
    } else {
      setUser(null);
    }
  }, [userId]); // Re-run when userId from useWallet changes

  useEffect(() => {
    const sportFromQuery = searchParams.get('sport');
    const isValidSport = initialSportsData.some(s => s.id === sportFromQuery);
    const defaultInitialSport = initialSportsData[0]?.id || SWEEPSTAKES_SPORT_ID;
    const targetSportFromUrl = isValidSport && typeof sportFromQuery === 'string' ? sportFromQuery : defaultInitialSport;
    if (targetSportFromUrl !== selectedSport) {
      setSelectedSport(targetSportFromUrl);
    }
  }, [searchParams, selectedSport]);

  useEffect(() => {
    if (selectedSport === SWEEPSTAKES_SPORT_ID) {
      setSportSelectorView('sweepstakes');
    } else {
      const isKnownSport = initialSportsData.some(s => s.id === selectedSport && s.id !== SWEEPSTAKES_SPORT_ID);
      if (isKnownSport) {
        setSportSelectorView('allRegularSports');
      } else {
        // Default to sweepstakes if sport is unknown or becomes invalid
        // This could happen if URL is manually changed to an invalid sport
        setSportSelectorView('sweepstakes');
        // Optionally, reset selectedSport to a valid default if current is invalid
        // if (!initialSportsData.some(s => s.id === selectedSport)) {
        //   setSelectedSport(initialSportsData[0]?.id || SWEEPSTAKES_SPORT_ID);
        // }
      }
    }
  }, [selectedSport]);

  // Main Data Fetching Effect (Consolidated for Sweepstakes)
  useEffect(() => {
    console.log(`[LobbyPage] Main data fetch effect triggered for sport: ${selectedSport}`);
    if (unsubscribeGamesListenerRef.current) {
      console.log("[LobbyPage] Cleaning up previous games listener.");
      unsubscribeGamesListenerRef.current();
      unsubscribeGamesListenerRef.current = null;
    }
    if (unsubscribeSweepstakesListenerRef.current) {
      console.log("[LobbyPage] Cleaning up previous sweepstakes (board/game) listener.");
      unsubscribeSweepstakesListenerRef.current();
      unsubscribeSweepstakesListenerRef.current = null;
    }

    setGames([]); setTeams({});
    setSweepstakesBoard(null); setSweepstakesGame(null); setSweepstakesTeams({}); setSweepstakesStartTime(null);
    setGamesAndTeamsError(null); setSweepstakesDataError(null);

    if (selectedSport === SWEEPSTAKES_SPORT_ID) {
      console.log("[LobbyPage] Fetching data for SWEEPSTAKES.");
      setIsLoadingSweepstakesData(true);
      setIsLoadingGamesAndTeams(false);

      const sweepstakesBoardQuery = query(
        collection(db, 'boards'),
        where("amount", "==", FREE_BOARD_ENTRY_FEE),
        where("status", "==", BOARD_STATUS_OPEN),
        limit(1)
      );

      unsubscribeSweepstakesListenerRef.current = onSnapshot(sweepstakesBoardQuery, async (boardSnapshot) => {
        console.log("[LobbyPage] SWEEPSTAKES BOARD snapshot. Empty:", boardSnapshot.empty);
        if (boardSnapshot.empty) {
          console.log("[LobbyPage] No active sweepstakes board found.");
          setSweepstakesBoard(null);
          setSweepstakesGame(null);
          setSweepstakesTeams({});
          setSweepstakesStartTime(null);
          setSweepstakesDataError("No active sweepstakes board available.");
          setIsLoadingSweepstakesData(false);
          return;
        }
        
        const boardDoc = boardSnapshot.docs[0];
        const boardDataFirestore = boardDoc.data();
        let sweepstakesIdString: string | undefined = undefined;
        const firestoreSweepstakesID = boardDataFirestore.sweepstakesID;
        if (firestoreSweepstakesID) {
            if (typeof firestoreSweepstakesID === 'string') {
                if (firestoreSweepstakesID.includes('/')) {
                    const parts = firestoreSweepstakesID.split('/');
                    sweepstakesIdString = parts[parts.length - 1];
                } else {
                    sweepstakesIdString = firestoreSweepstakesID;
                }
            } else if (firestoreSweepstakesID instanceof DocumentReference) {
                sweepstakesIdString = firestoreSweepstakesID.id;
            } else if (typeof firestoreSweepstakesID === 'object' && firestoreSweepstakesID.path && typeof firestoreSweepstakesID.path === 'string') {
                const parts = firestoreSweepstakesID.path.split('/');
                sweepstakesIdString = parts[parts.length - 1];
            }
        }

        const typedBoardData = {
          id: boardDoc.id,
          gameID: boardDataFirestore.gameID as DocumentReference,
          entryFee: boardDataFirestore.amount !== undefined ? boardDataFirestore.amount : DEFAULT_BOARD_ENTRY_FEE,
          amount: boardDataFirestore.amount,
          status: boardDataFirestore.status,
          selected_indexes: boardDataFirestore.selected_indexes || [],
          sweepstakes_select: boardDataFirestore.sweepstakes_select,
          isFreeEntry: boardDataFirestore.amount === 0 || boardDataFirestore.sweepstakes_select === true,
          sweepstakesID: sweepstakesIdString,
        } as BoardType;
        setSweepstakesBoard(typedBoardData);
        console.log("[LobbyPage] Sweepstakes board data set:", typedBoardData);

        if (typedBoardData.gameID && typedBoardData.gameID instanceof DocumentReference) {
          console.log("[LobbyPage] Sweepstakes board has gameID. Fetching game:", typedBoardData.gameID.id);
          try {
            const gameSnap = await getDoc(typedBoardData.gameID);
              if (gameSnap.exists()) {
              const gameDataFirestore = gameSnap.data();
              const gameTeamRefs: DocumentReference[] = [];
              if (gameDataFirestore.away_team_id instanceof DocumentReference) gameTeamRefs.push(gameDataFirestore.away_team_id);
              if (gameDataFirestore.home_team_id instanceof DocumentReference) gameTeamRefs.push(gameDataFirestore.home_team_id);
              
              const fetchedTeams = await fetchMultipleTeams(gameTeamRefs);
              setSweepstakesTeams(fetchedTeams);

              const typedGameData = {
                id: gameSnap.id, ...gameDataFirestore,
                teamA: gameDataFirestore.away_team_id instanceof DocumentReference ? fetchedTeams[gameDataFirestore.away_team_id.id] : undefined,
                teamB: gameDataFirestore.home_team_id instanceof DocumentReference ? fetchedTeams[gameDataFirestore.home_team_id.id] : undefined,
                start_time: gameDataFirestore.start_time as Timestamp,
                away_team_id: gameDataFirestore.away_team_id as DocumentReference,
                home_team_id: gameDataFirestore.home_team_id as DocumentReference,
                away_score: gameDataFirestore.away_team_score, home_score: gameDataFirestore.home_team_score,
                is_live: gameDataFirestore.is_live || false,
                is_over: gameDataFirestore.is_over || false,
                quarter: gameDataFirestore.quarter || '',
                sport: gameDataFirestore.sport || SWEEPSTAKES_SPORT_ID,
                status: gameDataFirestore.status || 'scheduled',
              } as GameType;
              setSweepstakesGame(typedGameData);
              setSweepstakesStartTime(typedGameData.start_time.toDate());
              console.log("[LobbyPage] Sweepstakes game data set:", typedGameData);
              setSweepstakesDataError(null);
                } else {
              console.warn("[LobbyPage] Sweepstakes game document not found for ID:", typedBoardData.gameID.id);
              setSweepstakesGame(null);
              setSweepstakesTeams({});
              setSweepstakesStartTime(null);
              setSweepstakesDataError(`Game data not found for sweepstakes board ${typedBoardData.id}.`);
            }
          } catch (gameError) {
            console.error("[LobbyPage] Error fetching sweepstakes game:", gameError);
            setSweepstakesGame(null);
            setSweepstakesTeams({});
            setSweepstakesStartTime(null);
            setSweepstakesDataError("Error fetching game data for sweepstakes.");
          } finally {
            setIsLoadingSweepstakesData(false);
          }
        } else {
          console.warn("[LobbyPage] Sweepstakes board has no valid gameID.");
          setSweepstakesGame(null);
          setSweepstakesTeams({});
          setSweepstakesStartTime(null);
            setIsLoadingSweepstakesData(false);
        }
      }, (error) => {
        console.error("[LobbyPage] Error fetching sweepstakes board:", error);
        setSweepstakesBoard(null);
        setSweepstakesGame(null);
        setSweepstakesTeams({});
        setSweepstakesStartTime(null);
        setSweepstakesDataError("Failed to load sweepstakes data. Please try again.");
        setIsLoadingSweepstakesData(false);
      });
    } else { // Regular Sport
      console.log(`[LobbyPage] Fetching data for REGULAR SPORT: ${selectedSport}.`);
      setIsLoadingGamesAndTeams(true);
      setIsLoadingSweepstakesData(false); // Not loading sweepstakes data
      const gamesQuery = query(
        collection(db, 'games'),
        where("sport", "==", selectedSport.toUpperCase()),
        where("is_over", "==", false),
        orderBy("start_time")
      );
      unsubscribeGamesListenerRef.current = onSnapshot(gamesQuery, async (gamesSnapshot) => {
        console.log(`[LobbyPage] REGULAR GAMES snapshot received for ${selectedSport}. Game count: ${gamesSnapshot.size}`);
        const fetchedGamesRaw: DocumentData[] = [];
        const teamRefsToFetch: DocumentReference[] = [];
        
        gamesSnapshot.forEach(docSnap => {
          const gameData = docSnap.data();
          fetchedGamesRaw.push({ id: docSnap.id, ...gameData });
          if (gameData.away_team_id instanceof DocumentReference) teamRefsToFetch.push(gameData.away_team_id);
          if (gameData.home_team_id instanceof DocumentReference) teamRefsToFetch.push(gameData.home_team_id);
        });

        console.log(`[LobbyPage] Fetching ${teamRefsToFetch.length} teams for ${gamesSnapshot.size} games.`);
        const fetchedTeamsMap = await fetchMultipleTeams(teamRefsToFetch);
        setTeams(fetchedTeamsMap);

        const enrichedGames = fetchedGamesRaw.map(gr => ({
          ...gr,
          teamA: gr.away_team_id instanceof DocumentReference ? fetchedTeamsMap[gr.away_team_id.id] : undefined,
          teamB: gr.home_team_id instanceof DocumentReference ? fetchedTeamsMap[gr.home_team_id.id] : undefined,
          start_time: gr.start_time as Timestamp,
          away_team_id: gr.away_team_id as DocumentReference,
          home_team_id: gr.home_team_id as DocumentReference,
          away_score: gr.away_team_score,
          home_score: gr.home_team_score,
          period: gr.quarter,
        })) as GameType[];
        
        setGames(enrichedGames);
        console.log(`[LobbyPage] Finished processing ${enrichedGames.length} games for ${selectedSport}.`);
        setIsLoadingGamesAndTeams(false);
      }, (error) => {
        console.error(`[LobbyPage] REGULAR GAMES listener error for ${selectedSport}:`, error);
        setGamesAndTeamsError(`Failed to load games for ${selectedSport}.`);
        setIsLoadingGamesAndTeams(false);
      });
    }
    return () => {
      if (unsubscribeGamesListenerRef.current) unsubscribeGamesListenerRef.current();
      if (unsubscribeSweepstakesListenerRef.current) unsubscribeSweepstakesListenerRef.current();
    };
  }, [selectedSport]);

  // Effect to redirect user based on auth status
  useEffect(() => {
    console.log("[LobbyPage] Redirection check. isWalletLoading:", isWalletLoading, "userId:", userId, "emailVerified:", emailVerified, "selectedSport:", selectedSport);
    if (!isWalletLoading) {
      if (userId && !emailVerified) router.push('/verify-email');
      else if (!userId && selectedSport !== SWEEPSTAKES_SPORT_ID) router.push('/login');
    }
  }, [userId, emailVerified, isWalletLoading, router, selectedSport]);

  const handleSelectSport = useCallback((sportId: string) => {
    if (selectedSport === sportId) {
      if (sportId === SWEEPSTAKES_SPORT_ID) setSportSelectorView('sweepstakes');
      else setSportSelectorView('allRegularSports');
      return;
    }
    setSelectedSport(sportId);
    if (sportId === SWEEPSTAKES_SPORT_ID) setSportSelectorView('sweepstakes');
    else setSportSelectorView('allRegularSports');
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("sport", sportId);
    router.push(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [router, pathname, searchParams, selectedSport]);

  const openWalletDialog = useCallback((type: 'setup' | 'deposit' | 'sweepstakes', optionsOrReqAmount: { reqAmount?: number; boardIdToEnter?: string | null; isFree?: boolean } | number = {}, boardIdToEnterArg?: string | null) => {
    let options: { reqAmount?: number; boardIdToEnter?: string | null; isFree?: boolean } = {};
  
    if (typeof optionsOrReqAmount === 'number') {
      options = { reqAmount: optionsOrReqAmount, boardIdToEnter: boardIdToEnterArg };
    } else {
      options = optionsOrReqAmount;
    }

    const { reqAmount = 0, boardIdToEnter = null, isFree = false } = options;
    setTargetBoardId(boardIdToEnter);
  
    if (type === 'setup') {
      setSetupDialogContent({
        title: 'Wallet Setup Required',
        description: 'You need to set up your wallet before you can deposit funds or enter contests.',
        buttonText: 'Go to Wallet Setup',
      });
      setIsWalletSetupDialogOpen(true);
    } else if (type === 'sweepstakes') {
      setSetupDialogContent({
        title: 'Sweepstakes Entry',
        description: 'To enter the sweepstakes, please verify your eligibility and provide contact information.',
        buttonText: 'Verify Now',
      });
      setIsWalletSetupDialogOpen(true);
    } else {
      setRequiredDepositAmount(reqAmount);
      setIsDepositDialogOpen(true);
    }
  }, []);

  const handleProtectedAction = useCallback(() => setIsLoginModalOpen(true), []);

  const handleBoardAction = useCallback(async (action: string, boardId: string, value?: any) => {
    if (['START_ENTRY', 'SET_NUMBER', 'REQUEST_CONFIRM', 'CANCEL_CONFIRM'].includes(action) && !userId) {
        setIsLoginModalOpen(true); 
        return;
    }

    switch (action) {
        case 'START_ENTRY':
            setEntryInteraction({ boardId, stage: 'selecting', selectedNumber: null });
            break;
        case 'SET_NUMBER':
            setEntryInteraction(prev => ({
                 ...prev, 
                 boardId: boardId,
                 selectedNumber: value,
                 stage: 'selecting'
            }));
            break;
        case 'REQUEST_CONFIRM':
            if (entryInteraction.selectedNumber === null || String(entryInteraction.selectedNumber).trim() === '') {
                toast.error("Please select a number first.");
                return;
            }
            if (entryInteraction.boardId === boardId) {
            setEntryInteraction(prev => ({ ...prev, stage: 'confirming' }));
            }
            break;
        case 'CANCEL_CONFIRM':
            if (entryInteraction.boardId === boardId) {
                setEntryInteraction(prev => ({ ...prev, stage: 'selecting' })); 
            }
            break;
        case 'ENTRY_COMPLETED_RESET': 
            if (entryInteraction.boardId === boardId || boardId === null) {
                 setEntryInteraction({ boardId: null, stage: 'idle', selectedNumber: null });
            }
            break;
        default:
            console.warn("Unknown board action in LobbyPage handler:", action, boardId, value);
    }
  }, [userId, entryInteraction]); // Updated dependencies

  const showPrimaryLoadingScreen = () => {
    if (isWalletLoading) {
      console.log("[LobbyPage] Primary Loading: isWalletLoading is true.");
      return true;
    }
    if (userId && !emailVerified) {
      console.log("[LobbyPage] Primary Loading: User logged in but email not verified.");
      return true;
    }
    if (!userId && selectedSport !== SWEEPSTAKES_SPORT_ID) {
      console.log("[LobbyPage] Primary Loading: Guest on non-sweepstakes page.");
      return true;
    }
    console.log("[LobbyPage] Primary Loading: Conditions not met, not showing primary loader.");
    return false;
  };

  console.log("[LobbyPage] Render. isWalletLoading:", isWalletLoading, "userId:", userId, "emailV:", emailVerified, "selSport:", selectedSport, "loadSweep:", isLoadingSweepstakesData, "sweepB:", !!sweepstakesBoard, "sweepG:", !!sweepstakesGame);

  if (showPrimaryLoadingScreen()) {
    console.log("[LobbyPage] Rendering LoadingScreen. isWalletLoading:", isWalletLoading, "userId:", userId, "emailVerified:", emailVerified, "selectedSport:", selectedSport);
    return <div className="flex items-center justify-center min-h-screen bg-background-primary text-white">Authenticating...</div>; 
  }

  const displayLoading = selectedSport === SWEEPSTAKES_SPORT_ID ? isLoadingSweepstakesData : isLoadingGamesAndTeams;
  const displayError = selectedSport === SWEEPSTAKES_SPORT_ID ? sweepstakesDataError : gamesAndTeamsError;

  const contentVariants = {
    hidden: { opacity: 0, y: 15, transition: { duration: 0.25 } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-background-primary">
      <Toaster position="top-center" />
      <div className="sticky top-0 z-20"><InAppHeader /></div>
      <div className="flex-grow pb-20">
        <main className="px-4 py-2"> 
        <div className="max-w-3xl mx-auto w-full">
            <SportSelector 
              sports={initialSportsData} 
              selectedSportId={selectedSport} 
              onSelectSport={handleSelectSport} 
              sweepstakesStartTime={sweepstakesStartTime}
              sportSelectorView={sportSelectorView}
              setSportSelectorView={setSportSelectorView}
            />
            {displayLoading ? (
              <div className="flex items-center justify-center text-white py-10 min-h-[200px]">
                <p className="text-lg animate-pulse">Fetching latest picks...</p> 
              </div>
            ) : displayError ? (
              <div className="text-center text-red-500 py-10 min-h-[200px]">Error: {displayError}</div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selectedSport}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="w-full"
                >
                  {selectedSport === SWEEPSTAKES_SPORT_ID ? (
                    <>
                      {sweepstakesGame && sweepstakesBoard && sweepstakesGame.teamA && sweepstakesGame.teamB && sweepstakesTeams[sweepstakesGame.teamA.id] && sweepstakesTeams[sweepstakesGame.teamB.id] ? (
                        <>
                          {/* Primary condition: we have all necessary data */}
                              <SweepstakesScoreboard 
                                awayTeam={sweepstakesTeams[sweepstakesGame.teamA.id]!}
                                homeTeam={sweepstakesTeams[sweepstakesGame.teamB.id]!}
                                status={sweepstakesGame.status}
                            gameTime={sweepstakesGame.period} // Assuming period is gameTime string
                            quarter={sweepstakesGame.quarter} // Assuming quarter is also relevant
                                awayScore={sweepstakesGame.away_score}
                                homeScore={sweepstakesGame.home_score}
                              />
                              <SweepstakesBoardCard 
                                key={sweepstakesBoard.id}
                                board={{...sweepstakesBoard, teamA: sweepstakesTeams[sweepstakesGame.teamA.id]!, teamB: sweepstakesTeams[sweepstakesGame.teamB.id]! }}
                            user={user} // Pass the LobbyPage's user state
                                onProtectedAction={handleProtectedAction}
                                entryInteraction={entryInteraction}
                                handleBoardAction={handleBoardAction}
                                openWalletDialog={openWalletDialog} 
                            walletHasWallet={hasWallet} // from useWallet
                            walletBalance={balance}     // from useWallet
                            walletIsLoading={isWalletLoading} // from useWallet
                          />
                        </>
                      ) : (
                         <div className="text-center text-gray-400 py-10 mt-6">
                           {isLoadingSweepstakesData ? "Loading Sweepstakes Details..." : "No active Sweepstakes event or complete game data found."}
                         </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-white mt-3 mb-1">Games</h2>
                      <div className="w-full mb-0">
                        <GamesList games={games} teams={teams} user={user} onProtectedAction={handleProtectedAction} />
                      </div>
                      <h2 className="text-lg font-semibold text-white mt-3 mb-1">Boards</h2>
                       {games.length > 0 ? (
                         <div className="w-full max-w-md mx-auto mt-1 px-2 pb-4">
                           <BoardsList 
                             games={games}
                             teams={teams}
                             user={user} 
                             currentUserId={userId} // from useWallet
                             onProtectedAction={handleProtectedAction} 
                             entryInteraction={entryInteraction}
                             handleBoardAction={handleBoardAction}
                             openWalletDialog={openWalletDialog}
                             walletHasWallet={hasWallet} // from useWallet
                             walletBalance={balance}     // from useWallet
                             walletIsLoading={isWalletLoading} // from useWallet
                           />
                         </div>
                      ) : (
                         <p className="text-gray-400 text-center py-4">No boards to display as there are no games for {initialSportsData.find(s => s.id === selectedSport)?.name || selectedSport.toUpperCase()}.</p>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
        </div> 
        </main>
      </div>
      <BottomNav user={user} onProtectedAction={handleProtectedAction} />
      {(isLoginModalOpen || isWalletSetupDialogOpen || isDepositDialogOpen) && <StarfieldBackground className="z-40" />}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}><DialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b] via-[#B8860B] to-[#B8860B] border-accent-1/50 text-white py-8"><DialogHeader className="text-center items-center"><DialogTitle className="text-2xl font-bold mb-2">Login Required</DialogTitle><DialogDescription className="text-gray-300 opacity-90">You need to be logged in or create an account to perform this action.</DialogDescription></DialogHeader><div className="flex flex-col sm:flex-row gap-3 mt-6 mb-0"><Button onClick={() => router.push('/login')} className="flex-1 bg-accent-1 hover:bg-accent-1/80 text-white font-semibold">Login</Button><Button onClick={() => router.push('/signup')} variant="outline" className="flex-1 bg-transparent border-gray-500 hover:bg-gray-500/20 text-gray-300 font-semibold hover:text-gray-300">Sign Up</Button></div></DialogContent></Dialog>
      <Dialog open={isWalletSetupDialogOpen} onOpenChange={setIsWalletSetupDialogOpen}><DialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b] via-[#B8860B] to-[#B8860B] border-accent-1/50 text-white py-8"><DialogHeader className="text-center items-center"><DialogTitle className="flex items-center justify-center text-2xl font-bold mb-2">{setupDialogContent.title}</DialogTitle><DialogDescription className="text-gray-300 opacity-90">{setupDialogContent.description}</DialogDescription></DialogHeader><div className="flex flex-col sm:flex-row gap-3 mt-6 mb-0"><Button
        onClick={() => { setIsWalletSetupDialogOpen(false); router.push('/wallet-setup/location'); }}
        className="flex-1 bg-gradient-to-br from-yellow-600 via-yellow-700 to-yellow-800 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-white font-semibold text-lg py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-colors"
      >
        {setupDialogContent.buttonText}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsWalletSetupDialogOpen(false)}
        className="flex-1 bg-transparent border-[#B8860B]/70 text-[#B8860B] hover:bg-[#B8860B]/20 hover:text-yellow-300 transition-colors"
      >
        Cancel
      </Button></div></DialogContent></Dialog>
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}><DialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b] to-[#B8860B] to-15% border-accent-1/50 text-white py-8"><DialogHeader><DialogTitle className="flex items-center text-xl font-semibold">Insufficient Funds</DialogTitle><DialogDescription className="text-gray-300 opacity-90 pt-2">You need at least ${requiredDepositAmount.toFixed(2)} more to enter this board.</DialogDescription></DialogHeader><DialogFooter className="mt-4 gap-2 sm:justify-center"><Button type="button" variant="outline" onClick={() => setIsDepositDialogOpen(false)} className="border-gray-500 hover:bg-gray-500/20 text-gray-300 hover:text-gray-300">Cancel</Button><Button type="button" onClick={() => { setIsDepositDialogOpen(false); router.push('/wallet'); }} className="bg-accent-1 hover:bg-accent-1/80 text-white font-semibold">Add Funds</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
} 