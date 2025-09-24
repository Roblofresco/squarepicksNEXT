'use client'

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

export default function TourSweepstakesBoardCard() {
  const accentGlowRgb = '184, 134, 11';
  const highlighted = 37; // demo value

  const squares = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);

  return (
    <div
      className={cn(
        'p-4 rounded-xl shadow-lg glow-border-gold max-w-xs sm:max-w-sm md:max-w-md mx-auto mt-6 relative mb-20'
      )}
      style={{ background: `linear-gradient(to bottom, rgb(var(--color-background-primary)) 0%, #B8860B 15%, #B8860B 100%)` }}
    >
      <div className="p-3 mb-3 rounded-md bg-black/10 backdrop-blur-sm flex items-center justify-between space-x-2 min-h-16">
        <span className="text-sm sm:text-base text-white font-semibold select-none min-w-0">
          Choose Your Pick 0-99:
        </span>
        <div className="relative w-20 h-10 flex-shrink-0" data-tour="sweepstakes-input">
          <input
            type="text"
            value={String(highlighted).padStart(2, '0')}
            disabled
            className="w-full h-full text-center bg-black/10 text-[#B8860B] font-mono text-2xl rounded-md border-none placeholder:text-[#B8860B]/70 focus:ring-2 focus:ring-[#B8860B] outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-inner"
          />
        </div>
        <div>
          <button
            type="button"
            disabled
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
      </div>

      <div className="rounded-md bg-black/30 backdrop-blur-xs shadow-inner border-none mt-2" data-tour="sweepstakes-grid">
        <div className={cn('grid grid-cols-10 aspect-square w-full rounded-md p-[6px] gap-[6px] bg-black/10')}>
          {squares.map((sq) => {
            const isSelected = sq === highlighted;
            return (
              <div
                key={sq}
                data-tour={isSelected ? 'sweepstakes-grid-selected' : undefined}
                className={cn(
                  'aspect-square flex items-center justify-center font-mono transition-all duration-150 ease-in-out',
                  'border border-black/20 rounded-sm',
                  isSelected
                    ? 'bg-gradient-to-br from-black/10 to-yellow-700/20 text-[#B8860B] text-sm sm:text-base shadow-[0_0_12px_2px_rgba(184,134,11,0.7)]'
                    : 'bg-gradient-to-br from-black/10 to-black/20 text-[#B8860B] text-[9px] sm:text-[10px]'
                )}
              >
                {String(sq).padStart(2, '0')}
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .glow-border-gold { box-shadow: 0 8px 20px 4px rgba(${accentGlowRgb}, 0.55); }
      `}</style>
    </div>
  );
}



