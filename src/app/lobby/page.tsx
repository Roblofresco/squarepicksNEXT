'use client'

export const runtime = 'edge';

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react';
// driver removed
import { getNFLWeekRange, getFirestoreTimestampRange, formatDateRange } from '@/lib/date-utils';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { db, auth } from '@/lib/firebase'; // Import auth here
import { User as FirebaseUser } from 'firebase/auth'; // Renamed to avoid conflict
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SportSelector from '@/components/lobby/SportSelector';
import TourSportSelector from '@/components/lobby/TourSportSelector';
import GamesList from '@/components/lobby/GamesList';
import TourGamesList from '@/components/lobby/TourGamesList';
import TourBoardCard from '@/components/lobby/TourBoardCard';
import BoardsList from '@/components/lobby/BoardsList';
import BottomNav from '@/components/lobby/BottomNav';
import InAppHeader from '@/components/InAppHeader';
import { Game as GameType, Board as BoardType, TeamInfo } from '@/types/lobby';
import { initialSportsData, SWEEPSTAKES_SPORT_ID, FREE_BOARD_ENTRY_FEE, BOARD_STATUS_OPEN, DEFAULT_BOARD_ENTRY_FEE } from '@/config/lobbyConfig';
import SweepstakesScoreboard from '@/components/lobby/sweepstakes/SweepstakesScoreboard';
// StarfieldBackground now imported dynamically above
import SweepstakesBoardCard from '@/components/lobby/sweepstakes/SweepstakesBoardCard';
import TourSweepstakesBoardCard from '@/components/lobby/sweepstakes/TourSweepstakesBoardCard';
import {
  collection, query, where, onSnapshot, doc, getDoc,
  Timestamp, DocumentReference, DocumentData, orderBy, limit, setDoc,
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import TourOverlay from '@/components/tour/TourOverlay';
import { AlertCircle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

// Import StarfieldBackground dynamically to prevent SSR issues
import dynamic from 'next/dynamic';

// Dynamic import with no SSR to prevent build errors
const StarfieldBackground = dynamic(() => import('@/components/effects/StarfieldBackground'), { 
  ssr: false,
  loading: () => null
});

// Define EntryInteractionState locally
interface EntryInteractionState {
  boardId: string | null;
  stage: 'idle' | 'selecting' | 'confirming'; // Removed 'completed' stage
  selectedNumber: number | null;
}

interface UserTourState {
  done: boolean;
  loading: boolean;
}

const userDocRef = (uid: string) => doc(db, 'users', uid);

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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isWalletSetupDialogOpen, setIsWalletSetupDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [requiredDepositAmount, setRequiredDepositAmount] = useState(0);
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
  const [sportsDataVersion, setSportsDataVersion] = useState(0);
  const [teams, setTeams] = useState<Record<string, TeamInfo>>({}); // Stores all fetched teams by ID
  const [isLoadingGamesAndTeams, setIsLoadingGamesAndTeams] = useState<boolean>(true);
  const [gamesAndTeamsError, setGamesAndTeamsError] = useState<string | null>(null);
  const [weekNumber, setWeekNumber] = useState<number>(0);
  const [dateRange, setDateRange] = useState<{ startTimestamp: Timestamp; endTimestamp: Timestamp } | null>(null);

  const [sportSelectorView, setSportSelectorView] = useState<'sweepstakes' | 'allRegularSports'>('sweepstakes'); // New state

  const [sweepstakesBoard, setSweepstakesBoard] = useState<BoardType | null>(null);
  const [sweepstakesGame, setSweepstakesGame] = useState<GameType | null>(null);
  const [sweepstakesTeams, setSweepstakesTeams] = useState<Record<string, TeamInfo>>({});
  const [isLoadingSweepstakesData, setIsLoadingSweepstakesData] = useState<boolean>(true);
  const [sweepstakesDataError, setSweepstakesDataError] = useState<string | null>(null);
  const [sweepstakesStartTime, setSweepstakesStartTime] = useState<Date | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  
  const [entryInteraction, setEntryInteraction] = useState<EntryInteractionState>({ 
    boardId: null, stage: 'idle', selectedNumber: null
  });
  const [agreeToSweepstakes, setAgreeToSweepstakes] = useState<boolean | null>(null);

  // Use useWallet for auth and wallet status
  const { userId, emailVerified, isLoading: isWalletLoading, balance, hasWallet } = useWallet();

  // Active Firestore listeners cleanup refs
  const unsubscribeGamesListenerRef = useRef<(() => void) | null>(null);
  const unsubscribeSweepstakesListenerRef = useRef<(() => void) | null>(); // Single listener for combined sweepstakes board/game

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

    const startTransition = () => {
      setIsTransitioning(true);
      // Don't clear data immediately, let the new data replace it upon arrival.
      setGamesAndTeamsError(null); 
      setSweepstakesDataError(null);
    };

    startTransition();

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
          setIsTransitioning(false);
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
                // Times
                startTime: (gameDataFirestore.startTime as Timestamp) || (gameDataFirestore.start_time as Timestamp),
                start_time: (gameDataFirestore.start_time as Timestamp) || undefined,
                // Team refs
                away_team_id: gameDataFirestore.away_team_id as DocumentReference,
                home_team_id: gameDataFirestore.home_team_id as DocumentReference,
                // Scores (prefer camelCase)
                awayScore: typeof gameDataFirestore.awayScore === 'number' ? gameDataFirestore.awayScore : gameDataFirestore.away_team_score,
                homeScore: typeof gameDataFirestore.homeScore === 'number' ? gameDataFirestore.homeScore : gameDataFirestore.home_team_score,
                away_score: typeof gameDataFirestore.away_team_score === 'number' ? gameDataFirestore.away_team_score : undefined,
                home_score: typeof gameDataFirestore.home_team_score === 'number' ? gameDataFirestore.home_team_score : undefined,
                // Live flags (prefer camelCase)
                isLive: gameDataFirestore.isLive ?? gameDataFirestore.is_live ?? false,
                isOver: gameDataFirestore.isOver ?? gameDataFirestore.is_over ?? false,
                is_live: gameDataFirestore.is_live ?? undefined,
                is_over: gameDataFirestore.is_over ?? undefined,
                // Period
                quarter: gameDataFirestore.quarter || '',
                sport: gameDataFirestore.sport || SWEEPSTAKES_SPORT_ID,
                status: gameDataFirestore.status || 'scheduled',
                // Broadcast (prefer camelCase)
                broadcastProvider: gameDataFirestore.broadcastProvider || gameDataFirestore.broadcast_provider,
                broadcast_provider: gameDataFirestore.broadcast_provider ?? undefined,
              } as GameType;
              setSweepstakesGame(typedGameData);
              {
                const ts = typedGameData.startTime || typedGameData.start_time;
                setSweepstakesStartTime(ts ? ts.toDate() : null);
              }
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
            setIsTransitioning(false);
          }
        } else {
          console.warn("[LobbyPage] Sweepstakes board has no valid gameID.");
          setSweepstakesGame(null);
          setSweepstakesTeams({});
          setSweepstakesStartTime(null);
            setIsLoadingSweepstakesData(false);
            setIsTransitioning(false);
        }
      }, (error) => {
        console.error("[LobbyPage] Error fetching sweepstakes board:", error);
        setSweepstakesBoard(null);
        setSweepstakesGame(null);
        setSweepstakesTeams({});
        setSweepstakesStartTime(null);
        setSweepstakesDataError("Failed to load sweepstakes data. Please try again.");
        setIsLoadingSweepstakesData(false);
        setIsTransitioning(false);
      });
    } else { // Regular Sport
      console.log(`[LobbyPage] Fetching data for REGULAR SPORT: ${selectedSport}.`);
      setIsLoadingGamesAndTeams(true);
      setIsLoadingSweepstakesData(false); // Not loading sweepstakes data
      // Get the NFL week range for filtering games
      const { weekNumber: currentWeekNumber } = getNFLWeekRange();
      const timestampRange = getFirestoreTimestampRange();
      setWeekNumber(currentWeekNumber);
      setDateRange(timestampRange);

      // Query keeps snake_case for backward compatibility
      const gamesQuery = query(
        collection(db, 'games'),
        where("sport", "==", selectedSport.toUpperCase()),
        where("is_over", "==", false),
        where("start_time", ">=", timestampRange.startTimestamp),
        where("start_time", "<=", timestampRange.endTimestamp),
        orderBy("start_time")
      );
      setGames([]);
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
          // times
          startTime: (gr.startTime as Timestamp) || (gr.start_time as Timestamp),
          start_time: gr.start_time as Timestamp,
          // refs
          away_team_id: gr.away_team_id as DocumentReference,
          home_team_id: gr.home_team_id as DocumentReference,
          // scores (prefer camelCase)
          awayScore: typeof gr.awayScore === 'number' ? gr.awayScore : gr.away_team_score,
          homeScore: typeof gr.homeScore === 'number' ? gr.homeScore : gr.home_team_score,
          away_score: typeof gr.away_team_score === 'number' ? gr.away_team_score : undefined,
          home_score: typeof gr.home_team_score === 'number' ? gr.home_team_score : undefined,
          period: gr.quarter,
          // live flags
          isLive: gr.isLive ?? gr.is_live ?? false,
          isOver: gr.isOver ?? gr.is_over ?? false,
          // broadcast
          broadcastProvider: gr.broadcastProvider || gr.broadcast_provider,
          broadcast_provider: gr.broadcast_provider ?? undefined,
        })) as GameType[];
        
        setGames(enrichedGames);
        setSportsDataVersion(prev => prev + 1);
        console.log(`[LobbyPage] Finished processing ${enrichedGames.length} games for ${selectedSport}.`);
        setIsLoadingGamesAndTeams(false);
        setIsTransitioning(false);
      }, (error) => {
        console.error(`[LobbyPage] REGULAR GAMES listener error for ${selectedSport}:`, error);
        setGamesAndTeamsError(`Failed to load games for ${selectedSport}.`);
        setIsLoadingGamesAndTeams(false);
        setIsTransitioning(false);
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
    if (typeof document !== 'undefined' && document.body.classList.contains('tour-lock')) {
      return;
    }
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
    const { reqAmount = 0 } = options;

    switch (type) {
      case 'setup':
        setSetupDialogContent({
          title: 'Wallet Setup Required',
          description: 'Set up your wallet to manage entries and winnings securely.',
          buttonText: 'Go to Wallet Setup',
        });
        setIsWalletSetupDialogOpen(true);
        break;
      case 'deposit':
        setRequiredDepositAmount(reqAmount);
        setIsDepositDialogOpen(true);
        break;
      case 'sweepstakes':
        setSetupDialogContent({
          title: 'Wallet Setup Required',
          description: 'Verify your wallet to complete sweepstakes entries and receive payouts.',
          buttonText: 'Go to Wallet Setup',
        });
        setIsWalletSetupDialogOpen(true);
        break;
      default:
        break;
    }
  }, []);

  const handleProtectedAction = useCallback(() => setIsLoginModalOpen(true), []);

  const handleBoardAction = useCallback(async (action: string, boardId: string, value?: number | string | null) => {
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
                 selectedNumber: typeof value === 'number' ? value : value !== undefined && value !== null ? Number(value) : null,
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

  // App-driven tour state (dev only for now)
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourPhase, setTourPhase] = useState<'A' | 'B'>('A');
  const [activeTour, setActiveTour] = useState<'sweepstakes' | 'sports' | null>(null);
  const [sweepstakesTourSeen, setSweepstakesTourSeen] = useState<UserTourState>({ done: false, loading: true });
  const [sportsTourSeen, setSportsTourSeen] = useState<UserTourState>({ done: false, loading: true });
  const [sweepstakesTourAutoTriggered, setSweepstakesTourAutoTriggered] = useState(false);
  const [sportsTourAutoTriggered, setSportsTourAutoTriggered] = useState(false);
  const tourOpenFrameRef = useRef<number | null>(null);
  const [tourContentReady, setTourContentReady] = useState(false);
  type LobbyTourStep = {
    id: string;
    anchor: string;
    title: string;
    description: string;
    side?: 'top' | 'bottom';
    scroll?: 'bottom' | 'center' | 'popoverTop';
    arrowTarget?: string;
    holePadding?: number;
    popoverOffsetY?: number;
  };
  const sweepstakesTourSteps: LobbyTourStep[] = useMemo(() => ([
    { id: 'selector', anchor: '[data-tour="sport-selector"]', title: 'Choose Your View', description: 'Switch between Sweepstakes and Sports.', holePadding: 12 },
    { id: 'input', anchor: '[data-tour="sweepstakes-input"]', title: 'Choose Your Square', description: 'Type your number.', side: 'top', scroll: 'popoverTop', arrowTarget: '[data-tour="sweepstakes-input"]', holePadding: 14, popoverOffsetY: 16 },
    { id: 'grid', anchor: '[data-tour="sweepstakes-grid-selected"]', title: 'Choose Your Square', description: 'Tap your number.', side: 'top', scroll: 'center', arrowTarget: '[data-tour="sweepstakes-grid-selected"]', holePadding: 18, popoverOffsetY: 20 },
    { id: 'enter', anchor: '[data-tour="sweepstakes-enter"]', title: 'Enter Sweepstakes', description: 'Click Enter.', side: 'top', scroll: 'popoverTop', arrowTarget: '[data-tour="sweepstakes-enter"]', holePadding: 16, popoverOffsetY: 18 },
    { id: 'confirm', anchor: '[data-tour="sweepstakes-confirm"]', title: 'Confirm Entry', description: 'Review and confirm your pick.', side: 'top', scroll: 'popoverTop', arrowTarget: '[data-tour="sweepstakes-confirm"]', holePadding: 16, popoverOffsetY: 18 },
    { id: 'response', anchor: '[data-tour="sweepstakes-response"]', title: 'Entry Response', description: 'See the confirmation message.', side: 'top', scroll: 'popoverTop', arrowTarget: '[data-tour="sweepstakes-response"]', holePadding: 16, popoverOffsetY: 18 }
  ]), []);
  const sportsTourSteps: LobbyTourStep[] = useMemo(() => ([
    {
      id: 'sports-games-upcoming',
      anchor: '[data-tour="sports-games-upcoming"]',
      title: 'Upcoming Matchups',
      description: 'Each card shows kickoff time, broadcast network, and team records so you can plan entries before the game starts.',
      scroll: 'center',
      holePadding: 16,
    },
    {
      id: 'sports-games-tap',
      anchor: '[data-tour="sports-games-upcoming"]',
      title: 'View Game Boards',
      description: 'Tap a matchup to jump into the full game page where you can choose from different board entry amounts.',
      scroll: 'center',
      holePadding: 16,
    },
    {
      id: 'sports-games-live',
      anchor: '[data-tour="sports-games-live"]',
      title: 'Live Game View',
      description: 'Live cards update the score and game clock in real time. Tap any live game to track the board while the action unfolds.',
      scroll: 'center',
      holePadding: 16,
    },
    {
      id: 'sports-board',
      anchor: '[data-tour="sports-board-card"]',
      title: 'Explore the Board',
      description: 'Review open squares, quick entry, and entry fee details before locking in your pick.',
      scroll: 'center',
      holePadding: 24,
    },
    {
      id: 'sports-board-grid',
      anchor: '[data-tour="sports-board-grid"]',
      arrowTarget: '[data-tour="sports-board-grid"]',
      title: 'Grid at a Glance',
      description: ' ',
      scroll: 'center',
      holePadding: 18,
      legend: [
        { color: 'bg-gradient-to-br from-[#2fa87499] via-[#1f7f5788] to-[#15604377]', label: 'Open square' },
        { color: 'bg-gradient-to-br from-[#0d341c99] via-[#08221488] to-[#04150c77]', label: 'Taken square' },
        { color: 'bg-gradient-to-br from-[#4fd1ff99] via-[#2bb4f588] to-[#1587d877]', label: 'Your square' }
      ],
    },
    {
      id: 'sports-quick-entry-intro',
      anchor: '[data-tour="sports-quick-entry"]',
      arrowTarget: '[data-tour="sports-quick-entry"]',
      title: 'Enter a Board',
      description: 'Review the entry amount, then press Enter to start picking your number. We’ll guide you through confirming the square next.',
      scroll: 'center',
      holePadding: 16,
    },
    {
      id: 'sports-quick-entry-type',
      anchor: '[data-tour="sports-quick-entry"]',
      arrowTarget: '[data-tour="sports-quick-entry"]',
      title: 'Type Your Number',
      description: 'Enter the two-digit number you want, or tap Random to let us pick. Highlighted squares match the number you choose.',
      scroll: 'center',
      holePadding: 16,
    },
    {
      id: 'sports-quick-entry-random',
      anchor: '[data-tour="sports-quick-entry"]',
      arrowTarget: '[data-tour="sports-quick-entry-random"]',
      title: 'Use Random',
      description: 'Tap Random for a surprise number. We’ll update the grid instantly so you can decide whether to confirm it.',
      scroll: 'center',
      holePadding: 16,
    },
    {
      id: 'sports-quick-entry-confirm',
      anchor: '[data-tour="sports-quick-entry"]',
      arrowTarget: '[data-tour="sports-quick-entry"]',
      title: 'Confirm Your Pick',
      description: 'Review the number and entry fee, then hit Confirm to lock in your square. You can still cancel before submitting.',
      scroll: 'center',
      holePadding: 16,
    },
    {
      id: 'sports-quick-entry-response',
      anchor: '[data-tour="sports-entry-response-dialog"]',
      arrowTarget: '[data-tour="sports-entry-response-dialog"]',
      title: 'Entry Response',
      description: 'Success! This is where we confirm your entry and show your prize status. Keep an eye here after every submission.',
      scroll: 'center',
      holePadding: 16,
    },
    {
      id: 'sports-board-track',
      anchor: '[data-tour="sports-board-grid"]',
      arrowTarget: '[data-tour="sports-board-grid"]',
      title: 'Track Your Squares',
      description: 'Your glowing squares mark active entries. Check back during the game to follow each period’s payouts.',
      scroll: 'center',
      holePadding: 18,
    },
  ]), []);
  const [moreClicked, setMoreClicked] = useState(false);
  const [sweepstakesClicked, setSweepstakesClicked] = useState(false);
  const stepsForRender = useMemo(() => {
    if (activeTour === 'sports') {
      return sportsTourSteps;
    }
    const s = [...sweepstakesTourSteps];
    if (tourStep === 0) {
      if (tourPhase === 'A') {
        s[0] = {
          ...s[0],
          title: 'Choose Your View',
          description: 'Switch between Sweepstakes and Sports.\nClick **More**.',
          arrowTarget: '[data-tour-allow="more"]',
          side: 'bottom',
          scroll: 'center',
          popoverOffsetY: 12
        };
        } else {
        s[0] = {
          ...s[0],
          title: 'Choose Your View',
          description: (sweepstakesClicked || sportSelectorView === 'sweepstakes')
            ? 'Switch between Sweepstakes and Sports.\nClick Next'
            : 'Switch between Sweepstakes and Sports.\nClick **Sweepstakes**.',
          arrowTarget: '[data-tour-allow="sweepstakes"]',
          side: 'bottom',
          scroll: 'center',
          popoverOffsetY: 12
        };
      }
    }
    return s;
  }, [activeTour, sportsTourSteps, sweepstakesTourSteps, tourStep, tourPhase, sweepstakesClicked, sportSelectorView]);
  useEffect(() => {
    if (!userId) {
      setSweepstakesTourSeen({ done: false, loading: false });
      setSportsTourSeen({ done: false, loading: false });
      return;
    }
    let active = true;
    setSweepstakesTourSeen(prev => ({ ...prev, loading: true }));
    setSportsTourSeen(prev => ({ ...prev, loading: true }));
    const load = async () => {
      try {
        const ref = userDocRef(userId);
        const snap = await getDoc(ref);
        const data = snap.data();
        const sweepstakesDone = !!data?.sweepstakesTourDone;
        const sportsDone = !!data?.sportsTourDone;
        if (active) {
          setSweepstakesTourSeen({ done: sweepstakesDone, loading: false });
          setSportsTourSeen({ done: sportsDone, loading: false });
        }
      } catch (err) {
        console.error('[LobbyPage] Failed to load tour status', err);
        if (active) {
          setSweepstakesTourSeen({ done: false, loading: false });
          setSportsTourSeen({ done: false, loading: false });
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [userId]);

  const boardReadyForTour = useMemo(() => (
    !!(sweepstakesBoard && sweepstakesGame && sweepstakesGame.teamA && sweepstakesGame.teamB && sweepstakesTeams[sweepstakesGame.teamA.id] && sweepstakesTeams[sweepstakesGame.teamB.id])
  ), [sweepstakesBoard, sweepstakesGame, sweepstakesTeams]);
  const sportsReadyForTour = useMemo(
    () => ({ ready: games.length > 0 && !isLoadingGamesAndTeams, version: sportsDataVersion }),
    [games.length, isLoadingGamesAndTeams, sportsDataVersion]
  );

  const openTour = useCallback((tour: 'sweepstakes' | 'sports') => {
    setActiveTour(tour);
    setTourStep(0);
    setTourPhase('A');
    setMoreClicked(false);
    setSweepstakesClicked(false);
    setTourContentReady(false);

    if (tourOpenFrameRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(tourOpenFrameRef.current);
      tourOpenFrameRef.current = null;
    }

    const triggerOpen = () => {
      if (!tourContentReady) {
        // wait until content marks itself ready
        if (typeof window !== 'undefined') {
          tourOpenFrameRef.current = window.requestAnimationFrame(triggerOpen);
        }
        return;
      }
      setTourOpen(true);
      tourOpenFrameRef.current = null;
    };

    if (typeof window !== 'undefined') {
      tourOpenFrameRef.current = window.requestAnimationFrame(triggerOpen);
    } else {
      triggerOpen();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (tourOpenFrameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(tourOpenFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedSport !== SWEEPSTAKES_SPORT_ID) return;
    if (sweepstakesTourAutoTriggered) return;
    if (!userId) return;
    if (sweepstakesTourSeen.loading) return;
    if (sweepstakesTourSeen.done) return;
    if (!boardReadyForTour) return;
    const frame = window.requestAnimationFrame(() => {
      if (boardReadyForTour) {
        openTour('sweepstakes');
        setSweepstakesTourAutoTriggered(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedSport, userId, sweepstakesTourSeen, sweepstakesTourAutoTriggered, boardReadyForTour, openTour]);

  useEffect(() => {
    if (selectedSport === SWEEPSTAKES_SPORT_ID) return;
    if (sportsTourAutoTriggered) return;
    if (!userId) return;
    if (sportsTourSeen.loading) return;
    if (sportsTourSeen.done) return;
    if (!sportsReadyForTour.ready) return;
    const versionAtReady = sportsReadyForTour.version;
    const frame = window.requestAnimationFrame(() => {
      if (sportsReadyForTour.ready && sportsReadyForTour.version === versionAtReady) {
        openTour('sports');
        setSportsTourAutoTriggered(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedSport, userId, sportsTourSeen, sportsTourAutoTriggered, sportsReadyForTour, openTour]);

  useEffect(() => {
    if (!tourOpen) {
      document.body.classList.remove('tour-lock');
      return;
    }
    document.body.classList.add('tour-lock');
    return () => {
      document.body.classList.remove('tour-lock');
    };
  }, [tourOpen]);

  // Allow clicks on tour selector buttons to set flags
  useEffect(() => {
    if (!tourOpen) return;
    const onAllow = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind: 'more' | 'sweepstakes' } | undefined;
      if (!detail) return;
      if (detail.kind === 'more') { setMoreClicked(true); setTourPhase('B'); }
      if (detail.kind === 'sweepstakes') { setSweepstakesClicked(true); }
    };
    window.addEventListener('tour-allow', onAllow);
    return () => window.removeEventListener('tour-allow', onAllow);
  }, [tourOpen]);

  if (showPrimaryLoadingScreen()) {
    console.log("[LobbyPage] Rendering LoadingScreen. isWalletLoading:", isWalletLoading, "userId:", userId, "emailVerified:", emailVerified, "selectedSport:", selectedSport);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-primary text-white space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full bg-accent-1/20" />
          <Skeleton className="h-4 w-32 bg-accent-1/20" />
        </div>
        <div className="text-accent-1/50 animate-pulse">Authenticating...</div>
      </div>
    );
  }

  const displayError = selectedSport === SWEEPSTAKES_SPORT_ID ? sweepstakesDataError : gamesAndTeamsError;

  const contentVariants = {
    hidden: { opacity: 0, y: 15, transition: { duration: 0.3 } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const overlayVariants = {
    hidden: { opacity: 0, transition: { duration: 0.2 } },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-background-primary">
      <Toaster position="top-center" />
      <div className={`sticky top-0 ${entryInteraction.stage === 'confirming' ? 'z-50' : 'z-20'}`}><InAppHeader showBalancePill={entryInteraction.stage !== 'idle'} balance={balance} /></div>
      <div className="flex-grow pb-20">
        <main className="px-4 py-2"> 
          <div className="w-full">
            <div data-tour="sport-selector">
            {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tour') === 'dev' ? (
              <TourSportSelector
                sports={initialSportsData}
                sweepstakesStartTime={sweepstakesStartTime}
                sportSelectorView={sportSelectorView}
                setSportSelectorView={setSportSelectorView}
              />
            ) : (
            <SportSelector 
              sports={initialSportsData} 
              selectedSportId={selectedSport} 
              onSelectSport={handleSelectSport} 
              sweepstakesStartTime={sweepstakesStartTime}
              sportSelectorView={sportSelectorView}
              setSportSelectorView={setSportSelectorView}
            />
            )}
            </div>
            {/* Balance pill moved to header component when in entry flow */}
            <div className="relative">
              <AnimatePresence mode="wait" initial={false}>
                {isTransitioning && (
                  <motion.div
                    key="loading-overlay"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="absolute inset-0 bg-background-primary/50 backdrop-blur-sm z-10 flex items-center justify-center"
                  >
                    <p className="text-lg text-white animate-pulse">Fetching latest picks...</p>
                  </motion.div>
                )}
                {entryInteraction.stage === 'confirming' && (
                  <motion.div
                    key="interaction-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-30 pointer-events-none bg-black/60 backdrop-blur-[2px]"
                    style={{
                      WebkitMaskImage: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0.9) 55%, rgba(255,255,255,1) 70%)',
                      maskImage: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0.9) 55%, rgba(255,255,255,1) 70%)'
                    }}
                  />
                )}
              </AnimatePresence>
              {displayError ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-10 min-h-[200px]"
                >
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-md w-full backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-red-400">Error Loading Data</h3>
                        <p className="text-sm text-red-300/80 mt-1">{displayError}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="w-full mt-4 bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                    >
                      Try Again
                    </Button>
              </div>
                </motion.div>
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
                        <div data-tour="sweepstakes">
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
                              {!tourOpen ? (
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
                              ) : (
                                <TourSweepstakesBoardCard
                                  tourStepId={stepsForRender[tourStep]?.id}
                                  highlightedSquare={typeof entryInteraction.selectedNumber === 'number' ? entryInteraction.selectedNumber : undefined}
                          />
                              )}
                          <p className="text-xs text-gray-400 mt-2">Free weekly entry. Numbers assigned at game time.</p>
                        </div>
                      ) : (
                         <div className="text-center text-gray-400 py-10 mt-6">
                           {isLoadingSweepstakesData ? "Loading Sweepstakes Details..." : "No active Sweepstakes event or complete game data found."}
                         </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center -mt-5 mb-0">
                        <h2 className="text-lg font-semibold text-white">Games</h2>
                        {selectedSport.toUpperCase() === 'NFL' && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-accent-1 font-medium">Week {weekNumber}</span>
                            <span className="text-xs text-white/50">{dateRange ? formatDateRange(dateRange.startTimestamp.toDate(), dateRange.endTimestamp.toDate()) : ''}</span>
                          </div>
                        )}
                      </div>
                      <div className="w-full mb-0">
                        <AnimatePresence mode="wait">
                          {isLoadingGamesAndTeams ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex gap-4 overflow-x-auto pb-4 px-[50px]"
                            >
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex-shrink-0">
                                  <Skeleton className="h-[90px] w-[240px] rounded-lg bg-accent-1/10" />
                                </div>
                              ))}
                            </motion.div>
                          ) : activeTour === 'sports' ? (
          <TourGamesList
            activeStepId={stepsForRender[tourStep]?.id}
            games={games}
            onMounted={() => setTourContentReady(true)}
          />
                          ) : (
                            <GamesList games={games} teams={teams} user={user} onProtectedAction={handleProtectedAction} />
                          )}
                        </AnimatePresence>
                      </div>
                      <h2 className="text-lg font-semibold text-white mt-0 mb-0">Boards</h2>
                      <AnimatePresence mode="wait">
                        {isLoadingGamesAndTeams ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full mt-0 px-2 pb-4 space-y-4"
                          >
                            {[1, 2].map((i) => (
                              <div key={i} className="flex flex-col gap-2">
                                <Skeleton className="h-4 w-32 bg-accent-1/10" />
                                <Skeleton className="h-[120px] w-full rounded-lg bg-accent-1/10" />
                              </div>
                            ))}
                          </motion.div>
                        ) : games.length > 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full mt-0 px-2 pb-4"
                          >
                           {activeTour === 'sports' ? (
                             (() => {
                               const activeStepId = sportsTourSteps[tourStep]?.id;
                               const tourUserSquare = 88;
                               const randomNumberForTour = 57;
                               const defaultSelectedNumber = entryInteraction.selectedNumber ?? 32;

                               const stepConfig = (() => {
                                 switch (activeStepId) {
                                   case 'sports-board':
                                     return {
                                       stage: 'idle' as const,
                                       legendSquares: undefined,
                                       highlightedNumber: undefined,
                                       forcedSquares: new Set<number>([tourUserSquare]),
                                       quickEntryStage: 'idle' as const,
                                       showResponseDialog: false,
                                     };
                                   case 'sports-board-grid':
                                     return {
                                       stage: 'idle' as const,
                                       legendSquares: [12, 47, tourUserSquare] as [number, number, number],
                                       highlightedNumber: undefined,
                                       forcedSquares: new Set<number>([tourUserSquare]),
                                       quickEntryStage: 'idle' as const,
                                       showResponseDialog: false,
                                     };
                                   case 'sports-quick-entry-intro':
                                     return {
                                       stage: 'idle' as const,
                                       legendSquares: undefined,
                                       highlightedNumber: undefined,
                                       forcedSquares: new Set<number>([tourUserSquare]),
                                       quickEntryStage: 'idle' as const,
                                       showResponseDialog: false,
                                     };
                                   case 'sports-quick-entry-type':
                                     return {
                                       stage: 'selecting' as const,
                                       legendSquares: undefined,
                                       highlightedNumber: defaultSelectedNumber,
                                       forcedSquares: new Set<number>([tourUserSquare]),
                                       quickEntryStage: 'selecting' as const,
                                       showResponseDialog: false,
                                     };
                                   case 'sports-quick-entry-random':
                                     return {
                                       stage: 'selecting' as const,
                                       legendSquares: undefined,
                                       highlightedNumber: randomNumberForTour,
                                       forcedSquares: new Set<number>([tourUserSquare]),
                                       quickEntryStage: 'selecting' as const,
                                       showResponseDialog: false,
                                     };
                                   case 'sports-quick-entry-confirm':
                                     return {
                                       stage: 'confirming' as const,
                                       legendSquares: undefined,
                                       highlightedNumber: randomNumberForTour,
                                       forcedSquares: new Set<number>([tourUserSquare]),
                                       quickEntryStage: 'confirming' as const,
                                       showResponseDialog: false,
                                     };
                                   case 'sports-quick-entry-response':
                                     return {
                                       stage: 'entered' as const,
                                       legendSquares: undefined,
                                       highlightedNumber: undefined,
                                       forcedSquares: new Set<number>([tourUserSquare, randomNumberForTour]),
                                       quickEntryStage: 'entered' as const,
                                       showResponseDialog: true,
                                     };
                                   case 'sports-board-track':
                                     return {
                                       stage: 'entered' as const,
                                       legendSquares: undefined,
                                       highlightedNumber: undefined,
                                       forcedSquares: new Set<number>([tourUserSquare, randomNumberForTour]),
                                       quickEntryStage: 'entered' as const,
                                       showResponseDialog: false,
                                     };
                                   default:
                                     return {
                                       stage: entryInteraction.stage,
                                       legendSquares: undefined,
                                       highlightedNumber: defaultSelectedNumber,
                                       forcedSquares: undefined,
                                       quickEntryStage:
                                         entryInteraction.stage === 'idle' ? 'selecting' : entryInteraction.stage,
                                       showResponseDialog: false,
                                     };
                                 }
                               })();

                               return (
                                 <TourBoardCard
                                   stage={stepConfig.stage}
                                   highlightedNumber={stepConfig.highlightedNumber}
                                   game={games[0]}
                                   legendSquares={stepConfig.legendSquares}
                                   quickEntryStage={stepConfig.quickEntryStage}
                                   showResponseDialog={tourOpen && stepConfig.showResponseDialog}
                                   forcedUserSquares={stepConfig.forcedSquares}
                                   onLoaded={() => setTourContentReady(true)}
                                 />
                               );
                             })()
                           ) : (
                             <BoardsList 
                               games={games}
                               teams={teams}
                               user={user} 
                               currentUserId={userId}
                               onProtectedAction={handleProtectedAction} 
                               entryInteraction={entryInteraction}
                               handleBoardAction={handleBoardAction}
                               openWalletDialog={openWalletDialog}
                               walletHasWallet={hasWallet}
                               walletBalance={balance}    
                               walletIsLoading={isWalletLoading}
                             />
                           )}
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center py-8"
                          >
                            <div className="bg-accent-1/5 border border-accent-1/10 rounded-lg p-4 max-w-md text-center backdrop-blur-sm">
                              <p className="text-white/70">
                                {selectedSport.toUpperCase() === 'NFL' 
                                  ? `No NFL games scheduled for Week ${weekNumber}${dateRange ? ` (${formatDateRange(dateRange.startTimestamp.toDate(), dateRange.endTimestamp.toDate())})` : ''}.`
                                  : `No games available for ${initialSportsData.find(s => s.id === selectedSport)?.name || selectedSport.toUpperCase()}.`
                                }
                              </p>
                         </div>
                          </motion.div>
                      )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div> 
        </main>
      </div>
      <BottomNav user={user} onProtectedAction={handleProtectedAction} />
      {(isLoginModalOpen || isWalletSetupDialogOpen || isDepositDialogOpen) && <StarfieldBackground className="z-40" />}
      {tourOpen && activeTour && (
        <TourOverlay
          steps={stepsForRender}
          open={tourOpen}
          stepIndex={tourStep}
          onNext={() => {
            if (activeTour === 'sweepstakes' && tourStep === 0) {
              if (tourPhase === 'A' && moreClicked) { setTourPhase('B'); return; }
              if (tourPhase === 'B' && (sweepstakesClicked || sportSelectorView === 'sweepstakes')) {
                setTourStep(prev => Math.min(prev + 1, stepsForRender.length - 1));
                return;
              }
              return;
            }
            setTourStep(prev => Math.min(prev + 1, stepsForRender.length - 1));
          }}
          onClose={async () => {
            setTourOpen(false);
            const tourKind = activeTour;
            setActiveTour(null);
            setTourStep(0);
            if (!userId) return;
            if (tourKind === 'sweepstakes' && !sweepstakesTourSeen.done) {
              try {
                await setDoc(userDocRef(userId), { sweepstakesTourDone: true }, { merge: true });
                setSweepstakesTourSeen({ done: true, loading: false });
              } catch (err) {
                console.error('[LobbyPage] Failed to mark sweepstakes tour as done', err);
              }
            }
            if (tourKind === 'sports' && !sportsTourSeen.done) {
              try {
                await setDoc(userDocRef(userId), { sportsTourDone: true }, { merge: true });
                setSportsTourSeen({ done: true, loading: false });
              } catch (err) {
                console.error('[LobbyPage] Failed to mark sports tour as done', err);
              }
            }
          }}
          nextEnabled={activeTour === 'sweepstakes'
            ? (tourStep === 0 ? (tourPhase === 'A' ? moreClicked : (sweepstakesClicked || sportSelectorView === 'sweepstakes')) : true)
            : true}
          onNextBlocked={activeTour === 'sweepstakes' ? () => {
            const sel = tourPhase === 'A' ? '[data-tour-allow="more"]' : '[data-tour-allow="sweepstakes"]';
            const el = document.querySelector(sel) as HTMLElement | null;
            if (el) {
              el.classList.add('animate-pulse');
              setTimeout(() => el.classList.remove('animate-pulse'), 1000);
            }
          } : undefined}
          allowClickSelectors={activeTour === 'sports'
            ? []
            : [
              '[data-tour-allow="more"]',
              '[data-tour-allow="sweepstakes"]',
              '[data-tour-allow="home-continue"]',
              '[data-tour-allow="guidelines-skip"]',
              '[data-tour-allow="guidelines-agree"]'
            ]}
          hasWallet={!!hasWallet}
          onShowWallet={() => {
            openWalletDialog('setup');
          }}
          onSweepstakesAgreement={async (agreed) => {
            setAgreeToSweepstakes(agreed);
            if (!userId) return;
            try {
              await setDoc(userDocRef(userId), { agreeToSweepstakes: agreed }, { merge: true });
            } catch (err) {
              console.error('[LobbyPage] Failed to persist sweepstakes agreement', err);
            }
          }}
          tourPhase={tourPhase}
          agreeToSweepstakes={agreeToSweepstakes}
          onMarkTourDone={async () => {
            if (!userId) return;
            if (activeTour === 'sweepstakes') {
              try {
                await setDoc(userDocRef(userId), { sweepstakesTourDone: true }, { merge: true });
                setSweepstakesTourSeen({ done: true, loading: false });
              } catch (err) {
                console.error('[LobbyPage] Failed to mark sweepstakes tour as done', err);
              }
            }
            if (activeTour === 'sports') {
              try {
                await setDoc(userDocRef(userId), { sportsTourDone: true }, { merge: true });
                setSportsTourSeen({ done: true, loading: false });
              } catch (err) {
                console.error('[LobbyPage] Failed to mark sports tour as done', err);
              }
            }
          }}
          enableGuidelinesFlow={activeTour === 'sweepstakes'}
        />
      )}
      {/* Login Dialog */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-b from-background-primary/80 via-background-primary/70 to-accent-2/10 border border-white/10 text-white backdrop-blur-xl shadow-[0_0_1px_1px_rgba(255,255,255,0.1)] backdrop-saturate-150">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-2xl font-bold">Login Required</DialogTitle>
            <DialogDescription className="text-white/70">
              You need to be logged in or create an account to perform this action.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              onClick={() => router.push('/login')} 
              className="flex-1 bg-gradient-to-r from-accent-2/60 via-accent-1/45 to-accent-2/60 hover:opacity-90"
            >
              Login
            </Button>
            <Button 
              onClick={() => router.push('/signup-soon')} 
              variant="outline"
              className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              Sign Up
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Setup Dialog */}
      <Dialog open={isWalletSetupDialogOpen} onOpenChange={setIsWalletSetupDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-b from-background-primary/80 via-background-primary/70 to-accent-2/10 border border-white/10 text-white backdrop-blur-xl shadow-[0_0_1px_1px_rgba(255,255,255,0.1)] backdrop-saturate-150">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              {setupDialogContent.title}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {setupDialogContent.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsWalletSetupDialogOpen(false)}
              className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white py-6 text-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={() => { setIsWalletSetupDialogOpen(false); router.push('/wallet-setup/location'); }}
              className="flex-1 bg-gradient-to-r from-accent-2/60 via-accent-1/45 to-accent-2/60 hover:opacity-90 py-6 text-lg"
            >
              {setupDialogContent.buttonText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-b from-background-primary/80 via-background-primary/70 to-accent-2/10 border border-white/10 text-white backdrop-blur-xl shadow-[0_0_1px_1px_rgba(255,255,255,0.1)] backdrop-saturate-150">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Insufficient Funds
            </DialogTitle>
            <DialogDescription className="text-white/70">
              You need at least ${requiredDepositAmount.toFixed(2)} more to enter this board.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start gap-3 mt-6">
            <Button
              type="button"
              onClick={() => { setIsDepositDialogOpen(false); router.push('/deposit'); }}
              className="flex-1 bg-gradient-to-r from-accent-2/60 via-accent-1/45 to-accent-2/60 hover:opacity-90"
            >
              Add Funds
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDepositDialogOpen(false)}
              className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
      >
        Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
