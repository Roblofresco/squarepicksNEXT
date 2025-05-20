import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamically import the LogoCube component
const LogoCube = dynamic(() => import('@/components/LogoCube'), { ssr: false });

interface InteractiveLogoWithTextProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  // Option to disable the interactive rotation
  interactive?: boolean;
}

// Sizing based roughly on the SignupHeader implementation for 'md'
const sizeMappings = {
  sm: {
    cubeSize: '4rem', // 64px
    textWidth: 120,
    textHeight: 64,
    textStyle: { height: '4rem' },
    textMargin: '-ml-4'
  },
  md: {
    cubeSize: '6rem', // 96px
    textWidth: 180,
    textHeight: 96,
    textStyle: { height: '6rem' },
    textMargin: '-ml-6'
  },
  lg: {
    cubeSize: '9rem', // 144px
    textWidth: 270,
    textHeight: 144,
    textStyle: { height: '9rem' },
    textMargin: '-ml-8'
  }
};

export const InteractiveLogoWithText: React.FC<InteractiveLogoWithTextProps> = ({
  size = 'md',
  className = '',
  interactive = true
}) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const sizeConfig = sizeMappings[size];

  // Effect for interactive rotation
  useEffect(() => {
    if (!interactive) return; // Don't run if interactive is false

    const handlePointerMove = (event: PointerEvent) => {
      const targetX = (event.clientX / window.innerWidth) * 2 - 1;
      const targetY = (event.clientY / window.innerHeight) * 2 - 1;
      const sensitivity = 0.4;
      setRotation({ x: targetY * sensitivity, y: targetX * sensitivity });
    };

    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [interactive]); // Re-run if interactive prop changes

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div style={{ height: sizeConfig.cubeSize, width: sizeConfig.cubeSize }}>
        <LogoCube
          rotationX={interactive ? rotation.x : 0}
          rotationY={interactive ? rotation.y : 0}
        />
      </div>
      <div className={sizeConfig.textMargin}>
        <Image
          src="/brandkit/logos/sp-logo-text-white.svg"
          alt="SquarePicks Logo Text"
          width={sizeConfig.textWidth}
          height={sizeConfig.textHeight}
          style={sizeConfig.textStyle}
          priority
        />
      </div>
    </div>
  );
}; 