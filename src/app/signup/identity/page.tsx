'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupContext } from '@/context/SignupContext';
import Link from 'next/link';
import { FiUser, FiArrowRight, FiCalendar } from 'react-icons/fi';
import SignupProgressDots from '@/components/SignupProgressDots';
import { parse, isValid, isBefore, subYears } from 'date-fns';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion } from 'framer-motion'

export default function IdentityPage() {
  const router = useRouter();
  const { signupData, setSignupData } = useSignupContext();
  const [firstName, setFirstName] = useState(signupData.firstName || '');
  const [lastName, setLastName] = useState(signupData.lastName || '');
  const [dob, setDob] = useState(signupData.dob || '');
  const [error, setError] = useState('');

  const totalSteps = 4;
  const currentStep = 3;

  const handleDobInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formattedValue = '';

    if (value.length > 0) {
      formattedValue += value.substring(0, 2);
    }
    if (value.length >= 3) {
      formattedValue += '/' + value.substring(2, 4);
    }
    if (value.length >= 5) {
      formattedValue += '/' + value.substring(4, 8);
    }
    
    formattedValue = formattedValue.substring(0, 10);

    setDob(formattedValue);
  };

  const validateForm = () => {
    if (!firstName.trim()) return 'First name is required.';
    if (!lastName.trim()) return 'Last name is required.';
    if (!dob) return 'Date of Birth is required.';
    
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(dob)) {
        return 'Date of Birth must be in MM/DD/YYYY format.';
    }
    
    const birthDate = parse(dob, 'MM/dd/yyyy', new Date());
    if (!isValid(birthDate)) return 'Invalid Date of Birth entered (e.g., invalid day or month).';

    const eighteenYearsAgo = subYears(new Date(), 18);
    if (isBefore(eighteenYearsAgo, birthDate)) {
        return 'You must be at least 18 years old.';
    }
    return '';
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSignupData(prev => ({ ...prev, firstName, lastName, dob }));
    router.push('/signup/username');
  };

  return (
    <>
      {/* Main content block matching email */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex-grow flex flex-col items-start justify-start px-5 pt-2 w-full max-w-sm mx-auto">
          <h1 className="text-2xl font-semibold text-white mb-1">Verify Your Identity</h1>
          <p className="text-sm text-text-secondary mb-6">
            Please make sure your details match exactly what&apos;s on your photo I.D. or passport.
          </p>

          <form 
            id="identity-form"
            onSubmit={handleNext} 
            className="space-y-6 w-full"
            noValidate
          >
            {/* First Name */}
            <div className="relative">
              <label htmlFor="first-name" className="sr-only">First Name</label>
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <Input
                id="first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
                className="w-full appearance-none bg-transparent border border-text-secondary text-white placeholder-gray-400 text-base pl-10 p-3 rounded-lg focus:outline-none focus:border-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]"
              />
            </div>

            {/* Last Name */}
            <div className="relative">
              <label htmlFor="last-name" className="sr-only">Last Name</label>
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <Input
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
                className="w-full appearance-none bg-transparent border border-text-secondary text-white placeholder-gray-400 text-base pl-10 p-3 rounded-lg focus:outline-none focus:border-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]"
              />
            </div>

            {/* Date of Birth - Text input with MM/DD/YYYY format */}
            <div className="relative">
              <label htmlFor="dob" className="sr-only">Date of Birth</label>
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <Input
                id="dob"
                type="text"
                value={dob}
                onChange={handleDobInputChange}
                placeholder="MM/DD/YYYY"
                required
                maxLength={10}
                inputMode="numeric"
                className="w-full appearance-none bg-transparent border border-text-secondary text-white placeholder-gray-400 text-base pl-10 p-3 rounded-lg focus:outline-none focus:border-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]"
              />
            </div>

            {/* Error message inside the form - remove wrapper */}
            {error && <p className="text-red-500 text-sm text-left">{error}</p>}
          </form>
      </motion.div>
      {/* Footer block matching email */}
      <div className="w-full max-w-sm mx-auto px-5 pb-8">
        <SignupProgressDots currentStep={currentStep} totalSteps={totalSteps} />
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            type="submit"
            form="identity-form"
            className="w-full flex items-center justify-center gap-2 text-gray-800 font-medium text-base py-3.5 px-5 rounded-lg hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-in-out mt-6 disabled:opacity-70"
            style={{ backgroundColor: '#1bb0f2' }}
          >
            Next <FiArrowRight />
          </Button>
        </motion.div>
        <div className="text-center mt-4">
          <Link href="/signup/password" className="text-sm text-gray-400 hover:text-white hover:underline">Back</Link>
        </div>
      </div>
    </>
  );
} 