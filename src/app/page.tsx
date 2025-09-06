'use client'

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import { FiSearch, FiGrid, FiShoppingCart, FiAward } from 'react-icons/fi'
import { LogoIcon } from "@/components/LogoIcon";
import { LogoWithText } from "@/components/LogoWithText";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [easterEggActivated, setEasterEggActivated] = useState(false);
  const [secretCode, setSecretCode] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const [highlightedCells, setHighlightedCells] = useState<number[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const lastSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const resizeTimerRef = useRef<any>(null);
  const drawNowRef = useRef<() => void>(() => {});

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Easter egg activation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret code is "squares"
      setSecretCode(prev => {
        const updated = [...prev, e.key.toLowerCase()];
        if (updated.length > 7) updated.shift();
        return updated;
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const code = secretCode.join('');
    if (code === 'squares') {
      setEasterEggActivated(true);
      setTimeout(() => setEasterEggActivated(false), 5000);
    }
  }, [secretCode]);
  
  // Generate random grid cell highlight
  useEffect(() => {
    if (isMounted) {
      const interval = setInterval(() => {
        const newHighlightedCells = Array.from({ length: 10 }).map(() => 
          Math.floor(Math.random() * 100)
        );
        setHighlightedCells(newHighlightedCells);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isMounted]);

  // Pointer position tracking
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDownRef = useRef(false);

  // Track pointer position for both desktop and mobile
  useEffect(() => {
    if (!isMounted) return;

    // Initialize pointer at center
    const initX = window.innerWidth * 0.5;
    const initY = window.innerHeight * 0.5;
    pointerRef.current = { x: initX, y: initY };
    setMousePosition({ x: initX, y: initY });

    const updatePointer = (clientX: number, clientY: number) => {
      pointerRef.current.x = clientX;
      pointerRef.current.y = clientY;
      setMousePosition({ x: clientX, y: clientY });
    };

    // Mouse events for desktop
    const handleMouseMove = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const handleMouseDown = (e: MouseEvent) => {
      pointerDownRef.current = true;
      updatePointer(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      pointerDownRef.current = false;
    };

    // Touch events for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        updatePointer(touch.clientX, touch.clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      pointerDownRef.current = true;
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        updatePointer(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      pointerDownRef.current = false;
    };

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMounted]);

  // Gesture binding for mobile scroll support
  const bind = useGesture(
    {
      onMove: ({ xy }) => {
        if (xy) {
          const [x, y] = xy;
          pointerRef.current = { x, y };
          setMousePosition({ x, y });
        }
      },
      onScroll: ({ xy }) => {
        if (xy) {
          const [x, y] = xy;
          pointerRef.current = { x, y };
          setMousePosition({ x, y });
        }
      }
    },
    {
      pointer: { touch: true, mouse: false },
      preventScroll: false,
      eventOptions: { passive: true }
    }
  );

  // Canvas Animation for Twinkling Stars with pointer-driven illumination/warp
  useEffect(() => {
    if (!isMounted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const stars: any[] = []; // Use 'any' for simplicity, define interface later if needed
    const numStars = 150; // Adjust density
    const starColor = "rgba(27, 176, 242, 1)"; // Base color (accent-1)
    const minOpacity = 0.1;
    const maxOpacity = 0.7;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let warpStrength = 0; // animated toward target
    let warpTarget = 0;
    const baseWarpOnHover = prefersReduced ? 0 : 0.5; // stronger by default
    const baseWarpOnPress = prefersReduced ? 0 : 0.85; // strong on press
    let paused = false;

    // Function to initialize or resize canvas and stars
    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.length = 0; // Clear existing stars on resize

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          baseX: 0, // set below
          baseY: 0,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
          twinkleSpeed: Math.random() * 0.008 + 0.003, // Slower, more gentle twinkling
          twinkleDirection: Math.random() < 0.5 ? 1 : -1, // Start increasing or decreasing
        });
      }

      // Cache base coordinates after creation so they remain stable on resize setup
      for (let i = 0; i < stars.length; i++) {
        stars[i].baseX = stars[i].x;
        stars[i].baseY = stars[i].y;
      }
      lastSizeRef.current = { w: canvas.width, h: canvas.height };
    };

    // Single-frame renderer used by rAF and scroll fallback
    const renderFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width * 0.5;
      const cy = canvas.height * 0.5;
      const px = pointerRef.current.x || cx;
      const py = pointerRef.current.y || cy;
      const radius = Math.min(canvas.width, canvas.height) * 0.35; // reduced influence radius

      // ease warp toward target - faster response for mobile
      warpTarget = pointerDownRef.current ? baseWarpOnPress : baseWarpOnHover;
      warpStrength += (warpTarget - warpStrength) * 0.12; // Increased from 0.08 for faster response

      stars.forEach(star => {
        // Update opacity
        star.opacity += star.twinkleSpeed * star.twinkleDirection;

        // Reverse direction if boundaries are reached
        if (star.opacity > maxOpacity || star.opacity < minOpacity) {
          star.twinkleDirection *= -1;
          // Clamp opacity to bounds to prevent overshoot
          star.opacity = Math.max(minOpacity, Math.min(maxOpacity, star.opacity));
        }

        // Illumination + warp
        const dx = star.baseX - px;
        const dy = star.baseY - py;
        const dist = Math.hypot(dx, dy);
        const intensity = Math.max(0, 1 - Math.min(dist / radius, 1)); // 0..1
        const warpFactor = warpStrength * (0.5 * intensity + 0.5 * intensity * intensity);
        // Pull toward pointer center, not screen center
        const drawX = star.baseX + (px - star.baseX) * warpFactor;
        const drawY = star.baseY + (py - star.baseY) * warpFactor;
        const glowOpacity = Math.min(1, star.opacity + intensity * 0.8);

        // Draw the star (square)
        ctx.fillStyle = `rgba(27, 176, 242, ${glowOpacity})`;
        ctx.fillRect(drawX, drawY, star.size, star.size);
      });

    };

    // Animation loop
    const animate = () => {
      renderFrame();
      animationFrameId = requestAnimationFrame(animate);
    };


    // Initial setup
    setup();

    // Start animation
    animate();
    drawNowRef.current = renderFrame;

    // Handle resize
    const handleResize = () => {
      // Debounce rapid resize events (mobile address bar)
      const doResize = () => {
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        const { w: oldW, h: oldH } = lastSizeRef.current;
        const widthChanged = Math.abs(newW - oldW) > 16;
        const heightChanged = Math.abs(newH - oldH) > 160; // ignore small URL-bar shifts
        canvas.width = newW;
        canvas.height = newH;
        if (widthChanged || heightChanged) {
          setup();
        } else {
          // Keep stars as-is for tiny viewport shifts to avoid flicker
          lastSizeRef.current = { w: newW, h: newH };
        }
      };
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(doResize, 200);
    };
    window.addEventListener('resize', handleResize);

    // Pause when tab is hidden
    const onVis = () => { paused = document.hidden; };
    document.addEventListener('visibilitychange', onVis);

    // Cleanup function with proper memory management
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVis);
      
      // Clear canvas and reset state
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      // Clear stars array to prevent memory leaks
      stars.length = 0;
      
      // Clear resize timer
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = null;
      }
    };

  }, [isMounted]); // Rerun effect if isMounted changes

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  // How to Play steps (enhanced)
  const howToPlaySteps = [
    {
      title: "Find a Board",
      content: "Open the Lobby, filter by sport or time, and pick a $1 board or a featured free board.",
      icon: FiSearch,
    },
    {
      title: "Know the Grid",
      content: "Each board is a 10×10 grid. Numbers 0–9 are randomly assigned to rows and columns once the board fills.",
      icon: FiGrid,
    },
    {
      title: "Pick Your Squares",
      content: "Tap any open square. Choose one or many; confirm your selection to lock it in.",
      icon: FiShoppingCart,
    },
    {
      title: "Win & Payouts",
      content: "If your row/column digits match the score at set intervals, you win. Winnings are added to your wallet.",
      icon: FiAward,
    },
  ];

  const handleNavClick = (href: string) => {
    try {
      setNavigatingTo(href);
      // Use window.location for better cross-browser compatibility
      if (typeof window !== 'undefined') {
        window.location.href = href;
      } else {
        router.push(href);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to router.push
      router.push(href);
    }
  };

  // Simple inline SVG Spinner component
  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Define pulse animation variant
  const pulseVariant = {
    pulsing: {
      scale: [1, 1.05, 1], // Keyframes for scale
      boxShadow: [ // Keyframes for boxShadow
        "0 0 10px rgba(0, 178, 255, 0.3)",
        "0 0 20px rgba(0, 178, 255, 0.7)",
        "0 0 10px rgba(0, 178, 255, 0.3)"
      ],
      transition: {
        duration: 2, // Total duration for one cycle
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
  };

  return (
    <div {...bind()} className="min-h-screen bg-background-primary text-white overflow-x-hidden relative">
      {/* Canvas for Twinkling Stars */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-1 pointer-events-none"
        id="constellation-canvas"
      />
      {/* Cursor Spotlight Effect (render after mount to avoid hydration mismatch) */}
      {isMounted && (
        <div
          className="pointer-events-none fixed inset-0 z-0 transition duration-300"
          style={{
            background: `radial-gradient(220px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
          }}
        />
      )}
      <main className="container mx-auto px-4 relative z-10">
        {/* Navigation */}
        <nav className="py-2 flex justify-end items-center relative z-20 pointer-events-auto">
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavClick('/login')}
              type="button"
              aria-label="Log In"
              className="px-6 py-2 rounded-md transition duration-300 flex items-center justify-center border border-accent-1 text-accent-1 hover:bg-accent-1/10"
            >
              Log In
            </motion.button>
            <motion.button
              whileHover={{ scale: navigatingTo === '/lobby' ? 1 : 1.05 }}
              whileTap={{ scale: navigatingTo === '/lobby' ? 1 : 0.95 }}
              className={`px-6 py-2 rounded-md text-white transition duration-300 flex items-center justify-center min-h-10 
                ${navigatingTo === '/lobby' 
                  ? 'bg-gradient-accent2-accent3 animate-pulse cursor-not-allowed' 
                  : 'bg-gradient-accent1-accent4 hover:bg-gradient-accent2-accent3'}`}
              onClick={() => handleNavClick('/lobby')}
              disabled={navigatingTo === '/lobby'}
              type="button"
            >
              View Lobby
            </motion.button>
          </div>
        </nav>
        
        {/* Hero Section - Minimal top padding */}
        <section className="pt-0 pb-16 md:pt-1 md:pb-20 flex flex-col items-center text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeIn} className="mb-0 -mt-12 flex justify-center">
              <LogoWithText size="xl" />
            </motion.div>
            
            <motion.h1 
              variants={fadeIn}
              className="text-4xl md:text-6xl font-bold mb-0 -mt-8"
            >
              <span className="text-white">
                Modern
              </span>
              {' '}
              <span className="bg-gradient-to-r from-accent-2 to-accent-3 bg-clip-text text-transparent">
                Sports Squares
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeIn}
              className="text-xl text-gray-300 mb-2 max-w-3xl mx-auto"
            >
              Where Every Square Has a Chance. Select squares on game boards, win when your numbers match the score, and earn real prizes in our modern sports squares platform.
            </motion.p>
            
            <motion.div 
              variants={fadeIn}
              className="flex flex-row gap-4 justify-center items-center"
            >
                          <motion.button
              whileHover={{ boxShadow: navigatingTo === '/signup/email' ? 'none' : "0 0 20px rgba(0, 178, 255, 0.5)", scale: navigatingTo === '/signup/email' ? 1 : 1.05 }}
              whileTap={{ scale: navigatingTo === '/signup/email' ? 1 : 0.95 }}
              className={`px-8 py-4 rounded-md text-white text-xl font-semibold transition-all duration-300 relative flex items-center justify-center 
                ${navigatingTo === '/signup/email' 
                  ? 'bg-gradient-accent2-accent3 animate-pulse cursor-not-allowed' 
                  : 'bg-gradient-accent1-accent4 hover:bg-gradient-accent2-accent3'}`}
              onClick={() => handleNavClick('/signup/email')}
              disabled={navigatingTo === '/signup/email'}
              type="button"
            >
              Get Started
            </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-md border border-gray-500 text-white hover:bg-white/5 transition-all duration-300 text-xl"
                onClick={() => {
                  try {
                    const element = document.getElementById('how-to-play');
                    if (element) {
                      // Use smooth scroll with fallback for Edge
                      if ('scrollBehavior' in document.documentElement.style) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        // Fallback for Edge
                        element.scrollIntoView();
                        window.scrollTo({
                          top: element.offsetTop - 100,
                          behavior: 'auto'
                        });
                      }
                    }
                  } catch (error) {
                    console.error('Scroll error:', error);
                    // Fallback scroll
                    const element = document.getElementById('how-to-play');
                    if (element) {
                      element.scrollIntoView();
                    }
                  }
                }}
              >
                How It Works
              </motion.button>
            </motion.div>
          </motion.div>
          
          {/* 3D Grid Visualization */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-4 relative w-full max-w-2xl mx-auto"
          >
            <div className="aspect-square max-w-md mx-auto relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-1/30 to-accent-3/30 p-1 animate-pulse-glow">
                <div ref={gridRef} className="relative h-full w-full bg-gray-900/80 rounded-lg overflow-hidden grid grid-cols-10 grid-rows-10 gap-px">
                  {/* Grid cells */}
                  {Array.from({ length: 100 }).map((_, index) => (
                    <div key={index} className="relative border border-gray-700/30">
                      {/* Empty cell content or placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600"></div>
                      
                      {/* Conditionally render highlight only AFTER mount */}
                      {isMounted && highlightedCells.includes(index) && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-accent-1/70 to-accent-2/70 rounded-sm flex items-center justify-center"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.5 }}
                          layout
                        >
                          <span className="font-mono font-bold text-sm text-white text-shadow-glow">
                            {index}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Explanatory labels */}
            <div className="absolute -bottom-2 -right-4 bg-gray-800/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-accent-1/30 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <span className="block w-3 h-3 bg-accent-1 rounded-full"></span>
                <span>Your winning square</span>
              </div>
            </div>
          </motion.div>
        </section>
        
        {/* How to Play Section */}
        <section id="how-to-play" className="py-2 -mt-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerChildren}
            className="max-w-5xl mx-auto"
          >
            <motion.h2 
              variants={fadeIn}
              className="text-3xl md:text-4xl font-bold mb-12 text-center"
            >
              <span className="bg-gradient-accent1-accent4 bg-clip-text text-transparent">
                How to Play
              </span>
            </motion.h2>
            
            {/* Responsive stepper/timeline */}
            <div className="relative max-w-5xl mx-auto">
              <div className="hidden md:block absolute left-0 right-0 top-6 h-0.5 bg-gradient-to-r from-accent-1/40 via-accent-2/40 to-accent-3/40" />
              <ol className="flex flex-col md:flex-row gap-8 md:gap-6">
                {howToPlaySteps.map((step, index) => {
                  const Icon = step.icon as React.ElementType;
                  return (
                    <motion.li
                      key={index}
                      variants={fadeIn}
                      className="relative md:flex-1"
                    >
                      <div className="flex md:flex-col items-start md:items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-accent1-accent4 text-white ring-2 ring-accent-1/40 shadow-lg">
                          <Icon size={20} />
                        </div>
                        <div className="md:text-center">
                          <div className="text-sm text-gray-400 mb-1">Step {index + 1}</div>
                          <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                          <p className="text-gray-300 leading-relaxed max-w-xs md:mx-auto">{step.content}</p>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
            </div>
            
            {/* Final step about payouts */}
            <motion.div
              variants={fadeIn}
              className="mt-8 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-accent2-accent3 flex items-center justify-center text-white font-bold">
                  $
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Payouts & Sweepstakes</h3>
                  <p className="text-gray-300">Each board has a total pot based on the entry fees, with winners receiving 20% of the pot for each defined period. The platform retains 20% as a fee. SquarePicks operates as a promotional sweepstakes with a weekly free entry opportunity on featured $1 boards.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>
        
        {/* Bottom container (CTA + Footer) */}
        <div className="mt-8 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-950/85">
          <section className="py-20">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.h2 
                variants={fadeIn}
                className="text-3xl md:text-4xl font-bold mb-6"
              >
                <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                  Ready to Join in on our
                </span>
                <span className="bg-gradient-accent1-accent4 bg-clip-text text-transparent">
                  {' '}Sports Entertainment?
                </span>
              </motion.h2>
              
              <motion.p 
                variants={fadeIn}
                className="text-xl text-gray-300 mb-10"
              >
                Sign up today and claim your free weekly sweepstakes square
              </motion.p>
              
              <motion.div 
                variants={fadeIn}
                className="flex flex-row gap-4 justify-center items-center"
              >
                <motion.button
                  whileHover={{ boxShadow: navigatingTo === '/signup/email' ? 'none' : "0 0 20px rgba(0, 178, 255, 0.5)", scale: navigatingTo === '/signup/email' ? 1 : 1.05 }}
                  whileTap={{ scale: navigatingTo === '/signup/email' ? 1 : 0.95 }}
                  className={`px-8 py-4 rounded-md text-white text-xl font-semibold transition-all duration-300 relative flex items-center justify-center 
                    ${navigatingTo === '/signup/email' 
                      ? 'bg-gradient-accent2-accent3 animate-pulse cursor-not-allowed' 
                      : 'bg-gradient-accent1-accent4 hover:bg-gradient-accent2-accent3'}`}
                  onClick={() => handleNavClick('/signup/email')}
                  disabled={navigatingTo === '/signup/email'}
                  type="button"
                >
                  Sign Up Now
                </motion.button>
              </motion.div>
            </motion.div>
          </section>

          {/* Divider above footer */}
          <div className="max-w-6xl mx-auto px-4">
            <div className="h-px bg-gray-800/80" />
          </div>
          
          {/* Footer */}
          <footer className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              {/* Footer links and logo in same row on mobile, stacked on larger screens */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-4">
                <LogoWithText size="md" />
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <a href="/faq" className="hover:text-white hover:underline">FAQ</a>
                  <a href="/terms" className="hover:text-white hover:underline">Terms</a>
                </div>
              </div>
              <div className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} SquarePicks. All rights reserved.
                {easterEggActivated && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gradient-accent1-accent4/90 text-white py-4 px-6 rounded-lg backdrop-blur-md z-50 shadow-2xl"
                  >
                    <p className="font-bold mb-1">🎮 Easter Egg Activated!</p>
                    <p>You've discovered the hidden secret! Click on the grid cells to reveal their final form.</p>
                  </motion.div>
                )}
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
// Force redeploy
