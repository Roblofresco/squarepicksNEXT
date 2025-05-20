'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

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
*   **Balance Activities:** Ensure participation doesn\'t interfere with your daily responsibilities, work, or social life.
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

We encourage parents to be aware of their children\'s online activities. If minors have access to devices where SquarePicks can be accessed, we recommend using parental control tools to block access to our Service.

## 7. Contact Us

If you have questions about our Responsible Gaming Policy or the tools available, please contact us at: contact@squarpicks.com

---
`;

export default function ResponsibleGamingPolicyPage() {
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

  // Canvas Animation for Twinkling Stars (same as TermsPage)
  useEffect(() => {
    if (!isMounted || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!(ctx instanceof CanvasRenderingContext2D)) return;

    let animationFrameId: number;
    const stars: Array<{ x: number; y: number; size: number; opacity: number; twinkleSpeed: number; twinkleDirection: number; }> = [];
    const numStars = 150;

    const setup = () => {
      if (!canvas) return;
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
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.opacity += star.twinkleSpeed * star.twinkleDirection;
        if (star.opacity > 0.7 || star.opacity < 0.1) {
          star.twinkleDirection *= -1;
          star.opacity = Math.max(0.1, Math.min(0.7, star.opacity));
        }
        ctx.fillStyle = `rgba(27, 176, 242, ${star.opacity})`; // Using accent-1 color for stars
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
        id="responsible-gaming-constellation-canvas"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 transition duration-300"
        style={{
          background: `radial-gradient(300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
        }}
      />
      <main className="container mx-auto px-4 py-12 relative z-10">
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
                  a: ({...props}) => <a className="text-accent-1 hover:text-accent-2 transition-colors duration-200 no-underline hover:underline" {...props} target="_blank" rel="noopener noreferrer" />,
                  hr: ({...props}) => <hr className="border-gray-700 my-8" {...props} />,
                }}
              >
                {responsibleGamingMarkdown}
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
                <span className="mx-2">|</span>
                <Link href="/terms" className="hover:text-white transition-colors duration-200">Terms & Conditions</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
} 