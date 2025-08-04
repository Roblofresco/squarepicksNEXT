'use client'

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, EmailAuthProvider, reauthenticateWithCredential, updateEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, User, Mail, Save, Shield, KeyRound, Loader2, AlertCircle, ArrowRight, X } from 'lucide-react';

interface UserProfileData {
  displayName: string;
  email: string;
  phone?: string;
}

const AccountSettingsPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for Change Email Modal
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);
  const [changeEmailSuccess, setChangeEmailSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setProfileData({
              displayName: userData.display_name || currentUser.displayName || 'User',
              email: userData.email || currentUser.email || 'N/A',
              phone: userData.phone || '',
            });
            setDisplayNameInput(userData.display_name || currentUser.displayName || 'User');
            setPhoneInput(userData.phone || '');
          } else {
            setError("User data not found. Please try again later.");
            // Set defaults if user doc doesn't exist but auth user does
            setProfileData({ displayName: currentUser.displayName || 'User', email: currentUser.email || 'N/A', phone: '' });
            setDisplayNameInput(currentUser.displayName || 'User');
            setPhoneInput('');
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load your profile data. Please refresh the page.");
           // Set defaults on error
          setProfileData({ displayName: currentUser.displayName || 'User', email: currentUser.email || 'N/A', phone: '' });
          setDisplayNameInput(currentUser.displayName || 'User');
          setPhoneInput('');
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleDisplayNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisplayNameInput(e.target.value);
    setSuccessMessage(null); // Clear success message on new input
    setError(null); // Clear error on new input
  };

  const handlePhoneInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhoneInput(e.target.value);
    setSuccessMessage(null);
    setError(null);
  };

  const handleSubmitPersonalInformation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !profileData) return;

    const isDisplayNameChanged = displayNameInput.trim() !== profileData.displayName;
    const isPhoneChanged = phoneInput.trim() !== (profileData.phone || '');
    const isDisplayNameValid = displayNameInput.trim().length >= 3;

    if (!isDisplayNameChanged && !isPhoneChanged) {
      // No actual change
      return;
    }
    if (isDisplayNameChanged && !isDisplayNameValid) {
        setError("Display name must be at least 3 characters long.");
        return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const dataToUpdate: { [key: string]: any } = {};

      if (isDisplayNameChanged && isDisplayNameValid) {
        dataToUpdate.display_name = displayNameInput.trim();
      }
      if (isPhoneChanged) {
        // Add phone validation here if needed, e.g., format
        dataToUpdate.phone = phoneInput.trim();
      }

      if (Object.keys(dataToUpdate).length > 0) {
        await updateDoc(userDocRef, dataToUpdate);
        setProfileData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            displayName: dataToUpdate.display_name !== undefined ? dataToUpdate.display_name : prev.displayName,
            phone: dataToUpdate.phone !== undefined ? dataToUpdate.phone : prev.phone,
          };
        });
        setSuccessMessage("Information updated successfully!");
      }
    } catch (err) {
      console.error("Error updating information:", err);
      setError("Failed to update information. Please try again.");
    }
    setIsSaving(false);
  };

  const handleChangeEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsChangingEmail(true);
    setChangeEmailError(null);
    setChangeEmailSuccess(null);

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update email in Firebase Auth
      await updateEmail(user, newEmail);

      // Update email in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { email: newEmail });

      // Update local state
      setProfileData(prev => prev ? { ...prev, email: newEmail } : null);
      setChangeEmailSuccess("Email updated successfully! A verification email has been sent to your new address.");
      setShowChangeEmailModal(false);
      setNewEmail('');
      setCurrentPassword('');
    } catch (err: any) {
      console.error("Error updating email:", err);
      if (err.code === 'auth/wrong-password') {
        setChangeEmailError("Incorrect password. Please try again.");
      } else if (err.code === 'auth/email-already-in-use') {
        setChangeEmailError("This email address is already in use by another account.");
      } else if (err.code === 'auth/invalid-email') {
        setChangeEmailError("The new email address is invalid.");
      }
       else {
        setChangeEmailError("Failed to update email. Please try again.");
      }
    }
    setIsChangingEmail(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-1" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
            <button 
                onClick={() => router.push('/profile')}
                className="flex items-center text-sm text-accent-1 hover:text-accent-1/80 active:scale-95 focus:scale-105 transition-all duration-150 outline-none"
            >
                <ArrowLeft size={18} className="mr-1" />
                Back to Profile
            </button>
            <h1 className="text-2xl font-semibold text-text-primary">Account Settings</h1>
             {/* Placeholder for symmetry, or add a right-side action if needed */}
            <div style={{ width: '110px' }}></div> 
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg p-3 mb-4 flex items-center">
            <AlertCircle size={18} className="mr-2 text-red-500" /> 
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 text-sm rounded-lg p-3 mb-4">
            {successMessage}
          </div>
        )}

        {/* Personal Information Section */}
        <div className="bg-gradient-to-b from-background-primary to-[#eeeeee] to-5% p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mt-4 mb-4 flex items-center">
            <User size={20} className="mr-2 text-accent-1" /> Personal Information
          </h2>
          <form onSubmit={handleSubmitPersonalInformation}>
            <div className="mb-4">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayNameInput}
                onChange={handleDisplayNameChange}
                className="w-full p-2.5 bg-white border border-gray-400 rounded-md focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800"
                minLength={3}
                maxLength={30}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneInput}
                onChange={handlePhoneInputChange}
                className="w-full p-2.5 bg-white border border-gray-400 rounded-md focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800"
                placeholder="(123) 456-7890"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="w-full p-2.5 bg-gray-200 border border-gray-400 rounded-md text-gray-600 flex items-center">
                <Mail size={16} className="mr-2 text-gray-500" />
                {profileData?.email || 'Loading...'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Email address cannot be changed here.</p>
            </div>
            <button 
              type="submit"
              disabled={isSaving || ((displayNameInput.trim() === (profileData?.displayName || '')) && (phoneInput.trim() === (profileData?.phone || ''))) || (displayNameInput.trim().length > 0 && displayNameInput.trim().length < 3) }
              className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-accent-1 text-white font-medium rounded-md hover:bg-accent-1/90 focus:ring-2 focus:ring-accent-1 focus:ring-offset-2 focus:ring-offset-[#eeeeee] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isSaving ? <><Loader2 size={18} className="animate-spin mr-2" /> Saving...</> : <><Save size={18} className="mr-2"/> Save Changes</>}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={() => {
                setShowChangeEmailModal(true);
                setChangeEmailError(null);
                setChangeEmailSuccess(null);
              }}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-gray-200 border border-gray-400 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-accent-1 focus:ring-offset-2 focus:ring-offset-[#eeeeee] active:scale-95 focus:scale-105 transition-all duration-150"
            >
              Change Email Address
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-gradient-to-b from-background-primary to-[#eeeeee] to-5% p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Shield size={20} className="mr-2 text-accent-1" /> Security
          </h2>
          <Link
            href="/profile/settings/change-password"
            className="flex items-center justify-between w-full p-3 bg-white hover:bg-gray-50 rounded-md border border-gray-400 transition-colors duration-150 text-gray-800 active:scale-95 focus:scale-105 transition-all outline-none"
          >
            <div className="flex items-center">
                <KeyRound size={18} className="mr-3 text-gray-500"/>
                Change Password
            </div>
            <ArrowRight size={16} className="text-gray-500" />
          </Link>
          <Link
            href="/profile/settings/personal-details"
            className="mt-4 flex items-center justify-between w-full p-3 bg-white hover:bg-gray-50 rounded-md border border-gray-400 transition-colors duration-150 text-gray-800 active:scale-95 focus:scale-105 transition-all outline-none"
          >
            <div className="flex items-center">
                <User size={18} className="mr-3 text-gray-500"/>
                Edit Personal Details
            </div>
            <ArrowRight size={16} className="text-gray-500" />
          </Link>
        </div>

      </div>
      {/* Change Email Modal */}
      {showChangeEmailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-background-primary to-[#eeeeee] to-5% p-6 sm:p-8 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Change Email Address</h3>
              {/* <button onClick={() => {
                setShowChangeEmailModal(false);
                setNewEmail('');
                setCurrentPassword('');
                setChangeEmailError(null);
                setChangeEmailSuccess(null);
                }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button> */}
            </div>

            {changeEmailError && (
              <div className="bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg p-3 mb-4 flex items-center">
                <AlertCircle size={18} className="mr-2 text-red-500" />
                {changeEmailError}
              </div>
            )}
            {changeEmailSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 text-sm rounded-lg p-3 mb-4">
                {changeEmailSuccess}
              </div>
            )}

            <form onSubmit={handleChangeEmail}>
              <div className="mb-4">
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  New Email Address
                </label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-400 rounded-md focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password (for verification)
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-400 rounded-md focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  type="submit"
                  disabled={isChangingEmail || !newEmail || !currentPassword}
                  className="w-full flex items-center justify-center px-6 py-2.5 bg-accent-1 text-white font-medium rounded-md hover:bg-accent-1/90 focus:ring-2 focus:ring-accent-1 focus:ring-offset-2 focus:ring-offset-[#eeeeee] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {isChangingEmail ? <><Loader2 size={18} className="animate-spin mr-2" /> Updating Email...</> : 'Update Email'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowChangeEmailModal(false);
                    setNewEmail('');
                    setCurrentPassword('');
                    setChangeEmailError(null);
                    setChangeEmailSuccess(null);
                  }}
                  className="w-full flex items-center justify-center px-6 py-2.5 bg-gray-200 border border-gray-400 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-accent-1 focus:ring-offset-2 focus:ring-offset-[#eeeeee] transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsPage; 