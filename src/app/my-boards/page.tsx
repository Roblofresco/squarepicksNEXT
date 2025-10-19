"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Info, Trophy, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SquareCard from '@/components/my-boards/SquareCard';
import BottomNav from '@/components/lobby/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { AppBoard } from '../../types/myBoards';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
 
interface ApiResponse {
  success: boolean;
  boards: AppBoard[];
  timestamp: number;
}

export default function MyBoardsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State management
  const [activeBoards, setActiveBoards] = useState<AppBoard[]>([]);
  const [historicalBoards, setHistoricalBoards] = useState<AppBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  
  // Filtering and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch boards from secure API
  const fetchBoards = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get Firebase ID token for authentication
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/my-boards', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch boards');
      }

      // Separate active and historical boards
      const active = data.boards.filter(board => 
        ['open', 'full', 'active'].includes(board.status)
      );
      const historical = data.boards.filter(board => 
        !['open', 'full', 'active'].includes(board.status)
      );

      setActiveBoards(active);
      setHistoricalBoards(historical);
      
      console.log(`[MyBoardsPage] Loaded ${active.length} active and ${historical.length} historical boards`);
      
    } catch (error) {
      console.error('[MyBoardsPage] Error fetching boards:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch boards');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load boards when user changes
  useEffect(() => {
    if (user && !authLoading) {
      fetchBoards();
    }
  }, [user, authLoading, fetchBoards]);

  // Filter and sort boards
  const filterAndSortBoards = useCallback((boards: AppBoard[]) => {
    let filtered = boards;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(board => 
        board.homeTeam.name.toLowerCase().includes(term) ||
        board.awayTeam.name.toLowerCase().includes(term) ||
        board.sport?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(board => board.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.gameDateTime).getTime() - new Date(a.gameDateTime).getTime();
        case 'amount':
          return (b.amount || 0) - (a.amount || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, statusFilter, sortBy]);

  const filteredActiveBoards = filterAndSortBoards(activeBoards);
  const filteredHistoricalBoards = filterAndSortBoards(historicalBoards);

  // Handle board click
  const handleBoardClick = useCallback((boardId: string) => {
    router.push(`/game/${boardId}`);
  }, [router]);

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent-1" />
              <p className="text-slate-300">Loading your boards...</p>
        </div>
        </div>
        </div>
        <BottomNav 
          user={user} 
          onProtectedAction={() => router.push('/login')} 
        />
        </div>
      );
    }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Info className="h-12 w-12 text-red-400" />
              <h2 className="text-xl font-semibold text-slate-200">Error Loading Boards</h2>
              <p className="text-slate-400 max-w-md">{error}</p>
              <Button onClick={fetchBoards} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
        <BottomNav 
          user={user} 
          onProtectedAction={() => router.push('/login')} 
        />
            </div>
        );
    }
    
  // Show login prompt if no user
  if (!user) {
                  return (
      <div className="min-h-screen bg-background-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Trophy className="h-12 w-12 text-accent-1" />
              <h2 className="text-xl font-semibold text-slate-200">Sign In Required</h2>
              <p className="text-slate-400 max-w-md">
                Please sign in to view your boards and track your picks.
              </p>
                <Link href="/login">
                <Button>Sign In</Button>
                </Link>
              </div>
          </div>
        </div>
        <BottomNav 
          user={user} 
          onProtectedAction={() => router.push('/login')} 
        />
        </div>
      );
    }

      return (
    <div className="min-h-screen bg-background-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="SquarePicks"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <h1 className="text-2xl font-bold text-slate-100">My Boards</h1>
          </div>
          </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by team or sport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800/50 border-slate-600 text-slate-200"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-slate-800/50 border-slate-600">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-slate-800/50 border-slate-600">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
            <TabsTrigger value="active" className="data-[state=active]:bg-accent-1">
              Active ({filteredActiveBoards.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-accent-1">
              History ({filteredHistoricalBoards.length})
            </TabsTrigger>
          </TabsList>
            
          <TabsContent value="active" className="mt-6">
            {filteredActiveBoards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ListChecks className="h-16 w-16 text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Active Boards</h3>
                <p className="text-slate-400 mb-6 max-w-md">
                  You don't have any boards currently in play or open for picks.
                </p>
                <Link href="/lobby">
                  <Button className="bg-accent-1 hover:bg-accent-1/90">
                    Find a Game
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActiveBoards.map((board) => (
                  <SquareCard
                    key={board.id}
                    board={board}
                    onClick={handleBoardClick}
                  />
                ))}
          </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {filteredHistoricalBoards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-16 w-16 text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Board History</h3>
                <p className="text-slate-400 max-w-md">
                  Your completed boards will appear here once games finish.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHistoricalBoards.map((board) => (
                  <SquareCard
                    key={board.id}
                    board={board}
                    onClick={handleBoardClick}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
            </div>
      <BottomNav 
        user={user} 
        onProtectedAction={() => router.push('/login')} 
      />
    </div>
  );
} 