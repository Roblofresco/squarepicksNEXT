# Winner Computation Helper Functions

## Overview
Pure functions for computing winning squares based on game scores.

---

## computeWinningIndexFromDigits

### Type
Pure Calculation Function

### Purpose
Computes the winning square index and string given board number mappings and score last digits.

### Input
- **boardData** (object): Board document data with axis numbers
- **homeLastDigitStr** (string): Last digit of home team score ("7")
- **awayLastDigitStr** (string): Last digit of away team score ("3")

### Output
```javascript
{
  winningIndex: 37,      // Grid index (0-99)
  winningSquare: "37"    // String format: awayDigit + homeDigit
}
// OR
null  // If board numbers not assigned yet
```

### Logic

#### Step 1: Validate Board Mappings
```javascript
if (!Array.isArray(boardData?.home_numbers) || 
    !Array.isArray(boardData?.away_numbers)) {
  return null;
}
```

#### Step 2: Find Index Positions
```javascript
const homeIdx = boardData.home_numbers.indexOf(String(homeLastDigitStr));
const awayIdx = boardData.away_numbers.indexOf(String(awayLastDigitStr));

if (homeIdx < 0 || awayIdx < 0) return null;
```

#### Step 3: Calculate Winning Index
```javascript
const winningIndex = awayIdx * 10 + homeIdx;
```

**Grid Layout Logic**:
```
Home numbers:  [7, 3, 5, 2, 9, 0, 4, 8, 1, 6]  (index 0-9)
Away numbers:  [2, 8, 5, 3, 0, 1, 9, 6, 7, 4]  (index 0-9)

Score: Home 27 (last digit 7), Away 13 (last digit 3)

homeIdx = home_numbers.indexOf("7") = 0
awayIdx = away_numbers.indexOf("3") = 3

winningIndex = 3 * 10 + 0 = 30
```

Grid visualization:
```
       0  1  2  3  4  5  6  7  8  9  <- homeIdx
       7  3  5  2  9  0  4  8  1  6  <- home_numbers (actual digits)
    ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
  0 │ 2│ 0│ 1│ 2│ 3│ 4│ 5│ 6│ 7│ 8│ 9│
  1 │ 8│10│11│12│13│14│15│16│17│18│19│
  2 │ 5│20│21│22│23│24│25│26│27│28│29│
  3 │ 3│30│31│32│33│34│35│36│37│38│39│ <- awayIdx=3, homeIdx=0 = index 30
  4 │ 0│40│41│42│43│44│45│46│47│48│49│
  5 │ 1│50│51│52│53│54│55│56│57│58│59│
  6 │ 9│60│61│62│63│64│65│66│67│68│69│
  7 │ 6│70│71│72│73│74│75│76│77│78│79│
  8 │ 7│80│81│82│83│84│85│86│87│88│89│
  9 │ 4│90│91│92│93│94│95│96│97│98│99│
    └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
awayIdx   ^
away_numbers (actual digits on left axis)
```

#### Step 4: Build Winning Square String
```javascript
const winningSquare = `${awayLastDigitStr}${homeLastDigitStr}`;
```

**Business Rule**: Winning square format is `AwayDigit + HomeDigit`
- Score: Home 27, Away 13 → Square: "37"
- Score: Home 10, Away 20 → Square: "00"
- Score: Home 7, Away 14 → Square: "47"

#### Step 5: Return Result
```javascript
return { winningIndex, winningSquare };
```

### Example Scenarios

#### Example 1: First Quarter Win
```javascript
const boardData = {
  home_numbers: ["7", "3", "5", "2", "9", "0", "4", "8", "1", "6"],
  away_numbers: ["2", "8", "5", "3", "0", "1", "9", "6", "7", "4"]
};

// Q1 Score: Home 7, Away 3
computeWinningIndexFromDigits(boardData, "7", "3");
// Returns: { winningIndex: 30, winningSquare: "37" }
```

#### Example 2: Halftime Score
```javascript
// Q2 Score: Home 14, Away 10
computeWinningIndexFromDigits(boardData, "4", "0");
// Returns: { winningIndex: 46, winningSquare: "04" }
```

#### Example 3: Board Not Ready
```javascript
const incompleteBoardData = {
  home_numbers: null,  // Not assigned yet
  away_numbers: null
};

computeWinningIndexFromDigits(incompleteBoardData, "7", "3");
// Returns: null
```

### Database Operations
None (pure function)

### Business Rules

#### Winning Square Format
- **Always**: AwayDigit + HomeDigit
- **NOT**: HomeDigit + AwayDigit
- Critical for consistency across system

#### Index Calculation
- Row determined by away team digit position
- Column determined by home team digit position
- Formula: `awayIdx * 10 + homeIdx`

#### Returns Null When
- Board numbers not yet assigned
- Home or away numbers arrays missing
- Digit not found in arrays (invalid state)

### Why Not Used in Production

This function exists but is **NOT currently used** in the system. Here's why:

**Current approach**:
- Winning squares stored directly on game document
- Computed once when score updates
- All boards use same winning square for same score

**This function was designed for**:
- Per-board winning square calculation
- Different number assignments per board
- More complex square ownership logic

**System evolved to**:
- Single source of truth (game document)
- Winning square computed once per period
- Stored as `q1WinningSquare`, `q2WinningSquare`, etc.

### When This Would Be Useful

If system changes to:
- Multiple boards per game with different number assignments
- Real-time winner calculation without pre-stored squares
- Client-side winner visualization

### Used By
- **NOT CURRENTLY USED**
- Available for future features
- Kept for reference and potential use

### Related Documentation
- [Function: assignWinnersForBoardPeriod](./winner-assignment.md)
- [Business Rules: Winner Assignment](../../business-rules/winner-assignment.md)
- [Data Models: Board](../../data-models/board.md)

---

## formatPeriodLabel

### Type
Pure Transformation Function

### Purpose
Converts period label codes to human-readable format for notifications and UI.

### Input
- **periodLabel** (string): Period code ("q1", "q2", "q3", "final")

### Output
```javascript
"first"   // or "second", "third", "final"
```

### Logic
```javascript
const periodMap = {
  'q1': 'first',
  'q2': 'second', 
  'q3': 'third',
  'final': 'final'
};

return periodMap[periodLabel?.toLowerCase()] || periodLabel;
```

### Example
```javascript
formatPeriodLabel('q1');     // "first"
formatPeriodLabel('Q2');     // "second"
formatPeriodLabel('q3');     // "third"
formatPeriodLabel('FINAL');  // "final"
formatPeriodLabel('q4');     // "q4" (fallback)
```

### Business Rules
- Case-insensitive input
- Returns original value if not recognized (fallback)
- Used in user-facing text only
- Database still stores "q1", "q2", etc.

### Use Cases

#### Notification Messages
```javascript
const message = `Congratulations! You won $25.00 for pick 37 in the ${formatPeriodLabel('q1')} quarter!`;
// "Congratulations! You won $25.00 for pick 37 in the first quarter!"
```

#### Transaction Descriptions
```javascript
const description = `${formatPeriodLabel(periodLabel)} quarter winnings for board ${boardId}`;
// "first quarter winnings for board abc123"
```

### Why "final" Not "fourth"

**System uses "final" instead of "q4"** because:
- Final score includes overtime
- "Fourth quarter" misleading for OT games
- "Final" is universally understood
- Matches ESPN terminology

### Used By
- `processQuarterPayoutsInTransaction` - Notification messages
- Transaction description generation
- UI display components

### Related Documentation
- [Data Models: Notification](../../data-models/notification.md)
- [Data Models: Transaction](../../data-models/transaction.md)

