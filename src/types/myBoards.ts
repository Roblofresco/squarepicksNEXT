// Centralized types for MyBoards

export interface TeamInfo {
  id?: string;
  name: string;
  fullName?: string;
  initials: string;
  record?: string;
  logo?: string;
  color?: string;
  seccolor?: string;
  textColor?: string;
}

export interface BoardSquare {
  index: number;
  x?: number;
  y?: number;
  isUserSquare: boolean;
  isWinningSquare?: boolean;
  square?: string;
}

export type BoardStatus =
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

export interface AppBoard {
  id: string;
  gameId: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  gameDateTime: string;
  // For Active tab sorting by purchase time
  purchasedAt?: string;
  status: BoardStatus;
  amount?: number;
  pot?: number;
  is_live?: boolean;
  broadcast_provider?: string;
  stake?: number;
  winnings?: number;
  home_axis_numbers?: string[];
  away_axis_numbers?: string[];
  quarterScores?: any[];
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
  // Optional winning squares passed from page listener
  q1_winning_square?: string;
  q2_winning_square?: string;
  q3_winning_square?: string;
  q4_winning_square?: string;
  // Optional flags set by page
  userWon_q1?: boolean;
  userWon_q2?: boolean;
  userWon_q3?: boolean;
  userWon_final?: boolean;
} 