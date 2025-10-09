'use client'

import React, { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TourSweepstakesBoardCardProps = {
  tourStepId?: string;
  highlightedSquare?: number | null;
  onMounted?: () => void;
};

const stageOrder = ['selector','input','grid','enter','confirm','response'];

export default function TourSweepstakesBoardCard({ tourStepId, highlightedSquare, onMounted }: TourSweepstakesBoardCardProps) {
  const accentGlowRgb = '184, 134, 11';
  const highlighted = highlightedSquare ?? 37;

  const squares = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);
  const currentStage = typeof tourStepId === 'string' ? tourStepId : undefined;
  const isStage = (stage: string) => currentStage === stage;
  const isStageAfter = (stage: string) => {
    const idx = stageOrder.indexOf(stage);
    const currentIdx = stageOrder.indexOf(currentStage ?? 'selector');
    return currentIdx >= idx && idx !== -1;
  };

  const isResponseOrLater = isStage('response') || isStageAfter('response');

  const containerStyle = {
    background: `linear-gradient(to bottom, rgb(var(--color-background-primary)) 0%, #B8860B 15%, #B8860B 100%)`,
    boxShadow: `0 8px 20px 4px rgba(${accentGlowRgb}, 0.55)`
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => onMounted?.());
    return () => cancelAnimationFrame(frame);
  }, [onMounted]);

  return (
    <>
      <div
        data-tour-card="sweepstakes"
        data-tour={isStage('response') ? 'sweepstakes-response' : undefined}
        className="p-4 rounded-xl shadow-lg max-w-xs sm:max-w-sm md:max-w-md mx-auto mt-6 relative mb-20"
        style={containerStyle}
      >
        <div className="relative z-10 transition-all duration-300">
          <div className="p-3 mb-3 rounded-md bg-black/10 backdrop-blur-sm flex items-center justify-between space-x-2 min-h-16">
            <span className="text-sm sm:text-base text-white font-semibold select-none min-w-0">
              {isResponseOrLater
                ? "You're already entered!"
                : isStage('confirm') || isStageAfter('confirm')
                  ? `Selected Pick: ${String(highlighted).padStart(2, '0')}`
                  : 'Choose Your Pick 0-99:'}
            </span>
            {isStage('confirm') && !isResponseOrLater ? (
              <div className="w-0 h-10 flex-shrink-0" />
            ) : (
              !isResponseOrLater && (
                <div className="relative w-20 h-10 flex-shrink-0" data-tour="sweepstakes-input">
                  <input
                    type="text"
                    value={String(highlighted).padStart(2, '0')}
                    disabled
                    className="w-full h-full text-center bg-black/10 text-[#B8860B] font-mono text-2xl rounded-md border-none placeholder:text-[#B8860B]/70 focus:ring-2 focus:ring-[#B8860B] outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-inner"
                  />
                </div>
              )
            )}
            <div
              className={cn(
                'flex items-center',
                isStage('confirm')
                  ? 'flex-grow justify-evenly space-x-2'
                  : 'flex-shrink-0 justify-end'
              )}
            >
              {isStage('confirm') && !isResponseOrLater ? (
                <>
                  <Button
                    data-tour="sweepstakes-confirm"
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className={cn(
                      'px-3 py-2 text-sm font-semibold rounded-md border h-auto flex-1 min-w-0',
                      'bg-[#DAA520] hover:bg-[#B8860B] border-[#8B4513] text-white transition-colors',
                      // Emphasize for tour confirm state to mirror real second-state emphasis
                      'shadow-[0_0_16px_3px_rgba(184,134,11,0.75)] ring-2 ring-[#B8860B]/60'
                    )}
                  >
                    CONFIRM
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    variant="outline"
                    className="px-3 py-2 text-sm font-semibold rounded-md border h-auto border-[#B8860B]/70 text-[#B8860B] hover:bg-[#B8860B]/20 hover:text-yellow-300 transition-colors flex-1 min-w-0"
                  >
                    CANCEL
                  </Button>
                </>
              ) : isResponseOrLater ? (
                <div className="flex-1 flex justify-center items-center">
                  <Ticket className="h-7 w-7 text-green-400" />
                  <span className="ml-2 text-green-400 font-semibold">Good Luck!</span>
                </div>
              ) : (
                <div data-tour="sweepstakes-enter">
                  <button
                    type="button"
                    disabled={!isStage('enter')}
                    className={cn(
                      'px-4 py-2 text-sm font-semibold rounded-md border transition-colors h-10',
                      'text-white border-yellow-700',
                      'bg-gradient-to-br from-yellow-600 via-yellow-700 to-yellow-800',
                      'disabled:bg-gradient-to-br disabled:from-yellow-800/50 disabled:via-yellow-900/50 disabled:to-yellow-950/50 disabled:border-yellow-900/60 disabled:text-yellow-300/60 disabled:cursor-not-allowed'
                    )}
                  >
                    ENTER
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md bg-black/30 backdrop-blur-xs shadow-inner border-none mt-2" data-tour="sweepstakes-grid">
            <div className={cn('grid grid-cols-10 aspect-square w-full rounded-md p-[6px] gap-[6px] bg-black/10')}>
              {squares.map((sq) => {
                const isSelected = sq === highlighted;
                const selectedClasses = 'bg-gradient-to-br from-[#B8860B] to-[#A0740A] text-white text-sm sm:text-base font-semibold shadow-[0_0_12px_2px_rgba(184,134,11,0.55)]';
                const baseClasses = 'bg-gradient-to-br from-black/10 to-black/20 text-[#B8860B] text-[9px] sm:text-[10px]';
                return (
                  <div
                    key={sq}
                    data-tour={isSelected ? 'sweepstakes-grid-selected' : undefined}
                    className={cn(
                      'aspect-square flex items-center justify-center font-mono transition-all duration-150 ease-in-out',
                      'border border-black/20 rounded-sm',
                      isResponseOrLater && isSelected ? selectedClasses : baseClasses
                    )}
                  >
                    {String(sq).padStart(2, '0')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* No additional panel in response stage so the layout mirrors the live card */}
        </div>
      </div>

      {/* Guidelines stage removed; response remains final step */}
    </>
  );
}



