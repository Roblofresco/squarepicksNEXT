'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { FaChevronLeft, FaInfoCircle, FaRegClock, FaMapMarkerAlt, FaTv, FaChartBar } from 'react-icons/fa'

// Mock game data (in a real app, this would come from an API)
const gameData = {
  id: 'game1',
  league: 'NFL',
  homeTeam: {
    name: 'Kansas City Chiefs',
    abbreviation: 'KC',
    record: '10-2',
    logo: '/images/placeholder.png',
    color: '#E31837',
  },
  awayTeam: {
    name: 'Buffalo Bills',
    abbreviation: 'BUF',
    record: '8-4',
    logo: '/images/placeholder.png',
    color: '#00338D',
  },
  gameTime: 'Sunday, Dec 10 • 8:20 PM ET',
  venue: 'Arrowhead Stadium, Kansas City, MO',
  broadcast: 'NBC',
  spread: 'KC -3.0',
  overUnder: '53.5',
  status: 'upcoming', // upcoming, live, final
};

// Pick option component
const PickOption = ({ 
  label, 
  value, 
  isSelected, 
  onSelect 
}: { 
  label: string; 
  value: string; 
  isSelected: boolean; 
  onSelect: () => void;
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-primary-500 bg-primary-900/30' 
          : 'border-gray-700 bg-secondary-800 hover:border-gray-500'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-center">
        <span className="font-medium text-white">{label}</span>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          isSelected 
            ? 'border-primary-500 bg-primary-500' 
            : 'border-gray-500'
        }`}>
          {isSelected && (
            <div className="w-3 h-3 bg-white rounded-full"></div>
          )}
        </div>
      </div>
      <div className="mt-1 text-sm text-gray-400">{value}</div>
    </motion.div>
  );
};

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id;
  
  // State for user's picks
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [selectedSpread, setSelectedSpread] = useState<string | null>(null);
  const [selectedTotal, setSelectedTotal] = useState<string | null>(null);
  
  // Handle submission
  const handleSubmitPicks = () => {
    if (!selectedWinner) {
      toast.error('Please select a winner');
      return;
    }
    
    toast.success('Your picks have been submitted!');
    // In a real app, you would save the picks to your backend here
    
    // Navigate to confirmation page
    setTimeout(() => {
      router.push('/my-picks');
    }, 1500);
  };
  
  return (
    <main className="min-h-screen flex flex-col bg-secondary-900">
      <Navbar />
      
      <div className="flex-grow pt-20">
        {/* Header with back button */}
        <div className="bg-secondary-800 py-4">
          <div className="container-responsive">
            <div className="flex items-center">
              <button 
                onClick={() => router.back()}
                className="mr-3 p-2 rounded-full hover:bg-secondary-700 transition-colors"
              >
                <FaChevronLeft className="text-white" />
              </button>
              <h1 className="text-xl font-semibold text-white">Game Details</h1>
            </div>
          </div>
        </div>
        
        {/* Game info card */}
        <div className="container-responsive py-6">
          <div className="bg-secondary-800 rounded-xl overflow-hidden shadow-lg">
            {/* Teams header */}
            <div className="bg-gradient-to-r from-primary-900 to-primary-800 p-6">
              <div className="flex justify-between items-center">
                {/* Away team */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-2 shadow-md">
                    <span className="text-2xl font-bold" style={{ color: gameData.awayTeam.color }}>
                      {gameData.awayTeam.abbreviation}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold">{gameData.awayTeam.name}</h3>
                  <span className="text-primary-200 text-sm">{gameData.awayTeam.record}</span>
                </div>
                
                {/* VS */}
                <div className="text-center">
                  <div className="text-white text-lg font-bold mb-1">VS</div>
                  <div className="text-primary-200 text-sm">{gameData.league}</div>
                </div>
                
                {/* Home team */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-2 shadow-md">
                    <span className="text-2xl font-bold" style={{ color: gameData.homeTeam.color }}>
                      {gameData.homeTeam.abbreviation}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold">{gameData.homeTeam.name}</h3>
                  <span className="text-primary-200 text-sm">{gameData.homeTeam.record}</span>
                </div>
              </div>
            </div>
            
            {/* Game details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <FaRegClock className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-white">{gameData.gameTime}</div>
                    <div className="text-sm text-gray-400">Game Time</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-white">{gameData.venue}</div>
                    <div className="text-sm text-gray-400">Venue</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaTv className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-white">{gameData.broadcast}</div>
                    <div className="text-sm text-gray-400">Broadcast</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaChartBar className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-white">{gameData.spread} • O/U {gameData.overUnder}</div>
                    <div className="text-sm text-gray-400">Betting Line</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Make picks section */}
        <div className="container-responsive py-6">
          <div className="bg-secondary-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Make Your Picks</h2>
            
            {/* Winner pick */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">Who will win?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PickOption
                  label={gameData.awayTeam.name}
                  value="Away Team"
                  isSelected={selectedWinner === 'away'}
                  onSelect={() => setSelectedWinner('away')}
                />
                <PickOption
                  label={gameData.homeTeam.name}
                  value="Home Team"
                  isSelected={selectedWinner === 'home'}
                  onSelect={() => setSelectedWinner('home')}
                />
              </div>
            </div>
            
            {/* Spread pick */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">Against the Spread</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PickOption
                  label={`${gameData.awayTeam.name} +3.0`}
                  value="Away Team Covers"
                  isSelected={selectedSpread === 'away'}
                  onSelect={() => setSelectedSpread('away')}
                />
                <PickOption
                  label={`${gameData.homeTeam.name} -3.0`}
                  value="Home Team Covers"
                  isSelected={selectedSpread === 'home'}
                  onSelect={() => setSelectedSpread('home')}
                />
              </div>
            </div>
            
            {/* Total pick */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">Over/Under {gameData.overUnder}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PickOption
                  label={`Over ${gameData.overUnder}`}
                  value="Total points over"
                  isSelected={selectedTotal === 'over'}
                  onSelect={() => setSelectedTotal('over')}
                />
                <PickOption
                  label={`Under ${gameData.overUnder}`}
                  value="Total points under"
                  isSelected={selectedTotal === 'under'}
                  onSelect={() => setSelectedTotal('under')}
                />
              </div>
            </div>
            
            {/* Submit button */}
            <div className="mt-8">
              <Button 
                variant="accent" 
                size="lg" 
                fullWidth={true}
                onClick={handleSubmitPicks}
              >
                Submit Picks
              </Button>
              <p className="text-center text-sm text-gray-400 mt-3">
                <FaInfoCircle className="inline mr-1" />
                You can change your picks until the game starts
              </p>
            </div>
          </div>
        </div>
        
        {/* Community picks section */}
        <div className="container-responsive py-6">
          <div className="bg-secondary-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Community Picks</h2>
            
            <div className="space-y-6">
              {/* Winner picks */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Winner</h3>
                <div className="bg-secondary-700 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-white">{gameData.homeTeam.name}</span>
                    <span className="text-white">68%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  
                  <div className="flex justify-between mt-4 mb-2">
                    <span className="text-white">{gameData.awayTeam.name}</span>
                    <span className="text-white">32%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>
              </div>
              
              {/* Spread picks */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Spread</h3>
                <div className="bg-secondary-700 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-white">{gameData.homeTeam.name} -3.0</span>
                    <span className="text-white">55%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: '55%' }}></div>
                  </div>
                  
                  <div className="flex justify-between mt-4 mb-2">
                    <span className="text-white">{gameData.awayTeam.name} +3.0</span>
                    <span className="text-white">45%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </div>
              
              {/* Total picks */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Total</h3>
                <div className="bg-secondary-700 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-white">Over {gameData.overUnder}</span>
                    <span className="text-white">62%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: '62%' }}></div>
                  </div>
                  
                  <div className="flex justify-between mt-4 mb-2">
                    <span className="text-white">Under {gameData.overUnder}</span>
                    <span className="text-white">38%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: '38%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}