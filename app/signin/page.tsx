'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaGoogle, 
  FaFacebook, 
  FaApple,
  FaChevronLeft
} from 'react-icons/fa'

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle sign in
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    // Show loading state
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      // For demo purposes, always succeed
      router.push('/dashboard');
      
      // In a real app, you would handle authentication errors here
      // setError('Invalid email or password');
    }, 1500);
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Handle social sign in
  const handleSocialSignIn = (provider: string) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 1500);
  };
  
  return (
    <main className="min-h-screen flex flex-col bg-secondary-900">
      <div className="flex-grow flex flex-col p-4">
        <div className="pt-4">
          <button 
            className="text-gray-400 hover:text-white transition-colors"
            onClick={() => router.push('/welcome')}
          >
            <FaChevronLeft className="text-lg" />
          </button>
        </div>
        
        <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <Image 
              src="/images/logo.png" 
              alt="SquarePicks Logo" 
              width={80} 
              height={80}
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to continue to SquarePicks</p>
          </div>
          
          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSignIn} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-500" />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-secondary-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <Link 
                  href="/forgot-password"
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-secondary-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button 
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 bg-secondary-800 border-gray-700 rounded text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                Remember me
              </label>
            </div>
            
            <Button 
              type="submit"
              variant="primary" 
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500">or continue with</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-8">
            <button 
              className="flex justify-center items-center p-3 bg-secondary-800 hover:bg-secondary-700 rounded-lg border border-gray-700 transition-colors"
              onClick={() => handleSocialSignIn('google')}
              disabled={isLoading}
            >
              <FaGoogle className="text-white" />
            </button>
            
            <button 
              className="flex justify-center items-center p-3 bg-secondary-800 hover:bg-secondary-700 rounded-lg border border-gray-700 transition-colors"
              onClick={() => handleSocialSignIn('facebook')}
              disabled={isLoading}
            >
              <FaFacebook className="text-white" />
            </button>
            
            <button 
              className="flex justify-center items-center p-3 bg-secondary-800 hover:bg-secondary-700 rounded-lg border border-gray-700 transition-colors"
              onClick={() => handleSocialSignIn('apple')}
              disabled={isLoading}
            >
              <FaApple className="text-white" />
            </button>
          </div>
          
          <p className="text-center text-gray-400">
            Don't have an account?{' '}
            <Link 
              href="/register"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}