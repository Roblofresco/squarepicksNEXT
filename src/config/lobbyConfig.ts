import { Sport } from '@/types/lobby'; // Assuming Sport type is in this path

// --- Initial Sports Data Configuration --- 
export const initialSportsData: Sport[] = [
  // Move Sweepstakes to the beginning
  { id: 'sweepstakes', name: 'Sweepstakes', iconDefault: '', iconActive: '' }, 
  { id: 'nfl', name: 'NFL', iconDefault: '/brandkit/sport-icons/nfl-icon.svg', iconActive: '/brandkit/sport-icons/nfl-icon-white.svg' },
  { id: 'cfb', name: 'CFB', iconDefault: '/brandkit/sport-icons/cfb.svg', iconActive: '/brandkit/sport-icons/cfb-white.svg' },
  { id: 'nba', name: 'NBA', iconDefault: '/brandkit/sport-icons/nba.svg', iconActive: '/brandkit/sport-icons/nba-white.svg' },
  { id: 'wnba', name: 'WNBA', iconDefault: '/brandkit/sport-icons/wnba.svg', iconActive: '/brandkit/sport-icons/wnba-white.svg' },
];

// --- Constants used in Lobby ---
export const SWEEPSTAKES_SPORT_ID = 'sweepstakes';
export const DEFAULT_BOARD_ENTRY_FEE = 1;
export const BOARD_STATUS_OPEN = 'open';
export const FREE_BOARD_ENTRY_FEE = 0; 