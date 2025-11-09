# Welcome / Home Page

## Route
`/` (root)

## Purpose
Landing page for SquarePicks. Showcases the platform, explains how to play, and encourages sign-up. Includes interactive 3D effects and animated grid visualization.

## Components Used
- `LogoIcon` - Brand logo icon
- `LogoWithText` - Full brand logo with text
- `motion` (Framer Motion) - All animations and interactions
- `useGesture` - Touch/gesture handling
- `useSpring` (React Spring) - Spring-based animations
- Custom canvas starfield background
- Interactive 10x10 grid visualization
- Easter egg system (secret code: "squares")

## APIs Called
- **Firebase Auth**:
  - `onAuthStateChanged()` - Monitors auth state, redirects to `/lobby` if already authenticated

## Data Flow
1. Page loads with animated entrance
2. Checks auth state via Firebase
3. If user authenticated: Immediate redirect to `/lobby`
4. If guest: Display landing page content
5. User can:
   - Click "Get Started" → `/signup/email`
   - Click "How It Works" → Smooth scroll to explanation section
   - Click "View Lobby" → `/lobby` (guest access)
   - Click "Log In" → `/login`

## UI Features
### Interactive Background:
- Canvas-based constellation of 150 twinkling stars
- Pointer tracking for interactive illumination effect
- Warp effect intensifies on pointer press
- Mouse/touch position affects star rendering
- Radial gradient spotlight follows cursor

### Hero Section:
- Animated 3D logo
- Gradient text effects
- "Get Started" and "How It Works" CTAs
- Animated 10x10 grid with random cell highlights every 3 seconds
- Grid demonstrates the board concept

### How to Play Section (4 steps):
1. Pick Your Square - Choose any open square
2. Boards Fill Up - Wait for all 100 squares
3. Pick Assignment - Numbers assigned randomly
4. Watch & Win - Match winning square at period ends

### Features:
- Payouts explanation (4 quarters, 20% each)
- Responsive stepper timeline
- Icon-based step indicators
- Final CTA section
- Footer with FAQ and Terms links

### Easter Egg:
- Type "squares" to activate hidden message
- Displays modal for 5 seconds
- Mentions hidden grid cell interaction

## State Management
- `activeSection` - Currently active UI section
- `easterEggActivated` - Easter egg trigger state
- `secretCode` - Array tracking typed keys
- `gridRef` - Reference to grid element
- `highlightedCells` - Array of currently highlighted grid cells (random)
- `isMounted` - Client-side mount state
- `mousePosition` - Cursor position for effects
- `navigatingTo` - Loading state for navigation buttons
- `isPointerDown` - Tracks pointer/touch press state
- `rotation` - Not directly used on home page

## Effects
- Canvas animation loop with stars
- Random grid cell highlighting every 3 seconds
- Pointer position tracking for spotlight
- Mouse/touch event listeners for interactions
- Resize handling for canvas
- Visibility change handling (pauses animation when tab hidden)
- Auth state monitoring for redirect

## Navigation Handlers
- `handleNavClick()` - Handles navigation with loading state
  - Sets loading state
  - Uses `window.location.href` for cross-browser compatibility
  - Fallback to `router.push()` on error

## Scroll Handling
- Smooth scroll to "How It Works" section
- Fallback for browsers without smooth scroll support
- Error handling for scroll operations

## Animations
### Framer Motion Variants:
- `fadeIn` - Fade in from below with 0.6s duration
- `staggerChildren` - Stagger child animations by 0.05s
- Grid highlights with scale and opacity transitions

### Hero Animation Sequence:
1. Logo fades in
2. Heading appears with stagger
3. Description text follows
4. CTA buttons animate in
5. Grid visualization slides up

## Accessibility
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus states on buttons
- Reduced motion support in preferences

## Performance Optimizations
- Dynamic import for LogoCube (client-side only)
- Canvas animation pause on tab visibility change
- Debounced resize handler (200ms)
- Frame rate limiting via `requestAnimationFrame`
- Memory cleanup on unmount
- Passive event listeners

## Responsive Design
- Mobile-first approach
- Breakpoints: md (768px), lg (1024px)
- Flexible grid layout
- Adjusted padding and spacing
- Touch-friendly button sizes

## Security
- Auto-redirect authenticated users to prevent unnecessary landing page exposure
- No sensitive data displayed

## SEO Considerations
- Clear page title
- Descriptive content
- Proper heading hierarchy
- Footer with internal links

