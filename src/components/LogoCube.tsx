'use client'

import React, { useRef, useEffect } from 'react'
import styles from './LogoCube.module.css'

// Props for the main exported component
interface LogoCubeProps {
  className?: string; // Allow custom styling of the container
  rotationX?: number;
  rotationY?: number;
}

// Main exported component using CSS 3D transforms
export default function LogoCube({ 
  className = '', 
  rotationX = 0, 
  rotationY = 0, 
}: LogoCubeProps) {
  const cubeRef = useRef<HTMLDivElement>(null);

  // Apply smoothed rotation using inline styles
  useEffect(() => {
    if (cubeRef.current) {
      // Adjust multiplier as needed for desired sensitivity
      // Invert rotationX for more natural vertical mouse movement
      const targetRotateX = -rotationX * 45; 
      const targetRotateY = rotationY * 45; // Rotate up to 45 degrees
      
      // Get current transform values (more complex, needs parsing or storing state)
      // For simplicity, directly apply target rotation with CSS transition
      cubeRef.current.style.transform = 
        `rotateX(${targetRotateX}deg) rotateY(${targetRotateY}deg)`;
    }
  }, [rotationX, rotationY]);

  return (
    // Container div - Needs perspective
    <div className={`${styles.scene} ${className}`}>
      {/* The cube itself - Needs transform-style: preserve-3d */}
      <div ref={cubeRef} className={styles.cube}>
        {/* Define the 6 faces of the cube */}
        {/* Apply logo to the front face */}
        <div className={`${styles.face} ${styles.front}`}></div>
        <div className={`${styles.face} ${styles.back}`}></div>
        <div className={`${styles.face} ${styles.right}`}></div>
        <div className={`${styles.face} ${styles.left}`}></div>
        <div className={`${styles.face} ${styles.top}`}></div>
        <div className={`${styles.face} ${styles.bottom}`}></div>
      </div>
    </div>
  );
} 