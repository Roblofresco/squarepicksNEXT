'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { FaCheckCircle, FaTimesCircle, FaRegClock, FaChevronRight } from 'react-icons/fa'

// Tab component
const Tab = ({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) => {
  return (
    <button
      className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
        isActive 
          ? 'bg-primary-700 text-white' 
          : 'bg-secondary-800 text-gray-400 hover:bg-secondary-700'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

// Pick status badge
const PickStatusBadge = ({ status }: { status: 'correct' | 'incorrect' | 'pending' }) => {
  if (status === 'correct') {
    return (
      <div className="flex items-center text-green-500">
        <FaCheckCircle className="mr-1" />
        <span className="text-sm font-medium">Correct</span>
      </div>
    );
  } else if (status === 'incorrect') {
    return (
      <div className="flex items-center text-red-500">
        <FaTimesCircle className="mr-1" />
        <span className="text-sm font-medium">Incorrect</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-yellow-500">
        <FaRegClock className="mr-1" />
        <span className="text-sm font-medium">Pending</span>
      </div>
    );
  }
};

// Mock picks data
const myPicks = [
  {
    id: 'pick1',
    gameId: 'game1',
    league: 'NFL',
    homeTeam: {
      name: 'Kansas City Chiefs',
      abbreviation: 'KC',
      logo: '/images/placeholder.png',
    },
    awayTeam: {
      name: 'Buffalo Bills',
      abbreviation: 'BUF',
      logo: '/images/placeholder.png',
    },
    gameTime: 'Sunday, Dec 10 • 8:20 PM ET',
    picks: [
      { type: 'Winner', selection: 'Kansas City Chiefs', status: 'pending' },
      { type: 'Spread', selection: 'Kansas City Chiefs -3.0', status: 'pending' },
      { type: 'Total', selection: 'Over 53.5', status: 'pending' },
    ],
    status: 'upcoming',
  },
  {
    id: 'pick2',
    gameId: 'game2',
    league: 'NFL',
    homeTeam: {
      name: 'San Francisco 49ers',
      abbreviation: 'SF',
      logo: '/images/placeholder.png',
    },
    awayTeam: {
      name: 'Dallas Cowboys',
      abbreviation: 'DAL',
      logo: '/images/placeholder.png',
    },
    gameTime: 'Sunday, Dec 10 • 4:25 PM ET',
    picks: [
      { type: 'Winner', selection: 'San Francisco 49ers', status: 'pending' },
      { type: 'Spread', selection: 'San Francisco 49ers -5.5', status: 'pending' },
    ],
    status: 'upcoming',
  },
  {
    id: 'pick3',
    gameId: 'game3',
    league: 'NBA',
    homeTeam: {
      name: 'Los Angeles Lakers',
      abbreviation: 'LAL',
      logo: '/images/placeholder.png',
    },
    awayTeam: {
      name: 'Golden State Warriors',
      abbreviation: 'GSW',
      logo: '/images/placeholder.png',
    },
    gameTime: 'Friday, Dec 8 • 10:30 PM ET',
    picks: [
      { type: 'Winner', selection: 'Golden State Warriors', status: 'correct' },
      { type: 'Spread', selection: 'Golden State Warriors +2.5', status: 'correct' },
      { type: 'Total', selection: 'Under 228.5', status: 'incorrect' },
    ],
    status: 'completed',
    score: {
      home: 110,
      away: 118,
    },
  },
];

export default function MyPicksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter picks based on active tab
  const filteredPicks = activeTab === 'all' 
    ? myPicks 
    : activeTab === 'upcoming' 
      ? myPicks.filter(pick => pick.status === 'upcoming')
      : myPicks.filter(pick => pick.status === 'completed');
  
  return (
    <main className="min-h-screen flex flex-col bg-secondary-900">
      <Navbar />
      
      <div className="flex-grow pt-20">
        {/* Header section */}
        <div className="bg-gradient-to-r from-primary-900 to-primary-800 py-8">
          <div className="container-responsive">
            <h1 className="text-3xl font-bold text-white mb-2">My Picks</h1>
            <p className="text-primary-100">
              View and manage your picks for upcoming and past games
            </p>
          </div>
        </div>
        
        {/* Stats cards */}
        <div className="container-responsive py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-secondary-800 rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-400 mb-1">Total Picks</div>
              <div className="text-3xl font-bold text-white">8</div>
              <div className="mt-2 text-sm text-gray-400">Across 3 games</div>
            </div>
            
            <div className="bg-secondary-800 rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-400 mb-1">Correct Picks</div>
              <div className="text-3xl font-bold text-green-500">2</div>
              <div className="mt-2 text-sm text-gray-400">66.7% accuracy</div>
            </div>
            
            <div className="bg-secondary-800 rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-400 mb-1">Points Earned</div>
              <div className="text-3xl font-bold text-accent-500">250</div>
              <div className="mt-2 text-sm text-gray-400">Rank: #42 of 1,245</div>
            </div>
          </div>
        </div>
        
        {/* Tabs and picks list */}
        <div className="container-responsive py-6">
          <div className="bg-secondary-800 rounded-xl shadow-lg overflow-hidden">
            {/* Tabs */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex space-x-2">
                <Tab 
                  label="All Picks" 
                  isActive={activeTab === 'all'} 
                  onClick={() => setActiveTab('all')} 
                />
                <Tab 
                  label="Upcoming" 
                  isActive={activeTab === 'upcoming'} 
                  onClick={() => setActiveTab('upcoming')} 
                />
                <Tab 
                  label="Completed" 
                  isActive={activeTab === 'completed'} 
                  onClick={() => setActiveTab('completed')} 
                />
              </div>
            </div>
            
            {/* Picks list */}
            <div className="divide-y divide-gray-700">
              {filteredPicks.length > 0 ? (
                filteredPicks.map((pick) => (
                  <div key={pick.id} className="p-4 hover:bg-secondary-700 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-primary-400 mr-2">{pick.league}</span>
                        <span className="text-sm text-gray-400">{pick.gameTime}</span>
                      </div>
                      
                      {pick.status === 'completed' && (
                        <div className="text-white font-medium">
                          {pick.score?.away} - {pick.score?.home}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs text-gray-300">{pick.awayTeam.abbreviation}</span>
                        </div>
                        <span className="font-medium text-white">{pick.awayTeam.name}</span>
                      </div>
                      
                      <div className="text-sm text-gray-400">@</div>
                      
                      <div className="flex items-center">
                        <span className="font-medium text-white">{pick.homeTeam.name}</span>
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center ml-3">
                          <span className="text-xs text-gray-300">{pick.homeTeam.abbreviation}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-secondary-700 rounded-lg p-3 mb-3">
                      <div className="text-sm font-medium text-white mb-2">Your Picks</div>
                      <div className="space-y-2">
                        {pick.picks.map((p, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <span className="text-sm text-gray-400">{p.type}:</span>
                              <span className="text-sm text-white ml-2">{p.selection}</span>
                            </div>
                            <PickStatusBadge status={p.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Link href={`/games/${pick.gameId}`}>
                        <Button variant="outline" size="sm">
                          View Game
                          <FaChevronRight className="ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-400">No picks found for this filter.</p>
                  <div className="mt-4">
                    <Link href="/sports">
                      <Button variant="primary">
                        Make Some Picks
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Leaderboard preview */}
        <div className="container-responsive py-6">
          <div className="bg-secondary-800 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Leaderboard</h2>
              <Link href="/leaderboard">
                <Button variant="outline" size="sm">
                  View Full Leaderboard
                </Button>
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-3 text-sm font-medium text-gray-400">Rank</th>
                    <th className="pb-3 text-sm font-medium text-gray-400">User</th>
                    <th className="pb-3 text-sm font-medium text-gray-400">Correct Picks</th>
                    <th className="pb-3 text-sm font-medium text-gray-400">Accuracy</th>
                    <th className="pb-3 text-sm font-medium text-gray-400">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {[
                    { rank: 1, name: 'SportsMaster', picks: 45, accuracy: '78%', points: 1250 },
                    { rank: 2, name: 'PicksWizard', picks: 42, accuracy: '75%', points: 1180 },
                    { rank: 3, name: 'BettingPro', picks: 40, accuracy: '72%', points: 1120 },
                    { rank: 42, name: 'You', picks: 2, accuracy: '67%', points: 250, isUser: true },
                  ].map((user) => (
                    <tr key={user.rank} className={user.isUser ? 'bg-primary-900/20' : ''}>
                      <td className="py-3 text-white font-medium">#{user.rank}</td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs text-gray-300">{user.name.charAt(0)}</span>
                          </div>
                          <span className={`font-medium ${user.isUser ? 'text-primary-400' : 'text-white'}`}>
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-white">{user.picks}</td>
                      <td className="py-3 text-white">{user.accuracy}</td>
                      <td className="py-3 text-accent-500 font-medium">{user.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}