'use client'

export const runtime = 'edge';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have an auth hook
import { db } from '@/lib/firebase'; // Assuming Firebase initialized here
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Transaction } from '@/types'; // Import your Transaction type
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
// import { DateRangePicker } from '@/components/ui/daterangepicker'; // Assuming you have this component - Placeholder for now
import { DateRange } from 'react-day-picker';
import { motion } from 'framer-motion'
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Main Component ---
export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filtering & Sorting State ---
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm] = useState<string>('');
  const [dateRange] = useState<DateRange | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset scroll position for filter tabs
  useEffect(() => {
    const tabsList = document.querySelector('[role="tablist"]');
    if (tabsList) {
      tabsList.scrollLeft = 0;
    }
  }, []);

  // --- Fetching Logic ---
  useEffect(() => {
    if (!authLoading && user) {
      const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
          // Base query - adjust if needed
          const q = query(
            collection(db, 'transactions'),
            where('userID', '==', user.uid), // *** SECURITY: Rules must enforce this ***
            orderBy(sortBy, sortOrder) // Apply initial sort
          );

          // Note: Firestore doesn't support complex OR queries easily or multiple inequality filters.
          // Filtering by type/status/date/search is often best done client-side *after* fetching
          // ordered by timestamp, unless your lists are HUGE.
          // For very large datasets, consider denormalizing or using a search service (Algolia/Typesense).

          const querySnapshot = await getDocs(q);
          const fetchedTransactions: Transaction[] = [];
          querySnapshot.forEach((doc) => {
            fetchedTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
          });
          setTransactions(fetchedTransactions);

        } catch (err) {
          console.error("Error fetching transactions:", err);
          setError("Could not load transaction history.");
        } finally {
          setLoading(false);
        }
      };
      fetchTransactions();
    } else if (!authLoading && !user) {
       router.push('/login?redirect=/transactions');
    }
  }, [user, authLoading, sortBy, sortOrder]); // Refetch if sorting changes

  // --- Client-Side Filtering & Sorting Logic ---
  const filteredAndSortedTransactions = useMemo(() => {
    let result = transactions;

    // Apply Type Filter
    if (filterType !== 'all') {
      result = result.filter(tx => tx.type === filterType);
    }

    // Apply Status Filter
    if (filterStatus !== 'all') {
       result = result.filter(tx => tx.status === filterStatus);
    }

    // Apply Date Range Filter
    if (dateRange?.from && dateRange?.to) {
       result = result.filter(tx => {
           const txDate = tx.timestamp.toDate();
           // Adjust 'to' date to include the whole day
           const toDateEnd = new Date(dateRange.to!);
           toDateEnd.setHours(23, 59, 59, 999);
           return txDate >= dateRange.from! && txDate <= toDateEnd;
       });
    } else if (dateRange?.from) {
         result = result.filter(tx => tx.timestamp.toDate() >= dateRange.from!);
    }

    // Apply Search Term Filter (searches description or paypalOrderID)
    // Search removed per spec

    // Client-side sort (if different from Firestore sort or finer control needed)
    // This example relies on Firestore sorting, but you could implement client sort here.

    return result;
  }, [transactions, filterType, filterStatus, dateRange, searchTerm]);

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / pageSize);
  const paginatedTransactions = filteredAndSortedTransactions.slice((page - 1) * pageSize, page * pageSize);

  // Group by Date (e.g., "8 JANUARY 2023")
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    for (const tx of paginatedTransactions) {
      const key = format(tx.timestamp.toDate(), 'd MMMM yyyy').toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    }
    return groups;
  }, [paginatedTransactions]);

  // --- Event Handlers ---
  const handleClearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    // Optionally reset sort: setSortBy('timestamp'); setSortOrder('desc');
  };

  const SortGlyph = () => (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4.5" width="14" height="2.6" rx="1.3" fill="currentColor"/>
      <rect x="6" y="9" width="11" height="2.6" rx="1.3" fill="currentColor"/>
      <rect x="9" y="13.5" width="8" height="2.6" rx="1.3" fill="currentColor"/>
    </svg>
  );

  // --- Render Logic ---
  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-primary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent-1 mb-4" />
        <p className="text-gray-300">Loading transactions...</p>
      </div>
    );
  }

   if (error) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background-primary p-4">
           <p className="text-red-500">{error}</p>
           <Button onClick={() => router.push('/wallet')} className="mt-4">Back to Wallet</Button>
        </div>
     );
   }

  // --- JSX ---
  return (
    <div className="min-h-screen bg-background-primary text-text-primary p-0 sm:p-0 lg:p-0">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          className="mb-3 pl-4 sm:pl-6 mt-3 sm:mt-4"
          items={[
            { label: 'Profile', href: '/profile' }
          ]}
          appendEllipsisHref="/wallet"
        />

        {/* Title */}
        <div className="mb-8 pl-4 sm:pl-6">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-text-primary">Transaction History</h1>
              <Button variant="ghost" className="text-gray-300 hover:text-text-primary p-2" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} aria-label="Toggle sort order">
                <SortGlyph />
              </Button>
            </div>
            <p className="mt-3 text-sm text-gray-300">Filter transactions by type and sort by date.</p>
          </div>
        </div>

        {/* Filters Row (Tabs) — gradient, centered, horizontally scrollable if needed */}
        <div className="mb-6 px-4 sm:px-6">
          <div className="bg-gradient-to-r from-accent-2 via-accent-4 to-accent-2 rounded-lg p-2 overflow-hidden">
            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as string)} className="w-full" defaultValue="all">
              <TabsList className="bg-transparent p-0 flex overflow-x-auto no-scrollbar w-full justify-start">
                <TabsTrigger value="all" className="flex-shrink-0 min-w-fit px-3 py-1.5 text-xs md:text-sm text-white/70 hover:text-white/90 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-inner data-[state=active]:border data-[state=active]:border-white/20">
                  ALL
                </TabsTrigger>
                <div className="h-4 w-px bg-white/10 my-auto" />
                <TabsTrigger value="deposit" className="flex-shrink-0 min-w-fit px-3 py-1.5 text-xs md:text-sm text-white/70 hover:text-white/90 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-inner data-[state=active]:border data-[state=active]:border-white/20">
                  DEPOSIT
                </TabsTrigger>
                <div className="h-4 w-px bg-white/10 my-auto" />
                <TabsTrigger value="withdrawal_request" className="flex-shrink-0 min-w-fit px-3 py-1.5 text-xs md:text-sm text-white/70 hover:text-white/90 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-inner data-[state=active]:border data-[state=active]:border-white/20">
                  WITHDRAW
                </TabsTrigger>
                <div className="h-4 w-px bg-white/10 my-auto" />
                <TabsTrigger value="entry_fee" className="flex-shrink-0 min-w-fit px-3 py-1.5 text-xs md:text-sm text-white/70 hover:text-white/90 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-inner data-[state=active]:border data-[state=active]:border-white/20">
                  ENTRY
                </TabsTrigger>
                <div className="h-4 w-px bg-white/10 my-auto" />
                <TabsTrigger value="sweepstakes_entry" className="flex-shrink-0 min-w-fit px-3 py-1.5 text-xs md:text-sm text-white/70 hover:text-white/90 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-inner data-[state=active]:border data-[state=active]:border-white/20">
                  SWEEPSTAKES
                </TabsTrigger>
                <div className="h-4 w-px bg-white/10 my-auto" />
                <TabsTrigger value="winnings" className="flex-shrink-0 min-w-fit px-3 py-1.5 text-xs md:text-sm text-white/70 hover:text-white/90 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-inner data-[state=active]:border data-[state=active]:border-white/20">
                  WINNINGS
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Transactions — grouped cards by date */}
        <div className="space-y-6 max-h-[70vh] overflow-y-auto px-4 sm:px-6">
          {Object.keys(groupedByDate).length > 0 ? (
            Object.entries(groupedByDate).map(([dateKey, list]) => (
              <div key={dateKey}>
                <div className="text-xs font-semibold text-white/70 mb-2 tracking-wide">{dateKey}</div>
                <div className="h-px bg-white/10 mb-3" />
                <div className="space-y-3">
                  {list.map((tx) => (
                    <div key={tx.id} className="rounded-xl border border-white/5 bg-background-primary/60 backdrop-blur px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-bold tracking-wide text-white/90 uppercase">{tx.type.replace('_', ' ')}</div>
                          <div className="text-xs text-white/60">{tx.description || 'Bank of America xxxx432'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-white/60">{format(tx.timestamp.toDate(), 'hh:mm a').toUpperCase()}</div>
                          <div className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-10">No transactions match your current filters.</div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 