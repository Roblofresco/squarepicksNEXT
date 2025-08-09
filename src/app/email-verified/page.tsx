'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect, useRef, Suspense } from 'react'
import { FiLogIn, FiAlertCircle } from 'react-icons/fi' // Removed FiArrowLeft
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { applyActionCode } from 'firebase/auth'

// Import the correct LogoCube component dynamically
const LogoCube = dynamic(() => import('@/components/LogoCube'), { ssr: false })

export default function EmailVerifiedPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <EmailVerifiedContent />
    </Suspense>
  );
}

function EmailVerifiedContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get URL search parameters
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isValidVerificationFlow, setIsValidVerificationFlow] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // New loading state for applyActionCode

  useEffect(() => {
    setIsMounted(true);
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      // Apply the action code
      console.log('[EmailVerifiedPage] Valid verification flow. Attempting to apply action code:', oobCode);
      setIsVerifying(true); // Start verification loading state
      applyActionCode(auth, oobCode)
        .then(() => {
          console.log('[EmailVerifiedPage] applyActionCode success. Email should be verified.');
          setIsValidVerificationFlow(true); // Set to true after successful application
          // Reload user state to ensure emailVerified is updated locally
      const currentUser = auth.currentUser;
      if (currentUser) {
            console.log('[EmailVerifiedPage] User found. Attempting user.reload(). UID:', currentUser.uid);
        currentUser.reload().then(() => {
          console.log('[EmailVerifiedPage] user.reload() success. Email verified status should be updated for onAuthStateChanged.');
              // The onAuthStateChanged in useWallet should pick this up.
              // Optionally, you could directly push to login or lobby if emailVerified becomes true here.
              setTimeout(() => {
                console.log("[EmailVerifiedPage] Auto-redirecting to /login page.");
                router.push('/login');
              }, 2000); // 2-second delay before redirect
        }).catch(error => {
              console.error('[EmailVerifiedPage] Error during user.reload() after applyActionCode:', error);
        });
      } else {
            console.warn('[EmailVerifiedPage] No currentUser found immediately after applyActionCode. The onAuthStateChanged should still pick up the change when user signs in or state resolves.');
          }
        })
        .catch((error) => {
          console.error('[EmailVerifiedPage] Error applying action code:', error);
          setIsValidVerificationFlow(false); // Link is invalid or expired
          // Handle specific errors, e.g., 'auth/invalid-action-code'
          // You might want to show a more specific error message to the user here.
        })
        .finally(() => {
          setIsVerifying(false); // Stop verification loading state regardless of outcome
        });
    } else {
      console.log('[EmailVerifiedPage] Invalid mode or missing oobCode. Mode:', mode, 'OOBCode:', oobCode);
      setIsValidVerificationFlow(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      const targetX = (event.clientX - windowHalfX) / windowHalfX;
      const targetY = (event.clientY - windowHalfY) / windowHalfY;
      setRotation({ x: targetY, y: targetX });
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

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

  const handleNavClick = (href: string) => {
    setNavigatingTo(href);
    if (href === '/login') {
        router.push(href);
    }
  };
  
  // Simple inline SVG Spinner component
  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Centralized loading/message display logic
  const renderContent = () => {
    if (!isMounted || isVerifying) { // Show loader if not mounted OR if verifying
  return (
        <>
          <LoadingSpinner />
          <p className="text-center text-gray-300 mt-4">
            {isVerifying ? "Verifying your email, please wait..." : "Loading..."}
          </p>
        </>
      );
    }

    if (isValidVerificationFlow) {
      return (
              <>
                <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-accent-1 to-accent-2">
                  Email Verified!
                </h1>
                <p className="text-center text-gray-300">
            Your email address has been successfully verified. You will be redirected to the login page shortly...
                </p>
                <button
                  onClick={() => handleNavClick('/login')}
                  disabled={navigatingTo === '/login'}
                  className={`w-full flex items-center justify-center px-6 py-3 rounded-lg transition-all duration-300 ease-in-out font-semibold
                    ${navigatingTo === '/login'
                      ? 'bg-accent-1/80 text-background-primary cursor-not-allowed'
                      : 'bg-gradient-to-r from-accent-1 to-accent-2 hover:shadow-accent-1/50 hover:shadow-lg text-white'
                    }`}
                >
                  {navigatingTo === '/login' ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <FiLogIn className="mr-2" /> Login
                    </>
                  )}
                </button>
              </>
      );
    }

    // If not verifying and not valid flow (i.e., invalid link or error during verification)
    return (
              <>
                <FiAlertCircle className="text-accent-warning text-5xl mb-4" />
                <h1 className="text-2xl font-bold text-center text-gray-100">
          Invalid or Expired Link
                </h1>
                <p className="text-center text-gray-300">
          This verification link is invalid or may have expired. Please try verifying your email again or contact support.
                </p>
                <button
                  onClick={() => handleNavClick('/login')}
                  disabled={navigatingTo === '/login'}
                  className={`w-full mt-4 flex items-center justify-center px-6 py-3 rounded-lg transition-all duration-300 ease-in-out font-semibold
                    ${navigatingTo === '/login'
                      ? 'bg-accent-1/80 text-background-primary cursor-not-allowed'
                      : 'bg-gradient-to-r from-accent-1 to-accent-2 hover:shadow-accent-1/50 hover:shadow-lg text-white'
                    }`}
                >
                  {navigatingTo === '/login' ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <FiLogIn className="mr-2" /> Login
                    </>
                  )}
                </button>
              </>
    );
  };

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden flex flex-col bg-background-primary text-white">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-1 pointer-events-none"
        id="email-verified-constellation-canvas"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 transition duration-300"
        style={{
          background: `radial-gradient(300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
        }}
      />
      
      <div className="relative flex-grow flex flex-col items-center justify-center p-5">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-0 bg-gradient-to-b from-background-primary/45 via-background-secondary/45 via-15% to-background-secondary/45 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl z-0"></div>
          <div className="relative z-10 w-full p-8 flex flex-col items-center gap-6">
            <div className="mb-0">
              <LogoCube rotationX={rotation.x} rotationY={rotation.y} />
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </main>
  );
} 