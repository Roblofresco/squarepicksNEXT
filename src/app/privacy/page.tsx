'use client'

import React, { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
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

  // Define the constant INSIDE the component function scope
  const privacyMarkdown: string = `# Privacy Policy for SquarePicks

**Last Updated:** 4/10/2025

SquarePicks LLC ("Company", "we", "us", or "our") operates the SquarePicks application and related services (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.

We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.

## 1. Information Collection and Use

We collect several different types of information for various purposes to provide and improve our Service to you.

**Types of Data Collected:**

*   **Personal Data:** While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include, but is not limited to:
    *   Email address
    *   First name and last name
    *   Date of Birth (for eligibility verification)
    *   Username
    *   Usage Data
    *   Cookies Data
    *   Geolocation (to ensure compliance with state-specific eligibility rules)
    *   Government-issued ID (only if required for tax documentation)
*   **Usage Data:** We may also collect information on how the Service is accessed and used ("Usage Data"). This may include information such as your computer's Internet Protocol address (e.g., IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers, and other diagnostic data.
*   **Tracking & Cookies Data:** We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.

## 2. Use of Data

SquarePicks LLC uses the collected data for various purposes:

*   To provide and maintain the Service
*   To notify you about changes to our Service
*   To allow you to participate in interactive features of our Service when you choose to do so
*   To provide customer care and support
*   To provide analysis or valuable information so that we can improve the Service
*   To monitor the usage of the Service
*   To detect, prevent and address technical issues
*   To verify eligibility for sweepstakes entry and prize fulfillment
*   To process payments and manage account balances
*   To comply with tax reporting obligations (e.g., issuing 1099 forms)
*   To comply with applicable legal requirements and prevent fraudulent activity

## 3. Data Transfer

Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction.

We take reasonable steps to ensure that your data is treated securely and in accordance with this Privacy Policy.

## 4. Data Disclosure

**Legal Requirements:** SquarePicks LLC may disclose your Personal Data in the good faith belief that such action is necessary to:

*   To comply with a legal obligation
*   To protect and defend the rights or property of SquarePicks LLC
*   To prevent or investigate possible wrongdoing in connection with the Service
*   To protect the personal safety of users of the Service or the public
*   To protect against legal liability

## 5. Data Security

The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.

We employ encryption, access control protocols, and regular monitoring to safeguard your information.

## 6. Service Providers

We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), provide the Service on our behalf, perform Service-related services, or assist us in analyzing how our Service is used. (e.g., Payment Processors, Analytics Providers, Cloud Hosting). These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.

## 7. Links to Other Sites

Our Service may contain links to other sites that are not operated by us. If you click a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We are not responsible for the content, privacy policies, or practices of any third-party sites or services.

## 8. Children's Privacy

Our Service does not address anyone under the age of 21 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 21. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.

## 9. Your Data Protection Rights

Depending on your location, you may have certain data protection rights, such as:

*   The right to access, update, or delete the information we have on you
*   The right of rectification
*   The right to object
*   The right of restriction
*   The right to data portability
*   The right to withdraw consent

To exercise these rights, please contact us using the details provided below.

## 10. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. Changes are effective when they are posted.

## 11. Contact Us

If you have any questions about this Privacy Policy or wish to exercise any of your data protection rights, please contact us at: contact@squarpicks.com

---
`;

  return (
    <div className="min-h-screen bg-background-primary text-white relative">
      {/* Add background elements */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-1 pointer-events-none"
        id="privacy-constellation-canvas"
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

        {/* Privacy Content Area */}
        <section className="py-12 relative">
          {/* Background Element */}
          <div className="absolute inset-0 opacity-85 bg-gradient-to-b from-[rgb(var(--color-background-primary))] via-[rgb(var(--color-background-secondary))] via-15% to-[rgb(var(--color-background-secondary))] backdrop-blur-sm rounded-lg border border-gray-600/60 shadow-lg -z-10"></div>
          
          {/* Content Element */}
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
                {privacyMarkdown}
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
              {/* Updated footer links */}
              <div className="mt-2 space-x-4">
                <Link href="/terms" className="hover:text-white transition-colors duration-200">Terms of Use</Link>
                {/* Link to Privacy Policy (current page) can be omitted or styled differently */}
                {/* <span className="text-gray-500">Privacy Policy</span> */}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
} 