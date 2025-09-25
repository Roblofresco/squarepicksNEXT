'use client'

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

type TourSweepstakesBoardCardProps = {
  tourStepId?: string;
};

export default function TourSweepstakesBoardCard({ tourStepId }: TourSweepstakesBoardCardProps) {
  const accentGlowRgb = '184, 134, 11';
  const highlighted = 37; // demo value

  const squares = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);

  const currentStage = typeof tourStepId === 'string' ? tourStepId : undefined;
  const isStage = (stage: string) => currentStage === stage;

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

      {/* Step 3+ staged panels */}
      {isStage('confirm') && (
        <div
          data-tour="sweepstakes-confirm"
          className="mt-4 rounded-lg bg-black/25 border border-white/10 p-4 flex flex-col gap-3"
        >
          <div className="text-sm text-white/80">Confirm your entry for number <span className="font-semibold text-accent-1">{String(highlighted).padStart(2, '0')}</span>.</div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              className="flex-1 px-3 py-2 rounded-md border border-white/10 text-white/60 bg-white/5 cursor-not-allowed"
            >
              Back
            </button>
            <button
              type="button"
              disabled
              className="flex-1 px-3 py-2 rounded-md bg-gradient-to-r from-[#1bb0f2] to-[#6366f1] text-white font-semibold opacity-90 cursor-not-allowed"
            >
              Confirm Entry
            </button>
          </div>
        </div>
      )}

      {isStage('response') && (
        <div
          data-tour="sweepstakes-response"
          className="mt-4 rounded-lg bg-emerald-600/20 border border-emerald-400/30 p-4"
        >
          <div className="text-sm font-semibold text-emerald-200">You're entered!</div>
          <div className="text-xs text-emerald-100/80 mt-1">Watch for results after the game kicks off. We'll email your entry receipt.</div>
        </div>
      )}

      {isStage('guidelines') && (
        <div
          data-tour="sweepstakes-guidelines"
          className="mt-4 rounded-lg bg-black/25 border border-white/10 p-4 space-y-2"
        >
          <div className="text-sm font-semibold text-white">Sweepstakes Guidelines</div>
          <ul className="text-xs text-white/70 list-disc list-inside space-y-1">
            <li>One free entry per user, per event.</li>
            <li>Entries lock 30 minutes before kickoff.</li>
            <li>Winners contacted via verified email.</li>
          </ul>
          <div className="text-xs text-white/70 pt-1">To enter future sweepstakes, verify your identity and set up your SquarePicks wallet.</div>
        </div>
      )}

      {isStage('wallet') && (
        <div
          data-tour="sweepstakes-wallet-cta"
          className="mt-4 rounded-lg bg-black/25 border border-white/10 p-4"
        >
          <div className="text-sm text-white font-semibold mb-3">Finish setup to keep entering</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled
              className="w-full px-3 py-2 rounded-md border border-white/15 text-white/70 bg-white/5 cursor-not-allowed"
            >
              Skip for now
            </button>
            <button
              type="button"
              disabled
              className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-[#1bb0f2] to-[#6366f1] text-white font-semibold opacity-90 cursor-not-allowed"
            >
              Go to Wallet Setup
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .glow-border-gold { box-shadow: 0 8px 20px 4px rgba(${accentGlowRgb}, 0.55); }
      `}</style>
    </div>
  );
}



