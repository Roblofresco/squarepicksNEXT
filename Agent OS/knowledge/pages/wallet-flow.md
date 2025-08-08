# Knowledge: Wallet & Transactions Flow (`/wallet/*`, `/deposit`, `/withdraw`, `/transactions`)

## 1. Overview & Purpose

This flow encompasses all user-facing functionality related to managing funds within the SquarePicks application. It includes viewing the wallet, depositing money, withdrawing winnings, and reviewing transaction history. This flow is heavily reliant on the `useWallet` hook and interacts with the PayPal API for payment processing.

## 2. Page-by-Page Breakdown

### a. `/wallet` (Wallet Dashboard)

-   **Responsibility:** To serve as the central hub for a user's financial information and actions.
-   **Functionality:**
    -   **Authentication:** Strictly protected. It uses the `useWallet` hook and will redirect if the user is not logged in or has not verified their email.
    -   **Wallet Initialization:** If `useWallet` reports that the user has an account but `hasWallet` is `false`, this page presents a button to "Initialize Wallet," which sets up the necessary backend state.
    -   **Data Display:** Shows the user's current `balance` from the `useWallet` hook.
    -   **Recent Transactions:** Fetches and displays the user's 5 most recent transactions from the `transactions` Firestore collection.
    -   **Navigation:** Provides the main action buttons to navigate to the `/deposit` and `/withdraw` pages.

### b. `/deposit`

-   **Responsibility:** To allow users to add funds to their wallet using PayPal.
-   **Functionality:**
    -   **Authentication & Wallet Check:** Ensures user is logged in and has an initialized wallet via `useWallet`.
    -   **PayPal Integration:** Uses the `@paypal/react-paypal-js` library to render the PayPal buttons.
    -   **Order Creation:**
        -   When the user enters an amount and clicks the PayPal button, the frontend calls the internal API route `/api/paypal/create-order`.
        -   This backend route then calls the official PayPal API to create a payment order and returns the `orderID` to the frontend.
    -   **Order Capture:**
        -   After the user approves the payment in the PayPal pop-up, the `onPayPalApprove` function is triggered.
        -   This function calls the `capturePayPalOrder` Firebase Cloud Function, passing the `orderID`.
        -   The Cloud Function then executes the payment capture with the PayPal API and, if successful, credits the user's account by updating their `balance` in their Firestore document and creating a `deposit` transaction record.
    -   **UI Feedback:** Displays success or error messages based on the outcome of the transaction.

### c. `/withdraw`

-   **Responsibility:** To allow users to withdraw funds from their account.
-   **Functionality:**
    -   **Authentication & Wallet Check:** Enforces user login and wallet initialization.
    -   **Form Handling:** Uses `react-hook-form` and `zod` for robust form validation to collect the withdrawal amount.
    -   **Submission:** On submission, it calls a `processWithdrawal` Firebase Cloud Function (inferred functionality). This backend function would be responsible for:
        -   Verifying the user has sufficient withdrawable balance.
        -   Processing the payout via the appropriate payment provider (e.g., PayPal Payouts).
        -   Deducting the amount from the user's `balance` in Firestore.
        -   Creating a `withdrawal` transaction record.

### d. `/transactions`

-   **Responsibility:** To provide a complete and filterable history of a user's financial activities.
-   **Functionality:**
    -   **Data Fetching:** Queries the `transactions` Firestore collection, filtered by the current `userId`.
    -   **Filtering:** Provides UI controls (`Select`, `Checkbox`) to filter the transaction list by `type` (Deposit, Payout, Entry Fee, etc.) and `date range`.
    -   **Display:** Renders the transactions in a clear, tabular format.

## 3. Core Components & State Management

-   **`@/hooks/useWallet`:** Used on every page in this flow to get user ID, wallet status, and balance.
-   **`@paypal/react-paypal-js`:** The primary library for rendering PayPal buttons on the `/deposit` page.
-   **Internal API Routes (`/api/paypal/*`):** Act as a secure backend-for-frontend to handle communication with the PayPal API.
-   **Firebase Cloud Functions:** `capturePayPalOrder` and an inferred `processWithdrawal` contain the critical, secure backend logic for processing payments.

## 4. Key Data Dependencies

-   **Firestore Collections:** `users` (for reading/writing balance), `transactions`.
-   **External Services:** PayPal API for payment processing.
-   **Environment Variables:** Securely stores PayPal Client ID and Secret Key. 

## 5. Core Components Used

- `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/label`
- `@/components/ui/ProgressBar`, `@/components/ui/PersonalInfoForm`
- `@paypal/react-paypal-js` PayPal buttons (Deposit) 