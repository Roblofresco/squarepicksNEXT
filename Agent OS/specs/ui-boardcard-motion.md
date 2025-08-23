# UI Motion Spec: BoardCard

## Goal
Delightful, fluid BoardCard interactions with motion-safe, 60fps animations and zero layout shift.

## Scope
- `src/components/lobby/BoardCard.tsx`
- `src/components/lobby/QuickEntrySelector.tsx`
- `src/components/lobby/BoardMiniGrid.tsx`

## States
- Board: open, full, live
- Entry flow: idle → selecting → confirming

## Animations
- Card (motion.div)
  - whileHover: scale 1.01; whileTap: scale 0.99
  - transition: spring { stiffness: 300, damping: 20 }
  - Hover ring/glow: Tailwind ring-2 ring-accent-1/40 shadow-xl
- Logos
  - hover:scale-105; optional slight translate for parallax
- QuickEntrySelector
  - AnimatePresence between stages
  - enter: { opacity: 0, y: 8 } → { opacity: 1, y: 0, duration: 0.18 }
  - exit: { opacity: 0, y: -8, duration: 0.14 }
  - Invalid input shake: x keyframes [-4,4,-3,3,-2,2,0], 250ms
  - Confirm button: active translate-y-[1px]; loading spinner
- MiniGrid frame
  - Subtle border shimmer via CSS conic-gradient (2–3% opacity)
  - motion-safe fallback: static border

## Accessibility
- focus-visible rings on interactive controls
- aria-live="polite" for stage change text
- role="status" for loading; role="alert" for errors
- Respect prefers-reduced-motion: disable transforms; use opacity-only

## Performance
- Only transform/opacity
- `will-change: transform` on animated nodes
- Memoize MiniGrid; ensure image sizes to avoid CLS

## Test/QA
- Render in Superdesign (390×844 and 1280×800)
- Keyboard flows: Enter/Tab; Esc cancels selecting
- Motion-safe enabled → no motion jumps
- Hover/press perf ≥60fps

## Links
- Framer Motion patterns (hover/tap, AnimatePresence) — referenced via awesome-claude-code
- shadcn/ui components retained (no overrides) 