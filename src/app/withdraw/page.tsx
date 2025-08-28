'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { WalletMoneyContainer } from '@/components/ui/WalletMoneyContainer';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion'

const withdrawalSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .positive({ message: 'Amount must be positive.' })
    .min(5, { message: 'Minimum withdrawal amount is $5.00.' }),
  paypalEmail: z.string()
    .email({ message: 'Please enter a valid PayPal email address.' })
    .min(1, { message: 'PayPal email is required.' }),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

export default function WithdrawPage() {
  const router = useRouter();
  const { hasWallet, balance, isLoading: walletLoading, userId } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
  });

  useEffect(() => {
    if (!walletLoading) {
      if (!userId) {
        router.push('/login?redirect=/withdraw');
      } else if (!hasWallet) {
        toast.error("You must set up your wallet before making a withdrawal.");
        router.push('/wallet');
      }
    }
  }, [userId, hasWallet, walletLoading, router]);

  const onSubmit = async (data: WithdrawalFormValues) => {
    if (data.amount > balance) {
      setError('amount', {
        type: 'manual',
        message: 'Withdrawal amount cannot exceed your current balance.',
      });
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting withdrawal request...');

    try {
      const app = getApp();
      const functions = getFunctions(app, 'us-east1');
      const requestWithdrawalCallable = httpsCallable(functions, 'requestWithdrawal');

      const result: any = await requestWithdrawalCallable({
        amount: data.amount,
        method: 'paypal',
        details: {
          paypalEmail: data.paypalEmail,
        },
      });

      if (result.data.success) {
        toast.success('Withdrawal request submitted successfully! It is now pending review.', { id: toastId });
        router.push('/wallet');
      } else {
        throw new Error(result.data.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
      console.error("Error requesting withdrawal:", error);
      const errorMessage = error.details?.message || error.message || 'Failed to submit withdrawal request.';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/wallet');
  };

  if (walletLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-primary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent-1 mb-4" />
        <p className="text-gray-300">Loading wallet status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-text-primary p-0 sm:p-0 lg:p-0">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          className="mb-3 pl-4 sm:pl-6 mt-3 sm:mt-4" 
          items={[
            { label: 'Profile', href: '/profile' }
          ]}
          appendEllipsisHref="/wallet"
        />

        {/* Title */}
        <div className="mb-8 pl-4 sm:pl-6">
          <h1 className="text-3xl font-bold text-text-primary">Request Withdrawal</h1>
          <p className="mt-3 text-sm text-gray-300">Withdraw your funds to your PayPal account. Minimum withdrawal is $5.00.</p>
        </div>

        {/* Content */}
        <div className="flex justify-center mt-16">
          <div className="w-full max-w-lg">
            <WalletMoneyContainer
              title="Withdraw Funds"
              variant="blue"
              className="animate-fadeIn"
            >
              <div className="flex flex-col min-h-[30vh]">
                <div className="px-4 sm:px-6 pb-4">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-white/90">
                        Amount (USD) <span className="text-xs text-white/50">(Min $5.00)</span>
                      </Label>
                      <div className="relative mt-1 rounded-md">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-white/70 sm:text-sm">$</span>
                        </div>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder="0.00"
                          {...register('amount')}
                          className="block w-full rounded-md bg-white/5 text-white placeholder-white/30 pl-7 pr-4 py-2 border-white/10 focus:border-accent-1 focus:ring-accent-1 sm:text-sm text-lg"
                          disabled={isSubmitting}
                        />
                      </div>
                      <p className="text-sm text-white/70 mt-1">Current Balance: ${balance.toFixed(2)}</p>
                      {errors.amount && (
                        <p className="text-sm text-red-400 mt-1">{errors.amount.message}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-white/90">
                        PayPal Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...register('paypalEmail')}
                        className="block w-full rounded-md bg-white/5 text-white placeholder-white/30 pr-4 py-2 border-white/10 focus:border-accent-1 focus:ring-accent-1 sm:text-sm text-lg"
                        disabled={isSubmitting}
                      />
                      {errors.paypalEmail && (
                        <p className="text-sm text-red-400 mt-1">{errors.paypalEmail.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-accent-1 hover:bg-accent-1/90 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  </form>
                </div>
                <div className="mt-auto border-t border-white/10 p-4">
                  <p className="text-xs text-white/70 text-center">
                    Withdrawal requests are reviewed and processed within 3-5 business days.
                  </p>
                </div>
              </div>
            </WalletMoneyContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

