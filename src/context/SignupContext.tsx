'use client'

import React, { createContext, useState, useContext, Dispatch, SetStateAction } from 'react';

interface SignupData {
  email: string;
  password?: string; // Optional until set
  firstName?: string;
  lastName?: string;
  dob?: string; // Store as string (e.g., YYYY-MM-DD), validate format later
  username?: string;
  termsAccepted?: boolean;
}

interface SignupContextProps {
  signupData: SignupData;
  setSignupData: Dispatch<SetStateAction<SignupData>>;
}

const defaultState: SignupData = {
  email: '',
  termsAccepted: false,
};

export const SignupContext = createContext<SignupContextProps>({
  signupData: defaultState,
  setSignupData: () => {},
});

export const useSignupContext = () => useContext(SignupContext);

export const SignupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [signupData, setSignupData] = useState<SignupData>(defaultState);

  // Optionally persist/retrieve state from localStorage here if needed

  return (
    <SignupContext.Provider value={{ signupData, setSignupData }}>
      {children}
    </SignupContext.Provider>
  );
};