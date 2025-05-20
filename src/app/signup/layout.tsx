'use client';

import React from 'react';
import { SignupProvider } from '@/context/SignupContext';
import SignupHeader from '@/components/SignupHeader';

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SignupProvider>
      <main className="relative w-full h-[100dvh] overflow-hidden flex flex-col bg-background-primary">
        <SignupHeader />
        <div className="flex-grow flex flex-col items-center w-full overflow-y-auto">
          {children}
        </div>
      </main>
    </SignupProvider>
  );
} 