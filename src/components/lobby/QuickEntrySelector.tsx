import React, { memo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, X } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Define EntryInteractionState stages if not imported from a central types file
// For now, defining stages directly as QuickEntrySelectorProps needs it.
// type InteractionStage = 'idle' | 'selecting' | 'confirming';

// Props for QuickEntrySelector
interface QuickEntrySelectorProps {
  entryFee: number;
  isActiveCard: boolean;
  stage: 'idle' | 'selecting' | 'confirming'; // Use the specific stages
  selectedNumber: number | string | null;
  handleBoardAction: (action: string, boardId: string, value?: any) => void;
  boardId: string;
  user: FirebaseUser | null;
  onProtectedAction: () => void; // Retained if direct user check is needed, though parent BoardCard might handle this
  walletHasWallet: boolean | null;
  walletBalance: number;
  walletIsLoading: boolean;
  openWalletDialog: (type: 'setup' | 'deposit', requiredAmount?: number, boardIdToEnter?: string | null) => void;
  takenNumbers: Set<number>;
  onPurchaseSuccess: (boardId: string) => void; // Added new prop
}

// Shake animation styles (co-located with the component using it)
const ShakeAnimation = () => (
  <style jsx global>{`
    @keyframes shake {
      0% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-8px); }
      80% { transform: translateX(8px); }
      100% { transform: translateX(0); }
    }
    .animate-shake {
      animation: shake 0.5s;
    }
  `}</style>
);

const SheenEffect = () => (
  <span 
    className="absolute top-0 left-[-100%] w-full h-full transition-all duration-500 ease-in-out group-hover:left-[100%]"
    style={{
      background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
      pointerEvents: 'none', // Ensure it doesn't block clicks
      transform: 'skewX(-25deg)',
    }}
  />
);

// Global styles to hide number input spinners and animate placeholder
const HideNumberInputSpinners = () => (
  <style jsx global>{`
    /* For Webkit browsers like Chrome, Safari, Edge */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
    }
    /* For Firefox */
    input[type="number"] {
      -moz-appearance: textfield;
    }

    @keyframes opacityPulse {
      0%, 100% { opacity: 0.5; } /* Adjusted for visibility */
      50% { opacity: 1; }
    }

    input.animate-placeholder-pulse::placeholder {
      animation: opacityPulse 3.5s infinite ease-in-out; /* Changed duration to 3.5s */
      /* Ensure placeholder base color is set if not inherited, e.g., color: #yourplaceholdercolor; */
      /* However, ::placeholder color is usually inherited or set via input's color if not distinct */
    }
  `}</style>
);

const QuickEntrySelector = memo((props: QuickEntrySelectorProps) => {
  const {
    entryFee,
    isActiveCard,
    stage,
    selectedNumber,
    handleBoardAction,
    boardId,
    user,
    onProtectedAction,
    walletHasWallet,
    walletBalance,
    walletIsLoading,
    openWalletDialog,
    takenNumbers,
    onPurchaseSuccess, // Destructure new prop
  } = props;

  const wrapperRef = useRef<HTMLDivElement>(null); // Added ref for the wrapper

  // const [isPriceAreaHovered, setIsPriceAreaHovered] = React.useState(false); // Removed
  const [isEnterButtonHovered, setIsEnterButtonHovered] = React.useState(false);
  const [isRandomButtonActive, setIsRandomButtonActive] = React.useState(false); // For Random button click effect
  const [isConfirmingLoading, setIsConfirmingLoading] = React.useState(false); // For loading state in confirming view

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (isActiveCard && (stage === 'selecting' || stage === 'confirming')) {
          // console.log('[QES handleClickOutside] Clicked outside, resetting. BoardId:', boardId);
          handleBoardAction('ENTRY_COMPLETED_RESET', boardId);
        }
      }
    };

    if (isActiveCard && (stage === 'selecting' || stage === 'confirming')) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActiveCard, stage, boardId, handleBoardAction, wrapperRef]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) { onProtectedAction(); return; }
    if (!isActiveCard) handleBoardAction('START_ENTRY', boardId);
    
    const val = e.target.value;
    // Allow only numbers and limit to 2 digits
    const numericVal = val.replace(/[^0-9]/g, '').slice(0, 2);

    if (numericVal === '') {
      handleBoardAction('SET_NUMBER', boardId, null);
    } else {
      const num = parseInt(numericVal, 10);
      // This check might seem redundant given the regex, but good for safety
    if (!isNaN(num) && num >= 0 && num <= 99) {
        handleBoardAction('SET_NUMBER', boardId, num);
      } else {
        // If somehow an invalid character gets through or parsing fails, 
        // set to null or previous valid number. For now, set to what numericVal holds.
        // This case should ideally not be hit if regex is robust.
        handleBoardAction('SET_NUMBER', boardId, numericVal); 
      }
    }
  };

  const handleConfirmClick = async () => {
    if (!user) { onProtectedAction(); return; }
    console.log('[QES handleConfirmClick] Current selectedNumber:', selectedNumber, 'BoardId:', boardId);
    if (selectedNumber === null || String(selectedNumber).trim() === '') {
        toast.error("Please select a number.");
        return;
    }
    const selectedNumInt = parseInt(String(selectedNumber), 10);
    if (isNaN(selectedNumInt) || selectedNumInt < 0 || selectedNumInt > 99) {
        toast.error("Invalid number selected.");
        return;
    }
    if (takenNumbers.has(selectedNumInt)) {
        toast.error("This number is already taken.");
        return;
    }

    // Wallet and Balance Checks before calling cloud function
    if (entryFee > 0) {
        if (walletHasWallet === false) {
            openWalletDialog('setup', entryFee, boardId);
            return;
        }
        if (walletBalance < entryFee) {
            openWalletDialog('deposit', entryFee, boardId);
            return;
        }
    }

    setIsConfirmingLoading(true);
    const functions = getFunctions(getApp(), 'us-east1');
    const enterBoardFn = httpsCallable(functions, 'enterBoard');
    try {
        const result = await enterBoardFn({ boardId: boardId, selectedNumber: selectedNumInt });
        if ((result.data as any)?.success) {
            onPurchaseSuccess(boardId); // Trigger parent to show success dialog
            handleBoardAction('ENTRY_COMPLETED_RESET', boardId); // Signal LobbyPage to reset UI
        } else {
            throw new Error((result.data as any)?.error || 'Cloud function reported failure.');
        }
    } catch (err: any) {
        console.error("CONFIRM_ENTRY error (QuickEntrySelector):", err);
        toast.error(err.message || "Failed to process entry. Please try again.");
    } finally {
        setIsConfirmingLoading(false);
    }
  };

  if (!isActiveCard || stage === 'idle') {
    return (
      <motion.div ref={wrapperRef} className="rounded-lg overflow-hidden shadow-md w-full" style={{ borderRadius: '10px' }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
        {/* Price Display Area */}
        <div 
          className="flex justify-center items-center bg-black/20 backdrop-blur-sm border-t border-white/10"
          style={{
            width: '100%', 
            height: '95px',
          }}
        >
          <span 
            style={{
              fontFamily: 'Manjari, sans-serif', 
              fontWeight: 700,
              fontSize: '36px', 
              lineHeight: '1.171875', 
              textAlign: 'center',
              color: '#F3F4F6',
              textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
            }}
          >
            ${entryFee > 0 ? `${entryFee.toFixed(2)}` : 'Free'}
          </span>
        </div>
        {/* Enter Button Area */}
      <Button 
        onClick={() => {
            if (!user) { onProtectedAction(); return; }
            if (entryFee > 0) {
                if (walletHasWallet === false) {
                    openWalletDialog('setup', entryFee, boardId);
                    return;
                }
                if (walletBalance < entryFee) {
                    openWalletDialog('deposit', entryFee, boardId);
                    return;
                }
            }
            handleBoardAction('START_ENTRY', boardId);
        }}
          className="w-full font-semibold text-sm relative overflow-hidden transition-all duration-300 ease-in-out group"
          style={{
            // Adjusted gradient for more pronounced effect
            backgroundImage: 'linear-gradient(to bottom right, rgba(108, 99, 255, 1), rgba(68, 62, 180, 1))',
            color: '#FFFFFF',
            padding: '8px',
            borderRadius: '0 0 10px 10px',
            lineHeight: '1.1428571428571428',
            fontFamily: 'Inter, sans-serif',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)', // Slightly more visible top border
          }}
          onMouseEnter={() => setIsEnterButtonHovered(true)}
          onMouseLeave={() => setIsEnterButtonHovered(false)}
          disabled={walletIsLoading && entryFee > 0}
      >
        {walletIsLoading && entryFee > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Enter
          {/* Sheen effect - implemented as a pseudo-element would be cleaner with Tailwind/CSS classes */}
          {/* For now, an overlay span that animates */}
          <SheenEffect />
      </Button>
      </motion.div>
    );
  }

  if (stage === 'selecting') {
    return (
      <AnimatePresence mode="wait">
      <motion.div key="selecting" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
        <HideNumberInputSpinners />
        <div ref={wrapperRef} className="rounded-lg overflow-hidden shadow-md w-full flex flex-col items-center" style={{ borderRadius: '10px' }}>
          {/* Random Button - New Element based on Figma */}
          <Button
            onClick={() => {
              if (!user) { onProtectedAction(); return; }
              setIsRandomButtonActive(true);
              setTimeout(() => setIsRandomButtonActive(false), 150); // Reset active state for visual feedback
              const availableNumbers = Array.from(Array(100).keys()).filter(n => !takenNumbers.has(n));
              if (availableNumbers.length > 0) {
                const randomNum = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
                handleBoardAction('SET_NUMBER', boardId, randomNum);
              } else {
                toast.error("No available numbers to select randomly.");
              }
            }}
            className="w-full text-sm font-semibold py-2 transition-all duration-150 ease-in-out"
            style={{
              backgroundImage: 'linear-gradient(to top left, #5855E4, #403DAA)',
              color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              borderRadius: '10px 10px 0 0',
              padding: '8px',
              transform: isRandomButtonActive ? 'scale(0.98)' : 'scale(1)',
              filter: isRandomButtonActive ? 'brightness(0.9)' : 'brightness(1)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            Random
          </Button>

          {/* Number Input/Display Area */}
          <div 
            className="w-full flex justify-center items-center transition-all duration-200 ease-out bg-black/20 backdrop-blur-sm border-y border-white/10"
            style={{ 
              height: '95px',
              boxShadow: selectedNumber !== null && String(selectedNumber).trim() !== '' ? '0 0 8px 2px rgba(128, 90, 213, 0.5)' : 'none',
            }}
          >
        <Input 
              id="selectedNumberInput"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="##"
          value={selectedNumber ?? ''}
          onChange={handleNumberChange}
              className={`text-center font-extrabold h-full w-full bg-transparent border-none focus:ring-0 appearance-none m-0 ${
                (selectedNumber === null || String(selectedNumber).trim() === '') ? 'animate-placeholder-pulse' : ''
              }`}
          min="0" max="99"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '50px',
                color: '#F3F4F6',
                lineHeight: '95px',
                MozAppearance: 'textfield',
                WebkitAppearance: 'none',
                margin: 0,
                padding: 0,
                textAlign: 'center',
                caretColor: '#F3F4F6',
              }}
            />
          </div>

          {/* Confirm Button */}
        <Button 
          onClick={() => {
            if (selectedNumber === null || String(selectedNumber).trim() === '') {
                  toast.error("Please enter or select a number."); return;
              }
              const num = parseInt(String(selectedNumber), 10);
              if (isNaN(num) || num < 0 || num > 99) {
                toast.error("Invalid number. Please enter a number between 0 and 99."); return;
              }
              if (takenNumbers.has(num)){
                  toast.error("Number already taken. Please choose another."); return;
            }
            handleBoardAction('REQUEST_CONFIRM', boardId);
          }}
            className="w-full text-sm font-semibold py-2 relative overflow-hidden transition-all duration-200 ease-in-out hover:brightness-110 hover:scale-[1.02] group"
            style={{
              // Using a gradient similar to State 1's Enter button but can be adjusted
              backgroundImage: 'linear-gradient(to bottom right, rgba(108, 99, 255, 1), rgba(68, 62, 180, 1))',
              color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              borderRadius: '0 0 10px 10px',
              padding: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)', // Consistent with Enter button
            }}
            disabled={selectedNumber === null || String(selectedNumber).trim() === ''}
          >
            Confirm?
            {/* Optional: Sheen effect like State 1, if desired */}
            <SheenEffect />
        </Button>
      </div>
      </motion.div>
      </AnimatePresence>
    );
  }

  if (stage === 'confirming') {
    return (
      <motion.div
        ref={wrapperRef}
        className="rounded-lg overflow-hidden shadow-md w-full flex flex-col items-center"
        style={{ borderRadius: '10px' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        {/* Header bar duplicated from state 2, rendered as a non-interactive div */}
        <div
          className="w-full text-center text-sm font-semibold py-2 transition-all duration-150 ease-in-out"
          style={{
            backgroundImage: 'linear-gradient(to top left, #5855E4, #403DAA)',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '10px 10px 0 0',
            padding: '8px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          Confirm
        </div>

        {/* Middle display area (same height and bg as the number input area in state 2) */}
        <div
          className="w-full min-w-0 flex flex-col items-center justify-center gap-1 px-2 transition-all duration-200 ease-out bg-black/20 backdrop-blur-sm border-y border-white/10"
          style={{ height: '95px' }}
        >
          <div
            className="font-extrabold text-center leading-none tracking-tight"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(28px, 10vw, 40px)',
              color: '#F3F4F6',
              width: '100%'
            }}
          >
            {String(selectedNumber).padStart(2, '0')}
          </div>
          <div
            className="text-white/80 leading-none whitespace-nowrap text-center"
            style={{ fontSize: 'clamp(9px, 2.8vw, 11px)' }}
          >
            Entry Fee: ${entryFee > 0 ? entryFee.toFixed(2) : '0.00'}
          </div>
        </div>

        {/* Bottom buttons (two equal buttons) */}
        <div className="flex w-full gap-0 min-w-0 items-stretch">
          <Button
            type="button"
            onClick={() => handleBoardAction('ENTRY_COMPLETED_RESET', boardId)}
            variant="outline"
            aria-label="Cancel"
            className="flex-1 text-sm inline-flex items-center justify-center relative overflow-hidden transition-all duration-200 ease-in-out bg-black/30 hover:bg-black/40 border-white/10 text-white backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-accent-1/40 min-w-0 rounded-none rounded-bl-[10px] border-t"
            style={{
              padding: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <X className="h-5 w-5 shrink-0 text-red-400" strokeWidth={3} />
          </Button>
          <Button
            type="button"
            onClick={handleConfirmClick}
            disabled={isConfirmingLoading}
            aria-label="Confirm"
            className="flex-1 text-sm inline-flex items-center justify-center relative overflow-hidden transition-all duration-200 ease-in-out hover:brightness-110 hover:scale-[1.02] min-w-0 rounded-none rounded-br-[10px] border-t"
            style={{
              backgroundImage: 'linear-gradient(to bottom right, rgba(108, 99, 255, 1), rgba(68, 62, 180, 1))',
              color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              padding: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            {isConfirmingLoading ? (
              <Loader2 className="h-5 w-5 animate-spin shrink-0 text-white" strokeWidth={3} />
            ) : (
              <Check className="h-5 w-5 shrink-0 text-green-400" strokeWidth={3} />
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  return null; // Should not reach here
});
QuickEntrySelector.displayName = 'QuickEntrySelector';

export default QuickEntrySelector; 