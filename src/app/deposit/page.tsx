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
import { StripeDepositButton } from '@/components/ui/StripeDepositButton';
import { useWallet } from '@/hooks/useWallet';
import { ArrowLeft, DollarSign, CheckCircle, AlertCircle, CreditCard, Shield } from 'lucide-react';
import Link from 'next/link';

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | 'stripe' | null>(null);
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

  const handlePaymentMethodSelect = (method: 'paypal' | 'stripe') => {
    setSelectedPaymentMethod(method);
  };

  if (walletLoading) {
    return (
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
              <WalletMoneyContainer variant="blue" className="animate-fadeIn">
                <div className="p-6">
                  <Skeleton className="h-32 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </WalletMoneyContainer>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background-primary text-text-primary p-0 sm:p-0 lg:p-0">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
          {/* Back Button */}
          <div className="mb-3 pl-4 sm:pl-6 mt-3 sm:mt-4">
            <Link href="/wallet" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wallet
            </Link>
          </div>

          {/* Title */}
          <div className="mb-4 pl-4 sm:pl-6">
            <h1 className="text-3xl font-bold text-text-primary">Deposit Funds</h1>
            <p className="mt-3 text-sm text-gray-300">Add funds to your wallet using PayPal or credit/debit card.</p>
          </div>

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
    );
  }

  if (selectedAmount && !selectedPaymentMethod) {
    return (
      <div className="min-h-screen bg-background-primary text-text-primary p-0 sm:p-0 lg:p-0">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
          {/* Back Button */}
          <div className="mb-3 pl-4 sm:pl-6 mt-3 sm:mt-4">
            <Button
              onClick={handleBackToForm}
              variant="ghost"
              className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Amount Selection
            </Button>
          </div>

          {/* Title */}
          <div className="mb-4 pl-4 sm:pl-6">
            <h1 className="text-3xl font-bold text-text-primary">Choose Payment Method</h1>
            <p className="mt-3 text-sm text-gray-300">Select how you'd like to pay ${selectedAmount.toFixed(2)}.</p>
          </div>

          {/* Content */}
          <div className="flex justify-center mt-16">
            <div className="w-full max-w-lg">
              <WalletMoneyContainer variant="blue" className="animate-fadeIn">
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">Select Payment Method</h2>
                    <p className="text-gray-400">Amount: <span className="font-semibold text-white">${selectedAmount.toFixed(2)}</span></p>
                  </div>
                  
                  {/* Payment Method Selection */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* PayPal Option */}
                    <Card 
                      className="cursor-pointer border-2 border-transparent hover:border-blue-500/50 transition-all duration-200 bg-gray-800/50"
                      onClick={() => handlePaymentMethodSelect('paypal')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">P</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold">PayPal</h3>
                            <p className="text-gray-400 text-sm">Fast & Secure • Buyer Protection</p>
                          </div>
                          <Shield className="h-5 w-5 text-green-400" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stripe/Credit Card Option */}
                    <Card 
                      className="cursor-pointer border-2 border-transparent hover:border-purple-500/50 transition-all duration-200 bg-gray-800/50"
                      onClick={() => handlePaymentMethodSelect('stripe')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold">Credit/Debit Card</h3>
                            <p className="text-gray-400 text-sm">Visa • Mastercard • Amex • Discover</p>
                          </div>
                          <Shield className="h-5 w-5 text-green-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Security Notice */}
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">
                      🔒 All payments are secured with SSL encryption and PCI compliance
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

  if (selectedAmount && selectedPaymentMethod) {
    return (
      <div className="min-h-screen bg-background-primary text-text-primary p-0 sm:p-0 lg:p-0">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
          {/* Back Button */}
          <div className="mb-3 pl-4 sm:pl-6 mt-3 sm:mt-4">
            <Button
              onClick={() => setSelectedPaymentMethod(null)}
              variant="ghost"
              className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payment Method
            </Button>
          </div>

          {/* Title */}
          <div className="mb-4 pl-4 sm:pl-6">
            <h1 className="text-3xl font-bold text-text-primary">Complete Payment</h1>
            <p className="mt-3 text-sm text-gray-300">
              Complete your ${selectedAmount.toFixed(2)} deposit using {selectedPaymentMethod === 'paypal' ? 'PayPal' : 'Credit/Debit Card'}.
            </p>
          </div>

          {/* Content */}
          <div className="flex justify-center mt-16">
            <div className="w-full max-w-lg">
              <WalletMoneyContainer variant="blue" className="animate-fadeIn">
                <div className="p-6 space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">Complete Your Deposit</h2>
                    <p className="text-gray-400">Amount: <span className="font-semibold text-white">${selectedAmount.toFixed(2)}</span></p>
                    <p className="text-gray-400 text-sm">Method: {selectedPaymentMethod === 'paypal' ? 'PayPal' : 'Credit/Debit Card'}</p>
                  </div>
                  
                  {selectedPaymentMethod === 'paypal' ? (
                    <PayPalDepositButton
                      amount={selectedAmount}
                      onSuccess={handlePayPalSuccess}
                      onError={handlePayPalError}
                    />
                  ) : (
                    <StripeDepositButton
                      amount={selectedAmount}
                      onSuccess={handlePayPalSuccess}
                      onError={handlePayPalError}
                    />
                  )}
                  
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
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-text-primary p-0 sm:p-0 lg:p-0">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
        {/* Back Button */}
        <div className="mb-3 pl-4 sm:pl-6 mt-3 sm:mt-4">
          <Link href="/wallet" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wallet
          </Link>
        </div>

        {/* Title */}
        <div className="mb-4 pl-4 sm:pl-6">
          <h1 className="text-3xl font-bold text-text-primary">Deposit Funds</h1>
          <p className="mt-3 text-sm text-gray-300">Add funds to your wallet using PayPal or credit/debit card.</p>
        </div>

        {/* Content */}
        <div className="flex justify-center mt-16">
          <div className="w-full max-w-lg">
            <WalletMoneyContainer variant="blue" className="animate-fadeIn">
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
  );
} 