'use client'

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletMoneyContainer } from '@/components/ui/WalletMoneyContainer';
import { PayPalDepositButton } from '@/components/ui/PayPalDepositButton';

import { useWallet } from '@/hooks/useWallet';
import { ArrowLeft, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import Head from 'next/head';

const depositSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 5 && num <= 1000;
  }, 'Amount must be between $5 and $1000'),
});

type DepositFormData = z.infer<typeof depositSchema>;

const MIN_DEPOSIT = 5;
const MAX_DEPOSIT = 1000;

export default function DepositPage() {
  const router = useRouter();
  const { hasWallet, isLoading: walletLoading, userId } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState<string>('');

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: '',
    },
  });

  // Redirect if not authenticated or no wallet
  useEffect(() => {
    if (!walletLoading) {
      if (!userId) {
        router.push('/login?redirect=/deposit');
      } else if (!hasWallet) {
        console.warn("Deposit attempt without completed wallet setup.");
        router.push('/wallet');
      }
    }
  }, [userId, hasWallet, walletLoading, router]);

  const handleAmountSubmit = (data: DepositFormData) => {
    const amount = parseFloat(data.amount);
    if (amount >= MIN_DEPOSIT && amount <= MAX_DEPOSIT) {
      setSelectedAmount(amount);
      setSelectedPaymentMethod('paypal'); // Auto-select PayPal since it's the only option
      setError(null);
    }
  };

  const handlePayPalSuccess = (amount: number) => {
    setSuccessAmount(amount.toFixed(2));
    setSuccess(true);
  };

  const handlePayPalError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleBackToForm = () => {
    setSelectedAmount(null);
    setSelectedPaymentMethod(null);
    setSuccess(false);
    setError(null);
    form.reset();
  };

  const handlePaymentMethodSelect = (method: 'paypal') => {
    setSelectedPaymentMethod(method);
  };

  if (walletLoading) {
    return (
      <>
        <Head>
          <title>Deposit Funds - SquarePicks</title>
        </Head>
        <div className="min-h-screen bg-background-primary text-text-primary p-0 sm:p-0 lg:p-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
          {/* Breadcrumbs */}
          <div className="mb-3 pl-4 sm:pl-6 mt-3 sm:mt-4">
            <Skeleton className="h-6 w-48" />
          </div>
          
          {/* Title */}
          <div className="mb-4 pl-4 sm:pl-6">
            <Skeleton className="h-8 w-64 mb-3" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          {/* Content */}
          <div className="flex justify-center mt-16">
            <div className="w-full max-w-lg">
              <WalletMoneyContainer title="Deposit Funds" variant="blue" className="animate-fadeIn">
                <div className="p-6">
                  <Skeleton className="h-32 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </WalletMoneyContainer>
            </div>
          </div>
        </motion.div>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <Head>
          <title>Deposit Funds - SquarePicks</title>
        </Head>
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



          {/* Content */}
          <div className="flex justify-center mt-16">
            <div className="w-full max-w-lg">
              <WalletMoneyContainer
                title={`$${successAmount} Deposit Successful!`}
                variant="blue"
                className="animate-fadeIn border-green-400/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
              >
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 px-4 sm:px-6">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    <CheckCircle className="h-16 w-16 text-green-400" />
                    <p className="text-white/80">Your deposit has been processed successfully!</p>
                    <p className="text-white/60 text-sm">The funds have been added to your wallet balance.</p>
                    <div className="flex space-x-3 mt-4">
                      <Link
                        href="/wallet"
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-500/20 hover:bg-green-500/30 rounded-md transition-colors duration-200"
                      >
                        View Wallet
                      </Link>
                      <Button
                        onClick={handleBackToForm}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Make Another Deposit
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </WalletMoneyContainer>
            </div>
          </div>
        </motion.div>
        </div>
      </>
    );
  }



  if (selectedAmount && selectedPaymentMethod) {
    return (
      <>
        <Head>
          <title>Deposit Funds - SquarePicks</title>
        </Head>
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



          {/* Content */}
          <div className="flex justify-center mt-16">
            <div className="w-full max-w-lg">
              <WalletMoneyContainer title="Complete Payment" variant="blue" className="animate-fadeIn">
                <div className="p-6 space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">Complete Your Deposit</h2>
                    <p className="text-gray-400">Amount: <span className="font-semibold text-white">${selectedAmount.toFixed(2)}</span></p>
                    <p className="text-gray-400 text-sm">Method: PayPal</p>
                  </div>
                  
                  {/* Back Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleBackToForm}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center space-x-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Change Amount</span>
                    </Button>
                  </div>
                  
                  <PayPalDepositButton
                    amount={selectedAmount}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                  />
                  
                  {error && (
                    <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                </div>
              </WalletMoneyContainer>
            </div>
          </div>
        </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Deposit Funds - SquarePicks</title>
      </Head>
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
        <div className="mb-4 pl-4 sm:pl-6">
          <h1 className="text-3xl font-bold text-text-primary">Deposit Funds</h1>
          <p className="mt-3 text-sm text-gray-300">Add funds to your wallet using PayPal.</p>
        </div>

        {/* Content */}
        <div className="flex justify-center mt-16">
          <div className="w-full max-w-lg">
            <WalletMoneyContainer title="Enter Amount" variant="blue" className="animate-fadeIn">
              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl text-white">Enter Deposit Amount</CardTitle>
                  <CardDescription className="text-gray-400">
                    Choose an amount between ${MIN_DEPOSIT} and ${MAX_DEPOSIT}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={form.handleSubmit(handleAmountSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-white">Amount (USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min={MIN_DEPOSIT}
                          max={MAX_DEPOSIT}
                          placeholder="0.00"
                          className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                          {...form.register('amount')}
                        />
                      </div>
                      {form.formState.errors.amount && (
                        <p className="text-red-400 text-sm">{form.formState.errors.amount.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Continue to Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </WalletMoneyContainer>
          </div>
        </div>
      </motion.div>
      </div>
    </>
  );
} 