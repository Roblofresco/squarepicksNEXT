'use client'

import React, { useRef, useEffect, memo, useState } from 'react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

interface StarfieldBackgroundProps {
    className?: string;
    numStars?: number;
    starColor?: string; // e.g., rgba(255, 255, 255, 0.8)
    speedFactor?: number; // Controls speed based on distance from center
    resetAreaSize?: number; // Size of the area around the center to reset stars
}

const StarfieldBackgroundComponent: React.FC<StarfieldBackgroundProps> = ({
    className,
    numStars = 400,
    starColor = 'rgba(27, 176, 242, 1)', // Default to accent-1
    speedFactor = 0.01,
    resetAreaSize = 100,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!canvasRef.current || !isMounted || typeof window === 'undefined') return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!(ctx instanceof CanvasRenderingContext2D)) return;

        let animationFrameId: number;
        const stars: Array<{ x: number; y: number; angle: number; speed: number; size: number; opacity: number; dist: number; }> = [];
        let canvasCenterX = window.innerWidth / 2;
        let canvasCenterY = window.innerHeight / 2;

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvasCenterX = canvas.width / 2;
            canvasCenterY = canvas.height / 2;
            stars.length = 0;

            for (let i = 0; i < numStars; i++) {
                const initialX = Math.random() * canvas.width;
                const initialY = Math.random() * canvas.height;
                const dx = initialX - canvasCenterX;
                const dy = initialY - canvasCenterY;
                const angle = Math.atan2(dy, dx);
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                stars.push({
                    x: initialX,
                    y: initialY,
                    angle: angle,
                    speed: dist * speedFactor + 0.1, // Use prop
                    size: Math.random() * 2.0 + 1.0,
                    opacity: Math.random() * 0.5 + 0.2,
                    dist: dist,
                });
            }
        };

        const animate = () => {
            if (!canvasRef.current) return; // Ensure canvas exists in loop
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            stars.forEach((star, index) => {
                star.x += Math.cos(star.angle) * star.speed;
                star.y += Math.sin(star.angle) * star.speed;
                
                const dx = star.x - canvasCenterX;
                const dy = star.y - canvasCenterY;
                star.dist = Math.sqrt(dx*dx + dy*dy);
                star.speed = star.dist * speedFactor + 0.1; // Use prop
                star.angle = Math.atan2(dy, dx);

                const isOffScreen = star.x < -star.size || star.x > canvas.width + star.size || star.y < -star.size || star.y > canvas.height + star.size;

                if (isOffScreen) {
                    const resetX = canvasCenterX + (Math.random() * resetAreaSize - resetAreaSize / 2); // Use prop
                    const resetY = canvasCenterY + (Math.random() * resetAreaSize - resetAreaSize / 2); // Use prop
                    
                    const newDx = resetX - canvasCenterX;
                    const newDy = resetY - canvasCenterY;
                    const newAngle = Math.atan2(newDy, newDx);
                    const newDist = Math.sqrt(newDx * newDx + newDy * newDy);
                    
                    stars[index] = {
                        x: resetX,
                        y: resetY,
                        angle: newAngle, 
                        speed: newDist * speedFactor + 0.1, // Use prop
                        size: Math.random() * 2.0 + 1.0,
                        opacity: Math.random() * 0.5 + 0.2,
                        dist: newDist,
                    };
                } else {
                    ctx.fillStyle = starColor; // Use prop
                    // Adjust opacity slightly based on distance? (Optional)
                    // const opacityFactor = Math.max(0.1, 1 - star.dist / (Math.max(canvasCenterX, canvasCenterY)));
                    // ctx.globalAlpha = star.opacity * opacityFactor;
                    ctx.globalAlpha = star.opacity; // Keep original opacity logic
                    ctx.fillRect(star.x - star.size / 2, star.y - star.size / 2, star.size, star.size);
                    ctx.globalAlpha = 1.0; // Reset global alpha
                }
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
    }, [numStars, starColor, speedFactor, resetAreaSize, isMounted]); // Add props to dependency array

    // Don't render canvas during SSR
    if (!isMounted) {
        return null;
    }

    return (
        <canvas
            ref={canvasRef}
            className={cn("fixed inset-0 z-[-1] pointer-events-none", className)} // Default z-index to -1, allow override
        />
    );
};

StarfieldBackgroundComponent.displayName = 'StarfieldBackground';
export default memo(StarfieldBackgroundComponent); 