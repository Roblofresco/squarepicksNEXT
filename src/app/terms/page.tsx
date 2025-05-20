'use client'

import React, { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

// Content from TERMS.md
const termsMarkdown = `# Terms and Conditions for SquarePicks

**Last Updated:** 4/10/2025

**PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING THE SQUAREPICKS APPLICATION.**

**IMPORTANT NOTICE:** SquarePicks operates as a sweepstakes. No purchase is necessary to enter or win. A purchase will not increase your chances of winning. Void where prohibited.

**Sweepstakes Nature:** All games hosted within the app are promotional sweepstakes. Winners are determined by random chance. No purchase is necessary to participate, and a free alternative method of entry is always available. All participants, regardless of entry method, receive equal opportunity to win. These games are not lotteries, gambling, or games of skill.

These Terms and Conditions ("Terms") govern your access to and use of the SquarePicks website, mobile application, and related services (collectively, the "Service"), operated by SquarePicks LLC ("Company", "we", "us", or "our").

**By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy (/privacy). If you disagree with any part of the terms, then you may not access the Service.**

## 1. Eligibility

The Service is intended solely for users who are twenty-one (21) years of age or older. Any access to or use of the Service by anyone under 21 is expressly prohibited. By accessing or using the Service, you represent and warrant that you meet the eligibility requirements.

Participation is void where prohibited by law. The Company reserves the right to limit or restrict participation based on geographic or legal considerations at its sole discretion.

## 2. Sweepstakes Rules

Official rules for specific sweepstakes contests offered through the Service, including entry periods, prize descriptions, winner selection methods, and specific conditions, will be made available for each contest. The following general rules apply:

*   **No Purchase Necessary (Alternative Method of Entry - AMOE):** Eligible users may receive one (1) free entry per weekly period into the designated "Premium Game of the Week" $1 entry fee contest, subject to limitations outlined within the Service. To enter for free, users may access the designated AMOE section within the Service and follow the instructions to submit their free entry. Limit one free entry per person per weekly period. Free entries are treated the same as paid entries in terms of winning eligibility.
*   **Paid Entry:** Users may also enter contests by purchasing squares using funds within their account balance, where applicable.
*   **Winner Determination:** Winners are determined based on the official score of the corresponding real-world sporting event at predefined intervals (e.g., end of quarters, final score), according to the rules specified for each board.
*   **Prizes:** Prizes typically consist of a share of the total entry fees collected for a specific board (less any disclosed platform fee/rake) or a predetermined prize amount, as specified in the contest rules. Prize values will be credited to the winner's user account balance.
*   **Odds of Winning:** Odds of winning depend on the number of squares purchased/entered and the random assignment of numbers to the grid.
*   **Disqualification & Fraud:** We reserve the right to disqualify any participant who tampers with the entry process, violates the Terms, or engages in any conduct that is fraudulent, deceptive, or otherwise unlawful.

## 3. User Accounts

*   **Registration:** You must register for an account to use certain features of the Service. You agree to provide accurate, current, and complete information during the registration process.
*   **Account Security:** You are responsible for safeguarding your password and for any activities or actions under your account. You agree to notify us immediately of any unauthorized use of your account.
*   **User Conduct:** You agree not to use the Service for any unlawful purpose or in any way that interrupts, damages, or impairs the service.

## 4. Payments, Fees, and Account Balances

*   **Deposits:** You may be able to deposit funds into your account balance using approved payment methods.
*   **Entry Fees:** Purchasing squares will deduct the corresponding entry fee from your account balance.
*   **Payouts:** Winnings will be credited to your account balance.
*   **Withdrawals:** Procedures and limitations for withdrawing funds from your account balance will be specified within the Service.
*   **Platform Fee (Rake):** We may retain a percentage of the total entry fees from paid contests as a platform fee. This percentage will be disclosed.
*   **Taxes:** You are solely responsible for any taxes applicable to prizes you receive. Winners earning over $600 in net winnings in a calendar year may be required to submit a completed IRS Form W-9 before receiving further payouts. SquarePicks LLC will issue 1099 forms where legally required.

## 5. Intellectual Property

The Service and its original content, features, and functionality are and will remain the exclusive property of SquarePicks LLC and its licensors.

## 6. Disclaimers

The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, express or implied, regarding the operation or availability of the Service.

## 7. Limitation of Liability

In no event shall SquarePicks LLC, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the Service.

## 8. Governing Law

These Terms shall be governed and construed in accordance with the laws of the State of Wyoming, without regard to its conflict of law provisions.

Any disputes arising out of or in connection with these Terms shall be resolved through binding arbitration under the rules of the American Arbitration Association. By using the Service, you waive the right to participate in class actions or jury trials.

## 9. Changes to Terms

We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on the Service.

## 10. Contact Information

If you have any questions about these Terms, please contact us at: contact@squarpicks.com

---
`;

export default function TermsPage() {
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
      {/* Add background elements */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-1 pointer-events-none"
        id="terms-constellation-canvas"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 transition duration-300"
        style={{
          background: `radial-gradient(300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
        }}
      />
      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Simplified Header */}
        <nav className="py-6 flex justify-between items-center">
          <Link href="/" legacyBehavior>
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

        {/* Terms Content Area */}
        <section className="py-12 relative">
          {/* Background Element - increased opacity */}
          <div className="absolute inset-0 opacity-65 bg-gradient-to-b from-[rgb(var(--color-background-primary))] via-[rgb(var(--color-background-secondary))] via-15% to-[rgb(var(--color-background-secondary))] backdrop-blur-sm rounded-lg border border-gray-600/60 shadow-lg -z-10"></div>
          
          {/* Content Element - sits on top, no opacity */}
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
                {termsMarkdown}
              </ReactMarkdown>
            </div>
          </div>
        </section>

        {/* Footer */}
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
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}