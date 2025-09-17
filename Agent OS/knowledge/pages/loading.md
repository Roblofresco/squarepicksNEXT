# Knowledge: Loading Page (`/loading`)

## 1. Overview & Purpose

The Loading Page serves as an intermediary splash screen that is shown to users immediately after a successful, verified login. Its purpose is to provide a brief, engaging visual transition while any final user data or session information is being loaded in the background before they are directed to the main application hub (`/lobby`).

## 2. Key Responsibilities & Functionality

-   **User Experience:**
    -   Displays a 3D `LogoCube` with pointer-controlled rotation plus smooth idle motion when not interacting.
    -   Features a central forward-motion starfield with pointer glow/warp consistent with Home/Info pages.
-   **Timed Navigation:**
    -   Auto-redirects to `/lobby` after ~3.5 seconds; clicking anywhere navigates immediately.
-   **Scroll Lock:** Disables scrolling on `<body>` and `<html>` while visible.

## 3. Core Components Used

-   `@/components/LogoCube`: The central interactive 3D logo.
-   `framer-motion`: Used for subtle animations on hint text.

## 4. Key Data Dependencies & Hooks

-   **Next.js Hooks:** `useRouter` is used for the final redirection to `/lobby`.
-   **React Hooks:** `useState` and `useEffect` are used to manage the timing for the text change and to enable navigation after the delay. 

## 5. Core Components Used

- `@/components/LogoCube`: Interactive 3D logo
- `framer-motion`: Minor animations