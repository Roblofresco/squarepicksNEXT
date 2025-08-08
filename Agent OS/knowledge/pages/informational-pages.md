# Knowledge: Informational Pages

## 1. Overview & Purpose

This category covers all static or semi-static content pages that provide information, legal policies, and support to the user. While they are not interactive in a gameplay sense, they are crucial for user support and legal compliance.

A key architectural pattern on these pages is that the **content is hardcoded as a Markdown string** directly within the page's `tsx` file. The page component then uses the `react-markdown` library to render this string into styled HTML.

## 2. Page-by-Page Breakdown

All pages in this category share a very similar structure:
- A `useEffect` hook to handle a "twinkling stars" canvas background animation.
- A `useEffect` hook to track the mouse position for a radial gradient spotlight effect.
- A standard navigation header with a "Back" button.
- A standard footer.
- A main content section that renders a Markdown string.

### a. `/how-to-play`

-   **Content:** Contains a detailed, multi-step guide explaining how to find games, understand the board and number assignment, select squares, and track winnings.
-   **Source:** Renders the `howToPlayMarkdown` constant.

### b. `/faq` (Frequently Asked Questions)

-   **Content:** Provides answers to common questions regarding gameplay, legality, rules, and account verification.
-   **Source:** Renders the `faqMarkdown` constant.

### c. `/terms` (Terms and Conditions)

-   **Content:** Displays the legal terms of service that govern the use of the application, with a strong emphasis on its operation as a legal sweepstakes.
-   **Source:** Renders the `termsMarkdown` constant.

### d. `/privacy` (Privacy Policy)

-   **Content:** Outlines the policies regarding the collection, use, and disclosure of user data.
-   **Source:** Renders the `privacyMarkdown` constant.

### e. `/responsible-gaming-policy`

-   **Content:** Details the company's commitment to responsible play, including tools for setting limits and providing resources for help.
-   **Source:** Renders the `responsibleGamingMarkdown` constant.

### f. `/account-guide`

-   **Content:** Explains how to manage account funds, including details on deposits, withdrawals, verification, and profile settings.
-   **Source:** Renders the `accountGuideMarkdown` constant.

### g. `/contact-support`

-   **Content:** Provides a simple interface for users to get in touch with support, primarily via a `mailto:` link.
-   **Functionality:** Unlike the other pages, this one renders simple JSX for its content rather than a Markdown string, but follows the same overall layout and background effect pattern.

## 3. Identified Code Duplication & Refactoring Opportunity

A significant opportunity for code simplification exists across these pages. The `useEffect` hooks for the **twinkling stars canvas** and the **mouse-tracking spotlight effect** are duplicated in every single one of these files.

**Recommendation:** This background effect logic should be extracted into a reusable layout component or a higher-order component. These informational pages could then be wrapped by this new component to inherit the background effects, removing 50-100 lines of duplicated code from each file and centralizing the logic. 