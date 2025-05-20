'use client'

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Import the new consolidated LogoCube
const LogoCube = dynamic(() => import('@/components/LogoCube'), { ssr: false });

export default function SignupHeader() {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const headerRef = useRef<HTMLDivElement>(null);

  // Effect to track pointer movement across the entire window
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      // Calculate pointer position relative to the window top-left (0 to ~2 range)
      // This makes the rotation origin feel closer to the top-left header position
      const targetX = (event.clientX / window.innerWidth) * 2;
      const targetY = (event.clientY / window.innerHeight) * 2;
      
      // Apply rotation based on pointer position (adjust sensitivity with multiplier)
      // Map Y pointer to X rotation, X pointer to Y rotation for intuitive feel
      const sensitivity = 0.4; // Might need to adjust sensitivity
      setRotation({ x: targetY * sensitivity, y: targetX * sensitivity });
    };

    // Add listener to the window
    window.addEventListener('pointermove', handlePointerMove);

    // Optional: Reset rotation when pointer leaves the window area (might not be desired)
    // const handlePointerLeave = () => {
    //   setRotation({ x: 0, y: 0 }); 
    // };
    // document.body.addEventListener('mouseleave', handlePointerLeave); // Use mouseleave on body

    // Cleanup: remove listeners from the window
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      // if (handlePointerLeave) {
      //   document.body.removeEventListener('mouseleave', handlePointerLeave);
      // }
    };
  }, []); // Empty dependency array, runs once on mount

  return (
    <div ref={headerRef} className="w-full flex justify-start items-center z-20 !bg-background-primary pl-4 py-2">
      <Link href="/" aria-label="Go to Welcome Page">
        <div className="flex items-center justify-center">
          <div style={{ 
            height: '2rem', 
            width: '2rem', 
            '--cube-size': '2rem' // Set CSS variable
          } as React.CSSProperties}>
            <LogoCube
              rotationX={rotation.x}
              rotationY={rotation.y}
            />
          </div>
          <div className="ml-2">
            <Image
              src="/brandkit/logos/sp-logo-text-white.svg"
              alt="SquarePicks Logo"
              width={180}
              height={32}
              priority
            />
          </div>
        </div>
      </Link>
    </div>
  );
}; 