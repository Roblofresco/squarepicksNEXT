# Winner Assignment Trigger Analysis

## Current Flow

### Step 1: `liveUpdateLeagueGames` calls `upsertGameFromEspnEvent`
- Updates game document with:
  - `quarter: 2` (when Q2 starts)
  - `isLive: true`
  - `status: "in_progress"`
  - Current scores
- **This triggers `onGameUpdatedAssignWinners`**
  - Checks: `before.quarter === 1 && after.quarter === 2 && after.homeQ1score !== undefined`
  - **PROBLEM**: At this point, `homeQ1score` hasn't been set yet, so condition fails
  - Result: Trigger exits, no winner assignment

### Step 2: `liveUpdateLeagueGames` calls `updateSplitsFromSummary`
- Updates game document with:
  - `homeQ1score: 3`
  - `awayQ1score: 7`
  - Other quarter scores
- **This triggers `onGameUpdatedAssignWinners` again**
  - Checks: `before.quarter === 1 && after.quarter === 2`
  - **PROBLEM**: `before.quarter` is already 2 (from Step 1), so condition fails
  - Result: Trigger exits, no winner assignment

## The Problem

**Two separate writes cause the trigger condition to never be met:**
1. First write: Quarter changes but scores not set → fails `after.homeQ1score !== undefined`
2. Second write: Scores set but quarter didn't change → fails `before.quarter === 1`

## Solutions

### Option 1: Combine Writes (Recommended)
Modify `updateSplitsFromSummary` to also update quarter field if needed, OR combine both updates into a single write operation.

### Option 2: Enhance Trigger Logic
Make trigger more flexible:
- Check if quarter scores are NEWLY set (didn't exist before, exist now)
- Check if quarter changed OR if quarter scores were just populated
- Use a reconciliation function as fallback

### Option 3: Add Reconciliation Call
Have `updateSplitsFromSummary` call a reconciliation function after setting quarter scores if they're newly populated.

### Option 4: Check in updateSplitsFromSummary
After setting quarter scores, check if we need to trigger winner assignment for any completed quarters.

## Recommended Fix

Enhance the trigger to handle both scenarios:
1. Quarter transition (1→2, 3→4)
2. Quarter scores newly populated (even if quarter already changed)

This ensures winner assignment happens regardless of write order.



