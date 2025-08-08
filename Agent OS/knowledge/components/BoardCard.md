# Knowledge: BoardCard Component (`@/components/lobby/BoardCard.tsx`)

## 1. Overview & Purpose

The `BoardCard` is a crucial UI component used within the `BoardsList` on the Lobby Page. Its purpose is to display a summary of a specific game and provide a "quick entry" interface for the active $1 board associated with that game. It's designed to allow users to select and purchase a single square without leaving the lobby.

## 2. Key Responsibilities & Functionality

-   **Data Fetching:**
    -   Receives a `game` object as a prop.
    -   It performs its own real-time Firestore query (`onSnapshot`) to find the single **active, open, $1 board** that corresponds to the `game.id`. If no such board exists, the component renders `null`.
    -   It maintains a separate listener to fetch the currently logged-in user's purchased squares for that specific active board from the `squares` subcollection. This ensures the mini-grid accurately reflects the user's owned squares.
-   **State Management:**
    -   Manages local state for the `activeBoard` it finds.
    -   Holds state for the user's purchased squares on this board (`boardCardCurrentUserSquaresSet`).
    -   Uses a `purchaseTrigger` state variable to force re-fetching of board and user-square data after a successful purchase.
-   **Rendering Logic:**
    -   Displays the logos and records for the two teams involved in the game.
    -   Renders a `BoardMiniGrid` component, passing down the board's `selected_indexes` and the user's own purchased squares so the grid can be styled correctly (taken, owned by user, available).
    -   Renders the `QuickEntrySelector` component, which contains the interactive elements for the quick entry flow.
-   **User Interaction:**
    -   The component itself is a link to the full `Game Page` for that game. It wraps the main content in a Next.js `<Link>`.
    -   It delegates all complex interaction logic (handling number input, confirming purchases, showing wallet modals) to the `QuickEntrySelector` component by passing down handler props from the parent Lobby Page (`handleBoardAction`, `openWalletDialog`).

## 3. Core Components Used

-   `./BoardMiniGrid`: A non-interactive 10x10 grid that visually represents the state of the board's squares.
-   `./QuickEntrySelector`: The interactive UI for the quick entry feature, including the number input, random button, and confirm/cancel logic.

## 4. Key Data Dependencies & Hooks

-   **Firestore Collections:** `boards`, `squares` (subcollection).
-   **Props:** Relies heavily on props passed down from `LobbyPage`, including the `game` object, `user` object, and various state handlers and wallet information. This makes it a "smart" component that also depends on its parent for orchestrating actions.
-   **Next.js Hooks:** `useRouter` for programmatic navigation if needed. 