'use client'

import React, { useEffect, useRef, useState, PropsWithChildren } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { InfoNavbar } from './InfoNavbar';

export type InfoPageShellProps = PropsWithChildren<{
  canvasId?: string;
  showBackButton?: boolean;
  containerClassName?: string;
}>;

export default function InfoPageShell({
  canvasId,
  showBackButton = true,
  containerClassName,
  children,
}: InfoPageShellProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!isMounted || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!(ctx instanceof CanvasRenderingContext2D)) return;

    let animationFrameId: number;
    const stars: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      twinkleSpeed: number;
      twinkleDirection: number;
    }> = [];
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
      stars.forEach((star) => {
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
      <canvas ref={canvasRef} className="fixed inset-0 -z-1 pointer-events-none" id={canvasId} />
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
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="text-accent-1 hover:text-accent-2 transition-colors duration-200 py-2 px-4 rounded-md border border-accent-1 hover:border-accent-2"
            >
              Back
            </button>
          )}
        </nav>

        <section className={`py-12 relative ${containerClassName ?? ''}`}>
          <div 
            className="absolute inset-0 opacity-65 bg-gradient-to-b from-[rgb(var(--color-background-primary))] via-[rgb(var(--color-background-secondary))] via-15% to-[rgb(var(--color-background-secondary))] backdrop-blur-sm rounded-lg border border-white/10 shadow-xl -z-10"
            style={{
              boxShadow: `
                0 0 0 1px rgba(255, 255, 255, 0.1),
                0 4px 12px -2px rgba(0, 0, 0, 0.4),
                0 0 40px -10px rgba(88, 85, 228, 0.15)
              `
            }}
          />
          <div className="relative z-0">
            <InfoNavbar />
            <div className="p-6 md:p-10 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {children}
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-gray-800">
          <div className="flex flex-col items-center justify-center text-center">
            <Image src="/brandkit/logos/sp-logo-icon-default-text-white.svg" alt="SquarePicks Logo" width={240} height={35} className="mb-4" />
            <div className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} SquarePicks. All rights reserved.
              <div className="mt-2">
                <Link href="/privacy" className="hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
                <span className="mx-2">|</span>
                <Link href="/terms" className="hover:text-white transition-colors duration-200">
                  Terms & Conditions
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
} 