# Knowledge: My Boards Page (`/my-boards`)

## 1. Overview & Purpose

The "My Boards" page serves as the user's personal dashboard for tracking all the game boards they have participated in. It separates boards into two categories: "Active" (for ongoing or upcoming games) and "History" (for completed games).

## 2. Key Responsibilities & Functionality

-   **Authentication:** The page is strictly for authenticated users. It uses the `useWallet` hook to check for a `userId` and redirects to `/login` if the user is not signed in.
-   **Data Fetching:**
    -   Queries Firestore for boards where the user has squares.
    -   Active view covers statuses: `open`, `full`, and in-progress statuses (`IN_PROGRESS_*`).
    -   History view covers `FINAL_WON`, `FINAL_LOST`, `CANCELLED`.
-   **Realtime Updates (Numbers Reveal):**
    -   Subscribes (`onSnapshot`) to each user board document and the user's squares subcollection.
    -   When the backend assigns axis numbers on board full (`home_numbers`, `away_numbers`) and square docs gain `square` (XY) values, the UI updates live.
    -   The "Picks:" line shows each picked square's XY once `status !== 'open'`.
-   **State Management:**
    -   Maintains local state for `activeBoards` and `historyBoards`.
    -   Separates boards by `status`; updates in real time via snapshot listeners.
-   **Rendering Logic:**
    -   Uses shadcn/ui components (`Card`, `Badge`, `Tabs`, `Dialog`).
    -   Shows selected indexes and, post-reveal, XY values for the user's picks.
-   **Navigation:**
    -   Wrapped with `InAppHeader` and `BottomNav`.
    -   Each `SquareCard` is clickable (parent handles navigation to the game’s detailed page).

## 3. Core Components Used

-   `@/components/my-boards/SquareCard`: Displays summary for each board and the user's picks, including XY after reveal.
-   `@/components/InAppHeader`: The main header for logged-in users.
-   `@/components/lobby/BottomNav`: The main application navigation bar.
-   `@/components/ui/tabs`: For switching between Active and History views.

## 4. Key Data Dependencies & Hooks

-   **Firestore Collections:** `boards`, `boards/{boardId}/squares`, `games`, `teams`.
-   **Realtime:** `onSnapshot` on `boards/{boardId}` and `boards/{boardId}/squares` scoped to current user.
-   **Custom Hooks:** `useWallet` for getting the current `userId`.
-   **Next.js Hooks:** `useRouter` for navigation. 

## 5. Core Components Used

- `@/components/my-boards/SquareCard`
- `@/components/ui/tabs`
- `@/components/lobby/BottomNav`
- `@/components/ui/dialog`: Login prompt 