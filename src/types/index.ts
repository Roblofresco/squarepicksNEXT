// src/types/index.ts

// Defines the structure for a transaction document in Firestore
export interface Transaction {
  id: string; // Firestore document ID
  userID: string; // ID of the user this transaction belongs to
  type: 'deposit' | 'withdrawal_request' | 'entry_fee' | 'sweepstakes_entry' | 'winnings' | 'refund' | string; // Type of transaction
  amount: number; // Transaction amount (positive for deposits/payouts, negative for withdrawals/fees)
  currency: string; // Currency code (e.g., 'USD')
  status: 'completed' | 'pending' | 'failed' | 'pending_review' | 'processing' | 'rejected' | string; // Status of the transaction
  timestamp: import('firebase/firestore').Timestamp; // Firestore Timestamp of when it occurred
  description?: string; // Optional description of the transaction
  paypalOrderID?: string; // Optional: Link to PayPal order for deposits
  boardId?: string; // Board ID for board-related transactions
  gameId?: string; // Game ID for game-related transactions
  period?: string; // Q1, Q2, Q3, FINAL (stored as uppercase)
  squareIndexes?: number[]; // Array of square indices for entry transactions
}

// You can add other shared types for your application here
// export interface UserProfile { ... }
// export interface Sweepstake { ... } 