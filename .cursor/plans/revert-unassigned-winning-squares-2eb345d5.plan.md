<!-- 2eb345d5-9860-4915-b760-be6e01afadd4 d963c482-018b-4b68-80bf-2931493d04e9 -->
# Add Glossy Overlay Effect to Winner Square Pills

## Implementation: Glossy Overlay

Add a subtle white gradient overlay on top of the existing gradients to create a glossy, shiny appearance.

## Changes Required

### 1. Sweepstakes Winner Square Board
**File:** `src/components/lobby/sweepstakes/SweepstakesWinnersScoreboard.tsx`

**Assigned Pills** (line ~85):
Update the outer container className to add glossy effect:
```tsx
className={cn(
  "relative flex flex-col items-center justify-center p-3 rounded-lg transition-all overflow-hidden",
  "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none",
  "shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
  colors.bg,
  colors.border && "border-2",
  colors.border,
  isCurrent && "ring-2 ring-[#B8860B] ring-offset-2 ring-offset-transparent"
)}
```

**Unassigned Pills** (line ~85):
Same glossy effect for unassigned pills.

### 2. Game Page Winner Square Board
**File:** `src/app/game/[gameId]/page.tsx`

**All 4 Pills** (Q1, Q2, Q3, Final - lines ~942, ~985, ~1029, ~1073):
Update each pill container className:
```tsx
className={cn(
  "relative flex flex-col items-center justify-center p-3 rounded-lg transition-all overflow-hidden",
  "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none",
  "shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
  q1WinningSquare 
    ? "bg-gradient-to-br from-[#1bb0f2] to-[#108bcc] border-2 border-[#108bcc]" 
    : "bg-black/30"
)}
```

## Key CSS Properties
- `overflow-hidden` - Ensures the overlay stays within rounded corners
- `before:absolute before:inset-0` - Positions overlay to cover entire pill
- `before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent` - Creates glossy highlight at top
- `before:pointer-events-none` - Allows clicks to pass through overlay
- `shadow-[0_4px_12px_rgba(0,0,0,0.3)]` - Adds depth with stronger shadow

## Result
Pills will have a polished, glossy appearance with a subtle white highlight at the top, creating a shiny effect while maintaining the existing gold/blue color schemes.
