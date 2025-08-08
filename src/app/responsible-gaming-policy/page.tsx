'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import InfoPageShell from '@/components/info/InfoPageShell';

// Content from RESPONSIBLE_GAMING.md
const responsibleGamingMarkdown = `
# SquarePicks Responsible Gaming Policy

**Last Updated:** 4/10/2025

SquarePicks LLC ("Company", "we", "us", or "our") is committed to providing a fun and entertaining sweepstakes experience while promoting responsible participation. We encourage our users to play within their means and view our contests as a form of entertainment, not a source of income.

This policy outlines our commitment and the tools available to help you manage your play responsibly.

## 1. Our Commitment

*   We strive to prevent underage participation and provide tools to help users control their play.
*   We believe participation should always be an enjoyable social and entertainment activity.
*   We provide resources for users who may need assistance with problematic play patterns.

## 2. Player Eligibility (Age & Location)

*   **Age Requirement:** Only individuals **21 years of age or older** are permitted to create an account and participate in SquarePicks contests. We employ verification methods to confirm age.
*   **Location Requirement:** Participation is restricted to users physically located in eligible US states where our sweepstakes are legally permitted. Geolocation technology is used to enforce this restriction.

## 3. Playing Responsibly

We encourage all users to play responsibly. Consider these tips:

*   **Play for Fun:** Treat SquarePicks as entertainment, not a way to make money.
*   **Set Limits:** Decide beforehand how much time and money you are comfortable spending.
*   **Know the Rules:** Understand how the sweepstakes work, including the odds and payout structures.
*   **Balance Activities:** Ensure participation doesn't interfere with your daily responsibilities, work, or social life.
*   **Recognize Warning Signs:** Be aware of signs that play may be becoming problematic, such as spending more time or money than intended, chasing losses, borrowing money to play, or neglecting responsibilities.

## 4. Tools to Help You Manage Your Play

SquarePicks provides the following tools, accessible through your **Profile** settings, to help you manage your participation effectively:

*   **Deposit Limits:** You can set voluntary limits on the amount of money you can deposit within a chosen time period (e.g., daily, weekly, monthly) that are stricter than our standard account limits.
*   **Entry Limits / Spend Limits:** You can set limits on the total amount you wish to spend on entry fees, or limit the number of paid entries you can make, within a specific time period (e.g., daily, weekly, monthly).
*   **Self-Exclusion:** If you feel you need to take a break from playing, you can activate a self-exclusion period. Options typically range from shorter cool-off periods (e.g., 6 months, 1 year) to longer durations, including permanent exclusion. During any active self-exclusion period, your account will be inaccessible for deposits or contest entries, and you will be removed from promotional communications.

## 5. Where to Find Help

If you or someone you know needs help or support regarding potential problematic play, confidential resources are available 24/7. We strongly encourage you to reach out to organizations such as:

*   **National Council on Problem Gambling (NCPG):**
    *   Website: \`https://www.ncpgambling.org\`
    *   Helpline: 1-800-522-4700 (Call or Text)
    *   Chat: \`ncpgambling.org/chat\`

Additional state-specific resources may also be available in your jurisdiction.

## 6. Parental Controls

We encourage parents to be aware of their children's online activities. If minors have access to devices where SquarePicks can be accessed, we recommend using parental control tools to block access to our Service.

## 7. Contact Us

If you have questions about our Responsible Gaming Policy or the tools available, please contact us at: contact@squarpicks.com

---
`;

export default function ResponsibleGamingPolicyPage() {
  return (
    <InfoPageShell canvasId="responsible-gaming-constellation-canvas">
      <div className="max-w-4xl mx-auto font-sans">
        <ReactMarkdown
          components={{
            h1: ({ ...props }) => (
              <h1 className="text-4xl font-semibold text-white mb-8 mt-4 text-shadow-glow" {...props} />
            ),
            h2: ({ ...props }) => (
              <h2 className="text-3xl font-semibold text-white mb-6 mt-8 text-shadow-glow" {...props} />
            ),
            h3: ({ ...props }) => (
              <h3 className="text-2xl font-semibold text-white mb-4 mt-6 text-shadow-glow" {...props} />
            ),
            p: ({ ...props }) => (
              <p className="text-lg text-gray-300 leading-relaxed mb-6" {...props} />
            ),
            ul: ({ ...props }) => (
              <ul className="list-disc list-outside pl-6 mb-6 space-y-2" {...props} />
            ),
            ol: ({ ...props }) => (
              <ol className="list-decimal list-outside pl-6 mb-6 space-y-2" {...props} />
            ),
            li: ({ ...props }) => (
              <li className="text-lg text-gray-300 marker:text-accent-1" {...props} />
            ),
            strong: ({ ...props }) => (
              <strong className="font-semibold text-white" {...props} />
            ),
            a: ({ ...props }) => (
              <a
                className="text-accent-1 hover:text-accent-2 transition-colors duration-200 no-underline hover:underline"
                {...props}
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
            hr: ({ ...props }) => <hr className="border-gray-700 my-8" {...props} />,
          }}
        >
          {responsibleGamingMarkdown}
        </ReactMarkdown>
      </div>
    </InfoPageShell>
  );
} 