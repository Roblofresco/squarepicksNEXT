'use client'

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, User, Calendar, Home, Save, Loader2, AlertCircle } from 'lucide-react';

interface PersonalDetailsData {
  firstName: string;
  lastName: string;
  dob: string; // Date of Birth
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

const PersonalDetailsPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [details, setDetails] = useState<PersonalDetailsData | null>(null);

  // Input states
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [dobInput, setDobInput] = useState('');
  const [streetInput, setStreetInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [stateInput, setStateInput] = useState('');
  const [postalCodeInput, setPostalCodeInput] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const fetchedDetails: PersonalDetailsData = {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              dob: userData.dob || '',
              street: userData.street || '',
              city: userData.city || '',
              state: userData.state || '',
              postalCode: userData.postalCode || '',
            };
            setDetails(fetchedDetails);
            setFirstNameInput(fetchedDetails.firstName);
            setLastNameInput(fetchedDetails.lastName);
            setDobInput(fetchedDetails.dob);
            setStreetInput(fetchedDetails.street);
            setCityInput(fetchedDetails.city);
            setStateInput(fetchedDetails.state);
            setPostalCodeInput(fetchedDetails.postalCode);
          } else {
            // Initialize with empty strings if no data exists, allowing user to create it
            const emptyDetails: PersonalDetailsData = { firstName: '', lastName: '', dob: '', street: '', city: '', state: '', postalCode: '' };
            setDetails(emptyDetails);
          }
        } catch (err) {
          console.error("Error fetching user personal details:", err);
          setError("Failed to load your personal details. Please refresh the page or try again later.");
          setDetails({ firstName: '', lastName: '', dob: '', street: '', city: '', state: '', postalCode: '' }); // Fallback
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setSuccessMessage(null);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !details) return;

    const currentInputs: PersonalDetailsData = {
      firstName: firstNameInput.trim(),
      lastName: lastNameInput.trim(),
      dob: dobInput.trim(),
      street: streetInput.trim(),
      city: cityInput.trim(),
      state: stateInput.trim(),
      postalCode: postalCodeInput.trim(),
    };

    // Age validation (must be 21 or older)
    if (currentInputs.dob) {
      const birthDate = new Date(currentInputs.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 21) {
        try {
          await auth.signOut();
          // The onAuthStateChanged listener will handle redirecting to /login
          // No need to explicitly push router here if onAuthStateChanged handles it.
        } catch (signOutError) {
          console.error("Error signing out user:", signOutError);
          // Optionally set a generic error if sign out fails, though the goal is silent logout
          setError("An error occurred. Please try again.");
        }
        return; // Stop further processing and saving
      }
    }

    // Basic validation: check if required fields are filled (e.g., first name, last name)
    if (!currentInputs.firstName || !currentInputs.lastName) {
        setError("First name and last name are required.");
        return;
    }
    // Add more specific validations as needed (e.g., DOB format, postal code format)

    const dataToUpdate: Partial<PersonalDetailsData> = {};
    let hasChanges = false;

    (Object.keys(currentInputs) as Array<keyof PersonalDetailsData>).forEach(key => {
      if (currentInputs[key] !== details[key]) {
        dataToUpdate[key] = currentInputs[key];
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      // setSuccessMessage("No changes to save."); // Optional: inform user if no changes
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, dataToUpdate);
      setDetails(currentInputs); // Update local state with new details
      setSuccessMessage("Personal details updated successfully!");
    } catch (err) {
      console.error("Error updating personal details:", err);
      setError("Failed to update details. Please try again.");
    }
    setIsSaving(false);
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
            onClick={() => router.push('/profile/settings')}
            className="flex items-center text-sm text-accent-1 hover:text-accent-1/80 active:scale-95 focus:scale-105 transition-all duration-150 outline-none"
          >
            <ArrowLeft size={18} className="mr-1" />
            Back to Settings
          </button>
          <h1 className="text-2xl font-semibold text-text-primary">Edit Personal Details</h1>
          <div style={{ width: '130px' }}></div> {/* Placeholder for symmetry */}
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

        <form onSubmit={handleSubmit} className="bg-gradient-to-b from-background-primary to-[#eeeeee] to-5% p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="firstName"
                  value={firstNameInput}
                  onChange={handleInputChange(setFirstNameInput)}
                  className="w-full p-2.5 pl-10 bg-white border border-gray-400 rounded-md focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800"
                  required
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <div className="relative">
                 <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="lastName"
                  value={lastNameInput}
                  onChange={handleInputChange(setLastNameInput)}
                  className="w-full p-2.5 pl-10 bg-white border border-gray-400 rounded-md focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800"
                  required
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="md:col-span-2">
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date" // Using date type for better UX
                  id="dob"
                  value={dobInput}
                  onChange={handleInputChange(setDobInput)}
                  className="w-full p-2.5 pl-10 bg-white border border-gray-400 rounded-md focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800"
                />
              </div>
            </div>

            {/* Street Address */}
            <div className="md:col-span-2">
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <div className="relative">
                <Home size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="street"
                  value={streetInput}
                  onChange={handleInputChange(setStreetInput)}
                  className="w-full p-2.5 pl-10 bg-white border border-gray-400 rounded-md focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                value={cityInput}
                onChange={handleInputChange(setCityInput)}
                className="w-full p-2.5 bg-white border border-gray-400 rounded-md focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800"
              />
            </div>

            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State / Province
              </label>
              <input
                type="text"
                id="state"
                value={stateInput}
                onChange={handleInputChange(setStateInput)}
                className="w-full p-2.5 bg-white border border-gray-400 rounded-md focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800"
              />
            </div>

            {/* Postal Code */}
            <div className="md:col-span-2">
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Postal / Zip Code
              </label>
              <input
                type="text"
                id="postalCode"
                value={postalCodeInput}
                onChange={handleInputChange(setPostalCodeInput)}
                className="w-full p-2.5 bg-white border border-gray-400 rounded-md focus:ring-2 focus:ring-accent-1 focus:border-accent-1 outline-none transition-colors duration-150 text-gray-800"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving || isLoading}
            className="mt-6 w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-accent-1 text-white font-medium rounded-md hover:bg-accent-1/90 focus:ring-2 focus:ring-accent-1 focus:ring-offset-2 focus:ring-offset-[#eeeeee] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus:scale-105 transition-all duration-150"
          >
            {isSaving ? <><Loader2 size={18} className="animate-spin mr-2" /> Saving...</> : <><Save size={18} className="mr-2"/> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PersonalDetailsPage; 