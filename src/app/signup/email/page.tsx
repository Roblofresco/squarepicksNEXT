'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupContext } from '@/context/SignupContext';
import { FiArrowRight } from 'react-icons/fi';
import SignupProgressDots from '@/components/SignupProgressDots';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion } from 'framer-motion'

export default function EmailPage() {
  const router = useRouter();
  const { signupData, setSignupData } = useSignupContext();
  const [email, setEmail] = useState(signupData.email || '');
  const [error, setError] = useState('');

  const totalSteps = 4;
  const currentStep = 1;

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleNext = () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSignupData(prev => ({ ...prev, email }));
    router.push('/signup/password');
  };

  return (
    <div className="flex flex-col justify-between w-full h-full min-h-0">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start justify-start px-5 pt-2 w-full max-w-sm mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-6 text-left">Enter Your Email</h1>
        
        <form 
          onSubmit={(e) => { e.preventDefault(); handleNext(); }} 
          className="space-y-6 w-full"
          noValidate
        >
          <div className="relative">
            <label htmlFor="email" className="sr-only">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              aria-describedby={error ? "email-error" : undefined}
              className="w-full appearance-none bg-transparent border border-text-secondary text-white placeholder-gray-400 text-base p-3 rounded-lg focus:outline-none focus:border-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]"
            />
          </div>
          {error && <p id="email-error" className="text-red-500 text-sm text-left" aria-live="assertive">{error}</p>}
        </form>
      </motion.div>

      <div className="w-full max-w-sm mx-auto px-5 pb-8 flex-shrink-0">
        <SignupProgressDots currentStep={currentStep} totalSteps={totalSteps} />
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            type="button"
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 text-gray-800 font-medium text-base py-3.5 px-5 rounded-lg hover:opacity-90 transition-opacity mt-6"
            style={{ backgroundColor: '#1bb0f2' }}
          >
            Next <FiArrowRight />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}