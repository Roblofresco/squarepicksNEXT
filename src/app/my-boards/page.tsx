'use client'

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation'; // Use Next.js router
import Link from 'next/link';
import { motion } from "framer-motion";
// Assuming similar UI components exist, otherwise need creation/styling
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming Card components exist
// Using Lucide icons for consistency
import { ArrowLeft, Trophy, Check, Star, Loader2 } from 'lucide-react'; // Added Loader2

// Import Firebase Auth
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// Import BottomNav
import BottomNav from '@/components/lobby/BottomNav';

// Import Shadcn Dialog components for login modal
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// --- Interfaces ---
interface TeamInfo {
  name: string;
  color: string; // e.g., 'bg-red-500', 'text-blue-300'
  textColor?: string; // Optional: specific text color if needed for contrast
}

interface BoardSquare {
  number?: string | null; // Allow null, assigned number if revealed/owned
  x: number;
  y: number;
  isUserSquare: boolean; // Does the current user own this square?
}

interface QuarterScore {
  period: string; // 'Q1', 'Q2', 'Q3', 'F' (Final)
  homeScore: number;
  awayScore: number;
  isWinner?: boolean; // Did the user win this period?
}

interface Board {
  id: string;
  gameId: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  date: string;
  time: string;
  entryFee: number;
  potentialWinnings: number;
  status: "active" | "completed" | "upcoming";
  result?: {
    winnerOverall: boolean; // Did the user win overall? (might be different from period wins)
    totalWinAmount?: number;
  };
  quarters: QuarterScore[];
  squares: BoardSquare[][]; // Representing the 10x10 grid
  rowNumbers?: string[]; // Assigned row numbers (usually Away team score last digit)
  colNumbers?: string[]; // Assigned col numbers (usually Home team score last digit)
  userOwnedSquareCoords: { x: number, y: number }[]; // Coords user owns
}

// --- Helper Functions ---
// Generate a 10x10 grid with user squares marked and assigned placeholder numbers
const generateGrid = (userSquares: { x: number, y: number }[]): BoardSquare[][] => {
  return Array.from({ length: 10 }, (_, y) =>
    Array.from({ length: 10 }, (_, x) => {
      const isUserSquare = userSquares.some(sq => sq.x === x && sq.y === y);
      // Assign placeholder number if it's a user square
      const number = isUserSquare ? `${x}${y}` : null; // Example: "73" for cell at x=7, y=3
      return { x, y, isUserSquare, number };
    })
  );
};

// --- Placeholder Data ---
const placeholderCurrentBoards: Board[] = [
  {
    id: "board-1",
    gameId: "game-1",
    homeTeam: { name: "Chiefs", color: "bg-red-600", textColor: "text-white" },
    awayTeam: { name: "49ers", color: "bg-yellow-500", textColor: "text-black" },
    date: "Apr 14, 2025",
    time: "8:30 PM ET",
    entryFee: 10,
    potentialWinnings: 200,
    status: "active",
    quarters: [
      { period: 'Q1', homeScore: 7, awayScore: 3 },
      { period: 'Q2', homeScore: 14, awayScore: 10 },
      { period: 'Q3', homeScore: 14, awayScore: 17 },
      { period: 'F', homeScore: 21, awayScore: 20 }
    ],
    userOwnedSquareCoords: [{ x: 7, y: 3 }, { x: 4, y: 0 }],
    squares: [], // Will be generated
    rowNumbers: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    colNumbers: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
  },
  // Add more sample boards...
];
placeholderCurrentBoards.forEach(b => b.squares = generateGrid(b.userOwnedSquareCoords));

const placeholderHistoricalBoards: Board[] = [
  {
    id: "board-3",
    gameId: "game-3",
    homeTeam: { name: "Lakers", color: "bg-purple-600", textColor: "text-yellow-300" },
    awayTeam: { name: "Celtics", color: "bg-green-700", textColor: "text-white" },
    date: "Apr 10, 2025",
    time: "9:00 PM ET",
    entryFee: 10,
    potentialWinnings: 200,
    status: "completed",
    result: {
      winnerOverall: true,
      totalWinAmount: 50
    },
    quarters: [
      { period: 'Q1', homeScore: 7, awayScore: 3, isWinner: true }, // User won Q1
      { period: 'Q2', homeScore: 14, awayScore: 10 },
      { period: 'Q3', homeScore: 14, awayScore: 17 },
      { period: 'F', homeScore: 21, awayScore: 20 }
    ],
    userOwnedSquareCoords: [{ x: 7, y: 3 }], // User owned 7-3 square
    squares: [], // Will be generated
    rowNumbers: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    colNumbers: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
  },
  // Add more sample boards...
];
placeholderHistoricalBoards.forEach(b => b.squares = generateGrid(b.userOwnedSquareCoords));


// --- Component ---
export default function MyBoardsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("current");
  const [currentBoards, setCurrentBoards] = useState<Board[]>([]); // Start empty
  const [historicalBoards, setHistoricalBoards] = useState<Board[]>([]); // Start empty

  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Effect for Firebase Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
        // If user must be logged in to view this page, uncomment redirect:
        // if (!currentUser) { 
        //   router.push('/login');
        // }
    });
    return () => unsubscribe();
  }, [router]); 

  // TODO: Replace placeholder data with actual data fetching logic based on `user.uid`
  useEffect(() => {
    if (user && !authLoading) { // Ensure user exists and auth check is complete
      // Fetch current and historical boards data here using user.uid
      // For now, using placeholders if you want to see something on the screen:
      setCurrentBoards(placeholderCurrentBoards);
      setHistoricalBoards(placeholderHistoricalBoards);
      console.log("User authenticated, (TODO: fetch user-specific boards)");
    } else if (!user && !authLoading) {
      // Clear boards if user logs out or is not available
      setCurrentBoards([]);
      setHistoricalBoards([]);
      console.log("User not authenticated or logged out, clearing boards.");
    }
  }, [user, authLoading]);

  // Protected action handler for BottomNav
  const handleProtectedAction = () => {
    if (!user) {
      console.log("Protected action triggered on my-boards, showing login prompt.");
      setIsLoginModalOpen(true);
    }
  };

  const renderQuarterScoreboard = (board: Board) => (
    // Added max-w-md and mx-auto for consistent width and centering
    <div className="grid grid-cols-4 gap-1.5 mb-4 p-1.5 rounded-lg border border-gray-700/50 bg-background-primary shadow-md max-w-md mx-auto">
      {board.quarters.map((q) => (
        <div key={q.period} className="bg-background-secondary/60 rounded p-2 text-center relative shadow-inner border border-gray-700/30 flex flex-col justify-between min-h-[70px]">
          <div className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">{q.period}</div>
          <div className="h-px w-4/5 mx-auto bg-gray-600/40 my-1"></div>
          <div className="flex justify-around items-center text-[10px] font-semibold text-white mb-0.5">
             <span>{board.awayTeam.name ? board.awayTeam.name[0] : '?'}</span>
             <span>{board.homeTeam.name ? board.homeTeam.name[0] : '?'}</span>
          </div>
          <div className="flex justify-center items-center mt-1 gap-2"> 
            <div className={`text-xl font-bold text-text-primary drop-shadow-md`}> 
              {q.awayScore}
            </div>
            <div className="h-6 w-px bg-gray-600/50 self-center"></div> 
            <div className={`text-xl font-bold text-text-primary drop-shadow-md`}> 
              {q.homeScore}
            </div>
            {q.isWinner && (
               <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-20 pointer-events-none">
                 <span className="text-4xl font-black text-green-400 filter drop-shadow-lg">W</span>
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderBoardGrid = (board: Board) => {
    // Define base mobile size, use sm: for larger screens
    const axisCellSize = "h-6 w-6 sm:h-8 sm:w-8"; 
    const axisTextSize = "text-[10px] sm:text-xs"; // Responsive axis numbers
    const teamNameTextSize = "text-xs sm:text-sm"; // Responsive team names
    // Responsive Paddings
    const homeNamePadding = "pr-1 sm:pr-2"; 
    const awayTeamNamePadding = "pb-1 sm:pb-2"; 
    const iconSize = 16; // Base size for mobile
    const tagTextSize = "text-[8px] sm:text-[9px]"; // Responsive tag text

    // Removed calc() variables, will use direct classes

    const axisBaseStyle = `flex items-center justify-center font-mono ${axisTextSize}`;
    const teamNameBaseStyle = `font-semibold flex ${teamNameTextSize}`;
    const borderStyle = "border border-gray-500/50"; 

    return (
      <div className="flex flex-col items-end w-full max-w-md mx-auto mt-4">
        {/* Home Team Name Container - Reverted to solid team color */}
        <div
          className={`${teamNameBaseStyle} justify-center items-center h-6 sm:h-8 w-60 sm:w-80 ${board.homeTeam.color} ${board.homeTeam.textColor ?? 'text-white'} rounded-t-md ${homeNamePadding}`} // Re-added team bg class
        >
          {board.homeTeam.name}
        </div>

        <div className="flex flex-row items-end">
          {/* Away Team Name Container - Reverted to solid team color */} 
          <div
            className={`${teamNameBaseStyle} w-6 sm:w-8 h-60 sm:h-80 ${board.awayTeam.color} ${board.awayTeam.textColor ?? 'text-white'} rounded-l-md text-center`} // Re-added team bg class
            style={{ writingMode: 'vertical-rl' }} // Keep writingMode
          >
            <span className={`rotate-180 block w-full h-full flex items-end justify-center ${awayTeamNamePadding}`}>
            {board.awayTeam.name}
            </span>
         </div>

          {/* 11x11 Grid - Size determined by cells */}
          <div 
             className={`grid grid-cols-11 grid-rows-11 ${borderStyle} bg-transparent border-gray-500/50 shadow-inner rounded-br-md rounded-tr-md`}
          >
            {/* Top-left empty cell - Responsive size */}
            <div className={`bg-background-tertiary ${axisCellSize} ${borderStyle}`}></div>

            {/* Column numbers - Responsive size */} 
         {board.colNumbers?.map((num, i) => (
              <div key={`col-num-${i}`} className={`${axisBaseStyle} ${axisCellSize} ${board.homeTeam.color} ${board.homeTeam.textColor ?? 'text-white'} bg-opacity-90 ${borderStyle}`}> 
            {num}
          </div>
         ))}

            {/* Render Rows 2-11 */} 
         {Array.from({ length: 10 }).map((_, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
                {/* Row number - Responsive size */} 
                <div className={`${axisBaseStyle} ${axisCellSize} ${board.awayTeam.color} ${board.awayTeam.textColor ?? 'text-white'} bg-opacity-90 ${borderStyle}`}> 
              {board.rowNumbers?.[rowIndex]}
            </div>

                {/* Grid cells - Responsive size */} 
                {board.squares[rowIndex].map((cell, colIndex) => {
                  // Find the winning quarter(s) for this cell
                  const winningQuarters = board.quarters.filter(q => {
                      const homeLastDigit = String(q.homeScore % 10);
                      const awayLastDigit = String(q.awayScore % 10);
                      return board.colNumbers?.[colIndex] === homeLastDigit && board.rowNumbers?.[rowIndex] === awayLastDigit;
                  }).map(q => q.period); // Get ['Q1', 'Q3'] etc.

                  const isWinning = winningQuarters.length > 0;
                  const displayQuarter = isWinning 
                     ? winningQuarters.filter(q => board.status === 'completed' || q !== 'F').join('/') 
                     : ''; 

                  // Determine cell style based on state
                  let cellStyle = `bg-gradient-to-br from-gray-800/10 to-black/10`;
                  let borderStyleOverride = borderStyle;
                  let shadowStyle = 'shadow-inner';
                  let content: React.ReactNode = null;
                  let tag: React.ReactNode = null;
                  // Determine icon size based on cell size (crude example)
                  const currentIconSize = axisCellSize.includes('h-8') ? 20 : 16;

                  if (cell.isUserSquare) {
                      if (isWinning) {
                          // --- Winning + User Selected ---
                          cellStyle = 'bg-white'; // White fill
                          borderStyleOverride = borderStyle; // Keep standard border
                          // Raised shadow (removed yellow glow)
                          shadowStyle = 'shadow-xl'; 
                          // Gold star icon
                          content = <Star size={currentIconSize} className="text-yellow-400 fill-yellow-400/30" />;
                          // Gold tag - Moved to bottom-right, adjusted rounding
                          tag = <div className={`absolute bottom-0 right-0 px-1 ${tagTextSize} font-bold bg-yellow-400 text-black rounded-tl-sm leading-none border border-yellow-600`}>{displayQuarter}</div>;
                      } else {
                          // --- User Selected Only ---
                          cellStyle = 'bg-black/10'; // Keep default bg for indent 
                          borderStyleOverride = borderStyle; // Keep standard grid border
                          shadowStyle = 'shadow-inner'; // Indented look
                          // Apply White Star Icon content, remove tag
                          content = <Star size={currentIconSize} className="text-white fill-white/20" />;
                          tag = null;
                      }
                  } else if (isWinning) {
                      // --- Winning Only ---
                      // White fill with inner shadow effect
                      cellStyle = `bg-white`; 
                      borderStyleOverride = borderStyle; // Keep standard border
                      shadowStyle = 'shadow-inner'; // Add inner shadow
                      // Neutral tag
                      tag = <div className={`absolute bottom-0 right-0 px-1 ${tagTextSize} font-semibold bg-gray-200 text-gray-700 rounded-tl-sm leading-none border border-gray-400`}>{displayQuarter}</div>;
                      // No main content (icon)
                  }
                  // Else: Default square - Apply subtle gradient and inner shadow
                  else {
                    cellStyle = `bg-gradient-to-br from-gray-800/10 to-black/10`;
                    shadowStyle = 'shadow-inner';
                    borderStyleOverride = borderStyle; // Ensure standard border is used
                    content = null;
                    tag = null;
                  }
                  
                  return (
                    <div
                      key={`cell-${rowIndex}-${colIndex}`}
                      // Responsive cell size applied here
                      className={`relative flex items-center justify-center aspect-square ${axisCellSize} ${borderStyle} ${cellStyle} ${shadowStyle} transition-all duration-300`}
                    >
                      {content} 
                      {tag}
              </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
    </div>
  );
};


  const renderBoardCard = (board: Board) => (
    <motion.div
      // variants={itemVariants} // Add animations back if needed
      key={board.id}
      className="rounded-xl overflow-hidden bg-background-secondary border border-gray-700/50 shadow-lg hover:border-accent-1/50 transition-all duration-300 flex flex-col"
      // whileHover={{ y: -5 }}
    >
      <CardHeader className="pb-3 border-b border-gray-700/50">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-lg text-text-primary">{board.awayTeam.name} @ {board.homeTeam.name}</CardTitle>
            <CardDescription className="text-text-secondary text-sm">
              {board.date} • {board.time}
            </CardDescription>
          </div>
          <Badge
            variant={board.status === "active" ? "default" :
                   board.status === "completed" ? "secondary" : "outline"}
            className={`flex-shrink-0 ${// More distinct colors
              board.status === "active" ? 'bg-green-500/20 text-green-400' :
              board.status === "completed" ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-600/30 text-text-secondary'
            }`}
          >
            {board.status.charAt(0).toUpperCase() + board.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 flex-grow">
         {renderQuarterScoreboard(board)}
         {renderBoardGrid(board)}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-end">
        <button
          onClick={() => router.push(`/board/${board.id}`)} // Replace with actual navigation or modal
          className="px-4 py-2 bg-accent-1 hover:bg-accent-1/80 text-white text-sm font-medium rounded-md transition-colors duration-200 shadow hover:shadow-md"
          >
            View Details
        </button>
      </CardFooter>
    </motion.div>
  );

  // Animation variants (optional)
  const containerVariants = { /* ... */ };
  const itemVariants = { /* ... */ };

  if (authLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-background-secondary">
            <Loader2 className="h-12 w-12 animate-spin text-accent-1" />
            {/* Placeholder for BottomNav during auth loading, if needed, or keep it simple */}
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background-secondary p-4 sm:p-6 text-text-primary flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-grow">
        {/* Header */}
        <div className="flex items-center mb-6">
           <button onClick={() => router.back()} className="mr-4 p-2 rounded-full hover:bg-background-secondary transition-colors">
              <ArrowLeft size={20} />
          </button>
           <h1 className="text-2xl font-bold">My Boards</h1>
        </div>

        {/* Tabs */}
        {/* Adjusted TabsList for shorter width and dynamic rounding */}
        <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid grid-cols-2 gap-1 p-1 bg-background-secondary rounded-lg max-w-xs mx-auto">
            <TabsTrigger
              value="current"
              className={`flex-1 text-center px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out ${
                activeTab === 'current'
                  ? 'bg-accent-1 text-white shadow-md rounded-l-md rounded-r-none' // Selected: rounded left
                  : 'text-text-secondary hover:bg-background-tertiary rounded-l-md' // Not selected: rounded left
              }`}
            >
              Current ({currentBoards.length})
            </TabsTrigger>
            <TabsTrigger
              value="historical"
              className={`flex-1 text-center px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out ${
                activeTab === 'historical'
                  ? 'bg-accent-1 text-white shadow-md rounded-r-md rounded-l-none' // Selected: rounded right
                  : 'text-text-secondary hover:bg-background-tertiary rounded-r-md' // Not selected: rounded right
              }`}
            >
              Historical ({historicalBoards.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            {(currentBoards.length > 0 || (!user && !authLoading)) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {currentBoards.map(renderBoardCard)}
              </div>
            ) : (
              <p className="text-center text-text-secondary mt-8">{!user && !authLoading ? "Please log in to see your boards." : "No active boards found."}</p>
            )}
          </TabsContent>
          <TabsContent value="historical">
            {(historicalBoards.length > 0 || (!user && !authLoading)) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {historicalBoards.map(renderBoardCard)}
              </div>
            ) : (
              <p className="text-center text-text-secondary mt-8">{!user && !authLoading ? "Please log in to see your historical boards." : "No historical boards found."}</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav user={user} onProtectedAction={handleProtectedAction} />
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
         <DialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b] to-[#5855e4] to-15% border-accent-1/50 text-white py-8">
            <DialogHeader className="text-center items-center">
               <DialogTitle className="text-2xl font-bold mb-2">Login Required</DialogTitle>
               <DialogDescription className="text-gray-300 opacity-90">
                  You need to be logged in or create an account to perform this action.
               </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 mb-2">
               <Button onClick={() => { setIsLoginModalOpen(false); router.push('/login'); }} className="flex-1 bg-accent-1 hover:bg-accent-1/80 text-white font-semibold">Login</Button>
               <Button onClick={() => { setIsLoginModalOpen(false); router.push('/signup'); }} variant="outline" className="flex-1 bg-transparent border-gray-500 hover:bg-gray-500/20 text-gray-300 font-semibold hover:text-gray-300">Sign Up</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
} 