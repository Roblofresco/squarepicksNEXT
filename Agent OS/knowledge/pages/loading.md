# Knowledge: Loading Page (`/loading`)

## 1. Overview & Purpose

The Loading Page serves as an intermediary splash screen that is shown to users immediately after a successful, verified login. Its purpose is to provide a brief, engaging visual transition while any final user data or session information is being loaded in the background before they are directed to the main application hub (`/lobby`).

## 2. Key Responsibilities & Functionality

-   **User Experience:**
    -   Displays a large, interactive 3D `LogoCube` that the user can rotate with their mouse.
    -   Features a dynamic "starfield" background effect that gives a sense of forward motion.
-   **Timed Navigation:**
    -   The page displays an "Initializing..." message for the first 5 seconds.
    -   After 5 seconds, the text changes to "Tap to continue..." and navigation is enabled.
    -   The user can then click anywhere on the page to be programmatically redirected to the `/lobby`.
-   **Scroll Lock:** It explicitly disables scrolling on the `<body>` and `<html>` elements to ensure the splash screen is the only thing visible.

## 3. Core Components Used

-   `@/components/LogoCube`: The central interactive 3D logo.
-   `framer-motion`: Used for subtle animations on hint text.

## 4. Key Data Dependencies & Hooks

-   **Next.js Hooks:** `useRouter` is used for the final redirection to `/lobby`.
-   **React Hooks:** `useState` and `useEffect` are used to manage the timing for the text change and to enable navigation after the delay. 

## 5. Core Components Used

- `@/components/LogoCube`: Interactive 3D logo
- `framer-motion`: Hint animations 