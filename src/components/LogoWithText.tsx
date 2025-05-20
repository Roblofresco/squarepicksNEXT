import React from 'react';
import Image from 'next/image';

interface LogoWithTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Using similar sizing logic as the original Logo component
// based on the aspect ratio of sp-logo-icon-default-text-white.svg (which is similar to the text-only logo)
const sizeMappings = {
  sm: {
    width: 120, // Approximate base width, height style takes precedence
    height: 64, // Approximate base height
    style: { height: '4rem' } // Force height
  },
  md: {
    width: 180,
    height: 96,
    style: { height: '6rem' }
  },
  lg: {
    width: 270,
    height: 144,
    style: { height: '9rem' }
  },
  xl: {
    width: 405,
    height: 216,
    style: { height: '13.5rem' }
  }
};

export const LogoWithText: React.FC<LogoWithTextProps> = ({ size = 'md', className = '' }) => {
  const sizeConfig = sizeMappings[size];

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/brandkit/logos/sp-logo-icon-default-text-white.svg"
        alt="SquarePicks Logo"
        width={sizeConfig.width}
        height={sizeConfig.height}
        style={sizeConfig.style}
        priority
      />
    </div>
  );
}; 