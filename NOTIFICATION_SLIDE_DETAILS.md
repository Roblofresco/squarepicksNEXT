# Notification Slide-to-Reveal Implementation Details

## User Interaction
**Swipe Direction: LEFT** (notification content moves left, buttons appear from right)

## Visual Behavior

### Closed State (Default)
```
┌────────────────────────────────────────────┐
│ [Icon] TYPE: "Board Entry"                  │
│        Title: "$5 - Texans @ Colts"          │
│        Message: "Your square entry..."       │
│        8s ago                                │
└────────────────────────────────────────────┘
```

### Swiping Left (Intermediate)
```
┌────────────────────────────────────────────┐
│      TYPE: "Board Entry"                    │ ← Content sliding left
│       Title: "$5 - Texans @ Colts"          │
│       Message: "Your square entry..."       │
│       8s ago                                 │
│                    [VIEW] [DELETE]          │ ← Buttons appearing from right
└────────────────────────────────────────────┘
```

### Fully Open (Swiped Left Past Threshold)
```
┌────────────────────────────────────────────┐
│  TYPE: "Board Entry"                        │ ← Content fully left
│   Title: "$5 - Texans @ Colts"             │
│   Message: "Your square entry..."           │
│   8s ago                                     │
│              [VIEW] [DELETE]                │ ← Buttons fully visible
└────────────────────────────────────────────┘
```

## Implementation

### Touch/Mouse Event Flow
1. **Start** (`onTouchStart` / `onMouseDown`):
   - Record initial X position: `startX`
   - Record current `translateX` value (usually 0 if closed)

2. **Move** (`onTouchMove` / `onMouseMove`):
   - Calculate delta: `deltaX = currentX - startX`
   - For swipe LEFT: `deltaX` is negative (e.g., -80px)
   - Update `translateX = currentTranslateX + deltaX`
   - Clamp: `Math.max(-160, Math.min(0, translateX))` (can't go past -160px or positive)

3. **End** (`onTouchEnd` / `onMouseUp`):
   - Check if absolute `translateX` > threshold (50px)
   - If YES: Snap to `-160px` (fully open, buttons visible)
   - If NO: Snap back to `0px` (closed, buttons hidden)

### CSS Structure
```tsx
<div className="relative overflow-hidden w-full">
  {/* Content that slides */}
  <div 
    className="flex items-start gap-3 p-3 transition-transform duration-300"
    style={{ transform: `translateX(${translateX}px)` }}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
  >
    {/* Icon, Type, Title, Message, Timestamp */}
  </div>
  
  {/* Action buttons (fixed on right, revealed when content slides left) */}
  <div className="absolute right-0 top-0 h-full w-40 flex">
    <ViewButton onClick={handleView} />
    <DeleteButton onClick={handleDelete} />
  </div>
</div>
```

### Button Positioning
- **View Button**: Left side of action container (first button)
- **Delete Button**: Right side of action container (second button)
- Both buttons: 80px width each, full height, visible when `translateX < -50px`

