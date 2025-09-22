'use client'

import { memo, useMemo } from 'react';
import Image from 'next/image';
import { Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sport } from '@/types/lobby';

interface TourSportSelectorProps {
  sports: Sport[];
  sweepstakesStartTime?: Date | null;
  sportSelectorView: 'sweepstakes' | 'allRegularSports';
  setSportSelectorView: (view: 'sweepstakes' | 'allRegularSports') => void;
}

const TourSportSelector = memo(function TourSportSelector({
  sports,
  sweepstakesStartTime,
  sportSelectorView,
  setSportSelectorView,
}: TourSportSelectorProps) {
  const countdownString = useMemo(() => {
    const target = sweepstakesStartTime;
    if (!target || isNaN(target.getTime())) return 'Starting Soon';
    const diff = +target - +new Date();
    if (diff <= 0) return 'Starting Soon';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
    const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
    return (d > 0 ? `${d}d:` : '') + `${h}h:${m}m:${s}s`;
  }, [sweepstakesStartTime]);

  const variants = {
    hidden: { opacity: 0, transition: { duration: 0.2 } },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };

  const onMore = () => setSportSelectorView('allRegularSports');
  const onSweepstakes = () => setSportSelectorView('sweepstakes');

  return (
    <div className="mb-2 w-full min-h-[64px]">
      <div className="w-full" data-tour="sport-selector">
        <AnimatePresence mode="wait" initial={false}>
          {sportSelectorView === 'sweepstakes' ? (
            <motion.div
              key="tour-sweepstakes-view"
              className="flex w-full items-center gap-1 px-0.5 sm:px-[50px]"
              initial="hidden" animate="visible" exit="exit" variants={variants}
            >
              <button
                key="sweepstakes-active"
                type="button"
                onClick={onSweepstakes}
                className={cn(`
                  h-[48px] rounded-lg
                  flex flex-col items-center justify-center 
                  transition-all duration-200 ease-in-out 
                  relative group 
                  flex-grow basis-3/4 
                  border border-[#F0E68C] 
                  bg-gradient-to-b from-background-primary via-[#B8860B]/50 via-[12%] to-[#B8860B] 
                  shadow-[0_0_15px_0px_rgba(184,134,11,0.5)] 
                  hover:brightness-110 hover:shadow-[0_0_20px_2px_rgba(184,134,11,0.7)] hover:border-white
                `)}
                data-tour-allow="sweepstakes"
              >
                <div className="relative z-10 flex flex-col items-center justify-center space-y-0.5">
                  <span className="text-[10px] text-[#F0E68C] font-semibold uppercase tracking-wider">COUNTDOWN</span>
                  <span className="text-xl text-[#F0E68C] font-bold font-mono tracking-tight">
                    {countdownString}
                  </span>
                </div>
              </button>

              <button
                key="more-sports"
                type="button"
                onClick={onMore}
                className={cn(`
                  flex-shrink-0 h-[48px] rounded-lg
                  flex flex-col items-center justify-center space-y-0.5
                  transition-all duration-200 ease-in-out 
                  relative group border
                  flex-grow basis-1/4 
                `, 
                  'border-accent-2 bg-gradient-to-b from-background-primary to-[#220248] shadow-[0_4px_12px_-4px_rgba(99,102,241,0.5)] backdrop-blur-sm',
                  'hover:brightness-125 hover:shadow-[0_6px_15px_-3px_rgba(99,102,241,0.6)] hover:border-white'
                )}
                data-tour-allow="more"
              >
                <div className="relative z-10 flex flex-col items-center justify-center space-y-0.5">
                  <span className="text-xs font-medium text-text-primary">More</span>
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="tour-all-sports-view"
              className="relative flex w-full items-center gap-1 px-0.5 sm:px-[50px]"
              initial="hidden" animate="visible" exit="exit" variants={variants}
            >
              <button
                key="back-to-sweepstakes"
                type="button"
                onClick={onSweepstakes}
                className={cn(`
                  h-[48px] rounded-lg
                  flex flex-col items-center justify-center 
                  transition-all duration-200 ease-in-out 
                  relative group border px-2
                  flex-grow flex-basis-0
                  border-gray-600 bg-gradient-to-b from-gray-700 to-gray-800 text-gray-300
                  hover:shadow-[0_0_15px_0px_rgba(184,134,11,0.5)] hover:border-[#F0E68C] hover:text-[#F0E68C] hover:bg-gradient-to-b hover:from-[#B8860B]/40 hover:to-[#B8860B]/90
                `)}
                data-tour-allow="sweepstakes"
              >
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <Ticket size={18} className="mb-0.5" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Sweepstakes</span>
                </div>
              </button>

              <div className="relative flex flex-grow gap-1">
                {sports.filter(s => s.id !== 'sweepstakes').map((sport) => (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={(e) => { e.preventDefault(); }}
                    data-sport-tab
                    className={cn(`
                      h-[48px] rounded-lg
                      flex flex-col items-center justify-center space-y-0.5
                      transition-all duration-200 ease-in-out 
                      relative group border
                      flex-grow flex-basis-0
                      min-w-[56px] sm:min-w-[64px] px-2
                    `, 'border-gray-700 bg-background-secondary text-gray-400')}
                  >
                    {typeof sport.iconDefault === 'string' ? (
                      <Image src={sport.iconDefault} alt={sport.name} width={18} height={18} className="object-contain opacity-70" />
                    ) : (
                      <Ticket size={18} className="object-contain text-gray-500" />
                    )}
                    <span className="text-[9px] sm:text-[11px] font-medium uppercase tracking-wider text-gray-500">
                      {sport.name}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default TourSportSelector;


