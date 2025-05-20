'use client'

import React, { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

// Content from FAQ.md
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
*(More questions can be added here)*
`;

export default function FAQPage() {
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
        id="faq-constellation-canvas" // Unique ID for canvas
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
                  a: ({...props}) => <a className="text-accent-1 hover:text-accent-2 transition-colors duration-200 no-underline hover:underline" {...props} />,
                  hr: ({...props}) => <hr className="border-gray-700 my-8" {...props} />,
                }}
              >
                {faqMarkdown}
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