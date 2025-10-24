<!-- 13267add-c0b8-414a-ab72-24a05f407dfd e048beb1-7135-44b2-bd7d-771114182614 -->
# Fix Full Board View - Display Winners Scoreboard for Full Boards

## Current Issue

When a user clicks "View" on a full board (status="open", 100 squares selected, numbers assigned, game not started), the game page does NOT show the Winners Scoreboard because:

**File**: `src/app/game/[gameId]/page.tsx` (Line 1017)

```typescript
{gameDetails && gameDetails.status !== 'scheduled' && (
  <div className="mb-6">
    {/* Winners scoreboard */}
```

The condition `gameDetails.status !== 'scheduled'` prevents the Winners Scoreboard from displaying when the game is still scheduled.

## Expected Behavior

For a full board (100 squares selected, numbers assigned), the Winners Scoreboard should display with all unassigned pills (--) showing Q1, Q2, Q3, and Final as unassigned until the game starts and winners are calculated.

This matches the behavior in `SquareCard.tsx` (lines 370-404) which always shows the "Quarter Winners" section regardless of game status.

## Changes Required

### 1. Update Winners Scoreboard Display Condition (Line 1017)

**File**: `src/app/game/[gameId]/page.tsx`

**Current Code** (Line 1017):

```typescript
{gameDetails && gameDetails.status !== 'scheduled' && (
```

**Fix To**:

```typescript
{gameDetails && (currentBoard?.selected_indexes?.length === 100 || gameDetails.status !== 'scheduled') && (
```

**Reason**:

- Show Winners Scoreboard when board is full (100 squares selected) OR when game has started
- For full boards with scheduled games, all quarters will show "--" (unassigned)
- Once game starts and winners are assigned, the winning squares will populate
- This provides consistency with `SquareCard.tsx` which always shows "Quarter Winners"

## Verification

After this fix:

- Full board (100 squares) + scheduled game → Winners Scoreboard shows with all "--" pills
- Full board (100 squares) + live game → Winners Scoreboard shows with assigned winning squares
- Partial board (< 100 squares) + scheduled game → No Winners Scoreboard (correct)
- Any board + live/finished game → Winners Scoreboard shows (existing behavior preserved)

## No Other Changes Needed

The `handleBoardFull` function fixes from the previous plan are still valid:

1. Fix `isLive` field check (line 1778)
2. Fix `sweepstakesID` storage type (lines 1853-1855)
3. Keep board status as "open" (line 1678)

### To-dos

- [ ] Add guards to functions to forb
- [ ] Fix date field fallback in my-boards API (line 141)
- [ ] Add navigation to View button in SquareCard
- [ ] Fix status display logic - final status should show Winners Scoreboard
- [ ] Add winning indicators to Winners Scoreboard with gold gradient containers
- [ ] Add guards to functions to forb