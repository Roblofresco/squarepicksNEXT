# Board Entry Workflow

## User Journey

### 1. Browse Lobby
```
User navigates to /lobby
  ↓
View available games
  ↓
Filter by sport (NFL, CFB, etc.)
  ↓
Select game
```

### 2. View Board Options
```
Display boards for selected game:
  - $1 boards
  - $5 boards
  - $10 boards
  - $20 boards
  - Free sweepstakes boards
  ↓
Show board status (open/full/active)
  ↓
User selects board amount
```

### 3. Select Squares
```
Display 10x10 grid
  ↓
Available squares highlighted
  ↓
Taken squares grayed out
  ↓
User clicks squares to select
  ↓
Quick entry options (1, 3, 5, 10 squares)
  ↓
Review selection
```

### 4. Confirm Entry
```
Display summary:
  - Selected squares count
  - Entry fee (amount × count)
  - Current balance
  - New balance after entry
  ↓
User confirms
  ↓
Call enterBoard function
```

### 5. Process Entry
```
Cloud Function: enterBoard
  ↓
Validate:
  - Board status = 'open'
  - Squares not taken
  - Sufficient balance
  ↓
Firestore Transaction:
  - Create square documents
  - Update board.selected_indexes
  - Deduct user.balance
  - Create transaction record
  - Create notification
  ↓
Return success
```

### 6. Confirmation
```
Display success message
  ↓
Show updated balance
  ↓
Display selected squares
  ↓
Navigate to /my-boards or stay on board view
```

## Entry Validations

### Board Status
```javascript
if (boardData.status !== 'open') {
  throw new Error('Board not accepting entries');
}
```

### Square Availability
```javascript
for (const idx of selectedSquares) {
  if (boardData.selected_indexes.includes(idx)) {
    throw new Error(`Square ${idx} already taken`);
  }
}
```

### Balance Check
```javascript
const entryFee = boardAmount × squareCount;
if (userBalance < entryFee) {
  throw new Error('Insufficient balance');
}
```

### Sweepstakes Limit
```javascript
if (boardAmount === 0) {
  if (selectedSquares.length > 1) {
    throw new Error('Max 1 square per free board');
  }
  
  // Check if already entered this sweepstakes
  const participant = await checkSweepstakesParticipation(sweepstakesId);
  if (participant) {
    throw new Error('Already entered this sweepstakes');
  }
}
```

## UI Components

### Board Grid
```
10x10 grid of squares (100 total)
  - Available: Green border, clickable
  - Selected (by user): Blue fill, clickable to deselect
  - Taken (by others): Gray, not clickable
  - Numbers: Shown after board full
```

### Quick Entry Selector
```
[ 1 ] [ 3 ] [ 5 ] [ 10 ]
Click to auto-select random available squares
```

### Entry Summary Panel
```
Selected: 3 squares
Entry fee: $15.00
Current balance: $100.00
New balance: $85.00
[Confirm Entry Button]
```

## Error Handling

### Insufficient Balance
```
Error: Insufficient balance
Action: Prompt user to deposit
Message: "You need $15.00 but have $10.00. Please deposit at least $5.00."
Button: [Go to Deposit]
```

### Square Already Taken
```
Error: Square no longer available
Action: Refresh board, remove square from selection
Message: "Square 23 was just taken by another user. Please select a different square."
```

### Board Full
```
Error: Board is full
Action: Redirect to next open board with same amount
Message: "This board filled up! Showing you the next $5 board..."
```

## Post-Entry Flow

### Immediate
```
Entry confirmed
  ↓
Notification created
  ↓
Balance updated
  ↓
User sees confirmation
```

### Board Reaches 100
```
100th square selected
  ↓
Trigger: handleBoardFull
  ↓
Numbers assigned
  ↓
All participants notified
  ↓
New board created (if game not live)
```

### Game Goes Live
```
Board status: full → active
  ↓
No more entries accepted
  ↓
Wait for quarter completions
```

## User Experience Enhancements

### Auto-Select Feature
- Click "5 Squares" button
- System randomly selects 5 available squares
- User can deselect/reselect manually

### Balance Warning
```
if (userBalance < 10.00) {
  Show: "Low balance warning"
  Suggest: "Add funds now to enter more boards"
}
```

### Board Full Notification
```
When board fills:
  Title: "$5 - Buccaneers @ Chiefs"
  Message: "Your Picks Have Been Assigned!"
  Action: View My Boards
```

