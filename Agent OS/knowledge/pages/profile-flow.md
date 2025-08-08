# Knowledge: Profile & Settings Flow (`/profile/*`)

## 1. Overview & Purpose

The Profile and Settings section serves as the user's personal hub. It allows them to view their account summary, manage personal information, update security settings, and access important informational pages.

## 2. Page-by-Page Breakdown

### a. `/profile` (Main Profile Page)

-   **Responsibility:** Acts as the main dashboard for the user's account.
-   **Functionality:**
    -   **Authentication:** Uses the `useWallet` hook to ensure the user is logged in and verified. Redirects to `/login` or `/verify-email` if conditions aren't met.
    -   **Data Fetching:** Fetches the current user's data from their document in the `users` Firestore collection to display their `username`, `email`, and `balance`.
    -   **UI Display:**
        -   Shows a profile summary card with the user's avatar, username, and email.
        -   Displays the current balance and provides a "Manage" link to the `/wallet` page.
        -   Provides navigation menus for "Account" (Settings, Transactions) and "Information & Support" (FAQ, Terms, etc.).
    -   **Actions:**
        -   Allows the user to trigger a file input to change their profile picture (Note: frontend logic is present, but the backend upload/update logic is not fully shown in the file).
        -   Contains the **Logout** button, which calls `signOut` from Firebase Auth.

### b. `/profile/settings` (Account Settings Page)

-   **Responsibility:** Allows users to update their personal and security information.
-   **Functionality:**
    -   **Data Fetching/Pre-population:** Fetches the user's `display_name` and `phone` from their Firestore document to pre-fill the form fields.
    -   **Update Personal Info:** Users can change their Display Name and Phone Number. On submission, these fields are updated in their Firestore `users` document via an `updateDoc` call.
    -   **Change Email:**
        -   Presents a button that opens a modal for changing the account's email address.
        -   The modal requires the user's current password for re-authentication.
        -   Upon successful re-authentication, it calls `updateEmail` from Firebase Auth and also updates the `email` field in the Firestore `users` document.
    -   **Navigation:** Provides clear links to more specific security pages like "Change Password".

### c. `/profile/settings/change-password`

-   **Responsibility:** Provides a secure interface for a user to change their password.
-   **Functionality:**
    -   **Re-authentication:** Requires the user to enter their `currentPassword`.
    -   **Validation:** The new password must meet specific security criteria (length, character types) and the confirmation password must match.
    -   **Update Password:** If validation and re-authentication are successful, it calls `updatePassword` from Firebase Auth to change the user's password.

### d. `/profile/settings/personal-details`

-   **Responsibility:** Allows users to manage sensitive personal information required for compliance (e.g., KYC).
-   **Functionality:**
    -   **Data Fetching:** Fetches existing personal details (First Name, Last Name, DOB, Address) from the user's Firestore document.
    -   **Data Update:** Allows the user to fill in or update this information. On submission, the data is saved to their Firestore `users` document via `updateDoc`.
    -   **Age Verification:** Includes a client-side check to ensure the Date of Birth (DOB) provided meets the 21+ age requirement. If not, it automatically signs the user out.

## 3. Core Components & State Management

-   **`@/hooks/useWallet`:** Used on the main profile page to enforce authentication and email verification.
-   **`onAuthStateChanged`:** Used directly in the settings pages to get the current user and ensure they are logged in before loading or saving data.
-   **Firebase SDK:** Heavy use of `firebase/auth` (`signOut`, `reauthenticateWithCredential`, `updatePassword`, `updateEmail`) and `firebase/firestore` (`getDoc`, `updateDoc`).
-   **`@/components/ui/*`:** Uses various `shadcn/ui` components like `Button`, `Input`, and `Dialog` for the user interface.

## 4. Key Data Dependencies

-   **Firestore Document:** All pages in this flow read from and write to the user's specific document located at `/users/{userId}`.
-   **Firebase Auth User Object:** Relies on the user object for email, UID, and for performing secure actions like changing email or password. 

## 5. Core Components Used

- `@/components/lobby/BottomNav`
- `@/components/ui/button`, `@/components/ui/input`
- `@/components/ui/dialog` (Change Email modal) 