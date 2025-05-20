'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupContext } from '@/context/SignupContext';
import Link from 'next/link';
import { FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import SignupProgressDots from '@/components/SignupProgressDots'; // Import dots

export default function PasswordPage() {
  const router = useRouter();
  const { setSignupData } = useSignupContext();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 4;
  const currentStep = 2; // Step 2

  // Password validation criteria checks (can be added to validatePassword)
  const checks = {
    minLength: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const validatePassword = () => {
    if (!checks.minLength) return 'Password must be at least 8 characters long.';
    if (!checks.lowercase) return 'Password must include a lowercase letter.';
    if (!checks.uppercase) return 'Password must include an uppercase letter.';
    if (!checks.number) return 'Password must include a number.';
    if (!checks.special) return 'Password must include a special character.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const handleNext = () => {
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSignupData(prev => ({ ...prev, password })); // Store the password
    router.push('/signup/identity'); // Navigate to the identity step
  };

  return (
    <>
      {/* Main content block matching email */}
      <div className="flex-grow flex flex-col items-start justify-start px-5 pt-2 w-full max-w-sm mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-2 text-left">Set A Password</h1>

        {/* Password Criteria List */}
        <div className="mb-6 text-sm text-text-secondary">
          <p className="font-medium underline mb-1">Must meet criteria.</p>
          <ul className="list-none space-y-0.5">
            <li className={checks.minLength ? 'text-green-400' : ''}>8 characters minimum.</li>
            <li className={checks.lowercase ? 'text-green-400' : ''}>1 lowercase character</li>
            <li className={checks.uppercase ? 'text-green-400' : ''}>1 uppercase character</li>
            <li className={checks.special ? 'text-green-400' : ''}>1 special character</li>
            <li className={checks.number ? 'text-green-400' : ''}>1 number character</li>
          </ul>
        </div>

        <form 
          id="password-form"
          onSubmit={(e) => { e.preventDefault(); handleNext(); }} 
          className="space-y-6 w-full"
          noValidate
        >
          {/* Password Input */}
          <div className="relative">
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              aria-describedby={error ? "password-error" : undefined}
              className="w-full appearance-none bg-transparent border border-text-secondary text-white placeholder-gray-400 text-base p-3 pr-10 rounded-lg focus:outline-none focus:border-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div className="relative">
            <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
              aria-describedby={error ? "password-error" : undefined}
              className="w-full appearance-none bg-transparent border border-text-secondary text-white placeholder-gray-400 text-base p-3 pr-10 rounded-lg focus:outline-none focus:border-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              tabIndex={-1}
            >
              {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          {/* Error message area */}
          {error && <p id="password-error" className="text-red-500 text-sm text-left">{error}</p>}
        </form>
      </div>

      {/* Footer block matching email */}
      <div className="w-full max-w-sm mx-auto px-5 pb-8">
        <SignupProgressDots currentStep={currentStep} totalSteps={totalSteps} />
        <button
          type="submit"
          form="password-form"
          className="w-full flex items-center justify-center gap-2 text-gray-800 font-medium text-base py-3.5 px-5 rounded-lg hover:opacity-90 transition-opacity mt-6"
          style={{ backgroundColor: '#1bb0f2' }}
        >
          Next <FiArrowRight />
        </button>
        <div className="text-center mt-4">
          <Link href="/signup/email" className="text-sm text-gray-400 hover:text-white hover:underline">Back</Link>
        </div>
      </div>
    </>
  );
} 