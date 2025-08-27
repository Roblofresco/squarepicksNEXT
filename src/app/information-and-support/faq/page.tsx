import InfoPageShell from '@/components/ui/info-page-shell'
import { MarkdownContent } from '@/components/info/markdown-content'

const faqMarkdown = `
# SquarePicks FAQ (Frequently Asked Questions)

Here are answers to some common questions about SquarePicks.

**General**

*   **What is SquarePicks?**
    SquarePicks is a fun way to engage with your favorite sports! It operates as a sweepstakes where you can enter contests based on real-world game scores. Pick squares on a 10x10 grid and win if your square's assigned numbers match the score digits at key moments in the game.

*   **Is SquarePicks considered gambling?**
    No. SquarePicks operates strictly as a legal promotional sweepstakes, not gambling or a lottery. **All games hosted within the app are promotional sweepstakes. Winners are determined by random chance. No purchase is necessary to participate, and a free alternative method of entry is always available. All participants, regardless of entry method, receive equal opportunity to win. These games are not lotteries, gambling, or games of skill.**

*   **Where is SquarePicks legal to play?**
    SquarePicks contests are available to eligible residents (21+ years of age) physically located in specific US states where sweepstakes like ours are permitted by law. Please refer to our Terms & Conditions for the most up-to-date list of eligible locations. Contests are void where prohibited. The app automatically checks your location before allowing entry to ensure compliance.

**Gameplay & Rules**

*   **How are the winning numbers (0-9) for the grid chosen?**
    The numbers are assigned completely randomly but only *after* a paid board is full (all 100 squares sold) or the free weekly sweepstakes board closes when the game starts. The system randomly assigns numbers 0-9 to the columns (X-axis) and then separately randomly assigns 0-9 to the rows (Y-axis). This ensures the number assignment is fair and unpredictable before the board closes.

*   **What happens if a scheduled game gets canceled or postponed?**
    If a real-world sporting event associated with a SquarePicks board is officially canceled, all entries for *all* related boards (paid and free entry) will typically be voided, and any paid entry fees will be refunded to users' account balances. If a game is significantly postponed, we will follow official league rulings and communicate how associated boards will be handled (e.g., voided or rescheduled). Check the specific board rules or app notifications for details in such cases.

*   **How are prizes distributed?**
    Prizes are determined by the board's total pot (Entry Fee x 100 Squares). For standard boards, there are four winners, each receiving 20% of the total pot based on the scores at the end of Q1, Halftime, Q3, and the Final Score. The specific payout amounts for each winning period are displayed on the board details page. Winnings are credited directly to your SquarePicks account balance.

*   **Can I win more than once on a board?**
    Yes, absolutely! The same square can win multiple periods (e.g., halftime and final score) if the score digits happen to match at different points in the game. Each winning period earns a separate prize payout (20% of the total pot for that board).

**Account & Verification**

*   **Why do I need to verify my identity and provide my SSN?**
    Identity verification and SSN collection (before withdrawal) are required by law and regulations governing sweepstakes, payment processing, and tax reporting. This helps us ensure users meet eligibility requirements (age, location), prevent fraud, and comply with legal obligations like issuing tax forms (1099-MISC) for net winnings over $600 per year. Your information is handled securely according to our Privacy Policy.

*   **Is my personal information safe?**
    Yes. SquarePicks uses industry-standard encryption and secure data practices to protect all user information. We do not sell or share your personal information with third parties except as required by law or to facilitate payments and identity verification.

*   **Can I play for free?**
    Yes. Each user is eligible for one free entry per weekly sweepstakes through the designated AMOE (Alternative Method of Entry). You can find this option within the app. Free entries have the same odds of winning as paid entries.

---
`

export default function FAQPage() {
  return (
    <InfoPageShell canvasId="faq-constellation-canvas">
      <MarkdownContent content={faqMarkdown} />
    </InfoPageShell>
  )
}