'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { FaFootballBall, FaBasketballBall, FaBaseballBall, FaHockeyPuck, FaFutbol } from 'react-icons/fa'

// Sport button component that matches your FlutterFlow SportButton widget
const SportButton = ({ 
  sportName, 
  icon: Icon, 
  isSelected, 
  onTap 
}: { 
  sportName: string; 
  icon: any; 
  isSelected: boolean; 
  onTap: () => void;
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden rounded-xl shadow-md cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'bg-gradient-to-br from-primary-700 to-primary-900 border-2 border-primary-400' 
          : 'bg-gradient-to-br from-secondary-700 to-secondary-900 border-2 border-transparent'
      }`}
      onClick={onTap}
    >
      <div className="p-4 flex flex-col items-center justify-center h-32">
        <Icon className={`text-4xl mb-2 ${isSelected ? 'text-white' : 'text-gray-300'}`} />
        <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
          {sportName}
        </span>
      </div>
      
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-500"></div>
      )}
    </motion.div>
  );
};

// Sports data
const sportsData = [
  { id: 'nfl', name: 'NFL', icon: FaFootballBall },
  { id: 'nba', name: 'NBA', icon: FaBasketballBall },
  { id: 'mlb', name: 'MLB', icon: FaBaseballBall },
  { id: 'nhl', name: 'NHL', icon: FaHockeyPuck },
  { id: 'soccer', name: 'Soccer', icon: FaFutbol },
];

// Upcoming games data (placeholder)
const upcomingGames = [
  {
    id: 'game1',
    league: 'NFL',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    time: 'Today, 8:20 PM',
    homeScore: null,
    awayScore: null,
  },
  {
    id: 'game2',
    league: 'NFL',
    homeTeam: 'San Francisco 49ers',
    awayTeam: 'Dallas Cowboys',
    time: 'Tomorrow, 4:25 PM',
    homeScore: null,
    awayScore: null,
  },
  {
    id: 'game3',
    league: 'NBA',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Golden State Warriors',
    time: 'Today, 10:30 PM',
    homeScore: null,
    awayScore: null,
  },
  {
    id: 'game4',
    league: 'NBA',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Milwaukee Bucks',
    time: 'Tomorrow, 7:00 PM',
    homeScore: null,
    awayScore: null,
  },
];

export default function SportsPage() {
  const [selectedSport, setSelectedSport] = useState('nfl');
  
  // Filter games by selected sport
  const filteredGames = upcomingGames.filter(game => 
    game.league.toLowerCase() === selectedSport.toLowerCase()
  );
  
  return (
    <main className="min-h-screen flex flex-col bg-secondary-900">
      <Navbar />
      
      <div className="flex-grow pt-20">
        {/* Header section */}
        <div className="bg-gradient-to-r from-primary-900 to-primary-800 py-8">
          <div className="container-responsive">
            <h1 className="text-3xl font-bold text-white mb-2">Sports Lobby</h1>
            <p className="text-primary-100">
              Select a sport to view upcoming games and make your picks
            </p>
          </div>
        </div>
        
        {/* Sports selection */}
        <div className="container-responsive py-8">
          <h2 className="text-xl font-semibold text-white mb-4">Choose a Sport</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {sportsData.map((sport) => (
              <SportButton
                key={sport.id}
                sportName={sport.name}
                icon={sport.icon}
                isSelected={selectedSport === sport.id}
                onTap={() => setSelectedSport(sport.id)}
              />
            ))}
          </div>
        </div>
        
        {/* Upcoming games */}
        <div className="container-responsive py-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Upcoming Games</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGames.map((game) => (
                <Link href={`/games/${game.id}`} key={game.id}>
                  <div className="bg-secondary-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-primary-400">{game.league}</span>
                        <span className="text-sm text-gray-400">{game.time}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs text-gray-300">Logo</span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{game.homeTeam}</p>
                            <p className="text-sm text-gray-400">Home</p>
                          </div>
                        </div>
                        
                        <div className="text-xl font-bold text-white">
                          {game.homeScore !== null ? game.homeScore : '-'}
                        </div>
                      </div>
                      
                      <div className="my-3 border-t border-gray-700"></div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs text-gray-300">Logo</span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{game.awayTeam}</p>
                            <p className="text-sm text-gray-400">Away</p>
                          </div>
                        </div>
                        
                        <div className="text-xl font-bold text-white">
                          {game.awayScore !== null ? game.awayScore : '-'}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button variant="accent" fullWidth={true}>
                          Make Pick
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-secondary-800 rounded-xl p-8 text-center">
              <p className="text-gray-400">No upcoming games for this sport.</p>
            </div>
          )}
        </div>
        
        {/* Popular picks section */}
        <div className="container-responsive py-8">
          <h2 className="text-xl font-semibold text-white mb-4">Popular Picks</h2>
          
          <div className="bg-secondary-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-medium text-white">Community Favorites</h3>
                <p className="text-sm text-gray-400">See what other users are picking</p>
              </div>
              
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-secondary-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-primary-400">NFL</span>
                    <span className="text-xs text-gray-400">75% of users</span>
                  </div>
                  
                  <p className="font-medium text-white mb-1">Kansas City Chiefs</p>
                  <p className="text-sm text-gray-400">vs. Buffalo Bills</p>
                  
                  <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '75%' }}></div>
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