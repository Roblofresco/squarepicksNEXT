# Knowledge: StarfieldBackground Component (`@/components/effects/StarfieldBackground.tsx`)

## 1. Overview & Purpose
- Canvas-based starfield effect component used as a modal/backdrop visual.

## 2. Key Responsibilities & Functionality
- Renders animated stars; meant to overlay under dialogs for depth.
- Non-interactive; accepts `className` for z-index/layering.

## 3. Where Used
- `src/app/lobby/page.tsx` (shown when dialogs are open)
- `src/app/wallet-setup/location/page.tsx` (background for ineligible dialog) 