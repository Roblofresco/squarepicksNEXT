# Knowledge: My Boards Page (`/my-boards`)

## 1. Overview & Purpose

The "My Boards" page serves as the user's personal dashboard for tracking all the game boards they have participated in. It separates boards into two categories: "Active" (for ongoing or upcoming games) and "History" (for completed games).

## 2. Key Responsibilities & Functionality

-   **Authentication:** The page is strictly for authenticated users. It uses the `useWallet` hook to check for a `userId` and redirects to `/login` if the user is not signed in.
-   **Data Fetching:**
    -   It performs a comprehensive query on the `boards` Firestore collection.
    -   The query fetches all boards where the `participants` array contains the current user's `userId`. This is the primary mechanism for finding a user's boards.
    -   After fetching the boards, it performs subsequent queries to get the associated `game` data for each board and then the `team` data for each game. This is a multi-step data aggregation process.
-   **State Management:**
    -   Maintains local state for `activeBoards` and `historyBoards`.
    -   After fetching all the data, it iterates through the results and separates them into the two lists based on the board's `status` field (e.g., 'FINAL_WON', 'FINAL_LOST' go into history, while others are active).
-   **Rendering Logic:**
    -   Uses a `Tabs` component from `shadcn/ui` to allow the user to switch between the "Active" and "History" views.
    -   Within each tab, it calls a `renderBoardGrid` function.
    -   This function maps over the appropriate list (either `activeBoards` or `historyBoards`) and renders a `SquareCard` component for each board.
    -   If a list is empty, it displays a message prompting the user to join a game from the lobby.
-   **Navigation:**
    -   The entire page is wrapped with the standard `InAppHeader` and `BottomNav` components.
    -   Each `SquareCard` is clickable and navigates the user to the detailed `Game Page` (`/game/[gameId]`) for that specific board, allowing them to view the grid in detail.

## 3. Core Components Used

-   `@/components/my-boards/SquareCard`: The primary component used to display a summary of each board the user has joined.
-   `@/components/InAppHeader`: The main header for logged-in users.
-   `@/components/lobby/BottomNav`: The main application navigation bar.
-   `@/components/ui/tabs`: For switching between Active and History views.

## 4. Key Data Dependencies & Hooks

-   **Firestore Collections:** `boards`, `games`, `teams`.
-   **Custom Hooks:** `useWallet` for getting the current `userId`.
-   **Next.js Hooks:** `useRouter` for navigation. 

## 5. Core Components Used

- `@/components/my-boards/SquareCard`
- `@/components/ui/tabs`
- `@/components/lobby/BottomNav`
- `@/components/ui/dialog`: Login prompt 