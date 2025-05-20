import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, X } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from 'react-hot-toast';

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
  gameId: string; // Retained if needed for any specific logic here, though maybe not directly used in UI
  takenNumbers: Set<number>;
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
    gameId,
    takenNumbers,
  } = props;

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) { onProtectedAction(); return; }
    if (!isActiveCard) handleBoardAction('START_ENTRY', boardId);
    let val = e.target.value;
    if (val.length > 2) val = val.slice(0, 2);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 99) {
        handleBoardAction('SET_NUMBER', boardId, num);
    } else if (val === '') {
        handleBoardAction('SET_NUMBER', boardId, null);
    }
  };

  const handleConfirmClick = async () => {
    if (!user) { onProtectedAction(); return; }
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

    const toastId = toast.loading('Processing entry...');
    const functions = getFunctions();
    const enterBoardFn = httpsCallable(functions, 'enterBoard');
    try {
        const result = await enterBoardFn({ boardId: boardId, selectedNumber: selectedNumInt });
        toast.dismiss(toastId);
        if ((result.data as any)?.success) {
            toast.success('Entry successful! Your square is locked in.');
            handleBoardAction('ENTRY_COMPLETED_RESET', boardId); // Signal LobbyPage to reset
        } else {
            throw new Error((result.data as any)?.error || 'Cloud function reported failure.');
        }
    } catch (err: any) {
        toast.dismiss(toastId);
        console.error("CONFIRM_ENTRY error (QuickEntrySelector):", err);
        toast.error(err.message || "Failed to process entry. Please try again.");
        // Optionally, reset to selecting stage on error to allow retry
        // handleBoardAction('CANCEL_CONFIRM', boardId);
    }
  };

  if (!isActiveCard || stage === 'idle') {
    return (
      <Button 
        onClick={() => {
            if (!user) { onProtectedAction(); return; }
            handleBoardAction('START_ENTRY', boardId);
        }}
        className="w-full bg-accent-1 hover:bg-accent-1/90 text-white font-semibold shadow-md"
        disabled={walletIsLoading} // Potentially disable if wallet still loading crucial info for fee boards
      >
        {walletIsLoading && entryFee > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Enter Board ${entryFee > 0 ? `(\$${entryFee.toFixed(2)})` : '(Free)'}
      </Button>
    );
  }

  if (stage === 'selecting') {
    return (
      <div className="flex flex-col items-center space-y-2">
        <Input 
          type="number"
          placeholder="#"
          value={selectedNumber ?? ''}
          onChange={handleNumberChange}
          className="text-center text-xl font-bold h-12 bg-background-secondary border-primary/50 focus:border-primary"
          min="0" max="99"
        />
        <Button 
          onClick={() => {
            if (selectedNumber === null || String(selectedNumber).trim() === '') {
                toast.error("Please enter a 2-digit number."); return;
            }
            if (takenNumbers.has(parseInt(String(selectedNumber),10))){
                toast.error("Number already taken."); return;
            }
            handleBoardAction('REQUEST_CONFIRM', boardId);
          }}
          className="w-full bg-primary hover:bg-primary/90 text-white"
          disabled={selectedNumber === null || String(selectedNumber).trim() === '' || takenNumbers.has(parseInt(String(selectedNumber),10))}
        >
          Select Square
        </Button>
      </div>
    );
  }

  if (stage === 'confirming') {
    return (
      <div className="flex flex-col items-center space-y-3 p-3 bg-background-secondary rounded-lg border border-primary/70 shadow-lg">
        <div className="text-center">
            <p className="text-sm text-gray-400">Confirm Entry for Square:</p>
            <p className="text-4xl font-bold text-white">{String(selectedNumber).padStart(2, '0')}</p>
            <p className="text-md text-accent-1 mt-1">Fee: ${entryFee.toFixed(2)}</p>
        </div>
        <div className="flex w-full space-x-2">
            <Button 
                onClick={() => handleBoardAction('CANCEL_CONFIRM', boardId)} 
                variant="outline"
                className="flex-1 border-gray-600 hover:bg-gray-700 text-gray-300"
            >
                <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button 
                onClick={handleConfirmClick} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={walletIsLoading} // Disable while any critical wallet info is loading for fee boards
            >
                {walletIsLoading && entryFee > 0 ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4"/>}
                 Confirm
            </Button>
        </div>
      </div>
    );
  }

  return null; // Should not reach here
});
QuickEntrySelector.displayName = 'QuickEntrySelector';

export default QuickEntrySelector; 