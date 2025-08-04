'use client';

import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MailCheck, Loader2, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';

const EmailVerificationBanner = () => {
  const { userId, emailVerified, resendVerificationEmail, isLoading: walletLoading } = useWallet();
  const [isResending, setIsResending] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const handleResendEmail = async () => {
    if (!resendVerificationEmail) return;
    setIsResending(true);
    const result = await resendVerificationEmail();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsResending(false);
  };

  if (!isBannerVisible || walletLoading || !userId || emailVerified === true) {
    return null;
  }

  if (userId && emailVerified === false) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-100 border-b border-slate-300 text-slate-800 p-3 shadow-md">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between text-sm">
          <div className="flex items-center mb-2 sm:mb-0">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-slate-600" />
            <p>
              Your email address is not verified. Please check your inbox (and spam folder) or resend the verification email to access all features.
            </p>
          </div>
          <div className="flex items-center">
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-400 hover:text-slate-800 whitespace-nowrap mr-3"
            >
              {isResending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MailCheck className="mr-2 h-4 w-4" />
              )}
              {isResending ? 'Sending...' : 'Resend Email'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsBannerVisible(false)}
              className="text-slate-600 hover:bg-slate-200 hover:text-slate-800 p-1"
              aria-label="Close verification banner"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default EmailVerificationBanner;
