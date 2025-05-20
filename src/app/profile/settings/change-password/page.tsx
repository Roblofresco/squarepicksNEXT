'use client'

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { auth } from '@/lib/firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  User as FirebaseUser
} from 'firebase/auth';
import { ArrowLeft, AlertCircle, KeyRound as LucideKeyRound, CheckCircle, XCircle as LucideXCircle } from 'lucide-react';

const PasswordToggle = ({ visible, setVisible }: { visible: boolean, setVisible: (vis: boolean) => void }) => (
  <button 
    type="button" 
    onClick={() => setVisible(!visible)} 
    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
    aria-label={visible ? 'Hide password' : 'Show password'}
    tabIndex={-1}
  >
    {visible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
  </button>
);

const CriteriaItem = ({ text, met }: { text: string, met: boolean }) => (
  <li className={`flex items-center text-sm ${met ? 'text-green-600' : 'text-gray-700'}`}>
    {met ? <CheckCircle size={14} className="mr-2" /> : <LucideXCircle size={14} className="mr-2" />}
    {text}
  </li>
);

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checks = {
    minLength: newPassword.length >= 8,
    lowercase: /[a-z]/.test(newPassword),
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const validateNewPassword = () => {
    if (!checks.minLength) return 'New password must be at least 8 characters long.';
    if (!checks.lowercase) return 'New password must include a lowercase letter.';
    if (!checks.uppercase) return 'New password must include an uppercase letter.';
    if (!checks.number) return 'New password must include a number.';
    if (!checks.special) return 'New password must include a special character.';
    if (newPassword !== confirmNewPassword) return 'New passwords do not match.';
    return '';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const validationError = validateNewPassword();
    if (validationError) {
      setError(validationError);
      return;
    }
    const user = auth.currentUser as FirebaseUser;
    if (!user || !user.email) {
      setError("No user is currently signed in or user email is missing. Please log in again.");
      return;
    }
    setIsLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccessMessage("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      console.error("Error changing password:", err);
      if (err.code === 'auth/wrong-password') {
        setError("Incorrect current password. Please try again.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many attempts. Please try again later.");
      } else if (err.code === 'auth/weak-password') {
         setError("The new password is too weak. Please ensure it meets all criteria.");
      } else {
        setError("Failed to change password. An unexpected error occurred.");
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary p-4 sm:p-6 lg:p-8">
      <div className="max-w-md mx-auto">
        <div className="mb-5">
            <div className="mb-3">
                <button 
                    onClick={() => router.push('/profile/settings')}
                    className="flex items-center text-sm text-accent-1 hover:text-accent-1/80 transition-colors duration-150"
                >
                    <ArrowLeft size={18} className="mr-1" />
                    Back to Settings
                </button>
            </div>
            <div className="text-center">
                <h1 className="text-3xl font-bold text-text-primary">Change Password</h1>
            </div>
        </div>

        <div className="bg-gradient-to-b from-background-primary to-[#eeeeee] to-5% p-6 rounded-lg">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg p-3 mb-4 flex items-center">
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 text-sm rounded-lg p-3 mb-4">
              {successMessage}
            </div>
          )}

          <form 
            id="change-password-form"
            onSubmit={handleSubmit} 
            className="space-y-5 w-full flex flex-col items-center mt-6"
            noValidate
          >
            <div className="relative w-full">
              <label htmlFor="current-password" className="sr-only">Current Password</label>
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
                required
                className="w-full p-3 pr-10 bg-white border border-gray-400 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800 placeholder-gray-500"
              />
              <PasswordToggle visible={showCurrentPassword} setVisible={setShowCurrentPassword} />
            </div>

            <div className="text-sm text-gray-700 w-full">
              <p className="font-medium underline mb-1 text-gray-900">New password must meet criteria:</p>
              <ul className="list-none space-y-0.5">
                <CriteriaItem text="8 characters minimum." met={checks.minLength} />
                <CriteriaItem text="1 lowercase character" met={checks.lowercase} />
                <CriteriaItem text="1 uppercase character" met={checks.uppercase} />
                <CriteriaItem text="1 special character" met={checks.special} />
                <CriteriaItem text="1 number character" met={checks.number} />
              </ul>
            </div>

            <div className="relative w-full">
              <label htmlFor="new-password" className="sr-only">New Password</label>
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                required
                className="w-full p-3 pr-10 bg-white border border-gray-400 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800 placeholder-gray-500"
              />
              <PasswordToggle visible={showNewPassword} setVisible={setShowNewPassword} />
            </div>

            <div className="relative w-full">
              <label htmlFor="confirm-new-password" className="sr-only">Confirm New Password</label>
              <input
                id="confirm-new-password"
                type={showConfirmNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm New Password"
                required
                className="w-full p-3 pr-10 bg-white border border-gray-400 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800 placeholder-gray-500"
              />
              <PasswordToggle visible={showConfirmNewPassword} setVisible={setShowConfirmNewPassword} />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-accent-1 text-white font-medium rounded-md hover:bg-accent-1/90 focus:ring-2 focus:ring-accent-1 focus:ring-offset-2 focus:ring-offset-[#eeeeee] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <LucideKeyRound size={18} className="mr-2"/> Update Password 
                </> 
              )}
            </button>
          </form>
        </div> 

      </div>
    </div>
  );
}
