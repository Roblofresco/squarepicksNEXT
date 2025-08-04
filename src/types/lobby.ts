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
  status: string;       // From 'status' field in Firestore (e.g., "UPCOMING", "LIVE", "FINAL")
  is_live?: boolean;     // From 'is_live' field in Firestore
  is_over?: boolean;     // From 'is_over' field in Firestore

  away_team_id: DocumentReference; // Firestore 'away_team_id' reference
  home_team_id: DocumentReference; // Firestore 'home_team_id' reference

  // These are populated in the application after resolving the _team_id references
  teamA: TeamInfo; 
  teamB: TeamInfo;

  start_time: Timestamp; // From 'start_time' field in Firestore

  // Scores - using direct fields from Firestore schema for clarity
  away_score?: number;    // From 'away_team_score' in Firestore (or calculated from quarter scores)
  home_score?: number;    // From 'home_team_score' in Firestore (or calculated from quarter scores)
  // Individual quarter scores are also available in Firestore: 
  // away_q1_score, home_q1_score, etc.
  // away_f_score, home_f_score (final scores if different from team_score)

  period?: string;        // Derived from 'quarter' field in Firestore (e.g., "Q1", "HALFTIME", "FINAL")
  quarter?: string;       // Actual 'quarter' field from Firestore
  
  broadcast_provider?: string; // From 'broadcast_provider' field in Firestore
  // game_id?: string; // Specific game identifier if different from document ID, as per schema
  // created_time?: Timestamp; // Available
  // updated_time?: Timestamp; // Available
  // end_time?: Timestamp | null; // Available
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
