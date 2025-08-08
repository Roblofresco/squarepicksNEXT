# Project Roadmap: SquarePicks (Version 2 - Revised with Knowledge Base)

This document outlines the development roadmap for SquarePicks. This version has been updated after a full analysis of the codebase to more accurately reflect the current state of the project.

-   `[ ]` - To Do
-   `[~]` - In Progress
-   `[x]` - Done

---

## Epic 1: Core User Experience & Onboarding

-   **User Stories:**
    -   `[x]` As a new user, I can create an account with my email and password.
    -   `[x]` As a user, I can log in to my account.
    -   `[ ]` As a user, I can reset my password if I forget it.
    -   `[x]` As a new user, I must verify my email address to fully activate my account.
    -   `[x]` As a user, I can view my profile information.
    -   `[~]` As a user, I can edit my profile information (e.g., username, avatar). *(Note: Display Name/Phone is editable, but username/avatar is not fully implemented).*
    -   `[x]` As a user, I can navigate the application using a persistent header and navigation bar.

---

## Epic 2: Game Lobby & Board Interaction

-   **User Stories:**
    -   `[x]` As a user, I can see a lobby of all available game boards.
    -   `[ ]` As a user, I can filter and sort the game boards in the lobby (e.g., by sport, entry fee).
    -   `[x]` As a user, I can click on a board to see its details (e.g., rules, participants, grid).
    -   `[x]` As a user, I can join a game by selecting my squares on the grid.
    -   `[x]` As a user, I should see real-time updates on the board as other users join and squares are filled. *(Note: Confirmed use of Firestore onSnapshot).*
    -   `[x]` As a user, I can view all the boards I have personally joined in a "My Boards" section.
    -   `[~]` As the numbers are revealed for a game, I can see them update on the board grid. *(Note: UI is in place, but full end-to-end logic needs verification).*

---

## Epic 3: Wallet & Financial Transactions

-   **User Stories:**
    -   `[x]` As a user, I can view my current wallet balance.
    -   `[x]` As a user, I can deposit funds into my wallet using a payment provider (e.g., PayPal).
    -   `[x]` As a user, I can withdraw funds from my wallet.
    -   `[x]` As a user, I can view a detailed history of all my transactions.
    -   `[x]` As a user, I must complete a location and personal information check (KYC) before I can make a deposit or withdrawal. *(Note: Confirmed via wallet-setup-flow).*

---

## Epic 4: Notifications & Communication

-   **User Stories:**
    -   `[x]` As a user, I can see a notification icon that indicates when I have new, unread notifications.
    -   `[x]` As a user, I can view a list of my recent notifications.
    -   `[ ]` As a user, I should receive notifications for key events (e.g., when a game I joined is full, when results are in, when I win). *(Note: Frontend context exists, but backend triggers are not implemented).*
    -   `[ ]` As a user, I can manage my notification preferences.

---

## Epic 5: Informational & Support Pages

-   **User Stories:**
    -   `[x]` As a visitor, I can read a "How to Play" guide.
    -   `[x]` As a visitor, I can view the Terms of Service.
    -   `[x]` As a visitor, I can view the Privacy Policy.
    -   `[x]` As a visitor, I can read the Responsible Gaming Policy.
    -   `[x]` As a user, I can access an FAQ page.
    -   `[x]` As a user, I can use a contact form to get in touch with support.

---

## Epic 6: Technical Debt & Refactoring

-   **User Stories:**
    -   `[x]` As a developer, I want to refactor the informational pages to use a shared layout component for the background effects, removing significant code duplication. *(Done via `src/components/info/InfoPageShell.tsx` and applied to terms, privacy, FAQ, how-to-play, contact-support, account-guide, responsible-gaming-policy).* 

## Epic 7: Knowledge Base & Documentation Enforcement

- **User Stories:**
  - `[x]`