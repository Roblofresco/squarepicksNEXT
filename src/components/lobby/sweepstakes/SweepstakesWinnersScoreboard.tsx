import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface WinnerPill {
  label: string;
  number: string | null;
  period: 'q1' | 'q2' | 'q3' | 'final';
}

interface SweepstakesWinnersScoreboardProps {
  q1WinningSquare?: string;
  q2WinningSquare?: string;
  q3WinningSquare?: string;
  finalWinningSquare?: string;
  isLive?: boolean;
  currentQuarter?: number;
}

export default function SweepstakesWinnersScoreboard({
  q1WinningSquare,
  q2WinningSquare,
  q3WinningSquare,
  finalWinningSquare,
  isLive,
  currentQuarter
}: SweepstakesWinnersScoreboardProps) {
  const [showingAssigned, setShowingAssigned] = useState<Record<string, boolean>>({});
  
  const pills: WinnerPill[] = [
    { label: 'Q1', number: q1WinningSquare || null, period: 'q1' },
    { label: 'Q2', number: q2WinningSquare || null, period: 'q2' },
    { label: 'Q3', number: q3WinningSquare || null, period: 'q3' },
    { label: 'Final', number: finalWinningSquare || null, period: 'final' },
  ];

  useEffect(() => {
    pills.forEach((pill, idx) => {
      if (pill.number) {  // Only for assigned pills
        setTimeout(() => {
          setShowingAssigned(prev => ({ ...prev, [pill.period]: true }));
        }, idx * 150 + 400);  // Q1: 400ms, Q2: 550ms, Q3: 700ms, Final: 850ms
      }
    });
  }, [q1WinningSquare, q2WinningSquare, q3WinningSquare, finalWinningSquare]);

  const getPillColor = (period: string, isAssigned: boolean) => {
    if (!isAssigned) {
      return {
        bg: 'bg-black/30',
        border: '',
        text: 'text-gray-600'
      };
    }
    
    return {
      bg: 'bg-gradient-to-br from-[#B8860B] to-[#A0740A]',
      border: '',
      text: 'text-white'
    };
  };

  const accentGlowRgb = '184, 134, 11'; // Same as SweepstakesBoardCard

  return (
    <div 
      className="bg-gradient-to-b from-background-primary from-0% to-[#B8860B] to-10% p-4 rounded-xl shadow-lg glow-border-gold max-w-xs sm:max-w-sm md:max-w-md mx-auto mt-6 mb-20"
    >
      <h3 className="text-white text-lg font-bold mb-4 text-center">
        Winning Squares
      </h3>
      
      <div className="grid grid-cols-4 gap-3">
        {pills.map((pill, idx) => {
          const isAssigned = !!pill.number;
          const colors = getPillColor(pill.period, isAssigned);
          const isCurrent = isLive && !isAssigned && currentQuarter === idx + 1;
          const shouldShowAssigned = showingAssigned[pill.period];
          const displayAsAssigned = isAssigned && shouldShowAssigned;

          return (
            <div
              key={pill.period}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 rounded-lg transition-all overflow-hidden",
                "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none",
                "shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
                colors.bg,
                colors.border && "border-2",
                colors.border,
                isCurrent && "ring-2 ring-[#B8860B] ring-offset-2 ring-offset-transparent"
              )}
            >
              <AnimatePresence mode="wait">
                {!displayAsAssigned ? (
                  // UNASSIGNED VIEW (initial state for assigned pills)
                  <motion.div
                    key="unassigned"
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                    className="absolute top-0 left-0 right-0 bottom-0 flex flex-col"
                  >
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-500">--</span>
                    </div>
                    <Separator className="w-full bg-white/20" />
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#B8860B] to-[#A0740A] flex items-center justify-center py-3 rounded-b-lg before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none">
                      <span className="text-xs font-semibold uppercase text-gray-400">
                        {pill.label}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  // ASSIGNED VIEW (after animation triggers)
                  <motion.div
                    key="assigned"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex flex-col items-center justify-center"
                  >
                    <motion.div
                      className="w-full flex items-center justify-center"
                      initial={{ y: 15, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
                    >
                      <span className={cn("text-xs font-semibold uppercase", colors.text)}>
                        {pill.label}
                      </span>
                    </motion.div>
                    <Separator className="my-1 w-full bg-white/20" />
                    <motion.div
                      className="w-full flex items-center justify-center"
                      initial={{ y: 20, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.35, ease: "easeOut" }}
                    >
                      <span className={cn("text-2xl font-bold font-mono", colors.text)}>
                        {pill.number}
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Glow effect CSS - exact match to SweepstakesBoardCard */}
      <style jsx>{`
        .glow-border-gold {
          box-shadow: 0 8px 20px 4px rgba(${accentGlowRgb}, 0.55);
        }
      `}</style>
    </div>
  );
}
