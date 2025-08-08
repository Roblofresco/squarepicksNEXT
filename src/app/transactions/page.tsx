'use client'

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have an auth hook
import { db } from '@/lib/firebase'; // Assuming Firebase initialized here
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Transaction } from '@/types'; // Import your Transaction type
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, FilterX, Search } from 'lucide-react';
import { format } from 'date-fns';
// import { DateRangePicker } from '@/components/ui/daterangepicker'; // Assuming you have this component - Placeholder for now
import { DateRange } from 'react-day-picker';

// --- Main Component ---
export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filtering & Sorting State ---
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
    if (searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        result = result.filter(tx =>
            (tx.description?.toLowerCase().includes(lowerSearchTerm)) ||
            (tx.paypalOrderID?.toLowerCase().includes(lowerSearchTerm)) ||
            (tx.type.toLowerCase().includes(lowerSearchTerm)) ||
            (tx.amount.toString().includes(lowerSearchTerm)) // Basic amount search
        );
    }

    // Client-side sort (if different from Firestore sort or finer control needed)
    // This example relies on Firestore sorting, but you could implement client sort here.

    return result;
  }, [transactions, filterType, filterStatus, dateRange, searchTerm]);

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / pageSize);
  const paginatedTransactions = filteredAndSortedTransactions.slice((page - 1) * pageSize, page * pageSize);

  // --- Event Handlers ---
  const handleClearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setDateRange(undefined);
    setSearchTerm('');
    // Optionally reset sort: setSortBy('timestamp'); setSortOrder('desc');
  };

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
    <div className="min-h-screen bg-background-primary text-text-primary p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="relative mb-6 md:mb-8 text-center">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-text-primary p-2 rounded-full"
            aria-label="Go back to previous page"
          >
             <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Transaction History</h1>
        </div>

        {/* Filters & Search Section */}
        <div className="mb-6 p-4 bg-gradient-to-b from-background-primary to-[#eeeeee] to-5% rounded-lg flex flex-wrap gap-4 items-end">
           {/* Search */}
           <div className="flex-grow min-w-[200px]">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1 block">Search</Label>
               <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                      id="search"
                      placeholder="Search amount, type, description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-white border-gray-400 text-gray-800 placeholder-gray-500 focus:ring-accent-1 focus:border-accent-1"
                  />
              </div>
           </div>

          {/* Type Filter */}
          <div className="min-w-[150px]">
            <Label htmlFor="filter-type" className="text-sm font-medium text-gray-700 mb-1 block">Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger id="filter-type" className="bg-white border-gray-400 text-gray-800 focus:ring-accent-1 focus:border-accent-1">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-400"> {/* Assuming SelectContent needs styling too */}
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="entry_fee">Entry Fee</SelectItem>
                <SelectItem value="payout">Payout</SelectItem>
                 {/* Add other types */}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
           <div className="min-w-[150px]">
             <Label htmlFor="filter-status" className="text-sm font-medium text-gray-700 mb-1 block">Status</Label>
             <Select value={filterStatus} onValueChange={setFilterStatus}>
               <SelectTrigger id="filter-status" className="bg-white border-gray-400 text-gray-800 focus:ring-accent-1 focus:border-accent-1">
                 <SelectValue placeholder="Filter by Status" />
               </SelectTrigger>
               <SelectContent className="bg-white border-gray-400"> {/* Assuming SelectContent needs styling too */}
                 <SelectItem value="all">All Statuses</SelectItem>
                 <SelectItem value="completed">Completed</SelectItem>
                 <SelectItem value="pending">Pending</SelectItem>
                 <SelectItem value="failed">Failed</SelectItem>
                  {/* Add other statuses */}
               </SelectContent>
             </Select>
           </div>

            {/* Date Range Picker (Needs a suitable component) */}
            <div className="min-w-[280px]">
               <Label className="text-sm font-medium text-gray-700 mb-1 block">Date Range</Label>
               {/* Replace with your actual DateRangePicker component */}
               {/* <DateRangePicker date={dateRange} onDateChange={setDateRange} /> */}
               <Input placeholder="Date Range Picker Placeholder" className="bg-white border-gray-400 text-gray-800 placeholder-gray-500 focus:ring-accent-1 focus:border-accent-1"/>
            </div>

          {/* Clear Filters Button */}
          <Button variant="ghost" onClick={handleClearFilters} className="text-red-500 hover:text-red-600 px-3">
            <FilterX className="h-4 w-4 mr-1"/> Clear
          </Button>
        </div>


        {/* Transactions Table */}
        <div className="bg-gradient-to-b from-background-primary to-[#eeeeee] to-5% rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-accent-2 via-accent-4 to-accent-2">
                {/* Add onClick handlers for sorting */}
                <TableHead className="text-slate-200 cursor-pointer" onClick={() => { setSortBy('timestamp'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>Date {sortBy === 'timestamp' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}</TableHead>
                <TableHead className="text-slate-200">Type</TableHead>
                <TableHead className="text-slate-200">Description</TableHead>
                <TableHead className="text-right text-slate-200 cursor-pointer" onClick={() => { setSortBy('amount'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>Amount ({sortBy === 'amount' ? (sortOrder === 'desc' ? '↓' : '↑') : ''})</TableHead>
                <TableHead className="text-right text-slate-200">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((tx) => (
                  <TableRow key={tx.id} className="border-b-gray-300">
                    <TableCell className="text-sm text-gray-800">{format(tx.timestamp.toDate(), 'yyyy-MM-dd p')}</TableCell>
                    <TableCell className="text-sm text-gray-800 capitalize">{tx.type.replace('_', ' ')}</TableCell>
                    <TableCell className="text-sm text-gray-600">{tx.description || 'N/A'}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                       {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)} {tx.currency}
                    </TableCell>
                    <TableCell className={`text-right text-xs font-semibold ${tx.status === 'completed' ? 'text-green-600' : tx.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {tx.status}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-600 py-8">
                    No transactions match your current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 