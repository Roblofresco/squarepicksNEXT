'use client'

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
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { useWallet } from '@/hooks/useWallet';
import { ArrowLeft, CreditCard, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const onSubmit = async (data: DepositFormData) => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      const depositAmount = parseFloat(data.amount);
      
      // Use Firebase Functions to create PayPal order
      const functions = getFunctions(app, 'us-east1');
      const createPayPalOrderCallable = httpsCallable(functions, 'createPayPalOrder');
      
      const result = await createPayPalOrderCallable({ 
        amount: depositAmount.toFixed(2), 
        currency: 'USD', 
        intent: 'CAPTURE' 
      });
      
      const order = result.data as any;
      if (!order?.id) throw new Error(order.error || "Failed to create order");
      
      console.log("Created PayPal Order ID:", order.id);
      
      // For now, just show success - in a real implementation, you'd redirect to PayPal
      setSuccessAmount(data.amount);
      setSuccess(true);
      
    } catch (err: any) {
      console.error("Error creating deposit order:", err);
      setError(err.message || "Failed to create deposit order.");
    } finally {
      setIsSubmitting(false);
    }
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
                title={`$${successAmount} Deposit Order Created!`}
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
                    <p className="text-white/80">Your deposit order has been created successfully.</p>
                    <p className="text-white/60 text-sm">You will be redirected to PayPal to complete the payment.</p>
                    <Link
                      href="/wallet"
                      className="mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-500/20 hover:bg-green-500/30 rounded-md transition-colors duration-200"
                    >
                      View Wallet
                    </Link>
                  </motion.div>
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
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                    {error && (
                      <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Creating Order...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Create PayPal Order</span>
                        </div>
                      )}
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