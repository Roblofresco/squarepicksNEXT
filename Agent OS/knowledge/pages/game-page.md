# Knowledge: Game Page (`/game/[gameId]`)

## 1. Overview & Purpose

The Game Page is where users interact with a specific game and its associated boards. It allows users to select squares on a 10x10 grid for various entry fees, view game details, and confirm their entries. This page handles the core gameplay mechanics of the application.

## 2. Key Responsibilities & Functionality

-   **Dynamic Routing:** Fetches `gameId` from the URL parameters to load the correct game and board data.
-   **Authentication & Wallet Checks:**
    -   Leverages the `useWallet` hook to check for `userId`, `emailVerified`, `hasWallet`, and `balance`.
    -   Redirects unauthenticated users to `/login`.
    -   Redirects authenticated users with unverified emails to `/verify-email`.
    -   Prompts users to set up a wallet or deposit funds if they attempt to select a square without the necessary setup or balance.
-   **Data Fetching:**
    -   **Game Details:** Fetches and displays detailed information for the specific `gameId` from the `games` collection in Firestore, including resolving team data from references.
    -   **Board Data:** Fetches the currently `open` board from the `boards` collection that matches the `gameId` and the `selectedEntryAmount`. It uses a real-time Firestore listener (`onSnapshot`) to keep the board's `selected_indexes` and status updated live.
    -   **User's Squares:** After a board is loaded, it performs a separate query on the `squares` subcollection of that board to identify which squares the current user has already purchased.
-   **State Management:**
    -   Manages a significant amount of local state, including:
        -   `gameDetails`: The loaded game data.
        -   `currentBoard`: The active board for the selected entry fee.
        -   `selectedEntryAmount`: The currently chosen entry fee (e.g., 1, 5, 10, 20).
        -   `selectedSquares`: A `Set` of numbers representing the squares the user has clicked on but not yet confirmed.
        -   `currentUserPurchasedSquaresSet`: A `Set` of numbers representing squares the user *owns* on the current board.
        -   Various loading (`isLoadingGame`, `isLoadingBoard`) and error states.
-   **Core User Interaction (`handleSquareClick`):**
    -   This is the central logic for when a user clicks a square on the grid.
    -   It performs a series of checks in order:
        1.  Blocks interaction if the board isn't open or the game has started.
        2.  Blocks interaction if the square is already taken.
        3.  Handles the authentication/wallet/balance checks mentioned above, showing modals if necessary.
        4.  If all checks pass, it adds or removes the square number from the `selectedSquares` set.
-   **Confirming Selections (`handleConfirmSelection`):**
    -   Takes the `selectedSquares` set and sends it to the `enterBoard` Firebase Cloud Function for processing.
    -   Handles success and error responses from the backend, showing toasts to the user.
    -   On success, it clears the `selectedSquares` set and increments `entrySuccessCount` to trigger a re-fetch of the user's purchased squares.
-   **Rendering Logic:**
    -   Displays loading spinners while data is being fetched.
    -   Renders the main 10x10 grid (`renderGrid`), dynamically styling each square based on its state:
        -   Purchased by the current user.
        -   Taken by another user.
        -   Selected by the current user (pre-confirmation).
        -   Available.
    -   Displays a confirmation button that shows the total cost and number of selected squares.

## 3. Core Components Used

-   `@/components/ui/button`: For all interactive buttons.
-   `@/components/ui/dialog`: For modals related to wallet setup and insufficient funds.
-   `@/components/ui/toaster`: For displaying success and error messages.
-   `lucide-react` icons (`Loader2`, `ArrowLeft`, etc.): For visual feedback.

## 4. Key Data Dependencies & Hooks

-   **Firestore Collections:** `games`, `boards`, and the `squares` subcollection within `boards`.
-   **Firebase Services:** `functions` for invoking the `enterBoard` backend function.
-   **Custom Hooks:**
    -   `useWallet`: Central to the page's functionality for auth, user, and balance information.
-   **Next.js Hooks:** `useParams`, `useSearchParams`, `useRouter` for handling routing and URL parameters. 