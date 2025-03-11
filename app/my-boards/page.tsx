'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { FaPlus, FaUsers, FaTrophy, FaLock, FaUnlock, FaChevronRight } from 'react-icons/fa'

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

// Board card component
const BoardCard = ({ 
  board,
  onClick
}: { 
  board: any;
  onClick: () => void;
}) => {
  return (
    <motion.div 
      className="bg-secondary-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
      whileHover={{ y: -5 }}
      onClick={onClick}
    >
      <div className="relative h-32 bg-gradient-to-r from-primary-800 to-primary-600">
        {board.image ? (
          <Image 
            src={board.image} 
            alt={board.name}
            fill
            className="object-cover opacity-30"
          />
        ) : null}
        <div className="absolute top-0 left-0 w-full h-full p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium px-2 py-1 bg-secondary-900/80 text-white rounded-full">
              {board.sport}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              board.isPrivate 
                ? 'bg-gray-700/80 text-gray-300' 
                : 'bg-green-700/80 text-green-100'
            }`}>
              {board.isPrivate ? (
                <span className="flex items-center">
                  <FaLock className="mr-1" size={10} />
                  Private
                </span>
              ) : (
                <span className="flex items-center">
                  <FaUnlock className="mr-1" size={10} />
                  Public
                </span>
              )}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">{board.name}</h3>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <FaUsers className="text-gray-400 mr-2" />
            <span className="text-sm text-gray-300">{board.members} members</span>
          </div>
          <div className="flex items-center">
            <FaTrophy className="text-accent-500 mr-2" />
            <span className="text-sm text-gray-300">{board.prize}</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-400 mb-4">{board.description}</div>
        
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs text-gray-500">Created by</span>
            <div className="flex items-center mt-1">
              <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                <span className="text-xs text-gray-300">{board.creator.charAt(0)}</span>
              </div>
              <span className="text-sm text-gray-300">{board.creator}</span>
            </div>
          </div>
          
          <Button variant="outline" size="sm">
            View
            <FaChevronRight className="ml-1" size={12} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Mock boards data
const myBoards = [
  {
    id: 'board1',
    name: 'NFL Weekly Challenge',
    sport: 'NFL',
    isPrivate: false,
    members: 24,
    prize: '$500 Pool',
    description: 'Weekly picks competition for NFL games with friends and colleagues.',
    creator: 'You',
    image: '/images/placeholder.png',
  },
  {
    id: 'board2',
    name: 'March Madness 2025',
    sport: 'NCAA',
    isPrivate: true,
    members: 16,
    prize: '$200 Pool',
    description: 'Private bracket challenge for the upcoming March Madness tournament.',
    creator: 'SportsFan42',
    image: '/images/placeholder.png',
  },
  {
    id: 'board3',
    name: 'NBA Finals Showdown',
    sport: 'NBA',
    isPrivate: false,
    members: 32,
    prize: '$350 Pool',
    description: 'Predict the winners of each game in the NBA Finals series.',
    creator: 'HoopsDreams',
    image: '/images/placeholder.png',
  },
];

const joinedBoards = [
  {
    id: 'board4',
    name: 'Fantasy Football League',
    sport: 'NFL',
    isPrivate: true,
    members: 12,
    prize: '$1000 Pool',
    description: 'Season-long fantasy football competition with weekly matchups.',
    creator: 'GridironGuru',
    image: '/images/placeholder.png',
  },
  {
    id: 'board5',
    name: 'MLB Playoff Challenge',
    sport: 'MLB',
    isPrivate: false,
    members: 28,
    prize: '$250 Pool',
    description: 'Make your picks for each MLB playoff series and win big!',
    creator: 'BaseballFan',
    image: '/images/placeholder.png',
  },
];

export default function MyBoardsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('my-boards');
  
  // Get boards based on active tab
  const displayedBoards = activeTab === 'my-boards' ? myBoards : joinedBoards;
  
  // Handle board click
  const handleBoardClick = (boardId: string) => {
    router.push(`/boards/${boardId}`);
  };
  
  // Handle create board
  const handleCreateBoard = () => {
    router.push('/boards/create');
  };
  
  return (
    <main className="min-h-screen flex flex-col bg-secondary-900">
      <Navbar />
      
      <div className="flex-grow pt-20">
        {/* Header section */}
        <div className="bg-gradient-to-r from-primary-900 to-primary-800 py-8">
          <div className="container-responsive">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Boards</h1>
                <p className="text-primary-100">
                  Create and join pick'em boards with friends and compete for prizes
                </p>
              </div>
              
              <Button 
                variant="secondary" 
                size="lg"
                onClick={handleCreateBoard}
              >
                <FaPlus className="mr-2" />
                Create Board
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats cards */}
        <div className="container-responsive py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-secondary-800 rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-400 mb-1">Total Boards</div>
              <div className="text-3xl font-bold text-white">5</div>
              <div className="mt-2 text-sm text-gray-400">3 created, 2 joined</div>
            </div>
            
            <div className="bg-secondary-800 rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-400 mb-1">Active Members</div>
              <div className="text-3xl font-bold text-primary-500">112</div>
              <div className="mt-2 text-sm text-gray-400">Across all boards</div>
            </div>
            
            <div className="bg-secondary-800 rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-400 mb-1">Total Prize Pools</div>
              <div className="text-3xl font-bold text-accent-500">$2,300</div>
              <div className="mt-2 text-sm text-gray-400">Current active pools</div>
            </div>
          </div>
        </div>
        
        {/* Tabs and boards list */}
        <div className="container-responsive py-6">
          <div className="bg-secondary-800 rounded-xl shadow-lg overflow-hidden">
            {/* Tabs */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex space-x-2">
                <Tab 
                  label="My Boards" 
                  isActive={activeTab === 'my-boards'} 
                  onClick={() => setActiveTab('my-boards')} 
                />
                <Tab 
                  label="Joined Boards" 
                  isActive={activeTab === 'joined-boards'} 
                  onClick={() => setActiveTab('joined-boards')} 
                />
              </div>
            </div>
            
            {/* Boards grid */}
            <div className="p-4">
              {displayedBoards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedBoards.map((board) => (
                    <BoardCard 
                      key={board.id} 
                      board={board} 
                      onClick={() => handleBoardClick(board.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-400">No boards found for this filter.</p>
                  <div className="mt-4">
                    <Button 
                      variant="primary"
                      onClick={handleCreateBoard}
                    >
                      <FaPlus className="mr-2" />
                      Create a Board
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Discover boards section */}
        <div className="container-responsive py-6">
          <div className="bg-secondary-800 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Discover Popular Boards</h2>
              <Link href="/boards/discover">
                <Button variant="outline" size="sm">
                  Browse All
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'popular1',
                  name: 'NFL Super Bowl Pool',
                  sport: 'NFL',
                  members: 1245,
                  prize: '$5,000 Pool',
                  image: '/images/placeholder.png',
                },
                {
                  id: 'popular2',
                  name: 'NBA All-Star Challenge',
                  sport: 'NBA',
                  members: 876,
                  prize: '$2,500 Pool',
                  image: '/images/placeholder.png',
                },
                {
                  id: 'popular3',
                  name: 'March Madness Bracket',
                  sport: 'NCAA',
                  members: 1532,
                  prize: '$10,000 Pool',
                  image: '/images/placeholder.png',
                },
              ].map((board) => (
                <div 
                  key={board.id}
                  className="bg-secondary-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => router.push(`/boards/${board.id}`)}
                >
                  <div className="relative h-24 bg-gradient-to-r from-primary-800 to-primary-600">
                    {board.image ? (
                      <Image 
                        src={board.image} 
                        alt={board.name}
                        fill
                        className="object-cover opacity-30"
                      />
                    ) : null}
                    <div className="absolute top-0 left-0 w-full h-full p-3 flex flex-col justify-between">
                      <span className="text-xs font-medium px-2 py-1 bg-secondary-900/80 text-white rounded-full w-fit">
                        {board.sport}
                      </span>
                      <h3 className="text-lg font-bold text-white">{board.name}</h3>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <FaUsers className="text-gray-400 mr-2" size={12} />
                        <span className="text-xs text-gray-300">{board.members}</span>
                      </div>
                      <div className="flex items-center">
                        <FaTrophy className="text-accent-500 mr-2" size={12} />
                        <span className="text-xs text-gray-300">{board.prize}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}