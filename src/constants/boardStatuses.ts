/**
 * Board Status Constants
 * 
 * These constants define which board statuses belong in Active vs History tabs.
 * Status flow: open → full → active → final/unfilled
 */

export const ACTIVE_BOARD_STATUSES = [
  'open',   // Accepting entries - users can still select squares
  'full',   // All squares filled, numbers assigned, waiting for game start
  'active'  // Game is live, board is in play
] as const;

export const HISTORY_BOARD_STATUSES = [
  'unfilled',           // Game started without filling → users automatically refunded, board closed
  'closed',             // Game ended, winners paid, board complete
  'IN_PROGRESS_Q1',     // In-game statuses (transitional)
  'IN_PROGRESS_Q2',
  'IN_PROGRESS_Q3',
  'IN_PROGRESS_HALFTIME',
  'IN_PROGRESS_Q4',
  'IN_PROGRESS_OT',
  'FINAL_WON',          // Game ended - user won
  'FINAL_LOST',         // Game ended - user lost
  'CANCELLED'           // Game cancelled
] as const;

export type ActiveBoardStatus = typeof ACTIVE_BOARD_STATUSES[number];
export type HistoryBoardStatus = typeof HISTORY_BOARD_STATUSES[number];
export type BoardStatus = ActiveBoardStatus | HistoryBoardStatus;

