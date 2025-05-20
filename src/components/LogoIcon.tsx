import React from 'react';
import Image from 'next/image';

interface LogoIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Defining square sizes for the icon
const sizeMappings = {
  sm: {
    width: 32, // 2rem
    height: 32,
    style: { height: '2rem', width: '2rem' }
  },
  md: {
    width: 48, // 3rem
    height: 48,
    style: { height: '3rem', width: '3rem' }
  },
  lg: {
    width: 64, // 4rem
    height: 64,
    style: { height: '4rem', width: '4rem' }
  }
};

export const LogoIcon: React.FC<LogoIconProps> = ({ size = 'md', className = '' }) => {
  const sizeConfig = sizeMappings[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/brandkit/logos/sp-logo-icon-default.svg"
        alt="SquarePicks Icon"
        width={sizeConfig.width}
        height={sizeConfig.height}
        style={sizeConfig.style}
        priority
      />
    </div>
  );
}; 