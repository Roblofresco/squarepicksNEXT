# Game Lifecycle Workflow (User Perspective)

## Pre-Game Phase

### Browse Games
```
User visits /lobby
  ↓
View upcoming games (scheduled)
  ↓
See game details:
  - Teams
  - Date/time
  - Available boards
  ↓
Select game to view boards
```

### Enter Boards
```
Browse boards for game ($1, $5, $10, $20, free)
  ↓
Select squares on preferred board
  ↓
Entry confirmed, balance deducted
  ↓
Wait for board to fill
```

### Board Fills
```
Board reaches 100 squares
  ↓
Numbers assigned randomly
  ↓
User receives notification
  ↓
View assigned squares on /my-boards
```

## Game Day

### Game Starts
```
Game goes live (isLive = true)
  ↓
Board status: full → active
  ↓
Live scores displayed
  ↓
User can watch game progress
```

### Quarter 1 Ends
```
Q1 ends (e.g., 14-17)
  ↓
System calculates winning square (74)
  ↓
Winners identified
  ↓
If user wins:
  - Notification sent
  - Balance incremented ($50.00)
  - Transaction created
  ↓
View winnings in /wallet and /my-boards
```

### Halftime (Q2)
```
Halftime reached
  ↓
Q2 winning square calculated
  ↓
Q2 winners paid
  ↓
User sees updated balance
```

### Quarter 3 Ends
```
Q3 ends
  ↓
Q3 winning square calculated
  ↓
Q3 winners paid
  ↓
One quarter remaining
```

### Game Ends (Final)
```
Game finishes
  ↓
Final winning square calculated
  ↓
Final winners paid
  ↓
Board closed
  ↓
User can view final results
```

## Post-Game

### View Results
```
Navigate to /my-boards
  ↓
View board details
  ↓
See winning squares for each quarter
  ↓
View personal win history
  ↓
Check transaction history
```

### Withdraw Winnings
```
If balance > $5:
  ↓
  Navigate to /withdraw
  ↓
  Enter PayPal email
  ↓
  Confirm withdrawal
  ↓
  Funds sent to PayPal
```

## User Views

### Lobby View
```
Upcoming Games List
  ├─ Game 1: Buccaneers @ Chiefs
  │   └─ Boards: $1 (2 open), $5 (1 open), $10 (open), $20 (open), Free (open)
  ├─ Game 2: Patriots @ Bills
  │   └─ Boards: $1 (3 open), $5 (2 open), ...
```

### Board Detail View
```
Game: Buccaneers @ Chiefs
Board: $5 per square
Status: Open
Filled: 87/100

[10x10 Grid]
Available squares: Green
Taken squares: Gray
Your squares: Blue

[Quick Entry: 1, 3, 5, 10 squares]
[Confirm Entry Button]
```

### My Boards View (Pre-Game)
```
Your Active Boards (3)
  ├─ $5 - Buccaneers @ Chiefs
  │   Status: Full
  │   Your Squares: 23 (74), 45 (12), 67 (88)
  │   Game Time: Sunday 1:00 PM ET
```

### My Boards View (Live Game)
```
Live Game
  ├─ $5 - Buccaneers @ Chiefs
  │   Q1: Chiefs 14, Buccaneers 17 ✅
  │   Your Square 23 (74) WON Q1! ($50.00)
  │   Q2: In progress...
  │   Q3: Not started
  │   Final: Not started
```

### My Boards View (Completed)
```
Completed Games
  ├─ $5 - Buccaneers @ Chiefs
  │   Final: Chiefs 30, Buccaneers 27
  │   ✅ Q1: Square 23 (74) - Won $50.00
  │   ❌ Q2: Square 23 (74)
  │   ❌ Q3: Square 23 (74)
  │   ✅ Final: Square 45 (70) - Won $50.00
  │   Total Winnings: $100.00
```

## Notifications Timeline

### Entry
```
"Your 3 square entries are confirmed."
```

### Board Full
```
"Your Picks Have Been Assigned!"
```

### Quarter Win
```
"Congratulations! You won $50.00 for pick 74 in the first quarter!"
```

### Game End
```
"The game has ended. Check your boards for final results."
```

## User Actions

### Pre-Game
- Browse games
- View boards
- Select squares
- Confirm entry
- View my boards

### Live Game
- Watch live scores
- Check winning squares
- View notifications
- Monitor balance

### Post-Game
- View results
- Check winnings
- Withdraw funds
- Enter new boards

## Mobile Experience

### Home Screen
```
[Top Nav: Logo, Balance, Notifications]
[Lobby]
  - Upcoming Games
  - Live Games (if any)
  - My Active Boards (if any)
[Bottom Nav: Lobby, My Boards, Wallet, Profile]
```

### Notifications
```
Push notification:
"🏆 You won $50.00!"
Tap → Navigate to /my-boards
```

### Real-Time Updates
```
Board auto-refreshes when:
- New squares selected
- Board fills
- Game goes live
- Quarter ends
- Winnings credited
```

