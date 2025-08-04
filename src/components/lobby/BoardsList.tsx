'use client';
import React, { memo, useEffect } from 'react';
import { Game as GameType, TeamInfo, Board as BoardType } from '@/types/lobby';
import { User as FirebaseUser } from 'firebase/auth';
import { useWallet } from '@/hooks/useWallet';

// Import the centralized BoardCard component
import BoardCard from './BoardCard';

// Define EntryInteractionState locally if not imported
interface EntryInteractionState {
  boardId: string | null;
  stage: 'idle' | 'selecting' | 'confirming';
  selectedNumber: number | string | null;
}

// Updated BoardsListProps
interface BoardsListProps {
  games: GameType[];
  teams: Record<string, TeamInfo>;
  user: FirebaseUser | null;
  currentUserId?: string | null;
  onProtectedAction: () => void;
  entryInteraction: EntryInteractionState;
  handleBoardAction: (action: string, boardId: string, value?: any) => void;
  openWalletDialog: (type: 'setup' | 'deposit', reqAmount?: number, boardIdToEnter?: string | null) => void;
  walletHasWallet: boolean | null;
  walletBalance: number;
  walletIsLoading: boolean;
}

const BoardsList = memo((props: BoardsListProps) => {
  const {
    games,
    teams,
    user, 
    currentUserId,
    onProtectedAction, 
    entryInteraction,
    handleBoardAction,
    openWalletDialog
  } = props;

  // const { 
  //     balance: walletBalance = 0, 
  //     hasWallet: walletHasWallet = null, 
  //     isLoading: walletIsLoading = true, 
  //     error: walletError 
  // } = useWallet();

  // useEffect(() => {
  //   if(walletError) {
  //       console.error("Wallet Hook Error in BoardsList:", walletError);
  //   }
  // }, [walletError]);

  if (games.length === 0) {
    return <p className="text-gray-400 text-center py-4">No relevant games found to display boards.</p>;
  }

  return (
    <div className="space-y-4">
      {games.map((game) => {
        const teamA = game.away_team_id ? teams[game.away_team_id.id] : undefined;
        const teamB = game.home_team_id ? teams[game.home_team_id.id] : undefined;
        
        if (!teamA || !teamB) {
          console.warn(`Missing team data for game ${game.id}, cannot render BoardCard.`);
          return null;
        }

        return (
        <BoardCard
            key={game.id}
            game={game}
            user={user}
            currentUserId={currentUserId}
            onProtectedAction={onProtectedAction}
            entryInteraction={entryInteraction}
            handleBoardAction={handleBoardAction}
            walletHasWallet={props.walletHasWallet}
            walletBalance={props.walletBalance}
            walletIsLoading={props.walletIsLoading}
            openWalletDialog={openWalletDialog}
        />
        );
      })}
    </div>
  );
});
BoardsList.displayName = 'BoardsList';

export default BoardsList; 