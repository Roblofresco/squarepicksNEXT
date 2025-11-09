// src/types/lobby.ts

import { Timestamp, DocumentReference } from 'firebase/firestore';
import React from 'react'; // For Sport icon type

// Removed commented-out Timestamp import

// Interface for Sport data used in SportSelector and LobbyPage
export interface Sport {
  id: string;
  name: string;
  iconDefault: string; 
  iconActive: string; 
  // Add other sport properties if needed
  icon?: React.ComponentType<any>; // For UI purposes
}

// Define Team structure for clarity within BoardsList
export interface TeamInfo {
  id: string; // Firestore document ID (or the value from 'team_id' field)
  name: string;
  fullName: string;     // From 'full_name' field in Firestore
  initials: string;     // From 'initials' field in Firestore
  record?: string;      // From 'record' field in Firestore
  logo?: string;        // From 'logo' field in Firestore
  color?: string;       // From 'color' field in Firestore (primary color)
  seccolor?: string;    // From 'seccolor' field in Firestore (secondary color)
  // city?: string;     // Available in Firestore schema if needed
  // sportID?: DocumentReference; // Mapped from 'sportID' reference in Firestore if needed
}

// Define structure for team info specifically within a Game context
export interface GameTeamInfo {
  name: string;
  fullName: string;
  abbreviation: string;
  score?: number;
  logo?: string; // Add optional logo
  color?: string; // Add primary color
  seccolor?: string; // Add secondary color
}

// Interface for Game data used in GamesList and LobbyPage
export interface Game {
  id: string;           // Firestore document ID (or the value from 'game_id' field if it's the primary business key)
  sport: string;        // From 'sport' field in Firestore
  status: string;       // From 'status' field in Firestore (e.g., "scheduled", "live", "final")

  // Normalized camelCase flags (preferred)
  isLive?: boolean;
  isOver?: boolean;
  // Backward-compat fields (snake_case) that may still exist in some docs
  is_live?: boolean;
  is_over?: boolean;

  away_team_id: DocumentReference; // Firestore 'away_team_id' reference
  home_team_id: DocumentReference; // Firestore 'home_team_id' reference

  // These are populated in the application after resolving the _team_id references
  teamA: TeamInfo; 
  teamB: TeamInfo;

  // Normalized start time (preferred)
  startTime?: Timestamp;
  // Backward-compat field
  start_time?: Timestamp;

  // Scores (preferred camelCase)
  awayScore?: number;
  homeScore?: number;
  // Backward-compat score fields
  away_score?: number;
  home_score?: number;

  // Individual quarter scores may also be present on the document

  period?: string;        // Derived from 'quarter' field (e.g., "Q1", "HALFTIME", "FINAL")
  quarter?: string;       // Raw quarter/period label
  
  // Preferred camelCase broadcast provider
  broadcastProvider?: string;
  // Backward-compat field
  broadcast_provider?: string;
  
  // Time remaining for live games
  timeRemaining?: string;
  
  // Winning squares for each period
  q1WinningSquare?: string;
  q2WinningSquare?: string;
  q3WinningSquare?: string;
  finalWinningSquare?: string;
}

// Interface for Board data used in BoardsList and LobbyPage
export interface Board {
  id: string;               // Firestore document ID
  gameID: DocumentReference;  // Firestore 'gameID' reference to a game document
  sweepstakesID?: string;
  
  // teamA and teamB are not directly on the board document according to schema.
  // They would be derived from the associated game (via gameID).
  // Components displaying a board will need to fetch the game, then its teams.
  teamA?: TeamInfo; // For UI, populated from the game related to gameID
  teamB?: TeamInfo; // For UI, populated from the game related to gameID
  
  entryFee: number;         // This will be mapped from the 'amount' field in Firestore
  amount?: number;          // Raw 'amount' field from Firestore (entry fee)
  prize?: number;           // If applicable (e.g. for sweepstakes this comes from SweepstakesInfo)
  
  status?: string;          // From 'status' field in Firestore (e.g., 'open', 'closed', 'full')
  selected_indexes?: number[]; // From 'selected_indexes' array in Firestore
  
  // For sweepstakes boards, as per schema
  sweepstakes_select?: boolean;
  featured?: boolean;       // Indicates if this is the featured sweepstakes board
  // isFreeEntry can be derived: amount === 0 || sweepstakes_select === true
  isFreeEntry?: boolean; 

  // This will be populated by client-side logic in BoardMiniGrid/SweepstakesBoardCard
  // by querying the 'squares' subcollection for the current user.
  currentUserSelectedIndexes?: number[]; 
  
  // Fields from schema not directly used in primary UI model yet, but available:
  // away_numbers?: number[]; 
  // home_numbers?: number[]; 
  // created_time?: Timestamp;
}

// Represents a document in the 'boards/{boardId}/squares' subcollection
export interface SquareEntry {
  id: string;                 // Firestore document ID of this specific square entry
  userID: DocumentReference;  // Firestore 'userID' reference to a user document
  index: number;              // The square number selected (0-99) - matches 'index' in Firestore schema
  selected_time: Timestamp;   // From 'selected_time' field in Firestore
}

// For documents in the 'sweepstakes' collection from memory
export interface SweepstakesInfo {
  id: string; // Firestore document ID
  title: string;
  status: string;
  gameID: DocumentReference;   // Reference to the associated game
  boardIDs?: DocumentReference[]; // Array of references to board documents
  winning_prize?: number;
  count?: number;             // e.g., participant count
  participants?: DocumentReference[]; // Or array of user IDs (schema says array)
  // created_time?: Timestamp;
  // updated_time?: Timestamp;
}
