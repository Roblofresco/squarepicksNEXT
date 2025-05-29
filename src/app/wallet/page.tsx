'use client'; // Add use client directive

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import { DollarSign, ArrowDownCircle, ArrowUpCircle, History, Loader2, ArrowLeft } from 'lucide-react'; // Import ArrowLeft
import { useWallet } from '@/hooks/useWallet'; // Import the hook
import { Button } from '@/components/ui/button'; // Import Button
import { db } from '@/lib/firebase'; // Assuming Firebase initialized here
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Transaction } from '@/types'; // Assuming Transaction type exists
import { format } from 'date-fns'; // For formatting timestamps

// Remove hardcoded data
// const userData = {
//   balance: 123.45, // Using the balance from the profile context
// };

const WalletPage = () => {
  const router = useRouter(); // Get router instance
  const { hasWallet, balance, isLoading: walletLoading, error: walletError, initializeWallet, userId } = useWallet();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false); // Separate loading state
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const handleInitialize = () => {
    if (!walletLoading) {
      initializeWallet();
    }
  };

  // Back button handler
  const handleBack = () => {
    // Explicitly navigate to the profile page
    router.push('/profile'); 
  };

  // Fetch recent transactions
  useEffect(() => {
    // Log initial state for debugging
    console.log('WalletPage useEffect: Running', { userId, hasWallet });

    if (userId && hasWallet) { // Only fetch if wallet is ready
      console.log('WalletPage useEffect: Conditions met, fetching transactions...');
      const fetchRecentTransactions = async () => {
        setLoadingTransactions(true);
        setTransactionError(null);
        try {
          const transactionsCol = collection(db, 'transactions');
          const q = query(
            transactionsCol,
            where('userID', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(4) // Fetch the 4 most recent
          );
          
          console.log(`WalletPage useEffect: Querying transactions for userID: ${userId}`);

          const querySnapshot = await getDocs(q);
          console.log(`WalletPage useEffect: Query snapshot size: ${querySnapshot.size}`);
          
          const transactions: Transaction[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`WalletPage useEffect: Fetched doc ${doc.id}, timestamp type: ${typeof data.timestamp?.toDate === 'function' ? 'Timestamp' : typeof data.timestamp}`);
            transactions.push({ 
              id: doc.id, 
              ...data,
              timestamp: data.timestamp // Assuming Transaction type expects Firestore Timestamp
            } as Transaction);
          });
          console.log('WalletPage useEffect: Fetched transactions array:', transactions);
          setRecentTransactions(transactions);
        } catch (err) {
          console.error("Error fetching recent transactions:", err);
          setTransactionError("Could not load recent activity.");
        } finally {
          setLoadingTransactions(false);
        }
      };
      fetchRecentTransactions();
    } else {
        console.log('WalletPage useEffect: Conditions NOT met (userId or hasWallet false/null).');
        // Ensure loading is false if we don't fetch
        setLoadingTransactions(false); 
    }
  }, [userId, hasWallet]); // Re-run if userId or hasWallet changes

  return (
    <div className="min-h-screen bg-background-primary text-text-primary p-4 sm:p-6 lg:p-8">
      <div className="max-w-md mx-auto">
        {/* Updated Header with Back Button */}
        <div className="relative mb-6 text-center">
          <button 
            onClick={handleBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-text-primary transition-colors p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-1 focus:ring-offset-2 focus:ring-offset-background-primary active:scale-95 focus:scale-105 transition-all duration-150"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-text-primary">Wallet</h1>
        </div>

        {walletLoading && (
          <div className="flex justify-center items-center p-6 mb-8">
            <Loader2 className="h-8 w-8 animate-spin text-accent-2" />
          </div>
        )}

        {!walletLoading && walletError && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-8 text-center">
            <p>Error: {walletError}</p>
          </div>
        )}

        {!walletLoading && !walletError && userId && !hasWallet && (
          <div className="bg-accent-1/10 border border-accent-1/30 text-accent-1 rounded-lg shadow-lg p-6 mb-8 text-center">
            <h2 className="text-xl font-semibold mb-3">Setup Your Wallet</h2>
            <p className="text-sm mb-4 opacity-80">You need to setup your wallet before you can deposit funds or enter contests.</p>
            <Button onClick={handleInitialize} disabled={walletLoading} className="w-full bg-accent-1 hover:bg-accent-1/90 text-white">
              {walletLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Setup Wallet Now
            </Button>
          </div>
        )}

        {!walletLoading && !walletError && userId && hasWallet && (
          <>
            {/* Balance Display */}
            <div className="bg-gradient-to-br from-accent-1 to-accent-4 text-white rounded-lg shadow-lg p-6 mb-8 text-center">
              <p className="text-sm uppercase tracking-wider mb-1 opacity-80">Current Balance</p>
              {/* Use real balance from hook */}
              <p className="text-4xl font-bold">${balance.toFixed(2)}</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Link
                href="/deposit"
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background-primary to-[#eeeeee] to-5% rounded-lg shadow hover:shadow-md transition-shadow text-center text-gray-900 hover:bg-gray-100 active:scale-95 focus:scale-105 transition-all duration-150 outline-none">
                <ArrowDownCircle className="w-8 h-8 mb-2 text-accent-2" />
                <span className="font-medium">Deposit Funds</span>
              </Link>
              {/* TODO: Implement Withdraw page/functionality */}
              <Link
                href="/withdraw"
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background-primary to-[#eeeeee] to-5% rounded-lg shadow hover:shadow-md transition-shadow text-center text-gray-900 hover:bg-gray-100 active:scale-95 focus:scale-105 transition-all duration-150 outline-none">
                <ArrowUpCircle className="w-8 h-8 mb-2 text-accent-3" />
                <span className="font-medium">Withdraw Funds</span>
              </Link>
            </div>

            {/* Recent Transactions Section - NEW */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">Recent Activity</h2>
                {loadingTransactions && (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        <p className="ml-2 text-gray-600">Loading...</p>
                    </div>
                )}
                {!loadingTransactions && transactionError && (
                    <p className="text-destructive text-center py-4">{transactionError}</p>
                )}
                {!loadingTransactions && !transactionError && recentTransactions.length === 0 && (
                    <p className="text-gray-600 text-center py-4">No recent activity found.</p>
                )}
                {!loadingTransactions && !transactionError && recentTransactions.length > 0 && (
                    <div className="space-y-3">
                        {recentTransactions.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center p-3 bg-gradient-to-b from-background-primary to-[#eeeeee] to-5% rounded-md shadow-sm">
                                <div>
                                    <p className={`font-medium ${tx.amount >= 0 ? 'text-accent-2' : 'text-accent-3'}`}>
                                        {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)} {tx.currency}
                                    </p>
                                    <p className="text-sm text-gray-700 capitalize">{tx.description || tx.type.replace('_', ' ')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-600">{tx.timestamp ? format(tx.timestamp.toDate(), 'MMM d, p') : 'Invalid Date'}</p>
                                    <p className={`text-xs font-semibold ${tx.status === 'completed' ? 'text-green-500' : tx.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {tx.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Link to Full Transaction History - UPDATED */}
            <div className="text-center">
              <Link href="/transactions">
                <Button variant="outline" className="border-accent-4 text-accent-4 hover:bg-accent-4/10 hover:text-accent-4 active:scale-95 focus:scale-105 transition-all duration-150">
                   <History className="w-4 h-4 mr-2" />
                   View All Transactions
                </Button>
              </Link>
            </div>
          </>
        )}

        {!walletLoading && !userId && (
             <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-8 text-center">
                <p>Please <Link href="/login?redirect=/wallet" className="font-bold underline">log in</Link> to view your wallet.</p>
            </div>
        )}

      </div>
    </div>
  );
};

export default WalletPage; 