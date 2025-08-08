# Knowledge: Wallet Setup Flow (`/wallet-setup/*`)

## 1. Overview & Purpose

The Wallet Setup Flow is a mandatory, two-step onboarding process for users who wish to participate in paid contests. Its primary purpose is to ensure legal compliance by verifying the user's location and collecting necessary personal information (KYC - Know Your Customer).

## 2. Page-by-Page Breakdown

### a. `/wallet-setup/location` (Step 1)

-   **Responsibility:** To verify that the user is physically located in a US state where the service is legally offered.
-   **Functionality:**
    -   **Authentication:** Ensures a user is logged in via `onAuthStateChanged`.
    -   **Geolocation:** Prompts the user to grant browser location permissions. On approval, it gets the user's latitude and longitude.
    -   **Backend Verification:** It sends the coordinates to a Firebase Cloud Function named `verifyLocationFromCoords`.
    -   **Eligibility Check:** The frontend checks the state returned from the backend against a hardcoded list of `INELIGIBLE_STATES`.
    -   **Redirection (Success):** If the user's state is eligible, the page automatically navigates to the next step (`/wallet-setup/personal-info`), passing the verified state as a URL query parameter (e.g., `?state=CA`).
    -   **Redirection (Failure):** If the state is ineligible, it displays a modal informing the user and then automatically logs them out and redirects them to the homepage after a 5-second delay.

### b. `/wallet-setup/personal-info` (Step 2)

-   **Responsibility:** To collect and save the user's personal identification information.
-   **Functionality:**
    -   **Authentication & State Check:**
        -   Ensures a user is logged in.
        -   It reads the `state` from the URL query parameter. If the state is missing or invalid, it redirects the user back to the `/wallet-setup/location` page, enforcing the correct flow.
    -   **Data Fetching:** It attempts to fetch any existing personal data from the user's Firestore document to pre-populate the form.
    -   **Form Submission:**
        -   Renders the `PersonalInfoForm` component.
        -   Upon submission, the data (First Name, Last Name, Phone, Address, etc.) is saved to the user's document in the `users` Firestore collection.
    -   **Completion (Inferred):** After successfully submitting the form, this page would typically be responsible for setting the `hasWallet` flag to `true` on the user's document and then redirecting them to the main `/wallet` page, completing the setup process.

## 3. Core Components & State Management

-   `@/components/ui/PersonalInfoForm`: A reusable form component for collecting the user's personal details.
-   `@/components/ui/ProgressBar`: Provides the user with a visual indicator of their progress through the two-step setup.
-   `@/components/ui/alert-dialog`: Used on the location page to inform users from ineligible states.

## 4. Key Data Dependencies & Hooks

-   **Firebase Services:**
    -   `auth` (`onAuthStateChanged`): To ensure a user is logged in throughout the flow.
    -   `firestore` (`getDoc`, `updateDoc`): To pre-populate form data and to save the final personal information.
    -   `functions` (`httpsCallable`): To call the `verifyLocationFromCoords` backend function for location verification.
-   **Browser APIs:** `navigator.geolocation` is used to get the user's coordinates.
-   **Next.js Hooks:** `useRouter`, `useSearchParams` to manage navigation and read the verified state from the URL. 

## 5. Core Components Used

- `@/components/ui/ProgressBar`
- `@/components/ui/PersonalInfoForm`
- `@/components/ui/alert-dialog` (ineligible state)
- `@/components/effects/StarfieldBackground` (dialog backdrop) 