'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { FaChevronRight, FaGoogle, FaFacebook, FaApple } from 'react-icons/fa'

// Slide component
const Slide = ({ 
  title, 
  description, 
  image 
}: { 
  title: string; 
  description: string; 
  image: string;
}) => {
  return (
    <div className="text-center px-4">
      <div className="relative w-full h-64 mb-8">
        <Image 
          src={image} 
          alt={title}
          fill
          className="object-contain"
        />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
    </div>
  );
};

// Dot indicator component
const DotIndicator = ({ 
  currentSlide, 
  totalSlides, 
  onDotClick 
}: { 
  currentSlide: number; 
  totalSlides: number;
  onDotClick: (index: number) => void;
}) => {
  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          className={`w-3 h-3 rounded-full transition-colors ${
            index === currentSlide ? 'bg-primary-500' : 'bg-gray-600'
          }`}
          onClick={() => onDotClick(index)}
        />
      ))}
    </div>
  );
};

export default function WelcomePage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Slides data
  const slides = [
    {
      title: "Welcome to SquarePicks",
      description: "The ultimate sports prediction platform where you can compete with friends and win prizes.",
      image: "/images/welcome-1.png",
    },
    {
      title: "Make Your Picks",
      description: "Predict winners, spreads, and totals for your favorite sports and games.",
      image: "/images/welcome-2.png",
    },
    {
      title: "Compete with Friends",
      description: "Create or join pick'em boards and compete with friends, family, or colleagues.",
      image: "/images/welcome-3.png",
    },
    {
      title: "Win Prizes",
      description: "Earn points, climb the leaderboard, and win real prizes based on your predictions.",
      image: "/images/welcome-4.png",
    },
  ];
  
  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [slides.length]);
  
  // Handle dot click
  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };
  
  // Handle get started
  const handleGetStarted = () => {
    router.push('/register');
  };
  
  // Handle sign in
  const handleSignIn = () => {
    router.push('/login');
  };
  
  return (
    <main className="min-h-screen flex flex-col bg-secondary-900">
      <div className="flex-grow flex flex-col justify-between p-4">
        <div className="pt-8 text-center">
          <Image 
            src="/images/logo.png" 
            alt="SquarePicks Logo" 
            width={120} 
            height={120}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white">SquarePicks</h1>
        </div>
        
        <div className="flex-grow flex flex-col justify-center">
          {/* Slides */}
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Slide 
              title={slides[currentSlide].title}
              description={slides[currentSlide].description}
              image={slides[currentSlide].image}
            />
          </motion.div>
          
          {/* Dot indicators */}
          <DotIndicator 
            currentSlide={currentSlide} 
            totalSlides={slides.length} 
            onDotClick={handleDotClick}
          />
        </div>
        
        <div className="pb-8">
          <div className="max-w-md mx-auto space-y-4">
            <Button 
              variant="primary" 
              size="lg"
              className="w-full"
              onClick={handleGetStarted}
            >
              Get Started
              <FaChevronRight className="ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="w-full"
              onClick={handleSignIn}
            >
              I Already Have an Account
            </Button>
            
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="flex-shrink mx-4 text-gray-500">or continue with</span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button className="flex justify-center items-center p-3 bg-secondary-800 hover:bg-secondary-700 rounded-lg border border-gray-700 transition-colors">
                <FaGoogle className="text-white" />
              </button>
              
              <button className="flex justify-center items-center p-3 bg-secondary-800 hover:bg-secondary-700 rounded-lg border border-gray-700 transition-colors">
                <FaFacebook className="text-white" />
              </button>
              
              <button className="flex justify-center items-center p-3 bg-secondary-800 hover:bg-secondary-700 rounded-lg border border-gray-700 transition-colors">
                <FaApple className="text-white" />
              </button>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-6">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-primary-400 hover:text-primary-300">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary-400 hover:text-primary-300">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}