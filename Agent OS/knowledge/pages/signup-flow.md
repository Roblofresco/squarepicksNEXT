# Knowledge: User Signup Flow (`/signup/*`)

## 1. Overview & Purpose

The user signup flow is a multi-step process designed to guide new users through account creation. It collects essential information progressively across several pages, managed by a shared `SignupContext`. The primary goal is to create a new user account in Firebase Authentication and a corresponding user document in Firestore.

## 2. Page-by-Page Breakdown

The flow consists of the following pages, with state being passed between them via the `SignupProvider`:

1.  **`/signup/email`:**
    -   **Responsibility:** Collects and validates the user's email address.
    -   **Action:** Stores the email in `SignupContext` and navigates to the next step.

2.  **`/signup/password`:**
    -   **Responsibility:** Collects and validates a secure password. It enforces criteria like length, numbers, and special characters.
    -   **Action:** Stores the password in `SignupContext`.

3.  **`/signup/identity`:**
    -   **Responsibility:** Collects the user's legal first name, last name, and date of birth (DOB).
    -   **Action:** Stores these details in `SignupContext`.

4.  **`/signup/username`:**
    -   **Responsibility:** This is the final step. It prompts the user for a unique public username and requires them to accept the Terms & Conditions.
    -   **Action:**
        -   Upon submission, it triggers the `createUserWithEmailAndPassword` function from Firebase auth.
        -   It then creates a new document in the `users` Firestore collection, saving the `username`, `firstName`, `lastName`, and `dob`.
        -   After successful creation, it redirects the user to the `/lobby`.

## 3. Core Components & State Management

-   **`@/context/SignupContext.tsx`:**
    -   This is the backbone of the entire flow.
    -   The `SignupProvider` component wraps the layout of the `/signup/*` route.
    -   It provides a single `signupData` object and a `setSignupData` function that all child pages use to read and write user information. This avoids losing state as the user navigates between steps.
-   **`@/components/SignupHeader.tsx`:** A consistent header displayed across all signup pages.
-   **`@/components/SignupProgressDots.tsx`:** A visual indicator showing the user which step they are on in the process.
-   **`@/app/signup/layout.tsx`:**
    -   The layout file for the signup route.
    -   Crucially, it wraps all its children with the `<SignupProvider>`, enabling the shared state.

## 4. Key Data Dependencies & Hooks

-   **Firebase Services:** `createUserWithEmailAndPassword` (Firebase Auth), `doc`, `setDoc` (Firestore).
-   **Custom Hooks:** `useSignupContext` is used by every page in the flow to access the shared data.
-   **Next.js Hooks:** `useRouter` for navigation between steps. 

## 5. Core Components Used

- `@/components/SignupHeader`
- `@/components/SignupProgressDots`
- `@/context/SignupContext` provider (layout) 