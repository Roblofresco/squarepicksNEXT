'use client'

// Removed WelcomeBackground import
// import { WelcomeBackground } from '@/components/background' 
import Link from 'next/link'
import dynamic from 'next/dynamic'
// Added useRef
import { useState, useEffect, useRef } from 'react' 
import { FiUser, FiLock, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
// Firebase Imports
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoginForm } from "@/components/auth/LoginForm"

// Import the correct LogoCube component dynamically
const LogoCube = dynamic(() => import('@/components/LogoCube'), { ssr: false })

export default function LoginPage() {
  const router = useRouter();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  // --- Login State ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // ------------------
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Add navigatingTo state for header links
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  // Add state and refs needed for background effects from page.tsx
  const [isMounted, setIsMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDownRef = useRef(false);
  const drawNowRef = useRef<() => void>(() => {});

  useEffect(() => {
    setIsMounted(true); // Set mounted state
  }, []);

  // Pointer tracking (mouse + touch) with scroll redraw
  useEffect(() => {
    if (!isMounted) return;

    const initX = window.innerWidth * 0.5;
    const initY = window.innerHeight * 0.5;
    pointerRef.current = { x: initX, y: initY };
    setMousePosition({ x: initX, y: initY });

    const updatePointer = (clientX: number, clientY: number) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      const targetX = (clientX - windowHalfX) / windowHalfX;
      const targetY = (clientY - windowHalfY) / windowHalfY;
      setRotation({ x: targetY, y: targetX });

      pointerRef.current.x = clientX;
      pointerRef.current.y = clientY;
      setMousePosition({ x: clientX, y: clientY });
      if (drawNowRef.current) drawNowRef.current();
    };

    const onMouseMove = (e: MouseEvent) => updatePointer(e.clientX, e.clientY);
    const onMouseDown = (e: MouseEvent) => { pointerDownRef.current = true; updatePointer(e.clientX, e.clientY); };
    const onMouseUp = () => { pointerDownRef.current = false; };
    const onTouchMove = (e: TouchEvent) => { if (e.touches?.length) { const t = e.touches[0]; updatePointer(t.clientX, t.clientY); } };
    const onTouchStart = (e: TouchEvent) => { pointerDownRef.current = true; if (e.touches?.length) { const t = e.touches[0]; updatePointer(t.clientX, t.clientY); } };
    const onTouchEnd = () => { pointerDownRef.current = false; };
    const onScroll = () => { if (drawNowRef.current) drawNowRef.current(); };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('scroll', onScroll);
    };
  }, [isMounted]);

  // Canvas Animation with pointer-driven illumination/warp (match home)
  useEffect(() => {
    if (!isMounted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const stars: any[] = [];
    const numStars = 150;
    const minOpacity = 0.1;
    const maxOpacity = 0.7;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let warpStrength = 0;
    let warpTarget = 0;
    const baseWarpOnHover = prefersReduced ? 0 : 0.5;
    const baseWarpOnPress = prefersReduced ? 0 : 0.85;

    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          baseX: 0,
          baseY: 0,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
          twinkleSpeed: Math.random() * 0.008 + 0.003,
          twinkleDirection: Math.random() < 0.5 ? 1 : -1,
        });
      }
      for (let i = 0; i < stars.length; i++) {
        stars[i].baseX = stars[i].x;
        stars[i].baseY = stars[i].y;
      }
    };

    const renderFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width * 0.5;
      const cy = canvas.height * 0.5;
      const px = pointerRef.current.x || cx;
      const py = pointerRef.current.y || cy;
      const radius = Math.min(canvas.width, canvas.height) * 0.35;

      warpTarget = pointerDownRef.current ? baseWarpOnPress : baseWarpOnHover;
      warpStrength += (warpTarget - warpStrength) * 0.12;

      stars.forEach(star => {
        star.opacity += star.twinkleSpeed * star.twinkleDirection;
        if (star.opacity > maxOpacity || star.opacity < minOpacity) {
          star.twinkleDirection *= -1;
          star.opacity = Math.max(minOpacity, Math.min(maxOpacity, star.opacity));
        }

        const dx = star.baseX - px;
        const dy = star.baseY - py;
        const dist = Math.hypot(dx, dy);
        const intensity = Math.max(0, 1 - Math.min(dist / radius, 1));
        const warpFactor = warpStrength * (0.5 * intensity + 0.5 * intensity * intensity);
        const drawX = star.baseX + (px - star.baseX) * warpFactor;
        const drawY = star.baseY + (py - star.baseY) * warpFactor;
        const glowOpacity = Math.min(1, star.opacity + intensity * 0.8);

        ctx.fillStyle = `rgba(27, 176, 242, ${glowOpacity})`;
        ctx.fillRect(drawX, drawY, star.size, star.size);
      });
    };

    const animate = () => {
      renderFrame();
      animationFrameId = requestAnimationFrame(animate);
    };

    setup();
    animate();
    drawNowRef.current = renderFrame;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setup();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.length = 0;
    };
  }, [isMounted]);

  // Add handleNavClick function (similar to page.tsx)
  const handleNavClick = (href: string) => {
    setNavigatingTo(href);
    // Perform actual navigation
    router.push(href);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(''); // Clear previous errors

    if (!email || !password) {
        setError('Please enter both email and password.');
        setIsLoading(false);
        return;
    }

    try {
        console.log('[LoginPage] Attempting Firebase login...');
        await signInWithEmailAndPassword(auth, email, password);
        // After signInWithEmailAndPassword, auth.currentUser should be set.

        const checkVerificationAndRedirect = async (attempt: number): Promise<boolean> => {
            console.log(`[LoginPage] Attempt ${attempt}: Reloading user for email verification check.`);
            
            const currentUser = auth.currentUser;
            if (!currentUser) {
                console.error(`[LoginPage] Attempt ${attempt}: No current user found before reload. This should not happen after successful signIn.`);
                // This scenario implies something went very wrong, or the user was signed out immediately.
                setError("Authentication error. Please try again.");
                setIsLoading(false); 
                return false; // Cannot proceed without a user
            }
            await currentUser.reload();
            const freshUser = auth.currentUser; // Re-fetch after reload to be certain

            if (freshUser && freshUser.emailVerified) {
                console.log(`[LoginPage] Attempt ${attempt}: Email verified for UID: ${freshUser.uid}. Preparing to redirect.`);
                // Add a small delay here to allow useWallet's onAuthStateChanged to process
                await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
                console.log("[LoginPage] Redirecting to /loading");
                router.push('/loading');
                // No need to setIsLoading(false) here because of the redirect
                return true; // Verified and redirected
            }
            console.log(`[LoginPage] Attempt ${attempt}: Email still not showing as verified. UID: ${freshUser?.uid}, Status: ${freshUser?.emailVerified}`);
            return false; // Not verified yet
        };

        // Attempt 1: Immediately after login and first reload
        if (await checkVerificationAndRedirect(1)) return;

        // Attempt 2: After a short delay
        console.log("[LoginPage] Email not verified on first check. Waiting for a moment...");
        setError("Verifying email status, please wait..."); 
        // isLoading is already true
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
        if (await checkVerificationAndRedirect(2)) return;
        
        // Attempt 3: After a longer delay (an additional 3 seconds)
        console.log("[LoginPage] Email not verified on second check. Waiting a bit longer...");
        // Error message is already "Verifying email status..."
        await new Promise(resolve => setTimeout(resolve, 3000)); // Additional 3-second delay
        if (await checkVerificationAndRedirect(3)) return;

        // If still not verified after all attempts
        console.log("[LoginPage] Email STILL NOT verified after all attempts.");
        setError("Email not verified. Please check your inbox or resend the verification email from the banner. If you recently verified, please wait a few moments and try logging in again.");
        setIsLoading(false);
        // Optional: Sign out the user if email verification is mandatory to proceed.
        // await signOut(auth);
        // console.log("[LoginPage] User signed out as email is not verified.");

    } catch (firebaseError: any) {
        console.error("Login Error:", firebaseError);
        let errorMessage = "Login failed. Please check your credentials.";
        switch (firebaseError.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = "Invalid email or password.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Please enter a valid email address.";
                break;
            case 'auth/too-many-requests':
                 errorMessage = "Access temporarily disabled due to too many failed login attempts. Please reset your password or try again later.";
                 break;
            // It's good to handle 'auth/network-request-failed' specifically if it becomes common
            case 'auth/network-request-failed':
                errorMessage = "Network error during login. Please check your connection and try again.";
                break;
            default:
                errorMessage = "An unexpected error occurred during login. Please try again.";
        }
        setError(errorMessage);
        setIsLoading(false);
    }
    // If the function reaches here, it means no redirect happened and errors were handled, 
    // or a final state was set (e.g. email not verified).
    // Ensure isLoading is false if not already set by an error path.
    // However, if it's still loading because of the setError("Verifying email status...") path without redirect, 
    // this might be premature. The existing logic to set isLoading(false) in the final error path for verification is better.
  };
  
  // Simple inline SVG Spinner component (copied from page.tsx)
  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    // Use bg-background-primary like welcome page
    <main className="relative w-full h-[100dvh] overflow-hidden flex flex-col bg-background-primary text-white">
      {/* Add background elements from page.tsx */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-1 pointer-events-none"
        id="login-constellation-canvas" // Unique ID if needed
      />
      {isMounted && (
        <div
          className="pointer-events-none fixed inset-0 z-0 transition duration-300"
          style={{
            background: `radial-gradient(220px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
          }}
        />
      )}
      {/* Header container - Match home page styling */}
      <div className="w-full px-6 pt-6 z-10 flex items-center justify-between">
          {/* Home button - matches home page login button size */}
            <button 
              onClick={() => handleNavClick('/')}
              className={`px-6 py-2 rounded-md transition duration-300 flex items-center justify-center 
                ${navigatingTo === '/'
                  ? 'bg-accent-1 text-background-primary animate-pulse cursor-not-allowed' // Loading state
                  : 'border border-accent-1 text-accent-1 hover:bg-accent-1/10' // Normal state
                }`}
              disabled={navigatingTo === '/'}
             >
              <FiArrowLeft className="mr-1.5" size={16} />
              Home
            </button>
          {/* View Lobby button - matches home page login button size */}
             <button
               onClick={() => handleNavClick('/lobby')}
               className={`px-6 py-2 rounded-md transition duration-300 flex items-center justify-center 
                ${navigatingTo === '/lobby'
                  ? 'bg-accent-1 text-background-primary animate-pulse cursor-not-allowed' // Loading state
                  : 'border border-accent-1 text-accent-1 hover:bg-accent-1/10' // Normal state
                }`}
               disabled={navigatingTo === '/lobby'}
             >
              View Lobby
            </button>
      </div>
      {/* Main content wrapper - Centered */}
      <div className="relative flex-grow flex flex-col items-center justify-center p-5">
        {/* Outer container for positioning background and content */}
        <div className="relative w-full max-w-sm">
          {/* Background Element: Apply 45% opacity to gradient colors */}
          <div className="absolute inset-0 bg-gradient-to-b from-background-primary/45 via-background-secondary/45 via-15% to-background-secondary/45 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl z-0"></div>

          {/* Content block: Relative position, z-10 to sit above background, transparent bg */}
          <div className="relative z-10 w-full p-8 flex flex-col items-center gap-6">
            {/* Cube */}
            <div className="flex flex-col items-center gap-4">
              <div className="cubeRoot" style={{ height: '3rem', width: '3rem', '--cube-size': '3rem' } as React.CSSProperties}>
                <LogoCube rotationX={rotation.x} rotationY={rotation.y} />
              </div>
              <h1 className="text-2xl font-semibold text-white">Log In</h1>
            </div>

            {/* Form */}
            <LoginForm
              email={email}
              password={password}
              isLoading={isLoading}
              error={error}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleLogin}
              onTogglePassword={() => setShowPassword(!showPassword)}
              showPassword={showPassword}
            />

            {/* Submit button moved inside LoginForm; keep spacing */}

            {/* Create Account Link */}
            <p className="text-sm text-gray-400">
              No account yet? <Link href="/signup/email" className="text-accent-1 hover:text-white hover:underline font-medium transition-colors">Create Account</Link>
          </p>
          </div>
        </div>
      </div>
    </main>
  );
} 