import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMappings = {
  sm: {
    width: 120,
    height: 64,
    style: { height: '4rem' }
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
  }
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeConfig = sizeMappings[size];
  
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/brandkit/logos/sp-logo-text-white.svg"
        alt="SquarePicks Logo"
        width={sizeConfig.width}
        height={sizeConfig.height}
        style={sizeConfig.style}
        priority
      />
    </div>
  );
}; 