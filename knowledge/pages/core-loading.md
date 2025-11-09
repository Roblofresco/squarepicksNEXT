# Loading Page

## Route
`/loading`

## Purpose
Transitional loading screen shown after successful login. Provides smooth user experience with 3D animated logo while redirecting to lobby.

## Components Used
- `LogoCube` - 3D animated logo (dynamic import, client-side only)
- `motion` (Framer Motion) - Animation library
- Custom canvas starfield background with forward motion effect

## APIs Called
None (purely presentational)

## Data Flow
1. Page loads after successful login
2. Displays animated logo with interactive effects
3. Auto-redirects to `/lobby` after 3.5 seconds
4. No user interaction required

## State Management
- `rotation` - Logo cube rotation (x, y axes)
- `isInteracting` - User pointer interaction state
- `isMounted` - Client-side mount state
- `mousePosition` - Cursor position for spotlight effect
- `idleRotationRef` - Ref for idle animation values
- `animationFrameRef` - Ref for animation loop ID
- `canvasRef` - Ref for starfield canvas
- `pointerRef` - Ref for pointer position
- `pointerDownRef` - Ref for pointer press state

## Effects
### Mount & Auto-navigation:
- Sets `isMounted` to true
- Starts 3.5-second timer
- Auto-navigates to `/lobby` when timer completes
- Cleans up timer on unmount

### Body Scroll Lock:
- Disables scroll on mount (`overflow: hidden`)
- Applies to both body and html elements
- Restores default scroll behavior on unmount

### Pointer Tracking (for spotlight):
- Initializes pointer at screen center
- Updates on mousemove, mousedown, mouseup
- Updates on touchmove, touchstart, touchend
- Redraws canvas on scroll
- Updates mousePosition state for gradient

### Pointer Tracking (for rotation):
- Throttled to ~60fps (16ms delay)
- Sets `isInteracting` to true on movement
- Calculates rotation based on pointer position:
  - Relative to window center
  - Normalized to -1 to 1 range
  - Reduced sensitivity (0.7x) for smooth movement
- Debounces interaction end (500ms timeout)
- Cleans up timers on unmount

### Idle Animation Loop:
- Starts when `!isInteracting && isMounted`
- Slower, smoother rotation speeds:
  - speedX: 0.005
  - speedY: 0.007
- Syncs with current rotation on idle start
- Uses `requestAnimationFrame` for smooth 60fps
- Only updates state when change exceeds threshold (0.01)
- Cancels loop when interaction starts or unmounted
- Proper cleanup in effect return

### Canvas Starfield Animation:
- **Setup**:
  - 200 stars initialized at random positions
  - Each star has: position, angle, speed, size, opacity, distance
  - Speed based on distance from center
  - Stars move outward from center (forward motion effect)

- **Animation Loop**:
  - Frame rate limited to 60fps via timestamp checking
  - Each star moves along its angle away from center
  - Speed increases with distance (perspective effect)
  - Stars reset when off-screen (recycled to center)

- **Warp Effect** (pointer-based):
  - Warp strength animates toward target
  - Target: Higher on pointer press, medium on hover
  - Stars glow brighter near pointer
  - Stars pulled slightly toward pointer (intensity-based)
  - Respects `prefers-reduced-motion` setting

- **Performance**:
  - Reduced star count (200 vs 400) for smoothness
  - Frame interval limiting
  - Efficient distance calculations
  - Canvas cleared each frame
  - Cleanup on unmount

## Interactive Features
### Logo Cube:
- **Pointer Control**: 
  - Follows cursor/touch position
  - Smooth rotation based on pointer location
  - Reduced sensitivity for fluid movement

- **Idle Animation**:
  - Slow continuous rotation
  - Resumes after 500ms of no interaction
  - Seamless transition from pointer control

### Starfield Background:
- **Forward Motion**: Stars move outward from center
- **Pointer Spotlight**: Radial gradient follows cursor
- **Pointer Warp**: Stars glow and warp toward pointer
- **Press Effect**: Stronger warp on pointer press
- **Responsive**: Resizes canvas on window resize

## Visual Effects
### Logo:
- 3D cube with 6 faces
- Smooth rotation on all axes
- Perspective transformation
- Interactive response to pointer

### Background:
- Canvas-based starfield
- 200 animated stars
- Twinkling opacity variations
- Forward motion (expanding from center)
- Pointer-driven illumination
- Subtle warp effect

### Spotlight:
- Radial gradient centered on pointer
- Blue tint (rgba(29, 78, 216, 0.06))
- Smooth transition (300ms)
- Follows mouse/touch position

## Navigation
- **Auto**: Redirects to `/lobby` after 3.5 seconds
- **Click**: Clicking anywhere immediately redirects to `/lobby`
- **Touch**: Tapping anywhere immediately redirects to `/lobby`

## Loading Message
- Text: "Redirecting to lobby..."
- Position: Bottom of screen (80px from bottom)
- Color: Gray (text-gray-400)
- Animation: Pulse effect
- Non-interactive (pointer-events-none)

## Layout
- Full viewport height (`100dvh`)
- Centered content
- Dark background (background-primary)
- Overflow hidden (no scroll)
- Click-to-skip enabled (cursor-pointer)
- Z-index layering:
  - Canvas: -1 (behind everything)
  - Spotlight: 0 (above canvas)
  - Logo & text: 10 (above spotlight)

## Accessibility
- Focus management (none needed, auto-redirects)
- Screen reader friendly (announces loading state)
- Keyboard accessible (any interaction skips)
- Motion preferences respected (reduced warp effects)

## Performance
- Dynamic import of LogoCube (client-only)
- RAF-based animations for 60fps
- Throttled pointer updates (16ms)
- Debounced interaction state (500ms)
- Frame rate limiting on canvas
- Proper cleanup of all timers and listeners
- Memory efficient (star recycling)

## Security
- No sensitive data displayed
- No API calls
- Client-side only
- Safe intermediate state

## User Experience
- Smooth transition from login
- Engaging visual feedback
- Clear indication of loading state
- Quick auto-redirect (3.5s)
- Option to skip by clicking/tapping
- Prevents jarring navigation

## Technical Details
### LogoCube Component:
- Dynamically imported to avoid SSR issues
- Receives rotationX and rotationY props
- Rendered at 6rem × 6rem size
- CSS custom property for cube size

### Canvas Rendering:
- Forward motion starfield simulation
- Pointer-based glow/warp effects
- Stars rendered as squares (fillRect)
- Color: rgba(27, 176, 242, opacity)
- Size range: 1.0 to 3.0 pixels
- Opacity range: 0.1 to 0.7

### Animation Math:
- Rotation sensitivity: 0.7x
- Idle speed X: 0.005 rad/frame
- Idle speed Y: 0.007 rad/frame
- Warp on hover: 0.5 (or 0 if reduced motion)
- Warp on press: 0.85 (or 0 if reduced motion)
- Warp easing: 12% per frame

## Cleanup & Memory Management
- Cancels animation frames on unmount
- Clears timeouts on unmount
- Removes event listeners on unmount
- Restores scroll behavior on unmount
- Clears canvas on unmount
- Prevents memory leaks

