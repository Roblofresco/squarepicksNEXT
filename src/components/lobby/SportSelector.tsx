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
const SportSelector = memo(function SportSelector({ sports, selectedSportId, onSelectSport, sweepstakesStartTime }: SportSelectorProps) {
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

  const handleSelect = (sportId: string) => {
    onSelectSport(sportId);
  };

  // Function to handle clicking the "More" button
  const handleShowMore = () => {
    // Select the first *actual* sport (assuming Sweepstakes is always first)
    const firstSportId = sports.find(s => s.id !== 'sweepstakes')?.id;
    if (firstSportId) {
      onSelectSport(firstSportId);
    }
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
    <div className="my-4 w-full">
      {/* Container with padding for shadow - Remove overflow-x-auto if flex-wrap handles it */}
      {/* Keep flex-wrap to allow wrapping */}
      <div className="flex justify-center space-x-3 pb-4 flex-wrap"> 
        
        {/* Wrap conditional rendering in AnimatePresence */}
        <AnimatePresence mode="wait" initial={false}>
          {selectedSportId === 'sweepstakes' ? (
            // --- Sweepstakes Active State wrapped in motion.div ---
            (<motion.div 
              key="sweepstakes-view" 
              className="flex w-full space-x-3" 
              initial="hidden" animate="visible" exit="exit" variants={variants}
            >
              {/* Expanded Sweepstakes Button - 3 Color Gradient */}
              <button
                key="sweepstakes-active"
                onClick={() => handleSelect('sweepstakes')}
                className={cn(`
                  h-[60px] rounded-lg 
                  flex flex-col items-center justify-center 
                  transition-all duration-200 ease-in-out 
                  relative group 
                  flex-grow basis-3/4 /* Keep flex-grow and basis */
                  /* Update border color */
                  border border-[#F0E68C] 
                  /* Update background gradient: primary to gold, transition at 12% */
                  bg-gradient-to-b from-background-primary via-[#B8860B]/50 via-[12%] to-[#B8860B] 
                  /* Update box shadow to use gold (approx RGB 184, 134, 11) */
                  shadow-[0_0_15px_0px_rgba(184,134,11,0.5)] 
                  /* HOVER EFFECTS */
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
                  <span className="text-xs text-[#F0E68C] font-semibold uppercase tracking-wider">COUNTDOWN</span>
                  {/* Update text color and add gold text shadow class */}
                  <span className="text-2xl text-[#F0E68C] font-bold font-mono tracking-tight h-7 text-shadow-glow-gold"> 
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
                  flex-shrink-0 h-[60px] rounded-lg 
                  flex flex-col items-center justify-center space-y-1 
                  transition-all duration-200 ease-in-out 
                  relative group border
                  flex-grow basis-1/4 /* Keep flex-grow and basis */
                  /* Remove w-[70px] */
                  `, 
                  // Apply dark blue gradient directly, keep border/shadow
                  'border-accent-2 bg-gradient-to-b from-background-primary to-[#220248] shadow-[0_4px_12px_-4px_rgba(99,102,241,0.5)] backdrop-blur-sm',
                  /* HOVER EFFECTS */
                  'hover:brightness-125 hover:shadow-[0_6px_15px_-3px_rgba(99,102,241,0.6)] hover:border-white'
                )}
              >
                {/* Remove separate background div */}
                
                {/* Content Layer */}
                <div className="relative z-10 flex flex-col items-center justify-center space-y-1">
                  <span className="text-sm font-medium text-text-primary">
                    More
                  </span>
                </div>
              </button>
            </motion.div>)
          ) : (
            // --- Normal State wrapped in motion.div --- 
            (<motion.div 
              key="all-sports-view"
              className="flex justify-center space-x-3" // Maintain spacing
              initial="hidden" animate="visible" exit="exit" variants={variants}
            >
              {sports.map((sport) => {
                const isActive = selectedSportId === sport.id;
                const isSweepstakes = sport.id === 'sweepstakes';
      
                return (
                  <button
                    key={sport.id}
                    onClick={() => handleSelect(sport.id)}
                    // Apply backgrounds directly
                    className={cn(`
                      flex-shrink-0 h-[60px] rounded-lg 
                      flex flex-col items-center justify-center space-y-1 
                      transition-all duration-200 ease-in-out 
                      relative group border
                      flex-grow /* Allow normal buttons to grow */
                      min-w-[60px] /* Add a minimum width */
                      `, 
                      /* Remove w-[90px] and w-[70px] */
                      /* isSweepstakes ? '' : '', */
                      isActive 
                        ? (isSweepstakes 
                            // Change transition point to 5% here too
                            ? 'border-yellow-400 bg-gradient-to-b from-background-primary via-orange-500 via-5% to-yellow-400 shadow-[0_0_15px_0px_rgba(250,204,21,0.5)]' 
                            : 'border-accent-2 bg-gradient-to-b from-background-primary to-[#220248] backdrop-blur-sm shadow-[0_4px_12px_-4px_rgba(99,102,241,0.5)]' 
                          ) 
                        : 'border-transparent bg-gradient-to-b from-background-primary to-gray-700 shadow-none' // Inactive
                    )}
                  >
                    {/* Remove separate background div entirely */}
                    
                    {/* Content Layer */}
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-1">
                      {isSweepstakes ? (
                        <Ticket className={cn("h-5 w-5", isActive ? "text-white" : "text-text-secondary")} />
                      ) : sport.iconDefault && sport.iconActive ? (
                        <Image 
                          src={isActive ? sport.iconActive : sport.iconDefault}
                          alt={sport.name}
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      ) : (
                        <div className="w-5 h-5 bg-gray-500 rounded-sm"></div> 
                      )}
                      
                      <span className={cn(
                        "text-xs font-medium", 
                        isActive 
                          // Text color remains white for contrast
                          ? (isSweepstakes ? 'text-white font-semibold' : 'text-text-primary') 
                          : 'text-text-secondary'
                        )}
                      >
                        {sport.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </motion.div>)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default SportSelector;
