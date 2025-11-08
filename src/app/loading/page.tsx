'use client'

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from "framer-motion"; // Import framer-motion

import { useRouter } from 'next/navigation'; // Import useRouter

// Removed StarfieldBackground import
// const StarfieldBackground = dynamic(() => import('@/components/starfield-background'), { ssr: false });

// Import the new consolidated LogoCube
const LogoCube = dynamic(() => import('@/components/LogoCube'), { ssr: false });

export default function LoadingPage() {
  const router = useRouter(); // Instantiate router
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);


  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const idleRotationRef = useRef({ x: 0, y: 0 });
  const idleSpeedRef = useRef({ x: 0.025, y: 0.035 });
  const canvasRef = useRef<HTMLCanvasElement>(null); // Stars canvas
  const [isMounted, setIsMounted] = useState(false); // Mount state
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDownRef = useRef(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const drawNowRef = useRef<() => void>(() => {});

  // Track if component is mounted to prevent operations after unmount
  const isMountedRef = useRef(true);

  // Added mount effect & navigation timer
  useEffect(() => {
    setIsMounted(true);
    isMountedRef.current = true;

    // 3.5-second timer for auto-navigation to lobby
    const autoNavigationTimer = setTimeout(() => {
      if (isMountedRef.current) {
        router.push('/lobby');
      }
    }, 3500); // 3.5 seconds

    // Cleanup function for auto-navigation timer
    return () => {
      isMountedRef.current = false;
      clearTimeout(autoNavigationTimer);
    };
  }, [router]); // Added router dependency

  // Force disable body scroll specifically for this page via inline styles
  useEffect(() => {
    if (isMounted) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      // Cleanup function to restore default scroll behavior
      return () => {
        document.body.style.overflow = ''; // Reset to default
        document.documentElement.style.overflow = ''; // Reset to default
      };
    }
  }, [isMounted]);

  // Pointer tracking for glow/warp effects
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
      if (drawNowRef.current) {
        drawNowRef.current();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
    };
    const handleMouseDown = (e: MouseEvent) => {
      pointerDownRef.current = true;
      updatePointer(e.clientX, e.clientY);
    };
    const handleMouseUp = () => { pointerDownRef.current = false; };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        updatePointer(t.clientX, t.clientY);
      }
    };
    const handleTouchStart = (e: TouchEvent) => {
      pointerDownRef.current = true;
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        updatePointer(t.clientX, t.clientY);
      }
    };
    const handleTouchEnd = () => { pointerDownRef.current = false; };

    const handleScroll = () => {
      if (drawNowRef.current) {
        drawNowRef.current();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMounted]);

  // Effect for pointer tracking (updates isInteracting)
  useEffect(() => {
    let lastUpdateTime = 0;
    const throttleDelay = 16; // ~60fps max update rate
    
    const handlePointerMove = (event: PointerEvent) => {
      const now = Date.now();
      
      // Throttle updates to prevent excessive state changes
      if (now - lastUpdateTime < throttleDelay) {
        return;
      }
      lastUpdateTime = now;
      
      setIsInteracting(true); // Interaction started

      // Calculate rotation based on pointer with reduced sensitivity
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      const targetX = (event.clientX - windowHalfX) / windowHalfX;
      const targetY = (event.clientY - windowHalfY) / windowHalfY;
      
      // Reduce sensitivity and apply smoothing
      const sensitivity = 0.7; // Reduce from 1.0 to 0.7 for smoother movement
      setRotation({ 
        x: targetY * sensitivity, 
        y: targetX * sensitivity 
      });

      // Debounce interaction end
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
      interactionTimeoutRef.current = setTimeout(() => {
        setIsInteracting(false); // Interaction stopped after 500ms delay
      }, 500);
    };

    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
      // Ensure animation frame is cancelled on unmount if pointer listener is removed
      if (animationFrameRef.current) {
         cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []); // Empty dependency array



  // Effect for idle animation loop and cancellation
  useEffect(() => {
    console.log('[Idle Effect] Running. isInteracting:', isInteracting, 'isMounted:', isMounted);

    const animateIdle = () => {
      if (isInteracting || !isMounted) {
        console.log('[animateIdle] Stopping: Interacting or Unmounted.');
        animationFrameRef.current = null;
        return;
      }

      // Slower, smoother idle rotation
      const speedX = 0.005; // Reduced from 0.010 for smoother movement
      const speedY = 0.007; // Reduced from 0.015 for smoother movement

      idleRotationRef.current.x += speedX;
      idleRotationRef.current.y += speedY;

      // Only update rotation state every few frames to reduce gittery updates
      if (Math.abs(idleRotationRef.current.x - rotation.x) > 0.01 || 
          Math.abs(idleRotationRef.current.y - rotation.y) > 0.01) {
        setRotation({ x: idleRotationRef.current.x, y: idleRotationRef.current.y });
      }

      // Request next frame with reduced frequency for smoother idle animation
      animationFrameRef.current = requestAnimationFrame(animateIdle);
    };

    if (!isInteracting && isMounted) {
      console.log('[Idle Effect] Starting Animation Loop.');
      // Sync starting point ONLY when idle starts
      idleRotationRef.current = { ...rotation }; // Sync with current rotation

      // Start the animation loop only if it's not already running
      if (animationFrameRef.current === null) {
           animationFrameRef.current = requestAnimationFrame(animateIdle);
      }
    } else {
      // Explicitly cancel if interacting or unmounted
      if (animationFrameRef.current !== null) {
          console.log('[Idle Effect] Cancelling Animation Frame.');
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null; // Ensure ref is cleared
      }
    }

    // Cleanup function
    return () => {
        if (animationFrameRef.current !== null) {
            console.log('[Idle Effect] Cleanup: Cancelling Animation Frame.');
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null; // Ensure ref is cleared
        }
    };
}, [isInteracting, isMounted, rotation.x, rotation.y]);

  // Canvas Animation for Forward Movement Starfield + pointer glow/warp
  useEffect(() => {
    if (!isMounted || !canvasRef.current || !isMountedRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!(ctx instanceof CanvasRenderingContext2D)) return;

    let animationFrameId: number;
    const stars: Array<{ x: number; y: number; angle: number; speed: number; size: number; opacity: number; dist: number; }> = [];
    const numStars = 120; // Further reduced for better performance on first-time login
    const baseSpeedFactor = 0.003; // Slightly slower for smoother movement
    const baseSpeedOffset = 0.03; // Minimum outward speed
    const maxSpeedPxPerFrame = 2.0; // Reduced clamp for smoother animation
    let canvasCenterX = window.innerWidth / 2;
    let canvasCenterY = window.innerHeight / 2;
    // Warp parameters (match home/info)
    const minOpacity = 0.1;
    const maxOpacity = 0.7;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let warpStrength = 0;
    let warpTarget = 0;
    const baseWarpOnHover = prefersReduced ? 0 : 0.5;
    const baseWarpOnPress = prefersReduced ? 0 : 0.85;
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    // Function to initialize or reset stars
    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvasCenterX = canvas.width / 2;
      canvasCenterY = canvas.height / 2;
      stars.length = 0; // Clear existing stars

      for (let i = 0; i < numStars; i++) {
         // Start stars randomly distributed
        const initialX = Math.random() * canvas.width;
        const initialY = Math.random() * canvas.height;
        const dx = initialX - canvasCenterX;
        const dy = initialY - canvasCenterY;
        const angle = Math.atan2(dy, dx); // Angle from center
        const dist = Math.sqrt(dx * dx + dy * dy); // Distance from center
        
        const initial = {
          x: initialX,
          y: initialY,
          angle: angle,
          speed: Math.min(maxSpeedPxPerFrame, dist * baseSpeedFactor + baseSpeedOffset),
          size: Math.random() * 2.0 + 1.0, // Increased size range
          opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity, // Random opacity in bounds
          dist: dist,
        };
        stars.push(initial);
      }
      // Sort stars by distance initially (optional, for drawing order)
      // stars.sort((a, b) => a.dist - b.dist);
    };

    // Single-frame renderer
    const renderFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pointer-based glow/warp
      const cx = canvas.width * 0.5;
      const cy = canvas.height * 0.5;
      const px = pointerRef.current.x || cx;
      const py = pointerRef.current.y || cy;
      const radius = Math.min(canvas.width, canvas.height) * 0.35;

      warpTarget = pointerDownRef.current ? baseWarpOnPress : baseWarpOnHover;
      warpStrength += (warpTarget - warpStrength) * 0.12;

      stars.forEach((star, index) => {
        // Move star outwards along its angle
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        
        // Update distance and speed
        const dx = star.x - canvasCenterX;
        const dy = star.y - canvasCenterY;
        star.dist = Math.sqrt(dx*dx + dy*dy);
        star.speed = Math.min(maxSpeedPxPerFrame, star.dist * baseSpeedFactor + baseSpeedOffset);
        star.angle = Math.atan2(dy, dx); // Keep angle updated based on position
        
        // Optional: Increase size slightly as it moves out?
        // star.size += 0.01;

        // Check if star is off-screen
        const isOffScreen = star.x < -star.size || star.x > canvas.width + star.size || star.y < -star.size || star.y > canvas.height + star.size;

        if (isOffScreen) {
          // Reset within a square area around the center
          const squareSize = 100; // Size of the square reset area (e.g., 100x100)
          const resetX = canvasCenterX + (Math.random() * squareSize - squareSize / 2);
          const resetY = canvasCenterY + (Math.random() * squareSize - squareSize / 2);
          
          // Recalculate properties based on new position
          const newDx = resetX - canvasCenterX;
          const newDy = resetY - canvasCenterY;
          const newAngle = Math.atan2(newDy, newDx);
          const newDist = Math.sqrt(newDx * newDx + newDy * newDy);
          
          const replacement = {
            x: resetX,
            y: resetY,
            angle: newAngle, 
            speed: Math.min(maxSpeedPxPerFrame, newDist * baseSpeedFactor + baseSpeedOffset),
            size: Math.random() * 2.0 + 1.0, // Increased size range
            opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity, // Reset opacity
            dist: newDist, // Reset distance
          };
          stars[index] = replacement;
        } else {
          // Glow/warp toward pointer when nearby
          const pdx = star.x - px;
          const pdy = star.y - py;
          const pdist = Math.hypot(pdx, pdy);
          const intensity = Math.max(0, 1 - Math.min(pdist / radius, 1));
          const warpFactor = warpStrength * (0.5 * intensity + 0.5 * intensity * intensity);
          const drawX = star.x + (px - star.x) * warpFactor;
          const drawY = star.y + (py - star.y) * warpFactor;
          const glowOpacity = Math.min(1, star.opacity + intensity * 0.8);

          ctx.fillStyle = `rgba(27, 176, 242, ${glowOpacity})`;
          ctx.fillRect(drawX - star.size / 2, drawY - star.size / 2, star.size, star.size);
        }

      });
    };

    const animate = (currentTime: number) => {
      // Stop if component unmounted
      if (!isMountedRef.current) {
        cancelAnimationFrame(animationFrameId);
        return;
      }

      // Frame rate limiting for smoother animation and reduced CPU usage
      const elapsed = currentTime - lastFrameTime;
      
      if (elapsed > frameInterval) {
        lastFrameTime = currentTime - (elapsed % frameInterval);
        try {
          renderFrame();
        } catch (error) {
          console.error("Canvas render error:", error);
          // Stop animation on error to prevent crashes
          cancelAnimationFrame(animationFrameId);
          return;
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    setup(); 
    animate(0);
    drawNowRef.current = renderFrame;

    const handleResize = () => setup();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };

  }, [isMounted]);

  // Click handler for navigation (kept for immediate navigation if user wants to skip)
  const handleNavigationClick = () => {
      router.push('/lobby');
  };

  return (
    // Add onClick handler to main element
    <main
      className="relative w-full h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-background-primary cursor-pointer" // Added cursor-pointer
      onClick={handleNavigationClick}
    >
      {/* Changed canvas z-index */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 -z-1 pointer-events-none" // Use z-index: -1
        id="center-starfield-canvas"
      />
      {/* Cursor/touch spotlight overlay */}
      {isMounted && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition duration-300"
          style={{
            background: `radial-gradient(220px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
          }}
        />
      )}
      {/* LogoCube container - Control size here */}
      <div 
        style={{
          height: '6rem', 
          width: '6rem', 
          '--cube-size': '6rem'
        } as React.CSSProperties}
        className="relative z-10 pointer-events-none" // Added z-index and kept relative/pointer-events
      >
        {/* Removed size className from LogoCube */}
        <LogoCube 
          rotationX={rotation.x} 
          rotationY={rotation.y} 
        />


      </div>
      {/* Display dynamic loading text */}
      <p className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-gray-400 text-base animate-pulse z-10 pointer-events-none">
        Redirecting to lobby...
      </p>
    </main>
  );
} 