import React, { memo, useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User as FirebaseUser } from 'firebase/auth';
import { Board as BoardType, Game as GameType, TeamInfo } from '@/types/lobby';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, limit, DocumentData, DocumentReference, doc } from 'firebase/firestore';
import { BOARD_STATUS_OPEN } from '@/config/lobbyConfig';

import BoardMiniGrid from './BoardMiniGrid';
import QuickEntrySelector from './QuickEntrySelector';

// Local EntryInteractionState definition (if not imported globally)
interface EntryInteractionState {
  boardId: string | null;
  stage: 'idle' | 'selecting' | 'confirming';
  selectedNumber: number | string | null;
}

interface BoardCardProps {
    game: GameType; // Receives the full game object (with resolved teams)
    teamA: TeamInfo; // Redundant if game.teamA is guaranteed by LobbyPage
    teamB: TeamInfo; // Redundant if game.teamB is guaranteed by LobbyPage
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
    // teamA, // Use game.teamA directly
    // teamB, // Use game.teamB directly
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

  // State for the single active board associated with this game
  const [activeBoard, setActiveBoard] = useState<BoardType | null>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState<boolean>(true);
  const [boardError, setBoardError] = useState<string | null>(null);

  // Effect to listen for the active board for this game
  useEffect(() => {
    if (!game?.id) {
      setIsLoadingBoard(false);
      setActiveBoard(null);
      return () => {}; // Return empty cleanup
    }

    setIsLoadingBoard(true);
    setBoardError(null);

    const boardsRef = collection(db, 'boards');
    // Query for the single open board linked to this specific game.id
    const q = query(
      boardsRef, 
      where("gameID", "==", doc(db, 'games', game.id)), // Query using DocumentReference
      where("status", "==", BOARD_STATUS_OPEN), 
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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

    return () => unsubscribe(); // Cleanup listener on unmount or game change

  }, [game.id, game.teamA, game.teamB]); // Depend on game.id and resolved teams

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
    // Render game info but indicate no open board
    return (
      <div className={`w-full max-w-[390px] h-auto mx-auto p-4 text-white relative overflow-hidden flex flex-col 
                       ${gradientBg} border border-gray-700/50 ${shadowStyle} ${containerRounding} opacity-70`}>
          <div className="flex justify-between items-center mb-3">
              {/* Simplified Team Info Display */} 
              <div className="flex items-center space-x-2 w-1/3 justify-start">
                  {teamA?.logo && <Image src={teamA.logo} alt={`${teamA.name} logo`} width={45} height={45} className="rounded-full object-contain flex-shrink-0 opacity-50" />}
                  <div className="flex flex-col"><div className="font-semibold text-sm text-gray-400 truncate">{teamA?.name}</div><div className="text-xs text-gray-500">{teamA?.record}</div></div>
              </div>
              <div className="text-gray-600 font-bold text-xl text-center">@</div>
              <div className="flex items-center space-x-2 w-1/3 justify-end">
                  <div className="flex flex-col items-end"><div className="font-semibold text-sm text-gray-400 truncate">{teamB?.name}</div><div className="text-xs text-gray-500">{teamB?.record}</div></div>
                  {teamB?.logo && <Image src={teamB.logo} alt={`${teamB.name} logo`} width={45} height={45} className="rounded-full object-contain flex-shrink-0 opacity-50" />}
              </div>
          </div>
          <div className="text-center text-gray-500 py-10">No open board currently available for this game.</div>
      </div>
    );
  }

  // --- Render Card with Active Board --- 
  return (
    <div
      className={`w-full max-w-[390px] h-auto mx-auto p-4 text-white relative overflow-hidden flex flex-col 
                 ${gradientBg} ${borderStyle} ${shadowStyle} ${containerRounding} ${isActiveInteraction ? 'border-[#5855e4]' : 'border-transparent'}`}>
      {activeBoard.isFreeEntry && (
         <div className="absolute top-0 left-0 bg-gradient-accent1-accent4 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10">
          Free Entry!
        </div>
      )}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2 w-1/3 justify-start">
          {teamA?.logo ? (
            <Image src={teamA.logo} alt={`${teamA.name} logo`} width={45} height={45} className="rounded-full object-contain flex-shrink-0" style={logoFilterStyleA}/>
          ) : (
            <div className="w-[45px] h-[45px] rounded-full bg-gray-600 flex-shrink-0"></div>
          )}
          <div className="flex flex-col">
            <div className="font-semibold text-sm text-white truncate">{teamA?.name}</div>
            <div className="text-xs text-gray-400">{teamA?.record}</div>
          </div>
        </div>
        <div className="text-accent-1 font-bold text-xl text-center">@</div>
        <div className="flex items-center space-x-2 w-1/3 justify-end">
          <div className="flex flex-col items-end">
            <div className="font-semibold text-sm text-white truncate">{teamB?.name}</div>
            <div className="text-xs text-gray-400">{teamB?.record}</div>
          </div>
          {teamB?.logo ? (
            <Image src={teamB.logo} alt={`${teamB.name} logo`} width={45} height={45} className="rounded-full object-contain flex-shrink-0" style={logoFilterStyleB}/>
          ) : (
            <div className="w-[45px] h-[45px] rounded-full bg-gray-600 flex-shrink-0"></div>
          )}
        </div>
      </div>
      <div className="flex flex-row items-center space-x-4 flex-grow mt-4">
        <Link href={`/game/${game.id}?board=${activeBoard.id}`} legacyBehavior passHref>
          <a onClick={handleGridLinkClick} className="block w-[65%] relative bg-transparent rounded-lg overflow-hidden cursor-pointer border-[1.5px] border-slate-300 shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.25)] hover:ring-2 hover:ring-accent-1 transition-all duration-200">
            <div className="absolute inset-0 z-0">
              <Image src="/images/nfl-grid-background.png" alt="Grid background" fill style={{ objectFit: 'cover' }} className="rounded-lg"/>
            </div>
            <div className="relative z-10">
               <BoardMiniGrid 
                 boardData={activeBoard} // Pass the live board data 
                 currentUserId={currentUserId} // Pass user ID for its internal query
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
              gameId={game.id} 
              takenNumbers={takenNumbersSet} // Pass the taken set from the fetched board
            />
        </div>
      </div>
    </div>
  );
});
BoardCard.displayName = 'BoardCard';

export default BoardCard;
