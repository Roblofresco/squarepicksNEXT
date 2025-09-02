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
    -   `[x]` As a user, I can reset my password if I forget it.
    -   `[x]` As a new user, I must verify my email address to fully activate my account.
    -   `[x]` As a user, I can view my profile information.
    -   `[~]` As a user, I can edit my profile information (e.g., username, avatar). *(Display Name/Phone editable; username avatar change not fully implemented).* 
    -   `[x]` As a user, I can navigate the application using a persistent header and navigation bar.

---

## Epic 2: Game Lobby & Board Interaction

-   **User Stories:**
    -   `[x]` As a user, I can see a lobby of all available game boards.
    -   `[x]` As a user, I can click on a board to see its details (e.g., rules, participants, grid).
    -   `[x]` As a user, I can join a game by selecting my squares on the grid.
    -   `[x]` As a user, I should see real-time updates on the board as other users join and squares are filled. *(Confirmed via Firestore onSnapshot).* 
    -   `[x]` As a user, I can view all the boards I have personally joined in a "My Boards" section.
    -   `[x]` As the numbers are revealed for a game, I can see them update on the board grid. *(My Boards and Game pages listen to `home_numbers`/`away_numbers` and reflect XY and winners live).* 

---

## Epic 3: Wallet & Financial Transactions

-   **User Stories:**
    -   `[x]` As a user, I can view my current wallet balance.
    -   `[x]` As a user, I can deposit funds into my wallet using a payment provider (e.g., PayPal).
    -   `[x]` As a user, I can withdraw funds from my wallet.
    -   `[x]` As a user, I can view a detailed history of all my transactions.
    -   `[x]` As a user, I must complete a location and personal information check (KYC) before I can make a deposit or withdrawal. *(Confirmed via wallet-setup-flow).* 

---

## Epic 4: Notifications & Communication

-   **User Stories:**
    -   `[x]` As a user, I can see a notification icon that indicates when I have new, unread notifications.
    -   `[x]` As a user, I can view a list of my recent notifications.
    -   `[x]` As a user, I should receive notifications for key events (board full, numbers revealed, win, deposit/withdrawal). *(Entry, deposit, withdrawal implemented; board full/numbers reveal/winnings implemented in Cloud Functions; push/email/SMS via notification sink).* 
    -   `[~]` As a user, I can manage my notification preferences.

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
    -   `[x]` As a developer, I want to refactor the informational pages to use a shared layout component for the background effects, removing significant code duplication. *(Done via `src/components/info/InfoPageShell.tsx` and applied across info/support pages).* 

## Epic 7: Knowledge Base & Documentation Enforcement

-   **User Stories:**
    -   `[x]` Knowledge pages for reset-password check-email and confirm
    -   `[x]` Component doc for `AuthBackground` added and indexed
    -   `[x]` Knowledge `INDEX.md` updated with new auth pages
    -   `[x]` CI: Agent OS verification and optional Playwright E2E (via `e2e` PR label)
    -   `[x]` PR diff checks require knowledge updates when `src/app/**` or components change

    ---

## Epic 8: Quarter Winners & Final Settlement

-   **User Stories:**
    -   `[x]` As a system, I can detect quarter boundaries and final state from `games/{gameId}` updates and trigger winner assignment idempotently.
    -   `[x]` As a system, I assign a quarter winner for each board tied to a game at the end of Q1/Q2/Q3 and at FINAL, using last-score digits and the board's `home_numbers`/`away_numbers` mapping.
    -   `[x]` As a user, I can see a public, non-identifying summary of winners for each quarter on a board (index and square), without exposing player IDs.
    -   `[x]` As a winner, I receive a private record of my win at `users/{uid}/wins/{boardId_period}` that I can view later.
    -   `[x]` As a winner, I only receive a payout after the game is FINAL; my wallet balance is credited and a `winnings` transaction is created.
    -   `[x]` As a user, my Transactions view shows entries as `entry` (type `entry_fee`), sweepstakes entries as `sweepstakes`, and payouts as `winnings`.
    -   `[x]` As a user, I receive notifications when quarter winners are assigned and when final winnings are paid.

-   **Technical Tasks:**
    -   `[x]` Cloud Function: `onDocumentUpdated('games/{gameId}')` detects Q1→Q2, Q2→Q3, Q3→Q4, and FINAL transitions and calls a shared helper to assign winners.
    -   `[x]` Helper: compute `winningIndex` from last-score digits via `home_numbers`/`away_numbers`; query `boards/{boardId}/squares` where `index == winningIndex`; write public summary to `boards/{boardId}/winners/{period}`; write private wins to `users/{uid}/wins/{boardId_period}`; set `board.winners.{period}.assigned=true` (idempotency); set `settlement.finalReady=true` on FINAL.
    -   `[x]` Cloud Function: final settlement processes boards with `settlement.finalReady && !settlement.finalPaid`, splits pot, writes `winnings` transactions, increments balances, and marks `finalPaid=true`.
    -   `[x]` Security rules: boards public read; `boards/*/squares/*` no read; `boards/*/winners/*` public read; `users/{uid}/wins/*` private to uid; transactions readable by owner (userID match).
    -   `[x]` Indexes: `transactions(userID asc, timestamp desc)`, `boards(gameID asc, status asc)`, `boards/{boardId}/squares(index asc)`.
    -   `[x]` UI: show quarter winners on board pages; ensure Transactions tabs include DEPOSIT, WITHDRAW, ENTRY, SWEEPSTAKES, WINNINGS; Wallet recent activity reflects normalized types.

---

## Epic 9: Enhanced Payment System (Rivaling Gambling Apps)

-   **User Stories:**
    -   `[ ]` As a user, I can deposit funds using multiple payment processors (Stripe + PayPal) for better reliability.
    -   `[ ]` As a user, I can use quick deposit buttons for common amounts ($10, $25, $50, $100, $250, $500).
    -   `[ ]` As a user, I can save multiple payment methods for faster future transactions.
    -   `[ ]` As a user, I can withdraw funds with faster processing times (1-2 business days vs. current 3+ days).
    -   `[ ]` As a user, I can enjoy a mobile-optimized payment experience with touch-friendly interfaces.
    -   `[ ]` As a user, I can see real-time payment status updates and notifications.
    -   `[ ]` As a user, I can benefit from advanced fraud protection that keeps my account secure.

-   **Technical Tasks:**
    -   `[ ]` Install and configure Stripe dependencies (`@stripe/stripe-js`, `@stripe/react-stripe-js`, `stripe`).
    -   `[ ]` Create Stripe payment service with latest API version (2025-03-31.basil).
    -   `[ ]` Implement smart payment router that chooses optimal processor based on success rates, payment method, and amount.
    -   `[ ]` Create enhanced payment components with mobile-first design (Payment Elements, quick deposit panels).
    -   `[ ]` Integrate Stripe Radar for advanced fraud detection and risk assessment.
    -   `[ ]` Implement dual-processor fallback system for automatic failover between Stripe and PayPal.
    -   `[ ]` Add payment method management system for saving and managing multiple payment options.
    -   `[ ]` Create enhanced withdrawal system with faster processing via Stripe payouts.
    -   `[ ]` Implement comprehensive compliance tracking for sweepstakes requirements (free entry monitoring).
    -   `[ ]` Add payment analytics dashboard for monitoring success rates and user behavior.

-   **Success Metrics:**
    -   **Deposit Success Rate**: Target >98% (vs. DraftKings ~95%)
    -   **Withdrawal Speed**: Target <24 hours (vs. industry ~2-3 days)
    -   **Mobile Conversion**: Target >75% (vs. industry ~65%)
    -   **Transaction Volume**: 25% increase
    -   **User Retention**: 20% improvement
    -   **Support Tickets**: 40% reduction

-   **Implementation Phases:**
    -   **Phase 1: Foundation (Weeks 1-2)**: Stripe integration, basic dual-processor setup
    -   **Phase 2: Enhanced UX (Weeks 3-4)**: Payment Elements, quick deposit panels, mobile optimization
    -   **Phase 3: Advanced Features (Weeks 5-6)**: Fraud detection, smart routing, compliance automation
    -   **Phase 4: Optimization (Weeks 7-8)**: Performance tuning, A/B testing, final deployment

---

## Epic 10: Future Enhancements & Scalability

-   **User Stories:**
    -   `[ ]` As a user, I can use cryptocurrency payments (Bitcoin, Ethereum) for deposits.
    -   `[ ]` As a user, I can participate in international sweepstakes with multi-currency support.
    -   `[ ]` As a user, I can use voice-activated payment commands for hands-free transactions.
    -   `[ ]` As a user, I can benefit from AI-powered fraud detection that learns from transaction patterns.

-   **Technical Tasks:**
    -   `[ ]` Research and implement cryptocurrency payment integration.
    -   `[ ]` Design multi-currency and international expansion architecture.
    -   `[ ]` Develop voice payment interface with speech recognition.
    -   `[ ]` Implement machine learning models for fraud detection and risk assessment.

---

## Conclusion

This roadmap represents the comprehensive development plan for SquarePicks, from core functionality through advanced payment systems and future enhancements. Each epic builds upon the previous ones, ensuring a solid foundation while progressively enhancing the user experience to rival industry-leading platforms.

The enhanced payment system (Epic 9) represents a significant milestone that will position SquarePicks as a market leader in sweepstakes platforms, providing users with a professional payment experience that matches or exceeds industry standards while maintaining full compliance with sweepstakes regulations.