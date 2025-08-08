# Knowledge: Account Settings Pages (`/account-settings/*`)

## 1. Overview & Purpose

This is a supplemental knowledge file to the main `profile-flow.md`. It covers the specific pages related to a user's account settings that were not detailed in the main profile flow document.

## 2. Page-by-Page Breakdown

### a. `/account-settings/change-password`

-   **Responsibility:** Provides a secure interface for a user to change their password.
-   **Functionality:**
    -   **Re-authentication:** Requires the user to enter their `currentPassword`.
    -   **Validation:** The new password must meet specific security criteria (length, character types) and the confirmation password must match.
    -   **Update Password:** If validation and re-authentication are successful, it calls `updatePassword` from Firebase Auth to change the user's password.

### b. `/account-settings/personal-details`

-   **Responsibility:** Allows users to manage sensitive personal information required for compliance (e.g., KYC).
-   **Functionality:**
    -   **Data Fetching:** Fetches existing personal details (First Name, Last Name, DOB, Address) from the user's Firestore document.
    -   **Data Update:** Allows the user to fill in or update this information. On submission, the data is saved to their Firestore `users` document via `updateDoc`.
    -   **Age Verification:** Includes a client-side check to ensure the Date of Birth (DOB) provided meets the 21+ age requirement. If not, it automatically signs the user out.

## 3. Key Data Dependencies & Hooks

-   **Firebase SDK:** Heavy use of `firebase/auth` (`reauthenticateWithCredential`, `updatePassword`) and `firebase/firestore` (`getDoc`, `updateDoc`).
-   **Next.js Hooks:** `useRouter` for navigation. 

## 5. Core Components Used

- `@/components/ui/input`: Text and password inputs
- `@/components/ui/button`: Primary and secondary actions
- `@/components/ui/dialog`: Modal used in Change Email flow 