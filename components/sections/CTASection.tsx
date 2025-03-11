'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-secondary-800">
      <div className="container-responsive">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-900 to-primary-800">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-repeat opacity-10"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-700/30 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-700/30 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl"></div>
          
          <div className="relative px-6 py-16 md:p-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Start Making Picks?
              </h2>
              
              <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto mb-8">
                Join thousands of sports fans who are already enjoying SquarePicks. 
                Sign up today and get 500 bonus points to start your journey!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" variant="accent" fullWidth={true} className="sm:w-auto">
                    Sign Up Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" fullWidth={true} className="sm:w-auto border-white/30 text-white hover:bg-white/10">
                    Log In
                  </Button>
                </Link>
              </div>
              
              <p className="mt-6 text-sm text-primary-200">
                No credit card required. Free forever.
              </p>
            </motion.div>
          </div>
        </div>
        
        {/* App download section */}
        <div className="mt-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Download Our Mobile App
            </h3>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              Get the full SquarePicks experience on your mobile device. 
              Available for iOS and Android.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-black text-white rounded-lg px-6 py-3 flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-6 h-6 mr-2">
                  <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </button>
              
              <button className="bg-black text-white rounded-lg px-6 py-3 flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6 mr-2">
                  <path fill="currentColor" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs">GET IT ON</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}