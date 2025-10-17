import { motion } from 'framer-motion';
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
  const pills: WinnerPill[] = [
    { label: 'Q1', number: q1WinningSquare || null, period: 'q1' },
    { label: 'Q2', number: q2WinningSquare || null, period: 'q2' },
    { label: 'Q3', number: q3WinningSquare || null, period: 'q3' },
    { label: 'Final', number: finalWinningSquare || null, period: 'final' },
  ];

  const getPillColor = (period: string, isAssigned: boolean) => {
    if (!isAssigned) {
      return {
        bg: 'bg-black/30',
        border: '',
        text: 'text-gray-600'
      };
    }
    
    if (period === 'final') {
      return {
        bg: 'bg-gradient-to-br from-[#DAA520] to-[#B8860B]',
        border: 'border-[#B8860B]',
        text: 'text-white'
      };
    }
    
    return {
      bg: 'bg-gradient-to-br from-[#B8860B] to-[#A0740A]',
      border: 'border-[#B8860B]',
      text: 'text-white'
    };
  };

  const accentGlowRgb = '184, 134, 11'; // Same as SweepstakesBoardCard
  const gradientStyle = { 
    background: `linear-gradient(to bottom, rgb(var(--color-background-primary)) 0%, #B8860B 15%, #B8860B 100%)` 
  };

  return (
    <div 
      className="p-4 rounded-xl shadow-lg glow-border-gold max-w-xs sm:max-w-sm md:max-w-md mx-auto mt-6 mb-20"
      style={gradientStyle}
    >
      <h3 className="text-white text-lg font-bold mb-4 text-center">
        Winning Squares
      </h3>
      
      <div className="grid grid-cols-4 gap-3">
        {pills.map((pill, idx) => {
          const isAssigned = !!pill.number;
          const colors = getPillColor(pill.period, isAssigned);
          const isCurrent = isLive && currentQuarter === idx + 1;

          return (
            <motion.div
              key={pill.period}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 rounded-lg transition-all",
                colors.bg,
                colors.border && "border-2",
                colors.border,
                isCurrent && "ring-2 ring-[#B8860B] ring-offset-2 ring-offset-transparent"
              )}
            >
              {isAssigned ? (
                <>
                  {/* Assigned: Label container top, Number container bottom */}
                  <div className="w-full flex items-center justify-center">
                    <span className={cn("text-xs font-semibold uppercase", colors.text)}>
                      {pill.label}
                    </span>
                  </div>
                  <Separator className="my-1 w-full bg-white/20" />
                  <div className="w-full flex items-center justify-center">
                    <span className={cn("text-2xl font-bold font-mono", colors.text)}>
                      {pill.number}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {/* Unassigned: Dashes container top, Label container bottom */}
                  <div className="w-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-500">
                      --
                    </span>
                  </div>
                  <Separator className="my-1 w-full bg-white/20" />
                  <div className="w-full flex items-center justify-center">
                    <span className="text-xs font-semibold uppercase text-gray-400">
                      {pill.label}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
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
