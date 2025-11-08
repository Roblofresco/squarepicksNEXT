# Knowledge: Informational Pages

## 1. Overview & Purpose

This category covers all static or semi-static content pages that provide information, legal policies, and support to the user. While they are not interactive in a gameplay sense, they are crucial for user support and legal compliance.

A key architectural pattern on these pages is that the **content is hardcoded as a Markdown string** directly within the page's `tsx` file. The page component then uses the `react-markdown` library to render this string into styled HTML.

## 2. Page-by-Page Breakdown

All pages in this category now share a common background shell:
- Wrapped by `InfoPageShell` which provides:
  - Pointer-tracked warp/glow starfield canvas
  - Radial spotlight overlay (220px radius)
  - Optional back button
- The page itself renders Markdown or JSX content inside.

### a. `/information-and-support/how-to-play`

-   **Content:** Contains a detailed, multi-step guide explaining how to find games, understand the board and number assignment, select squares, and track winnings.
-   **Source:** Renders the `howToPlayMarkdown` constant using `HowToPlayContent` component.

### b. `/information-and-support/faq` (Frequently Asked Questions)

-   **Content:** Provides answers to common questions regarding gameplay, legality, rules, and account verification.
-   **Source:** Renders the `faqMarkdown` constant using `MarkdownContent` component.

### c. `/information-and-support/terms` (Terms and Conditions)

-   **Content:** Displays the legal terms of service that govern the use of the application, with a strong emphasis on its operation as a legal sweepstakes.
-   **Source:** Renders the `termsMarkdown` constant using `MarkdownContent` component.

### d. `/information-and-support/privacy` (Privacy Policy)

-   **Content:** Outlines the policies regarding the collection, use, and disclosure of user data.
-   **Source:** Renders the `privacyMarkdown` constant using `MarkdownContent` component.

### e. `/information-and-support/responsible-gaming`

-   **Content:** Details the company's commitment to responsible play, including tools for setting limits and providing resources for help.
-   **Source:** Renders the `responsibleGamingMarkdown` constant using `MarkdownContent` component.

### f. `/information-and-support/account-guide`

-   **Content:** Explains how to manage account funds, including details on deposits, withdrawals, verification, and profile settings.
-   **Source:** Renders the `accountGuideMarkdown` constant using `MarkdownContent` component.

### g. `/contact-support`

-   **Content:** Provides a simple interface for users to get in touch with support, primarily via a `mailto:` link.
-   **Functionality:** Unlike the other pages, this one renders simple JSX for its content rather than a Markdown string, but follows the same overall layout and background effect pattern.

## 3. Background Implementation

The previous duplicated background logic has been centralized into `InfoPageShell` (located at `@/components/ui/info-page-shell`). Pages pass a `canvasId` for unique canvas instances and receive consistent visuals and performance behavior across desktop and mobile.

## 4. Navigation

All information pages include a consistent navigation bar (`InfoNavbar`) that provides links to:
- Home (`/information-and-support`)
- How to Play
- Account Guide
- FAQ
- Terms & Conditions
- Privacy Policy
- Responsible Gaming
- Contact Support

## 5. Contact Information

All pages consistently use `contact@squarepicks.com` as the support email address.

## 6. Component Usage

- Most pages use the `MarkdownContent` component to render markdown strings
- The How to Play page uses `HowToPlayContent` component which includes additional help card
- Contact Support page uses custom JSX instead of markdown
- All pages use `InfoPageShell` from `@/components/ui/info-page-shell` for consistent layout