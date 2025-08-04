import React from 'react';
import { Button } from '@/components/ui/button';
import { Ticket, DollarSign, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress'; // Using shadcn Progress
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Define the structure of board data (adjust as needed)
interface Board {
  id: string;
  entryFee: number;
  totalPot: number;
  squaresFilled: number;
  maxSquares: number;
  isPremium?: boolean; // Flag for the weekly free entry board
  isFreeEntryAvailable?: boolean; // Flag if user can claim free entry on THIS board
}

// Rename props interface
interface BoardCardExpandedProps {
  board: Board;
}

// Rename component
const BoardCardExpanded: React.FC<BoardCardExpandedProps> = ({ board }) => {
  const router = useRouter();
  const {
    id,
    entryFee,
    totalPot,
    squaresFilled,
    maxSquares,
    isPremium = false,
    isFreeEntryAvailable = false
  } = board;

  const progressValue = (squaresFilled / maxSquares) * 100;
  const isFree = entryFee === 0 || (isPremium && isFreeEntryAvailable);
  const displayEntryFee = isFree ? 'FREE' : `$${entryFee}`;

  return (
    <div className={cn(
      "relative border border-border/50 rounded-lg overflow-hidden bg-card/30 backdrop-blur-sm shadow-lg",
      "transition-all duration-300 hover:border-primary/60 hover:shadow-primary/10",
      isPremium && "border-primary/80 shadow-primary/20" // Highlight premium board
    )}>
      {isPremium && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-bl-lg z-10">
          Weekly Free Entry!
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold",
                isFree ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"
            )}>
              {isFree ? <Ticket className="h-4 w-4"/> : `$${entryFee}`}
            </span>
            <span className="text-lg font-semibold text-white">{displayEntryFee} Entry</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="font-medium text-green-400">${totalPot}</span>
            <span className="text-xs">Pot</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
            <span>Squares Filled</span>
            <span>{squaresFilled} / {maxSquares}</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        <Button
          variant={isPremium ? "default" : "outline"}
          className="w-full group"
          onClick={() => router.push(`/game/${id}`)}
        >
          {isFreeEntryAvailable && isPremium ? 'Claim Free Square' : 'View Board'}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

// Rename default export
export default BoardCardExpanded;
