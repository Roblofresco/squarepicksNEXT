import InfoPageShell from '@/components/ui/info-page-shell'
import { HowToPlayContent } from '@/components/how-to-play/content'

const howToPlayMarkdown = `
# How to Play SquarePicks

Welcome to SquarePicks! Here's how to jump into the action:

## 1. Finding Games & Boards

### Explore the Lobby
The Lobby is your starting point, organized into two main areas:

- **Games:** Lists upcoming real-world sports games available for SquarePicks contests.
- **Boards:** Displays the currently available $1 entry boards for various games. *(Remember, new $1 boards are created automatically as others fill up!)*

### Going to a Game Page
You can get to a specific Game Page in two ways:

- **From "Games":** Simply tap on a game card you're interested in.
- **From "Boards":** Find the $1 board you want to explore further and tap directly on the mini-grid image shown on the card. This takes you to the Game Page for that specific game, pre-selecting the $1 entry amount.

### Using the Game Page
- This page is dedicated to a single sports game. Here, you can choose your entry amount using the selection tabs/buttons provided ($1, $5, $10, or $20).

## 2. Picking Your Squares

### Understanding the Grid
- Each game has a 10x10 grid representing possible score combinations.
- The top row represents one team's score, the side column represents the other team's score.
- Each square represents a unique score combination based on these numbers.

### Making Your Selection
1. Choose your entry amount first ($1, $5, $10, or $20).
2. Click on any available (white) square to select it.
3. Confirm your selection.

### Square Status Colors
- **White:** Available for selection
- **Gray:** Already taken by other players
- **Blue:** Your selected square(s)

## 3. Winning & Payouts

### When You Win
Prizes are awarded based on:
- Quarter scores (1st, 2nd, 3rd)
- Final score
- Special event squares (when available)

### Getting Paid
- Winnings are automatically added to your wallet
- You can withdraw your funds at any time
- Minimum withdrawal amount is $5.00
`

export default function HowToPlayPage() {
  return (
    <InfoPageShell canvasId="how-to-play-constellation-canvas">
      <HowToPlayContent content={howToPlayMarkdown} />
    </InfoPageShell>
  )
}
