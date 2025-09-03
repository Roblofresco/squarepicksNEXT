import React from 'react';
import clsx from 'clsx';

export type WalletMoneyContainerProps = {
  title?: string;
  variant?: 'blue' | 'green' | 'purple';
  className?: string;
  bottomless?: boolean;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

function getVariantColors(variant: WalletMoneyContainerProps['variant']) {
  switch (variant) {
    case 'green':
      return {
        walletBg: 'bg-[#1f2937]',
        gradOverlay: 'from-[#14532d] via-[#166534]/70 to-[#16a34a]/60',
        bill1Grad: 'bg-gradient-to-tr from-[#0f3b28] to-[#0b261b]',
        bill2Grad: 'bg-gradient-to-tr from-[#145235] to-[#0f2f22]',
        bill3Grad: 'bg-gradient-to-tr from-[#1a6a44] to-[#12402b]',
        interior: 'bg-[#0b1222]',
      };
    case 'purple':
      return {
        walletBg: 'bg-[#3b1b6c]',
        gradOverlay: 'from-[#581c87] via-[#7c3aed]/70 to-[#8b5cf6]/60',
        bill1Grad: 'bg-gradient-to-tr from-[#3a1762] to-[#240d3d]',
        bill2Grad: 'bg-gradient-to-tr from-[#4a1a7f] to-[#2b0f4d]',
        bill3Grad: 'bg-gradient-to-tr from-[#5a1ea0] to-[#34125f]',
        interior: 'bg-[#0b1222]',
      };
    case 'blue':
    default:
      return {
        walletBg: 'bg-[#111827]',
        gradOverlay: 'from-[#5855e4] via-accent-1/60 to-accent-2/60',
        bill1Grad: 'bg-gradient-to-tr from-[#1c2550] to-[#0b1222]',
        bill2Grad: 'bg-gradient-to-tr from-[#24306a] to-[#0f1730]',
        bill3Grad: 'bg-gradient-to-tr from-[#2f3c84] to-[#142042]',
        interior: 'bg-[#0b1222]',
      };
  }
}

export const WalletMoneyContainer: React.FC<WalletMoneyContainerProps> = ({
  title = 'Recent Activities',
  variant = 'blue',
  className,
  bottomless = false,
  footer,
  headerActions,
  children,
}) => {
  const c = getVariantColors(variant);

  const containerRounding = bottomless ? 'rounded-t-3xl' : 'rounded-3xl';
  const containerBorder = bottomless ? 'border-x border-t' : 'border';
  const overlayRounding = bottomless ? 'rounded-t-3xl' : 'rounded-3xl';
  const maskRounding = bottomless ? 'rounded-none' : 'rounded-b-3xl';

  return (
    <div className={clsx(
      'relative overflow-visible w-full',
      containerRounding,
      containerBorder,
      'border-accent-1/30',
      className,
    )}>
      {/* Surface layer above bills: background + subtle gradient */}
      <div className={clsx('absolute inset-0 z-10', overlayRounding, 'bg-background-primary/40')} />
      <div className={clsx('absolute inset-0 z-10 opacity-20 bg-gradient-to-tr', overlayRounding, c.gradOverlay)} />

      {/* Wallet body raised to overlap bills (thin bar) */}
      <div className={clsx('relative z-30 mx-auto mt-4 mb-2 h-[5px] w-full max-w-none rounded-b-2xl', c.walletBg)} />

      {/* Mask that matches the main container look and hides bills fully */}
      <div className={clsx('absolute inset-x-0 bottom-0 top-[21px] z-20 overflow-hidden pointer-events-none', maskRounding)}>
        <div className="absolute inset-0 bg-background-primary" />
        <div className={clsx('absolute inset-0 opacity-20 bg-gradient-to-tr', c.gradOverlay)} />
      </div>

      {/* Dollar bills behind entire container */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 sm:-top-3 z-0 h-0 w-full max-w-none">
        <div className={clsx('absolute left-1/2 -translate-x-1/2 -top-6 h-24 w-[88%] rounded-sm', c.bill1Grad)}
             style={{ transform: 'translateX(-50%) rotate(-8deg)' }} />
        <div className={clsx('absolute left-1/2 -translate-x-1/2 -top-[22px] h-24 w-[88%] rounded-sm', c.bill2Grad)}
             style={{ transform: 'translateX(-50%) rotate(-3deg)' }} />
        <div className={clsx('absolute left-1/2 -translate-x-1/2 -top-2 h-24 w-[88%] rounded-sm', c.bill3Grad)}
             style={{ transform: 'translateX(-50%) rotate(2deg)' }} />
      </div>

      {/* Stacked content with pinned footer */}
      <div className="relative z-40 flex min-h-[30vh] flex-col">
        <div className="px-4 pt-1 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-start">
              {headerActions}
            </div>
            <h2 className="text-xl font-semibold text-white text-center flex-1">{title}</h2>
            <div className="flex-1"></div>
          </div>
        </div>
        <div className="px-4 pt-1 sm:px-6 flex-1">
          {children}
        </div>
        {footer ? (
          <div className="px-4 sm:px-6 py-4 mt-4 border-t border-white/10">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default WalletMoneyContainer;
