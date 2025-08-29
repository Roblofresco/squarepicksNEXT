'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import styles from './LogoCube.module.css'

// Props for the main exported component
interface LogoCubeProps {
  className?: string; // Allow custom styling of the container
  rotationX?: number;
  rotationY?: number;
}

// Main exported component using CSS 3D transforms with smooth interpolation
export default function LogoCube({ 
  className = '', 
  rotationX = 0, 
  rotationY = 0, 
}: LogoCubeProps) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });

  // Memoize rotation calculations to prevent unnecessary recalculations
  const targetRotations = useMemo(() => ({
    x: -rotationX * 45,
    y: rotationY * 45
  }), [rotationX, rotationY]);

  // Smooth animation loop using requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      if (!cubeRef.current) return;

      // Smooth interpolation factor (lower = smoother but slower)
      const smoothingFactor = 0.08;
      
      // Interpolate current rotation towards target rotation
      currentRotationRef.current.x += (targetRotations.x - currentRotationRef.current.x) * smoothingFactor;
      currentRotationRef.current.y += (targetRotations.y - currentRotationRef.current.y) * smoothingFactor;

      // Apply the smoothed rotation
      cubeRef.current.style.transform = 
        `rotateX(${currentRotationRef.current.x}deg) rotateY(${currentRotationRef.current.y}deg)`;

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetRotations.x, targetRotations.y]);

  // Update target rotation when props change
  useEffect(() => {
    targetRotationRef.current = targetRotations;
  }, [targetRotations]);

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