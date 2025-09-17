# Knowledge: Lobby Page (`/lobby`)

## 1. Overview & Purpose

The Lobby Page is the central hub for the SquarePicks application. Its primary purpose is to display available games and boards, allowing authenticated users to browse and enter contests. It serves as the main entry point into the application's core gameplay loop.

## 2. Key Responsibilities & Functionality

-   **Authentication Check:** The page uses the `useWallet` hook to check the user's authentication status (`userId`, `emailVerified`). It enforces redirection rules:
    -   If a user is logged in but their email is not verified, they are redirected to `/verify-email`.
    -   If a user is not logged in and attempts to view a regular sports category (not sweepstakes), they are redirected to `/login`.
-   **Sport & View Selection:**
    -   Manages the currently selected sport (e.g., 'NFL', 'NBA', or 'sweepstakes').
    -   State is controlled by `selectedSport` and `sportSelectorView`.
    -   Renders the `SportSelector` component to allow users to switch between the main "Sweepstakes" view and the "All Regular Sports" view.
-   **Data Fetching:**
    -   It initiates real-time Firestore listeners (`onSnapshot`) to fetch game and board data.
    -   **Sweepstakes View:** When `selectedSport` is 'sweepstakes', it queries for the single, open, free-entry board and its associated game data.
    -   **Regular Sports View:** When another sport is selected, it queries for all upcoming (`is_over: false`) games for that sport.
    -   It dynamically fetches and resolves team data (`TeamInfo`) for all displayed games using a `fetchMultipleTeams` helper.
-   **State Management:**
    -   Maintains local state for `games`, `teams`, `sweepstakesBoard`, `sweepstakesGame`, loading states, and errors.
    -   Manages UI interaction state for the quick-entry feature (`entryInteraction`) to track which board is being interacted with and what stage the interaction is in ('selecting', 'confirming').
-   **Rendering Logic:**
    -   Displays a loading indicator while fetching initial data.
    -   Displays an error message if data fetching fails.
    -   Conditionally renders one of two main views based on `selectedSport`:
        1.  **Sweepstakes View:** Renders `SweepstakesScoreboard` and `SweepstakesBoardCard`.
        2.  **Regular Sports View:** Renders a `GamesList` (horizontal scroll) and a `BoardsList` (vertical list of $1 boards for each game).
-   **User Interaction Handling:**
    -   Provides handler functions (`handleBoardAction`, `openWalletDialog`) that are passed down to child components (`BoardsList`, `SweepstakesBoardCard`).
    -   These handlers manage the state for the quick-entry system and open dialogs for wallet setup or insufficient funds.
-   **Navigation:**
    -   Renders the `InAppHeader` and `BottomNav` for consistent application navigation.
 -   **NUX Tour & Help:**
     -   Imports `driver.js/dist/driver.css` and dynamically loads `driver.js`.
     -   On first visit (tracked via `localStorage` key `lobby:nux:v1`), filters tour steps to existing DOM nodes and starts a guided tour using `driver.drive({ steps })`.
     -   Exposes `window.__startLobbyTour` to allow replay from the Help drawer.
     -   The Help button in `InAppHeader` opens `LobbyHelpDrawer`, which can replay the tour.

## 3. Core Components Used

-   `@/components/InAppHeader`: The main header for logged-in users.
-   `@/components/lobby/SportSelector`: Allows users to filter by sport and switch between sweepstakes/regular views.
-   `@/components/lobby/sweepstakes/SweepstakesScoreboard`: Displays the live score and details for the featured sweepstakes game.
-   `@/components/lobby/sweepstakes/SweepstakesBoardCard`: The primary component for displaying and interacting with the weekly free-entry sweepstakes board.
-   `@/components/lobby/GamesList`: A horizontally scrolling list of `GameCard` components for a selected sport.
-   `@/components/lobby/BoardsList`: A vertically scrolling list that renders a `BoardCard` for each game, displaying the active $1 board.
-   `@/components/lobby/BottomNav`: The main application navigation bar.
-   `@/components/ui/dialog`: Used to display modals for login prompts, wallet setup, and insufficient funds.
 -   `@/components/info/LobbyHelpDrawer`: Contextual help with replay tour action.

## 4. Key Data Dependencies & Hooks

-   **Firestore Collections:** `games`, `boards`, `teams`.
-   **Firebase Services:** `auth` for user state, `functions` for invoking backend logic (`enterBoard`).
-   **Custom Hooks:**
    -   `useWallet`: Provides critical user (`userId`, `emailVerified`), wallet (`hasWallet`, `balance`), and loading state information.
-   **Next.js Hooks:** `useRouter`, `useSearchParams`, `usePathname` for navigation and reading URL state. 
 -   **Other:** Uses `localStorage` for first-visit tour gating.

## 5. Core Components Used

- `@/components/InAppHeader`
- `@/components/lobby/SportSelector`
- `@/components/lobby/GamesList`
- `@/components/lobby/BoardsList`
- `@/components/lobby/sweepstakes/SweepstakesScoreboard`
- `@/components/lobby/sweepstakes/SweepstakesBoardCard`
- `@/components/lobby/BottomNav`
- `@/components/ui/dialog`: Login, Wallet Setup, Deposit dialogs
- `@/components/effects/StarfieldBackground`: Backdrop when dialogs open

## 6. Functions Called

- Callable: [`enterBoard`](../functions/enterBoard.md)
- Callable: [`getBoardUserSelections`](../functions/getBoardUserSelections.md)
- Callable: [`checkSweepstakesParticipation`](../functions/checkSweepstakesParticipation.md) 