'use client'

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { Sport } from '@/types/lobby'; // Import shared type
// Import a placeholder icon
import { Ticket } from 'lucide-react'; 
import { cn } from '@/lib/utils';
// Import framer-motion
import { motion, AnimatePresence } from 'framer-motion';

// Define TimeLeft type
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // Total milliseconds
}

// Removed local sports data - will come from props
// const sportsData: Sport[] = [...];

interface SportSelectorProps {
  sports: Sport[]; // Use imported Sport type
  selectedSportId: string; // Expect selected ID as prop
  onSelectSport: (sportId: string) => void; // Expect callback as prop
  sweepstakesStartTime?: Date | null; 
  sportSelectorView: 'sweepstakes' | 'allRegularSports'; // New prop
  setSportSelectorView: (view: 'sweepstakes' | 'allRegularSports') => void; // New prop
}

// Helper function to calculate time left
// Accepts Date object or null
const calculateTimeLeft = (targetDate: Date | null): TimeLeft => {
  if (!targetDate || isNaN(targetDate.getTime())) { // Check if targetDate is valid
    // Return zeroed object if no valid target date
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const difference = +targetDate - +new Date();
  let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, total: difference };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  }

  return timeLeft;
};

// Use props
const SportSelector = memo(function SportSelector({ sports, selectedSportId, onSelectSport, sweepstakesStartTime, sportSelectorView, setSportSelectorView }: SportSelectorProps) {
  // Add isMounted state
  const [isMounted, setIsMounted] = useState(false);
  
  // --- Countdown State --- 
  // Initialize targetDate state based on the renamed prop
  const [targetDate, setTargetDate] = useState<Date | null>(() => {
    // Use sweepstakesStartTime directly
    if (sweepstakesStartTime instanceof Date && !isNaN(sweepstakesStartTime.getTime())) {
      return sweepstakesStartTime;
    }
    // Remove string parsing logic if LobbyPage always passes Date or null
    return null; 
  });

  // Update targetDate if the prop changes
  useEffect(() => {
    // Use sweepstakesStartTime directly
    if (sweepstakesStartTime instanceof Date && !isNaN(sweepstakesStartTime.getTime())) {
      setTargetDate(sweepstakesStartTime);
    } else {
        setTargetDate(null); // Set to null if prop is null/invalid
    }
  }, [sweepstakesStartTime]); // Depend on the renamed prop

  // Calculate timeLeft based on the targetDate state
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));

  // Effect to set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Effect for countdown timer
  useEffect(() => {
    // Only run the interval timer if mounted and targetDate is valid
    if (!targetDate) return; // Don't start timer if no valid target

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    // Clear interval on component unmount or if targetDate changes
    return () => clearInterval(timer);
  }, [targetDate]); // Rerun effect if targetDate changes
  // --- End Countdown State --- 

  const [comingSoonVisible, setComingSoonVisible] = useState(false);
  const [comingSoonKey, setComingSoonKey] = useState(0);

  const handleSelect = (sportId: string) => {
    if (sportId === 'sweepstakes') {
      onSelectSport('sweepstakes');
      return;
    }
    if (sportId === 'nfl') {
      // Allow NFL navigation
      onSelectSport('nfl');
      return;
    }
    // For CFB, NBA, WNBA: block navigation and show overlay
    setComingSoonKey(prev => prev + 1);
    setComingSoonVisible(true);
    setTimeout(() => setComingSoonVisible(false), 3000);
  };

  // Function to handle clicking the "More" button
  const handleShowMore = () => {
    // NEW: Set the view to allRegularSports
    setSportSelectorView('allRegularSports');
    // DO NOT automatically select a sport here anymore.
    // Let the user choose from the new view.
  };

  const handleShowSweepstakes = () => {
    setSportSelectorView('sweepstakes');
    onSelectSport('sweepstakes'); // Also select sweepstakes when going back
  };

  // Format countdown time - handle zero/past state
  const formatCountdown = (timeLeft: TimeLeft, targetDate: Date | null): string => {
    if (!targetDate) {
      // If no valid start time was ever provided
      return "--:--:--:--"; // Or "N/A"
    }
    if (timeLeft.total <= 0) {
      // If time is up
      return "Starting Soon"; 
    }
    // Format remaining time
    const timerComponents = [];
    if (timeLeft.days > 0) timerComponents.push(`${timeLeft.days}d`);
    timerComponents.push(`${String(timeLeft.hours).padStart(2, '0')}h`);
    timerComponents.push(`${String(timeLeft.minutes).padStart(2, '0')}m`);
    timerComponents.push(`${String(timeLeft.seconds).padStart(2, '0')}s`);
    return timerComponents.join(':');
  };

  const countdownString = formatCountdown(timeLeft, targetDate);

  // Framer motion variants for fade transition
  const variants = {
    hidden: { opacity: 0, transition: { duration: 0.2 } },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };

  return (
    <div className="mb-2 w-full min-h-[64px]">
      <div className="w-full"> 
        <AnimatePresence mode="wait" initial={false}>
          {sportSelectorView === 'sweepstakes' ? (
            // --- Sweepstakes Active State wrapped in motion.div ---
            (<motion.div 
              key="sweepstakes-view" 
              className="flex w-full items-center gap-1 px-0.5 sm:px-[50px]" 
              initial="hidden" animate="visible" exit="exit" variants={variants}
            >
              {/* Expanded Sweepstakes Button - 3 Color Gradient */}
              <button
                key="sweepstakes-active"
                onClick={() => handleSelect('sweepstakes')}
                className={cn(`
                  h-[48px] rounded-lg // REDUCED height
                  flex flex-col items-center justify-center 
                  transition-all duration-200 ease-in-out 
                  relative group 
                  flex-grow basis-3/4 
                  border border-[#F0E68C] 
                  bg-gradient-to-b from-background-primary via-[#B8860B]/50 via-[12%] to-[#B8860B] 
                  shadow-[0_0_15px_0px_rgba(184,134,11,0.5)] 
                  hover:brightness-110 hover:shadow-[0_0_20px_2px_rgba(184,134,11,0.7)] hover:border-white
                `)}
              >
                {/* Add style for gold text shadow */}
                <style jsx>{`
                  .text-shadow-glow-gold {
                    text-shadow: 0 0 8px rgba(184, 134, 11, 0.5); 
                  }
                `}</style>
                {/* Content Layer */}
                <div className="relative z-10 flex flex-col items-center justify-center space-y-0.5">
                  {/* Update text color */}
                  <span className="text-[10px] text-[#F0E68C] font-semibold uppercase tracking-wider">COUNTDOWN</span> {/* REDUCED text size */}
                  {/* Update text color and add gold text shadow class */}
                  <span className="text-xl text-[#F0E68C] font-bold font-mono tracking-tight text-shadow-glow-gold">  {/* REDUCED text size, removed h-7 */}
                    {/* Display the formatted countdown string */}
                    {isMounted ? countdownString : "--:--:--:--"} 
                  </span>
                </div>
              </button>
              {/* "More" Button */}
              {/* Apply background directly here too for consistency */}
              <button
                key="more-sports"
                onClick={handleShowMore}
                className={cn(`
                  flex-shrink-0 h-[48px] rounded-lg // REDUCED height
                  flex flex-col items-center justify-center space-y-0.5 // REDUCED space
                  transition-all duration-200 ease-in-out 
                  relative group border
                  flex-grow basis-1/4 
                  `, 
                  'border-accent-2 bg-gradient-to-b from-background-primary to-[#220248] shadow-[0_4px_12px_-4px_rgba(99,102,241,0.5)] backdrop-blur-sm',
                  'hover:brightness-125 hover:shadow-[0_6px_15px_-3px_rgba(99,102,241,0.6)] hover:border-white'
                )}
              >
                {/* Remove separate background div */}
                
                {/* Content Layer */}
                <div className="relative z-10 flex flex-col items-center justify-center space-y-0.5"> {/* Ensure consistency space-y-0.5 */}
                  <span className="text-xs font-medium text-text-primary"> {/* REDUCED text size */}
                    More
                  </span>
                </div>
              </button>
            </motion.div>)
          ) : (
            // --- All Regular Sports View --- 
            (<motion.div 
              key="all-sports-view"
              className="relative flex w-full items-center gap-1 px-0.5 sm:px-[50px]" 
              initial="hidden" animate="visible" exit="exit" variants={variants}
            >
              {/* "Back to Sweepstakes" Button */}
              <button
                key="back-to-sweepstakes"
                onClick={handleShowSweepstakes}
                className={cn(`
                  h-[48px] rounded-lg // REDUCED height
                  flex flex-col items-center justify-center 
                  transition-all duration-200 ease-in-out 
                  relative group border px-2 // REDUCED padding
                  flex-grow flex-basis-0 // ADDED flex-grow and flex-basis-0
                  border-gray-600 bg-gradient-to-b from-gray-700 to-gray-800 text-gray-300
                  hover:shadow-[0_0_15px_0px_rgba(184,134,11,0.5)] hover:border-[#F0E68C] hover:text-[#F0E68C] hover:bg-gradient-to-b hover:from-[#B8860B]/40 hover:to-[#B8860B]/90
                `)}
              >
                 <div className="relative z-10 flex flex-col items-center justify-center">
                  <Ticket size={18} className="mb-0.5" /> {/* REDUCED size */}
                  <span className="text-[10px] font-medium uppercase tracking-wider">Sweepstakes</span> {/* REDUCED text size */}
                </div>
              </button>

              <div className="relative flex flex-grow gap-1">
              {sports.filter(sport => sport.id !== 'sweepstakes').map((sport) => {
                const isActive = selectedSportId === sport.id;
                const iconToShow = isActive ? sport.iconActive : sport.iconDefault;
                const fallbackIconClass = isActive 
                  ? 'opacity-100 text-accent-2' // Active fallback
                  : 'opacity-70 group-hover:opacity-100 text-gray-500'; // Inactive fallback
      
                return (
                  <button
                    key={sport.id}
                    onClick={() => handleSelect(sport.id)}
                    data-sport-tab
                    className={cn(`
                      h-[48px] rounded-lg // REDUCED height
                      flex flex-col items-center justify-center space-y-0.5 // REDUCED space
                      transition-all duration-200 ease-in-out 
                      relative group border
                      flex-grow flex-basis-0 // ADDED flex-grow and flex-basis-0
                      min-w-[56px] sm:min-w-[64px] px-2 // REDUCED min-width
                      `, 
                      isActive 
                        ? 'border-accent-2 bg-gradient-to-b from-background-primary to-accent-2/70 shadow-[0_4px_12px_-4px_rgba(99,102,241,0.5)] backdrop-blur-sm' 
                        : 'border-gray-700 bg-background-secondary hover:bg-background-tertiary text-gray-400 hover:text-text-primary'
                    )}
                  >
                    {iconToShow && typeof iconToShow === 'string' ? (
                        <Image src={iconToShow} alt={sport.name} width={18} height={18} className={`object-contain transition-transform duration-300 group-hover:scale-110 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} /> // REDUCED size
                    ) : (
                        <Ticket size={18} className={`object-contain transition-transform duration-300 group-hover:scale-110 ${fallbackIconClass}`} /> // REDUCED size
                    )}
                      <span className={cn(
                        "text-[9px] sm:text-[11px] font-medium uppercase tracking-wider", // REDUCED text size
                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-text-secondary'
                    )}>
                        {sport.name}
                      </span>
                  </button>
                );
              })}
              {/* Coming Soon overlay spanning all three buttons */}
              <AnimatePresence mode="wait">
                {comingSoonVisible && (
                  <motion.div
                    key={`coming-soon-${comingSoonKey}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.6, 1, 0] }}
                    transition={{ duration: 3, times: [0, 0.25, 0.5, 0.75, 1] }}
                    className="absolute inset-0 z-20 pointer-events-none"
                  >
                    <div className="w-full h-full flex items-center gap-1">
                      <div className="flex-1 h-[48px] rounded-lg border border-yellow-500/60 bg-yellow-400/10 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-yellow-300 font-semibold tracking-wide">Coming Soon</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </motion.div>)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default SportSelector;
