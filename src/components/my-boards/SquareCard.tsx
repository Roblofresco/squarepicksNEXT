import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, CheckSquare, Loader2, Clock, Trophy, XCircle, AlertTriangle } from 'lucide-react';

// Interface Definitions (Should match MyBoardsPage.tsx)
interface TeamInfo {
  name: string;
  logo?: string;
  color?: string;
  textColor?: string;
  initials?: string;
}

interface BoardSquare { 
  index: number; 
  x?: number; 
  y?: number; 
  isUserSquare: boolean;
  isWinningSquare?: boolean;
  square?: string;
}

type BoardStatus = 
  | 'open'
  | 'full'
  | 'IN_PROGRESS_Q1'
  | 'IN_PROGRESS_Q2'
  | 'IN_PROGRESS_Q3'
  | 'IN_PROGRESS_HALFTIME'
  | 'IN_PROGRESS_Q4'
  | 'IN_PROGRESS_OT'
  | 'FINAL_WON' 
  | 'FINAL_LOST' 
  | 'CANCELLED';

interface AppBoard {
  id: string;
  gameId: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  gameDateTime: string; 
  status: BoardStatus;
  is_live?: boolean; 
  broadcast_provider?: string; 
  stake?: number;
  winnings?: number;
  home_axis_numbers?: string[]; 
  away_axis_numbers?: string[]; 
  sport?: string; 
  league?: string; 
  userSquareSelectionCount?: number; 
  totalSquareCount?: number; 
  userPickedSquares?: BoardSquare[]; 
  selected_indexes_on_board?: number[]; 
  q1_winning_index?: number;
  q2_winning_index?: number;
  q3_winning_index?: number;
  q4_winning_index?: number;
}
// End of Interface Definitions

interface SquareCardProps {
  board: AppBoard;
  onClick: (boardId: string) => void;
}

const getStatusAppearance = (status: BoardStatus | string, isLive?: boolean, isBoardFull?: boolean) => {
  if (status === 'open') {
    if (isBoardFull && isLive) {
      return { text: 'LIVE', color: 'bg-red-600 hover:bg-red-700 animate-pulse', icon: <Clock className="h-3.5 w-3.5" /> };
    } else if (isBoardFull) {
      return { text: 'Full', color: 'bg-orange-500 hover:bg-orange-600', icon: <Info className="h-3.5 w-3.5" /> };
    }
    return { text: 'Picks Open', color: 'bg-blue-600 hover:bg-blue-700', icon: <CheckSquare className="h-3.5 w-3.5" /> };
  }
  
  switch (status) {
    case 'IN_PROGRESS_Q1':
    case 'IN_PROGRESS_Q2':
    case 'IN_PROGRESS_Q3':
    case 'IN_PROGRESS_HALFTIME':
    case 'IN_PROGRESS_Q4':
    case 'IN_PROGRESS_OT':
      return { text: 'In Progress', color: 'bg-yellow-500', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> };
    case 'FINAL_WON':
      return { text: 'Won', color: 'bg-green-600', icon: <Trophy className="h-3.5 w-3.5" /> };
    case 'FINAL_LOST':
      return { text: 'Lost', color: 'bg-slate-600', icon: <XCircle className="h-3.5 w-3.5" /> };
    case 'CANCELLED':
      return { text: 'Cancelled', color: 'bg-red-700', icon: <AlertTriangle className="h-3.5 w-3.5" /> };
    default:
      const statusString = typeof status === 'string' ? status : String(status);
      const defaultText = statusString.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()); 
      return { text: defaultText, color: 'bg-gray-500', icon: <Info className="h-3.5 w-3.5"/> };
  }
};

const SquareCard: React.FC<SquareCardProps> = ({ board, onClick }) => {
  const { 
    id, homeTeam, awayTeam, gameDateTime, status, 
    sport, userPickedSquares,
    is_live, selected_indexes_on_board, broadcast_provider,
    totalSquareCount,
    q1_winning_index, q2_winning_index, q3_winning_index, q4_winning_index
  } = board;

  const isBoardFull = totalSquareCount !== undefined && 
                      selected_indexes_on_board !== undefined && 
                      selected_indexes_on_board.length >= totalSquareCount;

  const statusAppearance = getStatusAppearance(status, is_live, isBoardFull);
  const gameDate = new Date(gameDateTime);

  const renderDynamicInfoLine = () => {
    const dateOptions: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    
    const formattedDate = gameDate.toLocaleDateString(undefined, dateOptions);
    const formattedTime = gameDate.toLocaleTimeString(undefined, timeOptions);

    let dateTimeLine = "";
    let broadcastLine = "";

    if (is_live) {
      dateTimeLine = "Live";
    } else if (status === 'open') {
      dateTimeLine = `${formattedDate}, ${formattedTime}`;
    } else {
      const simpleStatus = String(status).replace(/IN_PROGRESS_|FINAL_/g, '').replace('_', ' ');
      dateTimeLine = `${formattedDate}, ${formattedTime} - ${simpleStatus}`;
    }

    if (broadcast_provider && !is_live) {
      broadcastLine = broadcast_provider;
    }
    
    return (
      <>
        {dateTimeLine}
        {broadcastLine && <br />}
        {broadcastLine}
      </>
    );
  };

  const winningIndexesList = [
    { label: "Q1", index: q1_winning_index },
    { label: "Q2", index: q2_winning_index },
    { label: "Q3", index: q3_winning_index },
    { label: "Q4/F", index: q4_winning_index }
  ].filter(item => typeof item.index === 'number');

  return (
    <Card 
      className="w-full max-w-sm overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col bg-slate-800 text-slate-100 cursor-pointer h-full border border-slate-700 rounded-lg"
      onClick={() => onClick(id)}
    >
      <CardHeader className="p-3 relative">
        {sport && (
          <Badge variant="outline" className="absolute top-2 left-2 text-xs px-1.5 py-0.5 border-slate-600 bg-slate-700 text-slate-300">{sport.toUpperCase()}</Badge>
        )}
        <Badge variant="default" className={`${statusAppearance.color} text-white text-xs px-2 py-0.5 absolute top-2 right-2 rounded-md flex items-center shadow-md`}>
            {statusAppearance.icon}
            <span className="ml-1 font-medium">{statusAppearance.text}</span>
        </Badge>
        
        <div className="flex items-center justify-around text-center mt-5 pt-2">
          <div className="flex flex-col items-center w-2/5">
            {homeTeam.logo ? 
              <Image src={homeTeam.logo} alt={homeTeam.name} width={40} height={40} className="mb-1 rounded-md object-contain h-10 w-10" />
              : <div className="h-10 w-10 mb-1 bg-slate-700 rounded-md flex items-center justify-center text-slate-500 text-xs">No Logo</div>
            }
            <CardTitle className="text-sm font-semibold truncate" title={homeTeam.name}>{homeTeam.name}</CardTitle>
          </div>
          <div className="text-lg font-bold text-slate-400 mx-1">VS</div>
          <div className="flex flex-col items-center w-2/5">
            {awayTeam.logo ? 
              <Image src={awayTeam.logo} alt={awayTeam.name} width={40} height={40} className="mb-1 rounded-md object-contain h-10 w-10" />
              : <div className="h-10 w-10 mb-1 bg-slate-700 rounded-md flex items-center justify-center text-slate-500 text-xs">No Logo</div>
            }
            <CardTitle className="text-sm font-semibold truncate" title={awayTeam.name}>{awayTeam.name}</CardTitle>
          </div>
        </div>
        
        <CardDescription className="text-xs text-center text-slate-400 mt-2 min-h-[2em]">
          {renderDynamicInfoLine()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-3 flex-grow mt-1 border-t border-slate-700/50 text-xs">
        {userPickedSquares && userPickedSquares.length > 0 && (
          <div className="text-slate-300 mb-1">
            <span className="font-medium text-slate-100">Selected:</span> {userPickedSquares.map(s => s.index).join(', ')}
          </div>
        )}

        {userPickedSquares && userPickedSquares.length > 0 && (
           <div className="text-slate-300 mb-1 mt-0.5">
             <span className="font-medium text-slate-100">Picks:</span> 
             {status === 'open' ? (
                <span className="italic text-slate-400">Picks pending...</span>
             ) : (
                userPickedSquares.map(pick => pick.square || "N/A").join(', ')
             )}
           </div>
        )}

        {winningIndexesList.length > 0 && (
          <div className="text-slate-300 mt-1">
            <span className="font-medium text-slate-100">Winning Indexes: </span>
            {winningIndexesList.map((item, idx) => (
              <span key={item.label}>{item.label}: {item.index}{idx < winningIndexesList.length - 1 ? ', ' : ''}</span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SquareCard; 