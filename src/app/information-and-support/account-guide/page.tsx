import InfoPageShell from '@/components/ui/info-page-shell'
import { MarkdownContent } from '@/components/info/markdown-content'

const accountGuideMarkdown = `
# SquarePicks Account Guide

This guide explains how to manage your account funds and profile settings.

**1. Funding Your Account (Deposits)**

Adding funds to your SquarePicks balance allows you to enter paid contests. Here's what you need to know about deposits:

*   **Eligibility:** You must be physically located in a US state where SquarePicks contests are legally offered and meet the age requirement (21+) outlined in our Terms & Conditions to deposit funds. Initial identity verification may be required before depositing or withdrawing.
*   **Payment Method (PayPal):** We currently process deposits exclusively through PayPal. When you choose to deposit:
    *   You'll be securely redirected to PayPal to complete the payment.
    *   You can typically use your PayPal balance, a linked bank account, or a debit/credit card processed securely via PayPal.
    *   **Important:** Deposits using prepaid gift cards are generally not accepted through PayPal for our service.
*   **Deposit Limits:** To promote responsible play, deposits are currently limited to $500 per user within any 24-hour period. We may adjust limits based on account history or regulatory requirements.
*   **Confirmation & Availability:** Successful PayPal transactions should reflect in your SquarePicks balance almost instantly. Please note that funds deposited via bank transfer (eCheck) through PayPal may take several business days to clear before they are fully available for entry or withdrawal, as per PayPal's processing times.
*   **Security:** Payments are handled entirely by PayPal's secure systems. SquarePicks LLC does not store your sensitive payment credentials like full card numbers or PayPal passwords.

**2. Withdrawing Your Winnings**

Ready to cash out? Here's how withdrawals work at SquarePicks:

*   **Verification Required:** Before your first withdrawal can be processed, you must complete our identity verification process and provide a valid Social Security Number (SSN) for compliance and tax reporting purposes. You will be guided through this secure process when you initiate your first withdrawal or via your Profile settings.
*   **Eligible Destination:** Withdrawals can only be sent back to a verified payment source that you previously used for a successful deposit and that is held in your name. Eligible destinations typically include:
    *   Your verified PayPal account.
    *   Your verified Venmo account (if used for deposit).
    *   An approved, verified US bank account (if used for deposit).
    *   A specific debit card (if used for deposit and eligible for payouts).
    *   *Note:* Withdrawals cannot be sent to credit cards or certain other deposit-only methods.
*   **Playthrough Requirement:** Funds deposited, as well as any promotional credits or bonuses received, must be used for contest entries (played through at least once) before associated winnings can be withdrawn. This policy helps prevent misuse of funds and promotions.
*   **Minimum Amount:** The minimum withdrawal request amount is **$10**.
*   **Frequency Limit:** Only **one withdrawal request can be processed per user within a 24-hour period.**
*   **Processing Schedule:** We typically batch-process approved withdrawal requests once daily around **2:00 PM ET**. Requests made after this time will generally be processed the next cycle. While we process promptly, initial withdrawals or those requiring additional review may take longer. The time for funds to appear in your destination account after processing depends on your payment provider.
*   **Taxes:** Winnings may be subject to taxes. If your net winnings (winnings minus entry fees) exceed $600 in a calendar year, SquarePicks LLC will issue a Form 1099-MISC using the verified SSN and information associated with your account.

**3. Managing Your Profile**

Keep your account information up-to-date for a smooth experience.

*   **Accessing Your Profile:** You can typically access your profile settings by tapping the profile icon in the bottom navigation bar or through a menu option.
*   **Information Displayed:** Your profile page shows key details like:
    *   Your Username
    *   Your registered Email Address
    *   Your Current Account Balance
    *   Transaction History (Deposits, Entries, Winnings, Withdrawals)
    *   Links to settings and support documents (like this guide, How to Play, Terms, Privacy Policy).
*   **Editable Information:** You may be able to update certain information directly within your profile settings, such as your username (if allowed/available) or potentially your password.
*   **Password Changes:** For security, follow the prompts within the app to securely change your password. Never share your password with anyone.
*   **Contact Information:** Ensure your registered email address is always current, as important notifications (like withdrawal confirmations, verification requests, tax forms) will be sent there.
*   **Verification Status:** Your profile may show the status of your identity verification if required for withdrawals.
*   **Responsible Gaming:** Look for responsible gaming tools or links within your profile, allowing you to set limits or request self-exclusion if needed.

---
`

export default function AccountGuidePage() {
  return (
    <InfoPageShell canvasId="account-guide-constellation-canvas">
      <MarkdownContent content={accountGuideMarkdown} />
    </InfoPageShell>
  )
}