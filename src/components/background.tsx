'use client'

import React from 'react'

export function WelcomeBackground() {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
      {/* Base color layer (fallback) */}
      <div className="absolute inset-0 bg-[#5954E3]" />
      
      {/* Figma background image - Simplified styling */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('/images/welcome-background.png')`,
          backgroundSize: 'cover',
          // Removed filter, mixBlendMode, opacity for simplicity
        }} 
      />
      
      {/* Gradient overlay with 80% opacity */}
      <div 
        className="absolute inset-0 opacity-80 bg-gradient-to-b from-[#5954E3] to-[#D43DAE]"
        // Removed mixBlendMode style
      />
      
      {/* Removed the duplicate cube from here */}
      {/* 
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-64 h-64 sm:w-80 sm:h-80 z-0">
        <FuturisticCube />
      </div> 
      */}
    </div>
  )
} 