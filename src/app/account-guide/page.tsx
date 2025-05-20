'use client'

import React, { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

// Content from ACCOUNT_GUIDE.md
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
`;

export default function AccountGuidePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Canvas Animation for Twinkling Stars
  useEffect(() => {
    if (!isMounted || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!(ctx instanceof CanvasRenderingContext2D)) return;

    let animationFrameId: number;
    const stars: Array<{ x: number; y: number; size: number; opacity: number; twinkleSpeed: number; twinkleDirection: number; }> = [];
    const numStars = 150;

    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.6 + 0.1,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinkleDirection: Math.random() < 0.5 ? 1 : -1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.opacity += star.twinkleSpeed * star.twinkleDirection;
        if (star.opacity > 0.7 || star.opacity < 0.1) {
          star.twinkleDirection *= -1;
          star.opacity = Math.max(0.1, Math.min(0.7, star.opacity));
        }
        ctx.fillStyle = `rgba(27, 176, 242, ${star.opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    setup();
    animate();

    const handleResize = () => setup();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMounted]);

  return (
    <div className="min-h-screen bg-background-primary text-white relative">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-1 pointer-events-none"
        id="account-guide-constellation-canvas" // Unique ID for canvas
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 transition duration-300"
        style={{
          background: `radial-gradient(300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
        }}
      />

      <main className="container mx-auto px-4 py-12 relative z-10">
        <nav className="py-6 flex justify-between items-center">
          <Link href="/">
            <Image 
              src="/brandkit/logos/sp-logo-icon-default-text-white.svg" 
              alt="SquarePicks Logo"
              width={360} 
              height={53} 
              priority
            />
          </Link>
          <button 
            onClick={() => router.back()} 
            className="text-accent-1 hover:text-accent-2 transition-colors duration-200 py-2 px-4 rounded-md border border-accent-1 hover:border-accent-2"
          >
            Back
          </button>
        </nav>

        <section className="py-12 relative">
          <div className="absolute inset-0 opacity-65 bg-gradient-to-b from-[rgb(var(--color-background-primary))] via-[rgb(var(--color-background-secondary))] via-15% to-[rgb(var(--color-background-secondary))] backdrop-blur-sm rounded-lg border border-gray-600/60 shadow-lg -z-10"></div>
          
          <div className="relative z-0 p-6 md:p-10">
            <div className="max-w-4xl mx-auto font-sans">
              <ReactMarkdown
                components={{
                  h1: ({...props}) => <h1 className="text-4xl font-semibold text-white mb-8 mt-4 text-shadow-glow" {...props} />,
                  h2: ({...props}) => <h2 className="text-3xl font-semibold text-white mb-6 mt-8 text-shadow-glow" {...props} />,
                  h3: ({...props}) => <h3 className="text-2xl font-semibold text-white mb-4 mt-6 text-shadow-glow" {...props} />,
                  p: ({...props}) => <p className="text-lg text-gray-300 leading-relaxed mb-6" {...props} />,
                  ul: ({...props}) => <ul className="list-disc list-outside pl-6 mb-6 space-y-2" {...props} />,
                  ol: ({...props}) => <ol className="list-decimal list-outside pl-6 mb-6 space-y-2" {...props} />,
                  li: ({...props}) => <li className="text-lg text-gray-300 marker:text-accent-1" {...props} />,
                  strong: ({...props}) => <strong className="font-semibold text-white" {...props} />,
                  a: ({...props}) => <a className="text-accent-1 hover:text-accent-2 transition-colors duration-200 no-underline hover:underline" {...props} />,
                  hr: ({...props}) => <hr className="border-gray-700 my-8" {...props} />,
                }}
              >
                {accountGuideMarkdown}
              </ReactMarkdown>
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-gray-800">
          <div className="flex flex-col items-center justify-center text-center">
            <Image 
              src="/brandkit/logos/sp-logo-icon-default-text-white.svg" 
              alt="SquarePicks Logo" 
              width={240} 
              height={35} 
              className="mb-4"
            />
            <div className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} SquarePicks. All rights reserved.
              <div className="mt-2">
                <Link href="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
                {' | '}
                <Link href="/terms" className="hover:text-white transition-colors duration-200">Terms & Conditions</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
} 