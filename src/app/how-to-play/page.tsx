'use client'

import React, { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

// Content from HOWTOPLAY.md
const howToPlayMarkdown = `
# How to Play SquarePicks

Welcome to SquarePicks! Here\'s how to jump into the action:

**1. Finding Games & Boards**

*   **Explore the Lobby:** The Lobby is your starting point, organized into two main areas:
    *   **Games:** Lists upcoming real-world sports games available for SquarePicks contests.
    *   **Boards:** Displays the currently available $1 entry boards for various games. *(Remember, new $1 boards are created automatically as others fill up!)*
*   **Going to a Game Page:** You can get to a specific **Game Page** in two ways:
    *   **From "Games":** Simply tap on a game card you\'re interested in.
    *   **From "Boards":** Find the $1 board you want to explore further and tap directly on the **mini-grid image** shown on the card. This takes you to the Game Page for that specific game, pre-selecting the $1 entry amount.
*   **Using the Game Page:**
    *   This page is dedicated to a single sports game. Here, you can choose your entry amount using the selection tabs/buttons provided (**$1, $5, $10, or $20**).
    *   When you select an amount, you will see the currently **open 10x10 grid** for that specific entry level, ready for you to select squares. The page also shows details like the potential winnings (Pot) and the number of squares remaining.
    *   **New Boards Added Automatically:** Don\'t worry if a board looks full! As soon as a board for any amount fills up (before the game starts), a new, empty board for that same amount is automatically made available on this page.

**2. Understanding the Board & How Numbers Work**

*   **The Grid:** Every board is a standard 10x10 grid containing 100 squares. Before you pick, the squares are simply numbered 0 to 99 so you can identify them easily.
*   **Getting Your Numbers (Important!):** The squares *do not* have permanent "winning" numbers assigned when you pick them. The number assignment happens randomly *only after* all 100 squares on a board have been purchased and the board is officially closed.
    *   **How it Works:**
        1.  Once the board is full, the system randomly assigns the numbers 0 through 9 across the columns (representing the last digit of one team\'s score, often Away - X-axis).
        2.  It then randomly assigns numbers 0 through 9 down the rows (representing the last digit of the other team\'s score, often Home - Y-axis).
*   **When Boards Close:** A board *must be full* (all 100 squares purchased) **before** the associated real-world game begins for the number assignment and payout process to occur.
    *   **Game Start Cutoff:** Boards for a game will automatically close when that game officially starts, regardless of whether all squares have been sold.
    *   **Incomplete Boards:** If a board is not completely full when the game starts, it will be canceled. All users who purchased squares on that specific board will receive an **automatic refund** of their entry fee credited back to their account balance.
*   **Seeing Your Assigned Numbers:** *After* the random numbers are assigned (which only happens on *full* boards), you\'ll be able to see the specific X and Y number combination for each square you purchased. Check the **"My Boards"** page to view your squares and their assigned numbers for any closed boards.
*   **How Winners Are Determined:** You win if the last digit of each team\'s score at specific points in the real game (like the end of the 1st quarter, halftime, 3rd quarter, and the final score) matches the X and Y numbers assigned to your square *on a full board*! Check the specific board rules for payout details per score interval.

**3. Selecting Your Square(s)**

There are two ways to select squares, depending on where you start:

*   **On the Game Page (Tap & Multi-Select):**
    *   This is where you select squares for **any** entry amount ($1, $5, $10, or $20) and can select *multiple* squares at once.
    *   Simply tap on any available squares on the grid for your chosen entry amount.
    *   Selected squares will change appearance to show you\'ve chosen them. You can tap again to deselect if you change your mind.
    *   Once you\'re happy with your selections, click the "Confirm Selection(s)" button (which appears or becomes active below the grid) to proceed.

*   **From the Lobby "Boards" Section (Quick Single Square Entry):**
    *   The Lobby "Boards" section displays the open $1 boards, featuring controls designed for quickly entering a *single* square without leaving the Lobby.
    *   Next to the mini-grid on the board card, you\'ll find an entry control area:
        1.  **"Random" Button:** Tap this to have the system instantly select an available square number for you. The chosen number appears in the display field below the button.
        2.  **Number Display/Input Field:** Alternatively, tap this field to manually type in the number (0-99) of the specific available square you want.
        3.  **"Select Square" Button:** Once a number is displayed in the field (from "Random" or manual entry), tap this button.
    *   **Confirm Purchase:** Tapping "Select Square" transitions the control area to display the chosen square number and a **"Confirm Purchase"** button. Clicking this completes the entry for that single square, proceeding to the payment confirmation described in the next section.
    *   **Want to Tap the Grid or Select Multiple?** If you prefer to visually select squares by tapping the main grid or want to choose more than one square at a time, just tap the **mini-grid image** itself on the Lobby board card. This takes you to the full **Game Page** for that board.

**4. Confirming Your Entry (Payment)**

*   **Review:** After clicking "Confirm Selection(s)" (on the Game Page) or the "Confirm Purchase" button (from the Lobby board controls), you arrive at the final confirmation screen.
*   **Details:** This screen displays:
    *   The square(s) you selected (by their 0-99 number).
    *   The specific game and the board\'s entry amount.
    *   The total entry fee required for your selection(s).
    *   Your current account balance.
*   **Final Confirmation:** Review the details and click the "Purchase Square(s)" or "Confirm Entry" button to finalize.
*   **Deduction:** If you have sufficient funds in your account balance, the total entry fee is immediately deducted.
*   **Success:** A confirmation message appears indicating your square(s) are secured! They are now visible on your **"My Boards"** page.
*   **Insufficient Funds:** If your balance is too low to cover the entry fee, an "Insufficient Funds" message appears, prompting you to add funds to your account via the Wallet/Deposit section. The purchase will not complete until sufficient funds are available.

**5. Tracking Your Boards & Numbers**

*   **"My Boards" Page:** Track all your boards on the **"My Boards"** page, easily found in the bottom navigation bar. This page organizes your boards into two main tabs:
    *   **Current:** Boards for games that are upcoming or currently being played.
    *   **History:** Boards for games that have already finished.
*   **Viewing Your Squares (Current Boards):**
    *   **Open Boards:** If a board hasn\'t filled up yet *and* the game hasn\'t started, you\'ll see your currently selected square numbers (0-99) marked. **Want to grab more squares on this board? Simply tap the grid image here, and you\'ll be taken directly to the Game Page for this specific board**, ready to select more squares.
    *   **Closed Boards (Game Not Started):** If a paid board is full (or the free entry board\'s game is about to start) but the game hasn\'t begun, you\'ll see your square numbers (0-99). The final X-Y winning numbers haven\'t been assigned yet.
    *   **Closed Boards (Game In Progress/Finished):** Once a *full paid board* or the *free entry board* closes and the game action starts, the random X-Y numbers are assigned. On this page, you\'ll see this final X-Y number combination shown on your squares. Winning squares will be highlighted as the game progresses or after it finishes.
*   **Viewing Your Squares (History Boards):** Look back at the final results of your past boards, including the assigned numbers and which squares won each period.

**6. Checking for Winners & Getting Paid**

*   **Eligible Boards:** Only boards that were **completely full** before the associated game started are eligible for payouts. Canceled (incomplete) boards are refunded. *(Note: This applies to paid boards. The weekly free entry board proceeds even if not full - see Section 8).*
*   **Winning Squares:** After each designated period ends (End of Q1, Halftime, End of Q3, Final Score) and the score is official, the system compares the last digit of each team\'s score against the randomly assigned X-Y numbers on all *eligible* boards for that game. The square whose numbers match the score digits is the winner for that period.
*   **Instant Payouts:** Winnings are paid out *as the game happens*! If your square is the winner for a specific period (e.g., Q1), the prize amount is calculated and credited directly to your SquarePicks account balance shortly after that period\'s official score is confirmed.
*   **Winner Display:** After each period\'s winner is determined, the winning square (by its 0-99 index number) will be highlighted and displayed on the board. Winning users will have the **option** to reveal their username next to the winning square if they choose.
*   **Notification (Optional but Recommended):** You may receive a notification if one of your squares wins a period.
*   **"My Boards" Update:** Winning squares will be clearly highlighted on the board grid on the **"My Boards"** page as each period concludes.

**7. Understanding Payouts & Platform Fee**

*   **The Pot:** For each board, the total "Pot" is determined by the entry fees collected.
    *   **Calculation:** Total Pot = (Entry Fee per Square) x 100 Squares. *(Example: A $5 board has a total pot of $500).*
*   **Payout Distribution (4 Winners):** There are four chances to win on every eligible board!
    *   End of 1st Quarter Winner: Receives 20% of the Total Pot.
    *   Halftime (End of 2nd Quarter) Winner: Receives 20% of the Total Pot.
    *   End of 3rd Quarter Winner: Receives 20% of the Total Pot.
    *   Final Score Winner: Receives 20% of the Total Pot.
    *   *(Example: For a $500 Total Pot, the winner for Q1, Q2, Q3, and Final Score each receives $100).*
*   **Winning Multiple Times:** Yes! The same square can absolutely win multiple periods if the score digits happen to match at different points in the game. You\'d receive a separate 20% payout for each period won.
*   **Platform Fee:** SquarePicks LLC retains the remaining 20% of the Total Pot (after distributing 80% to the four winners) as a platform fee. This fee supports the operation, maintenance, and future development of the SquarePicks application.
*   **Crediting Winnings:** As mentioned above, winnings for each period are automatically added to your account balance shortly after the official score for that period is confirmed. You can track your transactions on your **Profile** page.

**8. Sweepstakes & Free Entry**

SquarePicks operates as a sweepstakes. **All games hosted within the app are promotional sweepstakes. Winners are determined by random chance. No purchase is necessary to participate, and a free alternative method of entry is always available. All participants, regardless of entry method, receive equal opportunity to win. These games are not lotteries, gambling, or games of skill.**

*   **Weekly Free Entry Opportunity:** Every week, eligible users get one (1) free entry into a specific featured game board. This allows you to participate and have a chance to win without using your account balance.
*   **The Featured Board:** Only **one specific board**, always a **$1 entry board** (randomly selected from the available games), is designated as the "Premium Game of the Week" free entry board. This is the *only* board your weekly free entry can be used on.
*   **How to Claim Your Free Entry:**
    1.  Navigate to the **"Sweepstakes"** tab in the Lobby (the first tab).
    2.  **Agree to Terms:** You may be asked weekly to confirm you agree to the official Sweepstakes rules and our Terms & Conditions.
    3.  **View the Board:** Once agreed, you\'ll see the 10x10 grid for the current week\'s featured game board. *(This view will also show game/team info and indicate if the game is upcoming or live).*
    4.  **Select Your Square:** Tap one (1) available square on the grid.
    5.  **Confirm:** Click the "Claim Free Entry" or "Confirm Square" button.
    6.  **Done!** You\'ll get a confirmation. Your square is entered. Track it on your **"My Boards"** page.
*   **Important Differences for the Free Entry Board:**
    *   **No Need to Fill:** Unlike paid boards, this featured board **does not need to be full** when the game starts to be eligible for payouts. It will proceed regardless.
    *   **House Squares:** Any squares not claimed by users when the game starts become "house squares" and are not eligible to win.
    *   **Payouts:** The payout structure (4 winners, 20% of the $100 pot each) is the same as a standard $1 board for the users who entered.
*   **Entry Limit:** You are limited to **one (1) free entry per person per weekly period**.
*   **Paid Entries Still Possible:** You can still enter this same featured board using your account balance if you wish (up to board limits), following the standard purchase flow.

---
`;

export default function HowToPlayPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Canvas Animation for Twinkling Stars
  useEffect(() => {
    if (!isMounted || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!(ctx instanceof CanvasRenderingContext2D)) return;

    let animationFrameId: number;
    const stars: Array<{ x: number; y: number; size: number; opacity: number; twinkleSpeed: number; twinkleDirection: number; }> = [];
    const numStars = 150;

    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.6 + 0.1,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinkleDirection: Math.random() < 0.5 ? 1 : -1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.opacity += star.twinkleSpeed * star.twinkleDirection;
        if (star.opacity > 0.7 || star.opacity < 0.1) {
          star.twinkleDirection *= -1;
          star.opacity = Math.max(0.1, Math.min(0.7, star.opacity));
        }
        ctx.fillStyle = `rgba(27, 176, 242, ${star.opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    setup();
    animate();

    const handleResize = () => setup();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMounted]);

  return (
    <div className="min-h-screen bg-background-primary text-white relative">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-1 pointer-events-none"
        id="how-to-play-constellation-canvas" // Unique ID for canvas
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 transition duration-300"
        style={{
          background: `radial-gradient(300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
        }}
      />
      <main className="container mx-auto px-4 py-12 relative z-10">
        <nav className="py-6 flex justify-between items-center">
          <Link href="/" legacyBehavior>
            <Image 
              src="/brandkit/logos/sp-logo-icon-default-text-white.svg" 
              alt="SquarePicks Logo"
              width={360} 
              height={53} 
              priority
            />
          </Link>
          <button 
            onClick={() => router.back()} 
            className="text-accent-1 hover:text-accent-2 transition-colors duration-200 py-2 px-4 rounded-md border border-accent-1 hover:border-accent-2"
          >
            Back
          </button>
        </nav>

        <section className="py-12 relative">
          <div className="absolute inset-0 opacity-65 bg-gradient-to-b from-[rgb(var(--color-background-primary))] via-[rgb(var(--color-background-secondary))] via-15% to-[rgb(var(--color-background-secondary))] backdrop-blur-sm rounded-lg border border-gray-600/60 shadow-lg -z-10"></div>
          
          <div className="relative z-0 p-6 md:p-10">
            <div className="max-w-4xl mx-auto font-sans">
              <ReactMarkdown
                components={{
                  h1: ({...props}) => <h1 className="text-4xl font-semibold text-white mb-8 mt-4 text-shadow-glow" {...props} />,
                  h2: ({...props}) => <h2 className="text-3xl font-semibold text-white mb-6 mt-8 text-shadow-glow" {...props} />,
                  h3: ({...props}) => <h3 className="text-2xl font-semibold text-white mb-4 mt-6 text-shadow-glow" {...props} />,
                  p: ({...props}) => <p className="text-lg text-gray-300 leading-relaxed mb-6" {...props} />,
                  ul: ({...props}) => <ul className="list-disc list-outside pl-6 mb-6 space-y-2" {...props} />,
                  ol: ({...props}) => <ol className="list-decimal list-outside pl-6 mb-6 space-y-2" {...props} />,
                  li: ({...props}) => <li className="text-lg text-gray-300 marker:text-accent-1" {...props} />,
                  strong: ({...props}) => <strong className="font-semibold text-white" {...props} />,
                  a: ({...props}) => <a className="text-accent-1 hover:text-accent-2 transition-colors duration-200 no-underline hover:underline" {...props} />,
                  hr: ({...props}) => <hr className="border-gray-700 my-8" {...props} />,
                }}
              >
                {howToPlayMarkdown}
              </ReactMarkdown>
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-gray-800">
          <div className="flex flex-col items-center justify-center text-center">
            <Image 
              src="/brandkit/logos/sp-logo-icon-default-text-white.svg" 
              alt="SquarePicks Logo" 
              width={240} 
              height={35} 
              className="mb-4"
            />
            <div className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} SquarePicks. All rights reserved.
              <div className="mt-2">
                <Link href="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
                {' | '}
                <Link href="/terms" className="hover:text-white transition-colors duration-200">Terms & Conditions</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
} 