'use client'

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from "framer-motion"; // Import framer-motion
import { FaHandPointRight } from "react-icons/fa"; // Use right-pointing finger
import { FiRefreshCcw } from "react-icons/fi";   // Curved arrow
import { useRouter } from 'next/navigation'; // Import useRouter

// Removed StarfieldBackground import
// const StarfieldBackground = dynamic(() => import('@/components/starfield-background'), { ssr: false });

// Import the new consolidated LogoCube
const LogoCube = dynamic(() => import('@/components/LogoCube'), { ssr: false });

export default function LoadingPage() {
  const router = useRouter(); // Instantiate router
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [showHint, setShowHint] = useState(false); // State for hint visibility after delay

  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null); // Ref for hint delay timer
  const animationFrameRef = useRef<number | null>(null);
  const idleRotationRef = useRef({ x: 0, y: 0 });
  const idleSpeedRef = useRef({ x: 0.025, y: 0.035 });
  const canvasRef = useRef<HTMLCanvasElement>(null); // Added canvas ref
  const [isMounted, setIsMounted] = useState(false); // Added isMounted state

  // Added mount effect & navigation timer
  useEffect(() => {
    setIsMounted(true);

    // 3.5-second timer for auto-navigation to lobby
    const autoNavigationTimer = setTimeout(() => {
      router.push('/lobby');
    }, 3500); // 3.5 seconds

    // Cleanup function for auto-navigation timer
    return () => clearTimeout(autoNavigationTimer);
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

  // Effect for showing/hiding hint based on interaction delay
  useEffect(() => {
    if (isInteracting) {
      // If interaction starts, clear any pending hint timer and hide hint
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
      setShowHint(false);
    } else {
      // If interaction stops, start timer to show hint after 3 seconds
      // Clear previous timer just in case
       if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
      hintTimerRef.current = setTimeout(() => {
        // Only show hint if still not interacting after 3 seconds
        // We also check isMounted to avoid state update on unmounted component
        if (!isInteracting && isMounted) {
            setShowHint(true);
        }
      }, 3000); // 3 seconds delay
    }

    // Cleanup: clear timer if component unmounts or isInteracting changes again
    return () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
    };
  }, [isInteracting, isMounted]); // Add isMounted dependency

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

  // Canvas Animation for Forward Movement Starfield
  useEffect(() => {
    if (!isMounted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!(ctx instanceof CanvasRenderingContext2D)) return;

    let animationFrameId: number;
    const stars: Array<{ x: number; y: number; angle: number; speed: number; size: number; opacity: number; dist: number; }> = [];
    const numStars = 400; // Density
    const baseSpeedFactor = 0.01; // Controls how much distance affects speed
    let canvasCenterX = window.innerWidth / 2;
    let canvasCenterY = window.innerHeight / 2;

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
        
        stars.push({
          x: initialX,
          y: initialY,
          angle: angle,
          speed: dist * baseSpeedFactor + 0.1, // Speed increases with distance
          size: Math.random() * 2.0 + 1.0, // Increased size range
          opacity: Math.random() * 0.5 + 0.2, // Random opacity
          dist: dist,
        });
      }
      // Sort stars by distance initially (optional, for drawing order)
      // stars.sort((a, b) => a.dist - b.dist);
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star, index) => {
        // Move star outwards along its angle
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        
        // Update distance and speed
        const dx = star.x - canvasCenterX;
        const dy = star.y - canvasCenterY;
        star.dist = Math.sqrt(dx*dx + dy*dy);
        star.speed = star.dist * baseSpeedFactor + 0.1;
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
          
          stars[index] = {
            x: resetX,
            y: resetY,
            angle: newAngle, 
            speed: newDist * baseSpeedFactor + 0.1, // Recalculate speed
            size: Math.random() * 2.0 + 1.0, // Increased size range
            opacity: Math.random() * 0.5 + 0.2, // Reset opacity
            dist: newDist, // Reset distance
          };
        } else {
          // Draw the star if it's on screen
          ctx.fillStyle = `rgba(27, 176, 242, ${star.opacity})`; 
          ctx.fillRect(star.x - star.size / 2, star.y - star.size / 2, star.size, star.size);
        }

      });
      
      // Optional: Re-sort stars by distance for correct drawing order (farthest first)
      // stars.sort((a, b) => a.dist - b.dist); 

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

        {/* Render hint only when showHint is true (and still not interacting) */}
        {!isInteracting && showHint && (
          <motion.div
            // Positioned vertically centered, to the left of the parent cube container
            // Added md:hidden to hide on medium screens and up
            className="absolute top-1/2 -translate-y-1/2 right-full mr-4 flex md:hidden flex-row items-center space-x-2 text-white/70 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Finger Icon */}
            <motion.div
              animate={{ x: [0, 3, 0] }} 
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <FaHandPointRight size={26} />
            </motion.div>
            {/* Arrow Icon */}
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }} 
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="mt-1"
            >
              <FiRefreshCcw size={24} />
            </motion.div>
          </motion.div>
        )}
      </div>
      {/* Display dynamic loading text */}
      <p className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-gray-400 text-base animate-pulse z-10 pointer-events-none">
        Redirecting to lobby...
      </p>
    </main>
  );
} 