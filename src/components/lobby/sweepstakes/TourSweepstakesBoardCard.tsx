'use client'

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
const StarfieldBackground = dynamic(() => import('@/components/effects/StarfieldBackground'), { ssr: false });

type TourSweepstakesBoardCardProps = {
  tourStepId?: string;
};

const stageOrder = ['selector','input','grid','enter','confirm','response','guidelines','wallet'];

export default function TourSweepstakesBoardCard({ tourStepId }: TourSweepstakesBoardCardProps) {
  const accentGlowRgb = '184, 134, 11';
  const highlighted = 37; // demo value

  const squares = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);
  const router = useRouter();

  const currentStage = typeof tourStepId === 'string' ? tourStepId : undefined;
  const isStage = (stage: string) => currentStage === stage;
  const isStageAfter = (stage: string) => {
    const idx = stageOrder.indexOf(stage);
    const currentIdx = stageOrder.indexOf(currentStage ?? 'selector');
    return currentIdx >= idx && idx !== -1;
  };

  const isResponseOrLater = isStage('response') || isStageAfter('response');
  const isGuidelinesStage = isStage('guidelines');

  const containerStyle = {
    background: `linear-gradient(to bottom, rgb(var(--color-background-primary)) 0%, #B8860B 15%, #B8860B 100%)`,
    boxShadow: `0 8px 20px 4px rgba(${accentGlowRgb}, 0.55)`
  };

  return (
    <>
      <div
        data-tour={isStage('response') ? 'sweepstakes-response' : undefined}
        className="p-4 rounded-xl shadow-lg max-w-xs sm:max-w-sm md:max-w-md mx-auto mt-6 relative mb-20"
        style={containerStyle}
      >
        <div className={cn('relative z-10 transition-all duration-300', isGuidelinesStage ? 'opacity-15 blur-sm pointer-events-none select-none' : 'opacity-100')}>
          <div className="p-3 mb-3 rounded-md bg-black/10 backdrop-blur-sm flex items-center justify-between space-x-2 min-h-16">
            <span className={cn(
              'text-sm sm:text-base text-white font-semibold select-none min-w-0',
              isResponseOrLater ? 'flex-1 text-left text-emerald-200' : undefined
            )}>
              {isResponseOrLater
                ? (
                    <span className="flex items-center gap-3">
                      <span>You're already entered!</span>
                      <span className="flex items-center gap-2 text-emerald-300">
                        <Ticket className="h-5 w-5" />
                        <span>Good Luck!</span>
                      </span>
                    </span>
                  )
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
                isStage('confirm') ? 'flex-grow justify-evenly space-x-2' : 'flex-shrink-0 justify-end gap-2'
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
                <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                  <Ticket className="h-6 w-6" />
                  <span>Entry locked in.</span>
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
          {isStage('response') && (
            <div className="mt-4 rounded-lg bg-emerald-600/20 border border-emerald-400/30 p-4 text-emerald-100 shadow-[0_6px_18px_rgba(16,185,129,0.35)]">
              <div className="text-sm font-semibold text-emerald-200">Entry successful! Good luck!</div>
              <div className="text-xs text-emerald-100/80 mt-1">Watch for results after the game kicks off. We'll email your entry receipt.</div>
            </div>
          )}
        </div>
      </div>

      {isStage('guidelines') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" data-tour-overlay="sweepstakes-guidelines">
          <StarfieldBackground className="absolute inset-0 z-40 opacity-80" />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40" />
          <div
            data-tour="sweepstakes-guidelines"
            className="relative z-50 pointer-events-auto w-full sm:max-w-md rounded-2xl bg-gradient-to-b from-background-primary/80 via-background-primary/70 to-accent-2/10 border border-white/10 text-white backdrop-blur-xl shadow-[0_0_1px_1px_rgba(255,255,255,0.1)] backdrop-saturate-150 p-6"
          >
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight">Sweepstakes Guidelines</h3>
              <p className="text-sm text-white/70">
                Review the sweepstakes requirements before continuing. Agreeing will take you to wallet setup to verify eligibility.
              </p>
            </div>

            <div className="mt-5 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/85 space-y-3 text-left">
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  One free weekly entry is available on the featured $1 board. Additional squares require paid entry, but the free pick can only be
                  used once per weekly period.
                </li>
                <li>
                  Unclaimed squares at kickoff convert to house squares and are not eligible to win.
                </li>
                <li>
                  Prizes pay out across four periods (end of Q1, halftime, end of Q3, final score) with 20% of the credited pot each.
                </li>
                <li>
                  Confirm your profile and wallet details so winnings can be credited immediately. Review the full sweepstakes rules and alternate entry
                  methods in the Help Center before entering.
                </li>
              </ul>
              <p className="text-xs text-white/60">
                By agreeing, you acknowledge that you meet eligibility requirements and consent to location verification within wallet setup.
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => e.preventDefault()}
                className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                Skip for now
              </Button>
              <Button
                type="button"
                onClick={() => router.push('/wallet-setup/location')}
                className="flex-1 bg-gradient-to-r from-accent-2/60 via-accent-1/45 to-accent-2/60 hover:opacity-90"
              >
                Agree & Continue
              </Button>
            </div>
          </div>
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
    </>
  );
}



