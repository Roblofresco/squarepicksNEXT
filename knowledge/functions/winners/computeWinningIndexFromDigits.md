# computeWinningIndexFromDigits

## Overview
Helper function that computes the winning square index and coordinate string from board number mappings and score last digits. Used for winner calculation logic.

## Function Type
Internal Helper Function (not exported as Cloud Function)

## Parameters

```typescript
{
  boardData: {
    home_numbers: string[];  // Array of 10 strings ["0", "1", ..., "9"]
    away_numbers: string[];  // Array of 10 strings ["0", "1", ..., "9"]
  };
  homeLastDigitStr: string;  // Last digit of home team score (0-9)
  awayLastDigitStr: string;  // Last digit of away team score (0-9)
}
```

## Return Value

```typescript
{
  winningIndex: number;      // Square index (0-99)
  winningSquare: string;     // Square coordinate (e.g., "47")
} | null
```

Returns `null` if:
- Board data missing or invalid arrays
- Last digits not found in board number arrays

## Winner Calculation Math

### Step 1: Find Array Indices

```javascript
const homeIdx = boardData.home_numbers.indexOf(String(homeLastDigitStr));
const awayIdx = boardData.away_numbers.indexOf(String(awayLastDigitStr));
```

- Searches for last digit in each number array
- Returns array index (0-9) where digit appears
- Returns -1 if digit not found

### Step 2: Calculate Square Index

```javascript
winningIndex = awayIdx * 10 + homeIdx
```

**Formula**: `awayIdx * 10 + homeIdx`

- `awayIdx`: Row position (0-9)
- `homeIdx`: Column position (0-9)
- Result: Square index 0-99

### Step 3: Calculate Square Coordinate

```javascript
winningSquare = `${awayLastDigitStr}${homeLastDigitStr}`
```

**Business Rule**: Square coordinate format is `{awayDigit}{homeDigit}` (away digit first, then home digit)

## Example Calculation

### Input
```javascript
boardData = {
  home_numbers: ["5", "3", "8", "1", "0", "9", "2", "7", "4", "6"],
  away_numbers: ["4", "7", "2", "9", "0", "3", "1", "8", "6", "5"]
};
homeLastDigitStr = "4";  // Home score ends in 4
awayLastDigitStr = "7";  // Away score ends in 7
```

### Calculation
1. Find indices:
   - `homeIdx = home_numbers.indexOf("4") = 8` (4 is at index 8)
   - `awayIdx = away_numbers.indexOf("7") = 1` (7 is at index 1)

2. Calculate square index:
   - `winningIndex = 1 * 10 + 8 = 18`

3. Calculate square coordinate:
   - `winningSquare = "74"` (away digit first: "7" + "4")

### Result
```javascript
{
  winningIndex: 18,
  winningSquare: "74"
}
```

## Edge Cases

### Missing Digits
If last digit not found in array:
```javascript
homeIdx = -1  // or awayIdx = -1
// Function returns null
```

### Invalid Board Data
```javascript
boardData.home_numbers = null  // or not an array
// Function returns null
```

### Zero Scores
```javascript
homeLastDigitStr = "0"
awayLastDigitStr = "0"
// Works correctly if "0" exists in arrays
```

## Usage Context

This function is used internally by winner assignment logic but is **not directly called** in the current implementation. The actual winner calculation uses a simpler direct calculation:

```javascript
// Actual implementation (simpler)
const homeLast = String(Number(homeScore || 0) % 10);
const awayLast = String(Number(awayScore || 0) % 10);
const winningSquare = `${awayLast}${homeLast}`;
```

The `computeWinningIndexFromDigits` function provides a way to calculate the square index from board mappings, but the current system calculates winning square directly from scores and queries squares by coordinate.

## Related Functions
- `assignWinnersForBoardPeriod`: Uses direct score calculation (not this function)
- `onGameUpdatedAssignWinners`: Calculates winning squares from scores

## Implementation Notes

### Why This Function Exists
- Provides alternative calculation method using board number mappings
- Could be used for validation or alternative winner determination
- Currently not used in production flow

### Square Coordinate Format
- Always 2 characters
- Format: `{awayDigit}{homeDigit}`
- Examples: "00", "47", "99"

### Index Calculation
- Uses standard 10x10 grid formula
- Row (away) × 10 + Column (home)
- Result always 0-99

