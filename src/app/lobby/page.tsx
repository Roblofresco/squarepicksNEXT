'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { auth, db } from '@/lib/firebase'; // Assuming db is exported from firebase config
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

  const [selectedSport, setSelectedSport] = useState<string>(() => {
    const sportFromQuery = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('sport') : null;
    const isValidSport = initialSportsData.some(s => s.id === sportFromQuery);
    return isValidSport && typeof sportFromQuery === 'string' ? sportFromQuery : (initialSportsData[0]?.id || SWEEPSTAKES_SPORT_ID);
  });

  const [games, setGames] = useState<GameType[]>([]);
  const [teams, setTeams] = useState<Record<string, TeamInfo>>({}); // Stores all fetched teams by ID
  const [isLoadingGamesAndTeams, setIsLoadingGamesAndTeams] = useState<boolean>(true);
  const [gamesAndTeamsError, setGamesAndTeamsError] = useState<string | null>(null);

  const [sweepstakesBoard, setSweepstakesBoard] = useState<BoardType | null>(null);
  const [sweepstakesGame, setSweepstakesGame] = useState<GameType | null>(null);
  const [sweepstakesTeams, setSweepstakesTeams] = useState<Record<string, TeamInfo>>({});
  const [isLoadingSweepstakesData, setIsLoadingSweepstakesData] = useState<boolean>(true);
  const [sweepstakesDataError, setSweepstakesDataError] = useState<string | null>(null);
  const [sweepstakesStartTime, setSweepstakesStartTime] = useState<Date | null>(null);
  
  const [entryInteraction, setEntryInteraction] = useState<EntryInteractionState>({ 
    boardId: null, stage: 'idle', selectedNumber: null
  });

  const { balance: walletBalance = 0, hasWallet: walletHasWallet = null, isLoading: walletIsLoading = true } = useWallet();

  // Active Firestore listeners cleanup refs
  const unsubscribeGamesListenerRef = useRef<(() => void) | null>(null);
  const unsubscribeSweepstakesBoardListenerRef = useRef<(() => void) | null>(null);
  const unsubscribeSweepstakesGameListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const sportFromQuery = searchParams.get('sport');
    const isValidSport = initialSportsData.some(s => s.id === sportFromQuery);
    const targetSportFromUrl = isValidSport && typeof sportFromQuery === 'string' ? sportFromQuery : (initialSportsData[0]?.id || SWEEPSTAKES_SPORT_ID);
    if (targetSportFromUrl !== selectedSport) {
      setSelectedSport(targetSportFromUrl);
    }
  }, [searchParams.toString(), selectedSport]);

  // Main Data Fetching Effect for selectedSport
  useEffect(() => {
    // Cleanup previous listeners before starting new ones
    if (unsubscribeGamesListenerRef.current) unsubscribeGamesListenerRef.current();
    if (unsubscribeSweepstakesBoardListenerRef.current) unsubscribeSweepstakesBoardListenerRef.current();
    if (unsubscribeSweepstakesGameListenerRef.current) unsubscribeSweepstakesGameListenerRef.current();

    // Reset states
    setGames([]);
    setTeams({});
    setSweepstakesBoard(null);
    setSweepstakesGame(null);
    setSweepstakesTeams({});
    setSweepstakesStartTime(null);
    setGamesAndTeamsError(null);
    setSweepstakesDataError(null);

    if (selectedSport === SWEEPSTAKES_SPORT_ID) {
      setIsLoadingSweepstakesData(true);
      const sweepstakesBoardQuery = query(
        collection(db, 'boards'),
        where("amount", "==", FREE_BOARD_ENTRY_FEE), // Using amount for fee
        where("status", "==", BOARD_STATUS_OPEN),
        limit(1)
      );

      unsubscribeSweepstakesBoardListenerRef.current = onSnapshot(sweepstakesBoardQuery, (boardSnapshot) => {
        if (unsubscribeSweepstakesGameListenerRef.current) unsubscribeSweepstakesGameListenerRef.current();

        if (boardSnapshot.empty) {
          setSweepstakesBoard(null); setSweepstakesGame(null); setSweepstakesTeams({}); setSweepstakesStartTime(null);
          setIsLoadingSweepstakesData(false); return;
        }
        
        const boardDoc = boardSnapshot.docs[0];
        const boardDataFirestore = boardDoc.data();
        console.log('[LobbyPage] Raw boardDataFirestore from Firestore:', JSON.stringify(boardDataFirestore)); // Log the whole data
        console.log('[LobbyPage] Raw sweepstakesID from Firestore:', boardDataFirestore.sweepstakesID);

        let sweepstakesIdString: string | undefined = undefined;
        const firestoreSweepstakesID = boardDataFirestore.sweepstakesID;

        if (firestoreSweepstakesID) {
            if (typeof firestoreSweepstakesID === 'string') {
                // If it's a string, check if it's a path like 'sweepstakes/actualID' or just 'actualID'
                if (firestoreSweepstakesID.includes('/')) {
                    const parts = firestoreSweepstakesID.split('/');
                    sweepstakesIdString = parts[parts.length - 1];
                    console.log('[LobbyPage] Parsed sweepstakesIdString from Firestore string (was a path):', sweepstakesIdString);
                } else {
                    sweepstakesIdString = firestoreSweepstakesID; // Assume it's already just the ID
                    console.log('[LobbyPage] sweepstakesIdString from Firestore string (assumed to be ID):', sweepstakesIdString);
                }
            } else if (typeof firestoreSweepstakesID === 'object' && firestoreSweepstakesID.path && typeof firestoreSweepstakesID.path === 'string') {
                // This case handles if sweepstakesID was stored as a DocumentReference-like object with a path property
                const parts = firestoreSweepstakesID.path.split('/');
                sweepstakesIdString = parts[parts.length - 1];
                console.log('[LobbyPage] Parsed sweepstakesIdString from Firestore DocumentReference-like object path:', sweepstakesIdString);
            } else {
                console.warn('[LobbyPage] sweepstakesID from Firestore is of an unrecognized type:', firestoreSweepstakesID);
            }
        } else {
            console.warn('[LobbyPage] sweepstakesID is missing or null/undefined on the Firestore board document.');
        }

        const typedBoardData = {
          id: boardDoc.id,
          gameID: boardDataFirestore.gameID as DocumentReference, // Assert type if confident
          entryFee: boardDataFirestore.amount || 0,
          amount: boardDataFirestore.amount,
          status: boardDataFirestore.status,
          selected_indexes: boardDataFirestore.selected_indexes || [], // Ensure it's an array
          sweepstakes_select: boardDataFirestore.sweepstakes_select,
          isFreeEntry: boardDataFirestore.amount === 0 || boardDataFirestore.sweepstakes_select === true,
          sweepstakesID: sweepstakesIdString, // Assign the processed ID string
        } as BoardType; // Cast to BoardType, teamA/B will be populated later by game
        console.log('[LobbyPage] Final typedBoardData being set for sweepstakes:', typedBoardData);
        setSweepstakesBoard(typedBoardData);

        if (typedBoardData.gameID) {
          unsubscribeSweepstakesGameListenerRef.current = onSnapshot(doc(db, 'games', typedBoardData.gameID.id), async (gameSnap) => {
              if (gameSnap.exists()) {
              const gameDataFirestore = gameSnap.data();
              const gameTeamRefs: DocumentReference[] = [];
              if (gameDataFirestore.away_team_id instanceof DocumentReference) gameTeamRefs.push(gameDataFirestore.away_team_id);
              if (gameDataFirestore.home_team_id instanceof DocumentReference) gameTeamRefs.push(gameDataFirestore.home_team_id);
              const fetchedTeams = await fetchMultipleTeams(gameTeamRefs);
              setSweepstakesTeams(fetchedTeams);

              const typedGameData = {
                id: gameSnap.id,
                ...gameDataFirestore,
                teamA: gameDataFirestore.away_team_id instanceof DocumentReference ? fetchedTeams[gameDataFirestore.away_team_id.id] : undefined,
                teamB: gameDataFirestore.home_team_id instanceof DocumentReference ? fetchedTeams[gameDataFirestore.home_team_id.id] : undefined,
                start_time: gameDataFirestore.start_time as Timestamp,
                away_team_id: gameDataFirestore.away_team_id as DocumentReference,
                home_team_id: gameDataFirestore.home_team_id as DocumentReference,
                away_score: gameDataFirestore.away_team_score, // From schema
                home_score: gameDataFirestore.home_team_score, // From schema
                period: gameDataFirestore.quarter, // From schema
              } as GameType;
              setSweepstakesGame(typedGameData);
              setSweepstakesStartTime(typedGameData.start_time ? typedGameData.start_time.toDate() : null);
                } else {
              setSweepstakesGame(null); setSweepstakesTeams({});
            }
            setIsLoadingSweepstakesData(false);
          }, (error) => {
            console.error("Sweepstakes game listener error:", error);
            setSweepstakesDataError("Failed to load sweepstakes game details.");
            setIsLoadingSweepstakesData(false);
            });
          } else {
          setSweepstakesGame(null); setSweepstakesTeams({}); setIsLoadingSweepstakesData(false);
        }
      }, (error) => {
        console.error("Sweepstakes board listener error:", error);
        setSweepstakesDataError("Failed to load sweepstakes board.");
        setIsLoadingSweepstakesData(false);
      });
    } else { // Regular Sport
      setIsLoadingGamesAndTeams(true);
      const gamesQuery = query(
        collection(db, 'games'),
        where("sport", "==", selectedSport.toUpperCase()),
        where("is_over", "==", false),
        orderBy("start_time")
      );

      unsubscribeGamesListenerRef.current = onSnapshot(gamesQuery, async (gamesSnapshot) => {
        const fetchedGamesRaw: DocumentData[] = [];
        const teamRefsToFetch: DocumentReference[] = [];
        gamesSnapshot.forEach(docSnap => {
          const gameData = docSnap.data();
          fetchedGamesRaw.push({ id: docSnap.id, ...gameData });
          if (gameData.away_team_id instanceof DocumentReference) teamRefsToFetch.push(gameData.away_team_id);
          if (gameData.home_team_id instanceof DocumentReference) teamRefsToFetch.push(gameData.home_team_id);
        });

        const fetchedTeamsMap = await fetchMultipleTeams(teamRefsToFetch);
        setTeams(fetchedTeamsMap);

        const enrichedGames = fetchedGamesRaw.map(gr => ({
          ...gr,
          teamA: gr.away_team_id instanceof DocumentReference ? fetchedTeamsMap[gr.away_team_id.id] : undefined,
          teamB: gr.home_team_id instanceof DocumentReference ? fetchedTeamsMap[gr.home_team_id.id] : undefined,
          start_time: gr.start_time as Timestamp,
          away_team_id: gr.away_team_id as DocumentReference,
          home_team_id: gr.home_team_id as DocumentReference,
          away_score: gr.away_team_score, // From schema
          home_score: gr.home_team_score, // From schema
          period: gr.quarter, // From schema
        })) as GameType[];
        setGames(enrichedGames);
        setIsLoadingGamesAndTeams(false);
      }, (error) => {
        console.error(`Games listener error for ${selectedSport}:`, error);
        setGamesAndTeamsError(`Failed to load games for ${selectedSport}.`);
        setIsLoadingGamesAndTeams(false);
      });
    }

    // General cleanup function for all listeners when effect re-runs or component unmounts
    return () => {
      if (unsubscribeGamesListenerRef.current) unsubscribeGamesListenerRef.current();
      if (unsubscribeSweepstakesBoardListenerRef.current) unsubscribeSweepstakesBoardListenerRef.current();
      if (unsubscribeSweepstakesGameListenerRef.current) unsubscribeSweepstakesGameListenerRef.current();
    };
  }, [selectedSport]); // Re-run when selectedSport changes

  const handleSelectSport = useCallback((sportId: string) => {
    if (selectedSport === sportId) return;
    setSelectedSport(sportId);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("sport", sportId);
    router.push(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [router, pathname, searchParams, selectedSport]);

  const openWalletDialog = useCallback((type: 'setup' | 'deposit', reqAmount: number = 0, boardIdToEnter: string | null = null) => {
    setTargetBoardId(boardIdToEnter); 
    if (type === 'setup') setIsWalletSetupDialogOpen(true);
    else { setRequiredDepositAmount(reqAmount); setIsDepositDialogOpen(true); }
  }, []);

  const handleProtectedAction = useCallback(() => setIsLoginModalOpen(true), []);

  // Updated handleBoardAction: Manages UI interaction stages.
  // Actual cloud function calls for entry are now in QuickEntrySelector and SweepstakesBoardCard.
  const handleBoardAction = useCallback(async (action: string, boardId: string, value?: any) => {
    if (['START_ENTRY', 'SET_NUMBER', 'REQUEST_CONFIRM', 'CANCEL_CONFIRM'].includes(action) && !currentUserId) {
        setIsLoginModalOpen(true); 
        return;
    }

    switch (action) {
        case 'START_ENTRY':
            setEntryInteraction({ boardId, stage: 'selecting', selectedNumber: null });
            break;
        case 'SET_NUMBER':
            if (entryInteraction.boardId !== boardId && entryInteraction.stage !== 'idle') {
                setEntryInteraction({ boardId, stage: 'selecting', selectedNumber: value });
            } else {
            setEntryInteraction(prev => ({ ...prev, boardId, selectedNumber: value, stage: 'selecting' }));
            }
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
            if (entryInteraction.boardId === boardId || boardId === null) { // Allow global reset if boardId is null from a general success signal
                 setEntryInteraction({ boardId: null, stage: 'idle', selectedNumber: null });
            }
            break;
        default:
            console.warn("Unknown board action in LobbyPage handler:", action, boardId, value);
    }
  }, [currentUserId, entryInteraction.boardId, entryInteraction.stage, entryInteraction.selectedNumber]);

  if (authLoading) {
      return <div className="flex items-center justify-center min-h-screen bg-background-primary text-white">Authenticating...</div>; 
  }

  const displayLoading = selectedSport === SWEEPSTAKES_SPORT_ID ? isLoadingSweepstakesData : isLoadingGamesAndTeams;
  const displayError = selectedSport === SWEEPSTAKES_SPORT_ID ? sweepstakesDataError : gamesAndTeamsError;

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-background-primary">
      <Toaster position="top-center" />
      <div className="sticky top-0 z-20"><InAppHeader /></div>
      <div className="flex-grow">
        <main className="px-4 py-2"> 
        <div className="max-w-3xl mx-auto w-full">
            <SportSelector 
              sports={initialSportsData} 
              selectedSportId={selectedSport} 
              onSelectSport={handleSelectSport} 
              sweepstakesStartTime={sweepstakesStartTime} 
            />
            {displayLoading ? (
              <div className="text-center text-white py-10">Loading Lobby Data...</div>
            ) : displayError ? (
              <div className="text-center text-red-500 py-10">Error: {displayError}</div>
            ) : (
              selectedSport === SWEEPSTAKES_SPORT_ID ? (
                <>
                  {sweepstakesGame && sweepstakesBoard && sweepstakesTeams[sweepstakesGame.teamA.id] && sweepstakesTeams[sweepstakesGame.teamB.id] ? (
                    <>
                      {/* Conditionally render only when user is loaded and not loading */}
                      {!authLoading && user ? (
                        <>
                      <SweepstakesScoreboard 
                             awayTeam={sweepstakesTeams[sweepstakesGame.teamA.id]!}
                             homeTeam={sweepstakesTeams[sweepstakesGame.teamB.id]!}
                          status={sweepstakesGame.status}
                             gameTime={sweepstakesGame.period}
                             quarter={sweepstakesGame.quarter}
                             awayScore={sweepstakesGame.away_score}
                             homeScore={sweepstakesGame.home_score}
                           />
                      <SweepstakesBoardCard 
                            key={sweepstakesBoard.id}
                             board={{...sweepstakesBoard, teamA: sweepstakesTeams[sweepstakesGame.teamA.id]!, teamB: sweepstakesTeams[sweepstakesGame.teamB.id]! }}
                             user={user} // Pass the whole user object
                             currentUserId={currentUserId} // Still passing uid for potential direct use
                         onProtectedAction={handleProtectedAction}
                         entryInteraction={entryInteraction}
                         handleBoardAction={handleBoardAction}
                         openWalletDialog={openWalletDialog} 
                            walletHasWallet={walletHasWallet}
                             walletBalance={walletBalance}
                             walletIsLoading={walletIsLoading}
                          />
                        </>
                      ) : (
                        // Show a loading state while authenticating
                         <div className="text-center text-white py-10">Authenticating...</div>
                      )}
                    </>
                  ) : (
                     <div className="text-center text-gray-400 py-10 mt-6">No Sweepstakes Board or complete Game data missing.</div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-white mt-6 mb-2">Games</h2>
                  {games.length > 0 ? (
                     <GamesList games={games} teams={teams} user={user} onProtectedAction={handleProtectedAction} />
                  ) : (
                     <p className="text-gray-400 text-center py-4">No games available for {initialSportsData.find(s => s.id === selectedSport)?.name || selectedSport.toUpperCase()}.</p>
                  )}
                  <h2 className="text-lg font-semibold text-white mt-6 mb-2">Boards</h2>
                   {games.length > 0 ? (
                     <BoardsList 
                       games={games}
                       teams={teams}
                       user={user} 
                       currentUserId={currentUserId}
                       onProtectedAction={handleProtectedAction} 
                       entryInteraction={entryInteraction}
                       handleBoardAction={handleBoardAction} // Pass down for UI state
                       openWalletDialog={openWalletDialog}
                     />
                  ) : (
                     <p className="text-gray-400 text-center py-4">No boards to display as there are no games for {initialSportsData.find(s => s.id === selectedSport)?.name || selectedSport.toUpperCase()}.</p>
                  )}
                </>
              )
            )}
        </div> 
        </main>
      </div> 
      <BottomNav user={user} onProtectedAction={handleProtectedAction} /> 
      {(isLoginModalOpen || isWalletSetupDialogOpen || isDepositDialogOpen) && <StarfieldBackground className="z-40" />}
      {/* Dialogs (as before) */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}><DialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b] to-[#5855e4] to-15% border-accent-1/50 text-white py-8"><DialogHeader className="text-center items-center"><DialogTitle className="text-2xl font-bold mb-2">Login Required</DialogTitle><DialogDescription className="text-gray-300 opacity-90">You need to be logged in or create an account to perform this action.</DialogDescription></DialogHeader><div className="flex flex-col sm:flex-row gap-3 mt-6 mb-2"><Button onClick={() => router.push('/login')} className="flex-1 bg-accent-1 hover:bg-accent-1/80 text-white font-semibold">Login</Button><Button onClick={() => router.push('/signup')} variant="outline" className="flex-1 bg-transparent border-gray-500 hover:bg-gray-500/20 text-gray-300 font-semibold hover:text-gray-300">Sign Up</Button></div></DialogContent></Dialog>
      <Dialog open={isWalletSetupDialogOpen} onOpenChange={setIsWalletSetupDialogOpen}><DialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b] to-[#5855e4] to-15% border-accent-1/50 text-white py-8"><DialogHeader className="text-center items-center"><DialogTitle className="flex items-center justify-center text-2xl font-bold mb-2">Wallet Setup Required</DialogTitle><DialogDescription className="text-gray-300 opacity-90">You need to set up your wallet before you can deposit funds or enter contests.</DialogDescription></DialogHeader><div className="flex flex-col sm:flex-row gap-3 mt-6 mb-2"><Button onClick={() => { setIsWalletSetupDialogOpen(false); router.push('/wallet-setup/location'); }} className="flex-1 bg-accent-1 hover:bg-accent-1/80 text-white font-semibold">Go to Wallet Setup</Button><Button type="button" variant="outline" onClick={() => setIsWalletSetupDialogOpen(false)} className="flex-1 bg-transparent border-gray-500 hover:bg-gray-500/20 text-gray-300 font-semibold hover:text-gray-300">Cancel</Button></div></DialogContent></Dialog>
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}><DialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b] to-[#5855e4] to-15% border-accent-1/50 text-white py-8"><DialogHeader><DialogTitle className="flex items-center text-xl font-semibold">Insufficient Funds</DialogTitle><DialogDescription className="text-gray-300 opacity-90 pt-2">You need at least ${requiredDepositAmount.toFixed(2)} more to enter this board.</DialogDescription></DialogHeader><DialogFooter className="mt-4 gap-2 sm:justify-center"><Button type="button" variant="outline" onClick={() => setIsDepositDialogOpen(false)} className="border-gray-500 hover:bg-gray-500/20 text-gray-300 hover:text-gray-300">Cancel</Button><Button type="button" onClick={() => { setIsDepositDialogOpen(false); router.push('/wallet'); }} className="bg-accent-1 hover:bg-accent-1/80 text-white font-semibold">Add Funds</Button></DialogFooter></DialogContent></Dialog>
          </div>
  );
} 