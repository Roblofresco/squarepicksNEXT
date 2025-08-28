'use client'; // Add use client directive

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import { DollarSign, ArrowDownCircle, ArrowUpCircle, History, Loader2, ArrowLeft, Home } from 'lucide-react'; // Import Home
import { RiWallet3Fill } from 'react-icons/ri';
import { useWallet } from '@/hooks/useWallet'; // Import the hook
import { Button } from '@/components/ui/button'; // Import Button
import { db } from '@/lib/firebase'; // Assuming Firebase initialized here
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { Transaction } from '@/types'; // Assuming Transaction type exists
import { format } from 'date-fns'; // For formatting timestamps
import { motion } from 'framer-motion';
import { HeroText } from '@/components/ui/hero-text';
import WalletMoneyContainer from '@/components/ui/WalletMoneyContainer';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { useSearchParams } from 'next/navigation';

// Remove hardcoded data
// const userData = {
//   balance: 123.45, // Using the balance from the profile context
// };

const WalletPage = () => {
  const router = useRouter(); // Get router instance
  const searchParams = useSearchParams();
  const { 
    hasWallet, 
    balance, 
    isLoading: walletLoading, 
    error: walletError, 
    initializeWallet, 
    userId, 
    emailVerified // Add emailVerified from useWallet
  } = useWallet();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false); // Separate loading state
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('');

  // Load user's first name for greeting
  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data() as any : null;
        setFirstName((data?.firstName || '').toString());
      } catch (e) {
        // no-op for greeting
      }
    };
    load();
  }, [userId]);

  // New useEffect for redirection based on email verification status
  useEffect(() => {
    if (!walletLoading) { // Only act once auth/wallet state is resolved
      if (userId && emailVerified === false) {
        router.push('/verify-email');
      } 
      // If !userId (user not logged in), the page already has logic to prompt login.
    }
  }, [userId, emailVerified, walletLoading, router]);

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
            limit(5) // Fetch the 5 most recent
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
    <div className="bg-background-primary text-text-primary h-full">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col h-full">
        {/* Breadcrumbs */}
        {(() => {
          const prevHref = searchParams.get('prevHref') || undefined;
          const backHref = '/profile';
          return (
            <Breadcrumbs className="mb-3 pl-4 sm:pl-6 mt-2 sm:mt-3" ellipsisOnly backHref={backHref} ellipsisUseHistory={false} />
          );
        })()}

        {/* Title and greeting */}
        <div className="mb-4 pl-4 sm:pl-6">
          <h1 className="text-3xl font-bold text-text-primary">Wallet</h1>
          {firstName ? (
            <p className="mt-3 text-sm text-gray-300">Hello {firstName},</p>
          ) : null}
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
          <div className="flex flex-col h-full">
            {/* Balance Display (no container, centered) */}
            <div className="mb-6 text-center">
              <p className="text-sm uppercase tracking-wider mb-1 text-gray-300">Current Balance</p>
              <p className="text-5xl font-extrabold text-text-primary">${balance.toFixed(2)}</p>
            </div>

            {/* Action Buttons (circular, outlined accent-1, gradient subtle fill) */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <Link href="/deposit" className="group inline-flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-1/60 rounded-full">
                <div className="h-16 w-16 rounded-full border-2 border-accent-1 bg-gradient-to-b from-background-primary to-accent-1/10 grid place-items-center transition-transform group-active:scale-95">
                  <ArrowDownCircle className="w-7 h-7 text-accent-1" />
                </div>
                <div className="relative mt-2">
                  <HeroText id="deposit" className="text-sm text-text-primary">Deposit</HeroText>
                </div>
                </Link>
              <Link href="/withdraw" className="group inline-flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-1/60 rounded-full">
                <div className="h-16 w-16 rounded-full border-2 border-accent-1 bg-gradient-to-b from-background-primary to-accent-1/10 grid place-items-center transition-transform group-active:scale-95">
                  <ArrowUpCircle className="w-7 h-7 text-accent-1" />
                </div>
                <span className="mt-2 text-sm text-text-primary">Withdraw</span>
                </Link>
            </div>

            <WalletMoneyContainer
              title="Recent Activity"
              variant="blue"
              bottomless
              className="w-full mt-16 flex flex-col flex-1"
              footer={(
                <div className="text-center text-xs text-white/80">
                  <Link href="/terms" className="underline hover:text-white">Terms of Service</Link>
                  <span className="mx-2">•</span>
                  <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>
                  <span className="mx-2">•</span>
                  <Link href="/support" className="underline hover:text-white">Need help?</Link>
                </div>
              )}
            >
              <div className="flex-1 flex flex-col">
                {/* Recent list */}
                {loadingTransactions && (
                  <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse p-4 bg-black/20 backdrop-blur-sm rounded-lg border border-white/5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)]">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            <div className="h-6 w-32 bg-white/5 rounded" />
                            <div className="h-4 w-24 bg-white/5 rounded" />
                          </div>
                          <div className="space-y-2 text-right">
                            <div className="h-4 w-20 bg-white/5 rounded" />
                            <div className="h-5 w-16 bg-white/5 rounded-full ml-auto" />
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                )}
                {!loadingTransactions && transactionError && (
                    <p className="text-destructive text-center py-4">{transactionError}</p>
                )}
                {!loadingTransactions && !transactionError && recentTransactions.length === 0 && (
                  <p className="text-gray-100/80 text-center py-4">No recent activity found.</p>
                )}
                {!loadingTransactions && !transactionError && recentTransactions.length > 0 && (
                    <div className="space-y-3">
                        {recentTransactions.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center p-4 bg-black/20 hover:bg-black/30 backdrop-blur-sm transition-all duration-200 rounded-lg border border-white/5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)]">
                                <div>
                                    <p className={`font-medium text-lg ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)} {tx.currency}
                                    </p>
                                    <p className="text-sm text-white/60 capitalize">{tx.description || tx.type.replace('_', ' ')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-white/40">{tx.timestamp ? format(tx.timestamp.toDate(), 'MMM d, p') : 'Invalid Date'}</p>
                                    <p className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block backdrop-blur-md ${
                                        tx.status === 'completed' 
                                            ? 'bg-green-500/10 text-green-400 border border-green-400/20' 
                                            : tx.status === 'pending' 
                                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-400/20' 
                                                : 'bg-red-500/10 text-red-400 border border-red-400/20'
                                    }`}>
                                        {tx.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* View All inside container */}
                <div className="mt-auto text-center">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="inline-block">
                <Link href="/transactions" className="inline-flex items-center justify-center px-4 py-2 rounded-md border-accent-4 text-accent-4 hover:bg-accent-4/10 hover:text-accent-4 active:scale-95 focus:scale-105 transition-all duration-150">
                  <History className="w-4 h-4 mr-2" />
                  View All Transactions
                </Link>
              </motion.div>
            </div>
              </div>
            </WalletMoneyContainer>
          </div>
        )}

        {!walletLoading && !userId && (
             <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-8 text-center">
                <p>Please <Link href="/login?redirect=/wallet" className="font-bold underline">log in</Link> to view your wallet.</p>
            </div>
        )}

        {/* Footer removed here — moved inside WalletMoneyContainer */}

      </motion.div>
    </div>
  );
};

export default WalletPage; 