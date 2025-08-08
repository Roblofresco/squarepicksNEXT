# Knowledge: Welcome Page (`/`)

## 1. Overview & Purpose

The Welcome Page (root `page.tsx`) is the primary landing page for new, unauthenticated visitors to SquarePicks. Its main goals are to introduce the application, build excitement, and serve as the primary call-to-action for user registration.

## 2. Key Responsibilities & Functionality

-   **Authentication Check:**
    -   It uses the `useWallet` hook to check if a user is already logged in.
    -   If a user is logged in, it **automatically redirects them to the `/lobby`**, ensuring returning users bypass the marketing page.
-   **Interactive Background:**
    -   This page features a highly interactive 3D background powered by a `<canvas>` element.
    -   It uses `useEffect` hooks to create and animate a "constellation" effect, where stars twinkle and lines are drawn between nearby stars and the user's mouse pointer, creating an engaging visual experience.
    -   It also has a radial gradient "spotlight" that follows the user's mouse.
-   **User Interaction:**
    -   The page listens for `ArrowUp` and `ArrowDown` key presses to simulate a "secret code" entry, which, when completed, triggers a celebratory animation and automatically navigates the user to the signup page.
-   **Call to Action:**
    -   The primary UI element is a prominent "Get Started" button.
    -   Clicking this button navigates the user to the first step of the signup flow (`/signup/email`).

## 3. Core Components Used

-   `@/components/LogoCube`: A 3D rotating cube logo that responds to mouse movement.
-   `@/components/ui/button`: Used for the "Get Started" and "Login" buttons.
-   `next/link`: For navigation.

## 4. Key Data Dependencies & Hooks

-   **Custom Hooks:** `useWallet` is used exclusively for the authentication check and redirection logic.
-   **Next.js Hooks:** `useRouter` is used for programmatic navigation.
-   **React Hooks:** `useState` and `useEffect` are used extensively to manage the state of the interactive background and the secret code feature. 

## 5. Core Components Used

- `@/components/LogoIcon`, `@/components/LogoWithText`
- `framer-motion` for animations
- `next/link` for navigation 