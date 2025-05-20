// src/types/index.ts

// Defines the structure for a transaction document in Firestore
export interface Transaction {
  id: string; // Firestore document ID
  userID: string; // ID of the user this transaction belongs to
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'payout' | 'adjustment' | string; // Type of transaction
  amount: number; // Transaction amount (positive for deposits/payouts, negative for withdrawals/fees)
  currency: string; // Currency code (e.g., 'USD')
  status: 'completed' | 'pending' | 'failed' | string; // Status of the transaction
  timestamp: import('firebase/firestore').Timestamp; // Firestore Timestamp of when it occurred
  description?: string; // Optional description of the transaction
  paypalOrderID?: string; // Optional: Link to PayPal order for deposits
  // Add any other relevant fields specific to your application:
  // e.g., sweepstakesId?: string;
  // e.g., boardId?: string;
  // e.g., relatedUserId?: string; // For transfers maybe?
}

// You can add other shared types for your application here
// export interface UserProfile { ... }
// export interface Sweepstake { ... } 