'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-16 md:pt-24 md:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary-900 to-primary-900 opacity-90"></div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-repeat opacity-10"></div>
      
      <div className="container-responsive relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Make Your <span className="text-accent-500">Sports Picks</span> and Win Big
              </h1>
              
              <p className="mt-6 text-lg text-gray-300 max-w-xl mx-auto lg:mx-0">
                Join thousands of sports fans making picks, competing in sweepstakes, and winning prizes. 
                No real money betting, just pure sports fun.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button size="lg" variant="accent" fullWidth={true} className="sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button size="lg" variant="outline" fullWidth={true} className="sm:w-auto">
                    How It Works
                  </Button>
                </Link>
              </div>
              
              <div className="mt-8 flex items-center justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                      <div className="w-full h-full bg-gray-400"></div>
                    </div>
                  ))}
                </div>
                <p className="ml-4 text-sm text-gray-300">
                  Joined by <span className="font-semibold text-white">10,000+</span> sports fans
                </p>
              </div>
            </motion.div>
          </div>
          
          {/* Right content - App preview */}
          <div className="w-full lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative mx-auto max-w-sm md:max-w-md">
                {/* Placeholder for app screenshot */}
                <div className="aspect-[9/16] bg-secondary-800 rounded-3xl overflow-hidden border-4 border-secondary-700 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-primary-800 to-primary-900 flex items-center justify-center">
                    <span className="text-xl text-white font-semibold">App Screenshot</span>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent-500 rounded-2xl rotate-12 shadow-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">WIN!</span>
                </div>
                
                <div className="absolute -bottom-4 -left-4 w-32 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center p-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                      $
                    </div>
                    <div className="ml-2">
                      <div className="text-xs text-gray-500">Prize Pool</div>
                      <div className="text-sm font-bold text-gray-800">$10,000</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Trusted by logos */}
        <div className="mt-16 md:mt-24">
          <p className="text-center text-gray-400 text-sm mb-6">TRUSTED BY SPORTS FANS FROM</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            {['ESPN', 'CBS Sports', 'Yahoo Sports', 'Bleacher Report'].map((brand) => (
              <div key={brand} className="text-gray-400 font-semibold text-lg md:text-xl">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}