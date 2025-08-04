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

  useEffect(() => {
    setIsMounted(true); // Set mounted state
  }, []);

  // Combined useEffect for pointer/mouse tracking
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      // Rotation logic (remains the same)
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      const targetX = (event.clientX - windowHalfX) / windowHalfX;
      const targetY = (event.clientY - windowHalfY) / windowHalfY;
      setRotation({ x: targetY, y: targetX });

      // Mouse position tracking for spotlight effect
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Canvas Animation for Twinkling Stars (copied from page.tsx)
  useEffect(() => {
    if (!isMounted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const stars: any[] = [];
    const numStars = 150;
    const starColor = "rgba(27, 176, 242, 1)"; // accent-1
    const minOpacity = 0.1;
    const maxOpacity = 0.7;

    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinkleDirection: Math.random() < 0.5 ? 1 : -1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.opacity += star.twinkleSpeed * star.twinkleDirection;
        if (star.opacity > maxOpacity || star.opacity < minOpacity) {
          star.twinkleDirection *= -1;
          star.opacity = Math.max(minOpacity, Math.min(maxOpacity, star.opacity));
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

  // Add handleNavClick function (similar to page.tsx)
  const handleNavClick = (href: string) => {
    setNavigatingTo(href);
    // Actual navigation happens via Link component
  };

  const handleLogin = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
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
      <div
        className="pointer-events-none fixed inset-0 z-0 transition duration-300"
        style={{
          background: `radial-gradient(300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
        }}
      />
      {/* Header container - Adjust padding slightly */}
      <div className="w-full px-6 pt-6 z-10 flex items-center justify-between">
          {/* Add onClick, disabled, and conditional classes */}
          <Link href="/" passHref onClick={() => handleNavClick('/')} legacyBehavior>
            <button 
              // Apply motion if needed, or just basic button
              className={`flex items-center px-4 py-1.5 rounded-md transition duration-300 text-sm 
                ${navigatingTo === '/'
                  ? 'bg-accent-1 text-background-primary animate-pulse cursor-not-allowed' // Loading state
                  : 'border border-accent-1 text-accent-1 hover:bg-accent-1/10' // Normal state
                }`}
              disabled={navigatingTo === '/'}
             >
              <FiArrowLeft className="mr-1.5" size={16} />
              Back
            </button>
          </Link>
          {/* Add onClick, disabled, and conditional classes */}
          <Link
            href="/lobby"
            passHref
            onClick={() => handleNavClick('/lobby')}
            legacyBehavior>
             <button
               className={`px-4 py-1.5 rounded-md transition duration-300 text-sm 
                ${navigatingTo === '/lobby'
                  ? 'bg-accent-1 text-background-primary animate-pulse cursor-not-allowed' // Loading state
                  : 'border border-accent-1 text-accent-1 hover:bg-accent-1/10' // Normal state
                }`}
               disabled={navigatingTo === '/lobby'}
             >
              View Lobby (Guest)
            </button>
          </Link>
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
            <form id="login-form" className="w-full flex flex-col gap-5" onSubmit={handleLogin}>
              {/* Email Input - Added value and onChange */}
            <div className="relative w-full">
              <label htmlFor="email" className="sr-only">Email or Username</label>
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
              <input 
                id="email"
                type="email" 
                value={email} // Bind value
                onChange={(e) => setEmail(e.target.value)} // Update state
                placeholder="Email or Username" 
                required
                  className="w-full appearance-none bg-gray-900/50 border border-gray-600 text-white placeholder-gray-400 text-base p-3 pl-10 rounded-lg focus:outline-none focus:border-accent-1 focus:ring-1 focus:ring-accent-1/50 transition duration-200 shadow-sm"
              />
            </div>
              {/* Password Input - Added value and onChange */}
            <div className="relative w-full">
              <label htmlFor="password" className="sr-only">Password</label>
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
              <input 
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password} // Bind value
                onChange={(e) => setPassword(e.target.value)} // Update state
                placeholder="Password"
                required
                  className="w-full appearance-none bg-gray-900/50 border border-gray-600 text-white placeholder-gray-400 text-base p-3 pl-10 pr-10 rounded-lg focus:outline-none focus:border-accent-1 focus:ring-1 focus:ring-accent-1/50 transition duration-200 shadow-sm"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none z-10"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            {/* Display Login Error Message */} 
            {error && <p className="text-red-500 text-sm text-left -mt-2">{error}</p>} 
          </form>

            {/* Submit Button: Apply conditional classes based on isLoading */}
          <button 
            type="submit"
            form="login-form"
              className={`w-full font-semibold text-base py-3 px-5 rounded-lg transition-all duration-300 flex items-center justify-center 
                ${isLoading 
                  ? 'bg-gradient-accent2-accent3 animate-pulse cursor-not-allowed' // Loading state
                  : 'bg-gradient-accent1-accent4 hover:bg-gradient-accent2-accent3 text-white shadow-md hover:shadow-lg' // Normal state
                }`}
            disabled={isLoading}
          >
              {/* Keep spinner for form submission, but remove extra text */}
              {isLoading ? <LoadingSpinner /> : 'Log In'}
          </button>

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