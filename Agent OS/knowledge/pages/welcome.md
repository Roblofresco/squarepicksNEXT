# Knowledge: Welcome Page (`/`)

## 1. Overview & Purpose

The Welcome Page (root `page.tsx`) is the primary landing page for new, unauthenticated visitors to SquarePicks. Its main goals are to introduce the application, build excitement, and serve as the primary call-to-action for user registration.

## 2. Key Responsibilities & Functionality

-   **Interactive Background:**
    -   Pointer-driven twinkling stars in a `<canvas>` with a radial spotlight that follows cursor/touch; star warp strength eases on hover/press.
-   **Header Navigation:**
    -   "Log In" and "View Lobby" buttons at top-right; buttons are fully clickable with appropriate z-index and `pointer-events`.
-   **Calls to Action:**
    -   Primary: "Get Started" → `/signup/email`.
    -   Secondary: "How It Works" scrolls to the How to Play section with Edge-friendly fallback.
-   **How to Play Section:**
    -   Four-step overview with icons; animated on view.
-   **Footer CTA:**
    -   Copy: "Sign up today and claim your free weekly sweepstakes square" with a Sign Up button.
-   **Easter Egg:**
    -   Typing "squares" triggers a temporary easter egg toast.

## 3. Core Components Used

-   `@/components/LogoCube`: A 3D rotating cube logo that responds to mouse movement.
-   `@/components/ui/button`: Used for the "Get Started" and "Login" buttons.
-   `next/link`: For navigation.

## 4. Key Data Dependencies & Hooks

-   **Next.js Hooks:** `useRouter` for navigation.
-   **React Hooks:** `useState`, `useEffect`, refs for canvas and pointer tracking.

## 5. Core Components Used

- `@/components/LogoIcon`, `@/components/LogoWithText`
- `framer-motion` for animations
- `next/link` for navigation 