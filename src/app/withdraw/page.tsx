'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { toast } from 'react-hot-toast';

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
    <div className="min-h-screen bg-background-primary text-white flex flex-col items-center p-4 pt-10">
      <div className="w-full max-w-lg">
        <div className="relative mb-8 text-center">
          <button
            onClick={handleBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 active:scale-95 focus:scale-105 transition-all duration-150 outline-none"
            aria-label="Go back to wallet"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-white">Request Withdrawal</h1>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 border border-gray-200 animate-fadeIn">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (USD)
              </Label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount')}
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-500 pl-7 pr-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-lg"
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Current Balance: ${balance.toFixed(2)}</p>
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="paypalEmail" className="block text-sm font-medium text-gray-700 mb-1">
                PayPal Email
              </Label>
              <Input
                id="paypalEmail"
                type="email"
                placeholder="you@example.com"
                {...register('paypalEmail')}
                className="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-lg"
                disabled={isSubmitting}
              />
              {errors.paypalEmail && (
                <p className="text-sm text-red-600 mt-1">{errors.paypalEmail.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2 text-white font-medium text-base py-3.5 px-5 rounded-lg bg-accent-1 hover:bg-accent-1/90 transition-opacity"
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
            <p className="text-xs text-gray-500 text-center mt-4">
              Withdrawal requests are reviewed and processed within 3-5 business days.
            </p>
        </div>
      </div>
    </div>
  );
}

